'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/AppContext';
import { formatDateTimeIndian, formatDateIndian } from '@/lib/utils/formatters';
import { StatusBadge } from '../common/StatusBadge';
import { Clock, Calendar, CheckCircle, AlertCircle, ArrowUpRight } from 'lucide-react';

export function ActivityAndDeadlines() {
  const { activityLogs, tasks, weeklyReports } = useApp();

  // Upcoming deadlines sorted
  const upcomingTasks = [...tasks]
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 4);

  // Latest weekly reports
  const latestSubmissions = [...weeklyReports]
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Audit Activity Log */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Activity Trail</h3>
            <p className="text-xs text-slate-500">Live system audit events</p>
          </div>
          <Link href="/audit-logs" className="text-xs text-blue-600 hover:underline font-semibold">
            View All
          </Link>
        </div>

        <div className="space-y-4">
          {activityLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-slate-900 font-medium leading-snug">{log.description}</p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-600">{log.user_name || 'System'}</span>
                  <span>•</span>
                  <span>{formatDateTimeIndian(log.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Upcoming Deadlines */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Upcoming Deadlines</h3>
            <p className="text-xs text-slate-500">Approaching project targets & tasks</p>
          </div>
          <Link href="/tasks" className="text-xs text-blue-600 hover:underline font-semibold">
            All Tasks
          </Link>
        </div>

        <div className="space-y-3">
          {upcomingTasks.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No upcoming pending tasks</p>
          ) : (
            upcomingTasks.map((task) => {
              const isOverdue = new Date(task.due_date) < new Date();
              return (
                <div
                  key={task.id}
                  className={`p-3 rounded-xl border transition-colors ${
                    isOverdue ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">{task.title}</p>
                    <StatusBadge status={task.status} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px]">
                    <span className="text-slate-500 font-medium">
                      {task.assigned_student?.full_name || 'Unassigned'}
                    </span>
                    <span className={`font-semibold flex items-center gap-1 ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>
                      <Calendar className="w-3 h-3" />
                      Due {formatDateIndian(task.due_date)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Latest Weekly Submissions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Weekly Progress Feed</h3>
            <p className="text-xs text-slate-500">Latest submissions by student leads</p>
          </div>
          <Link href="/weekly-progress" className="text-xs text-blue-600 hover:underline font-semibold">
            Full Timeline
          </Link>
        </div>

        <div className="space-y-3">
          {latestSubmissions.map((report) => (
            <div key={report.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/50 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-slate-900">
                  Week {report.week_number} • {report.group?.group_code}
                </span>
                <StatusBadge status={report.review_status} />
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {report.activities_completed}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 text-[11px] text-slate-500">
                <span>By {report.submitter?.full_name || 'Team Lead'}</span>
                <span>{formatDateIndian(report.submitted_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
