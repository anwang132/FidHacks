'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Sparkles, TrendingUp, TrendingDown, MapPin, Loader2, Info, Zap, Clock } from 'lucide-react';

interface AdviceItem { title: string; advice: string; }
interface TickerData  { price: number; day_pct: number; yr_return: number; }
interface MarketData  { annual_spy: { year: number; spx: number }[]; tickers: Record<string, TickerData>; }
interface COLData {
  city_label: string; annual_total: number; monthly_total: number;
  breakdown: { rent: number; food: number; transport: number; healthcare: number; utilities: number; other: number };
  col_tier: 'high' | 'average' | 'low'; context: string;
}

const COL_FALLBACK = 38000;
const TAX_RATE     = 0.27;

const RISK_RATES: Record<string, { rate: number; label: string; desc: string; color: string }> = {
  conservative: { rate: 0.04, label: 'Conservative', desc: 'Bonds & index funds — lower risk, steady 4% avg return',                        color: 'text-blue-600'   },
  moderate:     { rate: 0.07, label: 'Moderate',     desc: 'Diversified stocks — historical S&P 500 avg after inflation (7%)',               color: 'text-violet-600' },
  aggressive:   { rate: 0.10, label: 'Aggressive',   desc: 'Growth stocks — higher upside, higher volatility (10% avg)',                    color: 'text-orange-600' },
};

const BREAKDOWN_LABELS: Record<string, string> = {
  rent: 'Rent', food: 'Food', transport: 'Transport',
  healthcare: 'Healthcare', utilities: 'Utilities', other: 'Other',
};

const DELAY_OPTIONS = [
  { years: 0, label: 'Now'    },
  { years: 1, label: '+1 yr'  },
  { years: 2, label: '+2 yr'  },
  { years: 3, label: '+3 yr'  },
  { years: 5, label: '+5 yr'  },
];

