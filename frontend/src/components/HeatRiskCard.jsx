import React from 'react';
import { Flame, Thermometer, ShieldAlert, TrendingUp, Info } from 'lucide-react';

export function HeatRiskCard({ risk, temperatureStats }) {
  if (!risk) return null;

  const level = (risk.level || 'MODERATE').toUpperCase();
  const score = risk.score ?? 50;

  // Max and Mean temp fallbacks
  const maxTemp = risk.maximum_temperature ?? temperatureStats?.maximum ?? 'N/A';
  const meanTemp = risk.mean_temperature ?? temperatureStats?.mean ?? 'N/A';

  // Severity color mapping based on backend risk level
  const getSeverityStyle = (lvl) => {
    switch (lvl) {
      case 'CRITICAL':
      case 'EXTREME':
        return {
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          glowBg: 'from-purple-600/30 via-red-600/30 to-orange-500/20',
          textColor: 'text-purple-300',
          progressGradient: 'from-orange-500 via-red-600 to-purple-600',
          border: 'border-purple-500/30'
        };
      case 'HIGH':
      case 'VERY_HIGH':
        return {
          badgeBg: 'bg-red-500/20 text-red-400 border-red-500/40',
          glowBg: 'from-red-600/25 via-orange-500/20 to-amber-500/20',
          textColor: 'text-red-400',
          progressGradient: 'from-amber-500 via-orange-500 to-red-600',
          border: 'border-red-500/30'
        };
      case 'MODERATE':
        return {
          badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          glowBg: 'from-amber-600/20 to-yellow-500/10',
          textColor: 'text-amber-400',
          progressGradient: 'from-yellow-400 to-amber-600',
          border: 'border-amber-500/30'
        };
      case 'LOW':
      default:
        return {
          badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          glowBg: 'from-emerald-600/20 to-teal-500/10',
          textColor: 'text-emerald-400',
          progressGradient: 'from-teal-400 to-emerald-500',
          border: 'border-emerald-500/30'
        };
    }
  };

  const severityStyle = getSeverityStyle(level);

  return (
    <div className={`relative overflow-hidden bg-gray-900/90 border ${severityStyle.border} rounded-2xl p-6 shadow-2xl space-y-6`}>
      {/* Background Glow Effect */}
      <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br ${severityStyle.glowBg} blur-3xl opacity-60 pointer-events-none`}></div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-gray-400 font-semibold">
              Assessment Summary
            </h2>
            <h3 className="text-lg font-bold text-white tracking-wide">HEAT RISK</h3>
          </div>
        </div>

        {/* Severity Badge */}
        <span className={`px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wider border shadow-md ${severityStyle.badgeBg}`}>
          {level} RISK
        </span>
      </div>

      {/* Score & Gauge Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-gray-950/80 p-5 rounded-xl border border-gray-800/80">
        
        {/* Risk Score Highlight */}
        <div className="md:col-span-1 flex flex-col items-center md:items-start justify-center border-b md:border-b-0 md:border-r border-gray-800/80 pb-4 md:pb-0 md:pr-4">
          <span className="text-xs font-medium text-gray-400 mb-1">Risk Score</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${severityStyle.textColor}`}>
              {score}
            </span>
            <span className="text-sm font-semibold text-gray-500">/ 100</span>
          </div>
        </div>

        {/* Score Progress Bar */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-gray-300">
            <span>Thermal Stress Index</span>
            <span className={severityStyle.textColor}>{score}% Intensity</span>
          </div>
          <div className="w-full h-3.5 bg-gray-900 rounded-full p-0.5 border border-gray-800 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${severityStyle.progressGradient} transition-all duration-1000 shadow-inner`}
              style={{ width: `${Math.min(Math.max(score, 5), 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-gray-500">
            <span>0 (Low)</span>
            <span>50 (Moderate)</span>
            <span>100 (Extreme)</span>
          </div>
        </div>
      </div>

      {/* Temperature Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Maximum Temperature */}
        <div className="bg-gray-950/70 p-4 rounded-xl border border-gray-800/80 flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Maximum Temperature</div>
            <div className="text-2xl font-black text-white font-mono">
              {typeof maxTemp === 'number' ? maxTemp.toFixed(2) : maxTemp}
              <span className="text-sm font-normal text-gray-400 ml-1">°C</span>
            </div>
          </div>
        </div>

        {/* Mean Temperature */}
        <div className="bg-gray-950/70 p-4 rounded-xl border border-gray-800/80 flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium">Mean Temperature</div>
            <div className="text-2xl font-black text-white font-mono">
              {typeof meanTemp === 'number' ? meanTemp.toFixed(2) : meanTemp}
              <span className="text-sm font-normal text-gray-400 ml-1">°C</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
