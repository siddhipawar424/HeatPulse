import React from 'react';
import { 
  Building2, MapPin, Users, Clock, Flame, ShieldCheck, 
  ChevronRight, AlertTriangle, CheckCircle2, UserCheck, AlertCircle
} from 'lucide-react';

export function WorksiteCard({ worksite, actionSummary, onSelectWorksite }) {
  const analysis = worksite.analysisResult;
  const risk = analysis?.risk;
  const riskLevel = (risk?.level || 'MODERATE').toUpperCase();
  const riskScore = risk?.score ?? '—';
  // Show the hour that was actually analyzed, or a dash if no analysis has run yet
  const analysisHour = worksite.lastAnalyzedTime || (analysis ? '—' : null);
  const topPriorityGroup = analysis?.priority_groups?.[0]?.group || worksite.workforce_groups?.[0]?.name || 'Outdoor Workers';

  // Severity styling
  const getSeverityStyle = (lvl) => {
    switch (lvl) {
      case 'CRITICAL':
      case 'EXTREME':
        return {
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          textColor: 'text-purple-400',
          border: 'border-purple-500/30'
        };
      case 'HIGH':
      case 'VERY_HIGH':
        return {
          badgeBg: 'bg-red-500/20 text-red-400 border-red-500/40',
          textColor: 'text-red-400',
          border: 'border-red-500/30'
        };
      case 'MODERATE':
        return {
          badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          textColor: 'text-amber-400',
          border: 'border-amber-500/30'
        };
      case 'LOW':
      default:
        return {
          badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          textColor: 'text-emerald-400',
          border: 'border-emerald-500/30'
        };
    }
  };

  const style = getSeverityStyle(riskLevel);

  return (
    <div 
      id={`worksite-card-${worksite.id}`}
      className={`bg-gray-900/90 border ${style.border} rounded-2xl p-5 shadow-xl hover:shadow-2xl transition duration-300 flex flex-col justify-between space-y-4`}
    >
      {/* Header: Worksite Name & Risk Badge */}
      <div className="space-y-2 border-b border-gray-800/80 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                {worksite.name}
              </h3>
              <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-400" />
                {worksite.location}
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold border ${style.badgeBg}`}>
            {riskLevel}
          </span>
        </div>
      </div>

      {/* Grid Metrics: Risk Score, Analysis Hour, Workforce Exposed */}
      <div className="grid grid-cols-3 gap-2 bg-gray-950 p-3 rounded-xl border border-gray-800 text-xs">
        {/* Score */}
        <div className="flex flex-col items-center justify-center border-r border-gray-800">
          <span className="text-[10px] text-gray-400 font-mono">Risk Score</span>
          <div className="flex items-baseline gap-0.5">
            <span className={`text-xl font-black font-mono ${style.textColor}`}>
              {riskScore}
            </span>
            <span className="text-[10px] text-gray-500 font-semibold">/100</span>
          </div>
        </div>

        {/* Analysis Hour — the hour actually analyzed, NOT a predicted peak */}
        <div className="flex flex-col items-center justify-center border-r border-gray-800">
          <span className="text-[10px] text-gray-400 font-mono">Analysis Hour</span>
          <span className="font-bold text-gray-200 text-[11px] flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            {analysisHour ?? <span className="text-gray-500">—</span>}
          </span>
        </div>

        {/* Exposed Workers */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-[10px] text-gray-400 font-mono">Workforce</span>
          <span className="font-bold text-white text-[11px] flex items-center gap-1">
            <Users className="w-3 h-3 text-orange-400" /> {worksite.workforce_count}
          </span>
        </div>
      </div>

      {/* Priority & Action Status Summary */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-gray-400">
          <span className="font-mono text-[11px]">Priority Group:</span>
          <span className="text-gray-200 font-semibold">{topPriorityGroup}</span>
        </div>

        {/* Action Status Summary Pill */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-800/60">
          <span className="font-mono text-[11px] text-gray-400">Action Status:</span>
          {actionSummary?.pending > 0 ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              <AlertCircle className="w-3 h-3" /> {actionSummary.pending} Action(s) Pending
            </span>
          ) : actionSummary?.total > 0 ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" /> All {actionSummary.total} Resolved
            </span>
          ) : (
            <span className="text-[11px] text-gray-400 font-mono">Pending Analysis</span>
          )}
        </div>
      </div>

      {/* Manage Worksite Action Button */}
      <button
        type="button"
        onClick={() => onSelectWorksite(worksite.id)}
        className="w-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 font-semibold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
      >
        <span>View & Manage Worksite</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
