import Link from 'next/link';
import { NavBar } from '@/components/NavBar';

export const metadata = { title: 'Negotiation Simulator — HerMoneyMoves' };

const TIERS = [
  {
    label: 'EASY',
    labelColor: 'bg-violet-600',
    icon: '🌱',
    title: 'Choose Your Path',
    description:
      'A guided decision tree — you pick between two responses at each step. Great for learning the logic of negotiation before the pressure is on.',
    href: '/negotiate/easy',
    accentBorder: 'hover:border-violet-400/60',
    accentText: 'text-violet-600',
    cardBg: 'hover:bg-violet-50/50',
    detail: 'Multiple choice · 8 rounds · No time pressure',
  },
  {
    label: 'MEDIUM',
    labelColor: 'bg-teal-600',
    icon: '💬',
    title: 'Live Text Chat',
    description:
      "Type real responses back and forth with Jordan, our AI recruiter. She'll push back on your asks and concede when you make a strong case.",
    href: '/negotiate/medium',
    accentBorder: 'hover:border-teal-400/60',
    accentText: 'text-teal-600',
    cardBg: 'hover:bg-teal-50/50',
    detail: 'Free text · Real AI · Unlimited rounds',
  },
  {
    label: 'HARD',
    labelColor: 'bg-orange-500',
    icon: '🎤',
    title: 'Voice Negotiation',
    description:
      'Speak directly to the AI recruiter — just like the real thing. Mic on, nerves off. This is where the training pays off.',
    href: '/negotiate/hard',
    accentBorder: 'hover:border-orange-400/60',
    accentText: 'text-orange-500',
    cardBg: 'hover:bg-orange-50/30',
    detail: 'Speech-to-speech · Real-time AI · Most immersive',
  },
];

const STEPS = [
  { num: '01', title: 'Choose your difficulty', desc: 'Start easy and work your way up, or jump straight to the challenge.' },
  { num: '02', title: 'Meet Jordan', desc: 'Your AI recruiter is friendly but firm — she has a budget ceiling she won\'t reveal.' },
  { num: '03', title: 'Make your case', desc: 'Use market data, competing offers, and specific skills to move the number.' },
  { num: '04', title: 'See what you secured', desc: 'Your negotiated salary gets tracked across all three rounds.' },
];

export default function NegotiatePage() {
  return (
    <div className="min-h-screen bg-[#faf5fa] text-slate-900">
      <NavBar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-violet-200/50">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-violet-100/50 blur-3xl pointer-events-none" />
        <div className="absolute top-24 -left-8 w-48 h-48 rounded-full bg-teal-100/40 blur-2xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20 relative">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs text-teal-600 font-semibold uppercase tracking-widest">Negotiation Simulator</span>
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-xs text-slate-400">Three difficulty levels</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <h1 className="text-5xl lg:text-6xl font-black leading-none mb-4">
                Train Like<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-violet-500">
                  It&apos;s Real.
                </span>
              </h1>
              <p className="text-slate-600 text-base max-w-lg leading-relaxed">
                Meet Jordan — our AI recruiter who&apos;s warm, firm, and has a maximum budget she&apos;ll never reveal.
                Practice salary negotiation through three escalating difficulty levels.
              </p>
            </div>
            <Link
              href="/negotiate/easy"
              className="shrink-0 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors shadow-lg shadow-violet-200"
            >
              Start Easy Mode →
            </Link>
          </div>
        </div>
      </section>

      {/* Tier cards */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Pick your difficulty</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <Link
              key={tier.label}
              href={tier.href}
              className={`group bg-white border border-slate-200 rounded-2xl p-8 flex flex-col gap-5 transition-all shadow-sm hover:shadow-md ${tier.accentBorder} ${tier.cardBg}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl">{tier.icon}</span>
                <span className={`${tier.labelColor} text-white text-xs font-bold px-3 py-1.5 rounded-full`}>
                  {tier.label}
                </span>
              </div>
              <div>
                <h3 className="text-slate-900 font-bold text-xl mb-2">{tier.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{tier.description}</p>
              </div>
              <div className="mt-auto">
                <p className="text-slate-400 text-xs mb-3">{tier.detail}</p>
                <span className={`text-sm font-semibold group-hover:underline ${tier.accentText}`}>
                  Start this mode →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-violet-200/50 bg-violet-50/40">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-bold text-slate-900 mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step) => (
              <div key={step.num}>
                <p className="text-5xl font-black text-violet-200 mb-4">{step.num}</p>
                <h3 className="text-slate-900 font-semibold mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-black text-slate-900 mb-4">Ready to practice?</h2>
        <p className="text-slate-500 mb-8">No account needed. Start training in seconds.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/negotiate/easy" className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-4 rounded-xl transition-colors shadow-sm">
            Easy Mode →
          </Link>
          <Link href="/negotiate/medium" className="border border-teal-300 hover:border-teal-400 text-teal-700 hover:text-teal-800 font-semibold px-8 py-4 rounded-xl transition-colors bg-white">
            Skip to Medium
          </Link>
          <Link href="/negotiate/hard" className="border border-orange-300 hover:border-orange-400 text-orange-600 font-semibold px-8 py-4 rounded-xl transition-colors bg-white">
            Hard Mode
          </Link>
        </div>
      </section>

      <footer className="border-t border-violet-200/50 max-w-6xl mx-auto px-6 py-8 text-slate-400 text-xs text-center">
        HerMoneyMoves · Negotiation data is not stored.
      </footer>
    </div>
  );
}
