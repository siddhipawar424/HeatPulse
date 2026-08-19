import React from 'react';
import { Cpu, Server, Code2, Globe, Database, ShieldCheck, Flame } from 'lucide-react';

export function AboutSection() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-8 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Cpu className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wide">About HeatPulse AI Engine</h2>
            <p className="text-xs text-gray-400 font-mono">Backend Architecture & FortyGuard Microclimate API Integration</p>
          </div>
        </div>

        <p className="text-sm text-gray-300 leading-relaxed">
          HeatPulse is engineered as a zero-friction, decision-support interface. The system couples FortyGuard's satellite-derived hyperlocal thermal data with custom Flask backend decision engines to calculate immediate risk levels, prioritize vulnerable groups, and issue safety directives.
        </p>
      </div>

      {/* Architecture Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Backend API Stack */}
        <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-bold text-white">Backend Architecture</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-gray-300 font-mono">
            <li className="flex items-center justify-between bg-gray-950 p-2.5 rounded-lg border border-gray-800">
              <span className="text-gray-400">Framework</span>
              <span className="text-orange-400 font-semibold">Python / Flask</span>
            </li>
            <li className="flex items-center justify-between bg-gray-950 p-2.5 rounded-lg border border-gray-800">
              <span className="text-gray-400">Primary Endpoint</span>
              <span className="text-orange-400 font-semibold">POST /api/analyze</span>
            </li>
            <li className="flex items-center justify-between bg-gray-950 p-2.5 rounded-lg border border-gray-800">
              <span className="text-gray-400">Data Provider</span>
              <span className="text-orange-400 font-semibold">FortyGuard Heatmap V1</span>
            </li>
            <li className="flex items-center justify-between bg-gray-950 p-2.5 rounded-lg border border-gray-800">
              <span className="text-gray-400">AI Logic Engines</span>
              <span className="text-orange-400 font-semibold">Risk Engine, Priority Engine, Action Engine</span>
            </li>
          </ul>
        </div>

        {/* Frontend Architecture */}
        <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Frontend Architecture</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-gray-300 font-mono">
            <li className="flex items-center justify-between bg-gray-950 p-2.5 rounded-lg border border-gray-800">
              <span className="text-gray-400">Framework</span>
              <span className="text-amber-400 font-semibold">React 18 + Vite</span>
            </li>
            <li className="flex items-center justify-between bg-gray-950 p-2.5 rounded-lg border border-gray-800">
              <span className="text-gray-400">Styling & UI</span>
              <span className="text-amber-400 font-semibold">Tailwind CSS v4</span>
            </li>
            <li className="flex items-center justify-between bg-gray-950 p-2.5 rounded-lg border border-gray-800">
              <span className="text-gray-400">Geospatial Mapping</span>
              <span className="text-amber-400 font-semibold">Leaflet & React-Leaflet</span>
            </li>
            <li className="flex items-center justify-between bg-gray-950 p-2.5 rounded-lg border border-gray-800">
              <span className="text-gray-400">API Layer</span>
              <span className="text-amber-400 font-semibold">Axios / Configurable Base URL</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
