"use client";

export function BriefingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Sentiment + Headline */}
      <div className="space-y-3">
        <div className="h-5 w-28 bg-white/5 rounded-full" />
        <div className="h-6 w-3/4 bg-white/5 rounded-lg" />
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white/[0.03] rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white/5 rounded" />
              <div className="h-4 w-28 bg-white/5 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-3 w-5/6 bg-white/5 rounded" />
              <div className="h-3 w-2/3 bg-white/5 rounded" />
            </div>
            {i <= 2 && (
              <div className="flex gap-3 pt-1">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-7 w-32 bg-white/5 rounded-lg" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sources */}
      <div className="flex gap-2 pt-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-4 w-20 bg-white/5 rounded" />
        ))}
      </div>
    </div>
  );
}
