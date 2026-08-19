import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OperationsDashboard } from './components/OperationsDashboard';
import { WorksiteDetail } from './components/WorksiteDetail';
import { CreateWorksiteModal } from './components/CreateWorksiteModal';
import { OverviewSection } from './components/OverviewSection';
import { AboutSection } from './components/AboutSection';
import { DEFAULT_WORKSITES } from './data/worksites';
import { analyzeHeatRisk } from './services/api';
import { 
  normalizeOperationalActions, 
  loadStoredActionStates, 
  saveStoredActionStates, 
  getActionSummaryStats 
} from './services/actionStore';
import { Flame } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'worksite' | 'overview' | 'about'
  const [worksites, setWorksites] = useState(() => {
    try {
      const saved = localStorage.getItem('heatpulse_worksites_v1');
      return saved ? JSON.parse(saved) : DEFAULT_WORKSITES;
    } catch {
      return DEFAULT_WORKSITES;
    }
  });

  const [selectedWorksiteId, setSelectedWorksiteId] = useState(DEFAULT_WORKSITES[0].id);
  const [date, setDate] = useState('2025-07-15');
  const [time, setTime] = useState('14:00');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analyzedAt, setAnalyzedAt] = useState(null);

  // Operational action tracking states per worksite
  const [operationalActions, setOperationalActions] = useState([]);
  const [actionSummaries, setActionSummaries] = useState({});

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Active worksite object
  const currentWorksite = worksites.find(w => w.id === selectedWorksiteId) || worksites[0];

  // Save worksites list to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('heatpulse_worksites_v1', JSON.stringify(worksites));
    } catch (e) {
      console.warn('Failed to save worksites list to localStorage', e);
    }
  }, [worksites]);

  // Update action summaries whenever worksites or operational actions change
  useEffect(() => {
    const newSummaries = {};
    worksites.forEach((site) => {
      const rawActions = site.analysisResult?.actions || [];
      const ops = normalizeOperationalActions(rawActions, site.id);
      newSummaries[site.id] = getActionSummaryStats(ops);
    });
    setActionSummaries(newSummaries);
  }, [worksites, operationalActions]);

  // Sync operational actions whenever selected worksite or analysis result updates
  useEffect(() => {
    if (currentWorksite && currentWorksite.analysisResult?.actions) {
      const ops = normalizeOperationalActions(currentWorksite.analysisResult.actions, currentWorksite.id);
      setOperationalActions(ops);
    } else {
      setOperationalActions([]);
    }
  }, [selectedWorksiteId, currentWorksite?.analysisResult]);

  // Trigger analysis call to backend /api/analyze for target worksite
  const handleAnalyze = async () => {
    if (!currentWorksite) return;
    setIsLoading(true);
    setError(null);
    try {
      await analyzeWorksite(currentWorksite.id);
    } catch (err) {
      console.error('HeatPulse Worksite Analysis Error:', err);
      setError(err.message || 'Unable to analyze heat risk for this worksite');
    } finally {
      setIsLoading(false);
    }
  };

  // Shared per-worksite analyze function (used by single-site and batch)
  const analyzeWorksite = async (worksiteId) => {
    const target = worksites.find(w => w.id === worksiteId);
    if (!target) return;

    const timestamp = new Date().toISOString();

    const data = await analyzeHeatRisk(target.polygon, date, time);

    // Store analyzed time string alongside result so cards can show it
    setWorksites((prevWorksites) =>
      prevWorksites.map((w) =>
        w.id === worksiteId
          ? { ...w, analysisResult: data, lastAnalyzedAt: timestamp, lastAnalyzedTime: time }
          : w
      )
    );

    if (worksiteId === currentWorksite?.id) {
      setAnalyzedAt(timestamp);
      const opsActions = normalizeOperationalActions(data.actions, worksiteId);
      setOperationalActions(opsActions);
    }

    return data;
  };

  // Handle Action Status State Mutation (PENDING -> ACKNOWLEDGED -> COMPLETED / EXCEPTION)
  const handleUpdateActionStatus = (actionId, newStatus, extraData = {}) => {
    if (!currentWorksite) return;

    // Load existing stored states from localStorage
    const currentStates = loadStoredActionStates(currentWorksite.id);

    const timestamp = new Date().toISOString();
    const existing = currentStates[actionId] || {};

    const updatedActionState = {
      ...existing,
      status: newStatus,
      acknowledgedAt: newStatus === 'ACKNOWLEDGED' ? timestamp : existing.acknowledgedAt,
      completedAt: newStatus === 'COMPLETED' ? timestamp : existing.completedAt,
      exceptionReason: newStatus === 'EXCEPTION' ? (extraData.reason || 'Operational Exception Reported') : existing.exceptionReason,
    };

    const newStatesMap = {
      ...currentStates,
      [actionId]: updatedActionState,
    };

    // Save updated states map to localStorage
    saveStoredActionStates(currentWorksite.id, newStatesMap);

    // Re-normalize operational actions list to trigger React re-render
    if (currentWorksite.analysisResult?.actions) {
      const updatedOps = normalizeOperationalActions(currentWorksite.analysisResult.actions, currentWorksite.id);
      setOperationalActions(updatedOps);
    }
  };

  // Select a worksite and open its detail view
  const handleSelectWorksite = (worksiteId) => {
    setSelectedWorksiteId(worksiteId);
    setActiveTab('worksite');
  };

  // Handle dynamic creation of new worksite
  const handleCreateWorksite = (newWorksiteObj) => {
    setWorksites((prev) => [newWorksiteObj, ...prev]);
    setSelectedWorksiteId(newWorksiteObj.id);
    setActiveTab('worksite');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Operations Navigation Header */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        selectedWorksiteName={currentWorksite?.name}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* TAB 1: OPERATIONS DASHBOARD */}
        {activeTab === 'dashboard' && (
          <OperationsDashboard
            worksites={worksites}
            actionSummaries={actionSummaries}
            onSelectWorksite={handleSelectWorksite}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onAnalyzeWorksite={analyzeWorksite}
          />
        )}

        {/* TAB 2: WORKSITE OPERATIONAL DETAIL VIEW */}
        {activeTab === 'worksite' && (
          <WorksiteDetail
            worksite={currentWorksite}
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            error={error}
            analysisResult={currentWorksite?.analysisResult}
            analyzedAt={analyzedAt || currentWorksite?.lastAnalyzedAt}
            operationalActions={operationalActions}
            onUpdateActionStatus={handleUpdateActionStatus}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {/* TAB 3: OVERVIEW */}
        {activeTab === 'overview' && (
          <OverviewSection onStartAnalysis={() => setActiveTab('dashboard')} />
        )}

        {/* TAB 4: ABOUT ENGINE */}
        {activeTab === 'about' && (
          <AboutSection />
        )}

      </main>

      {/* Create Worksite Modal */}
      <CreateWorksiteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateWorksite={handleCreateWorksite}
      />

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800/80 py-6 px-4 text-center text-xs text-gray-500 font-mono space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-gray-300 font-bold">HeatPulse</span> — Worksite Heat Safety Operations Platform
        </div>
        <p>Powered by FortyGuard AI Data Engine & Gemini Agentic Planner • React + Vite</p>
      </footer>
    </div>
  );
}
