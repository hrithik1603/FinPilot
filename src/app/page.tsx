"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ChatArea } from "@/components/layout/ChatArea";
import { InputBar } from "@/components/layout/InputBar";
import { RightPanel } from "@/components/layout/RightPanel";
import { UserContextModal } from "@/components/onboarding/UserContextModal";

export type StructuredResponse = {
  title: string;
  summary: string;
  detailed_explanation: string[];
  example: {
    description: string;
    table_data: Record<string, string>[];
  };
  practical_notes: string[];
  sources: string[];
  confidence: 'high' | 'medium' | 'low';
  needs_clarification: boolean;
  out_of_scope: boolean;
  correction_hint: string;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string | StructuredResponse;
};

export type ChatSession = {
  id: string;
  title: string;
  created_at: string;
};

export type Module = 'general' | 'accounting' | 'reporting' | 'laws' | 'taxation' | 'fpa' | 'treasury';
export type Mode = 'standard' | 'expert';

export default function Home() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module>('general');
  const [mode, setMode] = useState<Mode>('expert');
  const [lastResponse, setLastResponse] = useState<StructuredResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chat history on mount
  useEffect(() => {
    if (user?.id) {
      loadChatHistory();
    }
  }, [user?.id]);

  const loadChatHistory = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/chats?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const createNewChat = async (firstMessage?: string) => {
    if (!user?.id) return null;
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: firstMessage ? firstMessage.slice(0, 80) : 'New Chat',
        }),
      });
      if (res.ok) {
        const chat = await res.json();
        setChatId(chat.id);
        setChatHistory(prev => [chat, ...prev]);
        return chat.id;
      }
    } catch (err) {
      console.error('Failed to create chat:', err);
    }
    return null;
  };

  const handleNewChat = () => {
    setChatId(null);
    setMessages([]);
    setLastResponse(null);
  };

  const handleSelectChat = async (id: string) => {
    setChatId(id);
    setMessages([]);
    setLastResponse(null);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/chats/${id}/messages`);
      if (res.ok) {
        const data = await res.json();
        const loaded: Message[] = data.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.role === 'assistant' && typeof m.content === 'object' ? m.content : (m.content?.text || m.content || ''),
        }));
        setMessages(loaded);
        // Set last response for right panel
        const lastAssistant = loaded.filter(m => m.role === 'assistant').pop();
        if (lastAssistant && typeof lastAssistant.content !== 'string') {
          setLastResponse(lastAssistant.content as StructuredResponse);
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMessage = async (activeChatId: string, role: string, content: any) => {
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: activeChatId, role, content }),
      });
    } catch (err) {
      console.error('Failed to save message:', err);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Create chat if first message
    let activeChatId = chatId;
    if (!activeChatId) {
      activeChatId = await createNewChat(text);
    }

    try {
      // Save user message to DB
      if (activeChatId) {
        saveMessage(activeChatId, 'user', { text });
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          message: text,
          module: selectedModule,
          mode,
          history: messages.map(m => ({
            role: m.role,
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
          }))
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(errBody.error || `Server returned ${res.status}`);
      }
      const data: StructuredResponse = await res.json();

      // Validate that we got a proper structured response
      if (!data.title && !data.summary) {
        throw new Error('Received an empty response from the AI');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setLastResponse(data);

      // Save assistant message to DB
      if (activeChatId) {
        saveMessage(activeChatId, 'assistant', data);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      // Show the error as an assistant message so the user sees it
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: {
          title: 'Something went wrong',
          summary: error.message || 'An unexpected error occurred. Please try again.',
          detailed_explanation: ['The AI was unable to generate a response. This could be due to a temporary API outage, rate limiting, or a network issue.', 'Please try again in a moment. If the issue persists, try rephrasing your question.'],
          example: { description: '', table_data: [] },
          practical_notes: ['Try refreshing the page if the issue continues.'],
          sources: [],
          confidence: 'low' as const,
          needs_clarification: false,
          out_of_scope: false,
          correction_hint: '',
        },
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadTrigger = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex h-screen bg-[var(--color-bg-main)] text-white overflow-hidden font-sans">
      <UserContextModal />
      <Sidebar
        chatHistory={chatHistory}
        activeChatId={chatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        selectedModule={selectedModule}
        onSelectModule={setSelectedModule}
        mode={mode}
        onSetMode={setMode}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          selectedModule={selectedModule}
          onSelectModule={setSelectedModule}
          mode={mode}
          onSetMode={setMode}
          onUpload={handleUploadTrigger}
        />
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--color-border-subtle)]">
            <ChatArea messages={messages} isLoading={isLoading} onActionClick={handleSendMessage} />
            <InputBar
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              fileInputRef={fileInputRef}
            />
          </div>
          <RightPanel lastResponse={lastResponse} />
        </div>
      </div>
    </div>
  );
}