const MILESTONES = [25_000, 50_000, 100_000, 250_000, 500_000];

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}
function fmtFull(n: number) { return `$${Math.round(n).toLocaleString()}`; }

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  const wealth = payload.find(p => p.name === 'Your Wealth')?.value ?? 0;
  const cash   = payload.find(p => p.name === 'Cash Put In')?.value ?? 0;
  const gain   = wealth - cash;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs shadow-lg min-w-[200px]">
      <p className="text-slate-500 font-semibold mb-2 pb-2 border-b border-slate-100">Year {label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-6 mb-1">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold" style={{ color: p.color }}>{fmt(p.value)}</span>
        </div>
      ))}
      {gain > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <div className="flex justify-between gap-6">
            <span className="text-emerald-600">Compound gains</span>
            <span className="font-bold text-emerald-600">+{fmt(gain)}</span>
          </div>
          <div className="flex justify-between gap-6 mt-0.5">
            <span className="text-slate-400">Return on contributions</span>
            <span className="text-slate-500">{cash > 0 ? ((gain / cash) * 100).toFixed(0) : 0}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SegmentControl({ options, value, onChange }: {
  options: { key: string; label: string; sub: string }[]; value: string; onChange: (k: string) => void;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((opt) => (
        <button key={opt.key} onClick={() => onChange(opt.key)}
          className={`rounded-xl py-3 px-2 text-center transition-all ${
            value === opt.key
              ? 'bg-violet-600 text-white border border-violet-500 shadow-sm'
              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:border-violet-300 hover:bg-slate-50'
          }`}>
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
    <div className={`flex justify-between items-center py-2 ${border ? 'border-t border-slate-200 mt-1 pt-3' : ''}`}>
      <span className="text-slate-500 text-xs">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function TickerCard({ symbol, data }: { symbol: string; data: TickerData }) {
  const up = data.day_pct >= 0;
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-slate-900 font-bold text-sm">{symbol}</span>
        <span className={`text-xs font-semibold flex items-center gap-0.5 ${up ? 'text-emerald-600' : 'text-red-500'}`}>
          {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {up ? '+' : ''}{data.day_pct.toFixed(2)}%
        </span>
      </div>
      <p className="text-slate-900 font-semibold">${data.price.toFixed(2)}</p>
      <p className="text-slate-400 text-xs">1Y: <span className="text-emerald-600">+{data.yr_return.toFixed(1)}%</span></p>
    </div>
  );
}

export function InvestmentSimulator() {
  const [salary, setSalary]             = useState(85000);
  const [rawSalary, setRawSalary]       = useState('85000');
  const [contribution, setContribution] = useState(20);
  const [risk, setRisk]                 = useState('moderate');
  const [showSPX, setShowSPX]           = useState(true);
  const [cityInput, setCityInput]       = useState('');
  const [colData, setColData]           = useState<COLData | null>(null);
  const [colLoading, setColLoading]     = useState(false);
  const [colError, setColError]         = useState('');
  const [userContext, setUserContext]   = useState('');
  const [adviceItems, setAdviceItems]   = useState<AdviceItem[] | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError]   = useState('');
  const [marketData, setMarketData]     = useState<MarketData | null>(null);
  const [raiseAmount, setRaiseAmount]   = useState(5000);
  const [delayYears, setDelayYears]     = useState(0);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
    fetch(`${apiBase}/api/market-data`).then(r => r.json()).then(d => setMarketData(d)).catch(() => null);
  }, []);

  const fetchCOL = async () => {
    const city = cityInput.trim();
    if (!city) return;
    setColLoading(true); setColError(''); setColData(null);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 20000);
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      const res  = await fetch(`${apiBase}/api/cost-of-living`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city }), signal: ctrl.signal,
      });
      clearTimeout(t);
      const data = await res.json();
      if (!res.ok) { setColError(data?.error ?? `Server error (${res.status})`); return; }
      if (typeof data.annual_total !== 'number' || data.annual_total <= 0) {
        setColError('Unexpected server data — please try again.'); return;
      }
      setColData(data as COLData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setColError(msg.includes('abort')
        ? 'Request timed out — try again.'
        : 'Cannot reach the backend. Make sure the server is running on port 8000.');
    } finally { setColLoading(false); }
  };

  const livingAnnual = colData?.annual_total ?? COL_FALLBACK;

  const {
    netMonthly, livingMonthly, disposableMonthly, investMonthly, freeMonthly,
    chartData, finalWealth, totalContributed, annualInvest,
  } = useMemo(() => {
    const rate       = RISK_RATES[risk].rate;
    const netAnnual  = salary * (1 - TAX_RATE);
    const disposable = Math.max(netAnnual - livingAnnual, 0);
    const annInvest  = disposable * (contribution / 100);

    let wealth = 0, cashTotal = 0, spxWealth = 0;
    const spyReturns = marketData?.annual_spy ?? [];
    const data: { year: number; 'Cash Put In': number; 'Your Wealth': number; 'S&P 500'?: number }[] = [];

    for (let y = 1; y <= 10; y++) {
      wealth    = (wealth + annInvest) * (1 + rate);
      cashTotal += annInvest;
      let spxVal: number | undefined;
      if (spyReturns[y - 1]) {
        spxWealth = cashTotal * (spyReturns[y - 1].spx / 100 + 1);
        spxVal = Math.round(spxWealth);
      }
      const pt: typeof data[0] = { year: y, 'Cash Put In': Math.round(cashTotal), 'Your Wealth': Math.round(wealth) };
      if (spxVal !== undefined) pt['S&P 500'] = spxVal;
      data.push(pt);
    }
    return {
      netMonthly:        netAnnual / 12,
      livingMonthly:     livingAnnual / 12,
      disposableMonthly: disposable / 12,
      investMonthly:     annInvest / 12,
      freeMonthly:       Math.max(disposable - annInvest, 0) / 12,
      chartData: data, finalWealth: Math.round(wealth),
      totalContributed: Math.round(cashTotal), annualInvest: annInvest,
    };
  }, [salary, livingAnnual, contribution, risk, marketData]);

  const gain           = finalWealth - totalContributed;
  const gainSharePct   = finalWealth > 0 ? Math.round((gain / finalWealth) * 100) : 0;
  const contribSharePct = 100 - gainSharePct;

  // ── Fixed bar math: all percentages relative to net take-home ──
  const needsPctBar  = netMonthly > 0 ? Math.min(100, Math.round((livingMonthly  / netMonthly) * 100)) : 0;
  const investPctBar = netMonthly > 0 ? Math.round((investMonthly / netMonthly) * 100) : 0;
  const freePctBar   = Math.max(0, 100 - needsPctBar - investPctBar);

  // ── Raise impact ──
  const rate               = RISK_RATES[risk].rate;
  const extraNetAnnual     = raiseAmount * (1 - TAX_RATE);
  const extraInvestAnnual  = extraNetAnnual * (contribution / 100);
  const extraInvestMonthly = extraInvestAnnual / 12;
  let extraWealth = 0;
  for (let y = 0; y < 10; y++) extraWealth = (extraWealth + extraInvestAnnual) * (1 + rate);
  extraWealth = Math.round(extraWealth);

  // ── Start-later tax ──
  const delayWealthMap = useMemo(() => DELAY_OPTIONS.map(opt => {
    let w = 0;
    for (let y = 0; y < Math.max(0, 10 - opt.years); y++) w = (w + annualInvest) * (1 + rate);
    return { ...opt, wealth: Math.round(w) };
  }), [annualInvest, rate]);

  // ── Milestone hits ──
  const milestoneHits = useMemo(() =>
    MILESTONES.map(m => ({ amount: m, year: chartData.find(d => d['Your Wealth'] >= m)?.year ?? null })),
  [chartData]);

  const getAdvice = async () => {
    if (!userContext.trim()) return;
    setAdviceLoading(true); setAdviceError(''); setAdviceItems(null);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 25000);
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
      const res = await fetch(`${apiBase}/api/invest-advice`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salary, location: colData?.city_label ?? 'national average',
          contribution_pct: contribution, risk,
          monthly_invest: investMonthly, final_wealth: finalWealth,
          user_context: userContext.trim(),
        }), signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAdviceItems((await res.json()).advice);
    } catch {
      setAdviceError("Couldn't reach the AI — make sure the backend is running on port 8000.");
    } finally { setAdviceLoading(false); }
  };

  const handleSalaryChange = (raw: string) => {
    const clean = raw.replace(/[^0-9]/g, '');
    setRawSalary(clean);
    const n = parseInt(clean, 10);
    if (!isNaN(n) && n > 0) setSalary(n);
  };

  const spxFinal = chartData[9]?.['S&P 500'];
  const spxDiff  = spxFinal != null ? spxFinal - finalWealth : null;
  const milestoneAmounts = [25000, 50000, 100000, 250000, 500000, 1000000].filter(
    m => m > totalContributed * 0.3 && m < finalWealth * 0.97);
  const selectedDelay = delayWealthMap.find(d => d.years === delayYears)!;

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-1">Your Numbers</h2>
            <p className="text-slate-500 text-sm">Adjust each input to model your real financial picture.</p>
          </div>

          {/* Salary */}
          <div>
            <label className="block text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">Annual Salary (pre-tax)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
              <input type="text" inputMode="numeric" value={rawSalary}
                onChange={e => handleSalaryChange(e.target.value)}
                onBlur={() => setRawSalary(String(salary))}
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-4 py-3.5 text-slate-900 text-lg font-bold outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">Where you live</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input type="text" value={cityInput} onChange={e => setCityInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') fetchCOL(); }}
                  placeholder="e.g. Austin, TX or New York"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" />
              </div>
              <button onClick={fetchCOL} disabled={colLoading || !cityInput.trim()}
                className="px-4 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 shrink-0">
                {colLoading ? <><Loader2 size={14} className="animate-spin" /> Estimating…</> : <><Sparkles size={14} /> Estimate</>}
              </button>
            </div>
            {colError && <div className="mt-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-xs text-rose-600">⚠️ {colError}</div>}
            {colData && !colLoading && (
              <div className="mt-3 bg-white border border-violet-200 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{colData.city_label}</p>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    colData.col_tier === 'high' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                    colData.col_tier === 'low'  ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                   'bg-amber-50 text-amber-600 border-amber-200'}`}>
                    {colData.col_tier === 'high' ? 'High Cost' : colData.col_tier === 'low' ? 'Low Cost' : 'Avg Cost'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{colData.context}</p>
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                  {Object.entries(colData.breakdown).map(([k, v]) => (
                    <div key={k} className="bg-slate-50 rounded-lg px-2 py-1.5 text-center">
                      <p className="text-[10px] text-slate-400">{BREAKDOWN_LABELS[k] ?? k}</p>
                      <p className="text-xs text-slate-700 font-semibold">${v.toLocaleString()}/mo</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-violet-600 font-semibold pt-1">
                  Total: ${colData.monthly_total.toLocaleString()}/mo · ${colData.annual_total.toLocaleString()}/yr
                </p>
              </div>
            )}
            {!colData && !colLoading && !colError && (
              <p className="text-slate-400 text-xs mt-2 flex items-start gap-1.5">
                <Info size={11} className="shrink-0 mt-0.5" />
                Type your city and tap Estimate — AI will calculate your real cost of living.
                Using $38k/yr national average until then.
              </p>
            )}
          </div>

          {/* Contribution slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Investment Rate</label>
              <span className="text-violet-600 text-sm font-bold">{contribution}% of disposable</span>
            </div>
            <input type="range" min={0} max={50} value={contribution}
              onChange={e => setContribution(parseInt(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer" />
            <div className="flex justify-between text-slate-400 text-xs mt-1"><span>0%</span><span>25%</span><span>50%</span></div>
            <p className="text-slate-400 text-xs mt-1">
              {contribution < 10 ? '💡 The 50/30/20 rule suggests at least 20% toward savings.'
                : contribution < 20 ? '✓ Good start. 20%+ has an outsized long-term impact.'
                : '🔥 Strong rate. Compound interest will work hard for you.'}
            </p>
          </div>

          {/* Risk */}
          <div>
            <label className="block text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">Portfolio Risk</label>
            <SegmentControl value={risk} onChange={setRisk} options={[
              { key: 'conservative', label: 'Safe',       sub: '4% avg' },
              { key: 'moderate',     label: 'Moderate',   sub: '7% avg' },
              { key: 'aggressive',   label: 'Aggressive', sub: '10% avg' },
            ]} />
            <p className={`text-xs mt-2 ${RISK_RATES[risk].color}`}>{RISK_RATES[risk].desc}</p>
          </div>

          {/* Budget Snapshot — fixed math */}
          <div className="bg-violet-50/40 border border-violet-200/60 rounded-2xl p-5">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1">Monthly Budget Snapshot</p>
            <p className="text-slate-400 text-xs mb-4">
              {colData ? `AI estimate for ${colData.city_label}` : 'National average — enter your city above for accuracy'}
            </p>
            <BudgetRow label="Gross income"       value={`${fmtFull(salary / 12)}/mo`}              color="text-slate-900" />
            <BudgetRow label="Est. taxes (~27%)"  value={`−${fmtFull(salary * TAX_RATE / 12)}/mo`}  color="text-slate-400" />
            <BudgetRow label="Net take-home"      value={`${fmtFull(netMonthly)}/mo`}               color="text-slate-900" border />
            {colData ? (
              <>
                {Object.entries(colData.breakdown).map(([k, v]) => (
                  <BudgetRow key={k} label={BREAKDOWN_LABELS[k] ?? k}
                    value={`−$${v.toLocaleString()}/mo`}
                    color={k === 'rent' ? 'text-rose-500' : 'text-rose-400'} />
                ))}
                <BudgetRow label="Total living costs" value={`−${fmtFull(livingMonthly)}/mo`} color="text-rose-500" border />
              </>
            ) : (
              <BudgetRow label="Housing & living (est.)" value={`−${fmtFull(livingMonthly)}/mo`} color="text-rose-500" />
            )}
            <BudgetRow label="Disposable income"                      value={`${fmtFull(disposableMonthly)}/mo`} color="text-slate-900" border />
            <BudgetRow label={`Investments (${contribution}% of disp.)`} value={`${fmtFull(investMonthly)}/mo`}    color="text-emerald-600" />
            <BudgetRow label="Free to spend"                           value={`${fmtFull(freeMonthly)}/mo`}        color="text-slate-600" />

            {/* Fixed bar: all segments as % of net take-home */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-400 mb-2">% of net take-home</p>
              <div className="flex h-3 rounded-full overflow-hidden gap-px">
                <div className="bg-rose-400   transition-all duration-500" style={{ width: `${Math.min(needsPctBar, 100)}%` }} />
                <div className="bg-violet-500 transition-all duration-500" style={{ width: `${Math.min(investPctBar, Math.max(0, 100 - needsPctBar))}%` }} />
                <div className="bg-teal-400   transition-all duration-500" style={{ width: `${Math.min(freePctBar, 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-1.5">
                <span className="text-rose-500">{needsPctBar}% living</span>
                <span className="text-violet-600">{investPctBar}% investing</span>
                <span className="text-teal-600">{freePctBar}% free</span>
              </div>
            </div>
          </div>

          {/* ── Raise Impact Calculator ── */}
          <div className="bg-gradient-to-br from-violet-50 to-orange-50 border border-violet-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} className="text-violet-600" />
              <p className="text-xs text-violet-600 font-bold uppercase tracking-widest">Negotiate Your Way to More</p>
            </div>
            <p className="text-slate-500 text-xs mb-5 leading-relaxed">
              Drag to see how a salary negotiation win compounds into real wealth over 10 years.
            </p>
            <div className="flex justify-between items-end mb-2">
              <label className="text-xs text-slate-500 font-semibold">Extra raise from negotiation</label>
              <span className="text-violet-700 font-black text-xl">+{fmtFull(raiseAmount)}</span>
            </div>
            <input type="range" min={0} max={25000} step={500} value={raiseAmount}
              onChange={e => setRaiseAmount(parseInt(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer mb-1" />
            <div className="flex justify-between text-slate-400 text-xs mb-5"><span>$0</span><span>$12,500</span><span>$25,000</span></div>

            {raiseAmount > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white border border-violet-200 rounded-xl p-3 text-center">
                    <p className="text-violet-600 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Extra invested/mo</p>
                    <p className="text-violet-700 font-black text-lg">+{fmtFull(extraInvestMonthly)}</p>
                  </div>
                  <div className="bg-white border border-orange-200 rounded-xl p-3 text-center">
                    <p className="text-orange-500 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Extra wealth yr 10</p>
                    <p className="text-orange-600 font-black text-lg">+{fmt(extraWealth)}</p>
                  </div>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed mb-4">
                  A <span className="font-semibold text-violet-700">+{fmtFull(raiseAmount)}/yr</span> raise compounded at {contribution}%
                  investment rate adds <span className="font-semibold text-orange-600">{fmt(extraWealth)}</span> to your 10-year wealth.
                </p>
              </>
            ) : (
              <p className="text-slate-400 text-xs text-center italic mb-4">Move the slider to see the impact →</p>
            )}
            <a href="/negotiate"
              className="flex items-center justify-center gap-2 w-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold py-3 rounded-xl transition-colors">
              Practice Negotiating This Raise →
            </a>
          </div>

          {/* AI Advice */}
          <div className="bg-white border border-violet-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-violet-500" />
              <p className="text-slate-900 font-semibold text-sm">Get Personalized AI Advice</p>
            </div>
            <p className="text-slate-500 text-xs mb-4 leading-relaxed">
              Tell the AI about your situation — age, goals, timeline, current savings.
              It will give specific, actionable recommendations based on your numbers above.
            </p>
            <textarea rows={3} value={userContext} onChange={e => setUserContext(e.target.value)}
              placeholder="e.g. I'm 23, just started my first job, and want to buy a house in 5 years. I have $8k in savings already."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none mb-3" />
            <button onClick={getAdvice} disabled={adviceLoading || !userContext.trim()}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              {adviceLoading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing…</>
                : <><Sparkles size={15} /> Get My AI Advice</>}
            </button>
            {adviceError && <p className="text-amber-500 text-xs mt-3">⚠️ {adviceError}</p>}
            {adviceItems && (
              <div className="mt-5 space-y-4">
                <p className="text-violet-600 text-xs font-semibold uppercase tracking-widest">Your Personalized Plan</p>
                {adviceItems.map((item, i) => (
                  <div key={i} className="border-l-2 border-violet-400 pl-4">
                    <p className="text-slate-900 text-sm font-semibold mb-1">{item.title}</p>
                    <p className="text-slate-600 text-xs leading-relaxed">{item.advice}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-6">

          {/* Live Market Pulse */}
          {marketData && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Live Market Pulse</p>
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(marketData.tickers).map(([sym, data]) => (
                  <TickerCard key={sym} symbol={sym} data={data} />
                ))}
              </div>
            </div>
          )}

          {/* Summary stat cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { bg: 'bg-white border-slate-200 shadow-sm', top: 'bg-orange-400', label: 'Cash Contributed',  val: fmt(totalContributed), valColor: 'text-orange-500' },
              { bg: 'bg-violet-50 border-violet-200',      top: 'bg-violet-500',  label: 'Total Wealth',      val: fmt(finalWealth),      valColor: 'text-slate-900'  },
              { bg: 'bg-emerald-50 border-emerald-200',    top: 'bg-emerald-500', label: 'Market Gains',      val: `+${fmt(gain)}`,        valColor: 'text-emerald-600' },
            ].map(c => (
              <div key={c.label} className={`border rounded-xl p-4 text-center overflow-hidden relative ${c.bg}`}>
                <div className={`absolute top-0 inset-x-0 h-1 rounded-t-xl ${c.top}`} />
                <p className="text-slate-400 text-xs mb-1 mt-0.5">{c.label}</p>
                <p className={`font-bold text-xl ${c.valColor}`}>{c.val}</p>
              </div>
            ))}
          </div>

          {/* Main chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-slate-900 font-semibold text-sm">10-Year Wealth Projection</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Investing {fmtFull(investMonthly)}/mo at {RISK_RATES[risk].rate * 100}% avg annual return
                </p>
              </div>
              {marketData && (
                <button onClick={() => setShowSPX(v => !v)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors shrink-0 ${
                    showSPX ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                  {showSPX ? '● S&P 500 on' : '○ S&P 500 off'}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-4 text-xs">
              <div className="flex items-center gap-2"><div className="w-3 h-2 rounded-sm bg-orange-400" />
                <span className="text-slate-500"><span className="text-orange-600 font-medium">Cash put in</span> — cumulative contributions</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-2 rounded-sm bg-violet-500" />
                <span className="text-slate-500"><span className="text-violet-600 font-medium">Your wealth</span> — contributions + compound returns</span></div>
              {showSPX && <div className="flex items-center gap-2">
                <div className="w-3 h-2 rounded-sm" style={{ borderTop: '2px dashed #059669', background: 'none' }} />
                <span className="text-slate-500"><span className="text-emerald-600 font-medium">S&P 500 actual</span> — historic comparison</span></div>}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f97316" stopOpacity={0.14} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="spxGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#059669" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `Yr ${v}`} />
                <YAxis stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmt} width={58} />
                <Tooltip content={<CustomTooltip />} />
                {milestoneAmounts.map(m => (
                  <ReferenceLine key={m} y={m} stroke="#e2e8f0" strokeDasharray="4 4"
                    label={{ value: fmt(m), position: 'insideTopRight', fill: '#94a3b8', fontSize: 10 }} />
                ))}
                <Area type="monotone" dataKey="Cash Put In" stroke="#f97316" strokeWidth={2}   fill="url(#cGrad)" />
                <Area type="monotone" dataKey="Your Wealth" stroke="#7c3aed" strokeWidth={2.5} fill="url(#wGrad)" />
                {showSPX && marketData && (
                  <Area type="monotone" dataKey="S&P 500" stroke="#059669" strokeWidth={2} strokeDasharray="6 3" fill="url(#spxGrad)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
            {showSPX && spxDiff !== null && marketData && (
              <p className="text-xs text-slate-400 mt-3 border-t border-slate-100 pt-3">
                {spxDiff > 0
                  ? `📈 Actual S&P 500 outpaced your ${RISK_RATES[risk].label.toLowerCase()} projection by ${fmt(spxDiff)}.`
                  : `✓ Your ${RISK_RATES[risk].label.toLowerCase()} projection beat the actual S&P 500 by ${fmt(Math.abs(spxDiff))}.`}
              </p>
            )}
          </div>

          {/* ── Cost of Waiting ── */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-orange-500" />
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">The Cost of Waiting</p>
            </div>
            <p className="text-slate-400 text-xs mb-4">
              Every year you delay costs more than the last. Tap a delay to see the wealth destroyed.
            </p>
            <div className="flex gap-2 mb-5">
              {DELAY_OPTIONS.map(opt => (
                <button key={opt.years} onClick={() => setDelayYears(opt.years)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    delayYears === opt.years
                      ? 'bg-orange-500 text-white border-orange-400 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-orange-300 hover:bg-orange-50'}`}>
                  {opt.label}
                </button>
              ))}
            </div>

            {delayYears === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center mb-4">
                <p className="text-emerald-600 font-black text-2xl">{fmt(finalWealth)}</p>
                <p className="text-emerald-600 text-xs font-semibold mt-1">Starting now — maximum wealth ✓</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-slate-400 text-[10px] font-semibold uppercase">If you wait</p>
                  <p className="text-slate-700 font-black text-xl mt-0.5">{fmt(selectedDelay.wealth)}</p>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                  <p className="text-rose-500 text-[10px] font-semibold uppercase">Wealth destroyed</p>
                  <p className="text-rose-600 font-black text-xl mt-0.5">−{fmt(finalWealth - selectedDelay.wealth)}</p>
                </div>
              </div>
            )}

            {/* Comparison bars */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {delayWealthMap.map(opt => {
                const pct = finalWealth > 0 ? (opt.wealth / finalWealth) * 100 : 0;
                return (
                  <div key={opt.years} className="flex items-center gap-3">
                    <span className="text-slate-400 text-[10px] w-10 shrink-0">{opt.label}</span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${
                        opt.years === 0 ? 'bg-emerald-500' : opt.years <= 2 ? 'bg-amber-400' : 'bg-rose-400'
                      }`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-slate-600 text-xs font-semibold w-14 text-right shrink-0">{fmt(opt.wealth)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Milestone Tracker ── */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1">Milestone Tracker</p>
            <p className="text-slate-400 text-xs mb-5">When do you hit each wealth milestone at your current rate?</p>
            <div className="space-y-4">
              {milestoneHits.map(({ amount, year }) => {
                const reached  = year !== null;
                const barPct   = reached ? Math.min(100, Math.round((year / 10) * 100)) : 100;
                const barColor = amount <= 50000   ? 'bg-teal-400'
                               : amount <= 100000  ? 'bg-violet-400'
                               : amount <= 250000  ? 'bg-violet-600'
                               : 'bg-orange-500';
                return (
                  <div key={amount}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-slate-700 text-sm font-bold">{fmt(amount)}</span>
                      {reached
                        ? <span className="text-teal-600 text-xs font-semibold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">Year {year} ✓</span>
                        : <span className="text-slate-400 text-xs">Not reached in 10 yrs</span>}
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${reached ? barColor : 'bg-slate-200 opacity-40'}`}
                        style={{ width: reached ? `${barPct}%` : '100%' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {milestoneHits.some(m => m.year === null) && (
              <p className="text-slate-400 text-xs mt-4 italic">
                Increase your investment rate or salary to unlock more milestones within 10 years.
              </p>
            )}
          </div>

          {/* Compound breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1">What Built Your Wealth?</p>
            <p className="text-slate-400 text-xs mb-4">
              After 10 years at {RISK_RATES[risk].rate * 100}% return, {gainSharePct}% of your portfolio came from compound returns.
            </p>
            <div className="flex h-5 rounded-full overflow-hidden gap-px mb-3">
              <div className="bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-700" style={{ width: `${contribSharePct}%` }} />
              <div className="bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-700" style={{ width: `${gainSharePct}%` }} />
            </div>
            <div className="flex justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-orange-400" />
                <span className="text-slate-500">Contributions</span>
                <span className="text-orange-500 font-bold">{fmt(totalContributed)} ({contribSharePct}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-violet-500" />
                <span className="text-slate-500">Market returns</span>
                <span className="text-violet-600 font-bold">{fmt(gain)} ({gainSharePct}%)</span>
              </div>
            </div>
          </div>

          {/* 10-Year summary */}
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
            <p className="text-violet-600 text-xs font-semibold uppercase tracking-widest mb-2">Your 10-Year Summary</p>
            <p className="text-slate-700 text-sm leading-relaxed">
              At <strong className="text-violet-700">{fmtFull(salary)}/yr</strong> in{' '}
              <strong className="text-violet-700">{colData?.city_label ?? 'your area'}</strong>, you invest{' '}
              <strong className="text-violet-700">{fmtFull(investMonthly)}/mo</strong> after living costs.
              At a <strong className="text-violet-700">{RISK_RATES[risk].label.toLowerCase()}</strong> {RISK_RATES[risk].rate * 100}% return,
              that becomes <strong className="text-emerald-600">{fmt(finalWealth)}</strong> — of which{' '}
              <strong className="text-emerald-600">{fmt(gain)}</strong> is pure compound growth.
            </p>
          </div>

          {/* Education */}
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-5">
              <p className="text-violet-700 text-sm font-semibold mb-2">📈 Why compound interest matters</p>
              <p className="text-slate-600 text-xs leading-relaxed">
                At 7% annual return, every $1 invested today is worth $1.97 in 10 years — without adding another cent.
                Waiting just 5 years to start can cost more than the total you would have contributed in those 5 years.
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
              <p className="text-orange-700 text-sm font-semibold mb-2">💰 The 50/30/20 Rule</p>
              <p className="text-slate-600 text-xs leading-relaxed">
                50% of take-home toward needs, 30% toward wants, 20% toward savings and investments.
                Your current split:{' '}
                <span className="text-rose-500">{needsPctBar}% living</span> ·{' '}
                <span className="text-violet-600">{investPctBar}% investing</span> ·{' '}
                <span className="text-teal-600">{freePctBar}% free spending</span>.
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <p className="text-emerald-700 text-sm font-semibold mb-2">🏦 What to invest in first</p>
              <p className="text-slate-600 text-xs leading-relaxed">
                Step 1: 401(k) up to employer match (free money). Step 2: max your Roth IRA ($7,000/yr).
                Step 3: remaining in a brokerage with low-cost index funds like VTI or VOO.
              </p>
            </div>
          </div>

          <p className="text-slate-400 text-xs text-center">
            All figures are estimates. Market data via Yahoo Finance. Tax treatment varies.
            Consult a financial advisor for personalized advice.
          </p>
        </div>
      </div>
    </div>
  );
}
