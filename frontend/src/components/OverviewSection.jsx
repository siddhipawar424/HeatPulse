import React from 'react';
import { Flame, ShieldAlert, Cpu, Layers, ArrowRight, Activity, Thermometer, Users, CheckCircle2 } from 'lucide-react';

export function OverviewSection({ onStartAnalysis }) {
  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-900/95 to-gray-950 border border-gray-800 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-semibold uppercase tracking-wider">
            Hyperlocal Heat Intelligence Platform
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight max-w-2xl">
          Turning Complex Thermal Data into <span className="bg-gradient-to-r from-orange-400 via-red-500 to-amber-400 bg-clip-text text-transparent">Actionable Heat Protection</span>
        </h2>

        <p className="text-sm sm:text-base text-gray-300 max-w-3xl leading-relaxed">
          Extreme heat is an invisible hazard. HeatPulse bridges satellite microclimate sensor data with AI risk modeling to quantify hyperlocal thermal danger, identify vulnerable populations, and prescribe targeted community actions.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onStartAnalysis}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-bold text-sm shadow-xl shadow-orange-500/20 transition active:scale-95"
          >
            <Flame className="w-5 h-5 text-yellow-200" />
            <span>Launch Analysis Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Core Workflow Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Thermometer className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">1. Hyperlocal Thermal Sensing</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Measures exact maximum and mean surface temperatures within target geographical AOI bounding polygons.
          </p>
        </div>

        <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">2. Vulnerability Priority</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Evaluates heat stress impacts across key demographics: outdoor laborers, elderly citizens, children, and athletes.
          </p>
        </div>

        <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-3 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">3. Prescribed Interventions</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Generates population-specific safety measures to prevent heat stroke, dehydration, and emergency hospitalization.
          </p>
        </div>

      </div>
    </div>
  );
}
