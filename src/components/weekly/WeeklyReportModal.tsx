'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useApp } from '@/lib/context/AppContext';
import { WeeklyReviewStatus } from '@/lib/types';

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WeeklyReportModal({ isOpen, onClose }: WeeklyReportModalProps) {
  const { currentUser, groups, projects, submitWeeklyReport, weeklyReports } = useApp();

  // Find next suggested week number
  const latestWeek = weeklyReports.length > 0 
    ? Math.max(...weeklyReports.map(w => w.week_number)) 
    : 0;

  const [formData, setFormData] = useState({
    group_id: groups[0]?.id || '',
    project_id: projects[0]?.id || '',
    week_number: latestWeek + 1,
    start_date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    activities_completed: '',
    tasks_completed: '',
    tasks_in_progress: '',
    tasks_pending: '',
    problems_faced: '',
    solutions_implemented: '',
    technologies_used: '',
    next_week_plan: '',
    student_remarks: '',
    submitted_by: currentUser.id,
    submitted_at: new Date().toISOString(),
    review_status: 'submitted' as WeeklyReviewStatus
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activities_completed || !formData.next_week_plan) {
      alert('Please fill activities completed and next week plan');
      return;
    }

    const prj = projects.find(p => p.group_id === formData.group_id);

    submitWeeklyReport({
      ...formData,
      project_id: prj?.id || formData.project_id,
      submitted_by: currentUser.id,
      submitted_at: new Date().toISOString()
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Submit Week ${formData.week_number} Progress Report`}
      subtitle="Immutable historical audit record of group accomplishments and challenges"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Group *
            </label>
            <select
              value={formData.group_id}
              onChange={(e) => {
                const grp = groups.find(g => g.id === e.target.value);
                const prj = projects.find(p => p.group_id === e.target.value);
                setFormData({
                  ...formData,
                  group_id: e.target.value,
                  project_id: prj?.id || formData.project_id
                });
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.group_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Week Number *
            </label>
            <input
              type="number"
              min={1}
              required
              value={formData.week_number}
              onChange={(e) => setFormData({ ...formData, week_number: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Week Period *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-1/2 px-2 py-2 border border-slate-200 rounded-lg text-xs"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-1/2 px-2 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Activities Completed This Week *
          </label>
          <textarea
            rows={3}
            required
            value={formData.activities_completed}
            onChange={(e) => setFormData({ ...formData, activities_completed: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            placeholder="Detailed description of development work, experiments conducted, or features completed..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tasks Completed *
            </label>
            <textarea
              rows={2}
              required
              value={formData.tasks_completed}
              onChange={(e) => setFormData({ ...formData, tasks_completed: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              placeholder="e.g. Auth endpoints, Database migration, Responsive layout"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tasks In Progress
            </label>
            <textarea
              rows={2}
              value={formData.tasks_in_progress}
              onChange={(e) => setFormData({ ...formData, tasks_in_progress: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              placeholder="Work currently being written..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tasks Pending
            </label>
            <textarea
              rows={2}
              value={formData.tasks_pending}
              onChange={(e) => setFormData({ ...formData, tasks_pending: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              placeholder="Dependencies or queued tasks..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Problems Faced / Blockers
            </label>
            <textarea
              rows={2}
              value={formData.problems_faced}
              onChange={(e) => setFormData({ ...formData, problems_faced: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              placeholder="Technical challenges, hardware bottlenecks, library issues..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Solutions Implemented
            </label>
            <textarea
              rows={2}
              value={formData.solutions_implemented}
              onChange={(e) => setFormData({ ...formData, solutions_implemented: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              placeholder="How the team tackled or worked around the problem..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Technologies / Tools Utilized
            </label>
            <input
              type="text"
              value={formData.technologies_used}
              onChange={(e) => setFormData({ ...formData, technologies_used: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              placeholder="e.g. Next.js 14, Supabase RLS, WebRTC, Tailwind"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Next Week Deliverables & Sprint Plan *
            </label>
            <input
              type="text"
              required
              value={formData.next_week_plan}
              onChange={(e) => setFormData({ ...formData, next_week_plan: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              placeholder="Goals targeted for next weekly review..."
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Student Team Remarks
          </label>
          <input
            type="text"
            value={formData.student_remarks}
            onChange={(e) => setFormData({ ...formData, student_remarks: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            placeholder="Feedback to mentor, questions, or lab facility requests..."
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
            Submit Report For Review
          </button>
        </div>
      </form>
    </Modal>
  );
}
