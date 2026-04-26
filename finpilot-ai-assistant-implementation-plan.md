# FinPilot AI Assistant Implementation Plan

This document is a build-ready implementation plan for upgrading FinPilot into a controllable, self-correcting, and highly personalized AI assistant.

The implementation is based on FinPilot's current architecture: a Next.js 16 + React 19 app with Clerk authentication, Supabase, Groq SDK, Google Gemini, Tavily, Upstash Redis, typed modules and modes, and a structured assistant response object in the frontend.[cite:9][cite:11]

## Objectives

The assistant should support four core capabilities:

- Tight control over output structure and tone.
- Better understanding of what the product owner expects as output.
- Correction and re-generation flows when an answer is wrong.
- Strong user-context awareness for personalization.

FinPilot already has a solid foundation for this because the app includes typed modules like `general`, `taxation`, `treasury`, and `fpa`, plus `standard` and `expert` modes in the main app state.[cite:9]

## Current Foundation

The current frontend already stores `selectedModule`, `mode`, `messages`, `chatHistory`, and `lastResponse`, which makes it possible to inject domain instructions dynamically into prompts and control how the assistant behaves per session.[cite:9]

The app also defines a `StructuredResponse` object with fields such as `title`, `summary`, `detailed_explanation`, `example`, `practical_notes`, and `sources`, which is an excellent starting point for strict response shaping.[cite:9]

The backend stack includes Clerk for user identity, Supabase for persistence, Upstash Redis for fast memory/state patterns, and multiple model/data integrations including Groq, Gemini, Tavily, and pdf-parse.[cite:11]

## Target Architecture

The upgraded assistant should be built on four implementation layers:

1. Prompt control layer.
2. Output schema enforcement layer.
3. Correction and verification layer.
4. Personalization and memory layer.

Each layer should be implemented independently so that the product can improve progressively without needing a full rewrite.

## Prompt Control Layer

### Goal

The assistant must understand exactly what kind of answer to give before it responds. This is done through dynamic system prompts composed from module, mode, and user context.[cite:9]

### Implementation

Create a prompt builder utility such as:

```ts
// src/lib/ai/build-system-prompt.ts
export type Module = 'general' | 'accounting' | 'reporting' | 'laws' | 'taxation' | 'fpa' | 'treasury';
export type Mode = 'standard' | 'expert';

export type UserContext = {
  name?: string;
  role?: 'CFO' | 'accountant' | 'student' | 'analyst' | 'founder';
  industry?: string;
  companySize?: 'startup' | 'sme' | 'enterprise';
  country?: string;
  preferredDetailLevel?: 'brief' | 'detailed' | 'expert';
  frequentModules?: Module[];
  recentTopics?: string[];
};

export function buildSystemPrompt(params: {
  module: Module;
  mode: Mode;
  userContext?: UserContext;
}) {
  const { module, mode, userContext } = params;

  const modulePrompts: Record<Module, string> = {
    general: `You are FinPilot, an AI finance assistant for business, accounting, reporting and advisory work.`,
    accounting: `You are FinPilot Accounting, specialized in journal entries, ledgers, reconciliations, financial statements, and accounting treatment.`,
    reporting: `You are FinPilot Reporting, specialized in management reporting, MIS structure, KPI explanations, and analytical summaries.`,
    laws: `You are FinPilot Laws, specialized in finance-related legal and compliance topics.`,
    taxation: `You are FinPilot Taxation, specialized in Indian taxation including GST, TDS, income tax, compliance timelines, and practical interpretation.`,
    fpa: `You are FinPilot FP&A, specialized in budgeting, forecasting, variance analysis, scenario planning, and business performance planning.`,
    treasury: `You are FinPilot Treasury, specialized in cash flow, working capital, liquidity planning, forex exposure, and treasury operations.`,
  };

  const modePrompt = mode === 'expert'
    ? `Respond with detailed reasoning, domain terminology, assumptions, edge cases, and practical implementation notes.`
    : `Respond in plain language, with clarity first, and avoid unnecessary jargon.`;

  const contextPrompt = userContext
    ? `\nUser context:\n- Name: ${userContext.name ?? 'Unknown'}\n- Role: ${userContext.role ?? 'Unknown'}\n- Industry: ${userContext.industry ?? 'Unknown'}\n- Company size: ${userContext.companySize ?? 'Unknown'}\n- Country: ${userContext.country ?? 'Unknown'}\n- Preferred detail level: ${userContext.preferredDetailLevel ?? 'Unknown'}\n- Frequent modules: ${(userContext.frequentModules ?? []).join(', ') || 'None'}\n- Recent topics: ${(userContext.recentTopics ?? []).join(', ') || 'None'}\nTailor the answer to this context.`
    : '';

  return `
