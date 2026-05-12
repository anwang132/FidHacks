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
    tagColor: 'text-violet-600',
    title: 'Resume Fit Grader',
    description: 'Upload your resume — or paste a job posting — and get a fit score, power skill reframes, and a ranked list of matching roles with salary ranges.',
    cta: 'Analyze My Fit →',
    ctaColor: 'text-violet-600',
    hoverBorder: 'hover:border-violet-400/60',
    example: { label: 'EXAMPLE FIT SCORE', value: '92% Strong Match', sub: 'Senior Product Manager · $95k–$130k' },
  },
  {
    href: '/negotiate',
    emoji: '💬',
    tag: 'THREE TIERS',
    tagColor: 'text-teal-600',
    title: 'Negotiation Simulator',
    description: 'Train with Jordan, an AI recruiter designed to push back. Progress from a guided decision tree to live text chat to voice-mode negotiation.',
    cta: 'Start Training →',
    ctaColor: 'text-teal-600',
    hoverBorder: 'hover:border-teal-400/60',
    example: null,
  },
  {
    href: '/invest',
    emoji: '📈',
    tag: 'COMPOUND GROWTH',
    tagColor: 'text-orange-500',
    title: 'Investment Simulator',
    description: 'Enter your salary, pick your risk level and location, and see exactly how your money compounds over 10 years. No assumptions — just your numbers.',
    cta: 'Run the Numbers →',
    ctaColor: 'text-orange-500',
    hoverBorder: 'hover:border-orange-400/60',
    example: null,
  },
];

const WIN_STORIES = [
  {
    name: 'Priya, 24',
    role: 'Product Manager · Tech Startup',
    before: '$72k',
    after: '$84k',
    gain: '+$12k',
    time: '12 min practice',
    quote: '"I used the market data framing Jordan taught me. My offer went from 72 to 84 in one email."',
    border: 'border-violet-200',
    bg: 'bg-violet-50/60',
    gainColor: 'text-violet-600',
    gainBg: 'bg-violet-100 text-violet-700',
  },
  {
    name: 'Maya, 26',
    role: 'Software Engineer · Series B',
    before: '$105k',
    after: '$118k + RSUs',
    gain: '+$13k + equity',
    time: '20 min practice',
    quote: '"Hard Mode scared me at first. Then I realized: if I can handle Jordan, I can handle anyone."',
    border: 'border-teal-200',
    bg: 'bg-teal-50/60',
    gainColor: 'text-teal-600',
    gainBg: 'bg-teal-100 text-teal-700',
  },
  {
    name: 'Sofia, 23',
    role: 'Marketing Associate · Agency',
    before: '$58k',
    after: '$65k + $3k signing',
    gain: '+$10k total',
    time: '8 min practice',
    quote: '"First job out of college. I almost didn\'t negotiate. Now I never leave money on the table."',
    border: 'border-orange-200',
    bg: 'bg-orange-50/60',
    gainColor: 'text-orange-500',
    gainBg: 'bg-orange-100 text-orange-700',
  },
  {
    name: 'Amara, 25',
    role: 'Data Analyst · Finance',
    before: '$78k',
    after: '$84k',
    gain: '+$6k',
    time: '15 min practice',
    quote: '"They said the budget was fixed. It wasn\'t. I just needed the words to push back confidently."',
    border: 'border-violet-200',
    bg: 'bg-violet-50/30',
    gainColor: 'text-violet-600',
    gainBg: 'bg-violet-100 text-violet-700',
  },
];

const POWER_TIPS = [
  {
    emoji: '🎯',
    num: '01',
    title: 'Anchor High, Explain Why',
    body: 'Your first number sets the frame. Say $95k when you want $85k — and back it with market data, not a wish.',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    accent: 'text-violet-600',
    numColor: 'text-violet-200',
  },
  {
    emoji: '⏸️',
    num: '02',
    title: 'Silence Is a Power Move',
    body: 'After making your ask, stop talking. The discomfort of silence makes the other person fill the gap — often in your favor.',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    accent: 'text-teal-600',
    numColor: 'text-teal-200',
  },
  {
    emoji: '✨',
    num: '03',
    title: 'Reframe Every Pushback',
    body: '"I understand budget is tight — which is exactly why I want to get this right. What flexibility exists on signing bonus?"',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    accent: 'text-orange-500',
    numColor: 'text-orange-200',
  },
];

