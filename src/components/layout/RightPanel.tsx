"use client";

import { Book, CheckCircle2, FileText, ChevronRight, ExternalLink } from "lucide-react";
import { StructuredResponse } from "@/app/page";

interface RightPanelProps {
  lastResponse: StructuredResponse | null;
}

export function RightPanel({ lastResponse }: RightPanelProps) {
  return (
    <aside className="w-80 border-l border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] flex flex-col h-full shrink-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {!lastResponse ? (
          <div className="text-center text-[var(--color-text-muted)] mt-16">
            <Book className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Ask a question to see context, sources, and key takeaways here.</p>
          </div>
        ) : (
          <>
            {/* Sources Section */}
            {lastResponse.sources && lastResponse.sources.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Sources</h3>
                  <span className="text-[10px] text-[var(--color-text-muted)] bg-[var(--color-bg-panel)] px-1.5 py-0.5 rounded">
                    {lastResponse.sources.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {lastResponse.sources.map((src, i) => {
                    const isUrl = src.startsWith('http');
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-panel)] border border-[var(--color-border-default)] hover:border-[var(--color-text-muted)] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="shrink-0">
                            {isUrl ? <ExternalLink className="w-4 h-4 text-blue-400" /> : <Book className="w-4 h-4 text-green-400" />}
                          </div>
                          {isUrl ? (
                            <a href={src} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline truncate">
                              {new URL(src).hostname}
                            </a>
                          ) : (
                            <p className="text-xs text-white truncate">{src}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Key Takeaways */}
            {lastResponse.practical_notes && lastResponse.practical_notes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Key Takeaways</h3>
                <div className="space-y-3 bg-[var(--color-bg-panel)] p-4 rounded-xl border border-[var(--color-border-default)]">
                  {lastResponse.practical_notes.map((note, i) => (
                    <TakeawayItem key={i} text={note} />
                  ))}
                </div>
              </div>
            )}

            {/* Summary Card */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Summary</h3>
              <div className="bg-[var(--color-bg-panel)] p-4 rounded-xl border border-[var(--color-border-default)]">
                <h4 className="text-xs font-semibold text-white mb-2">{lastResponse.title}</h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{lastResponse.summary}</p>
              </div>
            </div>
          </>
        )}

      </div>
    </aside>
  );
}

function TakeawayItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
      <span className="text-[var(--color-text-secondary)]">{text}</span>
    </div>
  );
}
