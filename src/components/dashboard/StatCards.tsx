'use client';

import React from 'react';
import {
  Users,
  FolderKanban,
  GraduationCap,
  CalendarCheck,
  CalendarX,
  ListTodo,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Hourglass,
  Percent,
  IndianRupee
} from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import { formatCurrencyIndian } from '@/lib/utils/formatters';

export function StatCards() {
  const { stats, payments } = useApp();

  const totalCollected = payments.reduce((acc, p) => acc + (p.paid_amount || 0), 0);
  const totalAssessed = payments.reduce((acc, p) => acc + (p.total_fee || 0), 0);
  const pendingCount = payments.filter(p => p.status !== 'paid').length;

  const cards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      subtitle: '',
      icon: GraduationCap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100'
    },
    {
      title: 'Active Groups',
      value: stats.totalGroups,
      subtitle: 'Cohort Teams',
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100'
    },
    {
      title: 'Active Projects',
      value: stats.totalActiveProjects,
      subtitle: `${stats.completedProjects} Completed`,
      icon: FolderKanban,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100'
    },
    {
      title: 'Fee Collection',
      value: formatCurrencyIndian(totalCollected),
      subtitle: `${pendingCount} Student Balances Pending`,
      icon: IndianRupee,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100'
    },
    {
      title: 'Overall Attendance',
      value: `${stats.overallAttendancePercentage}%`,
      subtitle: 'Academic Lab Metric',
      icon: Percent,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-100'
    },
    {
      title: "Today's Present",
      value: stats.todayPresentCount,
      subtitle: `${stats.todayAbsentCount} Absent Today`,
      icon: CalendarCheck,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-100'
    },
    {
      title: 'Weekly Reviews Due',
      value: stats.weeklyUpdatesPendingReview,
      subtitle: 'Pending Staff Sign-off',
      icon: Clock,
      color: stats.weeklyUpdatesPendingReview > 0 ? 'text-amber-600' : 'text-slate-600',
      bgColor: stats.weeklyUpdatesPendingReview > 0 ? 'bg-amber-50' : 'bg-slate-50',
      borderColor: stats.weeklyUpdatesPendingReview > 0 ? 'border-amber-200' : 'border-slate-100',
      alert: stats.weeklyUpdatesPendingReview > 0
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      subtitle: `${stats.overdueTasks} Overdue Tasks`,
      icon: ListTodo,
      color: stats.overdueTasks > 0 ? 'text-rose-600' : 'text-slate-600',
      bgColor: stats.overdueTasks > 0 ? 'bg-rose-50' : 'bg-slate-50',
      borderColor: stats.overdueTasks > 0 ? 'border-rose-200' : 'border-slate-100',
      alert: stats.overdueTasks > 0
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl bg-white border ${card.borderColor} shadow-xs hover:shadow-md transition-shadow relative overflow-hidden`}
          >
            {card.alert && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {card.value}
              </span>
            </div>
            {card.subtitle ? (
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                {card.subtitle}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
