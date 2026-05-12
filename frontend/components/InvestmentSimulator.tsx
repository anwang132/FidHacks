'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

interface AdviceItem { title: string; advice: string; }

interface TickerData {
  price: number;
  day_pct: number;
  yr_return: number;
}

interface MarketData {
  annual_spy: { year: number; spx: number }[];
  tickers: Record<string, TickerData>;
}

const LIVING_COSTS: Record<string, { annual: number; label: string }> = {
  high:    { annual: 55000, label: 'High Cost City (NYC, SF, Boston)' },
  average: { annual: 38000, label: 'Average Cost City (Denver, Austin)' },
  low:     { annual: 25000, label: 'Low Cost City (Raleigh, Columbus)' },
};

const RISK_RATES: Record<string, { rate: number; label: string; desc: string }> = {
  conservative: { rate: 0.04, label: 'Conservative', desc: 'Bonds & index funds — lower risk, steady return' },
  moderate:     { rate: 0.07, label: 'Moderate', desc: 'Diversified stocks — historical S&P 500 avg after inflation' },
  aggressive:   { rate: 0.10, label: 'Aggressive', desc: 'Growth stocks — higher upside, higher volatility' },
};

const TAX_RATE = 0.27;

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

function fmtFull(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-2">Year {label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-semibold mb-0.5" style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

function SegmentControl({ options, value, onChange }: {
  options: { key: string; label: string; sub: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`rounded-xl py-3 px-2 text-center transition-all ${
            value === opt.key
              ? 'bg-violet-600 text-white border border-violet-500'
              : 'bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:border-violet-700/50'
          }`}
        >
          <p className="text-sm font-medium">{opt.label}</p>
          <p className="text-xs opacity-70">{opt.sub}</p>
        </button>
      ))}
    </div>
  );
}

