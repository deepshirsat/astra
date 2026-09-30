import { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  AlertCircle, 
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { api } from '../api/client';
import type { ComponentItem } from '../api/client';

interface ComponentMatrixProps {
  onSelectComponent: (componentId: string) => void;
}

export const ComponentMatrix: React.FC<ComponentMatrixProps> = ({ onSelectComponent }) => {
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [lotBaseline, setLotBaseline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<keyof ComponentItem>('robust_z');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchComponents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getComponents();
      setComponents(data.components);
      setLotBaseline(data.lot_baseline);
    } catch (err: any) {
      setError(err.message || 'Failed to load components. Ensure pipeline has been executed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  const handleSort = (field: keyof ComponentItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredComponents = components.filter((comp) => {
    // Filter status
    if (activeFilter === 'INVESTIGATE' && comp.overall_status !== 'INVESTIGATE') return false;
    if (activeFilter === 'SYSTEM_SUSPECT' && comp.overall_status !== 'SYSTEM_SUSPECT') return false;
    if (activeFilter === 'INSUFFICIENT' && comp.overall_status !== 'INSUFFICIENT_EVIDENCE') return false;
    if (activeFilter === 'NORMAL' && comp.overall_status !== 'NORMAL') return false;

    // Search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        comp.component_id.toLowerCase().includes(term) ||
        comp.board_id.toLowerCase().includes(term) ||
        comp.channel_id.toLowerCase().includes(term) ||
        comp.drift_class.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const sortedComponents = [...filteredComponents].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (valA === null) return 1;
    if (valB === null) return -1;
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    return sortOrder === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const counts = {
    ALL: components.length,
    INVESTIGATE: components.filter((c) => c.overall_status === 'INVESTIGATE').length,
    SYSTEM_SUSPECT: components.filter((c) => c.overall_status === 'SYSTEM_SUSPECT').length,
    INSUFFICIENT: components.filter((c) => c.overall_status === 'INSUFFICIENT_EVIDENCE').length,
    NORMAL: components.filter((c) => c.overall_status === 'NORMAL').length,
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Component Screening Matrix</h2>
          <p className="text-xs text-slate-400 mt-1">
            Lot-relative robust statistics & screening classifications for all 100 burn-in components.
          </p>
        </div>

        <button
          onClick={fetchComponents}
          className="btn-astra btn-secondary text-xs px-3 py-2 self-start md:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>REFRESH MATRIX</span>
        </button>
      </div>

      {lotBaseline && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-xs">
          <div className="glass-card p-3 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">LOT MEDIAN</span>
            <span className="text-cyan-400 font-bold text-sm">{lotBaseline.lot_median} Ω</span>
          </div>
          <div className="glass-card p-3 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">LOT MAD</span>
            <span className="text-emerald-400 font-bold text-sm">± {lotBaseline.lot_mad} Ω</span>
          </div>
          <div className="glass-card p-3 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">ROBUST Z BOUNDARY</span>
            <span className="text-amber-400 font-bold text-xs">{lotBaseline.screening_boundary_low} – {lotBaseline.screening_boundary_high} Ω</span>
          </div>
          <div className="glass-card p-3 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">SPEC BOUNDARY</span>
            <span className="text-slate-300 font-bold text-xs">{lotBaseline.spec_low} – {lotBaseline.spec_high} Ω</span>
          </div>
          <div className="glass-card p-3 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">ROBUST STD DEVIATION</span>
            <span className="text-purple-400 font-bold text-sm">{lotBaseline.lot_robust_std} Ω</span>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: 'All Units', count: counts.ALL, color: 'text-slate-300' },
            { id: 'INVESTIGATE', label: 'Investigate', count: counts.INVESTIGATE, color: 'text-rose-400' },
            { id: 'SYSTEM_SUSPECT', label: 'System Suspect', count: counts.SYSTEM_SUSPECT, color: 'text-amber-400' },
            { id: 'INSUFFICIENT', label: 'Insufficient Evidence', count: counts.INSUFFICIENT, color: 'text-purple-400' },
            { id: 'NORMAL', label: 'Normal', count: counts.NORMAL, color: 'text-emerald-400' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all whitespace-nowrap ${
                activeFilter === tab.id
                  ? 'bg-slate-800 border-cyan-500/50 text-white shadow-sm'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              <span className={tab.color}>{tab.label}</span>
              <span className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-mono font-bold">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative min-w-[240px]">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search component, board..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-cyan-400" />
          <p className="text-sm">Loading Component Matrix...</p>
        </div>
      ) : error ? (
        <div className="glass-card p-8 border border-rose-800 bg-rose-950/20 text-rose-300 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        /* Matrix Table */
        <div className="glass-card overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="astra-table">
              <thead>
                <tr>
                  <th className="cursor-pointer" onClick={() => handleSort('component_id')}>
                    <div className="flex items-center gap-1">
                      <span>Component ID</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="cursor-pointer" onClick={() => handleSort('board_id')}>
                    <div className="flex items-center gap-1">
                      <span>Board / Ch</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="cursor-pointer" onClick={() => handleSort('current_value')}>
                    <div className="flex items-center gap-1">
                      <span>Value (Ω)</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="cursor-pointer" onClick={() => handleSort('robust_z')}>
                    <div className="flex items-center gap-1">
                      <span>Robust Z</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="cursor-pointer" onClick={() => handleSort('drift_class')}>
                    <div className="flex items-center gap-1">
                      <span>Drift Class</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="cursor-pointer" onClick={() => handleSort('attribution')}>
                    <div className="flex items-center gap-1">
                      <span>Attribution</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedComponents.map((comp) => {
                  return (
                    <tr key={comp.component_id} className="hover:bg-slate-800/40 font-mono text-xs">
                      <td className="font-bold text-cyan-400">{comp.component_id}</td>
                      <td className="text-slate-300">{comp.board_id} / {comp.channel_id}</td>
                      <td className="text-white font-semibold">{comp.current_value.toFixed(4)}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          Math.abs(comp.robust_z) > 3.5
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : Math.abs(comp.robust_z) > 2.0
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {comp.robust_z > 0 ? `+${comp.robust_z.toFixed(2)}` : comp.robust_z.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className={`text-[11px] ${
                          comp.drift_class === 'STABLE'
                            ? 'text-slate-400'
                            : comp.drift_class === 'ACCELERATING_DRIFT'
                            ? 'text-rose-400 font-bold'
                            : 'text-amber-400 font-bold'
                        }`}>
                          {comp.drift_class}
                        </span>
                      </td>
                      <td>
                        <span className={`text-[11px] ${
                          comp.attribution === 'SYSTEM_CONSISTENT'
                            ? 'text-amber-400 font-bold'
                            : comp.attribution === 'COMPONENT_CONSISTENT'
                            ? 'text-rose-400 font-bold'
                            : comp.attribution === 'INSUFFICIENT_EVIDENCE'
                            ? 'text-purple-400'
                            : 'text-slate-400'
                        }`}>
                          {comp.attribution}
                        </span>
                      </td>
                      <td>
                        {comp.overall_status === 'INVESTIGATE' && (
                          <span className="badge badge-investigate">INVESTIGATE</span>
                        )}
                        {comp.overall_status === 'SYSTEM_SUSPECT' && (
                          <span className="badge badge-system">SYSTEM SUSPECT</span>
                        )}
                        {comp.overall_status === 'INSUFFICIENT_EVIDENCE' && (
                          <span className="badge badge-insufficient font-mono">INSUFFICIENT</span>
                        )}
                        {comp.overall_status === 'NORMAL' && (
                          <span className="badge badge-pass">NORMAL</span>
                        )}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => onSelectComponent(comp.component_id)}
                          className="btn-astra btn-secondary text-[11px] px-2.5 py-1.5 rounded"
                        >
                          <span>Deep-Dive</span>
                          <ChevronRight className="h-3 w-3 text-cyan-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
