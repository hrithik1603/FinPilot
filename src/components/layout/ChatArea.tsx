"use client";

import { useState, useEffect, useRef } from "react";
import { Bookmark, Copy, Share, ThumbsUp, ThumbsDown } from "lucide-react";
import { Message, StructuredResponse } from "@/app/page";
import { useUser } from "@clerk/nextjs";

export function ChatArea({ messages, isLoading, onActionClick }: { messages: Message[], isLoading: boolean, onActionClick?: (action: string) => void }) {
  const { user } = useUser();
  const userInitials = user?.firstName?.[0] || 'U';
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[var(--color-bg-main)]">
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-[var(--color-text-muted)] mt-20">
            <h2 className="text-xl font-medium text-white mb-2">Welcome to FinPilot</h2>
            <p>Ask a finance question or upload a document to get started.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-4">
            {msg.role === 'user' ? (
              <>
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium shrink-0 mt-1 uppercase">
                  {userInitials}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium">{user?.fullName || 'User'}</span>
                  </div>
                  <p className="text-[var(--color-text-secondary)] text-sm whitespace-pre-wrap">
                    {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-[var(--color-brand-600)] flex items-center justify-center text-white shrink-0 mt-1">
                  <span className="font-bold font-serif italic text-lg">F</span>
                </div>
                <div className="flex-1 pt-1 min-w-0">
                  <AnimatedStructuredContent
                    data={msg.content as StructuredResponse}
                    animate={msg.id === lastMessageId}
                  />
                  
                  <ActionBar data={msg.content as StructuredResponse} onActionClick={onActionClick} />
                </div>
              </>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[var(--color-brand-600)] flex items-center justify-center text-white shrink-0 mt-1">
              <span className="font-bold font-serif italic text-lg">F</span>
            </div>
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[var(--color-brand-500)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-[var(--color-brand-500)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-[var(--color-brand-500)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="ml-2">Analyzing your query...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── Typewriter Hook ──────────────────────────────────────────────
// Properly handles React Strict Mode double-invocation by resetting on cleanup
function useTypewriter(text: string, speed: number, enabled: boolean) {
  const [displayed, setDisplayed] = useState(enabled ? '' : text);
  const [isDone, setIsDone] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setDisplayed(text);
      setIsDone(true);
      return;
    }
    if (!text) {
      setDisplayed('');
      setIsDone(true);
      return;
    }

    // Reset state for this run
    setDisplayed('');
    setIsDone(false);

    let i = 0;
    const chunkSize = Math.max(1, Math.ceil(text.length / 60));
    const interval = setInterval(() => {
      i += chunkSize;
      if (i >= text.length) {
        setDisplayed(text);
        setIsDone(true);
        clearInterval(interval);
      } else {
        setDisplayed(text.slice(0, i));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [enabled, text, speed]);

  return { displayed, isDone };
}

// ─── Phase Timer Hook ─────────────────────────────────────────────
// Reveals items one by one on a timer. Stable with strict mode.
function useStaggeredReveal(totalItems: number, delayMs: number, enabled: boolean) {
  const [count, setCount] = useState(enabled ? 0 : totalItems);
  const [isDone, setIsDone] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setCount(totalItems);
      setIsDone(true);
      return;
    }
    if (totalItems === 0) {
      setIsDone(true);
      return;
    }

    setCount(0);
    setIsDone(false);

    let current = 0;
    const interval = setInterval(() => {
      current++;
      setCount(current);
      if (current >= totalItems) {
        setIsDone(true);
        clearInterval(interval);
      }
    }, delayMs);

    return () => clearInterval(interval);
  }, [enabled, totalItems, delayMs]);

  return { visibleCount: count, isDone };
}

// ─── Animated Structured Content ──────────────────────────────────
function AnimatedStructuredContent({ data, animate }: { data: StructuredResponse; animate: boolean }) {
  const [phase, setPhase] = useState(animate ? 0 : 99);

  const title = useTypewriter(data.title || '', 15, animate && phase >= 0);
  const summary = useTypewriter(data.summary || '', 10, !animate || phase >= 1);

  const explanationReveal = useStaggeredReveal(
    data.detailed_explanation?.length || 0,
    500,
    !animate || phase >= 2
  );

  const notesReveal = useStaggeredReveal(
    data.practical_notes?.length || 0,
    400,
    !animate || phase >= 4
  );

  // Phase transitions
  useEffect(() => {
    if (!animate || phase !== 0 || !title.isDone) return;
    const t = setTimeout(() => setPhase(1), 150);
    return () => clearTimeout(t);
  }, [animate, phase, title.isDone]);

  useEffect(() => {
    if (!animate || phase !== 1 || !summary.isDone) return;
    const t = setTimeout(() => setPhase(2), 200);
    return () => clearTimeout(t);
  }, [animate, phase, summary.isDone]);

  useEffect(() => {
    if (!animate || phase !== 2 || !explanationReveal.isDone) return;
    const t = setTimeout(() => setPhase(3), 300);
    return () => clearTimeout(t);
  }, [animate, phase, explanationReveal.isDone]);

  useEffect(() => {
    if (!animate || phase !== 3) return;
    const t = setTimeout(() => setPhase(4), 600);
    return () => clearTimeout(t);
  }, [animate, phase]);

  useEffect(() => {
    if (!animate || phase !== 4 || !notesReveal.isDone) return;
    const t = setTimeout(() => setPhase(5), 300);
    return () => clearTimeout(t);
  }, [animate, phase, notesReveal.isDone]);

  if (!data) return null;

  return (
    <>
      {/* Title, Summary & Badges */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-white">
              {title.displayed}
              {animate && !title.isDone && <span className="inline-block w-0.5 h-5 bg-white ml-0.5 animate-pulse" />}
            </h2>
            {/* Badges */}
            {data.confidence && phase >= 0 && (
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border animate-fadeIn ${
                data.confidence === 'high' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                data.confidence === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {data.confidence} Confidence
              </span>
            )}
            {data.out_of_scope && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-purple-500/10 text-purple-400 border-purple-500/20 animate-fadeIn">
                Out of Scope
              </span>
            )}
          </div>
          
          {phase >= 1 && (
            <div className="space-y-3 animate-fadeIn">
              <p className="text-sm text-[var(--color-text-secondary)]">
                {summary.displayed}
                {animate && !summary.isDone && <span className="inline-block w-0.5 h-4 bg-[var(--color-text-secondary)] ml-0.5 animate-pulse" />}
              </p>
              
              {data.needs_clarification && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-3">
                  <span className="text-blue-400 mt-0.5">ℹ️</span>
                  <p className="text-sm text-blue-200">
                    This query requires clarification. Please provide more details so I can give you an accurate answer.
                  </p>
                </div>
              )}
              
              {data.confidence === 'low' && data.correction_hint && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                  <span className="text-red-400 mt-0.5">⚠️</span>
                  <p className="text-sm text-red-200">
                    <strong>Low Confidence:</strong> {data.correction_hint}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Detailed Explanation */}
        {phase >= 2 && data.detailed_explanation && data.detailed_explanation.length > 0 && (
          <div className="animate-fadeIn">
            <Block title="Detailed Explanation" icon="⚙️">
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[var(--color-text-muted)]">
                {data.detailed_explanation.map((item, i) =>
                  i < explanationReveal.visibleCount ? (
                    <li key={i} className="animate-slideUp">{item}</li>
                  ) : null
                )}
              </ul>
            </Block>
          </div>
        )}

        {/* Example Table */}
        {phase >= 3 && data.example && data.example.table_data && data.example.table_data.length > 0 && (
          <div className="animate-fadeIn">
            <Block title="Example" icon="📄">
              <p className="mb-3">{data.example.description}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)]">
                      {Object.keys(data.example.table_data[0]).map((key) => (
                        <th key={key} className="py-2 px-4 font-medium capitalize">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-[var(--color-text-secondary)] divide-y divide-[var(--color-border-subtle)]">
                    {data.example.table_data.map((row, i) => (
                      <tr key={i} className="animate-slideUp" style={{ animationDelay: `${i * 100}ms` }}>
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="py-2 px-4">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Block>
          </div>
        )}

        {/* Practical Notes */}
        {phase >= 4 && data.practical_notes && data.practical_notes.length > 0 && (
          <div className="animate-fadeIn">
            <Block title="Practical Notes" icon="📝">
              <ul className="list-disc pl-5 space-y-1.5 marker:text-[var(--color-text-muted)]">
                {data.practical_notes.map((item, i) =>
                  i < notesReveal.visibleCount ? (
                    <li key={i} className="animate-slideUp">{item}</li>
                  ) : null
                )}
              </ul>
            </Block>
          </div>
        )}

        {/* Sources */}
        {phase >= 5 && data.sources && data.sources.length > 0 && (
          <div className="animate-fadeIn">
            <Block title="Sources & References" icon="📚">
              <ul className="list-disc pl-5 space-y-1 marker:text-[var(--color-text-muted)]">
                {data.sources.map((src, i) => (
                  <li key={i} className="animate-slideUp" style={{ animationDelay: `${i * 80}ms` }}>
                    {src}
                  </li>
                ))}
              </ul>
            </Block>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Block wrapper ────────────────────────────────────────────────
function Block({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span> {title}
      </h3>
      <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-bg-panel)]/50 p-4 rounded-xl border border-[var(--color-border-default)]">
        {children}
      </div>
    </div>
  );
}

// ─── Action Bar ───────────────────────────────────────────────────
function ActionBar({ data, onActionClick }: { data: StructuredResponse, onActionClick?: (action: string) => void }) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const formatAsText = () => {
    let text = `${data.title}\n\n${data.summary}\n\n`;
    if (data.detailed_explanation?.length) {
      text += 'Detailed Explanation:\n';
      data.detailed_explanation.forEach((item, i) => { text += `${i + 1}. ${item}\n`; });
      text += '\n';
    }
    if (data.practical_notes?.length) {
      text += 'Practical Notes:\n';
      data.practical_notes.forEach((item, i) => { text += `• ${item}\n`; });
      text += '\n';
    }
    if (data.sources?.length) {
      text += 'Sources:\n';
      data.sources.forEach(s => { text += `- ${s}\n`; });
    }
    return text;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatAsText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const blob = new Blob([formatAsText()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    setSaved(!saved);
    // Store in localStorage
    const savedAnswers = JSON.parse(localStorage.getItem('finpilot_saved') || '[]');
    if (!saved) {
      savedAnswers.push({ ...data, savedAt: new Date().toISOString() });
    } else {
      const idx = savedAnswers.findIndex((s: any) => s.title === data.title);
      if (idx >= 0) savedAnswers.splice(idx, 1);
    }
    localStorage.setItem('finpilot_saved', JSON.stringify(savedAnswers));
  };

  const { user } = useUser();

  const submitFeedback = async (type: 'up' | 'down') => {
    if (!user?.id) return;
    
    // Toggle off if clicking the same one
    if (feedback === type) {
      setFeedback(null);
      return;
    }
    
    setFeedback(type);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          chatId: null, // Would be passed down if tracked specifically
          module: 'general', // Default or passed down
          topicTitle: data.title,
          confidenceScore: data.confidence,
          feedbackType: type
        })
      });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Correction Loops */}
      {onActionClick && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
          <button 
            onClick={() => onActionClick('Simplify this answer')}
            className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-bg-panel)] border border-[var(--color-border-default)] hover:bg-[var(--color-brand-600)] transition-colors"
          >
            Simplify
          </button>
          <button 
            onClick={() => onActionClick('Make this more practical')}
            className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-bg-panel)] border border-[var(--color-border-default)] hover:bg-[var(--color-brand-600)] transition-colors"
          >
            Make Practical
          </button>
          <button 
            onClick={() => onActionClick('Add more citations and references')}
            className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-bg-panel)] border border-[var(--color-border-default)] hover:bg-[var(--color-brand-600)] transition-colors"
          >
            Add Citations
          </button>
        </div>
      )}

      {/* Utilities */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
          <span>Was this answer helpful?</span>
          <button
            onClick={() => submitFeedback('up')}
            className={`transition-colors ${feedback === 'up' ? 'text-green-400' : 'hover:text-white'}`}
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => submitFeedback('down')}
            className={`transition-colors ${feedback === 'down' ? 'text-red-400' : 'hover:text-white'}`}
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
          <button onClick={handleCopy} className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Share className="w-4 h-4" /> Export
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 transition-colors ${saved ? 'text-yellow-400' : 'hover:text-white'}`}
          >
            <Bookmark className="w-4 h-4" /> {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
