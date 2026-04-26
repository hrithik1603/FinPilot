"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

function isMarketOpen(): boolean {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = ist.getDay();
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const totalMin = hours * 60 + minutes;
  // NSE: Mon–Fri 09:15–15:30 IST
  return day >= 1 && day <= 5 && totalMin >= 555 && totalMin <= 930;
}

export function GreetingRow() {
  const { user } = useUser();
  const [clock, setClock] = useState('');
  const [marketOpen, setMarketOpen] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setMarketOpen(isMarketOpen());
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Good {greeting}, {user?.firstName || 'there'}
        </h1>
        <p className="text-sm text-zinc-400 font-mono mt-1">
          {dateStr} · <span className="text-zinc-500">{clock} IST</span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
          marketOpen
            ? 'bg-green-500/15 text-green-400'
            : 'bg-red-500/15 text-red-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${marketOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          {marketOpen ? 'Markets Open' : 'Markets Closed'}
        </div>
      </div>
    </div>
  );
}
