'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Project } from '@/lib/types';
import { useApp } from '@/lib/context/AppContext';
import { formatDateIndian } from '@/lib/utils/formatters';
import { generateFinalProjectReportPdf } from '@/lib/utils/exportPdf';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  FileDown,
  FolderKanban,
  Presentation,
  UserCheck,
  Calendar,
  Layers,
  FileText,
  ExternalLink,
  Award,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

interface ProjectPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export function ProjectPortfolioModal({ isOpen, onClose, project }: ProjectPortfolioModalProps) {
  const { groups, students, tasks, documents, evaluations, staffMembers, colleges } = useApp();

  if (!isOpen || !project) return null;

  const group = groups.find(g => g.id === project.group_id);
  const collegeName = group?.college?.name || colleges.find(c => c.id === group?.college_id)?.name || 'MES College';
  const groupName = group?.name || 'Academic Cohort';
  const staffName = group?.coordinator_name || group?.mentor?.full_name || project.mentor?.full_name || staffMembers.find(s => s.id === group?.mentor_id || s.id === project.mentor_id)?.full_name || 'Staff Coordinator';
  const evaluation = evaluations.find(e => e.project_id === project.id);

  const projectStudents = students.filter(s => s.group_id === group?.id || (group?.member_ids || []).includes(s.id));
  const projectTasks = tasks.filter(t => t.project_id === project.id || (group && t.group_id === group.id));
  const projectDocs = documents.filter(d => d.project_id === project.id || (group && d.group_id === group.id));

  const phases = project.lifecycle_phases;
  const verifiedCount = [phases?.planning, phases?.design, phases?.development, phases?.testing].filter(Boolean).length;

