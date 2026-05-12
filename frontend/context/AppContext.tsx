'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { AppState, ChatMessage, ResumedSkills } from '@/types';

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [baseSalary, setBaseSalary] = useState(70000);
  const [negotiatedSalary, setNegotiatedSalary] = useState(70000);
  const [resumeSkills, setResumeSkills] = useState<ResumedSkills | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const addChatMessage = (msg: ChatMessage) =>
    setChatHistory((prev) => [...prev, msg]);

  const resetChat = () => setChatHistory([]);

  return (
    <AppContext.Provider
      value={{
        baseSalary,
        negotiatedSalary,
        resumeSkills,
        chatHistory,
        setBaseSalary,
        setNegotiatedSalary,
        setResumeSkills,
        addChatMessage,
        resetChat,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