${modulePrompts[module]}

${modePrompt}

Always return output that matches the required response schema.
Stay within the selected module unless the user explicitly asks to switch context.
If the answer is uncertain, state uncertainty clearly and lower confidence.
If the query is out of scope, return a valid structured refusal.
${contextPrompt}
  `.trim();
}
```

### Rules for the system prompt

Every system prompt should contain these sections in this order:

1. Identity.
2. Domain boundaries.
3. Output contract.
4. Tone/detail instructions.
5. Handling uncertainty.
6. Personalization context.
7. Refusal behavior.

### Why this matters

FinPilot already stores `selectedModule` and `mode` in app state, so the assistant can be made meaningfully different per module without changing the UI model.[cite:9]

## Output Schema Enforcement Layer

### Goal

The model should not be allowed to return messy or unpredictable text. The output must always match a strict schema.

### Recommended approach

Move from raw text generation to structured object generation wherever possible. Vercel AI SDK supports tool and generation workflows, and structured generation patterns can be layered on top of the same app architecture used for model calls.[cite:12]

### Schema definition

Create a schema file such as:

```ts
// src/lib/ai/schemas.ts
import { z } from 'zod';

export const FinPilotResponseSchema = z.object({
  title: z.string(),
  summary: z.string().min(1).max(400),
  detailed_explanation: z.array(z.string()).min(1).max(12),
  example: z.object({
    description: z.string(),
    table_data: z.array(z.record(z.string(), z.any()))
  }).optional(),
  practical_notes: z.array(z.string()).min(0).max(10),
  sources: z.array(z.string()).min(0).max(10),
  confidence: z.enum(['high', 'medium', 'low']),
  needs_clarification: z.boolean().default(false),
  out_of_scope: z.boolean().default(false),
  correction_hint: z.string().optional()
});

export type FinPilotResponse = z.infer<typeof FinPilotResponseSchema>;
```

### Response generation flow

```ts
// src/lib/ai/generate-structured-response.ts
import { generateObject } from 'ai';
import { FinPilotResponseSchema } from './schemas';
import { buildSystemPrompt } from './build-system-prompt';

export async function generateStructuredResponse(params: {
  model: any;
  userMessage: string;
  module: Module;
  mode: Mode;
  userContext?: UserContext;
}) {
  const { object } = await generateObject({
    model: params.model,
    schema: FinPilotResponseSchema,
    system: buildSystemPrompt({
      module: params.module,
      mode: params.mode,
      userContext: params.userContext,
    }),
    prompt: params.userMessage,
  });

  return object;
}
```

### Frontend type update

Replace the current frontend response type with the new schema-compatible one, because the existing `StructuredResponse` type does not yet include `confidence`, `needs_clarification`, `out_of_scope`, or `correction_hint`.[cite:9]

## Correction and Verification Layer

### Goal

If the assistant gives a wrong answer, the product should support both automatic correction and user-driven correction.

### Correction Pattern 1: Validation retry

If generation fails schema validation, retry with a correction prompt.

```ts
// src/lib/ai/retry-on-invalid.ts
export async function generateWithRetry(run: () => Promise<any>, fix: (bad: any, error: string) => Promise<any>) {
  try {
    return await run();
  } catch (err: any) {
    return await fix(null, err.message);
  }
}
```

A better version is to pass the invalid raw result back to the model:

```ts
const repairPrompt = `
Your previous response was invalid for the required schema.
Fix the response and return only valid structured output.
`;
```

### Correction Pattern 2: User-triggered correction

Add a correction action in the chat UI:

- Wrong answer.
- Too technical.
- Too shallow.
- Reframe for my role.
- Add example.

This should append an internal correction instruction and re-run the same query.

```ts
// example internal correction message
const correctionInstruction = `
The previous answer did not meet expectations.
Feedback from user: ${feedback}
Regenerate the answer using the same topic, but correct the issues and return a full valid structured response.
`;
```

### Correction Pattern 3: Confidence-driven warnings

The assistant should always return a `confidence` field. If confidence is `low`, the UI should display a warning like:

> This answer may require verification before use in a compliance, tax, or legal workflow.

This is especially important for taxation and laws modules, where wrong advice can create risk.[cite:9]

### Correction Pattern 4: Compare answers

For important answers, run a second pass verification model using a cheaper validator model or an alternate provider. FinPilot already includes Groq and Gemini dependencies, so the app can adopt a “generator + verifier” pattern without major provider expansion.[cite:11]

Suggested pattern:

1. Generate with primary model.
2. Verify with secondary model.
3. If mismatch is significant, either revise automatically or flag the answer for review.

## Personalization and User Context Layer

### Goal

