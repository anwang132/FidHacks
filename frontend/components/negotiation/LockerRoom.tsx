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
  },
  {
    stat: '85%',
    context: '85% of people who negotiate receive at least some of what they ask for — yet only 37% of women negotiate every time.',
    emoji: '📊',
  },
  {
    stat: '7%',
    context: 'A 7% salary increase in your 20s compounds to hundreds of thousands by retirement thanks to raises, bonuses, and 401k matches all tied to base salary.',
    emoji: '📈',
  },
];

interface LockerRoomProps {
  room: 1 | 2;
}

export function LockerRoom({ room }: LockerRoomProps) {
  const router = useRouter();
  const { negotiatedSalary } = useApp();

  const stat = STATS[room - 1];
  const nextPath = room === 1 ? '/negotiate/medium' : '/negotiate/hard';
  const nextLabel = room === 1 ? 'Ready for Text Chat? (Medium)' : 'Ready for Voice Mode? (Hard)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0618] px-6"
    >
      <div className="max-w-sm w-full text-center space-y-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4, delay: 0.1 }}
          className="text-7xl"
        >
          {stat.emoji}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-xs text-violet-400 font-medium tracking-widest mb-2">DID YOU KNOW?</p>
          <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-orange-400 mb-4">
            {stat.stat}
          </p>
          <p className="text-slate-300 text-base leading-relaxed">{stat.context}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-violet-900/30 border border-violet-700/30 rounded-2xl p-4"
        >
          <p className="text-violet-300 text-xs mb-1">SALARY SO FAR</p>
          <p className="text-3xl font-bold text-white">${negotiatedSalary.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
