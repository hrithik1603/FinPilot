import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ai } from '@/lib/gemini';
import { searchWeb } from '@/lib/tavily';
import { generateObject } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { FinPilotResponseSchema } from '@/lib/ai/schemas';
import { buildSystemPrompt } from '@/lib/ai/build-system-prompt';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message, history = [], chatId, module = 'general', mode = 'expert' } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 1. Run embedding + web search in PARALLEL for speed
    const [queryEmbeddingRes, webContext] = await Promise.all([
      ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: message,
        config: { outputDimensionality: 768 }
      }),
      searchWeb(message),
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
    const { object } = await generateObject({
      model: groq('llama-3.3-70b-versatile'),
      schema: FinPilotResponseSchema,
      system: systemPrompt,
      messages: messages,
      temperature: 0.3,
    });

    return NextResponse.json(object);

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
