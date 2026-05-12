import { NavBar } from '@/components/NavBar';
import { InvestmentSimulator } from '@/components/InvestmentSimulator';

export const metadata = { title: 'Investment Simulator — HerMoneyMoves' };

const FUN_FACTS = [
  { emoji: '☕', stat: '$5/day', label: 'coffee money invested = $67k over 10 years at 7%' },
  { emoji: '💅', stat: '$200/mo', label: 'invested in your 20s = $350k by retirement' },
  { emoji: '📱', stat: 'Starting at 22', label: 'vs 32 nearly doubles your ending wealth' },
];

export default function InvestPage() {
  return (
    <div className="min-h-screen bg-[#faf5fa] text-slate-900">
      <NavBar />

      {/* Page hero */}
      <section className="relative overflow-hidden border-b border-orange-200/50">
        {/* Decorative blobs */}
        <div className="absolute -top-20 right-0 w-80 h-80 rounded-full bg-orange-200/30 blur-3xl pointer-events-none" />
        <div className="absolute top-32 -left-12 w-56 h-56 rounded-full bg-violet-100/40 blur-2xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 py-16 relative">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs text-orange-500 font-semibold uppercase tracking-widest">Compound Growth</span>
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-xs text-slate-400">Interactive simulator</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <h1 className="text-5xl lg:text-6xl font-black leading-none mb-4">
                Make Your<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-violet-500">
                  Money Work.
                </span>
              </h1>
              <p className="text-slate-600 text-base max-w-lg leading-relaxed">
                Enter your salary, choose your cost of living, and see how consistent investing
                compounds over 10 years. Real inputs, real math — no hand-waving.
              </p>
            </div>
            <div className="flex gap-8 shrink-0">
              {[
                { val: '10', label: 'year projection' },
                { val: '3', label: 'risk profiles' },
                { val: '100%', label: 'your numbers' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl font-black text-orange-500">{s.val}</p>
                  <p className="text-slate-500 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Fun facts bar */}
      <section className="bg-gradient-to-r from-orange-50 to-violet-50 border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FUN_FACTS.map((f) => (
              <div key={f.stat} className="flex items-center gap-4">
                <span className="text-2xl shrink-0">{f.emoji}</span>
                <div>
                  <span className="text-orange-600 font-bold text-sm">{f.stat} </span>
                  <span className="text-slate-600 text-xs">{f.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <InvestmentSimulator />

      {/* Bottom encouragement */}
      <section className="border-t border-violet-200/50 bg-gradient-to-r from-violet-50 to-teal-50">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-slate-900 font-bold text-lg mb-1">The best time to start was yesterday.</p>
            <p className="text-slate-500 text-sm">The second best time is right now — with a salary you negotiated for.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <a href="/negotiate" className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors shadow-sm">
              Practice Negotiating →
            </a>
            <a href="/resume" className="border border-violet-300 hover:border-violet-400 text-violet-700 font-semibold px-6 py-3 rounded-xl text-sm transition-colors bg-white">
              Grade My Resume
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 max-w-6xl mx-auto px-6 py-8 text-slate-400 text-xs text-center">
        HerMoneyMoves · Projections are illustrative and not financial advice.
      </footer>
    </div>
  );
}
