"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { UserContext } from "@/lib/ai/build-system-prompt";

export function UserContextModal() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<UserContext>>({
    role: 'accountant',
    industry: '',
    companySize: 'sme',
    preferredDetailLevel: 'detailed',
    country: 'India',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    
    // Check if context exists
    fetch(`/api/user/context?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          // Already onboarded
          setIsOpen(false);
        } else {
          // Needs onboarding
          setIsOpen(true);
        }
      })
      .catch(err => console.error("Failed to check user context:", err))
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      await fetch('/api/user/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, context: formData }),
      });
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to save context:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--color-bg-panel)] border border-[var(--color-border-default)] rounded-xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-2">Welcome to FinPilot</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          Help me tailor my answers to your needs by sharing a bit about your role.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Your Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full bg-[var(--color-bg-main)] border border-[var(--color-border-subtle)] text-white text-sm rounded-lg p-2.5 focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)] outline-none"
            >
              <option value="accountant">Accountant / CA</option>
              <option value="CFO">CFO / Finance Director</option>
              <option value="analyst">Financial Analyst</option>
              <option value="founder">Founder / Business Owner</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Company Size</label>
            <select
              value={formData.companySize}
              onChange={(e) => setFormData({ ...formData, companySize: e.target.value as any })}
              className="w-full bg-[var(--color-bg-main)] border border-[var(--color-border-subtle)] text-white text-sm rounded-lg p-2.5 focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)] outline-none"
            >
              <option value="startup">Startup (&lt; 50 employees)</option>
              <option value="sme">SME (50-500 employees)</option>
              <option value="enterprise">Enterprise (500+ employees)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Preferred Detail Level</label>
            <select
              value={formData.preferredDetailLevel}
              onChange={(e) => setFormData({ ...formData, preferredDetailLevel: e.target.value as any })}
              className="w-full bg-[var(--color-bg-main)] border border-[var(--color-border-subtle)] text-white text-sm rounded-lg p-2.5 focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)] outline-none"
            >
              <option value="detailed">Detailed & Comprehensive</option>
              <option value="brief">Brief & Actionable</option>
              <option value="expert">Expert Level (Citations & Deep Dives)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full mt-6 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-500)] text-white rounded-lg py-2.5 font-medium transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Start Using FinPilot"}
        </button>
      </div>
    </div>
  );
}
