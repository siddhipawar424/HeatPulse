import React from 'react';
import { ShieldCheck, CheckCircle2, ChevronRight, HardHat, HeartPulse, Baby, Activity, Users, Sparkles, BookOpen, Clock, FileText } from 'lucide-react';

export function RecommendedActions({ actions, agentMetadata, guidelines }) {
  if (!actions || actions.length === 0) return null;

  const isAgentExecuted = agentMetadata?.agent_executed === true;

  // Icon helper
  const getGroupIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('worker') || lower.includes('outdoor worker')) return HardHat;
    if (lower.includes('elderly') || lower.includes('senior')) return HeartPulse;
    if (lower.includes('child') || lower.includes('children')) return Baby;
    if (lower.includes('exerciser') || lower.includes('athlete')) return Activity;
    return Users;
  };

  const getPriorityStyle = (priority) => {
    const p = (priority || '').toUpperCase();
    switch (p) {
      case 'CRITICAL':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'VERY_HIGH':
      case 'VERY HIGH':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      default:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    }
  };

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-gray-400 font-semibold">
              Targeted Heat Interventions
            </h2>
            <h3 className="text-lg font-bold text-white tracking-wide">Recommended Action Plan</h3>
          </div>
        </div>

        {/* Execution Mode Badge */}
        {isAgentExecuted ? (
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/40 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-yellow-300" />
            Agentic AI Planner (OSHA/WHO Synthesized)
          </span>
        ) : (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
            Deterministic Safety Engine (Fallback Active)
          </span>
        )}
      </div>

      {/* AI Agent Reasoning & Citation Panel */}
      {isAgentExecuted && (
        <div className="bg-gradient-to-r from-orange-950/40 via-gray-950 to-amber-950/30 border border-orange-500/30 rounded-xl p-5 space-y-4 shadow-inner">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            Agentic Climate Risk Reasoning & Guideline Synthesis
          </div>

          {/* Reasoning Summary */}
          {agentMetadata.reasoning_summary && (
            <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-medium">
              {agentMetadata.reasoning_summary}
            </p>
          )}

          {/* Time Window Guidance */}
          {agentMetadata.time_window_guidance && (
            <div className="flex items-start gap-2.5 bg-gray-900/90 p-3 rounded-lg border border-gray-800 text-xs text-amber-300">
              <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <strong className="text-white">Target Time Window Advisory: </strong>
                {agentMetadata.time_window_guidance}
              </div>
            </div>
          )}

          {/* Official Citations */}
          {agentMetadata.guideline_citations && agentMetadata.guideline_citations.length > 0 && (
            <div className="pt-2 border-t border-gray-800/80 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-gray-400 font-mono flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-orange-400" /> Standard Citations:
              </span>
              {agentMetadata.guideline_citations.map((cite, cIdx) => (
                <span key={cIdx} className="bg-orange-500/10 text-orange-300 px-2.5 py-0.5 rounded border border-orange-500/20 font-mono">
                  {cite}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Cards per Group */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {actions.map((item, index) => {
          const Icon = getGroupIcon(item.group);
          const priorityBadgeStyle = getPriorityStyle(item.priority);
          const groupActionList = item.actions || [];

          return (
            <div
              key={index}
              className="bg-gray-950/80 border border-gray-800 rounded-xl p-5 space-y-4 hover:border-orange-500/30 transition shadow-md flex flex-col justify-between"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-orange-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white tracking-wide">
                      {item.group}
                    </h4>
                    <p className="text-[11px] text-gray-400 font-mono">
                      {groupActionList.length} Directives
                    </p>
                  </div>
                </div>

                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border font-mono ${priorityBadgeStyle}`}>
                  {item.priority?.replace('_', ' ')}
                </span>
              </div>

              {/* List of Recommended Actions */}
              <ul className="space-y-2.5 flex-1">
                {groupActionList.map((actionText, actionIdx) => (
                  <li key={actionIdx} className="flex items-start gap-2.5 text-xs text-gray-200 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{actionText}</span>
                  </li>
                ))}
              </ul>

              {/* Action Protocol Footer */}
              <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                <span>Intervention Priority: {item.priority}</span>
                <span className="text-orange-400 flex items-center gap-0.5">
                  Protocol Verified <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Retrieved Guidelines Reference Panel */}
      {guidelines && guidelines.length > 0 && (
        <div className="pt-4 border-t border-gray-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
            <FileText className="w-4 h-4 text-orange-400" />
            <span>Retrieved Official Regulatory Standards ({guidelines.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {guidelines.map((g, gIdx) => (
              <div key={gIdx} className="bg-gray-950/60 p-3 rounded-lg border border-gray-800/60 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-orange-400 font-bold">[{g.organization}] {g.title}</span>
                  <a href={g.source_url} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-gray-300 underline text-[10px]">
                    Source Link
                  </a>
                </div>
                <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                  {g.guideline_text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
