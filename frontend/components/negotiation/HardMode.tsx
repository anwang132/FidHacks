'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, PhoneOff, AlignLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { ChatMessage } from '@/types';

type ConnectionState = 'idle' | 'listening' | 'thinking' | 'speaking';

export function HardMode() {
  const router = useRouter();
  const { baseSalary, setNegotiatedSalary, resetChat } = useApp();
  const [state, setState] = useState<ConnectionState>('idle');
  const [transcript, setTranscript] = useState<{ speaker: 'you' | 'recruiter'; text: string }[]>([]);
  const [muted, setMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [done, setDone] = useState(false);
  const historyRef = useRef<ChatMessage[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const maxBudget = Math.round(baseSalary * 1.18);

  useEffect(() => {
    resetChat();
    synthRef.current = window.speechSynthesis;
    return () => {
      recognitionRef.current?.abort();
      synthRef.current?.cancel();
    };
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!synthRef.current || muted) {
      onEnd?.();
      return;
    }
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.05;
    utt.pitch = 1;
    const voices = synthRef.current.getVoices();
    const preferred = voices.find((v) => v.name.includes('Samantha') || v.name.includes('Google US English Female'));
    if (preferred) utt.voice = preferred;
    utt.onend = () => onEnd?.();
    setState('speaking');
    synthRef.current.speak(utt);
  }, [muted]);

  const sendToAI = useCallback(async (userText: string) => {
    setState('thinking');
    const userMsg: ChatMessage = { role: 'user', content: userText };
    historyRef.current = [...historyRef.current, userMsg];
    setTranscript((t) => [...t, { speaker: 'you', text: userText }]);

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
      setTranscript((t) => [...t, { speaker: 'recruiter', text: reply }]);

      const match = reply.match(/\$[\d,]+/g);
      if (match) {
        const amounts = match.map((s: string) => parseInt(s.replace(/[$,]/g, '')));
        const highest = Math.max(...amounts);
        if (highest > baseSalary && highest <= maxBudget) setNegotiatedSalary(highest);
      }

      speak(reply, () => setState('idle'));
    } catch {
      speak("I'm having trouble connecting. Let's try that again.", () => setState('idle'));
    }
  }, [baseSalary, maxBudget, speak, setNegotiatedSalary]);

  const startListening = useCallback(() => {
    const hasSR = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    if (!hasSR) {
      alert('Your browser does not support speech recognition. Please use Chrome.');
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
    recognition.onend = () => {
      if (state === 'listening') setState('idle');
    };

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

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center px-6 py-16 gap-6 max-w-md mx-auto"
      >
        <div className="text-6xl">🏆</div>
        <h2 className="text-2xl font-bold text-white">Gauntlet Complete!</h2>
        <p className="text-slate-400 text-sm">You've trained across all three difficulty levels. Time to see your compound impact.</p>
        <Button onClick={() => router.push('/invest')} variant="secondary" className="w-full max-w-xs py-4 text-base">
          See Your Investment Impact →
        </Button>
      </motion.div>
    );
  }

  const stateLabel: Record<ConnectionState, string> = {
    idle: 'Tap to speak',
    listening: 'Listening...',
    thinking: 'Jordan is thinking...',
    speaking: 'Jordan is speaking...',
  };

  const ringColor: Record<ConnectionState, string> = {
    idle: 'border-red-700/50',
    listening: 'border-red-400',
    thinking: 'border-violet-500',
    speaking: 'border-orange-500',
  };

  return (
    <div className="min-h-screen bg-[#0d0825] flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-4">
        <div className="w-10 h-10 bg-red-900 rounded-2xl flex items-center justify-center">
          <Mic size={18} className="text-red-400" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm">Salary Coach</p>
          <p className="text-slate-500 text-xs">Voice Negotiation</p>
        </div>
        <span className="ml-auto bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">HARD</span>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
        {/* Avatar */}
        <div className="relative">
          <motion.div
            animate={state === 'speaking' ? { scale: [1, 1.08, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className={`w-40 h-40 rounded-full border-2 ${ringColor[state]} flex items-center justify-center bg-gradient-to-br from-red-900/60 to-purple-900/60`}
          >
            <div className={`w-32 h-32 rounded-full border ${ringColor[state]} flex items-center justify-center bg-gradient-to-br from-red-800/80 to-purple-800/80`}>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-700 to-purple-800 flex items-center justify-center text-4xl">
                🤖
              </div>
            </div>
          </motion.div>
          {state === 'speaking' && (
            <div className="absolute inset-0 rounded-full border-2 border-orange-500/30 animate-ping" />
          )}
        </div>

        <div className="text-center">
          <p className="text-white text-xl font-semibold">AI Recruiter</p>
          <p className="text-slate-500 text-sm flex items-center gap-1 justify-center mt-1">
            <span className="w-3 h-3 text-slate-500">⏱</span>
            {state === 'idle' && historyRef.current.length === 0 ? 'Waiting to connect...' : stateLabel[state]}
          </p>
        </div>

        {/* Transcript preview */}
        {showTranscript && transcript.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="w-full bg-slate-900/50 border border-slate-700/30 rounded-2xl p-4 max-h-40 overflow-y-auto space-y-2"
          >
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Live Transcript</p>
            {transcript.map((t, i) => (
              <p key={i} className={`text-xs leading-relaxed ${t.speaker === 'you' ? 'text-violet-300' : 'text-slate-300'}`}>
                <span className="font-semibold">{t.speaker === 'you' ? 'You: ' : 'Jordan: '}</span>
                {t.text}
              </p>
            ))}
          </motion.div>
        )}

        {transcript.length === 0 && (
          <p className="text-slate-600 text-sm text-center italic">
            Your conversation will appear here in real time...
          </p>
        )}
      </div>

      {/* Mic button */}
      <div className="flex flex-col items-center gap-4 pb-12">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={toggleMic}
          disabled={state === 'thinking' || state === 'speaking'}
          className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-200 disabled:opacity-40 ${
            state === 'listening'
              ? 'bg-red-500 shadow-lg shadow-red-500/40'
              : 'bg-slate-800 border border-red-700/40 hover:border-red-500/60'
          }`}
        >
          <Mic size={28} className={state === 'listening' ? 'text-white' : 'text-red-400'} />
        </motion.button>
        <p className="text-slate-500 text-xs">{stateLabel[state]}</p>

        {/* Controls */}
        <div className="flex gap-6 mt-2">
          <button onClick={() => setMuted((m) => !m)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${muted ? 'bg-slate-600' : 'bg-slate-800 hover:bg-slate-700'}`}>
            <Volume2 size={18} className="text-white" />
          </button>
          <button onClick={endCall} className="w-12 h-12 rounded-full bg-slate-800 hover:bg-red-900/60 flex items-center justify-center transition-colors">
            <PhoneOff size={18} className="text-red-400" />
          </button>
          <button onClick={() => setShowTranscript((s) => !s)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${showTranscript ? 'bg-violet-700' : 'bg-slate-800 hover:bg-slate-700'}`}>
            <AlignLeft size={18} className="text-white" />
          </button>
        </div>

        {historyRef.current.length >= 4 && (
          <Button onClick={endCall} variant="secondary" className="mt-2 px-8">
            End Call & See Results
          </Button>
        )}
      </div>
    </div>
  );
}
