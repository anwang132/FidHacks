'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Sparkles, RefreshCw } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { ResumedSkills } from '@/types';

export function Onboarding() {
  const { setResumeSkills, setBaseSalary, setNegotiatedSalary } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<ResumedSkills | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => setFile(f);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleParse = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      if (file) fd.append('file', file);
      fd.append('jobTitle', jobTitle);
      const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      const res = await fetch(`${base}/api/parse-resume`, { method: 'POST', body: fd });
      const data: ResumedSkills = await res.json();
      setSkills(data);
      setResumeSkills(data);
      setBaseSalary(data.suggested_salary);
      setNegotiatedSalary(data.suggested_salary);
    } catch {
      const fallback: ResumedSkills = {
        reframed_skills: ['Led cross-functional initiatives', 'Managed stakeholder outcomes', 'Delivered high-impact projects', 'Executed budget-aware strategies', 'Built high-performance teams'],
        suggested_roles: ['Software Engineer', 'Product Manager'],
        suggested_salary: 85000,
      };
      setSkills(fallback);
      setResumeSkills(fallback);
      setBaseSalary(fallback.suggested_salary);
      setNegotiatedSalary(fallback.suggested_salary);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSkills(null);
    setFile(null);
    setJobTitle('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-12 max-w-md mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 bg-violet-900/40 border border-violet-700/40 rounded-full px-4 py-1.5 mb-4">
          <Sparkles size={14} className="text-violet-400" />
          <span className="text-violet-300 text-xs font-medium">AI Resume Fit Grader</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2 leading-tight">
          Know Your<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-orange-400">Market Value ✦</span>
        </h1>
        <p className="text-slate-400 text-sm mt-3 leading-relaxed">
          Upload your resume and we'll reframe your experience in the language that commands higher salaries.
        </p>
      </motion.div>

      {!skills ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full space-y-4"
        >
          {/* Drag-drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 ${
              dragging
                ? 'border-violet-500 bg-violet-900/30'
                : 'border-violet-700/40 bg-violet-950/20 hover:border-violet-600/60 hover:bg-violet-900/20'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText size={32} className="text-violet-400" />
                <p className="text-violet-300 font-medium text-sm">{file.name}</p>
                <p className="text-slate-500 text-xs">Click to change</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload size={32} className="text-violet-500" />
                <p className="text-slate-300 text-sm font-medium">PDF or DOCX</p>
                <p className="text-slate-500 text-xs">We'll match roles to your skills</p>
              </div>
            )}
          </div>

          {/* Job title input */}
          <input
            type="text"
            placeholder="Target role or job title..."
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-full bg-violet-950/30 border border-violet-700/30 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/60 transition-colors"
          />

          <Button
            onClick={handleParse}
            disabled={loading}
            className="w-full py-4 text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing your skills...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles size={16} />
                Unlock My Market Value
              </span>
            )}
          </Button>

          <p className="text-center text-slate-600 text-xs">
            No resume? We'll use your job title to estimate your worth.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full space-y-5"
        >
          {/* Market value card */}
          <div className="bg-gradient-to-br from-violet-900/50 to-indigo-900/30 border border-violet-700/30 rounded-3xl p-6">
            <p className="text-violet-300 text-xs font-medium mb-1">YOUR MARKET VALUE</p>
            <p className="text-4xl font-bold text-white">
              ${skills.suggested_salary.toLocaleString()}
            </p>
            <p className="text-slate-400 text-xs mt-1">
              {skills.suggested_roles.join(' · ')}
            </p>
          </div>

          {/* Skills */}
          <div className="bg-slate-900/40 border border-slate-700/20 rounded-3xl p-5">
            <p className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wider">Your Power Skills</p>
            <ul className="space-y-2">
              {skills.reframed_skills.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-violet-400 mt-0.5">✦</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={reset} variant="ghost" className="w-full py-3 flex items-center justify-center gap-2">
            <RefreshCw size={15} />
            Analyze Another Role
          </Button>
        </motion.div>
      )}
    </div>
  );
}
