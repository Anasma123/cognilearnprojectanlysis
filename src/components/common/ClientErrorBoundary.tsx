'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ClientErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ClientErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleResetCache = () => {
    if (typeof window !== 'undefined') {
      try {
        const auth = localStorage.getItem('cognilearn_auth');
        localStorage.clear();
        if (auth) {
          localStorage.setItem('cognilearn_auth', auth);
        }
      } catch (err) {
        console.warn('Failed clearing cache:', err);
      }
      window.location.href = '/dashboard';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-xs">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {this.props.fallbackTitle || 'Display Exception Recovered'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                The portal encountered a transient browser rendering issue. You can quickly reload or reset local state to continue.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left">
                <p className="text-[11px] font-mono text-slate-700 break-words line-clamp-3">
                  {this.state.error.message || 'Unknown render exception'}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleResetCache}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-xl border border-amber-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset & Recover
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
