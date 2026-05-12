'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';

interface Option {
  label: string;
  nextId: string | null;
  updateBase?: number;
  updateBonus?: number;
  feedback: string;
}

interface Node {
  id: string;
  question: string;
  recruiterLine: string;
  options: Option[];
}

interface ChoiceLog {
  q: number;
  label: string;
  quality: 'great' | 'good' | 'fair';
}

function fmt(n: number) {
  return `$${n.toLocaleString()}`;
}

function rateQuality(fb: string): 'great' | 'good' | 'fair' {
  const lower = fb.toLowerCase();
  if (
    lower.includes('perfect') ||
    lower.includes('masterclass') ||
    lower.includes('#1') ||
    lower.includes('exactly the right') ||
    lower.includes('bold and effective') ||
    lower.includes('ideal negotiation')
  ) return 'great';
  if (
    lower.includes('vague') ||
    lower.includes('weak') ||
    lower.includes('without data') ||
    lower.includes("doesn't") ||
    lower.includes('can backfire')
  ) return 'fair';
  return 'good';
}

const NODE_TIPS: Record<string, string> = {
  start: "Your opening sets the frame. Explore before accepting — never say yes immediately.",
  node2_early: "Cite real data sources: Glassdoor, Levels.fyi, LinkedIn Salary. Data = objectivity.",
  node2_soft: "A soft ask without data invites 'no.' Back every request with evidence.",
  node2_anchor: "Anchoring high is proven. The first number shapes the entire conversation.",
  node3_weak: "Specific metrics beat general claims. '15% retention lift' is 10× more powerful than 'strong results'.",
  node3_data: "Frame your value in terms of what you'll do for them, not just what you've done.",
  node3_medium: "Opening the full package conversation early gives you more levers to work with.",
  node3_strong: "With real leverage (competing offer), stay patient. Scarcity increases your value.",
  node4_low: "Even a 3% gain today compounds into thousands over your career baseline.",
  node4_mid: "Counter with a specific round number — it signals you know your worth.",
  node4_high: "Once base is secured, pivot immediately to bonus and equity.",
  node5: "Signing bonuses don't affect your raise baseline — they're purely additive to year 1.",
  node6_bonus: "Frame your bonus ask around a real cost (transition, relocation). Concrete reasons work.",
  node6_equity: "RSU cliff date and vesting schedule determine true risk. Always ask both.",
  node6_remote: "Remote flexibility saves $2k–8k/year in commute costs. It has real dollar value.",
  node7: "L&D budget is almost always negotiable — HR rarely defends it hard.",
  node8: "End with a forward-looking statement about impact. Never just say 'I accept.'",
};

/**
 * 8-question salary negotiation tree.
 *
 * Q1–Q4 determine the negotiated base salary (3 tiers: low / mid / high).
 * Q5–Q6 add a signing bonus via three parallel paths (bonus / equity / remote).
 * Q7    covers professional development & perks.
 * Q8    is the formal close.
 *
 * updateBase  sets the running negotiated salary on non-terminal nodes.
 * updateBonus sets a signing bonus on non-terminal nodes.
 * nextId: null marks final terminal options (Q8 only).
 */
