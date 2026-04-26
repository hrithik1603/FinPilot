"use client";

import { TrendingUp, Landmark, Globe, CalendarClock, FileText, ArrowRight } from "lucide-react";

const quickActions = [
  { icon: TrendingUp, title: "Today's Market", subtitle: "NIFTY · SENSEX · ₹/$", prompt: "Give me today's Indian stock market summary including NIFTY 50, SENSEX, and key movers" },
  { icon: Landmark, title: "RBI Policy", subtitle: "Latest circular", prompt: "Latest RBI monetary policy update and its impact on the Indian economy" },
  { icon: Globe, title: "Global Markets", subtitle: "DOW · NASDAQ · Gold", prompt: "Global financial markets overview today and impact on India" },
  { icon: CalendarClock, title: "Tax Deadlines", subtitle: "Upcoming due dates", prompt: "Upcoming Indian tax compliance deadlines for the next 30 days" },
  { icon: FileText, title: "GST Updates", subtitle: "Latest notifications", prompt: "Latest GST notifications and circulars in India" },
];

export function QuickActionStrip({ onStartChat }: { onStartChat: (prompt: string) => void }) {
  return (
    <div className="flex gap-3 mb-6 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide">
      {quickActions.map((action, i) => {
        const Icon = action.icon;
        return (
          <button
            key={i}
            onClick={() => onStartChat(action.prompt)}
            className="group flex-1 min-w-[160px] bg-white/[0.04] border border-white/10 rounded-xl p-4 text-left transition-all duration-150 ease-out hover:bg-white/[0.07] hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] snap-start"
          >
            <div className="flex items-center justify-between mb-3">
              <Icon className="w-[18px] h-[18px] text-blue-400 transition-transform duration-150 group-hover:translate-x-0.5" />
              <ArrowRight className="w-3.5 h-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            </div>
            <p className="text-sm font-medium text-white">{action.title}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{action.subtitle}</p>
          </button>
        );
      })}
    </div>
  );
}
