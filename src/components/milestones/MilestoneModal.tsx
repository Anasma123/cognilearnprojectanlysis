'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useApp } from '@/lib/context/AppContext';
import { MilestoneStatus, ProjectMilestone } from '@/lib/types';

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneToEdit?: ProjectMilestone | null;
}

export function MilestoneModal({ isOpen, onClose, milestoneToEdit }: MilestoneModalProps) {
  const { projects, students, addMilestone, updateMilestone, milestones } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_id: projects[0]?.id || '',
    assigned_student_id: students[0]?.id || '',
    start_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'pending' as MilestoneStatus,
    remarks: '',
    step_order: milestones.length + 1,
    is_custom: true
  });

  useEffect(() => {
    if (milestoneToEdit) {
      setFormData({
        name: milestoneToEdit.name,
        description: milestoneToEdit.description || '',
        project_id: milestoneToEdit.project_id,
        assigned_student_id: milestoneToEdit.assigned_student_id || '',
        start_date: milestoneToEdit.start_date || new Date().toISOString().split('T')[0],
        due_date: milestoneToEdit.due_date || new Date().toISOString().split('T')[0],
        status: milestoneToEdit.status,
        remarks: milestoneToEdit.remarks || '',
        step_order: milestoneToEdit.step_order,
        is_custom: milestoneToEdit.is_custom
      });
    } else {
      setFormData({
        name: '',
        description: '',
        project_id: projects[0]?.id || '',
        assigned_student_id: students[0]?.id || '',
        start_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        status: 'pending',
        remarks: '',
        step_order: milestones.length + 1,
        is_custom: true
      });
    }
  }, [milestoneToEdit, isOpen, projects, students, milestones]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please fill milestone name');
      return;
    }

    if (milestoneToEdit) {
      updateMilestone(milestoneToEdit.id, formData);
    } else {
      addMilestone(formData);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={milestoneToEdit ? 'Edit Milestone Phase' : 'Add Custom Project Milestone'}
      subtitle="Configure lifecycle step, assignee, and completion criteria"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Milestone Step Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            placeholder="e.g. Security Vulnerability Assessment & Pen Testing"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description & Acceptance Criteria
          </label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            placeholder="Key deliverables required for approval..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project *
            </label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.project_code} - {p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Step Lead Student
            </label>
            <select
              value={formData.assigned_student_id}
              onChange={(e) => setFormData({ ...formData, assigned_student_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="">-- Unassigned --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.student_reg_no})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              required
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Milestone Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as MilestoneStatus })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-medium"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="under_review">Under Review</option>
              <option value="completed">Completed & Approved</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Step Order
            </label>
            <input
              type="number"
              min={1}
              value={formData.step_order}
              onChange={(e) => setFormData({ ...formData, step_order: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Mentor Remarks & Sign-off Notes
          </label>
          <input
            type="text"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            placeholder="e.g. Approved with distinction by Prof. Priya Nair"
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
            {milestoneToEdit ? 'Save Milestone' : 'Add Milestone'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
