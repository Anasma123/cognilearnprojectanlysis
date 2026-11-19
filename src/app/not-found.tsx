'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600 font-black text-2xl">
          404
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Page Not Found
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            The requested section could not be found or has moved.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
