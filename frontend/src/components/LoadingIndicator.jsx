import React from 'react';
import { Flame, Compass, Cpu, Activity } from 'lucide-react';

export function LoadingIndicator() {
  return (
    <div className="bg-gray-900/90 border border-orange-500/30 rounded-2xl p-8 sm:p-12 shadow-2xl flex flex-col items-center justify-center text-center space-y-6 animate-pulse">
      {/* Animated Radar Pulse Container */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Outer Pulsing Rings */}
        <div className="absolute inset-0 rounded-full border border-orange-500/30 animate-ping opacity-40"></div>
        <div className="absolute -inset-3 rounded-full border border-red-500/20 animate-heat-pulse opacity-60"></div>
        
        {/* Sweeping Radar Scanner */}
        <div className="absolute inset-0 rounded-full border-2 border-orange-500/40 border-t-orange-500 animate-radar"></div>
        
        {/* Glowing Center Core Icon */}
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/40">
          <Flame className="w-7 h-7 text-yellow-100 animate-pulse" />
        </div>
      </div>

      {/* Loading Status Text */}
      <div className="space-y-2 max-w-sm">
        <h3 className="text-lg font-bold text-white tracking-wide">
          Analyzing Local Heat Conditions...
        </h3>
        <p className="text-xs text-gray-400">
          Fetching FortyGuard microclimate stats & executing AI priority engine algorithms
        </p>
      </div>

      {/* Micro Progress Badges */}
      <div className="flex items-center justify-center gap-3 text-[11px] font-mono text-gray-400 bg-gray-950 px-4 py-2 rounded-xl border border-gray-800">
        <span className="flex items-center gap-1.5 text-orange-400">
          <Activity className="w-3.5 h-3.5 animate-spin" />
          FortyGuard API
        </span>
        <span className="text-gray-600">•</span>
        <span className="flex items-center gap-1.5 text-amber-400">
          <Cpu className="w-3.5 h-3.5" />
          Risk Evaluation
        </span>
      </div>
    </div>
  );
}
