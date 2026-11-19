'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { formatDateTimeIndian } from '@/lib/utils/formatters';
import { ShieldCheck, Search, Filter, History, Clock, User } from 'lucide-react';

export default function AuditLogsPage() {
  const { activityLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('ALL');

  const filteredLogs = activityLogs.filter(l => {
    const matchSearch =
      l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchEntity = selectedEntity === 'ALL' || l.entity_type === selectedEntity;
    return matchSearch && matchEntity;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              Security & Compliance Audit
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            System Activity History & Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cryptographically timestamped ledger of administrative actions, attendance submissions, and reviews.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by description, user name, or action tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
          />
        </div>

        <select
          value={selectedEntity}
          onChange={(e) => setSelectedEntity(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
        >
          <option value="ALL">All Event Types</option>
          <option value="student">Student Operations</option>
          <option value="group">Group Operations</option>
          <option value="project">Project Updates</option>
          <option value="milestone">Milestones</option>
          <option value="task">Tasks</option>
          <option value="weekly_report">Weekly Progress</option>
          <option value="attendance">Attendance</option>
          <option value="document">Documents</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Timestamp (IST)</th>
                <th className="py-3.5 px-4">Operator</th>
                <th className="py-3.5 px-4">Action Code</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Operation Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No matching audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatDateTimeIndian(log.created_at)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {log.user_name || 'System Operator'}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase text-slate-500 font-semibold text-[11px]">
                      {log.entity_type}
                    </td>
                    <td className="py-3 px-4 text-slate-800 leading-relaxed font-medium">
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
