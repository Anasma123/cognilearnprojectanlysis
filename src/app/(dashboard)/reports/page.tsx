'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { exportStudentsToExcel, exportGroupsToExcel, exportAttendanceToExcel, exportWeeklyReportsToExcel, exportTasksToExcel } from '@/lib/utils/exportExcel';
import { generateStudentProfilePdf, generateGroupSummaryPdf, generateAttendancePdf, generateFinalProjectReportPdf } from '@/lib/utils/exportPdf';
import {
  FileBarChart,
  FileSpreadsheet,
  FileDown,
  Printer,
  Users,
  GraduationCap,
  FolderKanban,
  CalendarDays,
  CalendarCheck2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function ReportsPage() {
  const { students, groups, projects, attendance, weeklyReports, tasks, evaluations } = useApp();

  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id || '');
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.id || '');
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || '');

  const targetGroup = groups.find(g => g.id === selectedGroup);
  const targetProject = projects.find(p => p.id === selectedProject);
  const targetStudent = students.find(s => s.id === selectedStudent);
  const targetEvaluation = evaluations.find(e => e.project_id === selectedProject);
  const groupWeekly = weeklyReports.filter(w => w.group_id === selectedGroup);

  const reportItems = [
    {
      id: 'students_dir',
      title: 'Complete Student Directory Report',
      description: 'Full roster of MES College enrolled students, register numbers, contact info, and group assignments.',
      category: 'Student Dossier',
      icon: GraduationCap,
      onExcel: () => exportStudentsToExcel(students),
      onPdf: () => targetStudent ? generateStudentProfilePdf(targetStudent) : exportStudentsToExcel(students)
    },
    {
      id: 'groups_dir',
      title: 'Project Groups Dossier Report',
      description: 'Cohort breakdown, appointed team leaders, assigned mentors, topics, and projected timelines.',
      category: 'Cohort Management',
      icon: Users,
      onExcel: () => exportGroupsToExcel(groups),
      onPdf: () => targetGroup ? generateGroupSummaryPdf(targetGroup, targetProject, groupWeekly) : exportGroupsToExcel(groups)
    },
    {
      id: 'attendance_report',
      title: 'Monthly Lab Attendance Sheet',
      description: 'Student daily presence logs, punctuality percentages, absent counts, and meeting audit records.',
      category: 'Attendance & Compliance',
      icon: CalendarDays,
      onExcel: () => exportAttendanceToExcel(attendance),
      onPdf: () => generateAttendancePdf(attendance, targetGroup?.name || 'All Groups', 'Current Month')
    },
    {
      id: 'weekly_progress',
      title: 'Chronological Weekly Progress History',
      description: 'Independent historical record of weekly sprint submissions, problem statements, and mentor approvals.',
      category: 'Sprint Tracking',
      icon: CalendarCheck2,
      onExcel: () => exportWeeklyReportsToExcel(weeklyReports),
      onPdf: () => targetGroup ? generateGroupSummaryPdf(targetGroup, targetProject, groupWeekly) : exportWeeklyReportsToExcel(weeklyReports)
    },
    {
      id: 'project_dissertation',
      title: 'Final Project Summary & Dissertation Report',
      description: 'Formal academic dossier containing architecture blueprints, tech stack, and mentor evaluation rubric.',
      category: 'Final Presentation',
      icon: FolderKanban,
      onExcel: () => exportTasksToExcel(tasks),
      onPdf: () => targetProject ? generateFinalProjectReportPdf(targetProject, targetGroup, targetEvaluation) : null
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              Institutional Documentation Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Academic Reports & PDF Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Export compliant office dossiers with official Cognilearn & MES College headers and signature blocks.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print Current View
        </button>
      </div>

      {/* Target Selection Context Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Select Report Scope Parameters
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Target Group</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.group_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Target Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.project_code} - {p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Target Student Profile</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.student_reg_no})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                    {item.category}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={item.onPdf}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  Generate PDF
                </button>
                <button
                  onClick={item.onExcel}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
