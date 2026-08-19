import React, { useState, useCallback } from 'react';
import { 
  Building2, ShieldAlert, Users, Clock, AlertCircle, Plus, 
  Search, Filter, CheckCircle2, Flame, Sparkles, Activity,
  RefreshCw, Loader2, CheckCheck, XCircle
} from 'lucide-react';
import { WorksiteCard } from './WorksiteCard';

export function OperationsDashboard({
  worksites,
  actionSummaries,
  onSelectWorksite,
  onOpenCreateModal,
  onAnalyzeWorksite,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Per-worksite loading / error states for batch analyze
  const [batchRunning, setBatchRunning] = useState(false);
  const [siteLoadingStates, setSiteLoadingStates] = useState({}); // { [id]: 'loading' | 'done' | 'error' }
  const [siteErrors, setSiteErrors] = useState({});             // { [id]: string }

  // Compute organization-level stats
  const totalSites = worksites.length;
  let highRiskCount = 0;
  let totalExposedWorkers = 0;
  let totalPendingActions = 0;

  worksites.forEach((site) => {
    totalExposedWorkers += site.workforce_count || 0;
    const level = (site.analysisResult?.risk?.level || '').toUpperCase();
    if (level === 'HIGH' || level === 'CRITICAL' || level === 'VERY_HIGH') {
      highRiskCount++;
    }
    const summary = actionSummaries[site.id];
    if (summary) {
      totalPendingActions += summary.pending || 0;
    }
  });

  // Filter worksites
  const filteredWorksites = worksites.filter((site) => {
    const matchesSearch = 
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.location.toLowerCase().includes(searchQuery.toLowerCase());

    const level = (site.analysisResult?.risk?.level || 'MODERATE').toUpperCase();
    const matchesRisk = 
      riskFilter === 'ALL' || 
      (riskFilter === 'HIGH' && (level === 'HIGH' || level === 'CRITICAL' || level === 'VERY_HIGH')) ||
      (riskFilter === 'MODERATE' && level === 'MODERATE') ||
      (riskFilter === 'LOW' && level === 'LOW');

    return matchesSearch && matchesRisk;
  });

  // ------------------------------------------------------------------
  // Analyze All Worksites — sequential execution with per-site state
  // ------------------------------------------------------------------
  const handleAnalyzeAll = useCallback(async () => {
    if (batchRunning || !onAnalyzeWorksite) return;

    setBatchRunning(true);
    // Clear previous states
    const initStates = {};
    worksites.forEach((s) => { initStates[s.id] = 'pending'; });
    setSiteLoadingStates(initStates);
    setSiteErrors({});

    for (const site of worksites) {
      // Mark this site as loading
      setSiteLoadingStates((prev) => ({ ...prev, [site.id]: 'loading' }));

      try {
        await onAnalyzeWorksite(site.id);
        setSiteLoadingStates((prev) => ({ ...prev, [site.id]: 'done' }));
      } catch (err) {
        const msg = err?.message || 'Analysis failed';
        setSiteLoadingStates((prev) => ({ ...prev, [site.id]: 'error' }));
        setSiteErrors((prev) => ({ ...prev, [site.id]: msg }));
      }
    }

    setBatchRunning(false);
  }, [batchRunning, worksites, onAnalyzeWorksite]);

  const batchDone = Object.values(siteLoadingStates).filter(s => s === 'done').length;
  const batchErrors = Object.values(siteLoadingStates).filter(s => s === 'error').length;
  const batchTotal = worksites.length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Organization Header Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900/95 to-orange-950/20 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-mono font-bold">
                OPERATIONS DASHBOARD
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-xs text-gray-400 font-mono">Organization Worksite Monitor</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Heat Safety Operations Center
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
              Real-time thermal risk monitoring, worker exposure metrics, and supervisor action dispatch.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            {/* Analyze All Worksites */}
            <button
              type="button"
              id="btn-analyze-all-worksites"
              onClick={handleAnalyzeAll}
              disabled={batchRunning}
              className={`flex items-center justify-center gap-2 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-md border shrink-0 ${
                batchRunning
                  ? 'bg-gray-800 text-gray-400 border-gray-700 cursor-not-allowed'
                  : 'bg-gray-900 hover:bg-orange-500/10 text-orange-300 border-orange-500/30 hover:border-orange-500/60'
              }`}
            >
              {batchRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                  <span>Analyzing… {batchDone}/{batchTotal}</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Analyze All Worksites</span>
                </>
              )}
            </button>

            {/* Add Worksite Button */}
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-lg shadow-orange-500/20 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Monitored Worksite</span>
            </button>
          </div>
        </div>

        {/* Batch Progress Banner — only visible after a batch run */}
        {!batchRunning && batchTotal > 0 && Object.keys(siteLoadingStates).length > 0 && (
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs font-mono font-semibold ${
            batchErrors > 0
              ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
              : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
          }`}>
            {batchErrors > 0 ? (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>
              Batch complete — {batchDone} succeeded
              {batchErrors > 0 && `, ${batchErrors} failed`}
            </span>
          </div>
        )}

        {/* Organization-level Metrics Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          
          {/* Card 1: Total Worksites */}
          <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-4 flex items-center gap-3.5">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">Monitored Worksites</div>
              <div className="text-2xl font-black text-white font-mono">{totalSites}</div>
            </div>
          </div>

          {/* Card 2: High Risk Alert Sites */}
          <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-4 flex items-center gap-3.5">
            <div className="p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">High Thermal Risk</div>
              <div className="text-2xl font-black text-red-400 font-mono">{highRiskCount}</div>
            </div>
          </div>

          {/* Card 3: Exposed Workers */}
          <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-4 flex items-center gap-3.5">
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">Exposed Workforce</div>
              <div className="text-2xl font-black text-white font-mono">{totalExposedWorkers}</div>
            </div>
          </div>

          {/* Card 4: Pending Action Directives */}
          <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-4 flex items-center gap-3.5">
            <div className="p-3 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">Pending Directives</div>
              <div className="text-2xl font-black text-orange-400 font-mono">{totalPendingActions}</div>
            </div>
          </div>

        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-900/90 border border-gray-800 rounded-xl p-4 shadow-md">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search worksite name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        {/* Risk Level Filter Buttons */}
        <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-end overflow-x-auto">
          <span className="text-gray-400 font-mono text-[11px] flex items-center gap-1">
            <Filter className="w-3 h-3 text-orange-400" /> Filter:
          </span>

          {['ALL', 'HIGH', 'MODERATE', 'LOW'].map((filterOpt) => (
            <button
              key={filterOpt}
              type="button"
              onClick={() => setRiskFilter(filterOpt)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                riskFilter === filterOpt
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {filterOpt === 'HIGH' ? 'HIGH / CRITICAL' : filterOpt}
            </button>
          ))}
        </div>
      </div>

      {/* Worksite Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-gray-400 uppercase tracking-wider font-semibold">
          <span>Active Monitored Worksites ({filteredWorksites.length})</span>
          <span>Click any worksite to open operational controls</span>
        </div>

        {filteredWorksites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorksites.map((worksite) => {
              const siteState = siteLoadingStates[worksite.id];
              const siteErr = siteErrors[worksite.id];

              return (
                <div key={worksite.id} className="relative">
                  {/* Batch status overlay indicator */}
                  {siteState === 'loading' && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-orange-950/80 border border-orange-500/40 px-2 py-0.5 rounded-full text-[10px] font-mono text-orange-300 shadow-lg backdrop-blur-sm">
                      <Loader2 className="w-3 h-3 animate-spin" /> Analyzing…
                    </div>
                  )}
                  {siteState === 'done' && !batchRunning && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-300 shadow-lg backdrop-blur-sm">
                      <CheckCircle2 className="w-3 h-3" /> Updated
                    </div>
                  )}
                  {siteState === 'error' && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-full text-[10px] font-mono text-rose-300 shadow-lg backdrop-blur-sm" title={siteErr}>
                      <XCircle className="w-3 h-3" /> Failed
                    </div>
                  )}

                  <WorksiteCard
                    worksite={worksite}
                    actionSummary={actionSummaries[worksite.id]}
                    onSelectWorksite={onSelectWorksite}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-8 text-center space-y-3">
            <Building2 className="w-10 h-10 text-gray-600 mx-auto" />
            <h4 className="text-base font-bold text-white">No Worksites Match Filter</h4>
            <p className="text-xs text-gray-400">
              Try adjusting your search query or risk filter to view monitored worksites.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