function buildTree(base: number): Node[] {
  const anchor    = Math.round(base * 1.12);
  const competing = Math.round(base * 1.09);
  const mktLow    = Math.round(base * 1.08);
  const mktHigh   = Math.round(base * 1.15);

  const n4Low:  [number, number] = [Math.round(base * 1.03), Math.round(base * 1.05)];
  const n4Mid:  [number, number] = [Math.round(base * 1.07), Math.round(base * 1.08)];
  const n4High: [number, number] = [Math.round(base * 1.10), Math.round(base * 1.12)];

  const bonusSmall  = Math.round(base * 0.03);
  const bonusMedium = Math.round(base * 0.05);
  const bonusLarge  = Math.round(base * 0.08);

  function node4(id: string, pair: [number, number]): Node {
    const [counter, roundUp] = pair;
    return {
      id,
      question: 'QUESTION 4 OF 8',
      recruiterLine: `Good news — the team approved ${fmt(counter)}. How does that feel?`,
      options: [
        {
          label: `${fmt(counter)} works — I appreciate the effort!`,
          nextId: 'node5',
          updateBase: counter,
          feedback: `You locked in ${fmt(counter)}. Accepting gracefully builds goodwill for the rest of the conversation.`,
        },
        {
          label: `I appreciate it! Could we round to ${fmt(roundUp)} to land cleanly?`,
          nextId: 'node5',
          updateBase: roundUp,
          feedback: `That final push landed you ${fmt(roundUp)}. Small asks at the end almost never damage goodwill.`,
        },
      ],
    };
  }

  return [
    // ── Q1: opening ─────────────────────────────────────────
    {
      id: 'start',
      question: 'QUESTION 1 OF 8',
      recruiterLine: `We're thrilled to extend you an offer of ${fmt(base)}. What are your initial thoughts?`,
      options: [
        {
          label: "That's exciting — I'd love to hear more about the full package first.",
          nextId: 'node2_early',
          feedback: "Smart opener — showing enthusiasm while leaving room to negotiate later.",
        },
        {
          label: "Thank you! Is there any flexibility on the base salary?",
          nextId: 'node2_soft',
          feedback: "Good — you asked politely without being confrontational. A safe opening move.",
        },
        {
          label: `I appreciate it! I was targeting ${fmt(anchor)} based on market research.`,
          nextId: 'node2_anchor',
          feedback: "Anchoring high immediately with a specific number is the #1 negotiation tactic.",
        },
      ],
    },

    // ── Q2a: showed enthusiasm, didn't ask yet ──────────────
    {
      id: 'node2_early',
      question: 'QUESTION 2 OF 8',
      recruiterLine: `Love to hear it! The package includes full medical, a 401(k) match, and 15 days PTO. Does ${fmt(base)} as a base feel right to you?`,
      options: [
        {
          label: `It's a great start! I was hoping we could get closer to ${fmt(mktHigh)} based on what I'm seeing on LinkedIn and Glassdoor.`,
          nextId: 'node3_data',
          feedback: "Perfect sequence: enthusiasm first, then ask. This is the ideal negotiation order.",
        },
        {
          label: `I'd love to discuss the base — the market range for this role seems to be ${fmt(mktLow)}–${fmt(mktHigh)}.`,
          nextId: 'node3_data',
          feedback: "Citing a range (not a single number) is psychologically effective. Well done.",
        },
      ],
    },

    // ── Q2b: soft ask ───────────────────────────────────────
    {
      id: 'node2_soft',
      question: 'QUESTION 2 OF 8',
      recruiterLine: `Our band for this level is pretty set at ${fmt(base)}. What's driving the ask?`,
      options: [
        {
          label: `I've researched Glassdoor, LinkedIn Salary, and Levels.fyi — the market is ${fmt(mktLow)}–${fmt(mktHigh)} for this role.`,
          nextId: 'node3_data',
          feedback: "Naming specific data sources makes your ask feel objective, not emotional.",
        },
        {
          label: "My skills and background should command a premium over the standard range.",
          nextId: 'node3_weak',
          feedback: "Vague confidence without data is weak. Always back claims with specifics or numbers.",
        },
      ],
    },

    // ── Q2c: anchored high ──────────────────────────────────
    {
      id: 'node2_anchor',
      question: 'QUESTION 2 OF 8',
      recruiterLine: `I appreciate the directness! That's above our usual band. What's behind the ${fmt(anchor)} target?`,
      options: [
        {
          label: `I have a competing offer at ${fmt(competing)}, and this role is my first choice — wanted to be transparent.`,
          nextId: 'node3_strong',
          feedback: "Competing offers fundamentally shift the negotiation. You just became a hotter candidate.",
        },
        {
          label: "My track record of measurable results, plus the current market rate, justify the number.",
          nextId: 'node3_medium',
          feedback: "Layering reasons (track record + market) is stronger than a single argument. Good instinct.",
        },
      ],
    },

    // ── Q3: weak position ───────────────────────────────────
    {
      id: 'node3_weak',
      question: 'QUESTION 3 OF 8',
      recruiterLine: "Fair point — let me check with the team. Can you share a specific win that demonstrates that premium?",
      options: [
        {
          label: "I shipped a feature that increased retention by 15% and saved the team 8 hours a week.",
          nextId: 'node4_low',
          feedback: "Adding a specific metric just rescued your position. Numbers always beat adjectives.",
        },
        {
          label: "I consistently exceed goals and have strong performance reviews across the board.",
          nextId: 'node4_low',
          feedback: "Better — but 'strong reviews' is still vague. A specific number would land harder.",
        },
      ],
    },

    // ── Q3: data-backed position ────────────────────────────
    {
      id: 'node3_data',
      question: 'QUESTION 3 OF 8',
      recruiterLine: "Market data matters to us too. Can you help me make the case internally — what specific value do you bring?",
      options: [
        {
          label: "I bring direct experience in this domain, plus a track record of delivering results on tight timelines.",
          nextId: 'node4_mid',
          feedback: "Combining market data with a personal value pitch is exactly the right strategy.",
        },
        {
          label: "Beyond the base, I'm also thinking about the full package — signing bonus, equity, and remote work.",
          nextId: 'node4_mid',
          feedback: "Opening the package conversation early gives you more to work with. Strategic.",
        },
      ],
    },

    // ── Q3: medium position ─────────────────────────────────
    {
      id: 'node3_medium',
      question: 'QUESTION 3 OF 8',
      recruiterLine: "That's a fair case. I'll loop in the team — anything else in the offer you'd want us to consider?",
      options: [
        {
          label: "Yes — a signing bonus or remote flexibility would also be meaningful to me.",
          nextId: 'node4_mid',
          feedback: "You just opened the perks door before the salary counter. That's leverage for Q5–Q6.",
        },
        {
          label: "The salary is the priority, but I'm open to creative solutions.",
          nextId: 'node4_mid',
          feedback: "Saying 'creative solutions' shows flexibility without backing down. Solid framing.",
        },
      ],
    },

    // ── Q3: strong position (competing offer) ───────────────
    {
      id: 'node3_strong',
      question: 'QUESTION 3 OF 8',
      recruiterLine: "A competing offer is really helpful context — thank you. Can you give me until Friday to loop in leadership?",
      options: [
        {
          label: "Of course — this role is genuinely my top choice, so I'm happy to wait.",
          nextId: 'node4_high',
          feedback: "Masterclass: holding firm while signaling loyalty. This is the most powerful negotiation combo.",
        },
        {
          label: "I'd need a decision by tomorrow given the other offer's deadline.",
          nextId: 'node4_mid',
          feedback: "Pressure works sometimes, but ultimatums can backfire. Giving a bit of room often yields better.",
        },
      ],
    },

    // ── Q4 variants ─────────────────────────────────────────
    node4('node4_low',  n4Low),
    node4('node4_mid',  n4Mid),
    node4('node4_high', n4High),

    // ── Q5: bonus / equity / remote ─────────────────────────
    {
      id: 'node5',
      question: 'QUESTION 5 OF 8',
      recruiterLine: "Almost there! Before we finalize — is there anything else we can do to make this offer a clear yes? Signing bonus, equity, remote flexibility?",
      options: [
        {
          label: "A signing bonus would really help with the transition costs.",
          nextId: 'node6_bonus',
          feedback: "Framing your ask around a real cost (transition, relocation) makes it feel legitimate, not greedy.",
        },
        {
          label: "I'd love to understand the equity package — RSUs and vesting schedule.",
          nextId: 'node6_equity',
          feedback: "Equity is massively undervalued by new grads. It can be worth 10–30% of total comp at growth companies.",
        },
        {
          label: "Remote flexibility matters a lot to me — could we discuss the policy?",
          nextId: 'node6_remote',
          feedback: "Remote flexibility has real dollar value: commute costs, time, and quality of life all count.",
        },
      ],
    },

    // ── Q6a: signing bonus ──────────────────────────────────
    {
      id: 'node6_bonus',
      question: 'QUESTION 6 OF 8',
      recruiterLine: `We can do a ${fmt(bonusSmall)} signing bonus — paid on your first check. Does that work?`,
      options: [
        {
          label: `${fmt(bonusSmall)} is really appreciated — I'll absolutely take it!`,
          nextId: 'node7',
          updateBonus: bonusSmall,
          feedback: `Locked in ${fmt(bonusSmall)} extra. Signing bonuses don't affect your raise baseline — purely additive.`,
        },
        {
          label: `Thank you! Given my transition costs, could we get to ${fmt(bonusMedium)}?`,
          nextId: 'node7',
          updateBonus: bonusMedium,
          feedback: `You negotiated the bonus up to ${fmt(bonusMedium)}. Never leave money on the table on a one-time ask.`,
        },
      ],
    },

    // ── Q6b: equity ─────────────────────────────────────────
    {
      id: 'node6_equity',
      question: 'QUESTION 6 OF 8',
      recruiterLine: `You'd receive ${fmt(bonusMedium * 4)} in RSUs vesting over 4 years with a 1-year cliff — about ${fmt(bonusMedium)}/year after year one.`,
      options: [
        {
          label: "That structure works well for me. I'm excited about the long-term upside.",
          nextId: 'node7',
          updateBonus: bonusMedium,
          feedback: "By asking about equity, you're already ahead of most candidates who never touch this topic.",
        },
        {
          label: "Is there flexibility on the cliff or a higher grant to reflect my level?",
          nextId: 'node7',
          updateBonus: bonusLarge,
          feedback: `Pushing on equity structure landed you ${fmt(bonusLarge)} in extra value. Bold and effective.`,
        },
      ],
    },

    // ── Q6c: remote ─────────────────────────────────────────
    {
      id: 'node6_remote',
      question: 'QUESTION 6 OF 8',
      recruiterLine: "Our default is 3 days in-office. We have some flexibility — what arrangement would work best for you?",
      options: [
        {
          label: "Two in-office days works great — I'll still be very present and collaborative.",
          nextId: 'node7',
          updateBonus: bonusSmall,
          feedback: `Negotiating down to 2 days saves ~${fmt(Math.round(bonusSmall * 0.6))}/year in commute costs. Non-salary wins add up.`,
        },
        {
          label: "I'm most productive fully remote — I have a strong track record of async delivery.",
          nextId: 'node7',
          updateBonus: bonusSmall,
          feedback: "Framing remote as a productivity advantage (not a perk) is exactly the right angle. Bold ask.",
        },
      ],
    },

    // ── Q7: perks / L&D ─────────────────────────────────────
    {
      id: 'node7',
      question: 'QUESTION 7 OF 8',
      recruiterLine: "We also include a $1,500 annual learning and development budget. Anything else you'd like to flag before we close this out?",
      options: [
        {
          label: `Could we bump the L&D budget to ${fmt(Math.round(base * 0.025))}? I invest seriously in skill development.`,
          nextId: 'node8',
          feedback: "L&D budget is rarely defended hard by HR — this low-cost ask often succeeds. Smart target.",
        },
        {
          label: "Could we add an extra week of PTO in year one? I have a prior commitment to wrap up.",
          nextId: 'node8',
          feedback: "Asking for extra PTO before day one is unusual, but a concrete reason makes it land professionally.",
        },
        {
          label: "I think we've covered everything that matters — I'm really excited about this!",
          nextId: 'node8',
          feedback: "Knowing when to stop asking is just as important as pushing. Ending strong builds the relationship.",
        },
      ],
    },

    // ── Q8: final close ─────────────────────────────────────
    {
      id: 'node8',
      question: 'QUESTION 8 OF 8',
      recruiterLine: "This has been such a great conversation. I'm drawing up the updated offer letter now — can I take this as an official yes?",
      options: [
        {
          label: "Absolutely — I'm genuinely excited to join Apex Tech and hit the ground running!",
          nextId: null,
          feedback: "Perfect close. Ending with enthusiasm and a forward-looking statement is the best final impression.",
        },
        {
          label: "Yes! I just want everything we discussed in writing before I sign — standard practice.",
          nextId: null,
          feedback: "Always get the full updated offer in writing. Professional, smart, and sets the right precedent.",
        },
      ],
    },
  ];
}

