"use client";

import type { UpcomingDeadline } from "@/types/briefing";

const fallbackDeadlines: UpcomingDeadline[] = [
  { date: '30 Apr 2026', label: 'TDS Payment — March Quarter', days_left: 3, urgency: 'high' },
  { date: '15 May 2026', label: 'Advance Tax — Q1 Installment', days_left: 18, urgency: 'low' },
  { date: '11 May 2026', label: 'GSTR-1 Filing — April', days_left: 14, urgency: 'medium' },
  { date: '20 May 2026', label: 'GSTR-3B Filing — April', days_left: 23, urgency: 'low' },
  { date: '30 May 2026', label: 'TDS Return Filing — Q4', days_left: 33, urgency: 'low' },
];

interface DeadlineTrackerProps {
  deadlines?: UpcomingDeadline[];
  onStartChat: (prompt: string) => void;
}

export function DeadlineTracker({ deadlines, onStartChat }: DeadlineTrackerProps) {
  const items = (deadlines && deadlines.length > 0 ? deadlines : fallbackDeadlines).slice(0, 5);

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Compliance Calendar</h3>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500 py-4 text-center">
          No compliance deadlines in the next 30 days. Enjoy the calm.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((dl, i) => {
            const urgencyColor =
              dl.urgency === 'high' ? 'bg-red-400 shadow-red-400/40 shadow-sm' :
              dl.urgency === 'medium' ? 'bg-amber-400' : 'bg-green-400';
            const daysColor =
              dl.urgency === 'high' ? 'bg-red-500/15 text-red-400' :
              dl.urgency === 'medium' ? 'bg-amber-500/15 text-amber-400' : 'bg-green-500/15 text-green-400';

            return (
              <div key={i} className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${urgencyColor}`} />
                <span className="text-sm text-zinc-300 flex-1 truncate">{dl.label}</span>
                <span className="text-xs text-zinc-500 font-mono shrink-0">{dl.date}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${daysColor}`}>
                  {dl.days_left}d
                </span>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => onStartChat('Show all upcoming compliance deadlines for India in the next 60 days')}
        className="mt-4 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
      >
        View full calendar →
      </button>
    </div>
  );
}
