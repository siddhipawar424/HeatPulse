import React from 'react';
import { Calendar, Clock, Flame, Play } from 'lucide-react';

export function DateTimeSelector({ date, setDate, time, setTime, onAnalyze, isLoading }) {
  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Temporal Window</h3>
          <p className="text-xs text-gray-400">Select target date and hour for heat risk evaluation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Date Input */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-orange-400" />
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        {/* Time Input */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            Time (Peak Heat Window)
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-orange-500 transition"
          />
        </div>
      </div>

      {/* Main Analyze CTA Button */}
      <button
        type="button"
        onClick={onAnalyze}
        disabled={isLoading}
        className={`w-full relative group overflow-hidden py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all duration-300 shadow-xl ${
          isLoading
            ? 'bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-700'
            : 'bg-gradient-to-r from-orange-500 via-red-600 to-amber-500 hover:from-orange-400 hover:to-amber-500 shadow-orange-500/25 active:scale-[0.99]'
        }`}
      >
        <div className="flex items-center justify-center gap-2.5 z-10 relative">
          <Flame className={`w-5 h-5 ${isLoading ? 'animate-bounce text-gray-400' : 'text-yellow-200 animate-pulse'}`} />
          <span className="tracking-wide uppercase text-sm font-extrabold">
            {isLoading ? 'Analyzing Local Heat...' : 'Analyze Heat Risk'}
          </span>
        </div>
      </button>
    </div>
  );
}
