// ─── Briefing API Response Types ──────────────────────────────────

export type MarketDirection = 'up' | 'down' | 'flat';
export type MarketSentiment = 'bullish' | 'bearish' | 'neutral' | 'volatile';
export type DeadlineUrgency = 'high' | 'medium' | 'low';

export interface DataPoint {
  label: string;
  value: string;
  change: string;
  direction: MarketDirection;
}

export interface UpcomingDeadline {
  date: string;
  label: string;
  days_left: number;
  urgency: DeadlineUrgency;
}

export interface BriefingSection {
  id: string;
  title: string;
  icon: string;
  summary: string;
  data_points?: DataPoint[];
  upcoming_deadlines?: UpcomingDeadline[];
}

export interface BriefingData {
  generated_at: string;
  market_sentiment: MarketSentiment;
  headline: string;
  sections: BriefingSection[];
  sources: string[];
}

export interface BriefingResponse {
  data?: BriefingData;
  cached?: boolean;
  cached_at?: string;
  error?: boolean;
  message?: string;
}
