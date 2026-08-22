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
import {
  appendAuditEvent,
  loadAuditLog,
  AUDIT_EVENT_TYPES,
  AUDIT_SOURCES,
} from './services/auditStore';
import { Flame } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'worksite' | 'overview' | 'about'
  const [worksites, setWorksites] = useState(() => {
    try {
      const saved = localStorage.getItem('heatpulse_worksites_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((savedSite) => {
            const defaultMatch = DEFAULT_WORKSITES.find(d => d.id === savedSite.id);
            return defaultMatch ? { ...defaultMatch, ...savedSite } : savedSite;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load worksites from localStorage:', e);
    }
    return DEFAULT_WORKSITES;
  });

  const [selectedWorksiteId, setSelectedWorksiteId] = useState(() => {
    try {
      const saved = localStorage.getItem('heatpulse_selected_worksite_id');
      return saved || DEFAULT_WORKSITES[0].id;
    } catch {
      return DEFAULT_WORKSITES[0].id;
    }
  });
  const [date, setDate] = useState('2025-07-15');
  const [time, setTime] = useState('14:00');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analyzedAt, setAnalyzedAt] = useState(null);

  // Operational action tracking states per worksite
  const [operationalActions, setOperationalActions] = useState([]);
  const [actionSummaries, setActionSummaries] = useState({});

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Audit log for the currently selected worksite (reactive — updated after each write)
  const [auditLog, setAuditLog] = useState(() => loadAuditLog(selectedWorksiteId));

  // Active worksite object
  const currentWorksite = worksites.find(w => w.id === selectedWorksiteId) || worksites[0];

  // Sync selectedWorksiteId in localStorage and hydrate auditLog state on mount or change
  useEffect(() => {
    if (selectedWorksiteId) {
      try {
        localStorage.setItem('heatpulse_selected_worksite_id', selectedWorksiteId);
      } catch (e) {
        console.warn('Failed to save selectedWorksiteId to localStorage', e);
      }
      setAuditLog(loadAuditLog(selectedWorksiteId));
    }
  }, [selectedWorksiteId]);

  const isInitialMount = React.useRef(true);

  // Save worksites list to localStorage on change (skips redundant write on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
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

    // --- Audit Trail: record ANALYSIS event ---
    const riskScore = data.risk?.score ?? null;
    const riskLevel = data.risk?.level ?? null;
    const auditSource = data.agent_metadata?.agent_executed
      ? AUDIT_SOURCES.GEMINI
      : AUDIT_SOURCES.DETERMINISTIC_FALLBACK;

    appendAuditEvent(worksiteId, {
      worksiteName:    target.name,
      riskScore,
      riskLevel,
      eventType:       AUDIT_EVENT_TYPES.ANALYSIS,
      source:          AUDIT_SOURCES.SYSTEM,
      directive:       null,
      actionId:        null,
      status:          null,
      exceptionReason: null,
    });

    // --- Audit Trail: record one RECOMMENDATION event per dispatched directive ---
    if (Array.isArray(data.actions)) {
      data.actions.forEach((groupItem, gIdx) => {
        const groupName = groupItem.group || 'General Workforce';
        const directiveList = groupItem.actions || [];
        directiveList.forEach((directiveText, dIdx) => {
          const actionId = `act_${groupName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${dIdx}`;
          appendAuditEvent(worksiteId, {
            worksiteName:    target.name,
            riskScore,
            riskLevel,
            eventType:       AUDIT_EVENT_TYPES.RECOMMENDATION,
            source:          auditSource,
            actionId,
            directive:       directiveText,
            status:          'PENDING',
            exceptionReason: null,
          });
        });
      });
    }

    if (worksiteId === currentWorksite?.id) {
      setAnalyzedAt(timestamp);
      const opsActions = normalizeOperationalActions(data.actions, worksiteId);
      setOperationalActions(opsActions);
      // Refresh audit log for current worksite so UI re-renders
      setAuditLog(loadAuditLog(worksiteId));
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

    // --- Audit Trail: record supervisor lifecycle event ---
    const auditEventType =
      newStatus === 'ACKNOWLEDGED' ? AUDIT_EVENT_TYPES.ACKNOWLEDGED :
      newStatus === 'COMPLETED'    ? AUDIT_EVENT_TYPES.COMPLETED    :
      newStatus === 'EXCEPTION'    ? AUDIT_EVENT_TYPES.EXCEPTION    :
      null;

    if (auditEventType) {
      // Find the directive text for this action
      const matchingAction = operationalActions.find(a => a.id === actionId);
      const risk = currentWorksite.analysisResult?.risk;
      appendAuditEvent(currentWorksite.id, {
        worksiteName:    currentWorksite.name,
        riskScore:       risk?.score ?? null,
        riskLevel:       risk?.level ?? null,
        eventType:       auditEventType,
        source:          AUDIT_SOURCES.SUPERVISOR,
        actionId,
        directive:       matchingAction?.directive || null,
        status:          newStatus,
        exceptionReason: newStatus === 'EXCEPTION'
          ? (extraData.reason || 'Operational Exception Reported')
          : null,
      });
    }

    // Re-normalize operational actions list to trigger React re-render
    if (currentWorksite.analysisResult?.actions) {
      const updatedOps = normalizeOperationalActions(currentWorksite.analysisResult.actions, currentWorksite.id);
      setOperationalActions(updatedOps);
    }

    // Refresh audit log state so the Audit Trail tab re-renders immediately
    setAuditLog(loadAuditLog(currentWorksite.id));
  };

  // Select a worksite and open its detail view
  const handleSelectWorksite = (worksiteId) => {
    setSelectedWorksiteId(worksiteId);
    setActiveTab('worksite');
    // Load audit log for the newly selected worksite
    setAuditLog(loadAuditLog(worksiteId));
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
            auditLog={auditLog}
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
