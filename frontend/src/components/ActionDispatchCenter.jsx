import React, { useState } from 'react';
import { 
  ShieldCheck, CheckCircle2, Clock, AlertTriangle, Sparkles, 
  BookOpen, UserCheck, Check, AlertCircle, RefreshCw, X,
  History, ListChecks, ScrollText
} from 'lucide-react';

export function ActionDispatchCenter({ 
  operationalActions, 
  agentMetadata, 
  guidelines, 
  onUpdateActionStatus,
  auditLog,
  worksiteId,
}) {
  const [exceptionInputId, setExceptionInputId] = useState(null);
  const [exceptionReasonText, setExceptionReasonText] = useState('');
  // 'active' | 'history'
  const [activeView, setActiveView] = useState('active');

  if (!operationalActions || operationalActions.length === 0) return null;

  const isAgentExecuted = agentMetadata?.agent_executed === true;

  // Calculate resolution progress
  const completedCount = operationalActions.filter(a => a.status === 'COMPLETED').length;
  const acknowledgedCount = operationalActions.filter(a => a.status === 'ACKNOWLEDGED').length;
  const exceptionCount = operationalActions.filter(a => a.status === 'EXCEPTION').length;
  const pendingCount = operationalActions.filter(a => a.status === 'PENDING').length;
  const totalCount = operationalActions.length;
  const progressPct = Math.round(((completedCount + exceptionCount) / totalCount) * 100);

  // Actions that have at least one history event
  const historyActions = operationalActions.filter(
    (a) => a.acknowledgedAt || a.completedAt || a.exceptionReason
  );

  const handleAcknowledge = (actionId) => {
    onUpdateActionStatus(actionId, 'ACKNOWLEDGED');
  };

  const handleComplete = (actionId) => {
    onUpdateActionStatus(actionId, 'COMPLETED');
  };

  const handleOpenExceptionModal = (actionId) => {
    setExceptionInputId(actionId);
    setExceptionReasonText('');
  };

  const handleSubmitException = (actionId) => {
    const reason = exceptionReasonText.trim() || 'Operational exception reported by supervisor';
    onUpdateActionStatus(actionId, 'EXCEPTION', { reason });
    setExceptionInputId(null);
    setExceptionReasonText('');
  };

  const handleReset = (actionId) => {
    onUpdateActionStatus(actionId, 'PENDING');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED
          </span>
        );
      case 'ACKNOWLEDGED':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/40 font-mono">
            <UserCheck className="w-3.5 h-3.5" /> ACKNOWLEDGED
          </span>
        );
      case 'EXCEPTION':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40 font-mono">
            <AlertTriangle className="w-3.5 h-3.5" /> EXCEPTION
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono animate-pulse">
            <Clock className="w-3.5 h-3.5" /> ACTION REQUIRED
          </span>
        );
    }
  };

  const getPriorityBadgeStyle = (priority) => {
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
      {/* Header & Operational Resolution Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-mono uppercase tracking-widest text-gray-400 font-semibold">
                Operational Safety Plan
              </h2>
              <h3 className="text-lg font-bold text-white tracking-wide">Action Tracking &amp; Supervisor Dispatch</h3>
            </div>
          </div>

          {/* AI Intelligence Badge */}
          {isAgentExecuted ? (
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/40 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-yellow-300" />
              Agentic AI Action Plan
            </span>
          ) : (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
              Deterministic Safety Engine Plan
            </span>
          )}
        </div>

        {/* Operational Resolution Progress Bar */}
        <div className="bg-gray-950 p-4 rounded-xl border border-gray-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-gray-300 flex items-center gap-2 font-mono">
              <span>Resolution Progress:</span>
              <span className="text-white font-bold">{completedCount + exceptionCount} of {totalCount} Items Resolved</span>
            </span>
            <span className="font-mono text-orange-400 font-bold">{progressPct}% Complete</span>
          </div>
          
          <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-800 flex">
            <div 
              style={{ width: `${(completedCount / totalCount) * 100}%` }} 
              className="bg-emerald-500 transition-all duration-500" 
              title={`Completed: ${completedCount}`}
            />
            <div 
              style={{ width: `${(acknowledgedCount / totalCount) * 100}%` }} 
              className="bg-blue-500 transition-all duration-500" 
              title={`Acknowledged: ${acknowledgedCount}`}
            />
            <div 
              style={{ width: `${(exceptionCount / totalCount) * 100}%` }} 
              className="bg-rose-500 transition-all duration-500" 
              title={`Exceptions: ${exceptionCount}`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 pt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> Pending ({pendingCount})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span> Acknowledged ({acknowledgedCount})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span> Completed ({completedCount})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span> Exceptions ({exceptionCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tab Switcher: Active Directives / Action History ─── */}
      <div className="flex items-center gap-1 bg-gray-950 rounded-xl border border-gray-800 p-1 w-fit">
        <button
          type="button"
          id="tab-active-directives"
          onClick={() => setActiveView('active')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeView === 'active'
              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          Active Directives
          <span className={`ml-0.5 text-[10px] font-mono px-1 rounded ${
            activeView === 'active' ? 'bg-orange-500/30 text-orange-300' : 'bg-gray-800 text-gray-400'
          }`}>{pendingCount + acknowledgedCount}</span>
        </button>
        <button
          type="button"
          id="tab-action-history"
          onClick={() => setActiveView('history')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeView === 'history'
              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Action History
          <span className={`ml-0.5 text-[10px] font-mono px-1 rounded ${
            activeView === 'history' ? 'bg-orange-500/30 text-orange-300' : 'bg-gray-800 text-gray-400'
          }`}>{historyActions.length}</span>
        </button>
        <button
          type="button"
          id="tab-audit-trail"
          onClick={() => setActiveView('audit')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeView === 'audit'
              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ScrollText className="w-3.5 h-3.5" />
          Audit Trail
          <span className={`ml-0.5 text-[10px] font-mono px-1 rounded ${
            activeView === 'audit' ? 'bg-orange-500/30 text-orange-300' : 'bg-gray-800 text-gray-400'
          }`}>{(auditLog || []).length}</span>
        </button>
      </div>

      {/* ─── ACTIVE DIRECTIVES TAB ─── */}
      {activeView === 'active' && (
        <>
          {/* AI Reasoning Summary & Guideline Citations Drawer */}
          {isAgentExecuted && agentMetadata.reasoning_summary && (
            <div className="bg-gradient-to-r from-orange-950/40 via-gray-950 to-amber-950/30 border border-orange-500/30 rounded-xl p-5 space-y-3 shadow-inner">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                Agentic AI Reasoning &amp; Guideline Synthesis
              </div>

              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-medium">
                {agentMetadata.reasoning_summary}
              </p>

              {agentMetadata.time_window_guidance && (
                <div className="flex items-start gap-2 bg-gray-900/90 p-3 rounded-lg border border-gray-800 text-xs text-amber-300">
                  <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <strong className="text-white">Target Window Advisory: </strong>
                    {agentMetadata.time_window_guidance}
                  </div>
                </div>
              )}

              {agentMetadata.guideline_citations && agentMetadata.guideline_citations.length > 0 && (
                <div className="pt-2 border-t border-gray-800/80 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="text-gray-400 font-mono flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-orange-400" /> Standards Cited:
                  </span>
                  {agentMetadata.guideline_citations.map((cite, cIdx) => (
                    <span key={cIdx} className="bg-orange-500/10 text-orange-300 px-2 py-0.5 rounded border border-orange-500/20 font-mono">
                      {cite}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Operational Actions Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400 uppercase tracking-wider font-semibold">
              <span>Operational Safety Directives ({totalCount})</span>
              <span>Click buttons to update tracking status</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {operationalActions.map((action) => {
                const priorityBadgeStyle = getPriorityBadgeStyle(action.priority);

                return (
                  <div
                    key={action.id}
                    id={`action-card-${action.id}`}
                    className={`bg-gray-950/90 border rounded-xl p-5 space-y-4 transition shadow-md flex flex-col justify-between ${
                      action.status === 'COMPLETED'
                        ? 'border-emerald-500/30 bg-emerald-950/10'
                        : action.status === 'ACKNOWLEDGED'
                        ? 'border-blue-500/30 bg-blue-950/10'
                        : action.status === 'EXCEPTION'
                        ? 'border-rose-500/30 bg-rose-950/10'
                        : 'border-gray-800 hover:border-orange-500/30'
                    }`}
                  >
                    {/* Header: Group, Responsible Role, Status */}
                    <div className="space-y-2 border-b border-gray-800/80 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-base font-bold text-white tracking-wide">
                            {action.group}
                          </h4>
                          <p className="text-[11px] text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                            <UserCheck className="w-3 h-3 text-orange-400" />
                            Responsible: <span className="text-gray-200 font-medium">{action.responsible}</span>
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          {getStatusBadge(action.status)}
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${priorityBadgeStyle}`}>
                            {action.priority?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Directive Body */}
                    <div className="space-y-2 flex-1">
                      <p className="text-xs text-gray-200 leading-relaxed font-medium">
                        {action.directive}
                      </p>

                      {/* Exception Note Banner if in EXCEPTION state */}
                      {action.status === 'EXCEPTION' && action.exceptionReason && (
                        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5 text-xs text-rose-300 space-y-1">
                          <div className="font-semibold font-mono text-[11px] flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Reported Exception:
                          </div>
                          <p className="text-[11px] text-gray-300 italic">
                            &quot;{action.exceptionReason}&quot;
                          </p>
                        </div>
                      )}

                      {/* Timestamps */}
                      {(action.acknowledgedAt || action.completedAt) && (
                        <div className="text-[10px] font-mono text-gray-500 flex flex-wrap gap-2 pt-1">
                          {action.acknowledgedAt && (
                            <span>Ack: {new Date(action.acknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                          {action.completedAt && (
                            <span>Done: {new Date(action.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Interactive Action Control Buttons */}
                    <div className="pt-3 border-t border-gray-800/80 space-y-2">
                      {/* Status 1: PENDING -> Show Acknowledge */}
                      {action.status === 'PENDING' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            id={`btn-ack-${action.id}`}
                            onClick={() => handleAcknowledge(action.id)}
                            className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 font-semibold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <UserCheck className="w-4 h-4" /> Acknowledge Action
                          </button>
                        </div>
                      )}

                      {/* Status 2: ACKNOWLEDGED -> Show Mark Completed & Report Exception */}
                      {action.status === 'ACKNOWLEDGED' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            id={`btn-complete-${action.id}`}
                            onClick={() => handleComplete(action.id)}
                            className="flex-1 bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 font-semibold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Check className="w-4 h-4" /> Mark Completed
                          </button>
                          <button
                            type="button"
                            id={`btn-exception-${action.id}`}
                            onClick={() => handleOpenExceptionModal(action.id)}
                            className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-medium py-2 px-3 rounded-lg text-xs transition flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" /> Exception
                          </button>
                        </div>
                      )}

                      {/* Status 3: COMPLETED -> Show Verified banner + Reset option */}
                      {action.status === 'COMPLETED' && (
                        <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs text-emerald-300">
                          <span className="font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Action Verified Complete
                          </span>
                          <button
                            type="button"
                            onClick={() => handleReset(action.id)}
                            className="text-[10px] text-gray-400 hover:text-gray-200 underline font-mono flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Reopen
                          </button>
                        </div>
                      )}

                      {/* Status 4: EXCEPTION -> Show Exception banner + Reset option */}
                      {action.status === 'EXCEPTION' && (
                        <div className="flex items-center justify-between bg-rose-950/40 border border-rose-500/30 px-3 py-1.5 rounded-lg text-xs text-rose-300">
                          <span className="font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-400" /> Operational Exception Recorded
                          </span>
                          <button
                            type="button"
                            onClick={() => handleReset(action.id)}
                            className="text-[10px] text-gray-400 hover:text-gray-200 underline font-mono flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Reset Status
                          </button>
                        </div>
                      )}

                      {/* Inline Exception Reason Input Form */}
                      {exceptionInputId === action.id && (
                        <div className="mt-2 bg-gray-900 border border-rose-500/40 rounded-lg p-3 space-y-2 animate-fadeIn">
                          <div className="flex items-center justify-between text-xs font-semibold text-rose-300">
                            <span>Specify Exception Reason</span>
                            <button type="button" onClick={() => setExceptionInputId(null)}>
                              <X className="w-4 h-4 text-gray-400 hover:text-white" />
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="e.g. Work shift suspended / Shade structure unavailable..."
                            value={exceptionReasonText}
                            onChange={(e) => setExceptionReasonText(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setExceptionInputId(null)}
                              className="px-2.5 py-1 text-xs text-gray-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              id={`btn-submit-exception-${action.id}`}
                              onClick={() => handleSubmitException(action.id)}
                              className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-semibold hover:bg-rose-500"
                            >
                              Confirm Exception
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ─── AUDIT TRAIL TAB ─── */}
      {activeView === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400 uppercase tracking-wider font-semibold">
            <span>Operational Audit Trail ({(auditLog || []).length} events)</span>
            <span className="text-[11px] normal-case tracking-normal">Persists across browser refreshes</span>
          </div>

          {(!auditLog || auditLog.length === 0) ? (
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-8 text-center space-y-2">
              <ScrollText className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-sm font-semibold text-gray-300">No audit events yet</p>
              <p className="text-xs text-gray-500">
                Run a heat-risk analysis to begin recording operational events.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="bg-gray-950 border-b border-gray-800 text-gray-400 uppercase tracking-wider">
                    <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Timestamp</th>
                    <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Worksite</th>
                    <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Risk</th>
                    <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Event</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Action / Directive</th>
                    <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Status</th>
                    <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {auditLog.map((evt) => {
                    // Row color by event type
                    const rowStyle =
                      evt.eventType === 'COMPLETED'   ? 'bg-emerald-950/10 hover:bg-emerald-950/20' :
                      evt.eventType === 'ACKNOWLEDGED'? 'bg-blue-950/10 hover:bg-blue-950/20'     :
                      evt.eventType === 'EXCEPTION'   ? 'bg-rose-950/10 hover:bg-rose-950/20'       :
                      evt.eventType === 'ANALYSIS'    ? 'bg-gray-950/60 hover:bg-gray-900/40'       :
                      'bg-gray-950/40 hover:bg-gray-900/40';

                    // Event badge color
                    const eventBadgeStyle =
                      evt.eventType === 'ANALYSIS'       ? 'text-gray-300 bg-gray-800/60 border-gray-700'          :
                      evt.eventType === 'RECOMMENDATION' ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'     :
                      evt.eventType === 'DISPATCH'       ? 'text-orange-300 bg-orange-500/10 border-orange-500/30'  :
                      evt.eventType === 'ACKNOWLEDGED'   ? 'text-blue-300 bg-blue-500/10 border-blue-500/30'        :
                      evt.eventType === 'COMPLETED'      ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30':
                      'text-rose-300 bg-rose-500/10 border-rose-500/30';

                    // Risk badge color
                    const riskBadgeStyle =
                      evt.riskLevel === 'CRITICAL'  ? 'text-purple-300 bg-purple-500/10 border-purple-500/30' :
                      evt.riskLevel === 'VERY_HIGH' ? 'text-red-300 bg-red-500/10 border-red-500/30'         :
                      evt.riskLevel === 'HIGH'      ? 'text-orange-300 bg-orange-500/10 border-orange-500/30':
                      evt.riskLevel === 'MODERATE'  ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'   :
                      'text-gray-300 bg-gray-800/50 border-gray-700';

                    // Source badge color
                    const sourceBadgeStyle =
                      evt.source === 'GEMINI'                 ? 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30'    :
                      evt.source === 'DETERMINISTIC_FALLBACK' ? 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30'          :
                      evt.source === 'SUPERVISOR'             ? 'text-blue-300 bg-blue-500/10 border-blue-500/30'          :
                      'text-gray-300 bg-gray-800/50 border-gray-700';

                    return (
                      <tr key={evt.id} className={`transition-colors ${rowStyle}`}>
                        {/* Timestamp */}
                        <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">
                          {new Date(evt.timestamp).toLocaleString([], {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </td>

                        {/* Worksite */}
                        <td className="px-3 py-2.5 text-gray-200 whitespace-nowrap max-w-[160px] truncate" title={evt.worksiteName}>
                          {evt.worksiteName}
                        </td>

                        {/* Risk */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {evt.riskLevel ? (
                            <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${riskBadgeStyle}`}>
                              {evt.riskLevel} {evt.riskScore != null ? `(${evt.riskScore})` : ''}
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>

                        {/* Event Type */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${eventBadgeStyle}`}>
                            {evt.eventType}
                          </span>
                        </td>

                        {/* Action / Directive */}
                        <td className="px-3 py-2.5 text-gray-300 max-w-[220px]">
                          {evt.directive ? (
                            <span className="line-clamp-2 leading-relaxed" title={evt.directive}>{evt.directive}</span>
                          ) : (
                            <span className="text-gray-600 italic">—</span>
                          )}
                          {evt.exceptionReason && (
                            <p className="text-rose-400 mt-0.5 italic text-[10px]">↳ {evt.exceptionReason}</p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {evt.status ? (
                            <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${
                              evt.status === 'COMPLETED'   ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' :
                              evt.status === 'ACKNOWLEDGED'? 'text-blue-300 bg-blue-500/10 border-blue-500/30'         :
                              evt.status === 'EXCEPTION'   ? 'text-rose-300 bg-rose-500/10 border-rose-500/30'         :
                              'text-amber-300 bg-amber-500/10 border-amber-500/30'
                            }`}>
                              {evt.status}
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>

                        {/* Source */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${sourceBadgeStyle}`}>
                            {evt.source}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── ACTION HISTORY TAB ─── */}
      {activeView === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400 uppercase tracking-wider font-semibold">
            <span>Action History Log ({historyActions.length} events)</span>
            <span className="text-[11px] normal-case tracking-normal">Timestamps from this session</span>
          </div>

          {historyActions.length === 0 ? (
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-8 text-center space-y-2">
              <History className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-sm font-semibold text-gray-300">No action history yet</p>
              <p className="text-xs text-gray-500">
                Acknowledge, complete, or report exceptions on actions above to build a history log.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyActions.map((action) => (
                <div
                  key={action.id}
                  id={`history-entry-${action.id}`}
                  className={`bg-gray-950/80 border rounded-xl p-4 space-y-3 shadow-sm ${
                    action.status === 'COMPLETED'
                      ? 'border-emerald-500/25'
                      : action.status === 'EXCEPTION'
                      ? 'border-rose-500/25'
                      : 'border-blue-500/25'
                  }`}
                >
                  {/* Action Group / Role header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{action.group}</h4>
                      <p className="text-[11px] text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                        <UserCheck className="w-3 h-3 text-orange-400" />
                        {action.responsible}
                      </p>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      action.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : action.status === 'EXCEPTION'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    }`}>{action.status}</span>
                  </div>

                  {/* Directive summary */}
                  <p className="text-xs text-gray-300 leading-relaxed border-l-2 border-gray-700 pl-3 italic">
                    {action.directive}
                  </p>

                  {/* Timeline events */}
                  <div className="space-y-1.5">
                    {action.acknowledgedAt && (
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                        <span className="text-blue-300 font-semibold">ACKNOWLEDGED</span>
                        <span className="text-gray-500">
                          {new Date(action.acknowledgedAt).toLocaleString([], {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                    {action.completedAt && (
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-emerald-300 font-semibold">COMPLETED</span>
                        <span className="text-gray-500">
                          {new Date(action.completedAt).toLocaleString([], {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                    {action.status === 'EXCEPTION' && action.exceptionReason && (
                      <div className="flex items-start gap-2 text-[11px] font-mono">
                        <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0 mt-1" />
                        <div>
                          <span className="text-rose-300 font-semibold">EXCEPTION</span>
                          <p className="text-gray-400 mt-0.5 normal-case font-sans italic">
                            &quot;{action.exceptionReason}&quot;
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Regulatory Standards — always visible regardless of tab */}
      {guidelines && guidelines.length > 0 && (
        <div className="pt-4 border-t border-gray-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
            <BookOpen className="w-4 h-4 text-orange-400" />
            <span>Retrieved Regulatory Standards Baseline ({guidelines.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {guidelines.map((g, gIdx) => (
              <div key={gIdx} className="bg-gray-950/60 p-3 rounded-lg border border-gray-800/60 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-orange-400 font-bold">[{g.organization}] {g.title}</span>
                  {g.source_url && (
                    <a href={g.source_url} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-gray-300 underline text-[10px]">
                      Source Link
                    </a>
                  )}
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
