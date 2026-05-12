'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Lightbulb } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { ChatMessage } from '@/types';

const TIPS = [
  "Anchor high with a researched range. Don't give a single number first.",
  "Reference market data: Glassdoor, LinkedIn Salary, or Levels.fyi.",
  "Mention competing offers if you have them — they change the dynamic.",
  "Negotiate the full package: signing bonus, remote days, equity.",
];

const MAX_BUDGET_MULTIPLIER = 1.18; // recruiter's secret max

export function MediumMode() {
  const router = useRouter();
  const { baseSalary, negotiatedSalary, setNegotiatedSalary, addChatMessage, chatHistory, resetChat } = useApp();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tipIdx] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [localHistory, setLocalHistory] = useState<ChatMessage[]>([]);
  const [done, setDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const maxBudget = Math.round(baseSalary * MAX_BUDGET_MULTIPLIER);

  useEffect(() => {
    resetChat();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localHistory, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const newHistory = [...localHistory, userMsg];
    setLocalHistory(newHistory);
    addChatMessage(userMsg);
    setInput('');
    setLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(`${apiBase}/api/chat-negotiation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory, baseSalary, maxBudget }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { reply } = await res.json();
      const aiMsg: ChatMessage = { role: 'assistant', content: reply };
      setLocalHistory((h) => [...h, aiMsg]);
      addChatMessage(aiMsg);

      const match = reply.match(/\$[\d,]+/g);
      if (match) {
        const amounts = match.map((s: string) => parseInt(s.replace(/[$,]/g, '')));
        const highest = Math.max(...amounts);
        if (highest > baseSalary && highest <= maxBudget) setNegotiatedSalary(highest);
      }
    } catch {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: "⚠️ I'm having trouble connecting to the AI right now. Make sure the backend server is running on port 8000, then try again.",
      };
      setLocalHistory((h) => [...h, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const finishRound = () => router.push('/locker-room/2');

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-4 border-b border-slate-800/50">
        <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center text-white font-bold text-sm">JR</div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">Jordan — AI Recruiter</p>
          <p className="text-green-400 text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
            Active now
          </p>
        </div>
        <span className="bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full">MEDIUM</span>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Initial recruiter message */}
        <div className="flex justify-start">
          <div className="bg-white text-slate-800 rounded-3xl rounded-tl-sm px-4 py-3 max-w-[80%] shadow-sm">
            <p className="text-sm leading-relaxed">
              Hi! I'm Jordan from Apex Tech. We'd love to move forward with you — congrats on making it to the offer stage! 🎉
            </p>
            <p className="text-slate-400 text-xs mt-1">9:01 AM</p>
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-white text-slate-800 rounded-3xl rounded-tl-sm px-4 py-3 max-w-[80%] shadow-sm">
            <p className="text-sm leading-relaxed">
              Before we send the formal offer letter, I wanted to check in — what salary range are you targeting for this role?
            </p>
            <p className="text-slate-400 text-xs mt-1">9:01 AM</p>
          </div>
        </div>

        <AnimatePresence>
          {localHistory.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-3xl px-4 py-3 max-w-[80%] text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-violet-600 text-white rounded-tr-sm'
                    : 'bg-white text-slate-800 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-3xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Tip bar */}
      <div className="px-4 py-2 border-t border-slate-800/30">
        <div className="flex items-start gap-2 text-xs text-violet-300">
          <Lightbulb size={12} className="mt-0.5 shrink-0 text-yellow-400" />
          <span>{TIPS[tipIdx]}</span>
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-2 flex gap-2 items-center border-t border-slate-800/30">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type your response..."
          className="flex-1 bg-slate-800/50 border border-slate-700/30 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 transition-colors"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="w-10 h-10 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-full flex items-center justify-center transition-colors"
        >
          <Send size={16} className="text-white" />
        </button>
      </div>

      {/* Finish button */}
      {localHistory.length >= 4 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 pb-6"
        >
          <Button onClick={finishRound} variant="secondary" className="w-full py-3">
            Finish Round → Head to Locker Room
          </Button>
        </motion.div>
      )}
    </div>
  );
}
