'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { Project, ProjectStatus, ProjectPresentation, ProjectLifecyclePhases } from '@/lib/types';
import { formatDateIndian, calculateComputedProgress } from '@/lib/utils/formatters';
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
  Trash2,
  Plus,
  Presentation,
  UserCheck
} from 'lucide-react';

export default function ProjectsPage() {
  const { projects, groups, mentors, staffMembers, milestones, tasks, evaluations, updateProject, deleteProject, currentUser } = useApp();

  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Form state for editing project
  const [editForm, setEditForm] = useState({
    title: '',
    category: 'Full-Stack Software System',
    description: '',
    technologies_input: '',
    mentor_id: '',
    expected_completion_date: '',
    status: 'in_progress' as ProjectStatus,
    manual_progress_override: false,
    progress_percentage: 0,
    repository_url: '',
    live_demo_url: '',
    problem_statement: '',
    objectives: '',
    presentations: [] as ProjectPresentation[],
    lifecycle_phases: {
      planning: false,
      design: false,
      development: false,
      testing: false
    } as ProjectLifecyclePhases
  });

  const handleOpenEdit = (p: Project) => {
    setProjectToEdit(p);
    const initialPhases: ProjectLifecyclePhases = p.lifecycle_phases || {
      planning: p.status !== 'not_started',
      design: ['design', 'development', 'testing', 'completed'].includes(p.status),
      development: ['development', 'testing', 'completed'].includes(p.status),
      testing: ['testing', 'completed'].includes(p.status)
    };

    const allPhasesDone = initialPhases.planning && initialPhases.design && initialPhases.development && initialPhases.testing;
    const isCompleted = p.status === 'completed' || allPhasesDone;

    setEditForm({
      title: p.title || '',
      category: p.category || 'Full-Stack Software System',
      description: p.description || '',
      technologies_input: Array.isArray(p.technologies) ? p.technologies.join(', ') : '',
      mentor_id: p.mentor_id || p.mentor?.id || '',
      expected_completion_date: p.expected_completion_date ? p.expected_completion_date.split('T')[0] : '',
      status: isCompleted ? 'completed' : p.status,
      // If completed or all 4 phases are done, disable manual override so it recalculates to 100%
      manual_progress_override: isCompleted ? false : p.manual_progress_override,
      progress_percentage: isCompleted ? 100 : p.progress_percentage,
      repository_url: p.repository_url || '',
      live_demo_url: p.live_demo_url || '',
      problem_statement: p.problem_statement || '',
      objectives: p.objectives || '',
      presentations: Array.isArray(p.presentations) ? [...p.presentations] : [],
      lifecycle_phases: initialPhases
    });
  };

  const handleToggleLifecyclePhase = (phaseKey: keyof ProjectLifecyclePhases) => {
    const nextPhases: ProjectLifecyclePhases = {
      ...editForm.lifecycle_phases,
      [phaseKey]: !editForm.lifecycle_phases[phaseKey]
    };

    // Auto-update status suggestion based on phase progression
    let newStatus = editForm.status;
    const allDone = nextPhases.planning && nextPhases.design && nextPhases.development && nextPhases.testing;
    if (allDone) {
      newStatus = 'completed';
    } else if (nextPhases.testing) {
      newStatus = 'testing';
    } else if (nextPhases.development) {
      newStatus = 'development';
    } else if (nextPhases.design) {
      newStatus = 'design';
    } else if (nextPhases.planning) {
      newStatus = 'planning';
    }

    setEditForm({
      ...editForm,
      lifecycle_phases: nextPhases,
      status: newStatus,
      // Automatically disable manual override when all 4 are completed so it reflects 100%
      manual_progress_override: allDone ? false : editForm.manual_progress_override,
      progress_percentage: allDone ? 100 : editForm.progress_percentage
    });
  };

  const handleAddPresentation = () => {
    const currentList = editForm.presentations || [];
    const nextRound = currentList.length + 1;
    const newPres: ProjectPresentation = {
      id: `pres_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      round_number: nextRound,
      title: `Presentation ${nextRound}`,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      feedback: '',
      score: undefined
    };
    setEditForm({
      ...editForm,
      presentations: [...currentList, newPres]
    });
  };

  const handleAutoFillProjectDefaults = () => {
    if (!projectToEdit) return;
    const grp = groups.find(g => g.id === projectToEdit.group_id);
    setEditForm(prev => ({
      ...prev,
      title: prev.title.trim() || `Academic Capstone Project - ${grp?.name || 'Cohort'}`,
      category: prev.category.trim() || 'Full-Stack Software System',
      description: prev.description.trim() || `Academic capstone project assigned to ${grp?.name || 'group'}.`,
      technologies_input: prev.technologies_input.trim() || 'Next.js, PostgreSQL, Tailwind CSS',
      expected_completion_date: prev.expected_completion_date || '2025-04-30',
      mentor_id: prev.mentor_id || grp?.mentor_id || '',
      problem_statement: prev.problem_statement.trim() || 'Design and deploy a scalable full-stack system architecture.',
      objectives: prev.objectives.trim() || 'Deliver verified lifecycle phases, end-to-end features, and secure database integrations.'
    }));
  };

  const handleUpdatePresentation = (index: number, updates: Partial<ProjectPresentation>) => {
    const list = [...(editForm.presentations || [])];
    list[index] = { ...list[index], ...updates };
    setEditForm({ ...editForm, presentations: list });
  };

  const handleRemovePresentation = (index: number) => {
    const list = (editForm.presentations || []).filter((_, idx) => idx !== index);
    const renumbered = list.map((item, idx) => ({
      ...item,
      round_number: idx + 1,
      title: item.title.startsWith('Presentation ') ? `Presentation ${idx + 1}` : item.title
    }));
    setEditForm({ ...editForm, presentations: renumbered });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectToEdit) {
      const parsedTech = editForm.technologies_input
        ? editForm.technologies_input.split(',').map(t => t.trim()).filter(Boolean)
        : projectToEdit.technologies;

      const allPhasesDone = Boolean(
        editForm.lifecycle_phases?.planning &&
        editForm.lifecycle_phases?.design &&
        editForm.lifecycle_phases?.development &&
        editForm.lifecycle_phases?.testing
      );
      const isCompleted = editForm.status === 'completed' || allPhasesDone;

      const computed = isCompleted ? 100 : calculateComputedProgress(
        [],
        tasks.filter(t => t.project_id === projectToEdit.id || (projectToEdit.group_id && t.group_id === projectToEdit.group_id)),
        editForm.presentations,
        editForm.lifecycle_phases,
        editForm.status
      );

      const overrideActive = isCompleted ? false : editForm.manual_progress_override;
      const finalProgress = isCompleted ? 100 : (overrideActive ? editForm.progress_percentage : computed);
      const finalStatus = isCompleted ? 'completed' : editForm.status;

      updateProject(projectToEdit.id, {
        title: editForm.title.trim() || projectToEdit.title,
        category: editForm.category.trim() || projectToEdit.category,
        description: editForm.description.trim() || projectToEdit.description,
        technologies: parsedTech.length > 0 ? parsedTech : ['Next.js', 'PostgreSQL', 'Tailwind CSS'],
        mentor_id: editForm.mentor_id || projectToEdit.mentor_id,
        expected_completion_date: editForm.expected_completion_date || projectToEdit.expected_completion_date,
        status: finalStatus,
        manual_progress_override: overrideActive,
        progress_percentage: finalProgress,
        repository_url: editForm.repository_url,
        live_demo_url: editForm.live_demo_url,
        problem_statement: editForm.problem_statement,
        objectives: editForm.objectives,
        presentations: editForm.presentations,
        lifecycle_phases: editForm.lifecycle_phases
      });
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
                      {project.presentations && project.presentations.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Presentation className="w-3 h-3" />
                          {project.presentations.length} {project.presentations.length === 1 ? 'Presentation' : 'Presentations'}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-500">
                        Category: <strong className="text-slate-800">{project.category}</strong>
                      </span>
                    </div>

                    {/* Lifecycle Phases Stepper Pills on Card */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[11px]">
                      <span className="text-slate-400 font-semibold mr-0.5">Phases:</span>
                      <span className={`px-2 py-0.5 rounded-md font-medium border transition-colors ${
                        project.lifecycle_phases?.planning
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200/60'
                      }`}>
                        Planning {project.lifecycle_phases?.planning ? '✓' : ''}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-medium border transition-colors ${
                        project.lifecycle_phases?.design
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200/60'
                      }`}>
                        Design {project.lifecycle_phases?.design ? '✓' : ''}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-medium border transition-colors ${
                        project.lifecycle_phases?.development
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200/60'
                      }`}>
                        Develop {project.lifecycle_phases?.development ? '✓' : ''}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-medium border transition-colors ${
                        project.lifecycle_phases?.testing
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200/60'
                      }`}>
                        Test {project.lifecycle_phases?.testing ? '✓' : ''}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      {project.title}
                    </h2>

                    {/* Under project name near group show the staff in charge */}
                    <div className="flex items-center gap-2.5 flex-wrap text-xs mt-1">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                        Group: {group?.name || 'Group'} ({group?.group_code || 'GRP'})
                      </span>
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        Staff In-Charge: {group?.coordinator_name || group?.mentor?.full_name || project.mentor?.full_name || staffMembers.find(s => s.id === group?.mentor_id || s.id === project.mentor_id)?.full_name || 'Staff Coordinator'}
                      </span>
                    </div>

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
                        Staff In-Charge: <strong className="text-blue-700">{group?.coordinator_name || group?.mentor?.full_name || project.mentor?.full_name || staffMembers.find(s => s.id === group?.mentor_id || s.id === project.mentor_id)?.full_name || 'Staff Coordinator'}</strong>
                      </div>
                      <div>
                        Lifecycle: <strong className="text-slate-800">
                          {[
                            project.lifecycle_phases?.planning,
                            project.lifecycle_phases?.design,
                            project.lifecycle_phases?.development,
                            project.lifecycle_phases?.testing
                          ].filter(Boolean).length} of 4 verified
                        </strong>
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
                      {project.manual_progress_override && project.status !== 'completed' && project.progress_percentage < 100 && (
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
            {/* Core Project Details & Academic Metadata */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
                  Academic Project Details & Metadata
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoFillProjectDefaults}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-white hover:bg-blue-50 rounded-lg border border-blue-200 shadow-2xs transition-colors"
                    title="Keeps whatever you already entered, and fills defaults only for empty fields"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Auto-Fill Empty Fields
                  </button>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Code: {projectToEdit.project_code}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-medium focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. AI-Powered Healthcare Diagnostic System"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-medium focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. Full-Stack Software System, AI / Machine Learning"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Technologies / Tech Stack (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editForm.technologies_input}
                    onChange={(e) => setEditForm({ ...editForm, technologies_input: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-medium focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. Next.js, PostgreSQL, Tailwind CSS, Python"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={editForm.expected_completion_date}
                    onChange={(e) => setEditForm({ ...editForm, expected_completion_date: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-medium focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Project Description
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-normal focus:ring-1 focus:ring-blue-500"
                    placeholder="Brief description of the academic capstone project..."
                  />
                </div>
              </div>
            </div>

            {/* Interactive Lifecycle Phases (Planning, Design, Development, Testing) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Lifecycle Phases & Progress Verification
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Mark each phase as complete to dynamically calculate project progress percentage.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 self-start sm:self-auto">
                  {[
                    editForm.lifecycle_phases.planning,
                    editForm.lifecycle_phases.design,
                    editForm.lifecycle_phases.development,
                    editForm.lifecycle_phases.testing
                  ].filter(Boolean).length} / 4 Phases Done
                </span>
              </div>

              {/* 4 Interactive Phase Checkbox Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {/* 1. Planning */}
                <button
                  type="button"
                  onClick={() => handleToggleLifecyclePhase('planning')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    editForm.lifecycle_phases.planning
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs ring-1 ring-emerald-300'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Phase 1</span>
                    <input
                      type="checkbox"
                      checked={editForm.lifecycle_phases.planning}
                      readOnly
                      className="rounded text-emerald-600 pointer-events-none"
                    />
                  </div>
                  <div className="font-bold text-xs">Planning</div>
                  <div className="text-[10px] opacity-75 truncate">Scope & SRS</div>
                  <span className={`inline-block mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                    editForm.lifecycle_phases.planning ? 'bg-emerald-200/70 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {editForm.lifecycle_phases.planning ? '✓ Completed' : 'Pending'}
                  </span>
                </button>

                {/* 2. Design */}
                <button
                  type="button"
                  onClick={() => handleToggleLifecyclePhase('design')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    editForm.lifecycle_phases.design
                      ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-xs ring-1 ring-purple-300'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Phase 2</span>
                    <input
                      type="checkbox"
                      checked={editForm.lifecycle_phases.design}
                      readOnly
                      className="rounded text-purple-600 pointer-events-none"
                    />
                  </div>
                  <div className="font-bold text-xs">Design</div>
                  <div className="text-[10px] opacity-75 truncate">UI/UX & Schema</div>
                  <span className={`inline-block mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                    editForm.lifecycle_phases.design ? 'bg-purple-200/70 text-purple-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {editForm.lifecycle_phases.design ? '✓ Completed' : 'Pending'}
                  </span>
                </button>

                {/* 3. Develop */}
                <button
                  type="button"
                  onClick={() => handleToggleLifecyclePhase('development')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    editForm.lifecycle_phases.development
                      ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs ring-1 ring-blue-300'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Phase 3</span>
                    <input
                      type="checkbox"
                      checked={editForm.lifecycle_phases.development}
                      readOnly
                      className="rounded text-blue-600 pointer-events-none"
                    />
                  </div>
                  <div className="font-bold text-xs">Develop</div>
                  <div className="text-[10px] opacity-75 truncate">Code & APIs</div>
                  <span className={`inline-block mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                    editForm.lifecycle_phases.development ? 'bg-blue-200/70 text-blue-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {editForm.lifecycle_phases.development ? '✓ Completed' : 'Pending'}
                  </span>
                </button>

                {/* 4. Test */}
                <button
                  type="button"
                  onClick={() => handleToggleLifecyclePhase('testing')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    editForm.lifecycle_phases.testing
                      ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs ring-1 ring-amber-300'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Phase 4</span>
                    <input
                      type="checkbox"
                      checked={editForm.lifecycle_phases.testing}
                      readOnly
                      className="rounded text-amber-600 pointer-events-none"
                    />
                  </div>
                  <div className="font-bold text-xs">Test</div>
                  <div className="text-[10px] opacity-75 truncate">QA & Bug Fixes</div>
                  <span className={`inline-block mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                    editForm.lifecycle_phases.testing ? 'bg-amber-200/70 text-amber-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {editForm.lifecycle_phases.testing ? '✓ Completed' : 'Pending'}
                  </span>
                </button>
              </div>

              {/* Status Select & Progress Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Active Lifecycle Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => {
                      const nextStatus = e.target.value as ProjectStatus;
                      const isComp = nextStatus === 'completed';
                      setEditForm({
                        ...editForm,
                        status: nextStatus,
                        manual_progress_override: isComp ? false : editForm.manual_progress_override,
                        progress_percentage: isComp ? 100 : editForm.progress_percentage
                      });
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-medium"
                  >
                    <option value="planning">Planning Phase</option>
                    <option value="design">Design Phase</option>
                    <option value="development">Development Phase</option>
                    <option value="testing">Testing Phase</option>
                    <option value="completed">Completed & Evaluated (100%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Project Progress (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      disabled={
                        !editForm.manual_progress_override ||
                        editForm.status === 'completed' ||
                        (editForm.lifecycle_phases.planning &&
                          editForm.lifecycle_phases.design &&
                          editForm.lifecycle_phases.development &&
                          editForm.lifecycle_phases.testing)
                      }
                      value={
                        (editForm.status === 'completed' ||
                          (editForm.lifecycle_phases.planning &&
                            editForm.lifecycle_phases.design &&
                            editForm.lifecycle_phases.development &&
                            editForm.lifecycle_phases.testing))
                          ? 100
                          : (editForm.manual_progress_override
                            ? editForm.progress_percentage
                            : calculateComputedProgress(
                                [],
                                tasks.filter(t => t.project_id === projectToEdit.id || (projectToEdit.group_id && t.group_id === projectToEdit.group_id)),
                                editForm.presentations,
                                editForm.lifecycle_phases,
                                editForm.status
                              ))
                      }
                      onChange={(e) => setEditForm({ ...editForm, progress_percentage: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs disabled:bg-emerald-50 disabled:text-emerald-800 disabled:font-bold"
                    />
                    {!(
                      editForm.status === 'completed' ||
                      (editForm.lifecycle_phases.planning &&
                        editForm.lifecycle_phases.design &&
                        editForm.lifecycle_phases.development &&
                        editForm.lifecycle_phases.testing)
                    ) && (
                      <label className="flex items-center gap-1 text-[11px] text-slate-600 whitespace-nowrap cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.manual_progress_override}
                          onChange={(e) => setEditForm({ ...editForm, manual_progress_override: e.target.checked })}
                          className="rounded text-blue-600"
                        />
                        Override
                      </label>
                    )}
                  </div>
                  {(editForm.status === 'completed' ||
                    (editForm.lifecycle_phases.planning &&
                      editForm.lifecycle_phases.design &&
                      editForm.lifecycle_phases.development &&
                      editForm.lifecycle_phases.testing)) ? (
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      ✓ Completed projects and verified 4-phase lifecycles are officially locked at 100% velocity.
                    </p>
                  ) : !editForm.manual_progress_override ? (
                    <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                      ✓ Auto-calculated from verified phases (25% each) & presentations.
                    </p>
                  ) : (
                    <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                      Manual progress override enabled.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Project Presentations Section */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Presentation className="w-4 h-4 text-blue-600" />
                    Project Presentations
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                      {editForm.presentations?.length || 0} Rounds
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Record each presentation milestone with evaluation date, status, score, and remarks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPresentation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Presentation
                </button>
              </div>

              {(!editForm.presentations || editForm.presentations.length === 0) ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 bg-slate-50/50">
                  No presentations added yet. Click <strong>&quot;Add Presentation&quot;</strong> to record Presentation 1, Presentation 2, etc.
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {editForm.presentations.map((pres, idx) => (
                    <div
                      key={pres.id || idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 transition-all hover:border-slate-300"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                            {pres.round_number || idx + 1}
                          </span>
                          <input
                            type="text"
                            value={pres.title}
                            onChange={(e) => handleUpdatePresentation(idx, { title: e.target.value })}
                            className="font-bold text-xs text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 px-1 py-0.5"
                            placeholder={`Presentation ${idx + 1}`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePresentation(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Delete presentation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Date</label>
                          <input
                            type="date"
                            value={pres.date}
                            onChange={(e) => handleUpdatePresentation(idx, { date: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Status</label>
                          <select
                            value={pres.status}
                            onChange={(e) => handleUpdatePresentation(idx, { status: e.target.value as any })}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white"
                          >
                            <option value="completed">Completed</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="revision_required">Revision Required</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Score (optional)</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={pres.score ?? ''}
                            onChange={(e) => handleUpdatePresentation(idx, { score: e.target.value ? parseFloat(e.target.value) : undefined })}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white"
                            placeholder="e.g. 85"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Feedback / Remarks</label>
                        <input
                          type="text"
                          value={pres.feedback || ''}
                          onChange={(e) => handleUpdatePresentation(idx, { feedback: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-white"
                          placeholder="Feedback or mentor suggestions..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
