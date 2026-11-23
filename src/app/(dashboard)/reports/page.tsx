'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/context/AppContext';
import {
  exportStudentsToExcel,
  exportGroupsToExcel,
  exportAttendanceToExcel,
  exportWeeklyReportsToExcel,
  exportTasksToExcel,
  exportAutomatedGroupReportToExcel,
  exportAutomatedStudentReportToExcel
} from '@/lib/utils/exportExcel';
import {
  generateStudentProfilePdf,
  generateGroupSummaryPdf,
  generateAttendancePdf,
  generateFinalProjectReportPdf,
  generateCollegeReportPdf,
  generateFilteredGroupsPdf,
  generateFilteredStudentsPdf
} from '@/lib/utils/exportPdf';
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
  Sparkles,
  Search,
  Filter,
  ArrowUpDown,
  SlidersHorizontal,
  ExternalLink,
  Presentation,
  Check,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function ReportsPage() {
  const { colleges, courses, students, groups, projects, attendance, weeklyReports, tasks, evaluations, payments, mentors } = useApp();

  // Active Main Tab: defaults to 'groups' so user sees filtered results immediately!
  const [activeTab, setActiveTab] = useState<'groups' | 'students' | 'projects' | 'college' | 'attendance'>('groups');

  // Filter & Search Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(() => colleges[0]?.id || 'MES_DEFAULT');
  const [selectedCourseId, setSelectedCourseId] = useState('ALL');
  const [selectedGroupId, setSelectedGroupId] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<'ALL' | 'PAID' | 'DUE'>('ALL');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'progress_desc' | 'progress_asc' | 'attendance_desc' | 'code_asc'>('progress_desc');

  // Full College Dossier Modal State
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

  // College-Scoped Entities
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
    const completedProjects = collegeProjects.filter(p => p.status === 'completed' || p.progress_percentage === 100).length;
    const ongoingProjects = collegeProjects.filter(p => p.status !== 'completed' && p.progress_percentage < 100).length;

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

  // Helper map for student attendance rate
  const studentAttendanceMap = useMemo(() => {
    const map = new Map<string, { total: number; present: number; percentage: number }>();
    attendance.forEach(rec => {
      const cur = map.get(rec.student_id) || { total: 0, present: 0, percentage: 100 };
      cur.total += 1;
      if (rec.status === 'present' || rec.status === 'late') cur.present += 1;
      cur.percentage = Math.round((cur.present / cur.total) * 100);
      map.set(rec.student_id, cur);
    });
    return map;
  }, [attendance]);

  // Filtered & Sorted Groups
  const filteredGroups = useMemo(() => {
    let list = collegeGroups.filter(g => {
      if (selectedCourseId !== 'ALL' && g.course_id !== selectedCourseId) return false;
      if (selectedStatus !== 'ALL' && g.status !== selectedStatus) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const prj = collegeProjects.find(p => p.group_id === g.id);
        const nameMatch = g.name.toLowerCase().includes(query);
        const codeMatch = g.group_code.toLowerCase().includes(query);
        const projectMatch = (prj?.title || g.project_title || '').toLowerCase().includes(query);
        const mentorMatch = (g.mentor?.full_name || '').toLowerCase().includes(query);
        return nameMatch || codeMatch || projectMatch || mentorMatch;
      }
      return true;
    });

    list.sort((a, b) => {
      const prjA = collegeProjects.find(p => p.group_id === a.id);
      const prjB = collegeProjects.find(p => p.group_id === b.id);
      const progA = prjA?.progress_percentage ?? 0;
      const progB = prjB?.progress_percentage ?? 0;

      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'code_asc') return a.group_code.localeCompare(b.group_code);
      if (sortBy === 'progress_desc') return progB - progA;
      if (sortBy === 'progress_asc') return progA - progB;
      return 0;
    });

    return list;
  }, [collegeGroups, collegeProjects, selectedCourseId, selectedStatus, searchTerm, sortBy]);

  // Filtered & Sorted Students
  const filteredStudents = useMemo(() => {
    let list = collegeStudents.filter(s => {
      if (selectedGroupId !== 'ALL' && s.group_id !== selectedGroupId) return false;
      if (selectedCourseId !== 'ALL' && s.course_id !== selectedCourseId) return false;
      if (selectedStatus !== 'ALL' && s.status !== selectedStatus) return false;

      const pay = collegePayments.find(p => p.student_id === s.id);
      if (selectedPaymentStatus === 'PAID') {
        if (pay && pay.balance_amount > 0) return false;
      } else if (selectedPaymentStatus === 'DUE') {
        if (!pay || pay.balance_amount <= 0) return false;
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const grp = collegeGroups.find(g => g.id === s.group_id);
        const nameMatch = s.full_name.toLowerCase().includes(query);
        const regMatch = s.student_reg_no.toLowerCase().includes(query);
        const emailMatch = (s.email || '').toLowerCase().includes(query);
        const groupMatch = (grp?.name || grp?.group_code || '').toLowerCase().includes(query);
        return nameMatch || regMatch || emailMatch || groupMatch;
      }
      return true;
    });

    list.sort((a, b) => {
      const attA = studentAttendanceMap.get(a.id)?.percentage ?? 100;
      const attB = studentAttendanceMap.get(b.id)?.percentage ?? 100;

      if (sortBy === 'name_asc') return a.full_name.localeCompare(b.full_name);
      if (sortBy === 'name_desc') return b.full_name.localeCompare(a.full_name);
      if (sortBy === 'code_asc') return a.student_reg_no.localeCompare(b.student_reg_no);
      if (sortBy === 'attendance_desc') return attB - attA;
      return 0;
    });

    return list;
  }, [collegeStudents, collegeGroups, collegePayments, studentAttendanceMap, selectedGroupId, selectedCourseId, selectedStatus, selectedPaymentStatus, searchTerm, sortBy]);

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    let list = collegeProjects.filter(p => {
      const grp = collegeGroups.find(g => g.id === p.group_id);
      if (selectedGroupId !== 'ALL' && p.group_id !== selectedGroupId) return false;
      if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const titleMatch = p.title.toLowerCase().includes(query);
        const codeMatch = p.project_code.toLowerCase().includes(query);
        const groupMatch = (grp?.name || grp?.group_code || '').toLowerCase().includes(query);
        const techMatch = (p.technologies || []).some(t => t.toLowerCase().includes(query));
        return titleMatch || codeMatch || groupMatch || techMatch;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'name_asc') return a.title.localeCompare(b.title);
      if (sortBy === 'name_desc') return b.title.localeCompare(a.title);
      if (sortBy === 'code_asc') return a.project_code.localeCompare(b.project_code);
      if (sortBy === 'progress_desc') return (b.progress_percentage || 0) - (a.progress_percentage || 0);
      if (sortBy === 'progress_asc') return (a.progress_percentage || 0) - (b.progress_percentage || 0);
      return 0;
    });

    return list;
  }, [collegeProjects, collegeGroups, selectedGroupId, selectedStatus, searchTerm, sortBy]);

  // Download College Official PDF
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

  // Download Exact Filtered Results as PDF
  const handleDownloadFilteredPdf = () => {
    const filterContext = searchTerm ? `Query: "${searchTerm}"` : `Cohort Filter: ${currentCollege.name}`;
    if (activeTab === 'students') {
      generateFilteredStudentsPdf(filteredStudents, collegePayments, studentAttendanceMap, `Student Academic & Fee Ledger (${filterContext})`);
    } else if (activeTab === 'projects') {
      generateFilteredGroupsPdf(filteredGroups, filteredProjects, `Academic Projects & Dissertation Portfolio (${filterContext})`);
    } else if (activeTab === 'attendance') {
      generateAttendancePdf(collegeAttendance, currentCollege.name, 'Filtered Lab Attendance Sessions');
    } else {
      generateFilteredGroupsPdf(filteredGroups, collegeProjects, `Cohort Groups Directory (${filterContext})`);
    }
  };

  // Export Active Tab to Excel
  const handleExportActiveTabExcel = () => {
    if (activeTab === 'groups' || activeTab === 'college') {
      exportGroupsToExcel(filteredGroups, `${currentCollege.code || 'MES'}_Filtered_Groups.xlsx`);
    } else if (activeTab === 'students') {
      exportStudentsToExcel(filteredStudents, `${currentCollege.code || 'MES'}_Filtered_Students.xlsx`);
    } else if (activeTab === 'attendance') {
      exportAttendanceToExcel(collegeAttendance, `${currentCollege.code || 'MES'}_Filtered_Attendance.xlsx`);
    } else if (activeTab === 'projects') {
      exportTasksToExcel(tasks, `${currentCollege.code || 'MES'}_Filtered_Projects_Tasks.xlsx`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              Institutional Documentation & Audit Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Academic Reports & PDF Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Download institutional dossiers, group-wise cohort reports, single student profiles, and filtered PDF/Excel sheets.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDownloadCollegePdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            Download College PDF
          </button>
          <button
            onClick={handleExportActiveTabExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Tab to Excel
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Featured Institutional Banner with Live KPIs */}
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
                    Active Institution
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
              <label className="text-xs text-slate-300 font-medium shrink-0">Switch Institution:</label>
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
                  <option value="MES_DEFAULT">MES College of Engineering & Technology</option>
                )}
              </select>
            </div>
          </div>

          {/* KPI Cards Strip */}
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
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Project Velocity</span>
              <p className="text-lg font-black text-blue-400 mt-0.5">{collegeMetrics.avgProgress}%</p>
              <span className="text-[10px] text-slate-400">{collegeMetrics.completedProjects} Completed</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Lab Attendance</span>
              <p className="text-lg font-black text-white mt-0.5">{collegeMetrics.attendancePercentage}%</p>
              <span className="text-[10px] text-slate-400">Compliance Rate</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fee Collected</span>
              <p className="text-lg font-black text-emerald-400 mt-0.5">{formatCurrencyIndian(collegeMetrics.totalFeeCollected)}</p>
              <span className="text-[10px] text-slate-400">Realized Collections</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fee Outstanding</span>
              <p className="text-lg font-black text-rose-300 mt-0.5">{formatCurrencyIndian(collegeMetrics.totalFeePending)}</p>
              <span className="text-[10px] text-rose-300/80">Pending Recovery</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/60">
            <p className="text-xs text-slate-400">
              Official university-compliant reporting documents with institution seals and mentor sign-offs.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCollegeModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold border border-white/20 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                View Full Dossier
              </button>
              <button
                type="button"
                onClick={handleDownloadCollegePdf}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                Download Master PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter, Search, and Sort Control Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Real-Time Instant Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Instant search by name, student reg no, group code, project title, or tech stack..."
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          {/* Quick Clear Filter if active */}
          {(searchTerm || selectedCourseId !== 'ALL' || selectedGroupId !== 'ALL' || selectedStatus !== 'ALL' || selectedPaymentStatus !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCourseId('ALL');
                setSelectedGroupId('ALL');
                setSelectedStatus('ALL');
                setSelectedPaymentStatus('ALL');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 self-end lg:self-center cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>

        {/* Multi-Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Department / Course Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Course / Dept</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {collegeDepartments.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Cohort Group Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cohort Group</label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Groups</option>
              {collegeGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.group_code})</option>
              ))}
            </select>
          </div>

          {/* Lifecycle Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="completed">Completed (100%)</option>
              <option value="testing">Testing Phase</option>
              <option value="development">Development Phase</option>
              <option value="design">Design Phase</option>
              <option value="planning">Planning Phase</option>
              <option value="active">Active</option>
            </select>
          </div>

          {/* Fee Payment Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fee Payment</label>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Payment States</option>
              <option value="PAID">Fully Paid</option>
              <option value="DUE">Outstanding Balance</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="progress_desc">Progress (High → Low)</option>
              <option value="progress_asc">Progress (Low → High)</option>
              <option value="name_asc">Name (A → Z)</option>
              <option value="name_desc">Name (Z → A)</option>
              <option value="code_asc">Code / Reg No</option>
              <option value="attendance_desc">Attendance % (High → Low)</option>
            </select>
          </div>
        </div>

        {/* Filtered Search Results Action Banner (Direct Download of Filtered Results) */}
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/90 p-4 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider">
                Filtered Active Results
              </span>
              <span className="text-xs font-bold text-slate-900">
                {filteredGroups.length} Cohort Groups &middot; {filteredStudents.length} Students Matching Criteria
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click below to download an official PDF or Excel dossier matching your exact filter and sort choices.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadFilteredPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Download Filtered Results as PDF"
            >
              <FileDown className="w-4 h-4" />
              Download Filtered PDF
            </button>

            <button
              onClick={handleExportActiveTabExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Download Filtered Results as Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Filtered Excel
            </button>
          </div>
        </div>
      </div>

      {/* Segmented Interactive Report Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('groups')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'groups'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Cohort Groups Report ({filteredGroups.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'students'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Single Student Ledger ({filteredStudents.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'projects'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          Project Portfolios ({filteredProjects.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('college')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'college'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Institutional Dossier Cards
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'attendance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Lab Attendance Sheets ({collegeAttendance.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: COHORT GROUPS REPORT (Group-Wise Live View & One-Click PDF)        */}
      {/* ========================================================================= */}
      {activeTab === 'groups' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cohort Project Groups Registry</h3>
              <p className="text-xs text-slate-500">
                Filtered: {filteredGroups.length} of {collegeGroups.length} groups. Download group-wise summaries or batch Excel.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadFilteredPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                Filtered Groups PDF
              </button>
              <button
                onClick={() => exportGroupsToExcel(filteredGroups, `${currentCollege.code || 'MES'}_Groups_Filtered.xlsx`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export Groups XLSX
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                  <th className="py-3 px-4">Group Code</th>
                  <th className="py-3 px-4">Group Name</th>
                  <th className="py-3 px-4">Project Title</th>
                  <th className="py-3 px-4">Leader / Mentor</th>
                  <th className="py-3 px-4">Phases Verified</th>
                  <th className="py-3 px-4">Velocity</th>
                  <th className="py-3 px-4 text-right">Group PDF Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No cohort groups match your active filters.
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((g) => {
                    const prj = collegeProjects.find(p => p.group_id === g.id) || g.project;
                    const progress = prj?.progress_percentage ?? 0;
                    const phases = prj?.lifecycle_phases;

                    return (
                      <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">
                          {g.group_code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{g.name}</div>
                          <div className="text-[10px] text-slate-400">{g.members?.length || 0} Members</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-[220px]">
                          <div className="font-semibold truncate">{prj?.title || g.project_title || 'N/A'}</div>
                          <div className="text-[10px] text-slate-400 truncate">{prj?.category || 'Full-Stack Software System'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{g.leader?.full_name || 'Leader Assigned'}</div>
                          <div className="text-[10px] text-blue-600 font-medium">Mentor: {g.mentor?.full_name || 'Assigned Mentor'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 flex-wrap text-[10px]">
                            <span className={`px-1.5 py-0.5 rounded font-semibold ${phases?.planning ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                              Plan {phases?.planning ? '✓' : ''}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded font-semibold ${phases?.design ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-400'}`}>
                              Design {phases?.design ? '✓' : ''}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded font-semibold ${phases?.development ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-400'}`}>
                              Dev {phases?.development ? '✓' : ''}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded font-semibold ${phases?.testing ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'}`}>
                              Test {phases?.testing ? '✓' : ''}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-800">{progress}%</span>
                            <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => generateGroupSummaryPdf(g, prj, weeklyReports.filter(w => w.group_id === g.id))}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Download Group Summary PDF"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            Group PDF
                          </button>
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

      {/* ========================================================================= */}
      {/* TAB 2: SINGLE STUDENT ACADEMIC & FEE LEDGER                               */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Student Academic Standing & Fee Dossier</h3>
              <p className="text-xs text-slate-500">
                Filtered: {filteredStudents.length} of {collegeStudents.length} enrolled students. Download single student profiles or batch Excel.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadFilteredPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                Filtered Students PDF
              </button>
              <button
                onClick={() => exportStudentsToExcel(filteredStudents, `${currentCollege.code || 'MES'}_Students_Filtered.xlsx`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export Students XLSX
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                  <th className="py-3 px-4">Reg No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Course / Dept</th>
                  <th className="py-3 px-4">Cohort Group</th>
                  <th className="py-3 px-4">Attendance Rate</th>
                  <th className="py-3 px-4">Fee Clearance</th>
                  <th className="py-3 px-4 text-right">Student PDF Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No student records match your active search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const pay = collegePayments.find(p => p.student_id === s.id);
                    const grp = collegeGroups.find(g => g.id === s.group_id);
                    const att = studentAttendanceMap.get(s.id) || { total: 0, present: 0, percentage: 100 };

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {s.student_reg_no}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{s.full_name}</div>
                          <div className="text-[10px] text-slate-400">{s.email || '-'}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {s.course?.name || s.department || 'Degree Program'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-blue-700">{grp?.group_code || 'Unassigned'}</span>
                          <span className="block text-[10px] text-slate-500">{s.assigned_role}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold ${att.percentage >= 85 ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {att.percentage}%
                            </span>
                            <span className="text-[10px] text-slate-400">({att.present}/{att.total || 0} classes)</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {pay?.status === 'paid' || (pay && pay.balance_amount <= 0) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                              <Check className="w-3 h-3" /> Paid Full
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                              Due: {formatCurrencyIndian(pay?.balance_amount ?? 5000)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => generateStudentProfilePdf(s)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Download Official Student Profile PDF"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            Single PDF
                          </button>
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

      {/* ========================================================================= */}
      {/* TAB 3: PROJECT PORTFOLIOS & MILESTONES                                    */}
      {/* ========================================================================= */}
      {activeTab === 'projects' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Project Architectures & Dissertation Portfolios</h3>
              <p className="text-xs text-slate-500">Showing {filteredProjects.length} of {collegeProjects.length} registered projects.</p>
            </div>
            <button
              onClick={() => exportTasksToExcel(tasks, `${currentCollege.code || 'MES'}_Projects_Tasks.xlsx`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export Tasks XLSX
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Project Title</th>
                  <th className="py-3 px-4">Category & Stack</th>
                  <th className="py-3 px-4">Lifecycle Phases</th>
                  <th className="py-3 px-4">Presentations</th>
                  <th className="py-3 px-4">Velocity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No project portfolios match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p) => {
                    const grp = collegeGroups.find(g => g.id === p.group_id);
                    const evalRecord = evaluations.find(e => e.project_id === p.id);
                    const phases = p.lifecycle_phases;
                    const presCount = p.presentations?.length || 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">
                          {p.project_code}
                        </td>
                        <td className="py-3 px-4 max-w-[220px]">
                          <div className="font-bold text-slate-900 truncate">{p.title}</div>
                          <div className="text-[10px] text-slate-400">Cohort: {grp?.name || 'Group'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-800 font-semibold">{p.category}</div>
                          <div className="flex items-center gap-1 flex-wrap mt-0.5">
                            {(p.technologies || []).slice(0, 3).map((t, idx) => (
                              <span key={idx} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 flex-wrap text-[10px]">
                            <span className={`px-1.5 py-0.5 rounded font-semibold ${phases?.planning ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                              Plan {phases?.planning ? '✓' : ''}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded font-semibold ${phases?.design ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-400'}`}>
                              Design {phases?.design ? '✓' : ''}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded font-semibold ${phases?.development ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-400'}`}>
                              Dev {phases?.development ? '✓' : ''}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded font-semibold ${phases?.testing ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'}`}>
                              Test {phases?.testing ? '✓' : ''}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Presentation className="w-3 h-3" />
                            {presCount} {presCount === 1 ? 'Round' : 'Rounds'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-800">{p.progress_percentage}%</span>
                            <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${p.progress_percentage === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                style={{ width: `${p.progress_percentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => generateFinalProjectReportPdf(p, grp, evalRecord)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Download Final Project Dissertation PDF"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            Project PDF
                          </button>
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

      {/* ========================================================================= */}
      {/* TAB 4: INSTITUTIONAL DOSSIER CARDS                                        */}
      {/* ========================================================================= */}
      {activeTab === 'college' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Quick Export Card 1: College Master */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                    Institutional
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Institutional Master Dossier</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Full institutional report including affiliated departments, cohort groups, students roster, fee collections, and project milestones.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCollegePdf}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  Generate PDF
                </button>
                <button
                  type="button"
                  onClick={() => exportStudentsToExcel(collegeStudents)}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </button>
              </div>
            </div>

            {/* Quick Export Card 2: Student Roster */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                    Student Ledger
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Complete Student Directory</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Enrolled student roster, university registration numbers, contact directory, and assigned group roles.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadFilteredPdf}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  Generate PDF
                </button>
                <button
                  type="button"
                  onClick={() => exportStudentsToExcel(filteredStudents)}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </button>
              </div>
            </div>

            {/* Quick Export Card 3: Groups Dossier */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                    Cohorts
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Project Groups Dossier</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Cohort breakdown, appointed team leaders, assigned mentors, topics, and projected timelines.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadFilteredPdf}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  Generate PDF
                </button>
                <button
                  type="button"
                  onClick={() => exportGroupsToExcel(filteredGroups)}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </button>
              </div>
            </div>
          </div>

          {/* Department Breakdown Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Academic Departments & Courses</h3>
                <p className="text-xs text-slate-500">Distribution of enrolled students and active cohort groups across degree programs.</p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                {collegeDepartments.length} Departments
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {collegeDepartments.map((dept) => {
                const deptStudents = collegeStudents.filter(s => s.course_id === dept.id || s.department === dept.name);
                const deptGroups = collegeGroups.filter(g => g.course_id === dept.id);

                return (
                  <div key={dept.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{dept.name}</h4>
                      <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-600">
                        {dept.code || 'DEPT'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                      <span>{deptStudents.length} Students</span>
                      <span>{deptGroups.length} Project Groups</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: LAB ATTENDANCE AUDIT                                               */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Lab Attendance & Punctuality Audit Sheet</h3>
              <p className="text-xs text-slate-500">Official log of lab sessions, presence stamps, and leave records.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => generateAttendancePdf(collegeAttendance, currentCollege.name, 'All Recorded Sessions')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                Attendance PDF
              </button>
              <button
                onClick={() => exportAttendanceToExcel(collegeAttendance, `${currentCollege.code || 'MES'}_Attendance_Ledger.xlsx`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reg No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Cohort Group</th>
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {collegeAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No attendance records found for this institution.
                    </td>
                  </tr>
                ) : (
                  collegeAttendance.slice(0, 50).map((a) => {
                    const stu = collegeStudents.find(s => s.id === a.student_id);
                    const grp = collegeGroups.find(g => g.id === a.group_id || g.id === stu?.group_id);

                    return (
                      <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {formatDateIndian(a.date)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {stu?.student_reg_no || '-'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {stu?.full_name || 'Student'}
                        </td>
                        <td className="py-3 px-4 font-bold text-blue-700">
                          {grp?.group_code || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {a.session_type === 'daily' ? 'Daily Lab' : 'Project Review'}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={a.status} />
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">
                          {a.remarks || '-'}
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
                  collegeActiveTab === 'groups' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Project Groups ({collegeGroups.length})
              </button>

              <button
                type="button"
                onClick={() => setCollegeActiveTab('students')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  collegeActiveTab === 'students' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Students & Fee Ledger ({collegeStudents.length})
              </button>

              <button
                type="button"
                onClick={() => setCollegeActiveTab('departments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  collegeActiveTab === 'departments' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Departments & Courses ({collegeDepartments.length})
              </button>
            </div>

            {/* Tab 1 inside Modal */}
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
                                <span className="font-bold text-slate-800">{proj?.progress_percentage || 0}%</span>
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

            {/* Tab 2 inside Modal */}
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
                        <th className="py-2.5 px-3">Fee Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {collegeStudents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
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
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3 inside Modal */}
            {collegeActiveTab === 'departments' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {collegeDepartments.length === 0 ? (
                  <div className="col-span-2 p-8 text-center text-slate-400 text-xs">
                    No departments configured for this college.
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