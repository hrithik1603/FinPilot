"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, BarChart3, Newspaper, ArrowRight, Sparkles, IndianRupee, Globe, Clock } from "lucide-react";

interface DashboardData {
  title: string;
  summary: string;
  detailed_explanation: string[];
  practical_notes: string[];
  sources: string[];
  confidence: string;
}

const quickPrompts = [
  { label: "Today's Market Summary", icon: <BarChart3 className="w-4 h-4" />, prompt: "Give me today's Indian stock market summary including Nifty 50, Sensex, and key movers" },
  { label: "RBI Policy Update", icon: <IndianRupee className="w-4 h-4" />, prompt: "What are the latest RBI monetary policy updates and their impact on the Indian economy?" },
  { label: "Global Markets", icon: <Globe className="w-4 h-4" />, prompt: "Give me a brief overview of global financial markets today and how they affect India" },
  { label: "Tax Deadlines", icon: <Clock className="w-4 h-4" />, prompt: "What are the upcoming important tax compliance deadlines in India?" },
];

export function HomeDashboard({ onStartChat }: { onStartChat: (prompt: string) => void }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "Give me a concise daily briefing for an Indian finance professional. Cover: 1) Indian stock market overview (Nifty/Sensex levels and trend), 2) Key financial news in India today, 3) Important regulatory updates if any, 4) Global market sentiment. Keep it brief and actionable.",
          module: 'general',
          mode: 'standard',
          history: [],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[var(--color-bg-main)]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-brand-500)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Good {getGreeting()}</h1>
              <p className="text-sm text-[var(--color-text-muted)]">{currentDate}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => onStartChat(qp.prompt)}
              className="group bg-[var(--color-bg-panel)] border border-[var(--color-border-default)] rounded-xl p-4 text-left hover:border-[var(--color-brand-500)]/40 hover:bg-[var(--color-bg-panel)]/80 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-600)]/10 flex items-center justify-center text-[var(--color-brand-500)]">
                  {qp.icon}
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm font-medium text-white">{qp.label}</p>
            </button>
          ))}
        </div>

        {/* Daily Briefing */}
        <div className="bg-[var(--color-bg-panel)] border border-[var(--color-border-default)] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Newspaper className="w-5 h-5 text-[var(--color-brand-500)]" />
              <div>
                <h2 className="text-base font-semibold text-white">Daily Financial Briefing</h2>
                <p className="text-[11px] text-[var(--color-text-muted)]">AI-generated market overview</p>
              </div>
            </div>
            <button
              onClick={loadDashboard}
              className="text-xs text-[var(--color-brand-500)] hover:text-[var(--color-brand-400)] font-medium transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[var(--color-brand-500)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-[var(--color-brand-500)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-[var(--color-brand-500)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-[var(--color-text-muted)]">Fetching today's market intelligence...</span>
                </div>
                {/* Skeleton */}
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-4 bg-[var(--color-bg-hover)] rounded animate-pulse" style={{ width: `${85 - i * 15}%` }} />
                  ))}
                </div>
              </div>
            ) : dashboardData ? (
              <div className="space-y-5">
                {/* Title & Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{dashboardData.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{dashboardData.summary}</p>
                </div>

                {/* Key Points */}
                {dashboardData.detailed_explanation?.length > 0 && (
                  <div className="space-y-2">
                    {dashboardData.detailed_explanation.map((point, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] mt-2 shrink-0" />
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Practical Notes */}
                {dashboardData.practical_notes?.length > 0 && (
                  <div className="bg-[var(--color-bg-main)]/50 rounded-lg p-4 border border-[var(--color-border-subtle)]">
                    <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Key Takeaways</h4>
                    <ul className="space-y-1.5">
                      {dashboardData.practical_notes.map((note, i) => (
                        <li key={i} className="text-sm text-[var(--color-text-secondary)] flex gap-2">
                          <span className="text-yellow-500">•</span>
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sources */}
                {dashboardData.sources?.length > 0 && (
                  <div className="pt-3 border-t border-[var(--color-border-subtle)]">
                    <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Sources</p>
                    <div className="flex flex-wrap gap-2">
                      {dashboardData.sources.map((src, i) => (
                        <span key={i} className="text-[11px] text-[var(--color-text-muted)] bg-[var(--color-bg-main)] px-2 py-1 rounded">
                          {src.length > 60 ? src.slice(0, 60) + '...' : src}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">Unable to load the daily briefing. Click Refresh to try again.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}
