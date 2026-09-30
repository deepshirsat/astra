import React from 'react';
import { 
  Rocket, 
  Grid, 
  Search, 
  Layers, 
  BarChart3, 
  ShieldAlert, 
  FileText, 
  Activity,
  Cpu
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBackendConnected: boolean;
  hasRunAnalysis: boolean;
  summary?: any;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isBackendConnected,
  hasRunAnalysis,
  summary,
}) => {
  const tabs = [
    { id: 'pipeline', label: 'Pipeline Execution', icon: Rocket },
    { id: 'matrix', label: 'Component Matrix', icon: Grid, badge: summary ? summary.total_components : undefined },
    { id: 'deepdive', label: 'Engineering Deep-Dive', icon: Search },
    { id: 'attribution', label: 'Attribution Engine', icon: Layers, badge: summary?.common_mode_patterns ? `${summary.common_mode_patterns} Patterns` : undefined },
    { id: 'historical', label: 'Population Shift', icon: BarChart3, alert: summary?.population_shift },
    { id: 'validation', label: 'Validation Lab', icon: ShieldAlert },
    { id: 'decisions', label: 'Decision Audit Log', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800 px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Cpu className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wider text-white font-mono">ASTRA-Q</h1>
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                SIH 26170
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              AI-Driven Reliability Screening & Investigation Workstation
            </p>
          </div>
        </div>

        {/* Live Backend Connection Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <div className={`h-2.5 w-2.5 rounded-full ${isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-slate-300 font-mono">
              {isBackendConnected ? 'API ONLINE (127.0.0.1:8000)' : 'API DISCONNECTED'}
            </span>
          </div>

          {hasRunAnalysis && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800 text-xs text-cyan-300">
              <Activity className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
              <span className="font-mono">ANALYSIS ACTIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto mt-4 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              )}
              {tab.alert && (
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" title="Population Shift Detected" />
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
