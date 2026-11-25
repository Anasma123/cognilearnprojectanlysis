'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useApp } from '@/lib/context/AppContext';
import { calculateComputedProgress } from '@/lib/utils/formatters';

export function AnalyticsCharts() {
  const { projects, groups, milestones, tasks, attendance } = useApp();

  // 1. Group-wise progress comparison data
  const progressData = useMemo(() => {
    if (groups && groups.length > 0) {
      return groups.map(g => {
        const proj = projects.find(p => p && p.group_id === g.id) || g.project;
        const gMilestones = (milestones || []).filter(m => m && proj && m.project_id === proj.id);
        const gTasks = (tasks || []).filter(t => t && (t.group_id === g.id || (proj && t.project_id === proj.id)));
        const hasOpenTasks = gTasks.some(t => t && t.status !== 'completed');

        // Live calculation incorporating task priorities
        let progress: number;
        if (proj?.manual_progress_override === true && proj.progress_percentage !== undefined && !hasOpenTasks) {
          progress = proj.progress_percentage;
        } else {
          progress = calculateComputedProgress(
            gMilestones,
            gTasks,
            proj?.presentations,
            proj?.lifecycle_phases,
            (proj?.status === 'completed' && hasOpenTasks) ? 'in_progress' : (proj?.status || 'in_progress')
          );
        }

        const completedTasksCount = gTasks.filter(t => t.status === 'completed').length;
        const pendingHighCount = gTasks.filter(t => t.status !== 'completed' && (t.priority === 'high' || t.priority === 'critical')).length;
        const pendingLowMedCount = gTasks.filter(t => t.status !== 'completed' && (t.priority === 'low' || t.priority === 'medium')).length;

        let taskSummary = '';
        if (gTasks.length > 0) {
          taskSummary = `${gTasks.length} task${gTasks.length > 1 ? 's' : ''} (${completedTasksCount} done`;
          if (pendingHighCount > 0) {
            taskSummary += `, ${pendingHighCount} high-priority open)`;
          } else if (pendingLowMedCount > 0) {
            taskSummary += `, ${pendingLowMedCount} open)`;
          } else {
            taskSummary += `)`;
          }
        }

        return {
          name: g.group_code || g.name,
          title: proj?.title || g.project_title || g.name,
          progress: progress ?? 0,
          taskSummary
        };
      });
    }
    return (projects || []).map(p => {
      const grp = (groups || []).find(g => g && g.id === p.group_id);
      const pMilestones = (milestones || []).filter(m => m && m.project_id === p.id);
      const pTasks = (tasks || []).filter(t => t && (t.project_id === p.id || (p.group_id && t.group_id === p.group_id)));
      const hasOpenTasks = pTasks.some(t => t && t.status !== 'completed');

      let progress = (p.manual_progress_override === true && p.progress_percentage !== undefined && !hasOpenTasks)
        ? p.progress_percentage
        : calculateComputedProgress(
            pMilestones,
            pTasks,
            p.presentations,
            p.lifecycle_phases,
            (p.status === 'completed' && hasOpenTasks) ? 'in_progress' : (p.status || 'in_progress')
          );

      const completedTasksCount = pTasks.filter(t => t.status === 'completed').length;
      const pendingHighCount = pTasks.filter(t => t.status !== 'completed' && (t.priority === 'high' || t.priority === 'critical')).length;
      const pendingLowMedCount = pTasks.filter(t => t.status !== 'completed' && (t.priority === 'low' || t.priority === 'medium')).length;

      let taskSummary = '';
      if (pTasks.length > 0) {
        taskSummary = `${pTasks.length} task${pTasks.length > 1 ? 's' : ''} (${completedTasksCount} done`;
        if (pendingHighCount > 0) {
          taskSummary += `, ${pendingHighCount} high-priority open)`;
        } else if (pendingLowMedCount > 0) {
          taskSummary += `, ${pendingLowMedCount} open)`;
        } else {
          taskSummary += `)`;
        }
      }

      return {
        name: grp?.group_code || p.project_code || 'Project',
        title: p.title || 'Dissertation',
        progress: progress ?? 0,
        taskSummary
      };
    });
  }, [groups, projects, milestones, tasks]);

  const termAvg = useMemo(() => {
    if (progressData.length === 0) return 0;
    const total = progressData.reduce((acc, d) => acc + (d.progress || 0), 0);
    return Math.round(total / progressData.length);
  }, [progressData]);

  // 2. Attendance distribution data
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;
  const leaveCount = attendance.filter(a => a.status === 'leave').length;

  const attendancePieData = [
    { name: 'Present', value: presentCount, color: '#10b981' },
    { name: 'Late', value: lateCount, color: '#f59e0b' },
    { name: 'Absent', value: absentCount, color: '#ef4444' },
    { name: 'Approved Leave', value: leaveCount, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Project Progress Comparison */}
      <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Group Progress Comparison (%)</h3>
            <p className="text-xs text-slate-500">Calculated objectively from milestones & priority-weighted tasks</p>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
            Term Avg: {termAvg}%
          </span>
        </div>

        <div className="h-64 w-full flex items-center justify-center">
          {progressData.length === 0 ? (
            <p className="text-xs text-slate-400">No project groups created yet. Form a group to view progress metrics.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-navy-900 text-white p-3 rounded-lg text-xs shadow-lg">
                          <p className="font-bold">{data.name}</p>
                          <p className="text-slate-300 text-[11px] mb-1">{data.title}</p>
                          <p className="text-emerald-400 font-semibold">{data.progress}% Completed</p>
                          {data.taskSummary && (
                            <p className="text-slate-300 text-[10px] mt-1 pt-1 border-t border-slate-700/60">
                              📋 {data.taskSummary}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="progress" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Attendance Distribution */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="mb-2">
          <h3 className="text-sm font-bold text-slate-900">Attendance Distribution</h3>
          <p className="text-xs text-slate-500">Overall student presence telemetry</p>
        </div>

        <div className="h-64 w-full flex items-center justify-center">
          {attendancePieData.length === 0 ? (
            <p className="text-xs text-slate-400">No attendance marked yet. Mark daily lab roll to visualize telemetry.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendancePieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {attendancePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-slate-600 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
