import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PipelineRunner } from './components/PipelineRunner';
import { ComponentMatrix } from './components/ComponentMatrix';
import { ComponentDeepDive } from './components/ComponentDeepDive';
import { AttributionView } from './components/AttributionView';
import { HistoricalView } from './components/HistoricalView';
import { ValidationLab } from './components/ValidationLab';
import { DecisionLog } from './components/DecisionLog';
import type { RunAnalysisResponse } from './api/client';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('pipeline');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [analysisData, setAnalysisData] = useState<RunAnalysisResponse | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string>('C-005');

  useEffect(() => {
    // Check backend connection
    const checkBackend = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/docs');
        setIsBackendConnected(res.ok);
      } catch {
        setIsBackendConnected(false);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectComponent = (compId: string) => {
    setSelectedComponentId(compId);
    setActiveTab('deepdive');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBackendConnected={isBackendConnected}
        hasRunAnalysis={!!analysisData}
        summary={analysisData?.summary}
      />

      <main className="flex-1">
        {activeTab === 'pipeline' && (
          <PipelineRunner
            onPipelineComplete={(data) => setAnalysisData(data)}
            onNavigateToMatrix={() => setActiveTab('matrix')}
            analysisData={analysisData}
          />
        )}

        {activeTab === 'matrix' && (
          <ComponentMatrix onSelectComponent={handleSelectComponent} />
        )}

        {activeTab === 'deepdive' && (
          <ComponentDeepDive
            selectedComponentId={selectedComponentId}
            onSelectComponent={(id) => setSelectedComponentId(id)}
          />
        )}

        {activeTab === 'attribution' && <AttributionView />}

        {activeTab === 'historical' && <HistoricalView />}

        {activeTab === 'validation' && <ValidationLab />}

        {activeTab === 'decisions' && <DecisionLog />}
      </main>

      <footer className="border-t border-slate-800 bg-[#090d16] py-4 px-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ASTRA-Q — SIH 2026 Problem Statement 26170</span>
          <span>AI-Assisted Space Grade Component Burn-In & Screening Workstation</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
