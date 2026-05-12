'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, VolumeX, PhoneOff, AlignLeft, Target, TrendingUp, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { ChatMessage } from '@/types';

type ConnectionState = 'idle' | 'listening' | 'thinking' | 'speaking';

const JORDAN_MOODS = [
  { label: 'Welcoming', emoji: '😊', color: 'text-teal-600',   bg: 'bg-teal-50 border-teal-200' },
  { label: 'Holding firm', emoji: '🤔', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  { label: 'Considering', emoji: '💬', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  { label: 'Open to deal', emoji: '🤝', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
];

const VOICE_PHRASES = [
  { label: 'Anchor High', text: 'Based on my research, I was targeting a higher range — around [X].' },
  { label: 'Cite Data', text: "I've looked at Glassdoor, LinkedIn Salary, and Levels.fyi — the market median is higher." },
  { label: 'Competing Offer', text: "I do have another offer on the table, which is helping me weigh my options." },
  { label: 'Expand Package', text: "If the base is firm, could we look at a signing bonus or equity?" },
  { label: 'Buy Time', text: "Could I have 24 hours to review the complete offer letter before deciding?" },
];

const VOICE_TIPS = [
  'Speak at 80% of your normal pace — slower feels more confident.',
  'Pause 1–2 seconds before responding. Silence signals calm authority.',
  "Say a number first, reason second. Don't lead with apologies.",
  'Never ask "is there any flexibility?" — state what you need instead.',
];

async function playPCMAudio(b64: string, mime: string, onEnd?: () => void): Promise<void> {
  try {
    const rateMatch = mime.match(/rate=(\d+)/);
    const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;

    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate });
    const samples = bytes.byteLength / 2;
    const audioBuf = audioCtx.createBuffer(1, samples, sampleRate);
    const channel = audioBuf.getChannelData(0);
    const view = new DataView(bytes.buffer);
    for (let i = 0; i < samples; i++) {
      channel[i] = view.getInt16(i * 2, true) / 32768;
    }
    const src = audioCtx.createBufferSource();
    src.buffer = audioBuf;
    src.connect(audioCtx.destination);
    src.onended = () => { audioCtx.close(); onEnd?.(); };
    src.start();
  } catch {
    onEnd?.();
  }
}

export function HardMode() {
  const router = useRouter();
  const { baseSalary, setNegotiatedSalary, resetChat } = useApp();
  const [state, setState] = useState<ConnectionState>('idle');
  const [transcript, setTranscript] = useState<{ speaker: 'you' | 'recruiter'; text: string }[]>([]);
  const [muted, setMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [done, setDone] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(baseSalary);
  const [copiedPhrase, setCopiedPhrase] = useState<string | null>(null);
  const [usingAIVoice, setUsingAIVoice] = useState(true);
  const historyRef = useRef<ChatMessage[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const maxBudget = Math.round(baseSalary * 1.18);

  const userTurns = historyRef.current.filter(m => m.role === 'user').length;
  const gain = currentOffer - baseSalary;
  const gainPct = ((gain / baseSalary) * 100).toFixed(1);
  const jordanMood = JORDAN_MOODS[Math.min(userTurns, JORDAN_MOODS.length - 1)];

  useEffect(() => {
    resetChat();
    synthRef.current = window.speechSynthesis;
    return () => {
      recognitionRef.current?.abort();
      synthRef.current?.cancel();
    };
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const speakFallback = useCallback((text: string, onEnd?: () => void) => {
    if (!synthRef.current) { onEnd?.(); return; }
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.0; utt.pitch = 1.05;
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Samantha') || v.name.includes('Karen') ||
      v.name.includes('Google US English Female') || v.name.includes('Zira')
    );
    if (preferred) utt.voice = preferred;
    utt.onend = () => onEnd?.();
    setState('speaking');
    synthRef.current.speak(utt);
  }, []);

  const speak = useCallback(async (text: string, onEnd?: () => void) => {
    if (muted) { onEnd?.(); return; }
    setState('speaking');

    if (usingAIVoice) {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12000);
        const res = await fetch(`${apiBase}/api/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: 'Kore' }),
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
          const { audio, mime } = await res.json();
          await playPCMAudio(audio, mime, onEnd);
          return;
        }
      } catch {
        // fall through to browser TTS
      }
      setUsingAIVoice(false); // disable AI voice if it fails consistently
    }

    speakFallback(text, onEnd);
  }, [muted, usingAIVoice, speakFallback]);

  const sendToAI = useCallback(async (userText: string) => {
    setState('thinking');
    const userMsg: ChatMessage = { role: 'user', content: userText };
    historyRef.current = [...historyRef.current, userMsg];
    setTranscript(t => [...t, { speaker: 'you', text: userText }]);

    try {
      const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      const res = await fetch(`${base}/api/chat-negotiation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyRef.current, baseSalary, maxBudget }),
      });
      const { reply } = await res.json();
      const aiMsg: ChatMessage = { role: 'assistant', content: reply };
      historyRef.current = [...historyRef.current, aiMsg];
      setTranscript(t => [...t, { speaker: 'recruiter', text: reply }]);

      const match = reply.match(/\$[\d,]+/g);
      if (match) {
        const amounts = match.map((s: string) => parseInt(s.replace(/[$,]/g, '')));
        const highest = Math.max(...amounts);
        if (highest > baseSalary && highest <= maxBudget) {
          setCurrentOffer(highest);
          setNegotiatedSalary(highest);
        }
      }

      speak(reply, () => setState('idle'));
    } catch {
      speak("I'm having a connection issue — let's circle back in a moment.", () => setState('idle'));
    }
  }, [baseSalary, maxBudget, speak, setNegotiatedSalary]);

  const startListening = useCallback(() => {
    const hasSR = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    if (!hasSR) {
      alert('Speech recognition requires Chrome. Please open this page in Chrome.');
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: new () => SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => setState('listening');
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[0][0].transcript;
      if (text.trim()) sendToAI(text.trim());
    };
    recognition.onerror = () => setState('idle');
    recognition.onend = () => { if (state === 'listening') setState('idle'); };
    recognitionRef.current = recognition;
    recognition.start();
  }, [sendToAI, state]);

  const toggleMic = () => {
    if (state === 'listening') {
      recognitionRef.current?.stop();
      setState('idle');
    } else if (state === 'idle') {
      startListening();
    }
  };

  const endCall = () => {
    recognitionRef.current?.abort();
    synthRef.current?.cancel();
    setDone(true);
  };

  const copyPhrase = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedPhrase(text);
    setTimeout(() => setCopiedPhrase(null), 2000);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#faf5fa] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.35 }}
          className="flex flex-col items-center text-center gap-7 max-w-sm w-full"
        >
          {/* badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="inline-flex items-center gap-2 bg-white border border-violet-200 rounded-full px-4 py-1.5 text-xs text-violet-700 font-semibold tracking-widest shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            ALL THREE LEVELS DONE
          </motion.div>

          {/* trophy */}
          <motion.div
            initial={{ scale: 0.3, rotate: -15, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.55, delay: 0.1 }}
            className="text-8xl"
          >
            🏆
          </motion.div>

          {/* headline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-orange-400 mb-3">
              Gauntlet Complete!
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              You&apos;ve conquered all three difficulty levels — guided choices, live chat, and voice negotiation.
              Now see how your salary compounds into real wealth.
            </p>
          </motion.div>

          {/* result card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', bounce: 0.3 }}
            className="w-full bg-white border border-violet-200 rounded-2xl p-5 shadow-md shadow-violet-100"
          >
            <p className="text-violet-600 text-[10px] font-bold uppercase tracking-widest mb-2">What you practiced</p>
            <div className="flex justify-around text-center">
              {[
                { emoji: '🌱', label: 'Easy', sub: 'Decision tree' },
                { emoji: '💬', label: 'Medium', sub: 'Text chat' },
                { emoji: '🎤', label: 'Hard', sub: 'Voice' },
              ].map((m) => (
                <div key={m.label}>
                  <div className="text-2xl mb-1">{m.emoji}</div>
                  <p className="text-slate-900 text-xs font-semibold">{m.label}</p>
                  <p className="text-slate-400 text-[10px]">{m.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="w-full"
          >
            <Button onClick={() => router.push('/invest')} variant="secondary" className="w-full py-4 text-base">
              See Your Investment Impact →
            </Button>
            <p className="text-slate-400 text-xs mt-3">
              See how your negotiated salary compounds over 10 years
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const stateLabel: Record<ConnectionState, string> = {
    idle: 'Tap mic to speak',
    listening: 'Listening…',
    thinking: 'Jordan is thinking…',
    speaking: 'Jordan is speaking…',
  };

  const ringClass: Record<ConnectionState, string> = {
    idle:      'border-red-700/50',
    listening: 'border-red-400',
    thinking:  'border-violet-500',
    speaking:  'border-orange-400',
  };

  return (
    <div className="min-h-screen bg-[#faf5fa] lg:flex lg:justify-center lg:items-stretch">

      {/* ── LEFT SIDEBAR (desktop) ─────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-violet-200/60 bg-white pt-10 px-5 pb-6 gap-6 sticky top-0 h-screen overflow-y-auto">

        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Call Intel</p>
          <div className="bg-white border border-violet-200 rounded-2xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-700 to-red-900 rounded-lg flex items-center justify-center text-xs font-bold text-white">AT</div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Apex Tech</p>
                <p className="text-xs text-slate-500">Series C · Voice round</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-violet-100">
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Initial offer</p>
                <p className="text-sm font-bold text-slate-900">${baseSalary.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Rounds</p>
                <p className="text-sm font-bold text-slate-900">{userTurns} / 8</p>
              </div>
            </div>
          </div>
        </div>

        {/* Jordan's mood */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jordan's Mood</p>
          <motion.div
            key={jordanMood.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${jordanMood.bg}`}
          >
            <span className="text-base">{jordanMood.emoji}</span>
            <span className={`text-xs font-semibold ${jordanMood.color}`}>{jordanMood.label}</span>
          </motion.div>
        </div>

        {/* Live offer */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Offer on Table</p>
          <div className="bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target size={13} className="text-violet-600" />
              <span className="text-xs text-slate-500">Current</span>
            </div>
            <span className="text-sm font-bold text-violet-600">${currentOffer.toLocaleString()}</span>
          </div>
          {gain > 0 && (
            <div className="flex items-center gap-1.5 pl-1">
              <TrendingUp size={12} className="text-green-600" />
              <span className="text-xs text-green-600 font-semibold">+${gain.toLocaleString()} (+{gainPct}%)</span>
            </div>
          )}
        </div>

        {/* AI Voice badge */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Voice Engine</p>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
            usingAIVoice
              ? 'bg-violet-50 border-violet-200'
              : 'bg-white border-slate-200'
          }`}>
            <Sparkles size={12} className={usingAIVoice ? 'text-violet-600' : 'text-slate-400'} />
            <span className={`text-xs font-medium ${usingAIVoice ? 'text-violet-600' : 'text-slate-500'}`}>
              {usingAIVoice ? 'Gemini AI Voice' : 'Browser Voice'}
            </span>
          </div>
        </div>

        {/* Live transcript */}
        <div className="flex-1 flex flex-col min-h-0 space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Transcript</p>
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {transcript.length === 0 ? (
              <p className="text-xs text-slate-600 italic">Your conversation will appear here…</p>
            ) : (
              transcript.map((t, i) => (
                <div key={i} className={`text-xs leading-relaxed p-2 rounded-lg ${
                  t.speaker === 'you'
                    ? 'bg-violet-50 border border-violet-200 text-violet-700'
                    : 'bg-white border border-violet-200 text-slate-600'
                }`}>
                  <span className="font-semibold text-[10px] uppercase tracking-wider block mb-0.5 opacity-60">
                    {t.speaker === 'you' ? 'You' : 'Jordan'}
                  </span>
                  {t.text}
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      </aside>

      {/* ── CENTER: Call UI ───────────────────────────────────── */}
      <div className="flex flex-col min-h-screen w-full lg:w-[480px] lg:shrink-0">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-10 pb-4 border-b border-violet-200/60">
          <div className="w-10 h-10 bg-red-900 rounded-2xl flex items-center justify-center">
            <Mic size={18} className="text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-slate-900 font-semibold text-sm">Voice Negotiation</p>
            <div className="flex items-center gap-1.5">
              {usingAIVoice && <Sparkles size={10} className="text-violet-600" />}
              <p className="text-slate-500 text-xs">{usingAIVoice ? 'Gemini AI Voice' : 'Browser Voice'}</p>
            </div>
          </div>
          <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">HARD</span>
        </div>

        {/* Mobile stats strip */}
        <div className="lg:hidden px-4 py-3 bg-violet-50/60 border-b border-violet-200/60 grid grid-cols-3 gap-2">
          <div>
            <p className="text-xs text-slate-500">Offer</p>
            <p className="text-sm font-bold text-slate-900">${currentOffer.toLocaleString()}</p>
          </div>
          <div className="border-x border-violet-200/60 px-2">
            <p className="text-xs text-slate-500">Gained</p>
            <p className={`text-sm font-bold ${gain > 0 ? 'text-green-600' : 'text-slate-500'}`}>
              {gain > 0 ? `+$${gain.toLocaleString()}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Rounds</p>
            <p className="text-sm font-bold text-slate-900">{userTurns} / 8</p>
          </div>
        </div>

        {/* Main call area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
          {/* Avatar ring */}
          <div className="relative">
            <motion.div
              animate={state === 'speaking' ? { scale: [1, 1.07, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.3 }}
              className={`w-40 h-40 rounded-full border-2 ${ringClass[state]} flex items-center justify-center bg-gradient-to-br from-red-900/60 to-purple-900/60`}
            >
              <div className={`w-32 h-32 rounded-full border ${ringClass[state]} flex items-center justify-center bg-gradient-to-br from-red-800/80 to-purple-800/80`}>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-700 to-purple-800 flex items-center justify-center text-4xl">
                  🤖
                </div>
              </div>
            </motion.div>
            {state === 'speaking' && (
              <div className="absolute inset-0 rounded-full border-2 border-orange-400/30 animate-ping" />
            )}
            {state === 'listening' && (
              <div className="absolute inset-0 rounded-full border-2 border-red-400/40 animate-ping" />
            )}
          </div>

          <div className="text-center">
            <p className="text-slate-900 text-xl font-semibold">Jordan — AI Recruiter</p>
            <p className="text-slate-500 text-sm mt-1">{stateLabel[state]}</p>
          </div>

          {/* Mobile transcript */}
          <AnimatePresence>
            {showTranscript && transcript.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden w-full bg-violet-50 border border-violet-200 rounded-2xl p-4 max-h-40 overflow-y-auto space-y-2"
              >
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Transcript</p>
                {transcript.slice(-4).map((t, i) => (
                  <p key={i} className={`text-xs leading-relaxed ${t.speaker === 'you' ? 'text-violet-700' : 'text-slate-600'}`}>
                    <span className="font-semibold">{t.speaker === 'you' ? 'You: ' : 'Jordan: '}</span>
                    {t.text}
                  </p>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {transcript.length === 0 && (
            <p className="text-slate-600 text-sm text-center italic px-4">
              Tap the mic and speak naturally. Jordan will respond with an AI-generated voice.
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4 pb-10">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={toggleMic}
            disabled={state === 'thinking' || state === 'speaking'}
            className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-200 disabled:opacity-40 ${
              state === 'listening'
                ? 'bg-red-500 shadow-lg shadow-red-500/40'
                : 'bg-white border border-red-300 hover:border-red-500'
            }`}
          >
            <Mic size={28} className={state === 'listening' ? 'text-white animate-pulse' : 'text-red-400'} />
          </motion.button>
          <p className="text-slate-500 text-xs">{stateLabel[state]}</p>

          <div className="flex gap-5 mt-1">
            <button
              onClick={() => setMuted(m => !m)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors border ${
                muted ? 'bg-slate-300 border-slate-400' : 'bg-white border-slate-300 hover:bg-slate-50'
              }`}
              title={muted ? 'Unmute Jordan' : 'Mute Jordan'}
            >
              {muted ? <VolumeX size={18} className="text-slate-400" /> : <Volume2 size={18} className="text-slate-600" />}
            </button>
            <button
              onClick={endCall}
              className="w-12 h-12 rounded-full bg-white hover:bg-red-50 border border-slate-300 hover:border-red-400 flex items-center justify-center transition-colors"
              title="End call"
            >
              <PhoneOff size={18} className="text-red-400" />
            </button>
            <button
              onClick={() => setShowTranscript(s => !s)}
              className={`lg:hidden w-12 h-12 rounded-full flex items-center justify-center transition-colors border ${
                showTranscript ? 'bg-violet-600 border-violet-500' : 'bg-white border-slate-300 hover:bg-violet-50'
              }`}
              title="Toggle transcript"
            >
              <AlignLeft size={18} className={showTranscript ? 'text-white' : 'text-slate-600'} />
            </button>
          </div>

          {userTurns >= 8 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
              <Button onClick={endCall} variant="secondary" className="px-8">
                End Call & See Results
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── RIGHT SIDEBAR (desktop) ───────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-l border-violet-200/60 bg-white pt-10 px-5 pb-6 gap-6 sticky top-0 h-screen overflow-y-auto">

        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Voice Coach</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Click any phrase to copy it — speak it naturally, don't read it word-for-word.
          </p>
        </div>

        {/* Power phrases */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Power Phrases</p>
          {VOICE_PHRASES.map((p) => (
            <button
              key={p.label}
              onClick={() => copyPhrase(p.text)}
              className="w-full text-left bg-white hover:bg-violet-50 border border-violet-200 hover:border-violet-400 rounded-xl p-3 transition-colors group shadow-sm"
            >
              <p className="text-xs font-semibold text-slate-900 mb-1">{p.label}</p>
              <p className="text-[10px] text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                "{p.text}"
              </p>
              {copiedPhrase === p.text && (
                <p className="text-[10px] text-green-600 mt-1 font-medium">✓ Copied to clipboard</p>
              )}
            </button>
          ))}
        </div>

        {/* Voice tips */}
        <div className="mt-auto space-y-2 pt-4 border-t border-violet-200/60">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Voice Tips</p>
          {VOICE_TIPS.map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-violet-600 text-[10px] font-bold mt-0.5 shrink-0">{i + 1}</span>
              <p className="text-[10px] text-slate-500 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
