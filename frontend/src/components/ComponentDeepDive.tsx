import { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  Send, 
  RefreshCw,
  User,
  Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { api } from '../api/client';

interface ComponentDeepDiveProps {
  selectedComponentId: string;
  onSelectComponent: (componentId: string) => void;
}

export const ComponentDeepDive: React.FC<ComponentDeepDiveProps> = ({
  selectedComponentId,
  onSelectComponent,
}) => {
  const [componentList, setComponentList] = useState<string[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Decision Form State
  const [decision, setDecision] = useState<'ACCEPT' | 'HOLD' | 'RETEST' | 'REJECT' | 'ESCALATE'>('HOLD');
  const [rationale, setRationale] = useState<string>('');
  const [engineer, setEngineer] = useState<string>('ISRO-Sr-Reliability-Eng');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [decisionSaved, setDecisionSaved] = useState<any>(null);

  useEffect(() => {
    // Load component list for dropdown
    api.getComponents().then((res) => {
      setComponentList(res.components.map((c) => c.component_id));
    }).catch(() => {});
  }, []);

  const fetchDetail = async (compId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getComponentDetail(compId);
      setDetail(data);
      if (data.saved_decision) {
        setDecisionSaved(data.saved_decision);
        setDecision(data.saved_decision.decision);
        setRationale(data.saved_decision.rationale || '');
      } else {
        setDecisionSaved(null);
        setRationale('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch component details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedComponentId) {
      fetchDetail(selectedComponentId);
    }
  }, [selectedComponentId]);

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComponentId) return;
    setSubmitting(true);
    try {
      const res = await api.submitDecision({
        component_id: selectedComponentId,
        decision,
        rationale,
        engineer,
      });
      setDecisionSaved(res.record);
    } catch (err: any) {
      alert(`Error saving decision: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const presetRationaleOptions = [
    'System-wide supply noise detected on board. Part is component-consistent pass.',
    'Accelerating drift trajectory exceeds EOL margin. Rejecting part.',
    'Step change at hour 48 correlates with test bench power cycle. Retest required.',
    'Population shift observed across lot. Hold for secondary review.',
    'Verified stable baseline within 3.5 MAD boundary. Accept for flight lot.',
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-slate-400 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-cyan-400" />
        <p className="text-sm font-mono">Loading telemetry deep-dive for {selectedComponentId}...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-7xl mx-auto p-8 border border-rose-800 bg-rose-950/20 rounded-xl text-rose-300 text-center space-y-4">
        <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto" />
        <p className="text-sm">{error || 'Component detail not found'}</p>
      </div>
    );
  }

  const { screening, drift, forecast, attribution, historical_range } = detail;
  const timeSeriesData = screening.trajectory || [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Component Top Header bar */}
      <div className="glass-card p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-cyan-400">
            {detail.component_id}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white font-mono">{detail.component_id}</h2>
              <span className="text-xs font-mono text-slate-400">
                Board: <strong className="text-white">{screening.board_id}</strong> | Channel: <strong className="text-white">{screening.channel_id}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Screening Status: <strong className="text-cyan-300">{screening.screen_status}</strong> | Robust Z: <strong className="text-amber-300">{screening.robust_z_score.toFixed(2)}</strong>
            </p>
          </div>
        </div>

        {/* Component Selector Dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">SELECT COMPONENT:</span>
          <select
            value={selectedComponentId}
            onChange={(e) => onSelectComponent(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
          >
            {componentList.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Telemetry Time-Series Chart */}
      <div className="glass-card p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span>168-Hour Telemetry Trajectory & Prediction Extrapolation</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Resistance trajectory (Ω) over burn-in hours with Lot Robust Boundaries (±3.5 MAD) and End-of-Burn-in forecast.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <div className="h-2 w-4 bg-cyan-400 rounded-sm" />
              <span>Measured Telemetry</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-400">
              <div className="h-2 w-4 bg-purple-400 rounded-sm" />
              <span>Forecast</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <div className="h-0.5 w-4 bg-amber-400 border-dashed" />
              <span>3.5 MAD Boundary</span>
            </div>
          </div>
        </div>

        {/* Recharts Chart */}
        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Burn-In Hours', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Resistance (Ω)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#38bdf8' }}
              />

              {/* Reference Lines for Lot Boundaries */}
              {screening.boundary_low && (
                <ReferenceLine y={screening.boundary_low} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'MAD Low', fill: '#f59e0b', fontSize: 10 }} />
              )}
              {screening.boundary_high && (
                <ReferenceLine y={screening.boundary_high} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'MAD High', fill: '#f59e0b', fontSize: 10 }} />
              )}
              {screening.lot_median && (
                <ReferenceLine y={screening.lot_median} stroke="#10b981" strokeDasharray="2 2" label={{ value: 'Lot Median', fill: '#10b981', fontSize: 10 }} />
              )}

              {/* Measured values line */}
              <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4-Quadrant Evidence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Q1: Screening & Outlier Evidence */}
        <div className="glass-card p-5 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Q1: Lot-Relative Outlier Evidence
            </h4>
          </div>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Robust Z-Score:</span>
              <span className="font-bold text-cyan-300">{screening.robust_z_score.toFixed(3)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">MAD Deviation:</span>
              <span className="font-bold text-amber-300">{screening.mad_deviation.toFixed(3)} Ω</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Spec Status:</span>
              <span className={screening.spec_pass ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {screening.spec_pass ? 'PASS (8.0–12.0 Ω)' : 'FAIL'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Screening Status:</span>
              <span className="font-bold text-white">{screening.screen_status}</span>
            </div>
          </div>
        </div>

        {/* Q2: Drift Trajectory & Acceleration */}
        <div className="glass-card p-5 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <TrendingUp className="h-4 w-4 text-purple-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Q2: Drift & Acceleration Analysis
            </h4>
          </div>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Drift Classification:</span>
              <span className="font-bold text-purple-300">{drift.drift_class}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Theil-Sen Slope:</span>
              <span className="font-bold text-white">{drift.slope !== null ? `${drift.slope.toFixed(5)} Ω/h` : 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Forecast 168h Risk:</span>
              <span className="font-bold text-rose-400">{forecast.risk}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Confidence Level:</span>
              <span className="font-bold text-emerald-400">{drift.confidence}</span>
            </div>
          </div>
        </div>

        {/* Q3: System vs Component Pattern Attribution */}
        <div className="glass-card p-5 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Layers className="h-4 w-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Q3: Pattern Attribution & Isolation
            </h4>
          </div>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Attribution Label:</span>
              <span className="font-bold text-amber-300">{attribution.attribution}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Attribution Confidence:</span>
              <span className="font-bold text-white">{attribution.confidence}</span>
            </div>
            <div className="py-1">
              <span className="text-slate-400 block mb-1">Evidence Breakdown:</span>
              <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                {attribution.evidence_sources?.map((src: string, idx: number) => (
                  <li key={idx}>{src}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Q4: Historical & Population Context */}
        <div className="glass-card p-5 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Q4: Historical Population Context
            </h4>
          </div>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Historical Lot Medians Range:</span>
              <span className="font-bold text-white">
                {historical_range.low ? `${historical_range.low} – ${historical_range.high} Ω` : 'LOT-21..23 (9.98 – 10.12 Ω)'}
              </span>
            </div>
            <div className="py-2">
              <span className="text-slate-400 block mb-1">Reliability Risk Verdict:</span>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800">
                {screening.screen_status === 'PASS' && drift.drift_class === 'STABLE'
                  ? 'Component demonstrates robust, repeatable behavior within flight screening envelope.'
                  : 'Requires formal engineering decision. Check board-level noise correlation before condemning part.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Human-in-the-Loop Decision Station */}
      <div className="glass-card p-6 border-2 border-cyan-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-cyan-950/20 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Human Engineer Decision & Rationale Station
              </h3>
              <p className="text-xs text-slate-400">
                Record final reliability Disposition for <strong className="text-cyan-300 font-mono">{selectedComponentId}</strong> into SQLite audit database.
              </p>
            </div>
          </div>

          {decisionSaved && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-xs font-mono text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>SAVED: {decisionSaved.decision} @ {new Date(decisionSaved.timestamp).toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmitDecision} className="space-y-4">
          {/* Decision Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              1. Select Engineering Disposition
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { key: 'ACCEPT', label: 'ACCEPT (FLIGHT)', color: 'border-emerald-500 text-emerald-400 bg-emerald-950/30' },
                { key: 'HOLD', label: 'HOLD (RE-EVAL)', color: 'border-amber-500 text-amber-400 bg-amber-950/30' },
                { key: 'RETEST', label: 'RETEST BENCH', color: 'border-cyan-500 text-cyan-400 bg-cyan-950/30' },
                { key: 'REJECT', label: 'REJECT (SCRAP)', color: 'border-rose-500 text-rose-400 bg-rose-950/30' },
                { key: 'ESCALATE', label: 'ESCALATE (MRB)', color: 'border-purple-500 text-purple-400 bg-purple-950/30' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setDecision(opt.key as any)}
                  className={`p-3 rounded-xl border font-mono text-xs font-bold transition-all text-center ${
                    decision === opt.key
                      ? `${opt.color} shadow-lg ring-2 ring-cyan-500/50 scale-[1.02]`
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rationale Templates */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              2. Preset Rationale Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {presetRationaleOptions.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRationale(tmpl)}
                  className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-sans text-left"
                >
                  + {tmpl}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea & Engineer Input */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                3. Technical Rationale & Evidence Justification
              </label>
              <textarea
                rows={3}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Enter detailed engineering justification..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            <div className="space-y-3 flex flex-col justify-between">
              <div>
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  4. Sign-Off Engineer ID
                </label>
                <input
                  type="text"
                  value={engineer}
                  onChange={(e) => setEngineer(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-astra btn-primary w-full py-3 rounded-lg text-xs font-bold font-mono tracking-wider shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>SAVING TO SQLITE DB...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>SUBMIT DECISION</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
