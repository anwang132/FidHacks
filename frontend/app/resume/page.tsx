import { NavBar } from '@/components/NavBar';
import { ResumeGrader } from '@/components/ResumeGrader';

export const metadata = { title: 'Resume Fit Grader — HerMoneyMoves' };

export default function ResumePage() {
  return (
    <div className="min-h-screen bg-[#0a0618] text-white">
      <NavBar />

      {/* Page hero */}
      <section className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-4">AI-Powered</p>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h1 className="text-5xl lg:text-6xl font-black text-white leading-none mb-4">
                Resume<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-orange-400">
                  Fit Grader
                </span>
              </h1>
              <p className="text-slate-400 text-base max-w-lg leading-relaxed">
                Upload your resume and paste a job posting to see exactly how you measure up — with a fit score, power skill reframes, and ranked role matches.
              </p>
            </div>
            <div className="flex gap-6 shrink-0">
              {[
                { val: '5', label: 'role matches' },
                { val: '100%', label: 'AI-analyzed' },
                { val: '<60s', label: 'to results' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-black text-violet-400">{s.val}</p>
                  <p className="text-slate-500 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ResumeGrader />

      <footer className="border-t border-white/5 max-w-6xl mx-auto px-6 py-8 text-slate-600 text-xs text-center">
        HerMoneyMoves · Resume data is not stored.
      </footer>
    </div>
  );
}