function BudgetRow({ label, value, color, border = false }: {
  label: string; value: string; color: string; border?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center py-2 ${border ? 'border-t border-slate-700/40 mt-1 pt-3' : ''}`}>
      <span className="text-slate-400 text-xs">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function TickerCard({ symbol, data }: { symbol: string; data: TickerData }) {
  const up = data.day_pct >= 0;
  return (
    <div className="bg-slate-900/60 border border-slate-700/30 rounded-xl px-4 py-3 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-white font-bold text-sm">{symbol}</span>
        <span className={`text-xs font-semibold flex items-center gap-0.5 ${up ? 'text-green-400' : 'text-red-400'}`}>
          {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {up ? '+' : ''}{data.day_pct.toFixed(2)}%
        </span>
      </div>
      <p className="text-white font-semibold">${data.price.toFixed(2)}</p>
      <p className="text-slate-500 text-xs">1Y: <span className="text-green-400">+{data.yr_return.toFixed(1)}%</span></p>
    </div>
  );
}

export function InvestmentSimulator() {
  const [salary, setSalary]         = useState(85000);
  const [rawSalary, setRawSalary]   = useState('85000');
  const [location, setLocation]     = useState('average');
  const [contribution, setContribution] = useState(20);
  const [risk, setRisk]             = useState('moderate');
  const [showSPX, setShowSPX]       = useState(true);

  const [userContext, setUserContext]     = useState('');
  const [adviceItems, setAdviceItems]     = useState<AdviceItem[] | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError]     = useState('');

  const [marketData, setMarketData]       = useState<MarketData | null>(null);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
    fetch(`${apiBase}/api/market-data`)
      .then((r) => r.json())
      .then((d) => setMarketData(d))
      .catch(() => null);
  }, []);

  const {
    netMonthly, livingMonthly, disposableMonthly, investMonthly, freeMonthly,
    chartData, finalWealth, totalContributed,
  } = useMemo(() => {
    const livingCost  = LIVING_COSTS[location].annual;
    const rate        = RISK_RATES[risk].rate;
    const netAnnual   = salary * (1 - TAX_RATE);
    const disposable  = Math.max(netAnnual - livingCost, 0);
    const annualInvest = disposable * (contribution / 100);

    let wealth    = 0;
    let cashTotal = 0;

    // Build SPX wealth line from cumulative % returns
    let spxWealth  = 0;
    const spyReturns = marketData?.annual_spy ?? [];

    const data: {
      year: number; Cash: number; Wealth: number; 'S&P 500'?: number;
    }[] = [];

    for (let y = 1; y <= 10; y++) {
      wealth     = (wealth + annualInvest) * (1 + rate);
      cashTotal += annualInvest;

      let spxVal: number | undefined;
      if (spyReturns[y - 1]) {
        const cumPct = spyReturns[y - 1].spx / 100 + 1;
        spxWealth = cashTotal * cumPct;
        spxVal    = Math.round(spxWealth);
      }

      const point: { year: number; Cash: number; Wealth: number; 'S&P 500'?: number } = {
        year: y,
        Cash: Math.round(cashTotal),
        Wealth: Math.round(wealth),
      };
      if (spxVal !== undefined) point['S&P 500'] = spxVal;
      data.push(point);
    }

    return {
      netMonthly:        netAnnual / 12,
      livingMonthly:     livingCost / 12,
      disposableMonthly: disposable / 12,
      investMonthly:     annualInvest / 12,
      freeMonthly:       Math.max(disposable - annualInvest, 0) / 12,
      chartData:         data,
      finalWealth:       Math.round(wealth),
      totalContributed:  Math.round(cashTotal),
    };
  }, [salary, location, contribution, risk, marketData]);

  const gain = finalWealth - totalContributed;

  const handleSalaryChange = (raw: string) => {
    const clean = raw.replace(/[^0-9]/g, '');
    setRawSalary(clean);
    const n = parseInt(clean, 10);
    if (!isNaN(n) && n > 0) setSalary(n);
  };

  const getAdvice = async () => {
    if (!userContext.trim()) return;
    setAdviceLoading(true);
    setAdviceError('');
    setAdviceItems(null);
    try {
      const apiBase  = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000);
      const res = await fetch(`${apiBase}/api/invest-advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salary,
          location,
          contribution_pct: contribution,
          risk,
          monthly_invest: investMonthly,
          final_wealth: finalWealth,
          user_context: userContext.trim(),
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAdviceItems(data.advice);
    } catch {
      setAdviceError("Couldn't reach the AI — make sure the backend is running on port 8000.");
    } finally {
      setAdviceLoading(false);
    }
  };

  const needsPct   = Math.round((LIVING_COSTS[location].annual / (salary * (1 - TAX_RATE))) * 100);
  const investPct  = contribution;
  const freePct    = Math.max(0, 100 - needsPct - investPct);
  const spxFinal   = chartData[9]?.['S&P 500'];
  const spxDiff    = spxFinal ? spxFinal - finalWealth : null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* ── Left: Controls + Budget ── */}
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Your Numbers</h2>
            <p className="text-slate-400 text-sm">Adjust each input to model your real financial picture.</p>
          </div>

          {/* Salary */}
          <div>
            <label className="block text-xs text-slate-400 font-semibold uppercase tracking-widest mb-2">
              Annual Salary (pre-tax)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={rawSalary}
                onChange={(e) => handleSalaryChange(e.target.value)}
                onBlur={() => setRawSalary(String(salary))}
                className="w-full bg-slate-900/60 border border-slate-700/40 rounded-xl pl-8 pr-4 py-3.5 text-white text-lg font-bold outline-none focus:border-violet-500/60 transition-colors"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs text-slate-400 font-semibold uppercase tracking-widest mb-2">
              Where you live
            </label>
            <SegmentControl
              value={location}
              onChange={setLocation}
              options={[
                { key: 'high',    label: 'High Cost',  sub: '~$55k/yr' },
                { key: 'average', label: 'Average',    sub: '~$38k/yr' },
                { key: 'low',     label: 'Low Cost',   sub: '~$25k/yr' },
              ]}
            />
            <p className="text-slate-600 text-xs mt-2">{LIVING_COSTS[location].label}</p>
          </div>

          {/* Contribution */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
                Investment Rate
              </label>
              <span className="text-violet-300 text-sm font-bold">{contribution}% of take-home</span>
            </div>
            <input
              type="range" min={0} max={50} value={contribution}
              onChange={(e) => setContribution(parseInt(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer"
            />
            <div className="flex justify-between text-slate-600 text-xs mt-1">
              <span>0%</span><span>25%</span><span>50%</span>
            </div>
            <p className="text-slate-600 text-xs mt-1">
              {contribution < 10
                ? '💡 The 50/30/20 rule recommends at least 20% toward savings & investments.'
                : contribution < 20
                  ? '✓ Good start. Increasing to 20%+ has an outsized long-term impact.'
                  : '🔥 Strong rate. Compound interest will work hard for you.'}
            </p>
          </div>

          {/* Risk */}
          <div>
            <label className="block text-xs text-slate-400 font-semibold uppercase tracking-widest mb-2">
              Portfolio Risk
            </label>
            <SegmentControl
              value={risk}
              onChange={setRisk}
              options={[
                { key: 'conservative', label: 'Safe',       sub: '4% avg' },
                { key: 'moderate',     label: 'Moderate',   sub: '7% avg' },
                { key: 'aggressive',   label: 'Aggressive', sub: '10% avg' },
              ]}
            />
            <p className="text-slate-600 text-xs mt-2">{RISK_RATES[risk].desc}</p>
          </div>

          {/* Budget Snapshot */}
          <div className="bg-slate-900/50 border border-slate-700/20 rounded-2xl p-5">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">Monthly Budget Snapshot</p>
            <p className="text-slate-600 text-xs mb-4">Estimated — based on your inputs</p>

            <BudgetRow label="Gross income"                       value={`${fmtFull(salary / 12)}/mo`}               color="text-white" />
            <BudgetRow label="Est. taxes (~27%)"                  value={`−${fmtFull(salary * TAX_RATE / 12)}/mo`}   color="text-slate-500" />
            <BudgetRow label="Net take-home"                      value={`${fmtFull(netMonthly)}/mo`}                color="text-white"     border />
            <BudgetRow label={`Housing & living (${location} COL)`} value={`−${fmtFull(livingMonthly)}/mo`}          color="text-rose-400" />
            <BudgetRow label="Disposable income"                  value={`${fmtFull(disposableMonthly)}/mo`}         color="text-white"     border />
            <BudgetRow label={`Investments (${contribution}%)`}   value={`${fmtFull(investMonthly)}/mo`}             color="text-green-400" />
            <BudgetRow label="Free to spend"                      value={`${fmtFull(freeMonthly)}/mo`}               color="text-slate-300" />

            {/* 50/30/20 bar */}
            <div className="mt-4 pt-4 border-t border-slate-700/40">
              <p className="text-xs text-slate-500 mb-2">Your budget split vs. 50/30/20 rule</p>
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                <div className="bg-rose-500"   style={{ width: `${Math.min(needsPct, 100)}%` }} />
                <div className="bg-violet-500" style={{ width: `${Math.min(investPct, Math.max(0, 100 - needsPct))}%` }} />
                <div className="bg-slate-600"  style={{ width: `${Math.min(freePct, 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-600 mt-1.5">
                <span className="text-rose-400">{needsPct}% needs</span>
                <span className="text-violet-400">{investPct}% investing</span>
                <span>{freePct}% free</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Market Pulse + Chart + AI ── */}
        <div className="space-y-6">

          {/* Live Market Pulse */}
          {marketData && (
            <div className="bg-slate-900/40 border border-slate-700/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Live Market Pulse</p>
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Live
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(marketData.tickers).map(([sym, data]) => (
                  <TickerCard key={sym} symbol={sym} data={data} />
                ))}
              </div>
            </div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/60 border border-slate-700/30 rounded-xl p-4 text-center">
              <p className="text-slate-500 text-xs mb-1">Contributed</p>
              <p className="text-white font-bold text-xl">{fmt(totalContributed)}</p>
            </div>
            <div className="bg-violet-900/30 border border-violet-700/30 rounded-xl p-4 text-center">
              <p className="text-violet-300 text-xs mb-1">Total Wealth</p>
              <p className="text-white font-bold text-xl">{fmt(finalWealth)}</p>
            </div>
            <div className="bg-green-900/20 border border-green-700/20 rounded-xl p-4 text-center">
              <p className="text-green-400 text-xs mb-1">Market Gains</p>
              <p className="text-green-300 font-bold text-xl">+{fmt(gain)}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-slate-900/40 border border-slate-700/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">10-Year Growth Projection</p>
              {marketData && (
                <button
                  onClick={() => setShowSPX((v) => !v)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    showSPX
                      ? 'bg-emerald-900/40 border-emerald-700/40 text-emerald-300'
                      : 'bg-slate-800 border-slate-700/30 text-slate-500'
                  }`}
                >
                  S&P 500 compare
                </button>
              )}
            </div>
            <ResponsiveContainer width="100%" height={290}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="spxGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" stroke="#475569" tick={{ fontSize: 11 }} tickFormatter={(v) => `Yr ${v}`} />
                <YAxis stroke="#475569" tick={{ fontSize: 11 }} tickFormatter={fmt} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Area type="monotone" dataKey="Cash"   stroke="#f97316" strokeWidth={2}   fill="url(#cGrad)"   name="Cash Contributed" />
                <Area type="monotone" dataKey="Wealth" stroke="#7c3aed" strokeWidth={2.5} fill="url(#wGrad)"   name="Your Projection" />
                {showSPX && marketData && (
                  <Area type="monotone" dataKey="S&P 500" stroke="#10b981" strokeWidth={2} strokeDasharray="5 3" fill="url(#spxGrad)" name="S&P 500 (actual)" />
                )}
              </AreaChart>
            </ResponsiveContainer>

            {/* SPX comparison note */}
            {showSPX && spxDiff !== null && marketData && (
              <p className="text-xs text-slate-500 mt-3 border-t border-slate-700/30 pt-3">
                {spxDiff > 0
                  ? `📈 The actual S&P 500 over this period outpaced your projection by ${fmt(spxDiff)} — historical bull run.`
                  : `✓ Your ${RISK_RATES[risk].label.toLowerCase()} projection outpaced the actual S&P 500 by ${fmt(Math.abs(spxDiff))}.`}
              </p>
            )}
          </div>

          {/* Insight */}
          <div className="bg-violet-950/40 border border-violet-800/30 rounded-2xl p-5">
            <p className="text-violet-300 text-xs font-semibold uppercase tracking-widest mb-2">Your 10-Year Summary</p>
            <p className="text-white text-sm leading-relaxed">
              At <strong className="text-violet-300">{fmtFull(salary)}/yr</strong> you invest{' '}
              <strong className="text-violet-300">{fmtFull(investMonthly)}/mo</strong> after living costs.
              At a <strong className="text-violet-300">{RISK_RATES[risk].label.toLowerCase()}</strong> {RISK_RATES[risk].rate * 100}% return,
              that grows to <strong className="text-green-300">{fmt(finalWealth)}</strong> —{' '}
              <strong className="text-green-300">+{fmt(gain)}</strong> from compound gains alone.
            </p>
          </div>

          {/* Education panels */}
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-slate-900/40 border border-slate-700/20 rounded-xl p-5">
              <p className="text-white text-sm font-semibold mb-2">📈 Why compound interest matters</p>
              <p className="text-slate-400 text-xs leading-relaxed">
                At 7% annual return, every $1 invested today is worth $1.97 in 10 years — without adding another cent.
                The earlier you start, the more time compounds. Waiting just 5 years to start can cost more
                than the total you would have contributed in those 5 years.
              </p>
            </div>
            <div className="bg-slate-900/40 border border-slate-700/20 rounded-xl p-5">
              <p className="text-white text-sm font-semibold mb-2">💰 The 50/30/20 Rule</p>
              <p className="text-slate-400 text-xs leading-relaxed">
                50% of take-home toward needs (housing, food, transport), 30% toward wants,
                and 20% toward savings and investments.
                Your current split:{' '}
                <span className="text-rose-400">{needsPct}% needs</span> ·{' '}
                <span className="text-violet-400">{investPct}% investing</span> ·{' '}
                <span className="text-slate-300">{freePct}% free spending</span>.
              </p>
            </div>
            <div className="bg-slate-900/40 border border-slate-700/20 rounded-xl p-5">
              <p className="text-white text-sm font-semibold mb-2">🏦 What to invest in first</p>
              <p className="text-slate-400 text-xs leading-relaxed">
                Step 1: 401(k) up to the employer match (free money). Step 2: max your Roth IRA ($7,000/yr).
                Step 3: remaining in a brokerage with low-cost index funds like VTI or VOO.
                Most active fund managers can't beat index funds over 10+ year periods.
              </p>
            </div>
          </div>

          {/* AI Advice Panel */}
          <div className="bg-slate-900/50 border border-violet-800/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-violet-400" />
              <p className="text-white font-semibold text-sm">Get Personalized AI Advice</p>
            </div>
            <p className="text-slate-400 text-xs mb-4 leading-relaxed">
              Tell the AI about your situation — your age, goals, timeline, or anything on your mind.
              It will give you specific, actionable recommendations based on your numbers above.
            </p>
            <textarea
              rows={3}
              value={userContext}
              onChange={(e) => setUserContext(e.target.value)}
              placeholder="e.g. I'm 23, just started my first job, and want to buy a house in 5 years. I have $8k in savings already."
              className="w-full bg-slate-800/50 border border-slate-700/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 transition-colors resize-none mb-3"
            />
            <button
              onClick={getAdvice}
              disabled={adviceLoading || !userContext.trim()}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {adviceLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing your situation...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Get My AI Advice
                </>
              )}
            </button>

            {adviceError && (
              <p className="text-amber-400 text-xs mt-3">⚠️ {adviceError}</p>
            )}

            {adviceItems && (
              <div className="mt-5 space-y-4">
                <p className="text-violet-300 text-xs font-semibold uppercase tracking-widest">Your Personalized Plan</p>
                {adviceItems.map((item, i) => (
                  <div key={i} className="border-l-2 border-violet-600/50 pl-4">
                    <p className="text-white text-sm font-semibold mb-1">{item.title}</p>
                    <p className="text-slate-400 text-xs leading-relaxed">{item.advice}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-slate-600 text-xs text-center">
            All figures are estimates. Market data via Yahoo Finance. Tax treatment varies.
            Consult a financial advisor for personalized advice.
          </p>
        </div>
      </div>
    </div>
  );
}
