'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context/AppContext';
import { Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, KeyRound } from 'lucide-react';
import { ChangePasswordModal } from '@/components/common/ChangePasswordModal';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChangePassModal, setShowChangePassModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter both your username and password.');
      return;
    }

    setLoading(true);

    const success = login(username, password);

    if (success) {
      router.replace('/dashboard');
    } else {
      setError('Invalid username or password. Please try again or use the change password option.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-900 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md">
            CL
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            COGNILEARN
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            MES College Academic Project Tracking & Monitoring System
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Clean Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Username or Email Address
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username or email"
                autoComplete="username"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowChangePassModal(true)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                Change password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Change Password Quick Trigger */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setShowChangePassModal(true)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors font-medium cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Need to change or reset your password?</span>
          </button>
        </div>

        <div className="text-center pt-2 border-t border-slate-100 text-[11px] text-slate-400">
          Cognilearn Academic Office Portal • MES College Edition
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassModal}
        onClose={() => setShowChangePassModal(false)}
        defaultUsername={username || 'admin'}
      />
    </div>
  );
}
