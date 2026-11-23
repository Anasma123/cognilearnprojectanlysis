'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Task, TaskPriority, TaskStatus } from '@/lib/types';
import { useApp } from '@/lib/context/AppContext';
import { Users, User, CheckCircle2 } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
}

export function TaskModal({ isOpen, onClose, taskToEdit }: TaskModalProps) {
  const { projects, groups, students, createTask, updateTask } = useApp();

  const [targetMode, setTargetMode] = useState<'single' | 'all_groups'>('single');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    group_id: '',
    assigned_student_id: '', // Optional!
    assigned_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    priority: 'medium' as TaskPriority,
    status: 'todo' as TaskStatus,
    completion_notes: ''
  });

  useEffect(() => {
    if (!isOpen) return;

    if (taskToEdit) {
      setTargetMode('single');
      setFormData({
        title: taskToEdit.title,
        description: taskToEdit.description || '',
        project_id: taskToEdit.project_id || '',
        group_id: taskToEdit.group_id || '',
        assigned_student_id: taskToEdit.assigned_student_id || '',
        assigned_date: taskToEdit.assigned_date,
        due_date: taskToEdit.due_date,
        priority: taskToEdit.priority,
        status: taskToEdit.status,
        completion_notes: taskToEdit.completion_notes || ''
      });
    } else {
      const defaultGroup = groups[0];
      const matchedProject = projects.find(p => p.group_id === defaultGroup?.id) || projects[0];

      setTargetMode('single');
      setFormData({
        title: '',
        description: '',
        group_id: defaultGroup?.id || '',
        project_id: matchedProject?.id || '',
        assigned_student_id: '', // Unassigned by default (Group Task)
        assigned_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        priority: 'medium',
        status: 'todo',
        completion_notes: ''
      });
    }
  }, [taskToEdit, isOpen, groups, projects]);

  // Students belonging to the currently selected group
  const selectedGroup = groups.find(g => g.id === formData.group_id);
  const groupStudents = students.filter(s => 
    s.group_id === formData.group_id || (selectedGroup?.member_ids && selectedGroup.member_ids.includes(s.id))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Please fill task title');
      return;
    }

    if (taskToEdit) {
      updateTask(taskToEdit.id, {
        ...formData,
        assigned_student_id: formData.assigned_student_id || undefined
      });
      onClose();
      return;
    }

    // Bulk Assignment to ALL Groups
    if (targetMode === 'all_groups') {
      if (groups.length === 0) {
        alert('No active groups found to assign tasks to.');
        return;
      }

      const tasksToCreate = groups.map(g => {
        const prj = projects.find(p => p.group_id === g.id);
        return {
          title: formData.title,
          description: formData.description,
          group_id: g.id,
          project_id: prj?.id || projects[0]?.id || '',
          assigned_student_id: undefined, // Entire group task
          assigned_date: formData.assigned_date,
          due_date: formData.due_date,
          priority: formData.priority,
          status: formData.status,
          completion_notes: formData.completion_notes
        };
      });

      createTask(tasksToCreate);
      onClose();
      return;
    }

    // Single Group Task Assignment
    const prj = projects.find(p => p.group_id === formData.group_id) || projects.find(p => p.id === formData.project_id) || projects[0];
    createTask({
      title: formData.title,
      description: formData.description,
      group_id: formData.group_id,
      project_id: prj?.id || formData.project_id,
      assigned_student_id: formData.assigned_student_id || undefined,
      assigned_date: formData.assigned_date,
      due_date: formData.due_date,
      priority: formData.priority,
      status: formData.status,
      completion_notes: formData.completion_notes
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Task Details' : 'Assign New Project Task'}
      subtitle="Group-oriented task distribution and individual accountability tracking"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Assignment Scope Selector (Only for new tasks) */}
        {!taskToEdit && (
          <div className="p-1 bg-slate-100 rounded-xl flex gap-1">
            <button
              type="button"
              onClick={() => setTargetMode('single')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                targetMode === 'single'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Single Group Task
            </button>
            <button
              type="button"
              onClick={() => setTargetMode('all_groups')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                targetMode === 'all_groups'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Assign to All Groups ({groups.length} Groups)
            </button>
          </div>
        )}

        {/* Bulk Assignment Notice */}
        {targetMode === 'all_groups' && !taskToEdit && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Simultaneous Cohort Broadcast</p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                This will automatically generate a separate, independent task for all <strong>{groups.length} active groups</strong> in the task list. Each group will track its own completion.
              </p>
            </div>
          </div>
        )}

        {/* Task Title */}
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
            placeholder="e.g. Submit Software Requirement Specification (SRS) Document"
          />
        </div>

        {/* Task Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Task Description
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            placeholder="Provide specific deliverables, acceptance criteria, or guidelines..."
          />
        </div>

        {/* Group & Assignee Selection (Hidden during bulk assign) */}
        {targetMode === 'single' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Project Group *
              </label>
              <select
                value={formData.group_id}
                onChange={(e) => {
                  const newGroupId = e.target.value;
                  const prj = projects.find(p => p.group_id === newGroupId);
                  setFormData({
                    ...formData,
                    group_id: newGroupId,
                    project_id: prj?.id || formData.project_id,
                    assigned_student_id: '' // Reset student selection when group changes
                  });
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white font-medium"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} {g.group_code ? `(${g.group_code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Assignee (Student)
                </label>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                  Optional
                </span>
              </div>
              <select
                value={formData.assigned_student_id}
                onChange={(e) => setFormData({ ...formData, assigned_student_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white"
              >
                <option value="">👥 Entire Group Task (No Specific Student)</option>
                {groupStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    👤 {s.full_name} ({s.assigned_role || 'Team Member'})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Leave unassigned to make it a shared group responsibility.
              </p>
            </div>
          </div>
        ) : null}

        {/* Priority & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            placeholder="e.g. Uploaded final SRS PDF or Git pull request"
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
            {taskToEdit
              ? 'Save Changes'
              : targetMode === 'all_groups'
              ? `Create Task for All ${groups.length} Groups`
              : 'Create Group Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