The assistant should remember who the user is, what kind of work they do, how much detail they prefer, and what they frequently ask.

### User context schema

Create a persistent user context table in Supabase.

```sql
create table if not exists user_context (
  user_id text primary key,
  name text,
  role text,
  industry text,
  company_size text,
  country text default 'India',
  preferred_detail_level text default 'detailed',
  preferred_output_style text default 'structured',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

Create a second table for evolving memory:

```sql
create table if not exists user_context_topics (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  topic text not null,
  module text,
  weight numeric default 1,
  last_seen_at timestamptz default now()
);
```

### Context object in code

```ts
// src/lib/user/get-user-context.ts
export async function getUserContext(userId: string) {
  // load from Supabase
}
```

### Prompt injection

Every AI request should include the user context summary inside the system prompt, because personalization only works when the model sees context at answer time.[cite:12]

### Progressive context collection

Do not ask users to fill a long form. Instead, collect context progressively in-chat and in UI micro-prompts.

Suggested prompts:

- “What best describes your role: student, accountant, analyst, founder, CFO?”
- “Do you prefer quick answers or detailed expert answers?”
- “Which region’s tax/compliance rules should be preferred by default?”

Store the answers in Supabase and reuse them in later prompts.

## Memory Layer with Redis

### Goal

The assistant should remember recent topics and use them to continue conversations naturally.

### Why Redis

FinPilot already depends on Upstash Redis, making it a good fit for short-term memory, rolling summaries, and session context retrieval.[cite:11]

### What to store in Redis

Per user, keep:

- Last 20 topics.
- Last 10 assistant summaries.
- Current active module.
- Last correction feedback.
- Session-level preferences not yet committed to Supabase.

### Example structure

```ts
// src/lib/memory/recent-topics.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function pushRecentTopic(userId: string, topic: string) {
  const key = `user:${userId}:topics`;
  await redis.lpush(key, topic);
  await redis.ltrim(key, 0, 19);
}

export async function getRecentTopics(userId: string) {
  return await redis.lrange(`user:${userId}:topics`, 0, 9);
}
```

### Conversation summarization

Every 5 to 10 messages, generate a short rolling conversation summary and store it. This prevents token bloat while retaining context.

## API Route Refactor Plan

FinPilot already uses `/api/chat`, `/api/chats`, `/api/messages`, and `/api/upload`, so the implementation should extend the current API structure instead of replacing it.[cite:10]

### Proposed new internal flow for `/api/chat`

1. Authenticate user with Clerk.
2. Load persistent user context from Supabase.
3. Load recent memory from Redis.
4. Build system prompt from module, mode, and context.
5. Generate structured response using schema enforcement.
6. Run optional verifier pass.
7. Save user message and assistant response.
8. Update topic memory.
9. Return structured response.

### Suggested API file split

```text
src/lib/ai/
  build-system-prompt.ts
  schemas.ts
  generate-structured-response.ts
  verify-response.ts
  repair-response.ts
src/lib/user/
  get-user-context.ts
  update-user-context.ts
src/lib/memory/
  recent-topics.ts
  summarize-session.ts
