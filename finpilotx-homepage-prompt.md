# FinPilotX — Home Dashboard Redesign Prompt
> Implementation prompt for Antigravity. Rebuild the `/` (Home Dashboard) page of FinPilotX from scratch using this spec. Do not deviate from the layout, content, or interaction details described here.

---

## 1. Context & Goal

FinPilotX is an AI-powered financial intelligence assistant for Indian finance professionals, CAs, CFOs, and advanced retail investors. The Home Dashboard is the **first screen** a logged-in user sees. It must:

- Orient the user instantly (what day, what's happening in markets today)
- Surface AI-generated financial intelligence without requiring the user to ask
- Provide fast-access shortcuts into the most-used modules
- Feel like a **professional Bloomberg-meets-Linear** product — dense but clean, dark by default, zero decorative noise

The current home page (screenshot provided) has the right structure but is **visually hollow** — the Daily Financial Briefing section shows only "Response" as placeholder text, the quick-action cards have no data, and the layout is underutilising the available space. This redesign fixes all of that.

---

## 2. Tech Stack (Do Not Change)

- **Framework:** Next.js (App Router) + React 19
- **Auth:** Clerk (user object available via `useUser()`)
- **AI:** Groq SDK (primary LLM) + Google Gemini (structured output)
- **Search/News:** Tavily API
- **Cache:** Upstash Redis (cache briefing for 30 min per user)
- **Styling:** Tailwind CSS v3 (existing setup) — extend with CSS variables where needed
- **Icons:** Lucide React (already installed)
- **Package name:** rename `"name": "tmp_app"` → `"finpilotx"` in `package.json`

---

## 3. Layout Structure

The page uses the existing shell: `<Sidebar>` (left, 220px) + `<Topbar>` (top, 56px) + `<main>` (scrollable content area). Do not modify the shell. Only rebuild the content inside `<main>`.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ TOPBAR: Module | Jurisdiction | Mode dropdowns ── Upload Docs | Bell | ☀ │
├──────────┬───────────────────────────────────────────────────────────────┤
│          │  GREETING ROW                                                 │
│ SIDEBAR  │  ──────────────────────────────────────────────────────────  │
│          │  QUICK-ACTION STRIP (5 cards, horizontal scroll on mobile)    │
│  Chat    │  ──────────────────────────────────────────────────────────  │
│  History │  DAILY BRIEFING CARD (full width, AI-generated content)       │
│          │  ──────────────────────────────────────────────────────────  │
│          │  BOTTOM ROW: Market Pulse (left 60%) | Deadlines (right 40%) │
└──────────┴───────────────────────────────────────────────────────────────┘
```

---

## 4. Section-by-Section Specification

### 4.1 Greeting Row

**Location:** Top of `<main>`, below topbar padding.

**Content:**
- Left: Greeting text
  - Line 1 (large, semibold): `Good [Morning/Afternoon/Evening], {firstName}` — derive from `useUser().user.firstName` and current hour
  - Line 2 (small, muted): Full date formatted as `Monday, 27 April 2026` + a live clock that ticks every second (`HH:MM:SS IST`)
- Right: Two small status badges side by side:
  - 🟢 `Markets Open` or 🔴 `Markets Closed` — based on IST time (NSE: Mon–Fri 09:15–15:30 IST)
  - `NIFTY 50  ▲ +0.42%` — fetched from Tavily or a free API; show skeleton shimmer while loading, fallback to `--` if unavailable

**Typography:**
- Greeting: `text-2xl font-semibold` (capped — this is a web app)
- Date/time: `text-sm text-muted-foreground font-mono`
- Badges: `text-xs font-medium` with pill shape, green/red background at 15% opacity with matching text color

---

### 4.2 Quick-Action Strip

**Location:** Below greeting row, above briefing card.

**Layout:** 5 cards in a single horizontal row. Each card: equal width (`flex-1`), min-width 160px, horizontal scroll on mobile with `overflow-x-auto` and scroll snap.

**Cards (left to right):**

| # | Icon (Lucide) | Title | Subtitle | On Click |
|---|---|---|---|---|
| 1 | `TrendingUp` | Today's Market | NIFTY · SENSEX · ₹/$ | Opens market detail panel or routes to `/chat?prompt=Give+me+today+market+summary` |
| 2 | `Landmark` | RBI Policy | Latest circular | Routes to `/chat?prompt=Latest+RBI+policy+update` |
| 3 | `Globe` | Global Markets | DOW · NASDAQ · Gold | Routes to `/chat?prompt=Global+markets+overview+today` |
| 4 | `CalendarClock` | Tax Deadlines | Next: {next deadline} | Routes to `/chat?prompt=Upcoming+Indian+tax+deadlines` |
| 5 | `FileText` | GST Updates | Latest notifications | Routes to `/chat?prompt=Latest+GST+notifications+India` |

**Card design rules:**
- Background: `bg-surface` (one step above page background)
- Border: `1px solid` with alpha-blended border (`border-white/10` in dark mode)
- Hover: `bg-surface-offset` + `shadow-md` transition (180ms ease)
- Active: slight scale down `scale-[0.98]`
- Icon: 18px, `text-primary` color, **no background circle** (avoid the colored-circle anti-pattern)
- Title: `text-sm font-medium`
- Subtitle: `text-xs text-muted-foreground` — show real dynamic data where possible, else static label
- Radius: `rounded-xl`
- Padding: `p-4`
- **No colored left border.** No gradient background.

---

### 4.3 Daily Financial Briefing Card

This is the **hero section** of the home page. It must feel alive and information-rich.

**Location:** Full width, below the quick-action strip.

**Header row (inside card):**
- Left: Icon (`Newspaper`, 16px) + title `Daily Financial Briefing` (text-base, semibold) + subtitle `AI-generated · Updated {time}` (text-xs, muted)
- Right: `Refresh` button (ghost, text-sm, `text-primary`) with a loading spinner when regenerating. Also show `Cached` badge (text-xs, muted, pill) if served from Redis cache.

**Content — the AI-generated briefing must follow this exact structured format:**

When the AI (Groq/Gemini) generates the Daily Briefing, instruct it with this system prompt addition:

```
You are FinPilotX's Daily Briefing engine. Generate a structured daily financial briefing for an Indian finance professional. 
Output must follow EXACTLY this JSON structure:

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
        { "label": "NIFTY 50", "value": "24,832", "change": "+0.42%", "direction": "up" },
        { "label": "SENSEX", "value": "81,547", "change": "+0.38%", "direction": "up" },
        { "label": "Bank NIFTY", "value": "52,314", "change": "-0.12%", "direction": "down" }
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
        { "label": "Gold", "value": "$2,341", "change": "+0.3%", "direction": "up" },
        { "label": "USD/INR", "value": "83.47", "change": "+0.1%", "direction": "up" }
      ]
    },
    {
      "id": "tax_compliance",
      "title": "Tax & Compliance Today",
      "icon": "CalendarClock",
      "summary": "Any ITR, GST, TDS, or ROC deadlines falling today or within 7 days. If none, say so clearly.",
      "upcoming_deadlines": [
        { "date": "30 Apr 2026", "label": "TDS Payment — March Quarter", "days_left": 3, "urgency": "high" },
        { "date": "11 May 2026", "label": "GSTR-1 Filing", "days_left": 14, "urgency": "medium" }
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
```

**Rendering the briefing in the UI:**

- **Sentiment badge** (top-left of card body): pill badge with colour — bullish=green, bearish=red, neutral=muted, volatile=orange. E.g. `● Bullish Sentiment`
- **Headline**: `text-lg font-semibold` displayed prominently below sentiment badge, full width
- **Sections**: rendered as a 2-column grid on desktop, 1-column on mobile. Each section is a sub-card:
  - Icon + Title as sub-header
  - Summary text (`text-sm`, `leading-relaxed`)
  - `data_points` (if present): rendered as a compact inline row of chips — `NIFTY 50  24,832  ▲ +0.42%` — green for up, red for down, `font-mono` for numbers
  - `upcoming_deadlines` (if present): a tight list with a coloured urgency dot (red=high, amber=medium, green=low), deadline label, and "X days left" badge
- **Sources row** (bottom of card): `text-xs text-muted-foreground` — `Sources: Economic Times · RBI · NSE India`
- **Loading state**: Full skeleton shimmer matching the card layout (sentiment badge skeleton, headline bar, 2×2 sub-card skeletons with text bars)
- **Error state**: Inline error — `⚠ Briefing unavailable. Check your API connection.` with a Retry button. Never show empty or raw JSON.

**Cache logic:**
- On page load, check Upstash Redis for key `briefing:{userId}:{YYYY-MM-DD}`
- If cache hit: render immediately, show `Cached` badge with time
- If cache miss: call `/api/briefing` route, render, write to Redis with 30-min TTL
- Refresh button: force-calls `/api/briefing?force=true`, bypasses cache, updates Redis

---

### 4.4 Bottom Row — Market Pulse + Deadline Tracker

**Layout:** Two-column row below the briefing card. Left: 60% width. Right: 40% width. Stack to single column on mobile.

#### Left — Market Pulse Widget

- Title: `Market Pulse` with `text-sm font-semibold`
- A mini sparkline chart (use Recharts `<Sparkline>` or `<LineChart>`) showing NIFTY 50 intraday movement. If data unavailable, show a static placeholder line with a "Live data unavailable" caption.
- Below chart: three inline stat chips — NIFTY | SENSEX | Midcap 150 — with current value + % change
- All numbers: `font-mono tabular-nums`
- Positive % = `text-green-400`, Negative % = `text-red-400`

#### Right — Upcoming Deadlines

- Title: `Compliance Calendar` with `text-sm font-semibold`
- List of max 5 upcoming deadlines (sourced from the briefing JSON `upcoming_deadlines` + a hardcoded fallback list of common Indian compliance dates)
- Each row:
  - Urgency dot (red/amber/green based on days_left: ≤3 = red, 4–14 = amber, 15+ = green)
  - Deadline name (`text-sm`)
  - Date (`text-xs text-muted-foreground font-mono`)
  - `X days` badge (pill, small)
- Footer link: `View full calendar →` that routes to `/chat?prompt=Show+all+upcoming+compliance+deadlines`

---

## 5. API Route — `/api/briefing`

Create `app/api/briefing/route.ts`:

```typescript
// Steps:
// 1. Check Redis for cached briefing (key: `briefing:{userId}:{date}`)
// 2. If cache hit and not force refresh: return cached JSON
// 3. If cache miss or force=true:
//    a. Use Tavily to search: "Indian market summary today", "RBI news today", "GST notifications today"
//    b. Concatenate Tavily results into a context string
//    c. Call Groq with system prompt (the JSON schema above) + context
//    d. Parse and validate JSON response
//    e. Write to Redis with TTL 1800 (30 min)
//    f. Return JSON
// 4. On error: return { error: true, message: "..." } — never throw unhandled
```

**Groq model to use:** `llama-3.3-70b-versatile` (already in use in the project)
**Response format:** `response_format: { type: "json_object" }` to ensure valid JSON output

---

## 6. Component File Structure

Create or modify only these files:

```
app/
├── (dashboard)/
│   └── page.tsx                    ← REBUILD this entirely
├── api/
│   └── briefing/
│       └── route.ts                ← CREATE new
components/
├── home/
│   ├── GreetingRow.tsx             ← CREATE
│   ├── QuickActionStrip.tsx        ← CREATE
│   ├── DailyBriefingCard.tsx       ← CREATE
│   ├── MarketPulseWidget.tsx       ← CREATE
│   ├── DeadlineTracker.tsx         ← CREATE
│   └── BriefingSkeleton.tsx        ← CREATE (skeleton loader)
types/
│   └── briefing.ts                 ← CREATE (TypeScript types for the briefing JSON)
```

---

## 7. Design Tokens & Visual Rules

The app is dark-mode-first. Keep the existing dark background (`#0d1117` approx). Apply these rules consistently:

| Element | Style Rule |
|---|---|
| Page background | Existing dark bg — do not change |
| Card background | One step lighter than page bg — `bg-white/5` or `bg-zinc-900` |
| Card border | `border border-white/10` — alpha-blended, never solid grey |
| Primary accent | Existing blue (`#3b82f6` or equivalent) — use only for interactive elements, links, and CTA buttons |
| Positive values | `text-green-400` |
| Negative values | `text-red-400` |
| Neutral/muted | `text-zinc-400` |
| All numbers | `font-mono tabular-nums` |
| Card radius | `rounded-xl` (consistent throughout) |
| Card padding | `p-5` or `p-6` |
| Section gap | `gap-4` between cards, `gap-6` between major rows |
| Hover transitions | `transition-all duration-150 ease-out` |
| No colored side borders | Never `border-l-4 border-blue-500` — use surface elevation instead |
| No icon background circles | Icons render at natural size with accent colour, no rounded-square container |

---

## 8. Interaction & Animation Details

- **Briefing load:** Content fades in section-by-section with a 60ms stagger delay between sub-cards (`opacity-0 → opacity-100`, `translateY(8px) → translateY(0)`)
- **Quick-action cards:** On hover, card lifts (`shadow-lg` + `translateY(-2px)`), icon shifts right by 2px
- **Data values:** When briefing loads for the first time in a session, numeric values count up from 0 to their target value over 600ms (use a simple `requestAnimationFrame` counter)
- **Refresh button:** On click, shows inline spinner, card content fades to 40% opacity during load, fades back in on completion
- **Market status badge:** If markets open, pulse animation on the green dot (`animate-pulse`)
- **Deadline urgency:** Rows with `urgency: "high"` (≤3 days) have a subtle red glow on the dot

---

## 9. Empty & Error States

| State | What to show |
|---|---|
| Briefing loading | `BriefingSkeleton` component — shimmer bars matching the briefing layout |
| Briefing API error | Inline error message inside the card: icon + "Couldn't load today's briefing." + Retry button |
| No deadlines | "No compliance deadlines in the next 30 days. Enjoy the calm." |
| Markets closed | Replace Market Pulse chart with "Markets are closed. Next session opens Monday 09:15 IST." |
| New user (no chat history) | Sidebar chat list shows an empty state: "Your conversations will appear here. Ask FinPilotX anything." |

---

## 10. What NOT to Change

- Sidebar component and its chat history list
- Topbar component and its Module / Jurisdiction / Mode dropdowns
- Clerk auth flow
- Any existing chat routes (`/api/chat`, `/api/chats`, `/api/messages`)
- Existing type definitions in `types/` other than adding `briefing.ts`
- `package.json` dependencies (only rename `"name"` field)

---

## 11. Acceptance Criteria

Before marking this task done, verify:

- [ ] Home page loads in < 2s (briefing can load async after page paint)
- [ ] Briefing card shows real AI-generated content, not placeholder text
- [ ] All 5 quick-action cards are clickable and route correctly
- [ ] Skeleton loader shows during briefing fetch
- [ ] Refresh button works and bypasses cache
- [ ] Market status badge reflects correct IST open/closed state
- [ ] Numeric values use `font-mono tabular-nums`
- [ ] No placeholder text ("Response", "Coming soon", etc.) visible anywhere on the page
- [ ] Mobile layout (375px): all sections stack single-column, quick-action strip scrolls horizontally
- [ ] Dark mode renders correctly throughout
- [ ] TypeScript: no `any` types in new files
- [ ] `package.json` name updated from `tmp_app` to `finpilotx`
