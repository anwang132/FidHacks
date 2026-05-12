'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Lightbulb, X, ChevronUp, ChevronDown, TrendingUp, Target, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { ChatMessage } from '@/types';

const HINTS = [
  {
    icon: '🎯',
    label: 'Anchor High',
    tip: 'Start 10–20% above target. The first number anchors the whole conversation.',
    phrase:
      "Based on my research on Glassdoor and LinkedIn Salary, the market rate for this role is typically higher. I'm targeting a range above the current offer — can we work toward that?",
  },
  {
    icon: '📊',
    label: 'Cite Market Data',
    tip: 'Benchmarks are your strongest card. Recruiters respect candidates who did their homework.',
    phrase:
      "I've benchmarked this role across Glassdoor, Levels.fyi, and LinkedIn Salary — the median comp in this market is higher than the current number. I'd love to align closer to that.",
  },
  {
    icon: '💼',
    label: 'Competing Offer',
    tip: 'A competing offer creates urgency — even a lower one shifts the power dynamic.',
    phrase:
      "I do have another offer I'm actively weighing. Is there flexibility to get closer to my target so I can make this an easy decision?",
  },
  {
    icon: '🎁',
    label: 'Expand the Package',
    tip: 'When base is stuck, pivot to signing bonus, equity, remote days, or L&D budget.',
    phrase:
      "If the base is firm, could we look at the full package? A signing bonus or additional equity would help bridge the gap for me.",
  },
];

