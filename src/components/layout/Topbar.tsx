"use client";

import { UploadCloud, Bell, Sun, ChevronDown, Scale, Sparkles, Calculator, FileText, Landmark, TrendingUp, Briefcase, Zap } from "lucide-react";
import { Module, Mode } from "@/app/page";
import { useState, useRef, useEffect } from "react";

const moduleConfig: Record<Module, { label: string; icon: React.ReactNode }> = {
  general: { label: 'General', icon: <Sparkles className="w-4 h-4 text-[var(--color-brand-500)]" /> },
  accounting: { label: 'Accounting', icon: <Calculator className="w-4 h-4 text-green-500" /> },
  reporting: { label: 'Financial Reporting', icon: <FileText className="w-4 h-4 text-blue-400" /> },
  laws: { label: 'Laws & Compliance', icon: <Scale className="w-4 h-4 text-indigo-400" /> },
  taxation: { label: 'Taxation', icon: <Landmark className="w-4 h-4 text-red-400" /> },
  fpa: { label: 'FP&A', icon: <TrendingUp className="w-4 h-4 text-yellow-500" /> },
  treasury: { label: 'Treasury', icon: <Briefcase className="w-4 h-4 text-purple-400" /> },
};

interface TopbarProps {
  selectedModule: Module;
  onSelectModule: (m: Module) => void;
  mode: Mode;
  onSetMode: (m: Mode) => void;
  onUpload: () => void;
}

export function Topbar({ selectedModule, onSelectModule, mode, onSetMode, onUpload }: TopbarProps) {
  const [showModuleMenu, setShowModuleMenu] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const moduleRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moduleRef.current && !moduleRef.current.contains(e.target as Node)) setShowModuleMenu(false);
      if (modeRef.current && !modeRef.current.contains(e.target as Node)) setShowModeMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentMod = moduleConfig[selectedModule];

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-main)]">
      <div className="flex items-center gap-6">
        {/* Module Selector */}
        <div className="relative" ref={moduleRef}>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-[var(--color-text-muted)] font-semibold tracking-wider mb-0.5">Module</span>
            <button
              onClick={() => setShowModuleMenu(!showModuleMenu)}
              className="flex items-center gap-2 text-sm text-white hover:text-gray-300"
            >
              {currentMod.icon}
              {currentMod.label}
              <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
            </button>
          </div>
          {showModuleMenu && (
            <div className="absolute top-full left-0 mt-2 w-52 bg-[var(--color-bg-panel)] border border-[var(--color-border-default)] rounded-lg shadow-xl z-50 py-1">
              {Object.entries(moduleConfig).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => { onSelectModule(key as Module); setShowModuleMenu(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                    selectedModule === key ? 'bg-[var(--color-bg-hover)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white'
                  }`}
                >
                  {val.icon}
                  {val.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-8 bg-[var(--color-border-subtle)]" />

        {/* Jurisdiction (static for now) */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-[var(--color-text-muted)] font-semibold tracking-wider mb-0.5">Jurisdiction</span>
          <div className="flex items-center gap-2 text-sm text-white">
            <span className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-[8px]">IN</span>
            India
          </div>
        </div>

        <div className="w-px h-8 bg-[var(--color-border-subtle)]" />

        {/* Mode Selector */}
        <div className="relative" ref={modeRef}>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-[var(--color-text-muted)] font-semibold tracking-wider mb-0.5">Mode</span>
            <button
              onClick={() => setShowModeMenu(!showModeMenu)}
              className="flex items-center gap-2 text-sm text-white hover:text-gray-300"
            >
              {mode === 'expert'
                ? <Sparkles className="w-4 h-4 text-[var(--color-brand-500)]" />
                : <Zap className="w-4 h-4 text-yellow-400" />
              }
              {mode === 'expert' ? 'Expert Mode' : 'Standard Mode'}
              <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
            </button>
          </div>
          {showModeMenu && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-[var(--color-bg-panel)] border border-[var(--color-border-default)] rounded-lg shadow-xl z-50 py-1">
              <button
                onClick={() => { onSetMode('standard'); setShowModeMenu(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${mode === 'standard' ? 'bg-[var(--color-bg-hover)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white'}`}
              >
                <Zap className="w-4 h-4 text-yellow-400" /> Standard
              </button>
              <button
                onClick={() => { onSetMode('expert'); setShowModeMenu(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${mode === 'expert' ? 'bg-[var(--color-bg-hover)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white'}`}
              >
                <Sparkles className="w-4 h-4 text-[var(--color-brand-500)]" /> Expert
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onUpload}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)] text-sm text-white transition-colors"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Documents
        </button>

        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-white transition-colors">
          <Sun className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
