'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { Evaluation } from '@/lib/types';
import { formatDateIndian } from '@/lib/utils/formatters';
import { Modal } from '@/components/ui/Modal';
import {
  MessageSquare,
  Star,
  Award,
  Users,
  FolderKanban,
  CheckCircle2,
  CalendarCheck,
  Plus,
  Edit,
  Sparkles
} from 'lucide-react';

export default function MentorFeedbackPage() {
  const { mentors, groups, projects, students, evaluations, saveEvaluation, weeklyReports, currentUser } = useApp();

  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id || '');
  const [showEvalModal, setShowEvalModal] = useState(false);

  const [evalForm, setEvalForm] = useState({
    group_id: groups[0]?.id || '',
    project_id: projects[0]?.id || '',
    student_id: students[0]?.id || '',
    mentor_id: currentUser.id,
    technical_skills: 8,
    teamwork: 9,
    communication: 8,
    problem_solving: 8,
    project_management: 8,
    overall_performance: 8,
    remarks: '',
    evaluation_date: new Date().toISOString().split('T')[0]
  });

  const activeGroup = groups.find(g => g.id === selectedGroup);
  const activeProject = projects.find(p => p.group_id === selectedGroup);
  const groupEvaluations = evaluations.filter(e => e.group_id === selectedGroup);
  const groupWeekly = weeklyReports.filter(w => w.group_id === selectedGroup);

  const handleOpenNewEval = () => {
    setEvalForm({
      group_id: selectedGroup,
      project_id: activeProject?.id || projects[0]?.id || '',
      student_id: activeGroup?.members?.[0]?.id || students[0]?.id || '',
      mentor_id: currentUser.id,
      technical_skills: 8,
      teamwork: 9,
      communication: 8,
      problem_solving: 8,
      project_management: 8,
      overall_performance: 8,
      remarks: '',
      evaluation_date: new Date().toISOString().split('T')[0]
    });
    setShowEvalModal(true);
  };

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    saveEvaluation({
      ...evalForm,
      mentor_id: currentUser.id
    });
    setShowEvalModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              Mentor Academic Evaluations
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Mentor Oversight & Performance Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Evaluate technical maturity, teamwork, problem solving, and provide official academic scores.
          </p>
        </div>

        {(currentUser.role === 'admin' || currentUser.role === 'mentor') && (
          <button
            onClick={handleOpenNewEval}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Record Evaluation Score
          </button>
        )}
      </div>

      {/* Group Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
          Evaluating Cohort:
        </label>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name} ({g.group_code})</option>
          ))}
        </select>
      </div>

      {/* Cohort Performance Overview */}
      {(!activeGroup || !activeProject) ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
          No cohorts or projects registered yet. Form a group first to begin recording evaluations.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold font-mono text-blue-700 uppercase">
                {activeGroup.group_code}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">{activeProject.title}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Project Mentor: <strong className="text-blue-700">{activeGroup.mentor?.full_name || 'Assigned Mentor'}</strong> •
                College: <strong className="text-slate-800">{activeGroup.college?.name}</strong>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-slate-500 uppercase">Overall Progress</span>
              <p className="text-3xl font-black text-emerald-600">{activeProject.progress_percentage}%</p>
            </div>
          </div>

          {/* Evaluations Grid for this group */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Student Performance Rubric ({groupEvaluations.length} Evaluations)
            </h3>

            {groupEvaluations.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No evaluation rubrics filed yet for this group. Click "Record Evaluation Score" above.
              </p>
            ) : (
              groupEvaluations.map((ev) => {
                const student = students.find(s => s.id === ev.student_id);

                return (
                  <div key={ev.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={student?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={student?.full_name || 'Student'}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{student?.full_name || 'Student'}</p>
                          <p className="text-[11px] text-slate-500">{student?.student_reg_no} • {student?.assigned_role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100/80 text-emerald-800 rounded-lg text-xs font-bold">
                        <Award className="w-4 h-4 text-emerald-600" />
                        Score: {ev.overall_performance} / 10
                      </div>
                    </div>

                    {/* Criteria scores */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] bg-white p-3 rounded-lg border border-slate-200/80">
                      <div>
                        <span className="text-slate-400 block font-medium">Technical Skills</span>
                        <span className="font-bold text-blue-700">{ev.technical_skills}/10</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Teamwork</span>
                        <span className="font-bold text-blue-700">{ev.teamwork}/10</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Communication</span>
                        <span className="font-bold text-blue-700">{ev.communication}/10</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Problem Solving</span>
                        <span className="font-bold text-blue-700">{ev.problem_solving}/10</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Project Mgmt</span>
                        <span className="font-bold text-blue-700">{ev.project_management}/10</span>
                      </div>
                    </div>

                    {ev.remarks && (
                      <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded border border-slate-200/60 leading-relaxed">
                        "{ev.remarks}"
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Record Evaluation Modal */}
      {showEvalModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowEvalModal(false)}
          title="Submit Student Evaluation Rubric"
          subtitle="Record official semester project performance parameters"
          maxWidth="2xl"
        >
          <form onSubmit={handleSubmitEvaluation} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Student *
                </label>
                <select
                  value={evalForm.student_id}
                  onChange={(e) => setEvalForm({ ...evalForm, student_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.student_reg_no})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Evaluation Date
                </label>
                <input
                  type="date"
                  value={evalForm.evaluation_date}
                  onChange={(e) => setEvalForm({ ...evalForm, evaluation_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Rubric scores */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Technical Skills (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={evalForm.technical_skills}
                  onChange={(e) => setEvalForm({ ...evalForm, technical_skills: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teamwork (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={evalForm.teamwork}
                  onChange={(e) => setEvalForm({ ...evalForm, teamwork: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Communication (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={evalForm.communication}
                  onChange={(e) => setEvalForm({ ...evalForm, communication: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Problem Solving (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={evalForm.problem_solving}
                  onChange={(e) => setEvalForm({ ...evalForm, problem_solving: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Mgmt (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={evalForm.project_management}
                  onChange={(e) => setEvalForm({ ...evalForm, project_management: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Overall Score (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={evalForm.overall_performance}
                  onChange={(e) => setEvalForm({ ...evalForm, overall_performance: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-bold text-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mentor Comprehensive Remarks
              </label>
              <textarea
                rows={3}
                required
                value={evalForm.remarks}
                onChange={(e) => setEvalForm({ ...evalForm, remarks: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                placeholder="Specific feedback on coding standards, sprint cadence, and presentation readiness..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEvalModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Save Evaluation Score
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
