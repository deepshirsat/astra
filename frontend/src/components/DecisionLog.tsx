import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  RefreshCw, 
  AlertTriangle,
  Database
} from 'lucide-react';
import { api } from '../api/client';

export const DecisionLog: React.FC = () => {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDecisions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDecisions();
      setDecisions(res.decisions);
    } catch (err: any) {
      setError(err.message || 'Failed to load decisions from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(decisions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ASTRA-Q_Decision_Audit_Log_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-slate-400 space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-cyan-400" />
        <p className="text-sm font-mono">Fetching Engineer Decisions from SQLite Database...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <FileText className="h-7 w-7 text-cyan-400" />
            <span>Engineer Decision & Audit Trail Station</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable SQLite audit log recording all human reliability engineer dispositions, technical rationales, and timestamps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleExportJSON} className="btn-astra btn-primary text-xs px-4 py-2">
            <Download className="h-4 w-4" />
            <span>EXPORT AUDIT REPORT (JSON)</span>
          </button>
          <button onClick={fetchDecisions} className="btn-astra btn-secondary text-xs px-3 py-2">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>REFRESH LOG</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="glass-card p-8 border border-rose-800 bg-rose-950/20 text-rose-300 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto" />
          <p className="text-sm">{error}</p>
        </div>
      ) : decisions.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 space-y-3">
          <Database className="h-8 w-8 mx-auto text-slate-600" />
          <p className="text-sm">No engineer decisions recorded yet in SQLite database.</p>
          <p className="text-xs text-slate-600 font-mono">
            Go to "Engineering Deep-Dive" tab to record your first disposition!
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden border border-slate-800 space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
              Recorded Dispositions ({decisions.length} Total)
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">SQLITE DB: astraq.db</span>
          </div>

          <div className="overflow-x-auto">
            <table className="astra-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Component ID</th>
                  <th>Decision</th>
                  <th>Engineer Sign-off</th>
                  <th>Rationale Justification</th>
                  <th>Model / Dataset Version</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map((dec) => (
                  <tr key={dec.id} className="font-mono text-xs hover:bg-slate-800/40">
                    <td className="text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(dec.timestamp).toLocaleString()}
                    </td>
                    <td className="font-bold text-cyan-400">{dec.component_id}</td>
                    <td>
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        dec.decision === 'ACCEPT'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : dec.decision === 'HOLD'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : dec.decision === 'REJECT'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-purple-950 text-purple-400 border border-purple-800'
                      }`}>
                        {dec.decision}
                      </span>
                    </td>
                    <td className="text-slate-300 font-semibold">{dec.engineer}</td>
                    <td className="text-slate-200 font-sans text-xs max-w-xs">{dec.rationale || 'N/A'}</td>
                    <td className="text-slate-500 text-[10px]">
                      {dec.model_version} / {dec.dataset_version}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
