"use client";

import {
  MessageSquarePlus,
  Home,
  History,
  BookOpen,
  UploadCloud,
  Bookmark,
  Calculator,
  FileText,
  Scale,
  Landmark,
  TrendingUp,
  Briefcase,
  Settings,
  ChevronDown,
  MessageSquare
} from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { ChatSession, Module, Mode } from "@/app/page";
import { useState } from "react";

interface SidebarProps {
  chatHistory: ChatSession[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  selectedModule: Module;
  onSelectModule: (m: Module) => void;
  mode: Mode;
  onSetMode: (m: Mode) => void;
}

export function Sidebar({
  chatHistory, activeChatId, onNewChat, onSelectChat,
  selectedModule, onSelectModule, mode, onSetMode
}: SidebarProps) {
  const { user } = useUser();
  const [showHistory, setShowHistory] = useState(false);

  const modules: { key: Module; label: string; icon: React.ReactNode }[] = [
    { key: 'accounting', label: 'Accounting', icon: <Calculator className="w-5 h-5 text-green-500" /> },
    { key: 'reporting', label: 'Financial Reporting', icon: <FileText className="w-5 h-5 text-blue-400" /> },
    { key: 'laws', label: 'Laws & Compliance', icon: <Scale className="w-5 h-5 text-indigo-400" /> },
    { key: 'taxation', label: 'Taxation', icon: <Landmark className="w-5 h-5 text-red-400" /> },
    { key: 'fpa', label: 'FP&A', icon: <TrendingUp className="w-5 h-5 text-yellow-500" /> },
    { key: 'treasury', label: 'Treasury', icon: <Briefcase className="w-5 h-5 text-purple-400" /> },
  ];

  return (
    <aside className="w-64 bg-[var(--color-bg-sidebar)] border-r border-[var(--color-border-subtle)] flex flex-col h-full shrink-0">
      {/* Header Logo */}
      <div className="h-16 flex items-center px-6">
        <div className="flex items-center gap-2 text-[var(--color-brand-500)] font-semibold text-xl">
          <TrendingUp className="w-6 h-6" />
          <span className="text-white">FinPilot</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-500)] text-white rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 font-medium transition-colors"
        >
          <MessageSquarePlus className="w-5 h-5" />
          New Chat
        </button>

        {/* Main Nav */}
        <nav className="space-y-1">
          <NavItem
            icon={<Home className="w-5 h-5" />}
            label="Home"
            active={!showHistory}
            onClick={() => { setShowHistory(false); onNewChat(); }}
          />
          <NavItem
            icon={<History className="w-5 h-5" />}
            label="Chat History"
            active={showHistory}
            onClick={() => setShowHistory(!showHistory)}
          />
        </nav>

        {/* Chat History List */}
        {showHistory && (
          <div className="space-y-1 ml-2 max-h-48 overflow-y-auto">
            {chatHistory.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] px-2 py-1">No chats yet</p>
            ) : (
              chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors truncate ${
                    chat.id === activeChatId
                      ? 'bg-[var(--color-bg-panel)] text-white'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{chat.title}</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Modules */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 px-2">
            Modules
          </h3>
          <nav className="space-y-1">
            {modules.map((mod) => (
              <NavItem
                key={mod.key}
                icon={mod.icon}
                label={mod.label}
                active={selectedModule === mod.key}
                onClick={() => onSelectModule(mod.key)}
              />
            ))}
          </nav>
        </div>

        {/* Mode Toggle */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 px-2">
            Mode
          </h3>
          <div className="space-y-2">
            <ModeOption
              title="Standard Mode"
              active={mode === 'standard'}
              onClick={() => onSetMode('standard')}
            />
            <ModeOption
              title="Expert Mode"
              subtitle="With citations & in-depth insights"
              active={mode === 'expert'}
              onClick={() => onSetMode('expert')}
            />
          </div>
        </div>

        {/* Settings */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3 px-2">
            Settings
          </h3>
          <nav className="space-y-1">
            <div className="flex items-center justify-between px-2 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded-md cursor-pointer">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5" />
                <span>Jurisdiction</span>
              </div>
              <span className="flex items-center gap-1 text-white">
                <span className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-[8px]">IN</span>
                India
              </span>
            </div>
          </nav>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-[var(--color-border-subtle)]">
        <div className="flex items-center justify-between p-2 hover:bg-[var(--color-bg-hover)] rounded-md transition-colors">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <div>
              <p className="text-sm font-medium text-white">{user?.fullName || 'Guest'}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Pro Plan</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] cursor-pointer" />
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors ${
        active
          ? "bg-[var(--color-bg-panel)] text-white"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ModeOption({ title, subtitle, active, onClick }: { title: string; subtitle?: string; active?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        active
          ? "border-[var(--color-brand-500)] bg-[var(--color-bg-panel)]"
          : "border-transparent hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)]"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded-full border ${active ? "border-[var(--color-brand-500)]" : "border-[var(--color-text-muted)]"} flex items-center justify-center`}>
          {active && <div className="w-2 h-2 rounded-full bg-[var(--color-brand-500)]" />}
        </div>
        <span className={`text-sm font-medium ${active ? "text-white" : "text-[var(--color-text-secondary)]"}`}>{title}</span>
      </div>
      {subtitle && <p className="text-xs text-[var(--color-text-muted)] ml-6 mt-1">{subtitle}</p>}
    </div>
  );
}
