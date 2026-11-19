'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/AppContext';
import { formatDateTimeIndian } from '@/lib/utils/formatters';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  MessageSquare,
  Calendar,
  AlertTriangle,
  FolderKanban
} from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              In-App Notification Dispatcher
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            System Notifications & Reminders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Automated alerts for pending weekly reports, upcoming milestone deadlines, and mentor feedback.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" />
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No notifications in your inbox.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationRead(notif.id)}
              className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors cursor-pointer ${
                !notif.is_read ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-2.5 rounded-xl flex-shrink-0 ${
                    !notif.is_read ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm ${!notif.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                      {notif.title}
                    </h3>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
                    {notif.message}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDateTimeIndian(notif.created_at)}
                  </p>
                </div>
              </div>

              {notif.link && (
                <Link
                  href={notif.link}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-blue-600 hover:bg-slate-50 self-start sm:self-center"
                >
                  <span>Go to Module</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
