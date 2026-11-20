'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { ProjectMilestone } from '@/lib/types';
import { formatDateIndian } from '@/lib/utils/formatters';
import { StatusBadge } from '@/components/common/StatusBadge';
import { MilestoneModal } from '@/components/milestones/MilestoneModal';
import {
  Milestone,
  CheckCircle2,
  Clock,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  Layers,
  Calendar,
  User,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function MilestonesPage() {
  const { milestones, projects, updateMilestone, deleteMilestone, currentUser } = useApp();

  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [milestoneToEdit, setMilestoneToEdit] = useState<ProjectMilestone | null>(null);

  // Filter milestones by active project
  const projectMilestones = milestones
    .filter(m => m.project_id === selectedProjectId)
    .sort((a, b) => a.step_order - b.step_order);

  const activeProject = projects.find(p => p.id === selectedProjectId);
  const completedMilestones = projectMilestones.filter(m => m.status === 'completed').length;
  const progressPercent = projectMilestones.length > 0 
    ? Math.round((completedMilestones / projectMilestones.length) * 100) 
    : 0;

  const handleQuickApprove = (m: ProjectMilestone) => {
    updateMilestone(m.id, {
      status: 'completed',
      completion_date: new Date().toISOString().split('T')[0],
      remarks: `Signed off and approved by ${currentUser.full_name}`
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              Step-by-Step Development Journey
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Development Steps & Milestone Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            13 Standard Academic Stages from Requirement Analysis to Final Examination Defense.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(currentUser.role === 'admin' || currentUser.role === 'staff' || currentUser.role === 'mentor') && (
            <button
              onClick={() => { setMilestoneToEdit(null); setShowAddModal(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Custom Step
            </button>
          )}
        </div>
      </div>

      {/* Project Switcher Bar & Summary */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
            Selected Project:
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.project_code} — {p.title}</option>
            ))}
          </select>
        </div>

        {/* Milestone Completion Metric */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-500 font-medium">Milestones Completed</span>
            <p className="text-base font-black text-slate-900">
              {completedMilestones} of {projectMilestones.length} <span className="text-emerald-600 font-bold">({progressPercent}%)</span>
            </p>
          </div>
          <div className="w-32 bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Step by step milestone timeline cards */}
      <div className="space-y-4">
        {projectMilestones.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No milestones configured yet for this project. Click &ldquo;Add Custom Step&rdquo; to begin.
          </div>
        ) : (
          projectMilestones.map((m) => {
            const isDone = m.status === 'completed';
            const isInProgress = m.status === 'in_progress';

            return (
              <div
                key={m.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isDone
                    ? 'bg-white border-emerald-200/80 shadow-xs'
                    : isInProgress
                    ? 'bg-blue-50/30 border-blue-200 shadow-xs'
                    : 'bg-white border-slate-200/80 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-4">
                    {/* Step Order Circle */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : isInProgress
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-5 h-5" /> : m.step_order}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                          {m.name}
                        </h3>
                        <StatusBadge status={m.status} />
                        {m.is_custom && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            Custom Step
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {m.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions & Timeline */}
                  <div className="flex items-center gap-3 sm:self-center">
                    {(currentUser.role === 'admin' || currentUser.role === 'staff' || currentUser.role === 'mentor') && !isDone && (
                      <button
                        onClick={() => handleQuickApprove(m)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve Step
                      </button>
                    )}

                    {(currentUser.role === 'admin' || currentUser.role === 'staff' || currentUser.role === 'mentor') && (
                      <button
                        onClick={() => { setMilestoneToEdit(m); setShowAddModal(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                        title="Edit Milestone"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-meta footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Assignee: <strong className="text-slate-700">{m.assigned_student?.full_name || 'Group Team'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due Date: <strong className="text-slate-700">{formatDateIndian(m.due_date)}</strong></span>
                  </div>
                  {m.remarks && (
                    <div className="sm:text-right text-emerald-700 font-medium truncate">
                      Remarks: {m.remarks}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Milestone Modal */}
      <MilestoneModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setMilestoneToEdit(null); }}
        milestoneToEdit={milestoneToEdit}
      />
    </div>
  );
}