export function EasyMode() {
  const router = useRouter();
  const { baseSalary, setNegotiatedSalary } = useApp();
  const base = baseSalary || 70000;

  const tree = useMemo(() => buildTree(base), [base]);
  const mktLow  = Math.round(base * 1.08);
  const mktHigh = Math.round(base * 1.15);

  const [nodeId, setNodeId]                 = useState('start');
  const [negotiatedBase, setNegotiatedBase] = useState(base);
  const [signingBonus, setSigningBonus]     = useState(0);
  const [done, setDone]                     = useState(false);
  const [feedback, setFeedback]             = useState('');
  const [questionNum, setQuestionNum]       = useState(1);
  const [choiceLog, setChoiceLog]           = useState<ChoiceLog[]>([]);

  const node = tree.find((n) => n.id === nodeId)!;

  const gain       = negotiatedBase - base;
  const gainPct    = ((gain / base) * 100).toFixed(1);
  const totalY1    = negotiatedBase + signingBonus;
  const gaugePct   = Math.min(100, Math.max(0, (gain / (base * 0.15)) * 100));
  const tip        = NODE_TIPS[nodeId] ?? "Think strategically before responding.";

  const choose = (opt: Option) => {
    if (opt.updateBase !== undefined) {
      setNegotiatedBase(opt.updateBase);
      setNegotiatedSalary(opt.updateBase);
    }
    if (opt.updateBonus !== undefined) setSigningBonus(opt.updateBonus);
    const quality = rateQuality(opt.feedback);
    setChoiceLog(prev => [
      ...prev,
      { q: questionNum, label: opt.label.slice(0, 38) + (opt.label.length > 38 ? '…' : ''), quality },
    ]);
    setFeedback(opt.feedback);
    if (!opt.nextId) {
      setDone(true);
    } else {
      setNodeId(opt.nextId);
      setQuestionNum((q) => q + 1);
    }
  };

  if (done) {
    const gained  = negotiatedBase - base;
    const pct     = ((gained / base) * 100).toFixed(1);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center px-6 py-12 gap-6 max-w-md mx-auto"
      >
        <div className="text-5xl">{gained > 0 || signingBonus > 0 ? '🎉' : '📋'}</div>
        <h2 className="text-2xl font-bold text-slate-900">Round 1 Complete!</h2>

        <div className="bg-violet-50 border border-violet-300 rounded-3xl px-8 py-6 w-full">
          <p className="text-violet-600 text-xs mb-1">NEGOTIATED BASE</p>
          <p className="text-4xl font-bold text-slate-900">{fmt(negotiatedBase)}</p>
          {gained > 0 ? (
            <p className="text-teal-600 text-sm mt-1">
              +{fmt(gained)} above offer ({pct}% increase)
            </p>
          ) : (
            <p className="text-slate-500 text-sm mt-1">Accepted the original offer</p>
          )}
        </div>

        {signingBonus > 0 && (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl px-6 py-4 w-full flex justify-between items-center">
            <div className="text-left">
              <p className="text-teal-600 text-xs">SIGNING BONUS</p>
              <p className="text-slate-900 font-bold text-xl">{fmt(signingBonus)}</p>
              <p className="text-slate-500 text-xs">One-time, first paycheck</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs">YEAR 1 TOTAL</p>
              <p className="text-teal-600 font-bold text-2xl">{fmt(totalY1)}</p>
            </div>
          </div>
        )}

        {/* Move quality summary */}
        <div className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
          <p className="text-slate-400 text-xs mb-3 font-medium uppercase tracking-widest">Your Move Quality</p>
          <div className="flex gap-3 justify-center">
            {(['great', 'good', 'fair'] as const).map(q => (
              <div key={q} className={`flex-1 rounded-xl px-2 py-2 text-center border ${q === 'great' ? 'bg-green-50 border-green-200' : q === 'good' ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
                <p className={`text-xl font-bold ${q === 'great' ? 'text-green-600' : q === 'good' ? 'text-blue-600' : 'text-amber-600'}`}>
                  {choiceLog.filter(c => c.quality === q).length}
                </p>
                <p className="text-slate-500 text-[10px] capitalize">{q}</p>
              </div>
            ))}
          </div>
        </div>

        {feedback && (
          <p className="text-slate-400 text-sm max-w-xs italic">"{feedback}"</p>
        )}

        <Button onClick={() => router.push('/locker-room/1')} className="w-full py-4 text-base">
          Head to the Locker Room →
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen lg:flex lg:justify-center lg:items-stretch bg-[#faf5fa]">

      {/* ── LEFT SIDEBAR ─────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-violet-200/60 bg-white sticky top-0 h-screen overflow-y-auto px-5 py-8 gap-5">

        {/* Live offer card */}
        <div>
          <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest mb-2">Live Offer</p>
          <div className="bg-violet-50 border border-violet-200 rounded-2xl px-4 py-4">
            <p className="text-slate-500 text-xs mb-1">Negotiated Base</p>
            <motion.p
              key={negotiatedBase}
              initial={{ scale: 1.1, color: '#50ae77' }}
              animate={{ scale: 1, color: '#1e1e1e' }}
              transition={{ duration: 0.4 }}
              className="text-2xl font-bold text-slate-900"
            >
              {fmt(negotiatedBase)}
            </motion.p>
            {gain > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-green-600 text-xs mt-1"
              >
                +{fmt(gain)} ({gainPct}% gain)
              </motion.p>
            )}
          </div>
        </div>

        {/* Gain progress gauge */}
        <div>
          <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
            <span>Gain Progress</span>
            <span>{gaugePct.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-violet-100 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${gaugePct}%` }}
              transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              className="h-full bg-gradient-to-r from-violet-500 to-green-400 rounded-full"
            />
          </div>
          <p className="text-slate-600 text-[10px] mt-1">Target: +15% = {fmt(Math.round(base * 0.15))}</p>
        </div>

        {/* Signing bonus chip */}
        <AnimatePresence>
          {signingBonus > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3"
            >
              <p className="text-teal-600 text-xs font-medium">+ Signing Bonus</p>
              <p className="text-slate-900 font-bold">{fmt(signingBonus)}</p>
              <p className="text-slate-500 text-xs mt-0.5">Year 1 total: {fmt(totalY1)}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-t border-violet-100" />

        {/* Choice history */}
        <div className="flex-1 overflow-hidden">
          <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest mb-2">Your Moves</p>
          {choiceLog.length === 0 ? (
            <p className="text-slate-700 text-xs italic">No choices yet</p>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {choiceLog.map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-2"
                  >
                    <span className={`mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                      c.quality === 'great' ? 'bg-green-50 text-green-600'
                      : c.quality === 'fair' ? 'bg-amber-50 text-amber-600'
                      : 'bg-blue-50 text-blue-600'
                    }`}>
                      {c.quality === 'great' ? '★' : c.quality === 'fair' ? '△' : '●'}
                    </span>
                    <p className="text-slate-400 text-[10px] leading-snug">
                      <span className="text-slate-600">Q{c.q}:</span> {c.label}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Question progress */}
        <div className="mt-auto">
          <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest mb-2">Progress</p>
          <div className="grid grid-cols-8 gap-1 mb-1">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i + 1 < questionNum ? 'bg-teal-500'
                  : i + 1 === questionNum ? 'bg-violet-500'
                  : 'bg-violet-100'
                }`}
              />
            ))}
          </div>
          <p className="text-slate-500 text-[10px]">Question {questionNum} of 8</p>
        </div>
      </aside>

      {/* ── CENTER ───────────────────────────────────────────── */}
      <main className="flex flex-col min-h-screen w-full lg:w-[480px] lg:shrink-0 px-4 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-violet-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">$</div>
          <div>
            <p className="text-slate-900 font-semibold text-sm">Salary Coach</p>
            <p className="text-slate-500 text-xs">Starting offer: {fmt(base)}</p>
          </div>
          <span className="ml-auto bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">EASY</span>
        </div>

        {/* Mobile-only live stats strip */}
        {(negotiatedBase > base || signingBonus > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 flex gap-2 lg:hidden"
          >
            {negotiatedBase > base && (
              <div className="flex-1 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2 text-center">
                <p className="text-teal-600 text-xs">Base locked</p>
                <p className="text-slate-900 font-bold text-sm">{fmt(negotiatedBase)}</p>
              </div>
            )}
            {signingBonus > 0 && (
              <div className="flex-1 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2 text-center">
                <p className="text-teal-600 text-xs">Signing bonus</p>
                <p className="text-slate-900 font-bold text-sm">{fmt(signingBonus)}</p>
              </div>
            )}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={nodeId}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="flex-1"
          >
            <div className="bg-violet-50 border border-violet-200 rounded-3xl p-6 mb-6">
              <p className="text-violet-600 text-xs font-medium mb-3 tracking-widest">{node.question}</p>
              <p className="text-slate-900 text-xl font-medium leading-snug">{node.recruiterLine}</p>
            </div>

            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
              >
                <p className="text-amber-700 text-xs leading-relaxed">💡 {feedback}</p>
              </motion.div>
            )}

            <p className="text-slate-500 text-xs mb-4">Choose your response</p>

            <div className="space-y-3">
              {node.options.map((opt, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => choose(opt)}
                  className="w-full text-left bg-white hover:bg-violet-50 border border-violet-200 hover:border-violet-400 rounded-2xl px-5 py-4 text-sm text-slate-800 transition-all duration-150 shadow-sm"
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Mobile progress bar */}
        <div className="mt-8 flex gap-1 lg:hidden">
          {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${n <= questionNum ? 'bg-violet-500' : 'bg-violet-200'}`}
            />
          ))}
        </div>
      </main>

      {/* ── RIGHT SIDEBAR ────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-l border-violet-200/60 bg-white sticky top-0 h-screen overflow-y-auto px-5 py-8 gap-5">

        {/* Pro tip — animates per question */}
        <div>
          <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest mb-2">Pro Tip</p>
          <AnimatePresence mode="wait">
            <motion.div
              key={nodeId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
            >
              <p className="text-amber-700 text-xs leading-relaxed">💡 {tip}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Market context */}
        <div>
          <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest mb-2">Market Context</p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 space-y-2.5">
            {[
              { label: 'Their Offer', value: fmt(base), color: 'text-slate-900' },
              { label: 'Market Low (+8%)', value: fmt(mktLow), color: 'text-blue-600' },
              { label: 'Market High (+15%)', value: fmt(mktHigh), color: 'text-green-600' },
              { label: 'Your Current', value: fmt(negotiatedBase), color: gain > 0 ? 'text-green-600' : 'text-slate-500' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">{row.label}</span>
                <span className={`text-[11px] font-medium ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-violet-100" />

        {/* Core principles */}
        <div>
          <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest mb-2">Core Principles</p>
          <div className="space-y-2.5">
            {[
              { icon: '📊', text: 'Data beats feelings' },
              { icon: '⚓', text: 'Anchor high first' },
              { icon: '🔄', text: 'Always counter once' },
              { icon: '📦', text: 'Negotiate the full package' },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-sm shrink-0">{p.icon}</span>
                <p className="text-slate-400 text-xs">{p.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Move quality scoreboard */}
        <div className="mt-auto">
          <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest mb-2">Move Quality</p>
          <div className="flex gap-2">
            {([
              { q: 'great' as const, label: 'Great', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
              { q: 'good'  as const, label: 'Good',  color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-200'  },
              { q: 'fair'  as const, label: 'Fair',  color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
            ]).map(({ q, label, color, bg }) => (
              <div key={q} className={`flex-1 border rounded-xl px-2 py-2 text-center ${bg}`}>
                <p className={`text-lg font-bold ${color}`}>{choiceLog.filter(c => c.quality === q).length}</p>
                <p className="text-slate-500 text-[10px]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

    </div>
  );
}
