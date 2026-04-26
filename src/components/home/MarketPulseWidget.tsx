"use client";

import type { DataPoint } from "@/types/briefing";

interface MarketPulseProps {
  dataPoints?: DataPoint[];
}

export function MarketPulseWidget({ dataPoints }: MarketPulseProps) {
  const fallbackPoints: DataPoint[] = [
    { label: 'NIFTY 50', value: '--', change: '--', direction: 'flat' },
    { label: 'SENSEX', value: '--', change: '--', direction: 'flat' },
    { label: 'Midcap 150', value: '--', change: '--', direction: 'flat' },
  ];

  const points = dataPoints && dataPoints.length > 0 ? dataPoints : fallbackPoints;
  const hasData = dataPoints && dataPoints.length > 0;

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Market Pulse</h3>

      {/* Chart Area */}
      <div className="h-32 mb-4 bg-white/[0.02] rounded-lg flex items-center justify-center border border-white/[0.04]">
        {hasData ? (
          <svg viewBox="0 0 200 60" className="w-full h-full p-4">
            <polyline
              fill="none"
              stroke="rgb(96, 165, 250)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="0,45 20,40 40,35 60,38 80,25 100,30 120,20 140,22 160,15 180,18 200,12"
              opacity="0.8"
            />
            <linearGradient id="pulse-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(96, 165, 250)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="rgb(96, 165, 250)" stopOpacity="0" />
            </linearGradient>
            <polygon
              fill="url(#pulse-gradient)"
              points="0,45 20,40 40,35 60,38 80,25 100,30 120,20 140,22 160,15 180,18 200,12 200,60 0,60"
            />
          </svg>
        ) : (
          <p className="text-xs text-zinc-500">Live data unavailable</p>
        )}
      </div>

      {/* Stat Chips */}
      <div className="flex gap-3">
        {points.map(dp => {
          const isUp = dp.direction === 'up';
          const isDown = dp.direction === 'down';
          return (
            <div key={dp.label} className="flex-1 bg-white/[0.03] rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{dp.label}</p>
              <p className="text-sm text-white font-mono tabular-nums">{dp.value}</p>
              <p className={`text-xs font-mono tabular-nums mt-0.5 ${isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-zinc-500'}`}>
                {dp.change}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
