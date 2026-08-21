import React, { useState, useEffect } from 'react';
import {
  Bot, Sparkles, Send, ShieldAlert, AlertTriangle, CheckCircle2,
  Clock, Activity, ChevronDown, ChevronUp, Terminal, HelpCircle, RefreshCw
} from 'lucide-react';
import { querySafetyCopilot } from '../services/api';

export function CopilotPanel({ worksites, onSelectWorksite }) {
  const [queryInput, setQueryInput] = useState('');
  const [activeQuery, setActiveQuery] = useState(null);
  const [copilotData, setCopilotData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTraceExpanded, setIsTraceExpanded] = useState(false);

  const presetQueries = [
    { id: 'q1', label: 'Which sites need immediate attention today?', text: 'Which worksites currently need immediate supervisor attention today?' },
    { id: 'q2', label: 'Why are specific sites high risk?', text: 'Explain why high-risk sites are at elevated thermal severity and what environmental factors contribute.' },
    { id: 'q3', label: 'Which risks are unresolved?', text: 'Which operational safety directives are currently pending or recorded as exceptions?' },
    { id: 'q4', label: 'Supervisor escalation guidance', text: 'What supervisor escalation protocols and immediate interventions are recommended for the active shift?' },
  ];

  // Helper to package fleet state for the backend API
  const buildFleetStateContext = () => {
    return worksites.map((site) => {
      let storedActionStates = {};
      try {
        const raw = localStorage.getItem(`heatpulse_actions_v1_${site.id}`);
        if (raw) storedActionStates = JSON.parse(raw);
      } catch (err) {
        console.warn('Failed to read action states for copilot context', err);
      }

      return {
        id: site.id,
        name: site.name,
        location: site.location,
        operating_hours: site.operating_hours,
        workforce_count: site.workforce_count,
        workforce_groups: site.workforce_groups,
        lastAnalyzedTime: site.lastAnalyzedTime || '14:00',
        analysisResult: site.analysisResult || null,
        storedActionStates: storedActionStates,
      };
    });
  };

  const handleRunCopilot = async (customQueryText = null) => {
    const qText = customQueryText !== null ? customQueryText : queryInput;
    setIsLoading(true);
    setError(null);
    setActiveQuery(qText || 'General Fleet Safety Assessment');

    try {
      const fleetState = buildFleetStateContext();
      const res = await querySafetyCopilot(fleetState, qText);
      setCopilotData(res);
    } catch (err) {
      console.error('HeatPulse Copilot Error:', err);
      setError(err.message || 'Unable to execute Copilot analysis');
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial fleet assessment on mount or when worksites telemetry updates
  useEffect(() => {
    if (worksites && worksites.length > 0 && !copilotData && !isLoading) {
      handleRunCopilot(null);
    }
  }, [worksites?.length]);

  const isAgentExecuted = copilotData?.copilot_executed === true;

  return (
    <div className="bg-gray-900/95 border border-orange-500/25 rounded-2xl p-6 shadow-2xl space-y-6 animate-fadeIn">
      {/* Copilot Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 text-orange-400 shadow-inner">
            <Bot className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-mono uppercase tracking-widest text-orange-400 font-bold">
                AI Safety Operations Agent
              </h2>
              <span className="text-gray-600">•</span>
              <span className="text-[10px] font-mono text-gray-400">Grounded Fleet Intelligence</span>
            </div>
            <h3 className="text-xl font-black text-white tracking-wide mt-0.5">
              Heat Safety Copilot Command Assistant
            </h3>
          </div>
        </div>

        {/* Execution Mode Badge */}
        {copilotData && (
          <div className="flex items-center gap-2">
            {isAgentExecuted ? (
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/40 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-yellow-300" />
                Agentic AI Safety Agent
              </span>
            ) : (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                Deterministic Fleet Engine (Fallback)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Preset Query Chips */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400 uppercase tracking-wider font-semibold">
          <HelpCircle className="w-3.5 h-3.5 text-orange-400" />
          <span>Operational Query Presets</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {presetQueries.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setQueryInput(preset.text);
                handleRunCopilot(preset.text);
              }}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                queryInput === preset.text
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                  : 'bg-gray-950 text-gray-300 border-gray-800 hover:border-gray-700 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Natural Language Query Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Ask Safety Copilot (e.g. Which sites need immediate attention today?)..."
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRunCopilot();
            }}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-4 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:border-orange-500/60 focus:outline-none transition shadow-inner font-sans"
          />
          {isLoading && (
            <RefreshCw className="w-4 h-4 text-orange-400 animate-spin absolute right-3 top-3" />
          )}
        </div>

        <button
          type="button"
          onClick={() => handleRunCopilot()}
          disabled={isLoading}
          className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-lg shadow-orange-500/20 flex items-center gap-1.5 shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>Ask Agent</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => handleRunCopilot()}
            className="text-xs underline font-semibold text-white hover:text-rose-200"
          >
            Retry Query
          </button>
        </div>
      )}

      {/* Copilot Grounded Insights Output */}
      {copilotData && !isLoading && (
        <div className="space-y-5 animate-fadeIn">

          {/* 1. Executive Summary Verdict */}
          <div className="bg-gradient-to-r from-orange-950/40 via-gray-950 to-amber-950/30 border border-orange-500/30 rounded-xl p-5 space-y-3 shadow-inner">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Executive Summary Verdict
              </span>
              <span className="text-[10px] text-gray-400 normal-case font-normal">
                Query: &quot;{activeQuery || 'General Assessment'}&quot;
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-semibold">
              {copilotData.summary_verdict}
            </p>

            {/* Direct Query Answer Box */}
            {copilotData.copilot_answer && (
              <div className="bg-gray-900/90 border border-gray-800 rounded-lg p-3 text-xs text-amber-300 space-y-1">
                <div className="font-bold text-white font-mono text-[11px] flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-orange-400" /> Grounded Agent Response:
                </div>
                <p className="text-xs text-gray-200 leading-relaxed">
                  {copilotData.copilot_answer}
                </p>
              </div>
            )}
          </div>

          {/* 2. Critical Sites Needing Immediate Attention Grid */}
          {copilotData.critical_sites_attention && copilotData.critical_sites_attention.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400 uppercase tracking-wider font-semibold">
                <span>Worksites Needing Immediate Supervisor Attention ({copilotData.critical_sites_attention.length})</span>
                <span>Click to view site control room</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {copilotData.critical_sites_attention.map((siteItem, sIdx) => (
                  <div
                    key={sIdx}
                    onClick={() => onSelectWorksite && onSelectWorksite(siteItem.site_id)}
                    className="bg-gray-950/90 border border-rose-500/30 hover:border-rose-500/60 rounded-xl p-4 space-y-2 cursor-pointer transition shadow-md group"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white group-hover:text-orange-300 transition">
                        {siteItem.site_name}
                      </h4>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        siteItem.risk_level === 'CRITICAL'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-red-500/20 text-red-400 border-red-500/40'
                      }`}>
                        {siteItem.risk_level}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed font-medium">
                      {siteItem.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Recommended Interventions & Target Window Guidance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* Priority Directives */}
            <div className="lg:col-span-7 bg-gray-950/80 border border-gray-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Recommended Immediate Interventions</span>
              </div>

              <ul className="space-y-2">
                {copilotData.recommended_immediate_interventions?.map((item, iIdx) => (
                  <li key={iIdx} className="flex items-start gap-2 text-xs text-gray-200 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Target Window Advisory & Unresolved Summary */}
            <div className="lg:col-span-5 bg-gray-950/80 border border-gray-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Target Window Advisory</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                  {copilotData.time_window_advisory}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-800/80 text-[11px] font-mono text-gray-400 space-y-1">
                <div className="text-orange-400 font-semibold">Unresolved Directives Audit:</div>
                <p className="text-gray-300 font-sans leading-normal">
                  {copilotData.unresolved_summary}
                </p>
              </div>
            </div>
          </div>

          {/* 4. Real Agent Decision Trace (agent_trace) Drawer */}
          {copilotData.agent_trace && copilotData.agent_trace.length > 0 && (
            <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setIsTraceExpanded(!isTraceExpanded)}
                className="w-full px-4 py-3 bg-gray-900/60 hover:bg-gray-900 text-left flex items-center justify-between text-xs font-mono text-gray-400 hover:text-white transition"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-orange-400" />
                  <span className="font-bold">Agent Decision Trace</span>
                  <span className="text-[10px] text-gray-500">({copilotData.agent_trace.length} operational steps executed)</span>
                </div>
                {isTraceExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isTraceExpanded && (
                <div className="p-4 space-y-2 font-mono text-[11px] text-gray-300 bg-black/40 border-t border-gray-800/80">
                  {copilotData.agent_trace.map((step, tIdx) => (
                    <div key={tIdx} className="flex items-start gap-2">
                      <span className="text-orange-500 font-bold shrink-0">[{tIdx + 1}]</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
