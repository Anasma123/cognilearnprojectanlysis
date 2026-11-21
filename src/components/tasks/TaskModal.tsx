'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Task, TaskPriority, TaskStatus } from '@/lib/types';
import { useApp } from '@/lib/context/AppContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
}

export function TaskModal({ isOpen, onClose, taskToEdit }: TaskModalProps) {
  const { projects, groups, students, createTask, updateTask } = useApp();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: projects[0]?.id || '',
    group_id: groups[0]?.id || '',
    assigned_student_id: students[0]?.id || '',
    assigned_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    priority: 'medium' as TaskPriority,
    status: 'todo' as TaskStatus,
    completion_notes: ''
  });

  useEffect(() => {
    if (!isOpen) return;

    if (taskToEdit) {
      setFormData({
        title: taskToEdit.title,
        description: taskToEdit.description || '',
        project_id: taskToEdit.project_id,
        group_id: taskToEdit.group_id,
        assigned_student_id: taskToEdit.assigned_student_id || '',
        assigned_date: taskToEdit.assigned_date,
        due_date: taskToEdit.due_date,
        priority: taskToEdit.priority,
        status: taskToEdit.status,
        completion_notes: taskToEdit.completion_notes || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        project_id: projects[0]?.id || '',
        group_id: groups[0]?.id || '',
        assigned_student_id: students[0]?.id || '',
        assigned_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        priority: 'medium',
        status: 'todo',
        completion_notes: ''
      });
    }
  }, [taskToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.project_id) {
      alert('Please fill task title and select project');
      return;
    }

    if (taskToEdit) {
      updateTask(taskToEdit.id, formData);
    } else {
      createTask(formData);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Task Details' : 'Assign New Project Task'}
      subtitle="Track milestone work packages and student accountability"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Task Title *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            placeholder="e.g. Implement WebSocket reconnection exponential backoff"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Task Description
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            placeholder="Provide technical specifics, acceptance criteria, or API schemas..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Associated Project *
            </label>
            <select
              value={formData.project_id}
              onChange={(e) => {
                const prj = projects.find(p => p.id === e.target.value);
                setFormData({
                  ...formData,
                  project_id: e.target.value,
                  group_id: prj?.group_id || formData.group_id
                });
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.project_code} - {p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assignee (Student)
            </label>
            <select
              value={formData.assigned_student_id}
              onChange={(e) => setFormData({ ...formData, assigned_student_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white"
            >
              <option value="">-- Unassigned --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.assigned_role})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Priority Level *
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical (Blocking)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Task Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="under_review">Under Review</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Date
            </label>
            <input
              type="date"
              value={formData.assigned_date}
              onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
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
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Completion Notes / PR Link
          </label>
          <input
            type="text"
            value={formData.completion_notes}
            onChange={(e) => setFormData({ ...formData, completion_notes: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            placeholder="e.g. Merged in PR #42 with test suites passing"
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
            {taskToEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
