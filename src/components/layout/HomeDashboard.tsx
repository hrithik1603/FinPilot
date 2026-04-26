"use client";

import { GreetingRow } from "@/components/home/GreetingRow";
import { QuickActionStrip } from "@/components/home/QuickActionStrip";
import { DailyBriefingCard } from "@/components/home/DailyBriefingCard";
import { MarketPulseWidget } from "@/components/home/MarketPulseWidget";
import { DeadlineTracker } from "@/components/home/DeadlineTracker";

export function HomeDashboard({ onStartChat }: { onStartChat: (prompt: string) => void }) {
  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[var(--color-bg-main)]">
      <div className="max-w-5xl mx-auto">
        <GreetingRow />
        <QuickActionStrip onStartChat={onStartChat} />
        <DailyBriefingCard />

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <MarketPulseWidget />
          </div>
          <div className="lg:col-span-2">
            <DeadlineTracker onStartChat={onStartChat} />
          </div>
        </div>
      </div>
    </div>
  );
}
