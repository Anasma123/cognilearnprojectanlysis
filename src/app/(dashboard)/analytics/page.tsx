'use client';

import React from 'react';
import { useApp } from '@/lib/context/AppContext';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
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
import { LineChart, TrendingUp, Users, FolderKanban, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function AnalyticsPage() {
  const { projects, groups, tasks, attendance, evaluations, milestones } = useApp();

  // Task priority breakdown
  const criticalTasks = tasks.filter(t => t.priority === 'critical').length;
  const highTasks = tasks.filter(t => t.priority === 'high').length;
  const mediumTasks = tasks.filter(t => t.priority === 'medium').length;
  const lowTasks = tasks.filter(t => t.priority === 'low').length;

  const priorityData = [
    { name: 'Critical', count: criticalTasks, fill: '#ef4444' },
    { name: 'High', count: highTasks, fill: '#f59e0b' },
    { name: 'Medium', count: mediumTasks, fill: '#3b82f6' },
    { name: 'Low', count: lowTasks, fill: '#10b981' }
  ];

  // Verified Lifecycle Phases breakdown across projects
  let verifiedPlanning = 0;
  let verifiedDesign = 0;
  let verifiedDevelopment = 0;
  let verifiedTesting = 0;

  projects.forEach(p => {
    if (p.lifecycle_phases?.planning) verifiedPlanning++;
    if (p.lifecycle_phases?.design) verifiedDesign++;
    if (p.lifecycle_phases?.development) verifiedDevelopment++;
    if (p.lifecycle_phases?.testing) verifiedTesting++;
  });

  const lifecycleData = [
    { name: 'Planning Verified', value: verifiedPlanning, color: '#3b82f6' },
    { name: 'Design Verified', value: verifiedDesign, color: '#a855f7' },
    { name: 'Development Verified', value: verifiedDevelopment, color: '#10b981' },
    { name: 'Testing Verified', value: verifiedTesting, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              Performance Intelligence
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Academic Project Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Objective metrics derived from milestones, sprint tasks, attendance records, and mentor evaluations.
          </p>
        </div>
      </div>

      {/* Primary Charts */}
      <AnalyticsCharts />

      {/* Secondary Charts: Priority Queue & Milestone Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Priority Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Task Priority Distribution</h3>
            <p className="text-xs text-slate-500">Breakdown of work packages by urgency</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lifecycle Phase Verification Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Lifecycle Phase Completion</h3>
            <p className="text-xs text-slate-500">Distribution across Planning, Design, Development & Testing verification</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {lifecycleData.length === 0 ? (
              <p className="text-xs text-slate-400">No verified lifecycle phases recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lifecycleData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {lifecycleData.map((entry, index) => (
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
    </div>
  );
}