const JORDAN_STATES = [
  { label: 'Excited to connect', emoji: '😊', color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200' },
  { label: 'Holding budget line', emoji: '🤔', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  { label: 'Open to discussion', emoji: '💬', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  { label: 'Feeling flexible', emoji: '🤝', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
];

const MAX_BUDGET_MULTIPLIER = 1.18;

export function MediumMode() {
  const router = useRouter();
  const { baseSalary, negotiatedSalary, setNegotiatedSalary, addChatMessage, resetChat } = useApp();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [localHistory, setLocalHistory] = useState<ChatMessage[]>([]);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [offerLog, setOfferLog] = useState<number[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const maxBudget = Math.round(baseSalary * MAX_BUDGET_MULTIPLIER);
  const gain = negotiatedSalary - baseSalary;
  const gainPct = ((gain / baseSalary) * 100).toFixed(1);
  const userTurns = localHistory.filter((m) => m.role === 'user').length;
  const jordanState = JORDAN_STATES[Math.min(userTurns, JORDAN_STATES.length - 1)];

  // Gauge: 0% = baseSalary, 100% = baseSalary * 1.25
  const gaugeTop = Math.round(baseSalary * 1.25);
  const gaugeMid = Math.round(baseSalary * 1.12);
  const gaugePct = Math.min(
    100,
    Math.max(0, gain === 0 ? 0 : ((negotiatedSalary - baseSalary) / (gaugeTop - baseSalary)) * 100),
  );

  useEffect(() => { resetChat(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localHistory, loading]);

  useEffect(() => {
    if (negotiatedSalary > baseSalary) {
      setOfferLog((prev) => {
        const last = prev[prev.length - 1];
        return last === negotiatedSalary ? prev : [...prev, negotiatedSalary];
      });
    }
  }, [negotiatedSalary, baseSalary]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const newHistory = [...localHistory, userMsg];
    setLocalHistory(newHistory);
    addChatMessage(userMsg);
    setInput('');
    setLoading(true);
    setHintsOpen(false);

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
        content: '⚠️ Connection issue. Make sure the backend is running on port 8000, then try again.',
      };
      setLocalHistory((h) => [...h, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const usePhrase = (phrase: string) => {
    setInput(phrase);
    setHintsOpen(false);
  };

  const exitRound = () => router.push('/negotiate');
  const finishRound = () => router.push('/locker-room/2');

  return (
    <div className="min-h-screen bg-[#faf5fa] lg:flex lg:justify-center lg:items-stretch">

      {/* ── LEFT SIDEBAR (desktop only) ─────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-violet-200/60 bg-white pt-10 px-5 pb-6 gap-6 sticky top-0 h-screen overflow-y-auto">

        {/* Scenario card */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">Scenario</p>
          <div className="bg-white border border-violet-200 rounded-2xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center text-xs font-bold text-white">AT</div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Apex Tech</p>
                <p className="text-xs text-slate-500">Series C · ~400 employees</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-violet-100">
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Initial offer</p>
                <p className="text-sm font-bold text-slate-900">${baseSalary.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Role level</p>
                <p className="text-sm font-bold text-slate-900">Mid-level</p>
              </div>
            </div>
          </div>
        </div>

        {/* Jordan's mood */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jordan's Mood</p>
          <motion.div
            key={jordanState.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${jordanState.bg}`}
          >
            <span className="text-base">{jordanState.emoji}</span>
            <span className={`text-xs font-semibold ${jordanState.color}`}>{jordanState.label}</span>
          </motion.div>
          <p className="text-xs text-slate-600 pl-1">Turn {userTurns} of negotiation</p>
        </div>

        {/* Salary gauge */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Offer Progress</p>
          <div className="flex gap-3 items-stretch" style={{ height: 148 }}>
            {/* Vertical bar */}
            <div className="relative w-6 bg-violet-100 rounded-full overflow-hidden shrink-0">
              <motion.div
                className="absolute bottom-0 left-0 right-0 rounded-full"
                style={{
                  background: 'linear-gradient(to top, #7c3aed, #a78bfa)',
                }}
                initial={{ height: '0%' }}
                animate={{ height: `${gaugePct}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
              {/* Midpoint marker */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-slate-600/60"
                style={{ bottom: '48%' }}
              />
            </div>
            {/* Labels aligned to top / mid / bottom */}
            <div className="flex flex-col justify-between flex-1">
              <div>
                <p className="text-[10px] text-slate-500">Stretch</p>
                <p className="text-xs text-slate-900 font-semibold">${gaugeTop.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Market mid</p>
                <p className="text-xs text-slate-400">${gaugeMid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Base offer</p>
                <p className="text-xs text-slate-900 font-semibold">${baseSalary.toLocaleString()}</p>
              </div>
            </div>
          </div>
          {/* Current offer callout */}
          <div className="bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">Current offer</span>
            <span className="text-sm font-bold text-violet-600">${negotiatedSalary.toLocaleString()}</span>
          </div>
          {gain > 0 && (
            <p className="text-xs text-green-600 font-semibold pl-1">
              +${gain.toLocaleString()} gained (+{gainPct}%)
            </p>
          )}
        </div>

        {/* Offer history log */}
        {offerLog.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Offer History</p>
            <div className="space-y-1.5">
              {offerLog.map((offer, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                  <p className="text-xs text-slate-900">${offer.toLocaleString()}</p>
                  {i > 0 && (
                    <span className="text-[10px] text-green-400 font-medium">
                      +${(offer - offerLog[i - 1]).toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ── CENTER: CHAT PANEL ───────────────────────────────────── */}
      <div className="flex flex-col min-h-screen w-full lg:w-[480px] lg:shrink-0">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-10 pb-4 border-b border-violet-200/60">
          <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            JR
          </div>
          <div className="flex-1">
            <p className="text-slate-900 font-semibold text-sm">Jordan — AI Recruiter</p>
            <p className="text-green-600 text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
              Active now
            </p>
          </div>
          <span className="bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full">MEDIUM</span>
          <button
            onClick={exitRound}
            title="Leave negotiation"
            className="ml-1 w-8 h-8 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-full flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-slate-400" />
          </button>
        </div>

        {/* Stats strip — mobile only (desktop sees left sidebar) */}
        <div className="lg:hidden px-4 py-3 bg-violet-50/60 border-b border-violet-200/60 grid grid-cols-3 gap-2">
          <div className="flex items-center gap-2">
            <Target size={13} className="text-violet-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Offer</p>
              <p className="text-sm font-bold text-slate-900">${negotiatedSalary.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 border-x border-violet-200/60 px-2">
            <TrendingUp size={13} className={gain > 0 ? 'text-green-600 shrink-0' : 'text-slate-400 shrink-0'} />
            <div>
              <p className="text-xs text-slate-500">Gained</p>
              <p className={`text-sm font-bold ${gain > 0 ? 'text-green-600' : 'text-slate-500'}`}>
                {gain > 0 ? `+$${gain.toLocaleString()}` : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-1">
            <Clock size={13} className="text-slate-500 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Rounds</p>
              <p className="text-sm font-bold text-slate-900">{userTurns}</p>
            </div>
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {/* Jordan's opening messages */}
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

          {/* Briefing card — mobile only, shown before first message */}
          {localHistory.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:hidden bg-violet-50 border border-violet-200 rounded-2xl p-4 space-y-3"
            >
              <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Your Scenario</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">Company</p>
                  <p className="text-sm text-slate-900 font-semibold">Apex Tech</p>
                  <p className="text-xs text-slate-500">Series C · ~400 employees</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Initial Offer</p>
                  <p className="text-sm text-slate-900 font-semibold">${baseSalary.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Annual base salary</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed border-t border-violet-100 pt-3">
                Jordan has a hidden budget ceiling. Use market data, competing offers, or package pivots to move the number. Tap <span className="text-amber-600">Hints</span> for tactics.
              </p>
            </motion.div>
          )}

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

        {/* Mobile hints panel */}
        <AnimatePresence>
          {hintsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden border-t border-violet-200 bg-white"
            >
              <div className="px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Tactics — tap to insert phrase
                </p>
                {HINTS.map((h) => (
                  <div key={h.label} className="bg-violet-50 rounded-xl p-3 flex gap-3">
                    <span className="text-xl shrink-0 mt-0.5">{h.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900">{h.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{h.tip}</p>
                      <button
                        onClick={() => usePhrase(h.phrase)}
                        className="mt-2 text-xs text-violet-400 hover:text-violet-600 font-medium transition-colors"
                      >
                        Use this phrase →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <div className="px-4 pb-2 pt-3 flex gap-2 items-center border-t border-violet-200/60">
          {/* Hints button — mobile only */}
          <button
            onClick={() => setHintsOpen((v) => !v)}
            className={`lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors shrink-0 border ${
              hintsOpen
                ? 'bg-amber-100 text-amber-700 border-amber-300'
                : 'bg-slate-100 text-slate-500 hover:text-amber-600 border-slate-200'
            }`}
          >
            <Lightbulb size={12} />
            Hints
            {hintsOpen ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Type your response..."
            className="flex-1 bg-white border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-full flex items-center justify-center transition-colors shrink-0"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>

        {/* Exit / Finish row */}
        <div className="px-4 pb-8 pt-2 flex gap-2">
          <button
            onClick={exitRound}
            className="px-4 py-3 text-sm text-slate-500 hover:text-slate-900 border border-slate-300 hover:border-slate-400 rounded-2xl transition-colors shrink-0"
          >
            ← Exit
          </button>
          <AnimatePresence>
            {userTurns >= 2 && (
              <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="flex-1">
                <Button onClick={finishRound} variant="secondary" className="w-full py-3 text-sm">
                  Finish → Locker Room
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── RIGHT SIDEBAR (desktop only) ────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-l border-violet-200/60 bg-white pt-10 px-5 pb-6 gap-5 sticky top-0 h-screen overflow-y-auto">
        <div>
          <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mb-1">Your Playbook</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Click any tactic to load the phrase into your message box.
          </p>
        </div>

        {HINTS.map((h) => (
          <div key={h.label} className="bg-white border border-violet-200 rounded-2xl p-3 flex gap-3 hover:border-violet-400 transition-colors group shadow-sm">
            <span className="text-lg shrink-0 mt-0.5">{h.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900">{h.label}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{h.tip}</p>
              <button
                onClick={() => usePhrase(h.phrase)}
                className="mt-2 text-xs text-violet-400 hover:text-violet-600 font-medium transition-colors group-hover:text-violet-600"
              >
                Use this phrase →
              </button>
            </div>
          </div>
        ))}

        {/* Market context blurb */}
        <div className="mt-auto pt-4 border-t border-violet-200/60 space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Market Context</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Mid-level roles at Series C companies typically land{' '}
            <span className="text-slate-900 font-medium">
              ${Math.round(baseSalary * 1.1).toLocaleString()}–${Math.round(baseSalary * 1.2).toLocaleString()}
            </span>{' '}
            after negotiation.
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            85% of candidates who negotiate receive at least some increase.
          </p>
        </div>
      </aside>
    </div>
  );
}
