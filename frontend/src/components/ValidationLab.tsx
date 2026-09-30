import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sliders,
  FileCheck
} from 'lucide-react';
import { api } from '../api/client';

export const ValidationLab: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState<boolean>(false);

  const fetchValidation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getValidation();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch validation lab data. Run analysis pipeline first.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidation();
  }, []);

  const handleResetScenario = async () => {
    setResetting(true);
    try {
      await api.resetScenario();
      await fetchValidation();
    } catch (err: any) {
      alert(`Error resetting scenario: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-slate-400 space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-cyan-400" />
        <p className="text-sm font-mono">Running Data Quality & Record Validation Engine...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto p-8 border border-rose-800 bg-rose-950/20 rounded-xl text-rose-300 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto" />
        <p className="text-sm">{error || 'No validation lab data available'}</p>
      </div>
    );
  }

  const { dataset_status, summary, issues } = data;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldAlert className="h-7 w-7 text-rose-400" />
            <span>Data Quality & Validation Lab</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pre-screening data sanity checks: timestamp integrity, duplicate filtering, impossible range removal, reference sensor validation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetScenario}
            disabled={resetting}
            className="btn-astra btn-secondary text-xs px-3.5 py-2 disabled:opacity-50"
          >
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span>RESET TO DEFAULT SCENARIO</span>
          </button>
          <button onClick={fetchValidation} className="btn-astra btn-secondary text-xs px-3 py-2">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>RE-RUN CHECKS</span>
          </button>
        </div>
      </div>

      {/* Dataset Status Banner */}
      <div className={`p-6 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs ${
        dataset_status === 'VALID'
          ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
          : dataset_status === 'SUSPECT'
          ? 'bg-amber-950/30 border-amber-800 text-amber-300'
          : 'bg-rose-950/40 border-rose-800 text-rose-300'
      }`}>
        <div className="flex items-center gap-4">
          {dataset_status === 'VALID' ? (
            <CheckCircle2 className="h-8 w-8 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-8 w-8 text-rose-400 shrink-0" />
          )}
          <div>
            <div className="text-base font-bold tracking-wider uppercase">DATASET INTEGRITY VERDICT: {dataset_status}</div>
            <p className="text-xs text-slate-300 mt-1 font-sans">
              Clean Records: <strong className="font-mono text-white">{summary?.clean_records}</strong> / {summary?.total_records} Total Telemetry Points
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded bg-black/40 border border-slate-700 text-slate-300">
            {summary?.missing_values} Missing Values
          </span>
          <span className="px-3 py-1.5 rounded bg-black/40 border border-slate-700 text-slate-300">
            {summary?.duplicates} Duplicates
          </span>
          <span className="px-3 py-1.5 rounded bg-black/40 border border-slate-700 text-rose-400 font-bold">
            {summary?.impossible_values} Out-of-Range Spikes
          </span>
        </div>
      </div>

      {/* Issues Log Table */}
      <div className="glass-card overflow-hidden border border-slate-800 space-y-3 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-cyan-400" />
          <span>Detected Data Quality Anomalies Log</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="astra-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Severity</th>
                <th>Affected Units / Channels</th>
                <th>Detailed Telemetry Message</th>
              </tr>
            </thead>
            <tbody>
              {issues && issues.map((iss: any, idx: number) => (
                <tr key={idx} className="font-mono text-xs hover:bg-slate-800/40">
                  <td className="font-bold text-cyan-400">{iss.type}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      iss.severity === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : iss.severity === 'WARNING'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {iss.severity}
                    </span>
                  </td>
                  <td className="text-slate-300 text-[11px]">
                    {iss.affected_components ? iss.affected_components.slice(0, 5).join(', ') : iss.component_id || 'Global'}
                    {iss.affected_components?.length > 5 ? ` (+${iss.affected_components.length - 5} more)` : ''}
                  </td>
                  <td className="text-slate-300 font-sans text-xs">{iss.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
