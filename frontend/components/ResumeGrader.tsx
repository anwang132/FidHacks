'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Sparkles, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { ParseResult, JobMatch } from '@/types';

interface LiveJob {
  title: string;
  company: string;
  location: string;
  salary_range: string;
  level: string;
  tags: string[];
  url: string;
}

function fitColor(score: number) {
  if (score >= 90) return { bar: 'bg-green-500', badge: 'bg-green-500/20 text-green-400 border-green-500/30', text: 'text-green-400' };
  if (score >= 75) return { bar: 'bg-teal-500', badge: 'bg-teal-500/20 text-teal-400 border-teal-500/30', text: 'text-teal-400' };
  if (score >= 60) return { bar: 'bg-amber-500', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', text: 'text-amber-400' };
  return { bar: 'bg-rose-500', badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30', text: 'text-rose-400' };
}

function JobCard({ job }: { job: JobMatch }) {
  const c = fitColor(job.fit_score);
  return (
    <div className="bg-slate-900/60 border border-slate-700/30 rounded-2xl p-5 flex flex-col gap-4 hover:border-slate-600/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold text-base leading-tight">{job.title}</h3>
          <p className="text-slate-500 text-xs mt-0.5">{job.company_type}</p>
        </div>
        <span className={`shrink-0 border text-xs font-bold px-2.5 py-1 rounded-full ${c.badge}`}>
          {job.fit_label}
        </span>
      </div>

      {/* Fit bar */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-500">Fit Score</span>
          <span className={`font-bold ${c.text}`}>{job.fit_score}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${job.fit_score}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${c.bar}`}
          />
        </div>
      </div>

      <div className="text-xs text-slate-400 font-medium">{job.salary_range}</div>

      {/* Reasons */}
      <div className="space-y-1.5">
        {job.match_reasons.map((r, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
            <CheckCircle size={12} className="text-green-400 shrink-0 mt-0.5" />
            {r}
          </div>
        ))}
        {job.gap_areas.map((g, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
            <AlertCircle size={12} className="text-amber-400 shrink-0 mt-0.5" />
            {g}
          </div>
        ))}
      </div>
    </div>
  );
}

const FALLBACK: ParseResult = {
  reframed_skills: [
    'Led cross-functional initiatives driving measurable outcomes',
    'Managed stakeholder communications and project timelines',
    'Executed data-driven strategies with budget ownership',
    'Built and mentored high-performance team members',
    'Delivered complex technical solutions under tight deadlines',
  ],
  suggested_salary: 85000,
  job_matches: [
    { title: 'Product Manager', company_type: 'Tech / Growth Stage', fit_score: 88, fit_label: 'Strong Match', match_reasons: ['Leadership experience aligns with PM scope', 'Cross-functional background is core to this role'], gap_areas: ['Deepen technical product knowledge'], salary_range: '$90,000 – $120,000' },
    { title: 'Operations Manager', company_type: 'Enterprise', fit_score: 80, fit_label: 'Strong Match', match_reasons: ['Stakeholder management translates directly', 'Budget ownership is a strong signal'], gap_areas: ['Build enterprise tooling familiarity'], salary_range: '$85,000 – $110,000' },
    { title: 'Strategy & Analytics Lead', company_type: 'Consulting', fit_score: 74, fit_label: 'Good Match', match_reasons: ['Data-driven mindset is a strong fit', 'Project delivery background is valued'], gap_areas: ['Quantify impact metrics more explicitly'], salary_range: '$80,000 – $105,000' },
    { title: 'Program Manager', company_type: 'Nonprofit / Government', fit_score: 70, fit_label: 'Good Match', match_reasons: ['Team leadership transfers well', 'Communication skills are a differentiator'], gap_areas: ['Gain exposure to public sector workflows'], salary_range: '$75,000 – $95,000' },
    { title: 'Growth Manager', company_type: 'Early-stage Startup', fit_score: 62, fit_label: 'Stretch Role', match_reasons: ['Execution mindset maps to growth work', 'Startup adaptability is a plus'], gap_areas: ['Build hands-on growth tooling experience'], salary_range: '$80,000 – $115,000' },
  ],
};

export function ResumeGrader() {
  const [file, setFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [liveJobs, setLiveJobs] = useState<LiveJob[] | null>(null);
  const [liveJobsLoading, setLiveJobsLoading] = useState(false);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const fetchLiveJobs = async (role: string) => {
    setLiveJobsLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      const res = await fetch(`${apiBase}/api/job-search?role=${encodeURIComponent(role)}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setLiveJobs(data.jobs ?? []);
    } catch {
      setLiveJobs([]);
    } finally {
      setLiveJobsLoading(false);
    }
  };

  const analyze = async () => {
    setLoading(true);
    setIsDemo(false);
    setLiveJobs(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const fd = new FormData();
      if (file) fd.append('file', file);
      fd.append('jobTitle', jobTitle);
      fd.append('jobDescription', jobDescription);
      const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      const res = await fetch(`${base}/api/parse-resume`, {
        method: 'POST',
        body: fd,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ParseResult = await res.json();
      if (!data.job_matches?.length) throw new Error('Empty response');
      setResult(data);
      // kick off live job search for top match in parallel
      if (data.job_matches[0]?.title) fetchLiveJobs(data.job_matches[0].title);
    } catch {
      clearTimeout(timer);
      setIsDemo(true);
      setResult(FALLBACK);
      fetchLiveJobs(jobTitle || 'Software Engineer');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setIsDemo(false);
    setLiveJobs(null);
    setFile(null);
    setJobTitle('');
    setJobDescription('');
  };

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto px-6 py-16"
      >
        {isDemo && (
          <div className="mb-8 bg-amber-900/30 border border-amber-700/40 rounded-xl px-5 py-3 flex items-center gap-3 text-sm">
            <span className="text-amber-400 text-lg">⚠️</span>
            <span className="text-amber-300">
              <strong>Sample data</strong> — the AI backend is not reachable. Start the backend server for real personalized analysis.
            </span>
          </div>
        )}
          {/* Summary row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="md:col-span-2 bg-gradient-to-br from-violet-950/60 to-indigo-950/40 border border-violet-700/30 rounded-2xl p-6">
              <p className="text-violet-300 text-xs font-semibold uppercase tracking-widest mb-2">Estimated Market Value</p>
              <p className="text-5xl font-black text-white mb-1">${result.suggested_salary.toLocaleString()}</p>
              <p className="text-slate-400 text-sm">annual base salary · United States mid-market</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-700/30 rounded-2xl p-6">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">Power Skills</p>
              <ul className="space-y-1.5">
                {result.reframed_skills.slice(0, 4).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-violet-400 mt-0.5 shrink-0">✦</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Job matches */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Job Matches</h2>
              <p className="text-slate-400 text-sm mt-1">Ranked by fit to your background</p>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-slate-700/40 hover:border-slate-600 rounded-xl px-4 py-2 transition-colors"
            >
              <RefreshCw size={14} />
              New Analysis
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
            {result.job_matches.map((job, i) => (
              <JobCard key={i} job={job} />
            ))}
          </div>

          {/* Live Job Postings */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Live Postings</h2>
                <p className="text-slate-400 text-sm mt-1">
                  AI-curated listings matching your top role —{' '}
                  <span className="text-violet-400">{result.job_matches[0]?.title}</span>
                </p>
              </div>
              {liveJobs && liveJobs.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-green-400 border border-green-700/30 bg-green-900/20 rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  {liveJobs.length} listings
                </span>
              )}
            </div>

            {liveJobsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-slate-900/40 border border-slate-700/20 rounded-2xl p-5 animate-pulse">
                    <div className="h-4 bg-slate-700/40 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-slate-700/30 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-slate-700/20 rounded w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {!liveJobsLoading && liveJobs && liveJobs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveJobs.map((job, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-700/30 rounded-2xl p-5 flex flex-col gap-3 hover:border-violet-600/40 transition-colors group">
                    <div>
                      <h3 className="text-white font-semibold text-sm leading-tight">{job.title}</h3>
                      <p className="text-slate-400 text-xs mt-0.5">{job.company}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {job.tags.map((tag, t) => (
                        <span key={t} className="bg-violet-900/30 border border-violet-700/30 text-violet-300 text-xs px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{job.location}</span>
                      <span className="text-green-400 font-medium">{job.salary_range}</span>
                    </div>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto flex items-center justify-center gap-1.5 w-full border border-slate-700/40 group-hover:border-violet-600/50 group-hover:bg-violet-900/20 text-slate-400 group-hover:text-violet-300 text-xs font-medium py-2 rounded-xl transition-all"
                    >
                      <ExternalLink size={12} />
                      View on LinkedIn
                    </a>
                  </div>
                ))}
              </div>
            )}

            {!liveJobsLoading && liveJobs && liveJobs.length === 0 && (
              <p className="text-slate-500 text-sm">No live postings found — try a different role title above.</p>
            )}
          </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left: form */}
        <div className="space-y-5">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Analyze Your Fit</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Upload your resume and optionally paste a job posting. We'll score your fit and surface the best-matched roles on the market.
            </p>
          </div>

          {/* Upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
              dragging
                ? 'border-violet-500 bg-violet-900/20'
                : 'border-slate-700/50 bg-slate-900/20 hover:border-violet-600/50 hover:bg-violet-900/10'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText size={28} className="text-violet-400" />
                <p className="text-violet-300 font-medium text-sm">{file.name}</p>
                <p className="text-slate-500 text-xs">Click to change</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload size={28} className="text-slate-500" />
                <p className="text-white text-sm font-medium">Drop your resume here</p>
                <p className="text-slate-500 text-xs">PDF, DOCX, or TXT · Optional but recommended</p>
              </div>
            )}
          </div>

          {/* Job title */}
          <input
            type="text"
            placeholder="Target role (e.g. Product Manager)"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-full bg-slate-900/40 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/60 transition-colors"
          />

          {/* Job description */}
          <div>
            <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider">
              Paste a job posting — optional
            </label>
            <textarea
              rows={5}
              placeholder="Paste the full job description here to get a specific fit score..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full bg-slate-900/40 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/60 transition-colors resize-none"
            />
          </div>

          <button
            onClick={analyze}
            disabled={loading || (!file && !jobTitle && !jobDescription)}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing your fit...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Analyze My Fit
              </>
            )}
          </button>
        </div>

        {/* Right: info */}
        <div className="space-y-6 lg:pt-14">
          <div className="bg-slate-900/40 border border-slate-700/20 rounded-2xl p-6">
            <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-4">What you'll get</p>
            <ul className="space-y-4">
              {[
                { icon: '💰', title: 'Market Value Estimate', desc: 'Your realistic mid-market salary based on your background and role.' },
                { icon: '📊', title: 'Fit-Scored Job Matches', desc: '5 role matches ranked by how well your experience translates.' },
                { icon: '✦', title: 'Power Skill Reframes', desc: 'Your experience rewritten in the language that gets callbacks.' },
                { icon: '🎯', title: 'Specific Gap Analysis', desc: "One actionable area to close for each role you're targeting." },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{item.title}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-slate-600 text-xs">
            No resume? Enter just a job title and we'll estimate fit for that role category.
          </p>
        </div>
      </div>
    </div>
  );
}
