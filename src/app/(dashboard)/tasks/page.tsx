'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { Task, TaskPriority, TaskStatus } from '@/lib/types';
import { formatDateIndian } from '@/lib/utils/formatters';
import { exportTasksToExcel } from '@/lib/utils/exportExcel';
import { StatusBadge } from '@/components/common/StatusBadge';
import { TaskModal } from '@/components/tasks/TaskModal';
import { Modal } from '@/components/ui/Modal';
import {
  ListTodo,
  Kanban,
  ListFilter,
  Plus,
  FileSpreadsheet,
  Search,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Edit,
  Trash2,
  ArrowRight
} from 'lucide-react';

const KANBAN_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'border-slate-300' },
  { id: 'in_progress', label: 'In Progress', color: 'border-blue-400' },
  { id: 'under_review', label: 'Under Review', color: 'border-purple-400' },
  { id: 'completed', label: 'Completed', color: 'border-emerald-400' },
  { id: 'blocked', label: 'Blocked', color: 'border-amber-400' },
  { id: 'overdue', label: 'Overdue', color: 'border-rose-400' }
];

export default function TasksPage() {
  const { tasks, projects, students, updateTask, deleteTask, currentUser } = useApp();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState('ALL');

  const [showAddModal, setShowAddModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Auto-detect overdue tasks
  const enrichedTasks = useMemo(() => {
    return tasks.map(t => {
      const isPastDue = t.status !== 'completed' && new Date(t.due_date) < new Date();
      return {
        ...t,
        status: isPastDue && t.status !== 'overdue' ? ('overdue' as TaskStatus) : t.status
      };
    });
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return enrichedTasks.filter(t => {
      const matchSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchProject = selectedProject === 'ALL' || t.project_id === selectedProject;
      const matchPriority = selectedPriority === 'ALL' || t.priority === selectedPriority;
      const matchAssignee = selectedAssignee === 'ALL' || t.assigned_student_id === selectedAssignee;

      return matchSearch && matchProject && matchPriority && matchAssignee;
    });
  }, [enrichedTasks, searchTerm, selectedProject, selectedPriority, selectedAssignee]);

  const handleQuickStatusAdvance = (task: Task) => {
    const sequence: Record<TaskStatus, TaskStatus> = {
      todo: 'in_progress',
      in_progress: 'under_review',
      under_review: 'completed',
      completed: 'todo',
      blocked: 'in_progress',
      overdue: 'completed'
    };
    updateTask(task.id, { status: sequence[task.status] || 'completed' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              Total Work Packages: {tasks.length} Tasks
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Sprint Tasks & Kanban Board
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Deliverable tracking, student assignments, priority queues, and deadline alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Switch View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          <button
            onClick={() => exportTasksToExcel(filteredTasks)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>

          <button
            onClick={() => { setTaskToEdit(null); setShowAddModal(true); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Assign Task
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.project_code} - {p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Assignees</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((column) => {
            const columnTasks = filteredTasks.filter(t => t.status === column.id);

            return (
              <div
                key={column.id}
                className={`bg-slate-100/70 rounded-2xl p-3 border-t-4 ${column.color} flex flex-col min-h-[450px] shadow-xs`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {column.label}
                  </span>
                  <span className="w-5 h-5 rounded-full bg-white text-slate-700 text-xs font-bold flex items-center justify-center shadow-xs">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          task.priority === 'critical' ? 'bg-rose-100 text-rose-800' :
                          task.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {task.priority}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setTaskToEdit(task); setShowAddModal(true); }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-medium truncate max-w-[100px]">
                          {task.assigned_student?.full_name || 'Unassigned'}
                        </span>
                        <span className={`flex items-center gap-1 ${task.status === 'overdue' ? 'text-rose-600 font-bold' : ''}`}>
                          <Calendar className="w-3 h-3" />
                          {formatDateIndian(task.due_date)}
                        </span>
                      </div>

                      {/* Advance status button */}
                      <button
                        onClick={() => handleQuickStatusAdvance(task)}
                        className="w-full mt-2.5 py-1 px-2 rounded bg-slate-50 hover:bg-blue-50 text-[10px] font-semibold text-slate-600 hover:text-blue-700 border border-slate-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <span>Move Next Status</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="h-28 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400 font-medium">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Task Details</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Assignee</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No tasks found.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{task.title}</p>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1">{task.description}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {task.project?.project_code || 'Project'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {task.assigned_student?.full_name || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={task.status === 'overdue' ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                          {formatDateIndian(task.due_date)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          task.priority === 'critical' ? 'bg-rose-100 text-rose-800' :
                          task.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleQuickStatusAdvance(task)}
                            title="Advance State"
                            className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setTaskToEdit(task); setShowAddModal(true); }}
                            title="Edit Task"
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            title="Delete Task"
                            className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setTaskToEdit(null); }}
        taskToEdit={taskToEdit}
      />
    </div>
  );
}
