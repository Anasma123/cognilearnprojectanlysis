'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { useApp } from '@/lib/context/AppContext';
import { WeeklyReviewStatus, ProjectLifecyclePhases, ProjectPresentation, Task } from '@/lib/types';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Layers,
  Presentation,
  Send,
  Calendar,
  ChevronDown,
  Info
} from 'lucide-react';

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Predefined Curated Options for Select Dropdowns
const PROBLEM_OPTIONS = [
  { value: 'none', label: '✅ No Blockers (Smooth Development Progress)' },
  { value: 'api_integration', label: '🌐 API Integration & Backend Service Latency' },
  { value: 'database_schema', label: '🗄️ Database Schema Migration & Query Optimization' },
  { value: 'ui_responsive', label: '🎨 Responsive UI/UX & Component Layout State' },
  { value: 'auth_session', label: '🔐 Authentication, Tokens & Session Synchronization' },
  { value: 'dependencies', label: '📦 Third-Party Package Conflicts & Build Dependencies' },
  { value: 'lab_hardware', label: '💻 Hardware / Lab Infrastructure Availability' },
  { value: 'presentation_prep', label: '📊 Presentation Revisions & Defense Documentation' },
  { value: 'other', label: '✏️ Other (Specify Custom Blocker...)' },
];

const SOLUTION_OPTIONS = [
  { value: 'resolved_team', label: '🤝 Resolved via collaborative team pair-programming & documentation' },
  { value: 'refactored_code', label: '⚡ Refactored module architecture & updated dependencies' },
  { value: 'mentor_consultation', label: '👨‍🏫 Consulted project mentor & aligned data structures' },
  { value: 'caching_query', label: '🚀 Added client caching & optimized PostgreSQL queries' },
  { value: 'responsive_fixes', label: '📱 Implemented Tailwind breakpoints & error boundary handlers' },
  { value: 'extra_sprint', label: '⏳ Scheduled dedicated collaborative sprint to clear pending items' },
  { value: 'other', label: '✏️ Other (Specify Custom Solution...)' },
];

const PLAN_OPTIONS = [
  { value: 'next_lifecycle_phase', label: '🎯 Advance to Next Lifecycle Phase & Milestone Deliverables' },
  { value: 'api_frontend_connect', label: '🔗 Connect Frontend UI to Live Backend Endpoints' },
  { value: 'testing_qa_sprint', label: '🧪 Conduct End-to-End System Testing & Bug Remediation' },
  { value: 'presentation_demo_prep', label: '📽️ Prepare Presentation Defense Slides & Live Demonstration' },
  { value: 'db_security_audit', label: '🛡️ Optimize Database Schema, Security & Row-Level Permissions' },
  { value: 'staging_deployment', label: '🚀 Staging Cloud Deployment & Final Report Compilation' },
  { value: 'other', label: '✏️ Other (Specify Custom Sprint Plan...)' },
];

const REMARKS_OPTIONS = [
  { value: 'on_schedule', label: '👍 All milestones on track; ready for mentor review' },
  { value: 'request_consultation', label: '💬 Requesting a 15-minute consultation review with assigned mentor' },
  { value: 'presentation_feedback', label: '📑 Awaiting mentor evaluation and grading on recent presentation' },
  { value: 'lab_resource_req', label: '🔬 Lab equipment / facility access requested' },
  { value: 'other', label: '✏️ Other (Specify Custom Remark...)' },
];

