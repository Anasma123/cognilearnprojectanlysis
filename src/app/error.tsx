'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Cognilearn Application Error caught by boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            System Notice
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            A temporary display exception occurred while loading this view. Your saved records are secure.
          </p>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left">
          <p className="text-[11px] font-mono text-slate-700 break-words">
            {error?.message || 'Unexpected application render exception.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload View
          </button>

          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/dashboard';
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