src/app/api/chat/route.ts
```

## Frontend Changes

### Update message type

The current `Message` type allows `string | StructuredResponse`, which is good, but the response structure should now include confidence, correction metadata, and personalization-aware signals.[cite:9]

Suggested type:

```ts
export type StructuredResponse = {
  title: string;
  summary: string;
  detailed_explanation: string[];
  example?: {
    description: string;
    table_data: any[];
  };
  practical_notes: string[];
  sources: string[];
  confidence: 'high' | 'medium' | 'low';
  needs_clarification?: boolean;
  out_of_scope?: boolean;
  correction_hint?: string;
};
```

### Add UI controls

Add the following controls to the assistant message component:

- Regenerate.
- Wrong answer.
- Simplify.
- Go deeper.
- Make this practical.
- Tailor to my role.

These should send correction instructions rather than raw new queries.

### Add context onboarding UI

Possible places:

- First-run modal after login.
- Smart follow-up chip suggestions in chat.
- Settings page under Profile or Preferences.

### Add trust signals

For each response card, show:

- Confidence badge.
- Module badge.
- Whether the answer used user context.
- Optional “verify answer” action for critical modules.

## Recommended Database Additions

### Suggested `messages` enhancement

If the current `messages` table stores generic content blobs, add metadata columns for better analytics and correction handling:

```sql
alter table messages
add column if not exists confidence text,
add column if not exists module text,
add column if not exists mode text,
add column if not exists correction_of uuid,
add column if not exists is_regenerated boolean default false;
```

### Suggested audit log table

```sql
create table if not exists answer_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  message_id text not null,
  feedback_type text not null,
  feedback_text text,
  created_at timestamptz default now()
);
```

This allows the product to learn what kinds of answers fail most often.

## Model Orchestration Strategy

### Suggested provider roles

FinPilot currently includes Groq SDK, Gemini, and Tavily in dependencies, so orchestration can be split by responsibility instead of using one model for everything.[cite:11]

Suggested routing:

- Groq: primary fast response generation.
- Gemini: verifier or deep reasoning fallback.
- Tavily: web-backed retrieval when current information is needed.
- Redis: short-term memory.
- Supabase: long-term user profile and chat persistence.

### Model selection policy

Use rules like:

- `standard` mode → faster, cheaper generation path.
- `expert` mode → stronger reasoning or two-pass generation.
- `laws` and `taxation` → require verification pass if confidence is below high.
- retrieval-required questions → route through web-backed enrichment.

## Output Manipulation Patterns

### Pattern 1: Reframe without changing topic

If the answer is technically correct but not useful, re-run with transformation instructions:

- Explain for a founder.
- Explain for a student.
- Turn into steps.
- Convert to table.
- Add examples.
- Make concise.

### Pattern 2: Correct factual issues

When the answer is wrong, use a structured correction prompt:

```text
The previous answer is suspected to be wrong.
Re-evaluate the problem carefully.
Identify possible incorrect assumptions.
Return a corrected structured response.
If uncertainty remains, reduce confidence and say what must be verified.
```

### Pattern 3: Ask clarifying questions only when needed

If the user asks something ambiguous, the assistant should set `needs_clarification = true` and return a response that asks the minimum necessary follow-up instead of hallucinating an answer.

## Security and Privacy Notes

Because FinPilot may handle sensitive financial or business prompts, prompt handling should be privacy-aware. Vercel AI Gateway supports disabling prompt training through provider options, and can also attach user IDs or tags to requests for better request tracking.[cite:12]

Suggested implementation idea:

```ts
providerOptions: {
  gateway: {
    user: userId,
    tags: [module, mode],
    disallowPromptTraining: true,
  }
}
```

For large recurring system prompts or repeated context blocks, prompt caching patterns can also reduce repeated prompt cost in suitable model/provider flows.[cite:12]

## Rollout Plan

### Phase 1: Response control

Implement first:

- Prompt builder.
- Module-specific system prompts.
- Structured schema with confidence field.
- `/api/chat` refactor to generate structured responses.

### Phase 2: Personalization

Implement next:

- `user_context` table.
- context onboarding.
- prompt injection of user role, industry, and detail level.
- recent topic memory in Redis.

### Phase 3: Correction loops

Implement next:

- wrong answer feedback.
- regenerate with instruction.
- low-confidence warnings.
- optional verifier model pass.

### Phase 4: Product intelligence

Implement last:

- answer feedback analytics.
- auto-detect high-failure prompts.
- better routing per module.
- rolling session summarization.

## Acceptance Criteria

The implementation should be considered successful when all of the following are true:

- Every assistant response matches the required schema.
- The system prompt changes meaningfully by module and mode.
- The assistant can regenerate answers using explicit correction instructions.
- User profile and recent-topic memory influence answers consistently.
- The UI shows confidence and correction controls.
- Wrong or low-confidence answers are visibly handled instead of silently failing.
- The backend can trace message feedback and regenerated responses.

## Recommended File Checklist

Create or update these files:

```text
src/lib/ai/build-system-prompt.ts
src/lib/ai/schemas.ts
src/lib/ai/generate-structured-response.ts
src/lib/ai/verify-response.ts
src/lib/ai/repair-response.ts
src/lib/user/get-user-context.ts
src/lib/user/update-user-context.ts
src/lib/memory/recent-topics.ts
src/lib/memory/summarize-session.ts
src/app/api/chat/route.ts
src/components/chat/AssistantMessageActions.tsx
src/components/chat/ConfidenceBadge.tsx
src/components/onboarding/UserContextPrompt.tsx
```

## Practical Notes

- Do not try to train the model first; fix prompt architecture and schema enforcement first.
- Personalization should be based on explicit stored user context plus recent memory, not guesswork.
- For finance use cases, confidence and correction controls matter as much as answer quality.
- Retrieval and verification should be applied selectively for cost control.
- Keep long-term memory in Supabase and short-term conversational memory in Redis.

## Final Recommendation

The best implementation path for FinPilot is not “train a custom model” first. The fastest and most controllable path is:

1. Strict system prompts.
2. Structured output schema.
3. Correction loop.
4. User context memory.
5. Optional verifier layer.

This approach fits FinPilot’s existing architecture extremely well because the app already has structured frontend response handling, user identity, persistence, Redis capability, module selection, and multiple model integrations ready to build on.[cite:9][cite:10][cite:11]
