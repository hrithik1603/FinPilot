"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Newspaper, RefreshCw, TrendingUp, Landmark, Globe, CalendarClock, Zap } from "lucide-react";
import { BriefingSkeleton } from "./BriefingSkeleton";
import type { BriefingData, BriefingSection, DataPoint, UpcomingDeadline } from "@/types/briefing";

const iconMap: Record<string, React.ElementType> = {
  TrendingUp, Landmark, Globe, CalendarClock, Zap,
};

const sentimentConfig: Record<string, { color: string; label: string }> = {
  bullish: { color: 'bg-green-500/15 text-green-400', label: '● Bullish Sentiment' },
  bearish: { color: 'bg-red-500/15 text-red-400', label: '● Bearish Sentiment' },
  neutral: { color: 'bg-zinc-500/15 text-zinc-400', label: '● Neutral Sentiment' },
  volatile: { color: 'bg-orange-500/15 text-orange-400', label: '● Volatile Sentiment' },
};

export function DailyBriefingCard() {
  const { user } = useUser();
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);
  const [cachedAt, setCachedAt] = useState('');
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBriefing = async (force = false) => {
    if (force) setIsRefreshing(true);
    else setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/briefing?userId=${user?.id || 'anon'}${force ? '&force=true' : ''}`);
      const json = await res.json();
      if (json.error) throw new Error(json.message);
      setBriefing(json.data);
      setIsCached(json.cached || false);
      setCachedAt(json.cached_at || '');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [user?.id]);

  const sentiment = briefing?.market_sentiment ? sentimentConfig[briefing.market_sentiment] : null;
  const updatedTime = briefing?.generated_at
    ? new Date(briefing.generated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : '';

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden mb-6">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Newspaper className="w-4 h-4 text-blue-400" />
          <div>
            <h2 className="text-base font-semibold text-white">Daily Financial Briefing</h2>
            <p className="text-[11px] text-zinc-500">
              AI-generated · {updatedTime ? `Updated ${updatedTime}` : 'Loading...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCached && (
            <span className="text-[10px] font-medium text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">Cached</span>
          )}
          <button
            onClick={() => fetchBriefing(true)}
            disabled={isRefreshing}
            className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Body */}
      <div className={`p-5 transition-opacity duration-300 ${isRefreshing ? 'opacity-40' : 'opacity-100'}`}>
        {isLoading ? (
          <BriefingSkeleton />
        ) : error ? (
          <div className="flex items-center gap-3 py-6 justify-center">
            <span className="text-zinc-500">⚠</span>
            <p className="text-sm text-zinc-400">Couldn&apos;t load today&apos;s briefing.</p>
            <button onClick={() => fetchBriefing(true)} className="text-sm text-blue-400 hover:text-blue-300 font-medium">
              Retry
            </button>
          </div>
        ) : briefing ? (
          <div className="space-y-5">
            {/* Sentiment + Headline */}
            {sentiment && (
              <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${sentiment.color}`}>
                {sentiment.label}
              </span>
            )}
            <h3 className="text-lg font-semibold text-white -mt-1">{briefing.headline}</h3>

            {/* Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {briefing.sections.map((section, idx) => (
                <SectionCard key={section.id} section={section} delay={idx * 60} />
              ))}
            </div>

            {/* Sources */}
            {briefing.sources?.length > 0 && (
              <div className="pt-3 border-t border-white/[0.06]">
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                  Sources: {briefing.sources.join(' · ')}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SectionCard({ section, delay }: { section: BriefingSection; delay: number }) {
  const [visible, setVisible] = useState(false);
  const Icon = iconMap[section.icon] || Zap;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={`bg-white/[0.03] rounded-xl p-5 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-blue-400" />
        <h4 className="text-sm font-semibold text-white">{section.title}</h4>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed mb-3">{section.summary}</p>

      {/* Data Points */}
      {section.data_points && section.data_points.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {section.data_points.map((dp) => (
            <DataPointChip key={dp.label} dp={dp} />
          ))}
        </div>
      )}

      {/* Deadlines */}
      {section.upcoming_deadlines && section.upcoming_deadlines.length > 0 && (
        <div className="space-y-2 mt-1">
          {section.upcoming_deadlines.map((dl, i) => (
            <DeadlineRow key={i} deadline={dl} />
          ))}
        </div>
      )}
    </div>
  );
}

function DataPointChip({ dp }: { dp: DataPoint }) {
  const isUp = dp.direction === 'up';
  const color = isUp ? 'text-green-400' : dp.direction === 'down' ? 'text-red-400' : 'text-zinc-400';

  return (
    <div className="flex items-center gap-1.5 bg-white/[0.04] rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums">
      <span className="text-zinc-300 font-sans text-[11px]">{dp.label}</span>
      <span className="text-white">{dp.value}</span>
      <span className={color}>
        {isUp ? '▲' : dp.direction === 'down' ? '▼' : '—'} {dp.change}
      </span>
    </div>
  );
}

function DeadlineRow({ deadline }: { deadline: UpcomingDeadline }) {
  const urgencyColor = deadline.urgency === 'high' ? 'bg-red-400 shadow-red-400/40 shadow-sm' : deadline.urgency === 'medium' ? 'bg-amber-400' : 'bg-green-400';
  const daysColor = deadline.urgency === 'high' ? 'bg-red-500/15 text-red-400' : deadline.urgency === 'medium' ? 'bg-amber-500/15 text-amber-400' : 'bg-green-500/15 text-green-400';

  return (
    <div className="flex items-center gap-3 py-1">
      <span className={`w-2 h-2 rounded-full shrink-0 ${urgencyColor}`} />
      <span className="text-sm text-zinc-300 flex-1">{deadline.label}</span>
      <span className="text-xs text-zinc-500 font-mono">{deadline.date}</span>
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${daysColor}`}>{deadline.days_left}d</span>
    </div>
  );
}
