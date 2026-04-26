import { NextResponse } from 'next/server';
import { searchWeb } from '@/lib/tavily';
import { groq } from '@/lib/groq';
import { redis } from '@/lib/upstash';
import type { BriefingData } from '@/types/briefing';

const BRIEFING_SYSTEM_PROMPT = `You are FinPilotX's Daily Briefing engine. Generate a structured daily financial briefing for an Indian finance professional.
Output must be valid JSON matching EXACTLY this structure. Do NOT add any fields or omit any required fields.

{
  "generated_at": "ISO timestamp",
  "market_sentiment": "bullish" | "bearish" | "neutral" | "volatile",
  "headline": "One sharp sentence summarising today's most important financial development (max 15 words)",
  "sections": [
    {
      "id": "markets",
      "title": "Indian Markets",
      "icon": "TrendingUp",
      "summary": "2-3 sentences on NIFTY, SENSEX, sectoral moves, FII/DII activity",
      "data_points": [
        { "label": "NIFTY 50", "value": "24832", "change": "+0.42%", "direction": "up" },
        { "label": "SENSEX", "value": "81547", "change": "+0.38%", "direction": "up" },
        { "label": "Bank NIFTY", "value": "52314", "change": "-0.12%", "direction": "down" }
      ]
    },
    {
      "id": "macro",
      "title": "Macro & Policy",
      "icon": "Landmark",
      "summary": "RBI updates, government policy, inflation data, or credit policy changes relevant today"
    },
    {
      "id": "global",
      "title": "Global Pulse",
      "icon": "Globe",
      "summary": "US markets, Fed stance, crude oil price, DXY, gold — in 2-3 sentences",
      "data_points": [
        { "label": "Crude (Brent)", "value": "$83.2", "change": "-0.8%", "direction": "down" },
        { "label": "Gold", "value": "$2341", "change": "+0.3%", "direction": "up" },
        { "label": "USD/INR", "value": "83.47", "change": "+0.1%", "direction": "up" }
      ]
    },
    {
      "id": "tax_compliance",
      "title": "Tax & Compliance Today",
      "icon": "CalendarClock",
      "summary": "Any ITR, GST, TDS, or ROC deadlines falling today or within 7 days. If none, say so clearly.",
      "upcoming_deadlines": [
        { "date": "30 Apr 2026", "label": "TDS Payment — March Quarter", "days_left": 3, "urgency": "high" }
      ]
    },
    {
      "id": "watchlist",
      "title": "Sector Spotlight",
      "icon": "Zap",
      "summary": "One sector that deserves attention today and why — specific, not generic."
    }
  ],
  "sources": ["Economic Times", "RBI Notifications", "NSE India", "BSE India"]
}

Use REAL current data from the provided web search context. All currency references default to INR unless specified. Do not fabricate data — if you don't know a value, use "--" as the value.`;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'anon';
    const force = searchParams.get('force') === 'true';
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `briefing:${userId}:${today}`;

    // 1. Check Redis cache
    if (!force && typeof redis.get === 'function') {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
          return NextResponse.json({
            data,
            cached: true,
            cached_at: data.generated_at,
          });
        }
      } catch (cacheErr) {
        console.warn('Redis cache read failed:', cacheErr);
      }
    }

    // 2. Fetch real-time context via Tavily
    const searches = await Promise.all([
      searchWeb('Indian stock market summary today NIFTY SENSEX'),
      searchWeb('RBI news India today monetary policy'),
      searchWeb('upcoming GST TDS tax deadline India'),
    ]);

    const webContext = searches.filter(Boolean).join('\n\n---\n\n');

    // 3. Call Groq for structured briefing
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: BRIEFING_SYSTEM_PROMPT },
        { role: 'user', content: `Generate today's daily financial briefing based on this live data:\n\n${webContext}\n\nToday's date: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const raw = completion.choices[0].message.content;
    const briefing: BriefingData = JSON.parse(raw || '{}');
    briefing.generated_at = new Date().toISOString();

    // 4. Cache to Redis (30 min TTL)
    if (typeof redis.set === 'function') {
      try {
        await redis.set(cacheKey, JSON.stringify(briefing), { ex: 1800 });
      } catch (cacheErr) {
        console.warn('Redis cache write failed:', cacheErr);
      }
    }

    return NextResponse.json({ data: briefing, cached: false });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Briefing API Error:', message);
    return NextResponse.json({ error: true, message }, { status: 500 });
  }
}
