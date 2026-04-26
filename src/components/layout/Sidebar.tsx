"use client";

import {
  MessageSquarePlus,
  Home,
  MessageSquare,
  ChevronDown,
  Settings,
  TrendingUp,
} from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { ChatSession } from "@/app/page";

interface SidebarProps {
  chatHistory: ChatSession[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onGoHome: () => void;
  isHomeView: boolean;
}

export function Sidebar({
  chatHistory, activeChatId, onNewChat, onSelectChat,
  onGoHome, isHomeView
}: SidebarProps) {
  const { user } = useUser();

  // Group chats by date
  const today = new Date();
  const todayStr = today.toDateString();
  const yesterdayStr = new Date(today.getTime() - 86400000).toDateString();

  const groups: { label: string; chats: ChatSession[] }[] = [];
  const todayChats = chatHistory.filter(c => new Date(c.created_at).toDateString() === todayStr);
  const yesterdayChats = chatHistory.filter(c => new Date(c.created_at).toDateString() === yesterdayStr);
  const olderChats = chatHistory.filter(c => {
    const d = new Date(c.created_at).toDateString();
    return d !== todayStr && d !== yesterdayStr;
  });
  if (todayChats.length) groups.push({ label: 'Today', chats: todayChats });
  if (yesterdayChats.length) groups.push({ label: 'Yesterday', chats: yesterdayChats });
  if (olderChats.length) groups.push({ label: 'Earlier', chats: olderChats });

  return (
    <aside className="w-64 bg-[var(--color-bg-sidebar)] border-r border-[var(--color-border-subtle)] flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-5">
        <div className="flex items-center gap-2 text-[var(--color-brand-500)] font-semibold text-xl">
          <TrendingUp className="w-6 h-6" />
          <span className="text-white">FinPilot</span>
        </div>
        {/* Circular New Chat Button */}
        <button
          onClick={onNewChat}
          title="New Chat"
          className="w-9 h-9 rounded-full bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-500)] text-white flex items-center justify-center transition-all hover:scale-105 shadow-lg shadow-[var(--color-brand-600)]/20"
        >
          <MessageSquarePlus className="w-4 h-4" />
        </button>
      </div>

      {/* Home Button */}
      <div className="px-3 mb-2">
        <button
          onClick={onGoHome}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isHomeView
              ? "bg-gradient-to-r from-[var(--color-brand-600)]/20 to-transparent text-white border border-[var(--color-brand-500)]/30"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white"
          }`}
        >
          <Home className="w-5 h-5" />
          Home Dashboard
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="flex items-center justify-between px-2 mb-3">
          <h3 className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Chat History
          </h3>
        </div>

        {groups.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <MessageSquare className="w-8 h-8 text-[var(--color-text-muted)]/30 mx-auto mb-2" />
            <p className="text-xs text-[var(--color-text-muted)]">No conversations yet</p>
            <p className="text-[10px] text-[var(--color-text-muted)]/60 mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(group => (
              <div key={group.label}>
                <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider px-2 mb-1.5">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.chats.map(chat => (
                    <button
                      key={chat.id}
                      onClick={() => onSelectChat(chat.id)}
                      className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all truncate group ${
                        chat.id === activeChatId
                          ? 'bg-[var(--color-bg-panel)] text-white shadow-sm'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white'
                      }`}
                    >
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${chat.id === activeChatId ? 'text-[var(--color-brand-500)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-500)]'}`} />
                      <span className="truncate">{chat.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="p-3 border-t border-[var(--color-border-subtle)]">
        <div className="flex items-center justify-between p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors">
          <div className="flex items-center gap-3">
            <UserButton />
            <div>
              <p className="text-sm font-medium text-white">{user?.fullName || 'Guest'}</p>
              <p className="text-[10px] text-[var(--color-text-muted)]">Pro Plan</p>
            </div>
          </div>
          <Settings className="w-4 h-4 text-[var(--color-text-muted)] cursor-pointer hover:text-white transition-colors" />
        </div>
      </div>
    </aside>
  );
}