  const handleDownloadPdf = () => {
    generateFinalProjectReportPdf(project, group, evaluation, {
      students: projectStudents,
      tasks: projectTasks,
      documents: projectDocs,
      staffInChargeName: staffName
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Project Architecture & Dissertation Dossier`}
      subtitle={`${project.title} • Cohort: ${groupName} • ${collegeName}`}
      maxWidth="3xl"
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
        {/* Top Summary Banner */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={project.status} />
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                {project.category}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">{project.title}</h3>
            <p className="text-xs text-slate-500">
              Cohort: <strong className="text-slate-800">{groupName}</strong> • Staff In-Charge: <strong className="text-blue-700">{staffName}</strong>
            </p>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <FileDown className="w-4 h-4" />
            Download Project PDF
          </button>
        </div>

        {/* Progress & Lifecycle Phases */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Overall Project Velocity & Verification
            </span>
            <span className="font-black text-emerald-600 text-sm">{project.progress_percentage}%</span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${project.progress_percentage}%` }}
            />
          </div>

          {/* Lifecycle Stepper Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className={`p-2.5 rounded-lg border text-center ${
              phases?.planning ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}>
              <span className="font-bold block">1. Planning</span>
              <span className="text-[10px]">{phases?.planning ? '✓ Verified' : 'Pending'}</span>
            </div>
            <div className={`p-2.5 rounded-lg border text-center ${
              phases?.design ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}>
              <span className="font-bold block">2. Design</span>
              <span className="text-[10px]">{phases?.design ? '✓ Verified' : 'Pending'}</span>
            </div>
            <div className={`p-2.5 rounded-lg border text-center ${
              phases?.development ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}>
              <span className="font-bold block">3. Development</span>
              <span className="text-[10px]">{phases?.development ? '✓ Verified' : 'Pending'}</span>
            </div>
            <div className={`p-2.5 rounded-lg border text-center ${
              phases?.testing ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}>
              <span className="font-bold block">4. Testing & QA</span>
              <span className="text-[10px]">{phases?.testing ? '✓ Verified' : 'Pending'}</span>
            </div>
          </div>
        </div>

        {/* Problem Statement & Architecture Scope */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
          <span className="font-bold text-slate-900 uppercase tracking-wider block">
            1. Problem Statement & Architecture Objectives:
          </span>
          <p className="text-slate-600 leading-relaxed">
            {project.problem_statement || project.description || 'Project provides a scalable architecture designed to address functional objectives with clear system boundaries.'}
          </p>

          {project.technologies && project.technologies.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Technologies Used:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {project.technologies.map((t, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Engineering Team & Student Roster */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-blue-600" />
            2. Project Engineering Team & Student Roster ({projectStudents.length})
          </span>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Reg No</th>
                  <th className="py-2 px-3">Student Name</th>
                  <th className="py-2 px-3">Assigned Role</th>
                  <th className="py-2 px-3">Email Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                      No student members enrolled in this project cohort.
                    </td>
                  </tr>
                ) : (
                  projectStudents.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-700">{s.student_reg_no}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{s.full_name}</td>
                      <td className="py-2 px-3 text-blue-700 font-semibold">{s.assigned_role}</td>
                      <td className="py-2 px-3 text-slate-500">{s.email}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Presentation & Defense Review Rounds */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Presentation className="w-4 h-4 text-indigo-600" />
            3. Presentation & Defense Review Rounds
          </span>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
                  <th className="py-2 px-3">Round</th>
                  <th className="py-2 px-3">Title</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(project.presentations || []).length === 0 ? (
                  <tr className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 font-bold text-slate-700">Round 1</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">Dissertation Synopsis Defense</td>
                    <td className="py-2 px-3 text-slate-500">{formatDateIndian(project.start_date)}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        COMPLETED
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">Initial proposal and architecture requirements approved.</td>
                  </tr>
                ) : (
                  (project.presentations || []).map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 font-bold text-slate-700">Round {p.round_number || idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{p.title || `Phase Defense ${idx + 1}`}</td>
                      <td className="py-2 px-3 text-slate-500">{formatDateIndian(p.date)}</td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600">{p.feedback || 'Review completed by committee.'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Work Packages & Sprint Deliverables */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-purple-600" />
            4. Work Packages & Sprint Deliverables ({projectTasks.length})
          </span>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Deliverable Title</th>
                  <th className="py-2 px-3">Assigned To</th>
                  <th className="py-2 px-3">Priority</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                      No sprint tasks registered for this project.
                    </td>
                  </tr>
                ) : (
                  projectTasks.map((t, idx) => {
                    const assigned = projectStudents.find(s => s.id === t.assigned_student_id);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{t.title}</td>
                        <td className="py-2 px-3 text-slate-600">{assigned?.full_name || 'Team Work Package'}</td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            t.priority === 'critical' ? 'bg-rose-100 text-rose-800' :
                            t.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {(t.priority || 'medium').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            t.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {(t.status || 'todo').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500 text-[11px]">
                          {t.due_date ? formatDateIndian(t.due_date) : 'N/A'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Project Document Repository & Artifacts */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-600" />
            5. Project Document Repository & Artifacts ({projectDocs.length})
          </span>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Document Title</th>
                  <th className="py-2 px-3">File Name</th>
                  <th className="py-2 px-3">Uploaded Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectDocs.length === 0 ? (
                  <tr className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">1</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">Project Dissertation SRS Documentation</td>
                    <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">Dissertation_SRS_v1.0.pdf</td>
                    <td className="py-2 px-3 text-slate-500">{formatDateIndian(project.start_date)}</td>
                  </tr>
                ) : (
                  projectDocs.map((d, idx) => (
                    <tr key={d.id} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{d.title}</td>
                      <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">{d.file_name}</td>
                      <td className="py-2 px-3 text-slate-500">{formatDateIndian(d.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mentor Evaluation Defense Matrix (if evaluation exists) */}
        {evaluation && (
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              6. Mentor Evaluation Defense Matrix (Score / 10)
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block">Technical Skills</span>
                <strong className="text-slate-900 text-sm">{evaluation.technical_skills} / 10</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block">Teamwork & Collaboration</span>
                <strong className="text-slate-900 text-sm">{evaluation.teamwork} / 10</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block">Communication & Defense</span>
                <strong className="text-slate-900 text-sm">{evaluation.communication} / 10</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block">Problem Solving & Innovation</span>
                <strong className="text-slate-900 text-sm">{evaluation.problem_solving} / 10</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block">Project Management</span>
                <strong className="text-slate-900 text-sm">{evaluation.project_management} / 10</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="text-emerald-700 font-semibold block">Aggregate Performance</span>
                <strong className="text-emerald-900 text-sm">{evaluation.overall_performance} / 10</strong>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            Download Project Portfolio PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
