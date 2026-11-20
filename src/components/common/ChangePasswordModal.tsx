'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUsername?: string;
}

export function ChangePasswordModal({ isOpen, onClose, defaultUsername }: ChangePasswordModalProps) {
  const { currentUser, changePassword } = useApp();

  const [username, setUsername] = useState(defaultUsername || currentUser.email || currentUser.role || 'admin');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 3) {
      setError('New password must be at least 3 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);

    const result = changePassword(currentPassword, newPassword, username);

    setLoading(false);

    if (result.success) {
      setSuccess(result.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1500);
    } else {
      setError(result.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setError('');
        setSuccess('');
        onClose();
      }}
      title="Change Account Password"
      subtitle="Update login credentials for your Cognilearn portal account"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Username field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Account Username / Role
          </label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin or staff"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        {/* Current Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Current Password *
          </label>
          <div className="relative">
            <input
              type={showCurrentPass ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password (default is 123)"
              className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPass(!showCurrentPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            New Password *
          </label>
          <div className="relative">
            <input
              type={showNewPass ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            <button
              type="button"
              onClick={() => setShowNewPass(!showNewPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Confirm New Password *
          </label>
          <div className="relative">
            <input
              type={showConfirmPass ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{loading ? 'Updating...' : 'Update Password'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
