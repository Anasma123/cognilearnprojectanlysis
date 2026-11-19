'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context/AppContext';
import { ShieldCheck, Lock, User, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useApp();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = login(username, password);

    if (success) {
      router.replace('/dashboard');
    } else {
      setError('Invalid username or password! Use Username: admin and Password: 123');
      setLoading(false);
    }
  };

  const handleFillAdmin = () => {
    setUsername('admin');
    setPassword('123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-navy-900 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md">
            CL
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            COGNILEARN
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            MES College Academic Project Tracking & Monitoring System
          </p>
        </div>

        {/* Credentials Pill */}
        <div
          onClick={handleFillAdmin}
          className="bg-blue-50/80 border border-blue-200 p-3.5 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-blue-100/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-700 flex-shrink-0" />
            <div className="text-left text-xs">
              <p className="font-bold text-blue-900">Admin Login Credentials</p>
              <p className="text-[11px] text-blue-700 font-mono mt-0.5">
                Username: <strong className="text-slate-900">admin</strong> | Password: <strong className="text-slate-900">123</strong>
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-blue-600 underline">Auto Fill</span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="123"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In as Admin'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 text-[11px] text-slate-400">
          Cognilearn Academic Office Portal • MES College Edition
        </div>
      </div>
    </div>
  );
}
