'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { Project, ProjectStatus } from '@/lib/types';
import { formatDateIndian } from '@/lib/utils/formatters';
import { generateFinalProjectReportPdf } from '@/lib/utils/exportPdf';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import {
  FolderKanban,
  Edit,
  FileDown,
  ExternalLink,
  Github,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Trash2
} from 'lucide-react';

export default function ProjectsPage() {
  const { projects, groups, milestones, evaluations, updateProject, deleteProject, currentUser } = useApp();

  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Form state for editing project
  const [editForm, setEditForm] = useState({
    status: 'in_progress' as ProjectStatus,
    manual_progress_override: false,
    progress_percentage: 0,
    repository_url: '',
    live_demo_url: '',
    problem_statement: '',
    objectives: ''
  });

  const handleOpenEdit = (p: Project) => {
    setProjectToEdit(p);
    setEditForm({
      status: p.status,
      manual_progress_override: p.manual_progress_override,
      progress_percentage: p.progress_percentage,
      repository_url: p.repository_url || '',
      live_demo_url: p.live_demo_url || '',
      problem_statement: p.problem_statement || '',
      objectives: p.objectives || ''
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectToEdit) {
      updateProject(projectToEdit.id, editForm);
      setProjectToEdit(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              Active Portfolios: {projects.length} Projects
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Academic Project Portfolios
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Full-stack architectures, technical specs, problem statements, and real-time development velocity.
          </p>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-6">
        {projects.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No active project portfolios registered yet. When a cohort group is formed, projects are linked here automatically.
          </div>
        ) : (
          projects.map((project) => {
          const group = groups.find(g => g.id === project.group_id);
          const pMilestones = milestones.filter(m => m.project_id === project.id);
          const completedCount = pMilestones.filter(m => m.status === 'completed').length;
          const evaluation = evaluations.find(e => e.project_id === project.id);

          return (
            <div
              key={project.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 text-xs font-bold font-mono">
                        {project.project_code}
                      </span>
                      <StatusBadge status={project.status} />
                      <span className="text-xs font-semibold text-slate-500">
                        Category: <strong className="text-slate-800">{project.category}</strong>
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      {project.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
                      {project.description}
                    </p>

                    {/* Tech stack pills */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {project.technologies.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Meta info row */}
                    <div className="flex items-center gap-6 pt-3 border-t border-slate-100 text-xs text-slate-500 flex-wrap">
                      <div>
                        Group: <strong className="text-slate-800">{group?.name || 'Group'}</strong>
                      </div>
                      <div>
                        Mentor: <strong className="text-blue-700">{project.mentor?.full_name || 'Assigned Mentor'}</strong>
                      </div>
                      <div>
                        Milestones: <strong className="text-slate-800">{completedCount} of {pMilestones.length || 13} done</strong>
                      </div>
                      <div>
                        Target Date: <strong className="text-slate-800">{formatDateIndian(project.expected_completion_date)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Progress & Actions */}
                  <div className="lg:w-64 flex flex-col justify-between items-start lg:items-end gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <div className="w-full text-left lg:text-right">
                      <div className="flex items-center justify-between lg:justify-end gap-2 text-xs mb-1">
                        <span className="text-slate-500 font-medium">Project Progress</span>
                        <span className="text-base font-black text-emerald-600">
                          {project.progress_percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${project.progress_percentage}%` }}
                        />
                      </div>
                      {project.manual_progress_override && (
                        <span className="text-[10px] text-amber-600 font-semibold block mt-1">
                          (Manual Progress Override Active)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full justify-end">
                      {project.repository_url && (
                        <a
                          href={project.repository_url}
                          target="_blank"
                          rel="noreferrer"
                          title="GitHub Monorepo"
                          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                      {project.live_demo_url && (
                        <a
                          href={project.live_demo_url}
                          target="_blank"
                          rel="noreferrer"
                          title="Vercel Live Preview"
                          className="p-2 rounded-lg bg-white border border-slate-200 text-blue-600 hover:bg-blue-50"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => generateFinalProjectReportPdf(project, group, evaluation)}
                        title="Download Final Project Report PDF"
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                      {(currentUser.role === 'admin' || currentUser.role === 'staff' || currentUser.role === 'mentor') && (
                        <button
                          onClick={() => handleOpenEdit(project)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                        >
                          Manage
                        </button>
                      )}
                      {(currentUser.role === 'admin' || currentUser.role === 'staff') && (
                        <button
                          onClick={() => setProjectToDelete(project)}
                          title="Delete Project Portfolio"
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
      </div>

      {/* Edit Project Modal */}
      {projectToEdit && (
        <Modal
          isOpen={true}
          onClose={() => setProjectToEdit(null)}
          title={`Manage Project: ${projectToEdit.project_code}`}
          subtitle={projectToEdit.title}
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lifecycle Status *
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as ProjectStatus })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-medium"
                >
                  <option value="planning">Planning Phase</option>
                  <option value="in_progress">In Progress</option>
                  <option value="under_review">Under Review / Pre-Defense</option>
                  <option value="completed">Completed & Evaluated</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manual Progress Override (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={!editForm.manual_progress_override}
                    value={editForm.progress_percentage}
                    onChange={(e) => setEditForm({ ...editForm, progress_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 whitespace-nowrap cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.manual_progress_override}
                      onChange={(e) => setEditForm({ ...editForm, manual_progress_override: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    Enable
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GitHub Monorepo URL
                </label>
                <input
                  type="url"
                  value={editForm.repository_url}
                  onChange={(e) => setEditForm({ ...editForm, repository_url: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="https://github.com/org/repo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Live Vercel Preview URL
                </label>
                <input
                  type="url"
                  value={editForm.live_demo_url}
                  onChange={(e) => setEditForm({ ...editForm, live_demo_url: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="https://project.vercel.app"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Problem Statement
              </label>
              <textarea
                rows={3}
                value={editForm.problem_statement}
                onChange={(e) => setEditForm({ ...editForm, problem_statement: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Objectives
              </label>
              <textarea
                rows={3}
                value={editForm.objectives}
                onChange={(e) => setEditForm({ ...editForm, objectives: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProjectToEdit(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
              >
                Save Project Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setProjectToDelete(null)}
          title="Delete Project Portfolio"
          subtitle="Remove project blueprint and associated deliverables"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">{projectToDelete.title}</strong> ({projectToDelete.project_code})?
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              Note: Academic projects require assigned students. Projects with no assigned students are automatically pruned.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProject(projectToDelete.id);
                  setProjectToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors shadow-sm"
              >
                Delete Project
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
