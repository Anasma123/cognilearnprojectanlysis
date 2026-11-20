'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { WeeklyReport } from '@/lib/types';
import { formatDateIndian, formatDateTimeIndian } from '@/lib/utils/formatters';
import { exportWeeklyReportsToExcel } from '@/lib/utils/exportExcel';
import { StatusBadge } from '@/components/common/StatusBadge';
import { WeeklyReportModal } from '@/components/weekly/WeeklyReportModal';
import { MentorReviewModal } from '@/components/weekly/MentorReviewModal';
import {
  CalendarCheck2,
  Plus,
  FileSpreadsheet,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Cpu,
  ChevronRight,
  UserCheck,
  Sparkles,
  Calendar
} from 'lucide-react';

export default function WeeklyProgressPage() {
  const { weeklyReports, groups, currentUser } = useApp();

  const [selectedGroupId, setSelectedGroupId] = useState('ALL');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [reportForReview, setReportForReview] = useState<WeeklyReport | null>(null);

  // Filter & sort chronological history (latest first or week order)
  const filteredReports = useMemo(() => {
    return weeklyReports
      .filter(w => selectedGroupId === 'ALL' || w.group_id === selectedGroupId)
      .sort((a, b) => b.week_number - a.week_number);
  }, [weeklyReports, selectedGroupId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wide">
              Core Application Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Weekly Progress Tracking & Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable chronological sprint history with student submissions and mentor review feedback.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportWeeklyReportsToExcel(filteredReports)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Submit Weekly Report
          </button>
        </div>
      </div>

      {/* Group Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Filter by Cohort:
          </span>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Project Groups ({weeklyReports.length} Reports)</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name} ({g.group_code})</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredReports.length} historical progress records (Strict immutability)
        </div>
      </div>

      {/* Chronological Weekly Progress Cards */}
      <div className="space-y-6">
        {filteredReports.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            No weekly reports filed yet for this group selection.
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden"
            >
              {/* Card Header Bar */}
              <div className="p-5 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                    W{report.week_number}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        Week {report.week_number} Progress Report
                      </h3>
                      <StatusBadge status={report.review_status} />
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Period: <strong className="text-slate-700">{formatDateIndian(report.start_date)} to {formatDateIndian(report.end_date)}</strong>
                      <span>•</span>
                      <span>Group: <strong className="text-blue-700">{report.group?.group_code}</strong></span>
                    </p>
                  </div>
                </div>

                {/* Mentor Review Action Button */}
                <div className="flex items-center gap-2">
                  {(currentUser.role === 'admin' || currentUser.role === 'staff' || currentUser.role === 'mentor') && (
                    <button
                      onClick={() => setReportForReview(report)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Review & Feedback
                    </button>
                  )}
                </div>
              </div>

              {/* Card Content Grid */}
              <div className="p-6 space-y-5">
                {/* 1. Activities Completed */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Key Activities & Deliverables Completed
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/60">
                    {report.activities_completed}
                  </p>
                </div>

                {/* 2. Tasks Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <span className="font-bold text-emerald-900 block mb-1">Tasks Completed:</span>
                    <p className="text-emerald-800 leading-relaxed">{report.tasks_completed}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                    <span className="font-bold text-blue-900 block mb-1">Tasks In Progress:</span>
                    <p className="text-blue-800 leading-relaxed">{report.tasks_in_progress || 'None'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">Tasks Pending:</span>
                    <p className="text-slate-700 leading-relaxed">{report.tasks_pending || 'None'}</p>
                  </div>
                </div>

                {/* 3. Problems & Solutions */}
                {(report.problems_faced || report.solutions_implemented) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-100">
                      <span className="font-bold text-rose-900 block mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Problems Encountered / Blockers:
                      </span>
                      <p className="text-rose-800 leading-relaxed">{report.problems_faced || 'None'}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-100">
                      <span className="font-bold text-teal-900 block mb-1 flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5 text-teal-600" />
                        Solutions & Architectural Workarounds:
                      </span>
                      <p className="text-teal-800 leading-relaxed">{report.solutions_implemented || 'Under investigation'}</p>
                    </div>
                  </div>
                )}

                {/* 4. Technologies & Next Week Plan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">Technologies Utilized:</span>
                    <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-mono text-[11px] inline-block">
                      {report.technologies_used || 'General engineering stack'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">Next Week Plan:</span>
                    <p className="text-slate-800 font-medium">{report.next_week_plan}</p>
                  </div>
                </div>

                {/* 5. Mentor Feedback Box (Highlighted) */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-blue-700" />
                        <span className="text-xs font-bold text-blue-900">
                          Mentor Evaluation & Feedback
                        </span>
                      </div>
                      {report.reviewed_at && (
                        <span className="text-[11px] text-blue-600 font-medium">
                          Reviewed: {formatDateTimeIndian(report.reviewed_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-blue-950 font-medium leading-relaxed italic">
                      "{report.mentor_feedback || 'Submission under evaluation by project mentor.'}"
                    </p>
                  </div>
                </div>

                {/* Footer Submitter Signature */}
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Submitted by: <strong className="text-slate-700">{report.submitter?.full_name || 'Team Lead'}</strong></span>
                  <span>Timestamp: {formatDateTimeIndian(report.submitted_at)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Submit Weekly Report Modal */}
      <WeeklyReportModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
      />

      {/* Mentor Review Modal */}
      {reportForReview && (
        <MentorReviewModal
          isOpen={true}
          onClose={() => setReportForReview(null)}
          report={reportForReview}
        />
      )}
    </div>
  );
}
