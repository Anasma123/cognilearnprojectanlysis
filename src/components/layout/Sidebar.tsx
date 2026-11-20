'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  GraduationCap,
  ListTodo,
  Milestone,
  CalendarCheck2,
  CalendarDays,
  LineChart,
  CreditCard,
  UserCog,
  FileText,
  FileBarChart,
  Bell,
  Settings,
  ShieldCheck,
  LogOut,
  X
} from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import { RoleBadge } from '../common/RoleBadge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, stats, notifications, payments, staffMembers, logout } = useApp();
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const pendingPaymentsCount = payments.filter(p => p.status === 'unpaid' || p.status === 'partial').length;

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
      roles: ['admin', 'staff', 'mentor', 'student']
    },
    {
      title: 'Students',
      href: '/students',
      icon: GraduationCap,
      badge: stats.totalStudents,
      roles: ['admin', 'staff', 'mentor']
    },
    {
      title: 'Groups',
      href: '/groups',
      icon: Users,
      badge: stats.totalGroups,
      roles: ['admin', 'staff', 'mentor', 'student']
    },
    {
      title: 'Projects',
      href: '/projects',
      icon: FolderKanban,
      badge: stats.totalActiveProjects,
      roles: ['admin', 'staff', 'mentor', 'student']
    },
    {
      title: 'Payments',
      href: '/payments',
      icon: CreditCard,
      badge: pendingPaymentsCount > 0 ? `${pendingPaymentsCount} Due` : 'All Paid',
      badgeAlert: pendingPaymentsCount > 0,
      roles: ['admin', 'staff', 'mentor', 'student']
    },
    {
      title: 'Staff & Admins',
      href: '/staff',
      icon: UserCog,
      badge: staffMembers.length,
      roles: ['admin', 'staff']
    },
    {
      title: 'Tasks',
      href: '/tasks',
      icon: ListTodo,
      badge: stats.pendingTasks > 0 ? `${stats.pendingTasks}` : null,
      badgeAlert: stats.overdueTasks > 0,
      roles: ['admin', 'staff', 'mentor', 'student']
    },
    {
      title: 'Milestones',
      href: '/milestones',
      icon: Milestone,
      badge: null,
      roles: ['admin', 'staff', 'mentor', 'student']
    },
    {
      title: 'Weekly Progress',
      href: '/weekly-progress',
      icon: CalendarCheck2,
      badge: stats.weeklyUpdatesPendingReview > 0 ? `${stats.weeklyUpdatesPendingReview} pending` : null,
      badgeAlert: stats.weeklyUpdatesPendingReview > 0,
      roles: ['admin', 'staff', 'mentor', 'student']
    },
    {
      title: 'Attendance',
      href: '/attendance',
      icon: CalendarDays,
      badge: `${stats.overallAttendancePercentage}%`,
      roles: ['admin', 'staff', 'mentor', 'student']
    },
    {
      title: 'Analytics',
      href: '/analytics',
      icon: LineChart,
      badge: null,
      roles: ['admin', 'staff', 'mentor']
    },
    {
      title: 'Documents',
      href: '/documents',
      icon: FileText,
      badge: null,
      roles: ['admin', 'staff', 'mentor', 'student']
    },
    {
      title: 'Reports',
      href: '/reports',
      icon: FileBarChart,
      badge: null,
      roles: ['admin', 'staff', 'mentor']
    },
    {
      title: 'Notifications',
      href: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? `${unreadCount}` : null,
      badgeAlert: unreadCount > 0,
      roles: ['admin', 'staff', 'mentor', 'student']
    },
    {
      title: 'Settings & Database',
      href: '/settings',
      icon: Settings,
      badge: null,
      roles: ['admin', 'staff']
    }
  ];

  const currentRole = currentUser?.role || 'admin';
  const filteredNav = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <>
      {/* Backdrop overlay when open - clicking it closes sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Sidebar Drawer - Not fixed/permanent, only opens when requested */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-80 bg-slate-900 text-white flex flex-col border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* Organization Brand Header with Close Button */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="Cognilearn Logo"
              className="w-10 h-10 rounded-xl object-contain bg-white shadow-md border border-slate-700/60 p-0.5"
            />
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
                COGNILEARN
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </span>
              <span className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">
                MES College Portal
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Role Header */}
        <div className="px-5 py-3 bg-slate-950/30 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-300 font-medium">Logged in Role:</span>
          </div>
          <RoleBadge role={currentUser.role} />
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 px-3 mb-2">
            All Workspace Modules
          </div>

          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />
                  <span>{item.title}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      item.badgeAlert
                        ? 'bg-rose-500 text-white animate-pulse'
                        : isActive
                        ? 'bg-blue-800 text-blue-100'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Organization Project Info & Logout Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 hover:text-rose-200 border border-rose-500/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
