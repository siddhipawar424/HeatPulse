import React from 'react';
import { Users, HardHat, HeartPulse, Baby, Activity, AlertCircle, ShieldAlert } from 'lucide-react';

export function PriorityGroups({ groups }) {
  if (!groups || groups.length === 0) return null;

  // Icon mapping helper based on group name string matching
  const getGroupIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('worker') || lower.includes('outdoor worker')) {
      return HardHat;
    }
    if (lower.includes('elderly') || lower.includes('senior')) {
      return HeartPulse;
    }
    if (lower.includes('child') || lower.includes('children') || lower.includes('kid')) {
      return Baby;
    }
    if (lower.includes('exerciser') || lower.includes('athlete') || lower.includes('sport')) {
      return Activity;
    }
    return Users;
  };

  // Severity styling mapping
  const getPriorityBadge = (priority) => {
    const p = (priority || '').toUpperCase();
    switch (p) {
      case 'CRITICAL':
        return {
          label: 'CRITICAL',
          style: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          barBg: 'bg-purple-500',
          indicator: '95%'
        };
      case 'VERY_HIGH':
      case 'VERY HIGH':
        return {
          label: 'VERY HIGH',
          style: 'bg-red-500/20 text-red-400 border-red-500/40',
          barBg: 'bg-red-500',
          indicator: '85%'
        };
      case 'HIGH':
        return {
          label: 'HIGH',
          style: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
          barBg: 'bg-orange-500',
          indicator: '70%'
        };
      case 'MODERATE':
      case 'NORMAL':
      default:
        return {
          label: p || 'NORMAL',
          style: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          barBg: 'bg-amber-500',
          indicator: '50%'
        };
    }
  };

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-gray-400 font-semibold">
              Hyperlocal Population Vulnerability
            </h2>
            <h3 className="text-lg font-bold text-white tracking-wide">Priority Groups</h3>
          </div>
        </div>

        <span className="text-xs text-gray-400 bg-gray-950 px-3 py-1 rounded-full border border-gray-800 font-mono">
          {groups.length} Populations Evaluated
        </span>
      </div>

      {/* Grid of Priority Group Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {groups.map((item, index) => {
          const Icon = getGroupIcon(item.group);
          const badge = getPriorityBadge(item.priority);

          return (
            <div
              key={index}
              className="group relative bg-gray-950/80 hover:bg-gray-950 border border-gray-800/90 hover:border-orange-500/30 rounded-xl p-4 transition-all duration-300 flex flex-col justify-between space-y-3 shadow-md"
            >
              {/* Group Name & Icon */}
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 group-hover:text-orange-400 group-hover:border-orange-500/30 transition">
                  <Icon className="w-5 h-5" />
                </div>

                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border font-mono ${badge.style}`}>
                  {badge.label}
                </span>
              </div>

              {/* Group Title */}
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-orange-300 transition">
                  {item.group}
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Vulnerability Tier</p>
              </div>

              {/* Visual Severity Indicator Bar */}
              <div className="space-y-1 pt-1 border-t border-gray-800/60">
                <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${badge.barBg} rounded-full transition-all duration-700`}
                    style={{ width: badge.indicator }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
