'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context/AppContext';
import { ShieldCheck, UserCog, Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useApp();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123');
  const [selectedRoleTab, setSelectedRoleTab] = useState<'admin' | 'staff'>('admin');
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
      setError('Invalid username or password! You can use Username: "admin" or "staff" with Password: "123"');
      setLoading(false);
    }
  };

  const handleFillAdmin = () => {
    setSelectedRoleTab('admin');
    setUsername('admin');
    setPassword('123');
    setError('');
  };

  const handleFillStaff = () => {
    setSelectedRoleTab('staff');
    setUsername('staff');
    setPassword('123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-7 sm:p-8 space-y-5 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-700 to-navy-900 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md">
            CL
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            COGNILEARN
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            MES College Academic Project Tracking & Monitoring System
          </p>
        </div>

        {/* Quick Credentials Selection Tabs */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
            Select Login Account (Same Admin Powers)
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Admin Fill Pill */}
            <button
              type="button"
              onClick={handleFillAdmin}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedRoleTab === 'admin'
                  ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  Admin
                </span>
                {selectedRoleTab === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
              </div>
              <div className="text-[11px] font-mono text-slate-600">
                User: <strong>admin</strong>
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Pass: <strong>123</strong>
              </div>
            </button>

            {/* Staff Fill Pill */}
            <button
              type="button"
              onClick={handleFillStaff}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedRoleTab === 'staff'
                  ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                  <UserCog className="w-4 h-4 text-indigo-700" />
                  Staff
                </span>
                {selectedRoleTab === 'staff' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
              </div>
              <div className="text-[11px] font-mono text-slate-600">
                User: <strong>staff</strong>
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Pass: <strong>123</strong>
              </div>
            </button>
          </div>

          <p className="text-[10px] text-center text-slate-500 italic">
            Staff coordinators have full admin control across students, groups, attendance & fees.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Username or Registered Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin or staff"
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
            className={`w-full py-3 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              selectedRoleTab === 'staff'
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <span>
              {loading
                ? 'Authenticating...'
                : selectedRoleTab === 'staff'
                ? 'Sign In as Staff Coordinator'
                : 'Sign In as Administrator'}
            </span>
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
