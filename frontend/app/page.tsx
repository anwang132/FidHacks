import Link from 'next/link';
import { NavBar } from '@/components/NavBar';

const STATS = [
  { value: '$500k', label: 'Lost over a career by not negotiating a first offer' },
  { value: '85%', label: 'Of people who negotiate receive at least some of what they ask for' },
  { value: '37%', label: 'Of women negotiate every time vs. 57% of men' },
];

const FEATURES = [
  {
    href: '/resume',
    emoji: '📄',
    tag: 'AI-POWERED',
    tagColor: 'text-violet-400',
    title: 'Resume Fit Grader',
    description: 'Upload your resume — or paste a job posting — and get a fit score, power skill reframes, and a ranked list of matching roles with salary ranges.',
    cta: 'Analyze My Fit →',
    ctaColor: 'text-violet-400',
    hoverBorder: 'hover:border-violet-600/50',
    example: { label: 'EXAMPLE FIT SCORE', value: '92% Strong Match', sub: 'Senior Product Manager · $95k–$130k' },
  },
  {
    href: '/negotiate',
    emoji: '💬',
    tag: 'THREE TIERS',
    tagColor: 'text-teal-400',
    title: 'Negotiation Simulator',
    description: 'Train with Jordan, an AI recruiter designed to push back. Progress from a guided decision tree to live text chat to voice-mode negotiation.',
    cta: 'Start Training →',
    ctaColor: 'text-teal-400',
    hoverBorder: 'hover:border-teal-600/50',
    example: null,
  },
  {
    href: '/invest',
    emoji: '📈',
    tag: 'COMPOUND GROWTH',
    tagColor: 'text-orange-400',
    title: 'Investment Simulator',
    description: 'Enter your salary, pick your risk level and location, and see exactly how your money compounds over 10 years. No assumptions — just your numbers.',
    cta: 'Run the Numbers →',
    ctaColor: 'text-orange-400',
    hoverBorder: 'hover:border-orange-600/50',
    example: null,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0618] text-white">
      <NavBar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 py-28 lg:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-violet-900/40 border border-violet-700/40 rounded-full px-4 py-1.5 mb-8 text-xs text-violet-300 font-medium tracking-widest">
              ✦ BUILT FOR GEN-Z WOMEN
            </div>
            <h1 className="text-6xl lg:text-8xl font-black leading-none tracking-tight mb-6">
              Own Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-orange-400">
                Worth.
              </span>
            </h1>
            <p className="text-slate-400 text-lg lg:text-xl leading-relaxed max-w-xl mb-10">
              Three AI tools that close the gender pay gap — starting with yours.
              Know your value, practice the ask, and watch it compound.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/resume"
                className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-4 rounded-xl text-base shadow-lg shadow-violet-900/40 transition-colors"
              >
                Get Started Free →
              </Link>
              <Link
                href="/negotiate"
                className="border border-slate-600/50 hover:border-slate-500 text-slate-300 hover:text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/5 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden">
            {STATS.map((s) => (
              <div key={s.value} className="bg-slate-950/60 px-8 py-8">
                <p className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-orange-400 mb-3">
                  {s.value}
                </p>
                <p className="text-slate-400 text-sm leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="mb-14">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">The Toolkit</p>
          <h2 className="text-4xl lg:text-5xl font-black text-white">Three tools.<br />One mission.</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={`group bg-slate-900/40 border border-slate-700/20 rounded-2xl p-8 flex flex-col gap-6 transition-colors ${f.hoverBorder}`}
            >
              <div>
                <span className="text-4xl mb-4 block">{f.emoji}</span>
                <p className={`text-xs font-semibold tracking-widest mb-2 ${f.tagColor}`}>{f.tag}</p>
                <h3 className="text-white font-bold text-xl mb-3">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
              </div>
              {f.example && (
                <div className="bg-violet-950/40 border border-violet-800/30 rounded-xl p-4">
                  <p className="text-violet-400 text-xs font-semibold mb-1">{f.example.label}</p>
                  <p className="text-white font-bold text-sm">{f.example.value}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{f.example.sub}</p>
                </div>
              )}
              <span className={`text-sm font-semibold group-hover:underline mt-auto ${f.ctaColor}`}>
                {f.cta}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-gradient-to-r from-violet-950/60 to-indigo-950/40 border-y border-violet-800/20">
        <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-2">Ready to own your worth?</h2>
            <p className="text-slate-400">Start with the resume grader — it takes under two minutes.</p>
          </div>
          <Link
            href="/resume"
            className="shrink-0 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-4 rounded-xl text-base shadow-lg shadow-violet-900/40 transition-colors"
          >
            Start for Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-600 text-xs">
        <p>© 2025 HerMoneyMoves · Built at FidHacks</p>
        <p>Projections are illustrative and not financial advice.</p>
      </footer>
    </div>
  );
}
