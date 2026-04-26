"use client";

import { useState, RefObject } from "react";
import { Paperclip, Database, Sparkles, Send, Loader2 } from "lucide-react";

interface InputBarProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
}

export function InputBar({ onSendMessage, isLoading, fileInputRef }: InputBarProps) {
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      onSendMessage(text);
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source_type", "user");
      formData.append("priority", "2");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      console.log("File processed:", data);
      
      // Optionally add a system message or toast here
      alert(`File uploaded and processed successfully! (${data.chunks} chunks stored)`);
    } catch (error) {
      console.error(error);
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-main)]">
      <div className="max-w-4xl mx-auto">
        <div className="relative bg-[var(--color-bg-panel)] border border-[var(--color-border-default)] rounded-xl p-3 flex flex-col gap-3 focus-within:border-[var(--color-brand-500)] transition-colors">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about finance, laws, standards..."
            className="w-full bg-transparent text-white resize-none outline-none text-sm min-h-[40px] max-h-[150px]"
            rows={1}
            disabled={isLoading}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.txt"
                onChange={handleFileChange}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] text-xs text-[var(--color-text-secondary)] hover:text-white transition-colors disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                {isUploading ? "Uploading..." : "Upload"}
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] text-xs text-[var(--color-text-secondary)] hover:text-white transition-colors">
                <Database className="w-3.5 h-3.5" />
                Insert Data
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-brand-600)]/20 text-[var(--color-brand-500)] border border-[var(--color-brand-500)]/30 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Ask with Context
              </button>
            </div>
            
            <button 
              onClick={handleSend}
              disabled={isLoading || !text.trim()}
              className="w-8 h-8 rounded-lg bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-500)] text-white flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Suggested Prompts */}
        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          <SuggestedPrompt label="Explain with example" onClick={() => onSendMessage("Explain with example")} />
          <SuggestedPrompt label="Give journal entries" onClick={() => onSendMessage("Give journal entries")} />
          <SuggestedPrompt label="Compare with IFRS" onClick={() => onSendMessage("Compare with IFRS")} />
          <SuggestedPrompt label="Key disclosures" onClick={() => onSendMessage("What are the key disclosures?")} />
          <SuggestedPrompt label="Related case laws" onClick={() => onSendMessage("What are the related case laws?")} />
        </div>
      </div>
    </div>
  );
}

function SuggestedPrompt({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="px-3 py-1.5 rounded-full border border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)] text-xs text-[var(--color-text-secondary)] hover:text-white transition-colors"
    >
      {label}
    </button>
  );
}
