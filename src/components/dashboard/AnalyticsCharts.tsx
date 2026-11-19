'use client';

import React from 'react';
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

export function AnalyticsCharts() {
  const { projects, groups, attendance } = useApp();

  // 1. Group-wise progress comparison data
  const progressData = projects.map(p => {
    const grp = groups.find(g => g.id === p.group_id);
    return {
      name: grp?.group_code || p.project_code,
      title: p.title.length > 25 ? p.title.substring(0, 25) + '...' : p.title,
      progress: p.progress_percentage
    };
  });

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
            <p className="text-xs text-slate-500">Calculated objectively from completed milestone phases & tasks</p>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
            Term Avg: {Math.round(projects.reduce((acc, p) => acc + p.progress_percentage, 0) / (projects.length || 1))}%
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
