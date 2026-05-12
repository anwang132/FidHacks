'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';

const STATS = [
  {
    stat: '$500k',
    context: 'Not negotiating your first salary can cost women an average of $500,000 over their career.',
    emoji: '💸',
    label: 'Career impact',
    color: 'from-violet-500 to-pink-400',
  },
  {
    stat: '85%',
    context: '85% of people who negotiate receive at least some of what they ask for — yet only 37% of women negotiate every time.',
    emoji: '📊',
    label: 'Success rate',
    color: 'from-teal-500 to-violet-400',
  },
  {
    stat: '7%',
    context: 'A 7% salary increase in your 20s compounds to hundreds of thousands by retirement thanks to raises, bonuses, and 401k matches all tied to base salary.',
    emoji: '📈',
    label: 'Compounding advantage',
    color: 'from-orange-400 to-violet-500',
  },
];

const DOTS = [
  { top: '8%',  left: '6%',  size: 48, delay: 0 },
  { top: '15%', left: '88%', size: 32, delay: 0.4 },
  { top: '75%', left: '5%',  size: 24, delay: 0.2 },
  { top: '80%', left: '90%', size: 40, delay: 0.6 },
  { top: '45%', left: '3%',  size: 16, delay: 0.8 },
  { top: '50%', left: '93%', size: 20, delay: 0.3 },
];

interface LockerRoomProps {
  room: 1 | 2;
}

export function LockerRoom({ room }: LockerRoomProps) {
  const router = useRouter();
  const { negotiatedSalary } = useApp();

  const stat = STATS[room - 1];
  const nextPath  = room === 1 ? '/negotiate/medium' : '/negotiate/hard';
  const nextLabel = room === 1 ? 'Ready for Text Chat? (Medium)' : 'Ready for Voice Mode? (Hard)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #fae4f9 0%, #faf5fa 40%, #dbf0e4 100%)' }}
    >
      {/* Decorative floating circles */}
      {DOTS.map((d, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-violet-300/20 pointer-events-none"
          style={{ top: d.top, left: d.left, width: d.size, height: d.size }}
          animate={{ y: [0, -12, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4 + i, repeat: Infinity, delay: d.delay, ease: 'easeInOut' }}
        />
      ))}

      <div className="max-w-sm w-full text-center space-y-7 relative">

        {/* Level chip */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="inline-flex items-center gap-2 bg-white/80 border border-violet-200 rounded-full px-4 py-1.5 text-xs text-violet-700 font-semibold tracking-widest shadow-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          LEVEL {room} COMPLETE
        </motion.div>

        {/* Big emoji */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', bounce: 0.55, delay: 0.1 }}
          className="text-8xl"
        >
          {stat.emoji}
        </motion.div>

        {/* Did you know */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <div className="inline-flex items-center gap-2 bg-violet-100 rounded-full px-3 py-1 mb-1">
            <span className="text-[10px] text-violet-600 font-bold uppercase tracking-widest">Did You Know?</span>
          </div>
          <p className={`text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}>
            {stat.stat}
          </p>
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest">{stat.label}</p>
          <p className="text-slate-600 text-sm leading-relaxed pt-1">{stat.context}</p>
        </motion.div>

        {/* Salary card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', bounce: 0.3 }}
          className="bg-white border border-violet-200 rounded-2xl p-5 shadow-md shadow-violet-100"
        >
          <p className="text-violet-600 text-[10px] font-bold uppercase tracking-widest mb-1">Your Salary So Far</p>
          <p className="text-4xl font-black text-slate-900">${negotiatedSalary.toLocaleString()}</p>
          <div className="mt-2 h-1 rounded-full bg-gradient-to-r from-violet-400 to-teal-400 opacity-60" />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button onClick={() => router.push(nextPath)} variant="secondary" className="w-full py-4 text-base">
            {nextLabel} →
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
