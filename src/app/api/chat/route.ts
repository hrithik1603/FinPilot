import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ai } from '@/lib/gemini';
import { searchWeb } from '@/lib/tavily';
import { generateObject } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { FinPilotResponseSchema } from '@/lib/ai/schemas';
import { buildSystemPrompt } from '@/lib/ai/build-system-prompt';
import { getUserContext } from '@/lib/user/context';
import { getRecentTopics, pushRecentTopic } from '@/lib/memory/recent-topics';
import { groq as groqSdk } from '@/lib/groq';

const groqProvider = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Explicit JSON schema for the fallback path (model needs this to produce correct structure)
const RESPONSE_SCHEMA_PROMPT = `
You MUST respond ONLY with valid JSON matching this EXACT structure. ALL fields are required — do not omit any.

{
  "title": "A descriptive title for the answer (string, required)",
  "summary": "A comprehensive executive summary of the answer (string, required, provide at least 2-3 detailed paragraphs if the topic is complex)",
  "detailed_explanation": [
    "Comprehensive point 1 with data and context",
    "Detailed point 2 explaining the 'why' and 'how'",
    "Point 3 covering edge cases or regulatory specifics",
    "..."
  ],
  "example": { "description": "A practical scenario or calculation", "table_data": [{"Column1": "Value1", "Column2": "Value2"}] },
  "practical_notes": ["Actionable step 1", "Compliance tip 2", "Strategic advice 3"],
  "sources": ["Full Source Name 1", "Official URL 2", "..."],
  "confidence": "high" | "medium" | "low",
  "needs_clarification": false,
  "out_of_scope": false,
  "correction_hint": ""
}

CRITICAL RULES:
- "detailed_explanation" SHOULD be thorough. Aim for 4-7 detailed items for complex queries.
- "summary" MUST be substantial. Do not use placeholders. Explain the core logic here.
- "title" MUST be professional and descriptive.
- Return ONLY the JSON object. No markdown, no code fences, no explanation outside the JSON.`;

// Fallback: use the raw Groq SDK with JSON mode if generateObject fails
async function fallbackGroqChat(systemPrompt: string, messages: Array<{role: string; content: string}>) {
  console.log('Using fallback Groq SDK path for structured output');
  const groqMessages = [
    { role: 'system' as const, content: systemPrompt + '\n\n' + RESPONSE_SCHEMA_PROMPT },
    ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];
  const completion = await groqSdk.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: groqMessages,
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const raw = completion.choices[0].message.content;
  console.log('Fallback raw response length:', raw?.length || 0);
  const parsed = JSON.parse(raw || '{}');

  // Fill in defaults for any missing fields
  return {
    title: parsed.title || 'FinPilot Response',
    summary: parsed.summary || 'No summary was generated. Please try again.',
    detailed_explanation: Array.isArray(parsed.detailed_explanation) && parsed.detailed_explanation.length > 0
      ? parsed.detailed_explanation
      : ['The AI generated a response but the detailed explanation was not properly formatted. Please try rephrasing your question.'],
    example: parsed.example && typeof parsed.example === 'object'
      ? { description: parsed.example.description || '', table_data: Array.isArray(parsed.example.table_data) ? parsed.example.table_data : [] }
      : { description: '', table_data: [] },
    practical_notes: Array.isArray(parsed.practical_notes) ? parsed.practical_notes : [],
    sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium',
    needs_clarification: parsed.needs_clarification === true,
    out_of_scope: parsed.out_of_scope === true,
    correction_hint: parsed.correction_hint || '',
  };
}

export async function POST(req: Request) {
  try {
    const { message, history = [], chatId, module = 'general', mode = 'expert', userId } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 1. Run embedding + web search + user context in PARALLEL for speed
    const [queryEmbeddingRes, webContext, userContext, recentTopics] = await Promise.all([
      ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: message,
        config: { outputDimensionality: 768 }
      }),
      searchWeb(message),
      userId ? getUserContext(userId) : Promise.resolve(null),
      userId ? getRecentTopics(userId) : Promise.resolve([]),
    ]);

    const queryEmbedding = queryEmbeddingRes.embeddings![0].values;

    // 2. Retrieve relevant context from Supabase pgvector
    const { data: documents, error: matchError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 5,
    });

    if (matchError) {
      console.error('Vector search error:', matchError);
    }

    // Build document context
    const docContext = documents
      ?.map((doc: any) => `Source: ${doc.title} (${doc.source_type})\nContent: ${doc.content}`)
      .join('\n\n') || '';

    // 3. Build system prompt
    const systemPrompt = buildSystemPrompt({
      module,
      mode,
      userContext: userContext ? { ...userContext, recentTopics } : undefined,
      docContext,
      webContext
    });

    // 4. Build messages array
    const messages = [
      ...history.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      })),
      { role: 'user' as const, content: message },
    ];

    // 5. Generate structured response — try AI SDK first, fall back to raw Groq
    let result: any;
    try {
      const { object } = await generateObject({
        model: groqProvider('llama-3.3-70b-versatile'),
        schema: FinPilotResponseSchema,
        system: systemPrompt,
        messages: messages,
        temperature: 0.3,
      });
      console.log('generateObject succeeded');
      result = object;
    } catch (genErr: any) {
      console.warn('generateObject failed, falling back to raw Groq SDK:', genErr.message);
      result = await fallbackGroqChat(systemPrompt, messages);
    }

    // 6. Correction Loop: Verify if confidence is low
    if (result.confidence === 'low' && result.correction_hint) {
      console.log('Low confidence detected, triggering verification loop...');
      try {
        const verificationMessages = [
          ...messages,
          { role: 'assistant' as const, content: JSON.stringify(result) },
          {
            role: 'user' as const,
            content: `You previously stated your confidence was low. Please double-check your facts against the provided context and correct any inaccuracies. Focus on resolving: ${result.correction_hint}`
          }
        ];

        try {
          const retry = await generateObject({
            model: groqProvider('llama-3.3-70b-versatile'),
            schema: FinPilotResponseSchema,
            system: systemPrompt,
            messages: verificationMessages,
            temperature: 0.1,
          });
          result = retry.object;
          console.log('Verification loop succeeded');
        } catch (retryGenErr: any) {
          console.warn('Verification generateObject failed, trying fallback:', retryGenErr.message);
          result = await fallbackGroqChat(systemPrompt, verificationMessages);
        }
      } catch (retryErr: any) {
        console.warn('Verification retry failed completely, using original result:', retryErr.message);
        // Keep the original low-confidence result rather than crashing
      }
    }

    // 7. Save memory in background
    if (userId) {
      pushRecentTopic(userId, message).catch(err => console.error('Redis memory error:', err));
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