export function WeeklyReportModal({ isOpen, onClose }: WeeklyReportModalProps) {
  const { currentUser, groups, projects, tasks, submitWeeklyReport, weeklyReports } = useApp();

  const [formData, setFormData] = useState({
    group_id: groups[0]?.id || '',
    project_id: projects[0]?.id || '',
    week_number: 1,
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

  // State for Dropdown Selections + Custom "Other" text
  const [problemSelect, setProblemSelect] = useState('none');
  const [customProblem, setCustomProblem] = useState('');

  const [solutionSelect, setSolutionSelect] = useState('resolved_team');
  const [customSolution, setCustomSolution] = useState('');

  const [planSelect, setPlanSelect] = useState('next_lifecycle_phase');
  const [customPlan, setCustomPlan] = useState('');

  const [remarksSelect, setRemarksSelect] = useState('on_schedule');
  const [customRemarks, setCustomRemarks] = useState('');

  // Selected Group's live objects
  const selectedGroup = useMemo(() => {
    return groups.find(g => g.id === formData.group_id) || groups[0];
  }, [groups, formData.group_id]);

  const selectedProject = useMemo(() => {
    return projects.find(p => p.group_id === formData.group_id) || projects[0];
  }, [projects, formData.group_id]);

  const groupTasks = useMemo(() => {
    if (!formData.group_id) return [];
    return tasks.filter(t => t.group_id === formData.group_id || (selectedProject && t.project_id === selectedProject.id));
  }, [tasks, formData.group_id, selectedProject]);

  // Auto-fetch helper: synthesizes project velocity, tasks, presentations & tech stack
  const populateFromGroup = useCallback((targetGroupId: string) => {
    if (!targetGroupId) return;

    const grp = groups.find(g => g.id === targetGroupId);
    const prj = projects.find(p => p.group_id === targetGroupId);

    // Filter tasks for this group
    const relatedTasks = tasks.filter(t => 
      t.group_id === targetGroupId || (prj && t.project_id === prj.id)
    );

    const completed = relatedTasks.filter(t => t.status === 'completed');
    const inProgress = relatedTasks.filter(t => t.status === 'in_progress');
    const pending = relatedTasks.filter(t => t.status === 'todo' || t.status === 'blocked');

    const completedTitles = completed.length > 0 
      ? completed.map(t => t.title).join(', ')
      : (prj ? `Setup & milestone planning for ${prj.title}` : 'Initial repository configuration');

    const inProgressTitles = inProgress.length > 0
      ? inProgress.map(t => t.title).join(', ')
      : 'Core component implementation and schema setup';

    const pendingTitles = pending.length > 0
      ? pending.map(t => t.title).join(', ')
      : 'Automated test suite, review defense & deployment';

    const techString = (prj?.technologies && prj.technologies.length > 0)
      ? prj.technologies.join(', ')
      : 'Next.js, PostgreSQL, Tailwind CSS';

    // Velocity & Phases
    const progress = prj?.progress_percentage ?? 0;
    const phases = prj?.lifecycle_phases || {
      planning: true,
      design: false,
      development: false,
      testing: false
    };

    const activePhases = [
      phases.planning ? 'Planning ✓' : null,
      phases.design ? 'Design ✓' : null,
      phases.development ? 'Develop ✓' : null,
      phases.testing ? 'Test ✓' : null,
    ].filter(Boolean).join(', ') || 'Planning';

    // Presentations status
    const presentationsSummary = prj?.presentations && prj.presentations.length > 0
      ? `${prj.presentations.length} Presentation(s) [${prj.presentations.map(p => `${p.title} (${p.status})`).join(', ')}]`
      : 'No presentations recorded';

    // Auto-generated activity paragraph
    const generatedActivities = `Project: ${prj?.title || grp?.name || 'Cohort Project'} (${progress}% progress, Lifecycle: ${activePhases}). Executed ${completed.length} task(s): ${completedTitles}. Presentations: ${presentationsSummary}. Continuous delivery on track for scheduled review.`;

    // Next week number for this specific group
    const groupWeeklyReports = weeklyReports.filter(w => w.group_id === targetGroupId);
    const nextWeekNum = groupWeeklyReports.length > 0
      ? Math.max(...groupWeeklyReports.map(w => w.week_number)) + 1
      : 1;

    setFormData(prev => ({
      ...prev,
      group_id: targetGroupId,
      project_id: prj?.id || prev.project_id,
      week_number: nextWeekNum,
      activities_completed: generatedActivities,
      tasks_completed: completedTitles,
      tasks_in_progress: inProgressTitles,
      tasks_pending: pendingTitles,
      technologies_used: techString,
    }));
  }, [groups, projects, tasks, weeklyReports]);

  // Auto-populate whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      const initialGroupId = formData.group_id || groups[0]?.id;
      if (initialGroupId) {
        populateFromGroup(initialGroupId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleGroupChange = (newGroupId: string) => {
    populateFromGroup(newGroupId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Assemble final string values from Selects + Custom inputs
    const finalProblem = problemSelect === 'other'
      ? (customProblem.trim() || 'Custom technical blocker encountered')
      : (PROBLEM_OPTIONS.find(o => o.value === problemSelect)?.label || 'None');

    const finalSolution = solutionSelect === 'other'
      ? (customSolution.trim() || 'Resolved through architectural adjustments')
      : (SOLUTION_OPTIONS.find(o => o.value === solutionSelect)?.label || 'Resolved through collaborative team review');

    const finalPlan = planSelect === 'other'
      ? (customPlan.trim() || 'Continue sprint deliverables')
      : (PLAN_OPTIONS.find(o => o.value === planSelect)?.label || 'Advance to Next Lifecycle Phase');

    const finalRemarks = remarksSelect === 'other'
      ? (customRemarks.trim() || '')
      : (REMARKS_OPTIONS.find(o => o.value === remarksSelect)?.label || '');

    const prj = projects.find(p => p.group_id === formData.group_id);

    submitWeeklyReport({
      ...formData,
      problems_faced: finalProblem,
      solutions_implemented: finalSolution,
      next_week_plan: finalPlan,
      student_remarks: finalRemarks,
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
      subtitle="Automated sprint audit record synchronized with project velocity, tasks & presentations"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Top Control Bar: Group, Week #, Period */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Group *
            </label>
            <select
              value={formData.group_id}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white shadow-2xs"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.group_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Week Number *
            </label>
            <input
              type="number"
              min={1}
              required
              value={formData.week_number}
              onChange={(e) => setFormData({ ...formData, week_number: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Week Period *
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-1/2 px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-medium bg-white"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-1/2 px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-medium bg-white"
              />
            </div>
          </div>
        </div>

        {/* Live Auto-Fetched Project Summary Badge */}
        {selectedProject && (
          <div className="p-3 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 rounded-xl border border-blue-200/80 shadow-2xs">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-blue-950">
                  Live Auto-Synced Snapshot: <span className="text-blue-700 font-semibold">{selectedProject.title}</span> ({selectedGroup?.group_code})
                </span>
              </div>
              <button
                type="button"
                onClick={() => populateFromGroup(formData.group_id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-white hover:bg-blue-50 rounded-md border border-blue-200 shadow-2xs transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Re-sync Project Data
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                <span className="text-slate-500 block text-[10px]">Project Progress:</span>
                <span className="font-bold text-emerald-600 text-xs">
                  {selectedProject.progress_percentage}% Velocity
                </span>
              </div>

              <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                <span className="text-slate-500 block text-[10px]">Lifecycle Status:</span>
                <span className="font-bold text-slate-800 capitalize">
                  {selectedProject.status.replace('_', ' ')}
                </span>
              </div>

              <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                <span className="text-slate-500 block text-[10px]">Presentations:</span>
                <span className="font-bold text-indigo-700">
                  {selectedProject.presentations?.length || 0} Round(s)
                </span>
              </div>

              <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                <span className="text-slate-500 block text-[10px]">Group Tasks:</span>
                <span className="font-bold text-slate-700">
                  {groupTasks.filter(t => t.status === 'completed').length} Done / {groupTasks.length} Total
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 1. Activities Completed (Auto-generated AI summary, user can refine) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Activities Completed This Week (Auto-Generated Summary) *
            </label>
            <span className="text-[10px] text-slate-400 font-medium">Auto-prefilled from tasks & velocity</span>
          </div>
          <textarea
            rows={2}
            required
            value={formData.activities_completed}
            onChange={(e) => setFormData({ ...formData, activities_completed: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white"
            placeholder="Key activities auto-fetched from project deliverables..."
          />
        </div>

        {/* 2. Tasks Grid (Auto-populated from group tasks) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700">
                Tasks Completed *
              </label>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {groupTasks.filter(t => t.status === 'completed').length} detected
              </span>
            </div>
            <input
              type="text"
              required
              value={formData.tasks_completed}
              onChange={(e) => setFormData({ ...formData, tasks_completed: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="e.g. Auth endpoints, UI setup"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700">
                Tasks In Progress
              </label>
              <span className="text-[10px] text-blue-600 font-semibold">
                {groupTasks.filter(t => t.status === 'in_progress').length} detected
              </span>
            </div>
            <input
              type="text"
              value={formData.tasks_in_progress}
              onChange={(e) => setFormData({ ...formData, tasks_in_progress: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Ongoing tasks..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700">
                Tasks Pending
              </label>
              <span className="text-[10px] text-amber-600 font-semibold">
                {groupTasks.filter(t => t.status === 'todo' || t.status === 'blocked').length} detected
              </span>
            </div>
            <input
              type="text"
              value={formData.tasks_pending}
              onChange={(e) => setFormData({ ...formData, tasks_pending: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Dependencies or queued tasks..."
            />
          </div>
        </div>

        {/* 3. Problems & Solutions: Optimized Dropdowns + "Other" Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Problems Faced */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Problems Faced / Blockers
            </label>
            <select
              value={problemSelect}
              onChange={(e) => setProblemSelect(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white shadow-2xs"
            >
              {PROBLEM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {problemSelect === 'other' && (
              <input
                type="text"
                required
                value={customProblem}
                onChange={(e) => setCustomProblem(e.target.value)}
                placeholder="Type specific problem or technical blocker..."
                className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs bg-amber-50/40 focus:ring-1 focus:ring-amber-500 outline-none animate-in fade-in duration-150"
              />
            )}
          </div>

          {/* Solutions Implemented */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-teal-600" />
              Solutions Implemented
            </label>
            <select
              value={solutionSelect}
              onChange={(e) => setSolutionSelect(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white shadow-2xs"
            >
              {SOLUTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {solutionSelect === 'other' && (
              <input
                type="text"
                required
                value={customSolution}
                onChange={(e) => setCustomSolution(e.target.value)}
                placeholder="Type custom solution or workaround..."
                className="w-full px-2.5 py-1.5 border border-teal-300 rounded-lg text-xs bg-teal-50/40 focus:ring-1 focus:ring-teal-500 outline-none animate-in fade-in duration-150"
              />
            )}
          </div>
        </div>

        {/* 4. Technologies & Next Week Sprint Plan (Dropdown + Other) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              Technologies / Tools Utilized (Auto-Fetched)
            </label>
            <input
              type="text"
              value={formData.technologies_used}
              onChange={(e) => setFormData({ ...formData, technologies_used: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white shadow-2xs"
              placeholder="e.g. Next.js, PostgreSQL, Tailwind CSS"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              Next Week Deliverables & Sprint Plan *
            </label>
            <select
              value={planSelect}
              onChange={(e) => setPlanSelect(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white shadow-2xs"
            >
              {PLAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {planSelect === 'other' && (
              <input
                type="text"
                required
                value={customPlan}
                onChange={(e) => setCustomPlan(e.target.value)}
                placeholder="Specify upcoming sprint targets & milestones..."
                className="w-full px-2.5 py-1.5 border border-indigo-300 rounded-lg text-xs bg-indigo-50/40 focus:ring-1 focus:ring-indigo-500 outline-none animate-in fade-in duration-150"
              />
            )}
          </div>
        </div>

        {/* 5. Student Remarks (Curated options + Other) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Student Team Remarks (Optional)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={remarksSelect}
              onChange={(e) => setRemarksSelect(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none bg-white shadow-2xs"
            >
              {REMARKS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {remarksSelect === 'other' ? (
              <input
                type="text"
                value={customRemarks}
                onChange={(e) => setCustomRemarks(e.target.value)}
                placeholder="Enter feedback or notes for mentor..."
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none"
              />
            ) : (
              <div className="flex items-center text-[11px] text-slate-400 italic px-2">
                Selected remark will be recorded in audit log.
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            Auto-records immutable audit trail entry for group.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Report For Review
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
