import React from 'react';
import { Flame, Compass, ArrowRight, MapPin, Calendar, Users, ShieldAlert } from 'lucide-react';

export function EmptyState({ onTriggerDemo }) {
  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-8 sm:p-12 shadow-xl flex flex-col items-center justify-center text-center space-y-6">
      {/* Icon Badge */}
      <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shadow-inner">
        <Compass className="w-8 h-8 animate-spin-slow" />
      </div>

      {/* Main Empty State Messaging */}
      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-bold text-white tracking-wide">
          Ready to Analyze Hyperlocal Heat Risk
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          Select an Area of Interest (AOI), target date, and time window above, then click <strong className="text-orange-400 font-semibold">Analyze Heat</strong> to evaluate local thermal severity, priority groups, and actionable recommendations.
        </p>
      </div>

      {/* Workflow Feature Steps Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl text-left pt-2">
        <div className="bg-gray-950/80 p-3.5 rounded-xl border border-gray-800/80 space-y-1">
          <div className="text-xs font-mono font-bold text-orange-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> 1. WHERE?
          </div>
          <div className="text-xs text-gray-300 font-medium">Define AOI Boundary</div>
        </div>
        <div className="bg-gray-950/80 p-3.5 rounded-xl border border-gray-800/80 space-y-1">
          <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> 2. WHO?
          </div>
          <div className="text-xs text-gray-300 font-medium">Vulnerable Priority Groups</div>
        </div>
        <div className="bg-gray-950/80 p-3.5 rounded-xl border border-gray-800/80 space-y-1">
          <div className="text-xs font-mono font-bold text-red-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> 3. WHAT ACTION?
          </div>
          <div className="text-xs text-gray-300 font-medium">Targeted Interventions</div>
        </div>
      </div>

      {/* Quick Launch CTA */}
      <button
        type="button"
        onClick={onTriggerDemo}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 text-xs font-semibold transition"
      >
        <span>Run Sample Analysis with Demo AOI</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
