import React from 'react';
import { 
  Building2, MapPin, Clock, Users, ShieldAlert, RefreshCw, 
  Sparkles, CheckCircle2, ChevronRight, Activity, Calendar
} from 'lucide-react';
import { HeatRiskCard } from './HeatRiskCard';
import { EnvironmentalParams } from './EnvironmentalParams';
import { PriorityGroups } from './PriorityGroups';
import { ActionDispatchCenter } from './ActionDispatchCenter';
import { MapPanel } from './MapPanel';
import { DateTimeSelector } from './DateTimeSelector';
import { LoadingIndicator } from './LoadingIndicator';
import { ErrorState } from './ErrorState';

export function WorksiteDetail({
  worksite,
  date,
  setDate,
  time,
  setTime,
  onAnalyze,
  isLoading,
  error,
  analysisResult,
  analyzedAt,
  operationalActions,
  onUpdateActionStatus,
  onBackToDashboard
}) {
  if (!worksite) return null;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Worksite Banner & Controls */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Worksite Identity */}
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 mt-0.5">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={onBackToDashboard}
                  className="text-xs text-orange-400 hover:text-orange-300 font-mono flex items-center gap-1 font-semibold"
                >
                  ← Back to Ops Dashboard
                </button>
                <span className="text-gray-600">•</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                  {worksite.monitoring_status || 'MONITORED'}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white tracking-wide mt-1">
                {worksite.name}
              </h2>

              <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                {worksite.location}
              </p>
            </div>
          </div>

          {/* Right: Quick Operational Indicators */}
          <div className="flex flex-wrap items-center gap-3 bg-gray-950 p-3 rounded-xl border border-gray-800 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 border-r border-gray-800">
              <Users className="w-4 h-4 text-orange-400" />
              <div>
                <div className="text-[10px] text-gray-400 font-mono">Exposed Workforce</div>
                <div className="font-bold text-white">{worksite.workforce_count} Workers</div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 border-r border-gray-800">
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-gray-400 font-mono">Shift Window</div>
                <div className="font-bold text-white">{worksite.operating_hours}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onAnalyze}
              disabled={isLoading}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-xs transition shadow-md shadow-orange-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Running Analysis...' : 'Run Live Analysis'}</span>
            </button>
          </div>

        </div>

        {/* Extensible Workforce Groups Pills */}
        {worksite.workforce_groups && worksite.workforce_groups.length > 0 && (
          <div className="pt-3 border-t border-gray-800/80 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-400 font-mono text-[11px] font-semibold">Active Roles Present:</span>
            {worksite.workforce_groups.map((groupItem, gIdx) => (
              <span 
                key={gIdx} 
                className="bg-gray-950 text-gray-200 px-3 py-1 rounded-lg border border-gray-800 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                <span className="font-semibold">{groupItem.name}</span>
                {groupItem.headcount && (
                  <span className="text-gray-400 text-[11px] font-mono">({groupItem.headcount})</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Grid Controls: Date/Time Selector + Interactive AOI Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Date & Time Picker Controls */}
        <div className="lg:col-span-5 space-y-6">
          <DateTimeSelector
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            onAnalyze={onAnalyze}
            isLoading={isLoading}
          />

          {/* Analysis Timestamp Freshness Indicator */}
          {analyzedAt && (
            <div className="bg-gray-950/80 p-3 rounded-xl border border-gray-800 text-xs font-mono text-gray-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Analysis Freshness:
              </span>
              <span className="text-gray-200 font-semibold">
                {new Date(analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Worksite GeoJSON Map */}
        <div className="lg:col-span-7 h-full">
          <MapPanel
            selectedAOI={worksite}
            analysisResult={analysisResult}
          />
        </div>
      </div>

      {/* Analysis Results Experience */}
      <div className="pt-2 space-y-8">
        
        {/* State 1: Loading */}
        {isLoading && <LoadingIndicator />}

        {/* State 2: Error */}
        {!isLoading && error && (
          <ErrorState errorMessage={error} onRetry={onAnalyze} />
        )}

        {/* State 3: Successful Operational View */}
        {!isLoading && !error && analysisResult && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* 1. HOW SERIOUS IS IT? -> Heat Risk Metric Card */}
            <HeatRiskCard
              risk={analysisResult.risk}
              temperatureStats={analysisResult.temperature_stats}
            />

            {/* 2. WHY IS IT HIGH? -> FortyGuard Environmental Conditions */}
            <EnvironmentalParams
              envParams={analysisResult.env_params}
            />

            {/* 3. WHO IS AFFECTED? -> Priority Vulnerability Hierarchy */}
            <PriorityGroups
              groups={analysisResult.priority_groups}
            />

            {/* 4. WHAT SHOULD WE DO & HAS IT BEEN COMPLETED? -> Action Dispatch Center */}
            <ActionDispatchCenter
              operationalActions={operationalActions}
              agentMetadata={analysisResult.agent_metadata}
              guidelines={analysisResult.guidelines}
              onUpdateActionStatus={onUpdateActionStatus}
            />

          </div>
        )}

        {/* State 4: Initial Trigger Button if no analysis yet */}
        {!isLoading && !error && !analysisResult && (
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8 text-center space-y-4">
            <ShieldAlert className="w-12 h-12 text-orange-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-white">No Active Heat Risk Analysis Loaded</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Run a live analysis for this worksite to retrieve FortyGuard microclimate thermal data, environmental parameters, and Gemini action directives.
            </p>
            <button
              type="button"
              onClick={onAnalyze}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-lg shadow-orange-500/20"
            >
              Analyze Worksite Heat Risk
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
