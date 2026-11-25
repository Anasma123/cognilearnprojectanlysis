'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/AppContext';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  Settings,
  Database,
  Building2,
  BookOpen,
  Plus,
  Trash2,
  Server,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  FileBarChart
} from 'lucide-react';
import { ChangePasswordModal } from '@/components/common/ChangePasswordModal';

export default function SettingsPage() {
  const { currentUser, stats, colleges, courses, addCollege, deleteCollege, addCourse, deleteCourse } = useApp();
  const [showChangePassModal, setShowChangePassModal] = useState(false);

  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeCode, setNewCollegeCode] = useState('');

  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDept, setNewCourseDept] = useState('');
  const [courseCollegeId, setCourseCollegeId] = useState('');

  const handleAddCollege = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollegeName.trim()) return;
    addCollege(newCollegeName.trim(), newCollegeCode.trim() || undefined);
    setNewCollegeName('');
    setNewCollegeCode('');
  };

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;
    addCourse(newCourseName.trim(), newCourseDept.trim() || newCourseName.trim(), courseCollegeId || undefined);
    setNewCourseName('');
    setNewCourseDept('');
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto my-12 space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Only System Administrators have authorization to modify institutional college affiliations, departments, and system database settings.
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              Master Controls & Organization Setup
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Settings & Master Entity Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure affiliated colleges, departments, degree courses, and database storage.
          </p>
        </div>
      </div>

      {/* College & Department Master Managers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* College Manager */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Affiliated Colleges ({colleges.length})</h3>
            </div>
            <span className="text-[11px] text-slate-400">Admin Configurable</span>
          </div>

          <form onSubmit={handleAddCollege} className="flex gap-2">
            <input
              type="text"
              required
              value={newCollegeName}
              onChange={(e) => setNewCollegeName(e.target.value)}
              placeholder="College Name..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            <input
              type="text"
              value={newCollegeCode}
              onChange={(e) => setNewCollegeCode(e.target.value)}
              placeholder="Code (e.g. MES)"
              className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </form>

          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {colleges.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No colleges added yet. Use the input above to add your first college.
              </div>
            ) : (
              colleges.map((col) => (
                <div key={col.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-900">{col.name}</span>
                    <span className="ml-2 font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                      {col.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href="/reports"
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="View Institutional Report & Print PDF"
                    >
                      <FileBarChart className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => deleteCollege(col.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      title="Delete College"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Course / Department Manager */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Departments & Courses ({courses.length})</h3>
            </div>
            <span className="text-[11px] text-slate-400">Admin Configurable</span>
          </div>

          <form onSubmit={handleAddCourse} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="Course/Degree Name (e.g. B.Tech Computer Science)"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </form>

          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {courses.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No courses or departments added yet. Add your first course above.
              </div>
            ) : (
              courses.map((crs) => (
                <div key={crs.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-900">{crs.name}</span>
                    <span className="text-slate-400 text-[11px] block">{crs.department}</span>
                  </div>
                  <button
                    onClick={() => deleteCourse(crs.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    title="Delete Course"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Connectivity & Environment Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supabase Status Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Supabase PostgreSQL Engine</h3>
                <p className="text-xs text-slate-500">Persistent Cloud Database & RLS</p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              isSupabaseConfigured
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {isSupabaseConfigured ? 'Connected (Live Supabase)' : 'Local Persistent Storage Mode'}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            The application contains full SQL migration files (`supabase/migrations/20240101000000_init_schema.sql`) and seed data (`supabase/seed.sql`).
            When `.env.local` is provided with credentials, Supabase client connects automatically.
          </p>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs space-y-1.5 text-slate-700">
            <div><span className="text-slate-400">Timezone:</span> Asia/Kolkata (IST +05:30)</div>
            <div><span className="text-slate-400">Date Format:</span> DD-MM-YYYY (Indian Standard)</div>
            <div><span className="text-slate-400">Storage Engine:</span> HTML5 Persistent Client Layer + Supabase Ready</div>
          </div>
        </div>

        {/* Vercel Deployment Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Vercel Deployment Architecture</h3>
                <p className="text-xs text-slate-500">Edge & Serverless Compatible</p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              100% Vercel Ready
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Next.js 14 App Router + Server Actions</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>No persistent local file storage dependency</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>SheetJS Excel & jsPDF client/server generation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Security & Password Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Account Security & Credentials</h3>
            <p className="text-xs text-slate-500">
              Update login password for {currentUser.full_name} ({currentUser.role.toUpperCase()})
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowChangePassModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5" />
          Change Password
        </button>
      </div>

      <ChangePasswordModal
        isOpen={showChangePassModal}
        onClose={() => setShowChangePassModal(false)}
      />
    </div>
  );
}
