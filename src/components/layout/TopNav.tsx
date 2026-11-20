'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  Bell,
  Check,
  User,
  Shield,
  GraduationCap,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Users,
  FolderKanban,
  CreditCard,
  UserCog,
  CalendarDays,
  CalendarCheck2,
  ListTodo,
  Milestone,
  LineChart,
  FileBarChart,
  FileText,
  Settings,
  KeyRound
} from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import { ChangePasswordModal } from '../common/ChangePasswordModal';

interface TopNavProps {
  onToggleSidebar: () => void;
}

export function TopNav({ onToggleSidebar }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, switchRole, notifications, markAllNotificationsRead, logout } = useApp();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showChangePassModal, setShowChangePassModal] = useState(false);

  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const unreadNotifications = notifications.filter(n => !n.is_read);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const primaryNavItems = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Students', href: '/students', icon: GraduationCap },
    { title: 'Groups', href: '/groups', icon: Users },
    { title: 'Projects', href: '/projects', icon: FolderKanban },
    { title: 'Payments', href: '/payments', icon: CreditCard },
    { title: 'Attendance', href: '/attendance', icon: CalendarDays },
    { title: 'Tasks', href: '/tasks', icon: ListTodo },
    { title: 'Weekly Reports', href: '/weekly-progress', icon: CalendarCheck2 },
    { title: 'Staff', href: '/staff', icon: UserCog, adminOnly: true }
  ];

  const moreNavItems = [
    { title: '13 Milestones', href: '/milestones', icon: Milestone },
    { title: 'Analytics', href: '/analytics', icon: LineChart },
    { title: 'Reports & Export', href: '/reports', icon: FileBarChart },
    { title: 'Documents', href: '/documents', icon: FileText },
    { title: 'Settings & Supabase', href: '/settings', icon: Settings, adminOnly: true }
  ];

  const filteredPrimary = primaryNavItems.filter(item => !item.adminOnly || currentUser.role === 'admin' || currentUser.role === 'staff');
  const filteredMore = moreNavItems.filter(item => !item.adminOnly || currentUser.role === 'admin' || currentUser.role === 'staff');

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="w-full max-w-7xl mx-auto h-full px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Menu Drawer Toggle & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
            title="Open all modules menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
            <span className="hidden sm:inline text-xs font-semibold text-slate-700">Menu</span>
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-900 text-white font-black text-base flex items-center justify-center shadow-xs">
              CL
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tight text-slate-900 leading-none">
                COGNILEARN
              </span>
              <span className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase mt-0.5">
                MES College Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Top Horizontal Navigation Bar */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
          {filteredPrimary.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.title}</span>
              </Link>
            );
          })}

          {/* More Dropdown */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span>More</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showMoreMenu && (
              <div className="absolute left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                {filteredMore.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMoreMenu(false)}
                      className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors ${
                        isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right Actions: Role Switcher, Notifications, Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Role Switcher Pill */}
          <div className="relative" ref={roleMenuRef}>
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span className="uppercase text-blue-700 font-bold text-[11px]">{currentUser.role}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-1 border-b border-slate-100 text-[11px] text-slate-400 font-semibold">
                  Switch Perspective
                </div>
                <button
                  onClick={() => { switchRole('admin'); setShowRoleMenu(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer ${currentUser.role === 'admin' ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Administrator</span>
                  </div>
                  {currentUser.role === 'admin' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
                <button
                  onClick={() => { switchRole('staff'); setShowRoleMenu(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer ${currentUser.role === 'staff' ? 'font-bold text-indigo-600 bg-indigo-50/50' : 'text-slate-700'}`}
                >
                  <div className="flex items-center gap-2">
                    <UserCog className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Staff (Admin Powers)</span>
                  </div>
                  {currentUser.role === 'staff' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
                <button
                  onClick={() => { switchRole('mentor'); setShowRoleMenu(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer ${currentUser.role === 'mentor' ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span>Staff In-Charge</span>
                  </div>
                  {currentUser.role === 'mentor' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
                <button
                  onClick={() => { switchRole('student'); setShowRoleMenu(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer ${currentUser.role === 'student' ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'}`}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Student View</span>
                  </div>
                  {currentUser.role === 'student' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              </div>
            )}
          </div>

          {/* Notifications Popover */}
          <div className="relative" ref={notifMenuRef}>
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative focus:outline-none transition-colors border border-slate-200/80 cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in-50 zoom-in-95">
                <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900">Notifications</h3>
                    <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                      {unreadNotifications.length} new
                    </span>
                  </div>
                  {unreadNotifications.length > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead()}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <div key={n.id} className="p-3 text-xs hover:bg-slate-50 transition-colors">
                        <p className="font-bold text-slate-900">{n.title}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Change Password Button */}
          <button
            onClick={() => setShowChangePassModal(true)}
            title="Change Account Password"
            className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors border border-slate-200/80 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          {/* Quick Sign Out Button */}
          <button
            onClick={() => {
              logout();
              router.replace('/login');
            }}
            title="Sign Out"
            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors border border-rose-200/60 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassModal}
        onClose={() => setShowChangePassModal(false)}
      />
    </header>
  );
}
