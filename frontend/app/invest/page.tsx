import { NavBar } from '@/components/NavBar';
import { InvestmentSimulator } from '@/components/InvestmentSimulator';

export const metadata = { title: 'Investment Simulator — HerMoneyMoves' };

export default function InvestPage() {
  return (
    <div className="min-h-screen bg-[#0a0618] text-white">
      <NavBar />

      {/* Page hero */}
      <section className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="text-xs text-orange-400 font-semibold uppercase tracking-widest mb-4">Compound Growth</p>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h1 className="text-5xl lg:text-6xl font-black leading-none mb-4">
                Investment<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-violet-400">
                  Simulator
                </span>
              </h1>
              <p className="text-slate-400 text-base max-w-lg leading-relaxed">
                Enter your salary, choose your cost of living, and see how consistent investing compounds over 10 years.
                Real inputs, real math — no hand-waving.
              </p>
            </div>
            <div className="flex gap-8 shrink-0">
              {[
                { val: '10', label: 'year projection' },
                { val: '3', label: 'risk profiles' },
                { val: '100%', label: 'your numbers' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-black text-orange-400">{s.val}</p>
                  <p className="text-slate-500 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <InvestmentSimulator />

      <footer className="border-t border-white/5 max-w-6xl mx-auto px-6 py-8 text-slate-600 text-xs text-center">
        HerMoneyMoves · Projections are illustrative and not financial advice.
      </footer>
    </div>
  );
}
