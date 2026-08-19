import React from 'react';
import { Flame, ShieldAlert, Info, Activity, Layers, LayoutGrid, Building2 } from 'lucide-react';

export function Header({ activeTab, setActiveTab, selectedWorksiteName }) {
  const tabs = [
    { id: 'dashboard', label: 'Ops Dashboard', icon: LayoutGrid },
    { id: 'worksite', label: 'Worksite Detail', icon: Building2 },
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'about', label: 'Engine Info', icon: Info }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#090d16]/90 backdrop-blur-md border-b border-gray-800/80 px-4 sm:px-8 py-3.5 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Title & Subtitle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-red-600 to-amber-500 shadow-lg shadow-orange-500/20">
              <Flame className="w-6 h-6 text-white animate-pulse" />
              <div className="absolute -inset-0.5 rounded-xl bg-orange-500/30 blur-sm -z-10"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  HeatPulse
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono">
                    OPS PLATFORM v2.0
                  </span>
                </h1>
              </div>
              <p className="text-xs text-gray-400 font-medium tracking-wide">
                Worksite Heat Safety Operations & Action Tracking Platform
              </p>
            </div>
          </div>

          {/* Mobile status indicator */}
          <div className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-mono">Engine Connected</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 bg-gray-900/90 p-1 rounded-xl border border-gray-800 w-full md:w-auto justify-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20 font-semibold'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Engine Status Badge (Desktop) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900/90 border border-gray-800 text-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-gray-300 font-medium">FortyGuard & Gemini</span>
          <span className="text-emerald-400 font-mono text-[11px] font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            ONLINE
          </span>
        </div>

      </div>
    </header>
  );
}

