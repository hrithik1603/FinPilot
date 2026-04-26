import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ai } from '@/lib/gemini';
import { groq } from '@/lib/groq';
import { searchWeb } from '@/lib/tavily';

// JSON schema description for the system prompt (Groq uses prompt-based JSON mode)
const jsonSchemaInstructions = `
You MUST respond with valid JSON matching this exact schema:
{
  "title": "string - A concise title for the answer",
  "summary": "string - A 2-3 sentence executive summary",
  "detailed_explanation": ["string array - Each item is one key point or paragraph of the explanation"],
  "example": {
    "description": "string - Description of the example",
    "table_data": [{"column1": "string", "column2": "string", "column3": "string", "column4": "string"}]
  },
  "practical_notes": ["string array - Practical tips, caveats, or compliance notes"],
  "sources": ["string array - Citations or references used. Include URLs from web sources when available."]
}

All fields are required. Use descriptive column headers in table_data (e.g. "Particulars", "Amount", "Debit", "Credit"). 
If no example table is relevant, provide an empty table_data array.
If no sources are found in the context, use your general knowledge references.
`;

export async function POST(req: Request) {
  try {
    const { message, history = [], chatId, module = 'general', mode = 'expert' } = await req.json();

    const modulePrompts: Record<string, string> = {
      general: '',
      accounting: 'Focus specifically on ACCOUNTING topics: journal entries, Ind AS standards, ledger management, audit procedures, and financial statement preparation.',
      reporting: 'Focus specifically on FINANCIAL REPORTING: Ind AS disclosures, annual report preparation, balance sheet analysis, and regulatory filings.',
      laws: 'Focus specifically on LAWS & COMPLIANCE: Companies Act 2013, SEBI regulations, RBI circulars, FEMA, and corporate governance.',
      taxation: 'Focus specifically on TAXATION: Income Tax Act, GST, TDS/TCS, advance tax, transfer pricing, and tax planning.',
      fpa: 'Focus specifically on FP&A: budgeting, forecasting, variance analysis, financial modeling, and business performance metrics.',
      treasury: 'Focus specifically on TREASURY: cash management, liquidity planning, forex management, investment portfolio, and debt management.',
    };

    const modeInstruction = mode === 'standard'
      ? 'Keep your answer BRIEF and CONCISE. Use short bullet points. Limit detailed_explanation to 2-3 items max. Skip the example table if not essential.'
      : 'Provide a COMPREHENSIVE, DETAILED answer with full citations, examples, and practical notes.';

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

    // 3. Construct the system prompt with both contexts
    const systemPrompt = `
You are FinPilot, an expert AI finance assistant with deep expertise in INDIAN accounting, taxation, FP&A, Treasury, and corporate laws.

${modulePrompts[module] || ''}

${modeInstruction}

IMPORTANT — INDIA-FIRST CONTEXT:
- ALWAYS default to the INDIAN context unless the user explicitly asks about another country.
- For accounting: use Ind AS (Indian Accounting Standards), Companies Act 2013, and Indian GAAP.
- For taxation: use Indian Income Tax Act, GST, TDS, and SEBI regulations.
- For markets: refer to NSE, BSE, Nifty 50, Sensex, RBI policies, and Indian economic data.
- For corporate law: reference Companies Act 2013, SEBI guidelines, RBI circulars, and MCA notifications.
- For news: prioritize Indian financial news, Indian markets, and Indian economy.
- You may mention international standards (IFRS, US GAAP, global markets) as supplementary context ONLY when it adds value or the user specifically asks.

Answer the user's query using ALL provided context — both uploaded documents and live web results.

PRIORITY ORDER:
1. User-uploaded documents (source_type: "user") — highest priority
2. Live web search results — use for real-time data (prices, news, current rates)
3. Your general knowledge — use only to fill gaps

Rules:
- Always cite your sources. For web results, include the URL.
- When providing market data or prices, clearly state the date/time if available.
- Maintain a highly professional, finance-grade tone.
- Do NOT hallucinate. If you don't know, say so.
- All currency references should default to INR (₹) unless otherwise specified.

${docContext ? `UPLOADED DOCUMENTS:\n${docContext}` : 'No uploaded documents matched this query.'}

${webContext ? `LIVE WEB SEARCH RESULTS:\n${webContext}` : 'No web search results available.'}

${jsonSchemaInstructions}
`;

    // 4. Build messages array for Groq (OpenAI-compatible format)
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      })),
      { role: 'user' as const, content: message },
    ];

    // 5. Generate structured response using Groq (Llama 3.3 70B)
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const aiMessageContent = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(aiMessageContent || "{}");

    return NextResponse.json(parsedResponse);

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
