'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/AppContext';
import { StatCards } from '@/components/dashboard/StatCards';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { ActivityAndDeadlines } from '@/components/dashboard/ActivityAndDeadlines';
import { StudentModal } from '@/components/students/StudentModal';
import { GroupModal } from '@/components/groups/GroupModal';
import { TaskModal } from '@/components/tasks/TaskModal';
import { AttendanceMarkerModal } from '@/components/attendance/AttendanceMarkerModal';
import { WeeklyReportModal } from '@/components/weekly/WeeklyReportModal';
import {
  Plus,
  CalendarCheck,
  FileBarChart,
  CalendarDays,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Clock
} from 'lucide-react';
import { formatDateIndian } from '@/lib/utils/formatters';
import { StatusBadge } from '@/components/common/StatusBadge';

export default function DashboardPage() {
  const { currentUser, stats, projects, groups, tasks, weeklyReports, attendance } = useApp();

  // Modals state
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);

  // Student perspective data
  const myStudentGroup = groups.find(g => g.group_leader_id === currentUser.id || g.members?.some(m => m.id === currentUser.id)) || groups[0];
  const myStudentProject = projects.find(p => p.group_id === myStudentGroup?.id);
  const myTasks = tasks.filter(t => t.assigned_student?.profile_id === currentUser.id || t.assigned_student_id === 's1111111-1111-1111-1111-111111111111');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold tracking-wide uppercase">
              {currentUser.role} Perspective
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              Academic Session 2024-2025
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome back, {currentUser.full_name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cognilearn Academic Project Tracking & Performance Monitoring System.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {currentUser.role === 'admin' && (
            <>
              <button
                onClick={() => setShowAttendanceModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
              >
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
                Mark Attendance
              </button>
              <button
                onClick={() => setShowStudentModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                Enroll Student
              </button>
              <button
                onClick={() => setShowTaskModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Assign Task
              </button>
            </>
          )}

          {currentUser.role === 'mentor' && (
            <>
              <Link
                href="/weekly-progress"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Clock className="w-4 h-4" />
                Review Weekly Reports ({stats.weeklyUpdatesPendingReview})
              </Link>
              <button
                onClick={() => setShowTaskModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                Assign Task
              </button>
            </>
          )}

          {currentUser.role === 'student' && (
            <>
              <button
                onClick={() => setShowWeeklyModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Submit Weekly Progress
              </button>
              <Link
                href="/tasks"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
              >
                My Tasks ({myTasks.length})
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <StatCards />

      {/* STUDENT SPECIFIC HIGHLIGHT BANNER */}
      {currentUser.role === 'student' && myStudentGroup && myStudentProject && (
        <div className="bg-gradient-to-r from-navy-900 to-blue-900 text-white p-6 rounded-2xl shadow-md border border-navy-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-1 rounded bg-blue-800/80 text-blue-200 text-xs font-bold uppercase tracking-wider">
                My Assigned Group: {myStudentGroup.group_code}
              </span>
              <h2 className="text-xl font-bold mt-2 text-white">
                {myStudentProject.title}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {myStudentProject.description}
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-300">
                <span>Mentor: <strong className="text-white">{myStudentGroup.mentor?.full_name || 'Assigned Mentor'}</strong></span>
                <span>•</span>
                <span>Role: <strong className="text-emerald-400">Team Leader / Full-Stack</strong></span>
              </div>
            </div>

            <div className="bg-navy-950/60 p-4 rounded-xl border border-navy-700 text-center min-w-[160px]">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Overall Progress</span>
              <p className="text-3xl font-black text-emerald-400 mt-1">{myStudentProject.progress_percentage}%</p>
              <div className="w-full bg-navy-800 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${myStudentProject.progress_percentage}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      <AnalyticsCharts />

      {/* Audit Log, Deadlines & Feed */}
      <ActivityAndDeadlines />

      {/* Modals */}
      <StudentModal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
      />
      <GroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
      />
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
      />
      <AttendanceMarkerModal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
      />
      <WeeklyReportModal
        isOpen={showWeeklyModal}
        onClose={() => setShowWeeklyModal(false)}
      />
    </div>
  );
}
