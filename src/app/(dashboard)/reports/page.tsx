'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { exportStudentsToExcel, exportGroupsToExcel, exportAttendanceToExcel, exportWeeklyReportsToExcel, exportTasksToExcel } from '@/lib/utils/exportExcel';
import { generateStudentProfilePdf, generateGroupSummaryPdf, generateAttendancePdf, generateFinalProjectReportPdf, generateCollegeReportPdf } from '@/lib/utils/exportPdf';
import { formatCurrencyIndian, formatDateIndian } from '@/lib/utils/formatters';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/common/StatusBadge';
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
  Building2,
  Eye,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Layers,
  Sparkles
} from 'lucide-react';

export default function ReportsPage() {
  const { colleges, courses, students, groups, projects, attendance, weeklyReports, tasks, evaluations, payments } = useApp();

  // Selected Scope States
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(() => {
    return colleges[0]?.id || 'MES_DEFAULT';
  });
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id || '');
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.id || '');
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || '');
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [collegeActiveTab, setCollegeActiveTab] = useState<'groups' | 'students' | 'departments'>('groups');

  // Resolved College Object
  const currentCollege = useMemo(() => {
    const found = colleges.find(c => c.id === selectedCollegeId);
    if (found) return found;
    return {
      id: selectedCollegeId || 'MES_DEFAULT',
      name: colleges[0]?.name || 'MES College of Engineering & Technology',
      code: colleges[0]?.code || 'MES-INST',
      created_at: new Date().toISOString()
    };
  }, [colleges, selectedCollegeId]);

  // College-Filtered Entities
  const collegeStudents = useMemo(() => {
    if (!students || !Array.isArray(students)) return [];
    if (colleges.length === 0 || selectedCollegeId === 'MES_DEFAULT') return students;
    const filtered = students.filter(s => s && s.college_id === selectedCollegeId);
    return filtered.length > 0 ? filtered : students;
  }, [students, colleges, selectedCollegeId]);

  const collegeGroups = useMemo(() => {
    if (!groups || !Array.isArray(groups)) return [];
    if (colleges.length === 0 || selectedCollegeId === 'MES_DEFAULT') return groups;
    const filtered = groups.filter(g => g && g.college_id === selectedCollegeId);
    return filtered.length > 0 ? filtered : groups;
  }, [groups, colleges, selectedCollegeId]);

  const collegeProjects = useMemo(() => {
    if (!projects || !Array.isArray(projects)) return [];
    const groupIds = new Set(collegeGroups.map(g => g.id));
    return projects.filter(p => p && groupIds.has(p.group_id));
  }, [projects, collegeGroups]);

  const collegePayments = useMemo(() => {
    if (!payments || !Array.isArray(payments)) return [];
    const studentIds = new Set(collegeStudents.map(s => s.id));
    return payments.filter(p => p && studentIds.has(p.student_id));
  }, [payments, collegeStudents]);

  const collegeAttendance = useMemo(() => {
    if (!attendance || !Array.isArray(attendance)) return [];
    const studentIds = new Set(collegeStudents.map(s => s.id));
    return attendance.filter(a => a && studentIds.has(a.student_id));
  }, [attendance, collegeStudents]);

  const collegeDepartments = useMemo(() => {
    if (!courses || !Array.isArray(courses)) return [];
    if (colleges.length === 0 || selectedCollegeId === 'MES_DEFAULT') return courses;
    const filtered = courses.filter(c => c && c.college_id === selectedCollegeId);
    return filtered.length > 0 ? filtered : courses;
  }, [courses, colleges, selectedCollegeId]);

  // Aggregated Stats for Current College
  const collegeMetrics = useMemo(() => {
    const totalStudents = collegeStudents.length;
    const totalGroups = collegeGroups.length;
    const totalProjects = collegeProjects.length;
    const completedProjects = collegeProjects.filter(p => p.status === 'completed').length;
    const ongoingProjects = collegeProjects.filter(p => p.status === 'in_progress').length;

    const avgProgress = collegeProjects.length > 0
      ? Math.round(collegeProjects.reduce((acc, p) => acc + (p.progress_percentage || 0), 0) / collegeProjects.length)
      : 0;

    const totalFeeCollected = collegePayments.reduce((acc, p) => acc + ((p && p.paid_amount) || 0), 0);
    const totalFeePending = collegePayments.reduce((acc, p) => acc + ((p && p.balance_amount) || 0), 0);

    const totalAtt = collegeAttendance.length;
    const presentAtt = collegeAttendance.filter(a => a && (a.status === 'present' || a.status === 'late')).length;
    const attendancePercentage = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

    return {
      totalStudents,
      totalGroups,
      totalProjects,
      completedProjects,
      ongoingProjects,
      avgProgress,
      totalFeeCollected,
      totalFeePending,
      attendancePercentage
    };
  }, [collegeStudents, collegeGroups, collegeProjects, collegePayments, collegeAttendance]);

  const handleDownloadCollegePdf = () => {
    generateCollegeReportPdf({
      college: currentCollege,
      departments: collegeDepartments,
      students: collegeStudents,
      groups: collegeGroups,
      projects: collegeProjects,
      payments: collegePayments,
      attendance: collegeAttendance
    });
  };

  const targetGroup = groups.find(g => g.id === selectedGroup);
  const targetProject = projects.find(p => p.id === selectedProject);
  const targetStudent = students.find(s => s.id === selectedStudent);
  const targetEvaluation = evaluations.find(e => e.project_id === selectedProject);
  const groupWeekly = weeklyReports.filter(w => w.group_id === selectedGroup);

  const reportItems = [
    {
      id: 'college_master',
      title: 'Institutional College Comprehensive Dossier',
      description: 'Full institutional report: affiliated departments, cohort groups, students roster, fee collections, and project milestones.',
      category: 'Institutional Audit',
      icon: Building2,
      onExcel: () => exportStudentsToExcel(collegeStudents),
      onPdf: handleDownloadCollegePdf
    },
    {
      id: 'students_dir',
      title: 'Complete Student Directory Report',
      description: 'Full roster of enrolled students, register numbers, contact info, and group assignments.',
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
            Export compliant office dossiers with official Cognilearn institutional headers, signatures, and stamps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCollegePdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Download College PDF
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print View
          </button>
        </div>
      </div>

      {/* Featured Institutional College Report Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-md border border-slate-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    College Master Dossier
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Code: {currentCollege.code || 'N/A'}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                  {currentCollege.name}
                </h2>
              </div>
            </div>

            {/* Select College Dropdown */}
            <div className="flex items-center gap-2.5">
              <label className="text-xs text-slate-300 font-medium shrink-0">Switch College:</label>
              <select
                value={selectedCollegeId}
                onChange={(e) => setSelectedCollegeId(e.target.value)}
                className="bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {colleges.length > 0 ? (
                  colleges.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name} ({col.code || 'INST'})
                    </option>
                  ))
                ) : (
                  <option value="MES_DEFAULT">MES College (General Institution)</option>
                )}
              </select>
            </div>
          </div>

          {/* Quick Metrics KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Students</span>
              <p className="text-lg font-black text-white mt-0.5">{collegeMetrics.totalStudents}</p>
              <span className="text-[10px] text-slate-400">Enrolled Roster</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Project Groups</span>
              <p className="text-lg font-black text-white mt-0.5">{collegeMetrics.totalGroups}</p>
              <span className="text-[10px] text-slate-400">Active Cohorts</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Projects Active</span>
              <p className="text-lg font-black text-blue-400 mt-0.5">{collegeMetrics.ongoingProjects}</p>
              <span className="text-[10px] text-slate-400">{collegeMetrics.completedProjects} Completed</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Avg Progress</span>
              <p className="text-lg font-black text-white mt-0.5">{collegeMetrics.avgProgress}%</p>
              <div className="w-full bg-slate-700 h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${collegeMetrics.avgProgress}%` }} />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fee Collected</span>
              <p className="text-lg font-black text-emerald-400 mt-0.5">{formatCurrencyIndian(collegeMetrics.totalFeeCollected)}</p>
              <span className="text-[10px] text-rose-300">Due: {formatCurrencyIndian(collegeMetrics.totalFeePending)}</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Lab Attendance</span>
              <p className="text-lg font-black text-white mt-0.5">{collegeMetrics.attendancePercentage}%</p>
              <span className="text-[10px] text-slate-400">Punctuality Score</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/60">
            <p className="text-xs text-slate-400">
              Official institutional audit dossier compliant with university criteria. Contains student ledgers and mentor signatures.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCollegeModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold border border-white/20 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                View Full Dossier
              </button>

              <button
                type="button"
                onClick={handleDownloadCollegePdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                Print / Download PDF Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Target Selection Context Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Select Individual Report Scope Parameters
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Target Group</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.student_reg_no})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reportItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
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

                <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={item.onPdf}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  Generate PDF
                </button>
                <button
                  type="button"
                  onClick={item.onExcel}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full On-Screen College Dossier Modal */}
      {showCollegeModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowCollegeModal(false)}
          title={`Institutional Report: ${currentCollege.name}`}
          subtitle={`College Code: ${currentCollege.code || 'N/A'} | Enrolled Cohort Dossier`}
          maxWidth="4xl"
        >
          <div className="space-y-6">
            {/* Top Bar inside Modal */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">{currentCollege.name}</span>
                  <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                    {currentCollege.code || 'INST'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {collegeMetrics.totalStudents} Students &middot; {collegeMetrics.totalGroups} Project Groups &middot; Fee Collected: {formatCurrencyIndian(collegeMetrics.totalFeeCollected)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCollegePdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Export Official PDF
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setCollegeActiveTab('groups')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  collegeActiveTab === 'groups'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Project Groups ({collegeGroups.length})
              </button>

              <button
                type="button"
                onClick={() => setCollegeActiveTab('students')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  collegeActiveTab === 'students'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Students & Fee Ledger ({collegeStudents.length})
              </button>

              <button
                type="button"
                onClick={() => setCollegeActiveTab('departments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  collegeActiveTab === 'departments'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Departments & Courses ({collegeDepartments.length})
              </button>
            </div>

            {/* Tab 1: Project Groups & Dissertations */}
            {collegeActiveTab === 'groups' && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3">Group Name</th>
                        <th className="py-2.5 px-3">Project Title</th>
                        <th className="py-2.5 px-3">Leader</th>
                        <th className="py-2.5 px-3">Progress</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {collegeGroups.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No project groups formed under this college yet.
                          </td>
                        </tr>
                      ) : (
                        collegeGroups.map((g) => {
                          const proj = collegeProjects.find(p => p.group_id === g.id) || g.project;
                          return (
                            <tr key={g.id} className="hover:bg-slate-50/70">
                              <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{g.group_code}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900">{g.name}</td>
                              <td className="py-2.5 px-3 text-slate-700 max-w-[200px] truncate">
                                {proj?.title || g.project_title || 'N/A'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">{g.leader?.full_name || 'Assigned'}</td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800">{proj?.progress_percentage || 0}%</span>
                                  <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${proj?.progress_percentage || 0}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <StatusBadge status={g.status || 'active'} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 2: Students Roster & Fee Ledger */}
            {collegeActiveTab === 'students' && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                        <th className="py-2.5 px-3">Reg No</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Course / Dept</th>
                        <th className="py-2.5 px-3">Group</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Fee Status</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {collegeStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No students enrolled under this college yet.
                          </td>
                        </tr>
                      ) : (
                        collegeStudents.map((s) => {
                          const pay = collegePayments.find(p => p.student_id === s.id);
                          const grp = collegeGroups.find(g => g.id === s.group_id);
                          return (
                            <tr key={s.id} className="hover:bg-slate-50/70">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{s.student_reg_no}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900">{s.full_name}</td>
                              <td className="py-2.5 px-3 text-slate-600">{s.course?.name || s.department || 'N/A'}</td>
                              <td className="py-2.5 px-3 font-bold text-blue-700">{grp?.group_code || 'Unassigned'}</td>
                              <td className="py-2.5 px-3 text-slate-600">{s.assigned_role}</td>
                              <td className="py-2.5 px-3">
                                {pay?.status === 'paid' ? (
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                    Paid
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px]">
                                    Due: {formatCurrencyIndian(pay?.balance_amount ?? 5000)}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <StatusBadge status={s.status} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Departments & Courses */}
            {collegeActiveTab === 'departments' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {collegeDepartments.length === 0 ? (
                  <div className="col-span-2 p-8 text-center text-slate-400 text-xs">
                    No departments or courses configured for this college.
                  </div>
                ) : (
                  collegeDepartments.map((dept) => {
                    const deptStudents = collegeStudents.filter(s => s.course_id === dept.id || s.department === dept.name);
                    return (
                      <div key={dept.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{dept.name}</h4>
                          <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-600">
                            {dept.code || 'DEPT'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {deptStudents.length} Students enrolled
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDownloadCollegePdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                Download Complete College PDF
              </button>

              <button
                type="button"
                onClick={() => setShowCollegeModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