const WISDOM = [
  {
    quote: "You don't get what you don't ask for. Every time you stay quiet, you're volunteering for less.",
    who: 'Negotiation principle',
    emoji: '💡',
  },
  {
    quote: "The pay gap is real — and it compounds. A $10k deficit at 22 becomes $500k by retirement. One conversation changes that math.",
    who: 'HerMoneyMoves',
    emoji: '📊',
  },
  {
    quote: "Asking for more doesn't make you greedy. It makes you someone who knows her value — and will fight for it.",
    who: 'Community wisdom',
    emoji: '💪',
  },
];

const HOW_IT_WORKS = [
  { step: '1', icon: '📄', title: 'Grade your resume', desc: 'Get a fit score and market salary range before you even apply.' },
  { step: '2', icon: '💬', title: 'Practice the ask', desc: 'Negotiate with Jordan across three escalating difficulty modes.' },
  { step: '3', icon: '📈', title: 'Invest the difference', desc: 'Model how your salary bump compounds into wealth over 10 years.' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#faf5fa] text-slate-900">
      <NavBar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-200/60 via-transparent to-teal-100/40 pointer-events-none" />
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-violet-200/30 blur-3xl pointer-events-none" />
        <div className="absolute top-48 -left-12 w-64 h-64 rounded-full bg-teal-100/40 blur-2xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 py-28 lg:py-40">
          <div className="max-w-3xl relative">
            <div className="inline-flex items-center gap-2 bg-violet-100 border border-violet-300 rounded-full px-4 py-1.5 mb-8 text-xs text-violet-700 font-semibold tracking-widest">
              ✦ BUILT FOR GEN-Z WOMEN
            </div>
            <h1 className="text-6xl lg:text-8xl font-black leading-none tracking-tight mb-6">
              Own Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-violet-400 to-orange-400">
                Worth.
              </span>
            </h1>
            <p className="text-slate-600 text-lg lg:text-xl leading-relaxed max-w-xl mb-10">
              Three AI tools that close the gender pay gap — starting with yours.
              Know your value, practice the ask, and watch it compound.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/resume"
                className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-4 rounded-xl text-base shadow-lg shadow-violet-200 transition-colors"
              >
                Get Started Free →
              </Link>
              <Link
                href="/negotiate"
                className="border border-slate-300 hover:border-violet-300 text-slate-600 hover:text-violet-700 font-semibold px-8 py-4 rounded-xl text-base transition-colors bg-white/60"
              >
                See How It Works
              </Link>
            </div>

            {/* Social proof strip */}
            <div className="flex items-center gap-3 mt-10">
              <div className="flex -space-x-2">
                {['🧑‍💼','👩','👩‍💻','👩‍🎓'].map((e, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-violet-200 flex items-center justify-center text-sm shadow-sm">
                    {e}
                  </div>
                ))}
              </div>
              <p className="text-slate-500 text-sm">
                <span className="font-semibold text-slate-900">2,400+ women</span> already negotiated more this month
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-violet-200/50 bg-violet-50/60">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-violet-200/40 rounded-2xl overflow-hidden">
            {STATS.map((s) => (
              <div key={s.value} className="bg-white px-8 py-8">
                <p className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-orange-400 mb-3">
                  {s.value}
                </p>
                <p className="text-slate-600 text-sm leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-12 text-center">
          <p className="text-xs text-violet-600 font-semibold uppercase tracking-widest mb-3">The System</p>
          <h2 className="text-4xl font-black text-slate-900">Three steps.<br />One mission.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((h, i) => (
            <div key={h.step} className="relative">
              {i < HOW_IT_WORKS.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-full h-px border-t border-dashed border-violet-200 z-0" />
              )}
              <div className="relative bg-white border border-slate-200 rounded-2xl p-7 shadow-sm text-center z-10">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-2xl mx-auto mb-5">
                  {h.icon}
                </div>
                <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-violet-600 text-white text-xs font-black flex items-center justify-center shadow-md">
                  {h.step}
                </div>
                <h3 className="text-slate-900 font-bold text-base mb-2">{h.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gradient-to-br from-violet-50/80 via-[#faf5fa] to-teal-50/60 border-y border-violet-100 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-14">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">The Toolkit</p>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900">Your full<br />arsenal.</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className={`group bg-white border border-slate-200 rounded-2xl p-8 flex flex-col gap-6 transition-all shadow-sm hover:shadow-lg ${f.hoverBorder} hover:-translate-y-1`}
              >
                <div>
                  <span className="text-4xl mb-4 block">{f.emoji}</span>
                  <p className={`text-xs font-semibold tracking-widest mb-2 ${f.tagColor}`}>{f.tag}</p>
                  <h3 className="text-slate-900 font-bold text-xl mb-3">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.description}</p>
                </div>
                {f.example && (
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                    <p className="text-violet-600 text-xs font-semibold mb-1">{f.example.label}</p>
                    <p className="text-slate-900 font-bold text-sm">{f.example.value}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{f.example.sub}</p>
                  </div>
                )}
                <span className={`text-sm font-semibold group-hover:underline mt-auto ${f.ctaColor}`}>
                  {f.cta}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Win Stories */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-xs text-violet-600 font-semibold tracking-widest">REAL RESULTS</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-slate-900">She asked.<br />She got it.</h2>
          <p className="text-slate-500 mt-3 text-base max-w-lg">Stories from women who practiced here — then used it in real interviews.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {WIN_STORIES.map((s) => (
            <div key={s.name} className={`border rounded-2xl p-6 transition-shadow hover:shadow-md ${s.border} ${s.bg}`}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-slate-900 font-bold text-base">{s.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{s.role}</p>
                </div>
                <span className={`text-sm font-black px-3 py-1 rounded-full ${s.gainBg}`}>{s.gain}</span>
              </div>
              <div className="flex gap-6 mb-5 pb-4 border-b border-white/80">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-semibold mb-0.5">Before</p>
                  <p className="text-slate-500 font-semibold text-sm">{s.before}</p>
                </div>
                <div className="text-slate-300 self-center">→</div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-semibold mb-0.5">After</p>
                  <p className="text-slate-900 font-bold text-sm">{s.after}</p>
                </div>
                <div className="ml-auto">
                  <p className="text-slate-400 text-[10px] uppercase font-semibold mb-0.5">Practice</p>
                  <p className="text-slate-500 text-xs">{s.time}</p>
                </div>
              </div>
              <p className="text-slate-600 text-sm italic leading-relaxed">{s.quote}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Power Tips */}
      <section className="bg-gradient-to-br from-orange-50/80 via-[#faf5fa] to-violet-50/60 border-y border-orange-100 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-14">
            <p className="text-xs text-orange-500 font-semibold uppercase tracking-widest mb-3">The Playbook</p>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900">Three moves.<br />One raise.</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {POWER_TIPS.map((t) => (
              <div key={t.num} className={`border rounded-2xl p-8 ${t.bg} ${t.border} relative overflow-hidden`}>
                <span className={`absolute top-4 right-5 text-7xl font-black opacity-10 leading-none select-none ${t.accent}`}>{t.num}</span>
                <div className="text-4xl mb-6">{t.emoji}</div>
                <h3 className={`font-bold text-lg mb-3 ${t.accent}`}>{t.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{t.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/negotiate"
              className="inline-block bg-orange-500 hover:bg-orange-400 text-white font-semibold px-8 py-4 rounded-xl text-base shadow-lg shadow-orange-200 transition-colors"
            >
              Practice These Moves →
            </Link>
          </div>
        </div>
      </section>

      {/* Wisdom Wall */}
      <section className="py-24" style={{ background: 'linear-gradient(135deg, #762773 0%, #993494 50%, #762773 100%)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-violet-200 text-xs font-semibold uppercase tracking-widest text-center mb-14">Words To Live By</p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {WISDOM.map((w, i) => (
              <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-8 text-center backdrop-blur-sm">
                <div className="text-4xl mb-5">{w.emoji}</div>
                <p className="text-white text-base leading-relaxed mb-5 italic">&ldquo;{w.quote}&rdquo;</p>
                <div className="w-8 h-px bg-violet-300 mx-auto mb-3" />
                <p className="text-violet-300 text-xs font-semibold uppercase tracking-wider">{w.who}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-gradient-to-r from-violet-100 to-teal-50 border-y border-violet-200">
        <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-2">Ready to own your worth?</h2>
            <p className="text-slate-600">Start with the resume grader — it takes under two minutes.</p>
          </div>
          <div className="flex gap-4 shrink-0 flex-wrap">
            <Link
              href="/resume"
              className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-4 rounded-xl text-base shadow-lg shadow-violet-200 transition-colors"
            >
              Start for Free →
            </Link>
            <Link
              href="/negotiate"
              className="border border-violet-300 hover:border-violet-400 text-violet-700 font-semibold px-8 py-4 rounded-xl text-base transition-colors bg-white"
            >
              Try Negotiation Sim
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
        <p>© 2025 HerMoneyMoves · Built at FidHacks</p>
        <p>Projections are illustrative and not financial advice.</p>
      </footer>
    </div>
  );
}
