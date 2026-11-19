'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { WeeklyReport, WeeklyReviewStatus } from '@/lib/types';
import { useApp } from '@/lib/context/AppContext';
import { formatDateIndian } from '@/lib/utils/formatters';

interface MentorReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: WeeklyReport;
}

export function MentorReviewModal({ isOpen, onClose, report }: MentorReviewModalProps) {
  const { reviewWeeklyReport } = useApp();
  const [feedback, setFeedback] = useState(report.mentor_feedback || '');
  const [status, setStatus] = useState<WeeklyReviewStatus>(
    report.review_status === 'submitted' ? 'approved' : report.review_status
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reviewWeeklyReport(report.id, feedback, status);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Mentor Review: Week ${report.week_number} Report`}
      subtitle={`Group: ${report.group?.name || 'Group'} | Submitted on ${formatDateIndian(report.submitted_at)}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick summary of what student submitted */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-2">
          <p className="font-semibold text-slate-800">Student Submission Summary:</p>
          <p className="text-slate-600"><span className="font-medium text-slate-700">Accomplishments:</span> {report.activities_completed}</p>
          {report.problems_faced && (
            <p className="text-slate-600"><span className="font-medium text-rose-700">Problems Faced:</span> {report.problems_faced}</p>
          )}
          <p className="text-slate-600"><span className="font-medium text-slate-700">Next Week Plan:</span> {report.next_week_plan}</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Review Status *
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as WeeklyReviewStatus)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white font-medium"
          >
            <option value="approved">Approved (Meets Quality Standards)</option>
            <option value="revision_required">Revision Required (Re-submission Needed)</option>
            <option value="under_review">Under Review / Clarifications Requested</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Mentor Feedback & Technical Guidance *
          </label>
          <textarea
            rows={4}
            required
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            placeholder="Provide constructive feedback, architectural recommendations, and encouragement..."
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            Save Mentor Feedback
          </button>
        </div>
      </form>
    </Modal>
  );
}
