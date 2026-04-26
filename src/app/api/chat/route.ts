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

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message, history = [], chatId, module = 'general', mode = 'expert', userId } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 1. Run embedding + web search in PARALLEL for speed
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

    // 5. Generate structured response
    let { object } = await generateObject({
      model: groq('llama-3.3-70b-versatile'),
      schema: FinPilotResponseSchema,
      system: systemPrompt,
      messages: messages,
      temperature: 0.3,
    });

    // 6. Correction Loop: Verify if confidence is low
    if (object.confidence === 'low') {
      console.log('Low confidence detected, triggering verification loop...');
      const verificationMessages = [
        ...messages,
        { role: 'assistant' as const, content: JSON.stringify(object) },
        { 
          role: 'user' as const, 
          content: `You previously stated your confidence was low. Please double-check your facts against the provided context and correct any inaccuracies. Focus on resolving: ${object.correction_hint}` 
        }
      ];
      
      const retry = await generateObject({
        model: groq('llama-3.3-70b-versatile'),
        schema: FinPilotResponseSchema,
        system: systemPrompt,
        messages: verificationMessages,
        temperature: 0.1, // Lower temperature for more analytical verification
      });
      
      object = retry.object;
    }

    // 6. Save memory in background
    if (userId) {
      // Don't await this so it doesn't block the response
      pushRecentTopic(userId, message).catch(err => console.error('Redis memory error:', err));
    }

    return NextResponse.json(object);

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
