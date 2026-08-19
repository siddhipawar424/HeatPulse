import React from 'react';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

export function ErrorState({ errorMessage, onRetry }) {
  return (
    <div className="bg-gray-900/90 border border-red-500/30 rounded-2xl p-8 sm:p-12 shadow-2xl flex flex-col items-center justify-center text-center space-y-6">
      {/* Warning Icon Badge */}
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-inner">
        <AlertTriangle className="w-8 h-8 animate-bounce" />
      </div>

      {/* Primary Error Message */}
      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-bold text-white tracking-wide">
          Unable to Analyze Location
        </h3>
        <p className="text-xs text-red-300 font-mono bg-red-950/40 p-3 rounded-xl border border-red-900/50 break-words">
          {errorMessage || 'Failed to retrieve heat metrics from backend evaluation service.'}
        </p>
        <p className="text-xs text-gray-400">
          Please verify backend service status or try running analysis with another test polygon.
        </p>
      </div>

      {/* Try Again CTA */}
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-sm shadow-lg shadow-red-600/20 active:scale-95 transition"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Try Again</span>
      </button>
    </div>
  );
}
