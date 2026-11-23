'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/AppContext';
import { Group, Student, Project, Task, AttendanceRecord, StudentPayment, ActivityLog, ProjectLifecyclePhases, ProjectStatus } from '@/lib/types';
import { formatDateIndian, formatDateTimeIndian, formatCurrencyIndian } from '@/lib/utils/formatters';
import {
  exportAutomatedGroupReportToExcel,
  exportAutomatedStudentReportToExcel,
  exportWeeklyReportsToExcel
} from '@/lib/utils/exportExcel';
import {
  generateAutomatedGroupReportPdf,
  generateAutomatedStudentReportPdf,
  generateStudentProfilePdf
} from '@/lib/utils/exportPdf';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import {
  CalendarCheck2,
  FileSpreadsheet,
  FileDown,
  Users,
  GraduationCap,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  CreditCard,
  FolderKanban,
  Milestone,
  CalendarDays,
  Presentation,
  TrendingUp,
  Cpu,
  Layers,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  Archive,
  BarChart3,
  Calendar,
  Activity,
  CheckCircle,
  Eye,
  ExternalLink,
  Check,
  ArrowRight
} from 'lucide-react';

/**
 * Calculates current active stage and next stage from 4 lifecycle phases
 */
function getLifecycleStageInfo(phases?: ProjectLifecyclePhases, status?: ProjectStatus) {
  const isPlanning = Boolean(phases?.planning);
  const isDesign = Boolean(phases?.design);
  const isDevelop = Boolean(phases?.development);
  const isTest = Boolean(phases?.testing);

  if (status === 'completed' || (isPlanning && isDesign && isDevelop && isTest)) {
    return {
      currentStage: 'Phase 4: Testing & QA (Completed)',
      currentStageShort: 'Testing & QA',
      currentStageNumber: 4,
      nextStage: 'University Final Evaluation & Defense',
      nextStageShort: 'Evaluation',
      allCompleted: true,
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300'
    };
  }
  if (isPlanning && isDesign && isDevelop) {
    return {
      currentStage: 'Phase 4: QA Testing & Bug Verification',
      currentStageShort: 'Testing & QA',
      currentStageNumber: 4,
      nextStage: 'Final Deployment & University Presentation',
      nextStageShort: 'Completed',
      allCompleted: false,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-300'
    };
  }
  if (isPlanning && isDesign) {
    return {
      currentStage: 'Phase 3: Core System Development & APIs',
      currentStageShort: 'Development',
      currentStageNumber: 3,
      nextStage: 'Phase 4: QA Testing & Bug Verification',
      nextStageShort: 'Testing',
      allCompleted: false,
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-300'
    };
  }
  if (isPlanning) {
    return {
      currentStage: 'Phase 2: UI/UX & Database Architecture',
      currentStageShort: 'Design',
      currentStageNumber: 2,
      nextStage: 'Phase 3: Core System Development & APIs',
      nextStageShort: 'Development',
      allCompleted: false,
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-300'
    };
  }
  return {
    currentStage: 'Phase 1: Project Scope & SRS Planning',
    currentStageShort: 'Planning',
    currentStageNumber: 1,
    nextStage: 'Phase 2: UI/UX & Database Architecture',
    nextStageShort: 'Design',
    allCompleted: false,
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300'
  };
}

export default function WeeklyProgressPage() {
  const { groups, students, projects, tasks, attendance, milestones, payments, weeklyReports, activityLogs, currentUser } = useApp();

  // Active View Tab: 'groups' | 'students' | 'audit_stream' | 'archive'
  const [activeTab, setActiveTab] = useState<'groups' | 'students' | 'audit_stream' | 'archive'>('groups');

  // Timeframe Scope: 'all' | '7days' | '30days'
  const [timeScope, setTimeScope] = useState<'all' | '7days' | '30days'>('all');

  // Filter States
  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');
  const [auditFilter, setAuditFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Group Details Modal State
  const [inspectingGroup, setInspectingGroup] = useState<Group | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'overview' | 'stages' | 'students' | 'audit'>('overview');

  // Time filtering helper
  const isWithinTimeScope = (dateStr?: string) => {
    if (!dateStr || timeScope === 'all') return true;
    const date = new Date(dateStr).getTime();
    const now = Date.now();
    const days = timeScope === '7days' ? 7 : 30;
    return now - date <= days * 86400000;
  };

  // ---------------------------------------------------------------------------
  // 1. HIGH-LEVEL GLOBAL METRICS
  // ---------------------------------------------------------------------------
  const globalMetrics = useMemo(() => {
    const totalProjects = projects.length;
    const avgProgress = totalProjects > 0
      ? Math.round(projects.reduce((acc, p) => acc + (p.progress_percentage || 0), 0) / totalProjects)
      : 0;

    const totalAtt = attendance.length;
    const presentAtt = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      avgProgress,
      totalProjects,
      attendanceRate,
      presentAtt,
      totalAtt,
      completedTasks,
      totalTasks,
      taskRate,
      totalEvents: activityLogs.length
    };
  }, [projects, attendance, tasks, activityLogs]);

  // ---------------------------------------------------------------------------
  // 2. GROUP METRICS WITH REAL-TIME CONTINUOUS SYNC
  // ---------------------------------------------------------------------------
  const groupCardsData = useMemo(() => {
    return groups.map(grp => {
      const prj = projects.find(p => p.group_id === grp.id);
      const grpStudents = students.filter(s => s.group_id === grp.id || (grp.member_ids || []).includes(s.id));
      const grpTasks = tasks.filter(t => t.group_id === grp.id || (prj && t.project_id === prj.id));
      const grpMilestones = milestones.filter(m => prj && m.project_id === prj.id);
      const grpAttendance = attendance.filter(a => a.group_id === grp.id || (a.student_id && grpStudents.some(s => s.id === a.student_id)));
      const grpPayments = payments.filter(p => grpStudents.some(s => s.id === p.student_id));

      // Filter by timeScope if applicable
      const filteredTasks = timeScope === 'all'
        ? grpTasks
        : grpTasks.filter(t => isWithinTimeScope(t.updated_at || t.created_at));

      const filteredAttendance = timeScope === 'all'
        ? grpAttendance
        : grpAttendance.filter(a => isWithinTimeScope(a.date));

      const totalAtt = filteredAttendance.length;
      const presentAtt = filteredAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
      const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

      const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
      const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress').length;
      const pendingTasks = filteredTasks.filter(t => t.status === 'todo' || t.status === 'blocked').length;

      const completedMilestones = grpMilestones.filter(m => m.status === 'completed').length;

      const feeTotal = grpPayments.reduce((acc, p) => acc + (p.total_fee || 0), 0);
      const feePaid = grpPayments.reduce((acc, p) => acc + (p.paid_amount || 0), 0);
      const feeBalance = grpPayments.reduce((acc, p) => acc + (p.balance_amount || 0), 0);
      const feeRate = feeTotal > 0 ? Math.round((feePaid / feeTotal) * 100) : 100;

      const progress = prj?.progress_percentage ?? 0;
      const presentationsCount = prj?.presentations?.length ?? 0;

      let healthStatus: 'healthy' | 'warning' | 'exceptional' = 'healthy';
      if (progress >= 75 && attendanceRate >= 85) {
        healthStatus = 'exceptional';
      } else if (attendanceRate < 75 || pendingTasks > 4) {
        healthStatus = 'warning';
      }

      // Lifecycle Stage Progression Information
      const stageInfo = getLifecycleStageInfo(prj?.lifecycle_phases, prj?.status);

      // AI Synthesis Summary for this group
      const activePhases = prj?.lifecycle_phases
        ? Object.entries(prj.lifecycle_phases)
            .filter(([_, v]) => v)
            .map(([k]) => k.toUpperCase())
            .join(', ') || 'PLANNING'
        : (prj?.status || 'PLANNING').toUpperCase();

      const aiSummary = `Cohort ${grp.name} (${grp.group_code}) is operating at ${progress}% progress velocity in ${stageInfo.currentStageShort}. Team attendance is ${attendanceRate}% with ${completedTasks}/${filteredTasks.length || 1} deliverables completed. Next target: ${stageInfo.nextStageShort}.`;

      return {
        group: grp,
        project: prj,
        students: grpStudents,
        tasks: filteredTasks,
        allTasks: grpTasks,
        attendance: filteredAttendance,
        attendanceRate,
        totalAttendance: totalAtt,
        presentAttendance: presentAtt,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        totalTasks: filteredTasks.length,
        completedMilestones,
        totalMilestones: grpMilestones.length,
        presentationsCount,
        feeTotal,
        feePaid,
        feeBalance,
        feeRate,
        progress,
        healthStatus,
        stageInfo,
        aiSummary
      };
    });
  }, [groups, projects, students, tasks, milestones, attendance, payments, timeScope]);

  // Filtered Groups
  const filteredGroups = useMemo(() => {
    return groupCardsData.filter(d => {
      const matchGroup = selectedGroupId === 'ALL' || d.group.id === selectedGroupId;
      const matchSearch = searchQuery.trim() === '' ||
        d.group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.group.group_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.project?.title && d.project.title.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchGroup && matchSearch;
    });
  }, [groupCardsData, selectedGroupId, searchQuery]);

  // ---------------------------------------------------------------------------
  // 3. STUDENT METRICS
  // ---------------------------------------------------------------------------
  const studentDirectoryData = useMemo(() => {
    return students.map(stu => {
      const grp = groups.find(g => g.id === stu.group_id);
      const prj = projects.find(p => p.group_id === stu.group_id);
      const stuTasks = tasks.filter(t => t.assigned_student_id === stu.id || (t.group_id === stu.group_id && !t.assigned_student_id));
      const stuAttendance = attendance.filter(a => a.student_id === stu.id);
      const stuPayment = payments.find(p => p.student_id === stu.id);

      const totalAtt = stuAttendance.length;
      const attended = stuAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
      const attendanceRate = totalAtt > 0 ? Math.round((attended / totalAtt) * 100) : 100;

      const completedTasks = stuTasks.filter(t => t.status === 'completed').length;
      const inProgressTasks = stuTasks.filter(t => t.status === 'in_progress').length;
      const pendingTasks = stuTasks.filter(t => t.status === 'todo' || t.status === 'blocked').length;

      const feePaid = stuPayment?.paid_amount || 0;
      const feeBalance = stuPayment?.balance_amount || 0;
      const paymentStatus = stuPayment?.status || 'unpaid';

      return {
        student: stu,
        group: grp,
        project: prj,
        tasks: stuTasks,
        attendanceRate,
        attendedSessions: attended,
        totalAttendance: totalAtt,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        totalTasks: stuTasks.length,
        feePaid,
        feeBalance,
        paymentStatus
      };
    });
  }, [students, groups, projects, tasks, attendance, payments]);

  const filteredStudents = useMemo(() => {
    return studentDirectoryData.filter(d => {
      const matchGroup = selectedGroupId === 'ALL' || d.student.group_id === selectedGroupId;
      const matchSearch = searchQuery.trim() === '' ||
        d.student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.student.student_reg_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.group?.name && d.group.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchGroup && matchSearch;
    });
  }, [studentDirectoryData, selectedGroupId, searchQuery]);

  // ---------------------------------------------------------------------------
  // 4. CONTINUOUS LIVE AUDIT STREAM
  // ---------------------------------------------------------------------------
  const filteredAuditLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const matchFilter = auditFilter === 'ALL' ||
        (auditFilter === 'TASKS' && log.entity_type === 'task') ||
        (auditFilter === 'ATTENDANCE' && log.entity_type === 'attendance') ||
        (auditFilter === 'PROJECTS' && (log.entity_type === 'project' || log.entity_type === 'milestone')) ||
        (auditFilter === 'PAYMENTS' && log.entity_type === 'payment') ||
        (auditFilter === 'GROUPS' && (log.entity_type === 'group' || log.entity_type === 'student'));

      const matchSearch = searchQuery.trim() === '' ||
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.user_name && log.user_name.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchFilter && matchSearch;
    });
  }, [activityLogs, auditFilter, searchQuery]);

  // Inspected Group Detail Record
  const inspectedRecord = useMemo(() => {
    if (!inspectingGroup) return null;
    return groupCardsData.find(d => d.group.id === inspectingGroup.id) || null;
  }, [inspectingGroup, groupCardsData]);

  // ---------------------------------------------------------------------------
  // 5. EXPORT ACTIONS
  // ---------------------------------------------------------------------------
  const handleExportExcel = () => {
    const scopeLabel = timeScope === '7days' ? 'Last 7 Days Sprint' : timeScope === '30days' ? 'Last 30 Days' : 'All-Time';
    if (activeTab === 'groups') {
      const rows = filteredGroups.map(d => ({
        group_code: d.group.group_code,
        group_name: d.group.name,
        project_title: d.project?.title || '-',
        lifecycle_status: d.project?.status.toUpperCase() || 'PLANNING',
        progress_percentage: d.progress,
        presentations_summary: `${d.presentationsCount} Round(s)`,
        milestones_summary: `${d.completedMilestones} / ${d.totalMilestones} Done`,
        tasks_summary: `${d.completedTasks} / ${d.totalTasks} Done`,
        attendance_rate: `${d.attendanceRate}% (${d.presentAttendance}/${d.totalAttendance})`,
        fee_total: d.feeTotal,
        fee_paid: d.feePaid,
        fee_balance: d.feeBalance,
        health_status: d.healthStatus.toUpperCase(),
        timeframe: scopeLabel
      }));
      exportAutomatedGroupReportToExcel(rows, `Cohort_Progress_${timeScope}.xlsx`);
    } else if (activeTab === 'students') {
      const rows = filteredStudents.map(d => ({
        student_reg_no: d.student.student_reg_no,
        full_name: d.student.full_name,
        group_code: d.group?.group_code || '-',
        group_name: d.group?.name || '-',
        assigned_role: d.student.assigned_role || 'Member',
        department: d.student.department || '-',
        attendance_rate: `${d.attendanceRate}% (${d.attendedSessions}/${d.totalAttendance})`,
        tasks_completed_count: d.completedTasks,
        tasks_total_count: d.totalTasks,
        fee_paid: d.feePaid,
        fee_balance: d.feeBalance,
        payment_status: d.paymentStatus,
        performance_rating: d.attendanceRate >= 85 ? 'Good Standing' : 'Review Needed',
        timeframe: scopeLabel
      }));
      exportAutomatedStudentReportToExcel(rows, `Student_Tracking_${timeScope}.xlsx`);
    } else {
      exportWeeklyReportsToExcel(weeklyReports, `Audit_History.xlsx`);
    }
  };

  const handleExportGroupPdf = (d: typeof groupCardsData[0]) => {
    generateAutomatedGroupReportPdf({
      groupName: d.group.name,
      groupCode: d.group.group_code,
      projectTitle: d.project?.title || 'Capstone Project',
      projectCode: d.project?.project_code || '-',
      status: d.project?.status || 'planning',
      progressPercentage: d.progress,
      timeframe: 'Continuous Audit Record',
      mentorName: d.group.mentor?.full_name || 'Assigned Mentor',
      leaderName: d.group.leader?.full_name || 'Group Lead',
      attendanceRate: d.attendanceRate,
      completedTasks: d.completedTasks,
      totalTasks: d.totalTasks,
      completedMilestones: d.completedMilestones,
      totalMilestones: d.totalMilestones,
      presentationsCount: d.presentationsCount,
      feeTotal: d.feeTotal,
      feePaid: d.feePaid,
      feeBalance: d.feeBalance,
      aiSummary: d.aiSummary,
      members: d.students.map(s => {
        const sAtt = attendance.filter(a => a.student_id === s.id);
        const sPres = sAtt.filter(a => a.status === 'present' || a.status === 'late').length;
        const sRate = sAtt.length > 0 ? `${Math.round((sPres / sAtt.length) * 100)}%` : '100%';
        return {
          name: s.full_name,
          regNo: s.student_reg_no,
          role: s.assigned_role || 'Member',
          attendance: sRate
        };
      }),
      tasksList: d.tasks.map(t => ({
        title: t.title,
        priority: t.priority,
        status: t.status,
        assignee: t.assigned_student?.full_name || 'Entire Cohort'
      }))
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              Real-Time Audit Trail
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Progress Tracking & Continuous Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Single-glance visibility into student class attendance counts, task deliverables, lifecycle stages, and group audits.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors shadow-2xs"
          >
            <FolderKanban className="w-4 h-4 text-blue-600" />
            Academic Reports & PDF Generator
          </Link>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Project Velocity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Overall Velocity</span>
            <FolderKanban className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {globalMetrics.avgProgress}%
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${globalMetrics.avgProgress}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 block">
            Across {globalMetrics.totalProjects} active project cohorts
          </span>
        </div>

        {/* Card 2: Attendance Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Lab Attendance</span>
            <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {globalMetrics.attendanceRate}%
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${globalMetrics.attendanceRate}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 block">
            {globalMetrics.presentAtt} present / {globalMetrics.totalAtt} logged marks
          </span>
        </div>

        {/* Card 3: Sprint Deliverables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Tasks Throughput</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {globalMetrics.completedTasks} <span className="text-sm font-normal text-slate-400">/ {globalMetrics.totalTasks}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${globalMetrics.taskRate}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 block">
            {globalMetrics.taskRate}% completion clearance rate
          </span>
        </div>

        {/* Card 4: Continuous Audit Stream */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>System Audit Events</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {globalMetrics.totalEvents}
          </div>
          <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Continuous Audit Recording Active
          </div>
          <span className="text-[11px] text-slate-400 block">
            Live immutable change log
          </span>
        </div>
      </div>

      {/* 3. Primary View Switcher & Time Scope Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('groups')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'groups'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            Cohort Groups ({groups.length})
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'students'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            Student Performance ({students.length})
          </button>

          <button
            onClick={() => setActiveTab('audit_stream')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'audit_stream'
                ? 'bg-white text-purple-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4 text-purple-600" />
            Continuous Audit Stream ({activityLogs.length})
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'archive'
                ? 'bg-white text-slate-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            Archives ({weeklyReports.length})
          </button>
        </div>

        {/* Time Scope Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Scope:
          </span>
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setTimeScope('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeScope === 'all' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All-Time
            </button>
            <button
              onClick={() => setTimeScope('7days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeScope === '7days' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 Days (Sprint)
            </button>
            <button
              onClick={() => setTimeScope('30days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeScope === '30days' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 30 Days
            </button>
          </div>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {activeTab !== 'audit_stream' ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-700">Filter Cohort:</span>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none shadow-2xs"
              >
                <option value="ALL">All Cohort Groups ({groups.length})</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.group_code})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-700">Audit Category:</span>
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none shadow-2xs"
              >
                <option value="ALL">All System Audit Events</option>
                <option value="TASKS">Task Deliverables</option>
                <option value="ATTENDANCE">Attendance Marking</option>
                <option value="PROJECTS">Project Lifecycle & Milestones</option>
                <option value="PAYMENTS">Fee Transactions</option>
                <option value="GROUPS">Group & Student Changes</option>
              </select>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab === 'groups' ? 'groups & topics' : activeTab === 'students' ? 'students & reg nos' : 'audit descriptions'}...`}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none shadow-2xs"
          />
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1: COHORT GROUPS MATRIX (Single Glance / "Otta Noottathil" Layout)  */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredGroups.length === 0 ? (
              <div className="col-span-2 bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
                No cohort groups match the selected filter criteria.
              </div>
            ) : (
              filteredGroups.map(d => (
                <div
                  key={d.group.id}
                  onClick={() => setInspectingGroup(d.group)}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all overflow-hidden flex flex-col justify-between cursor-pointer group/card"
                >
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200/60">
                            {d.group.group_code}
                          </span>
                          <StatusBadge status={d.project?.status || 'planning'} />
                          {d.presentationsCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                              <Presentation className="w-3 h-3" />
                              {d.presentationsCount} Round(s)
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover/card:text-blue-600 transition-colors">
                          {d.group.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {d.project?.title || 'Academic Capstone Project'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-2xl font-black text-emerald-600">
                          {d.progress}%
                        </span>
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">Velocity</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${d.progress}%` }}
                      />
                    </div>

                    {/* Current Stage & Next Upcoming Stage Flow */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                      <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Current Stage</span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-blue-600" />
                          {d.stageInfo.currentStage}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 flex-wrap gap-1 border-t border-slate-200/60 pt-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Next Target Stage</span>
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
                          {d.stageInfo.nextStage}
                        </span>
                      </div>
                    </div>

                    {/* 4 Lifecycle Phases Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      <span className="text-slate-400 font-medium mr-1 text-[10px] uppercase">Phases:</span>
                      <span className={`px-2 py-0.5 rounded-md font-semibold border ${
                        d.project?.lifecycle_phases?.planning
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200/60'
                      }`}>
                        Plan {d.project?.lifecycle_phases?.planning ? '✓' : ''}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-semibold border ${
                        d.project?.lifecycle_phases?.design
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200/60'
                      }`}>
                        Design {d.project?.lifecycle_phases?.design ? '✓' : ''}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-semibold border ${
                        d.project?.lifecycle_phases?.development
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200/60'
                      }`}>
                        Develop {d.project?.lifecycle_phases?.development ? '✓' : ''}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-semibold border ${
                        d.project?.lifecycle_phases?.testing
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200/60'
                      }`}>
                        Test {d.project?.lifecycle_phases?.testing ? '✓' : ''}
                      </span>
                    </div>

                    {/* Group Aggregated Metrics Bar */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50/80 rounded-xl text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Attendance</span>
                        <span className={`font-bold ${d.attendanceRate >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {d.attendanceRate}%
                        </span>
                        <span className="text-[10px] text-slate-400 block">{d.presentAttendance}/{d.totalAttendance} sessions</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tasks Done</span>
                        <span className="font-bold text-indigo-700">
                          {d.completedTasks} / {d.totalTasks}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{d.pendingTasks} pending</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fee Ledger</span>
                        <span className={`font-bold ${d.feeBalance === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {d.feeBalance === 0 ? '100% Paid' : formatCurrencyIndian(d.feePaid)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">Due: {formatCurrencyIndian(d.feeBalance)}</span>
                      </div>
                    </div>

                    {/* Student-by-Student Attendance & Tasks Strip (At a Single Glance) */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>Team Roster ({d.students.length} Members)</span>
                        <span>Class Attendance & Tasks</span>
                      </div>

                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {d.students.map(s => {
                          const sAtt = attendance.filter(a => a.student_id === s.id);
                          const sPres = sAtt.filter(a => a.status === 'present' || a.status === 'late').length;
                          const sTotal = sAtt.length;
                          const sRate = sTotal > 0 ? Math.round((sPres / sTotal) * 100) : 100;

                          const sTasks = d.tasks.filter(t => t.assigned_student_id === s.id || (!t.assigned_student_id && t.group_id === d.group.id));
                          const sDone = sTasks.filter(t => t.status === 'completed').length;
                          const sPending = sTasks.filter(t => t.status === 'todo' || t.status === 'blocked' || t.status === 'in_progress').length;

                          return (
                            <div key={s.id} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg text-xs border border-slate-200/60">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                                  {s.full_name[0]?.toUpperCase() || 'S'}
                                </div>
                                <div className="truncate">
                                  <span className="font-bold text-slate-800 block truncate">{s.full_name}</span>
                                  <span className="text-[10px] text-slate-400 block">{s.assigned_role || 'Member'} &middot; {s.student_reg_no}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0 text-right">
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-semibold">Attended</span>
                                  <span className={`font-bold text-xs ${sRate >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    {sPres}/{sTotal} ({sRate}%)
                                  </span>
                                </div>
                                <div className="border-l border-slate-200 pl-2">
                                  <span className="text-[10px] text-slate-400 block font-semibold">Tasks</span>
                                  <span className="font-bold text-xs text-indigo-700">
                                    {sDone} done <span className="text-slate-400 font-normal">&middot; {sPending} pend</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* AI Digest Brief */}
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-700 space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-700 font-bold text-[11px]">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Audit Brief
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-600 line-clamp-2">
                        {d.aiSummary}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2"
                  >
                    <span className="text-[11px] text-slate-500">
                      Leader: <strong className="text-slate-800">{d.group.leader?.full_name || 'Assigned Lead'}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportGroupPdf(d)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                        title="Download PDF Audit for this group"
                      >
                        <FileDown className="w-3.5 h-3.5 text-blue-600" />
                        PDF
                      </button>

                      <button
                        onClick={() => setInspectingGroup(d.group)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Audit & Stages
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2: STUDENT PERFORMANCE DIRECTORY (Clean & Structured Table)       */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              Student Academic Standing & Contribution Matrix ({filteredStudents.length} Students)
            </h3>
            <span className="text-xs text-slate-400">
              Real-time synchronization
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Register No</th>
                  <th className="p-3.5">Cohort Group</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Class Attendance Count</th>
                  <th className="p-3.5">Tasks Done / Pending</th>
                  <th className="p-3.5">Fee Clearance</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No student records match the active query.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(d => (
                    <tr key={d.student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        {d.student.full_name}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {d.student.student_reg_no}
                      </td>
                      <td className="p-3.5 font-semibold text-blue-700">
                        {d.group?.group_code || 'Unassigned'}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {d.student.assigned_role || 'Member'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${d.attendanceRate >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {d.attendedSessions} / {d.totalAttendance} classes
                          </span>
                          <span className="text-[10px] text-slate-400">({d.attendanceRate}%)</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-indigo-700">{d.completedTasks} Completed</span>
                          <span className="text-slate-400">&middot;</span>
                          <span className="text-amber-700 font-semibold">{d.pendingTasks} Pending</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={d.paymentStatus} />
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => generateStudentProfilePdf(d.student)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <FileDown className="w-3 h-3" />
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 3: CONTINUOUS LIVE AUDIT STREAM                                   */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'audit_stream' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-purple-600" />
              Live Immutable System Audit Trail ({filteredAuditLogs.length} Events)
            </h3>
            <span className="text-xs text-slate-400">
              Append-only continuous log
            </span>
          </div>

          <div className="p-4">
            {filteredAuditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No audit events logged under the active criteria.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAuditLogs.map((log) => {
                  let badgeBg = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (log.entity_type === 'task') badgeBg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                  if (log.entity_type === 'attendance') badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (log.entity_type === 'payment') badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
                  if (log.entity_type === 'project' || log.entity_type === 'milestone') badgeBg = 'bg-purple-50 text-purple-700 border-purple-200';

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50/80 transition-all flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                        <Activity className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${badgeBg}`}>
                              {log.entity_type}
                            </span>
                            <span className="font-bold text-xs text-slate-900 font-mono">
                              {log.action}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {formatDateTimeIndian(log.created_at)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 mt-1">
                          {log.description}
                        </p>

                        {log.user_name && (
                          <span className="text-[10px] text-slate-400 block pt-0.5">
                            Logged by: <strong className="text-slate-600">{log.user_name}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 4: HISTORICAL SUBMISSIONS ARCHIVE                                 */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'archive' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
            <span>
              ℹ️ <strong>Historical Archives:</strong> Stored historical sprint submissions. Real-time ongoing progress is continuously recorded via the tabs above.
            </span>
            <button
              onClick={() => exportWeeklyReportsToExcel(weeklyReports)}
              className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-lg border border-amber-300 transition-colors cursor-pointer"
            >
              Export Archive (Excel)
            </button>
          </div>

          <div className="space-y-4">
            {weeklyReports.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
                No archived weekly reports in the ledger.
              </div>
            ) : (
              weeklyReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-extrabold text-xs">
                        W{report.week_number}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">
                        Week {report.week_number} Report: {report.group?.group_code}
                      </h4>
                      <StatusBadge status={report.review_status} />
                    </div>
                    <span className="text-xs text-slate-400">
                      Period: {formatDateIndian(report.start_date)} to {formatDateIndian(report.end_date)}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-800">
                    <strong className="block text-slate-500 mb-1">Key Accomplishments:</strong>
                    {report.activities_completed}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 5. GROUP DETAILED AUDIT & STAGE HISTORY INSPECTION MODAL               */}
      {/* --------------------------------------------------------------------- */}
      {inspectingGroup && inspectedRecord && (
        <Modal
          isOpen={true}
          onClose={() => setInspectingGroup(null)}
          title={`Cohort Audit & Stage History: ${inspectedRecord.group.name}`}
          subtitle={`Group Code: ${inspectedRecord.group.group_code} | Complete Progress Lifecycle`}
          maxWidth="4xl"
        >
          <div className="space-y-5">
            {/* Top Stage Progression Banner */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl space-y-3">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-xs font-bold border border-blue-400/30">
                    {inspectedRecord.group.group_code}
                  </span>
                  <h4 className="text-base font-black text-white mt-1">
                    {inspectedRecord.project?.title || 'Academic Capstone Project'}
                  </h4>
                  <p className="text-xs text-slate-300">
                    Category: <strong className="text-white">{inspectedRecord.project?.category || 'Full-Stack Software System'}</strong> &middot; Mentor: {inspectedRecord.group.mentor?.full_name || 'Assigned Mentor'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-3xl font-black text-emerald-400">
                    {inspectedRecord.progress}%
                  </span>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Velocity</span>
                </div>
              </div>

              {/* Stage Stepper Pipeline */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Active Stage:</span>
                  <span className="font-bold text-blue-300 bg-blue-900/50 px-2.5 py-0.5 rounded border border-blue-400/30">
                    {inspectedRecord.stageInfo.currentStage}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Next Upcoming:</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1">
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                    {inspectedRecord.stageInfo.nextStage}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Internal Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setModalActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  modalActiveTab === 'overview' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Overview & Summary
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab('stages')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  modalActiveTab === 'stages' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Stage-by-Stage History (4 Phases)
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab('students')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  modalActiveTab === 'students' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Student Attendance & Deliverables ({inspectedRecord.students.length})
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab('audit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  modalActiveTab === 'audit' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Live Audit Logs
              </button>
            </div>

            {/* TAB: OVERVIEW */}
            {modalActiveTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Attendance</span>
                    <span className="text-base font-black text-emerald-700">{inspectedRecord.attendanceRate}%</span>
                    <span className="text-[10px] text-slate-500 block">{inspectedRecord.presentAttendance} / {inspectedRecord.totalAttendance} classes</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Completed Tasks</span>
                    <span className="text-base font-black text-indigo-700">{inspectedRecord.completedTasks}</span>
                    <span className="text-[10px] text-slate-500 block">of {inspectedRecord.totalTasks} deliverables</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Presentations</span>
                    <span className="text-base font-black text-purple-700">{inspectedRecord.presentationsCount}</span>
                    <span className="text-[10px] text-slate-500 block">Rounds evaluated</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Fee Clearance</span>
                    <span className="text-base font-black text-emerald-700">{inspectedRecord.feeRate}%</span>
                    <span className="text-[10px] text-slate-500 block">Due: {formatCurrencyIndian(inspectedRecord.feeBalance)}</span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs space-y-1">
                  <strong className="text-blue-900 block font-bold">Executive AI Summary:</strong>
                  <p className="text-slate-700 leading-relaxed">{inspectedRecord.aiSummary}</p>
                </div>
              </div>
            )}

            {/* TAB: STAGE-BY-STAGE HISTORY (4 PHASES) */}
            {modalActiveTab === 'stages' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Comprehensive audit verification across all 4 software engineering lifecycle stages:
                </p>

                {/* Phase 1: Planning */}
                <div className={`p-4 rounded-xl border space-y-2 ${
                  inspectedRecord.project?.lifecycle_phases?.planning ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        Phase 1
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">Project Scope & SRS Planning</h4>
                    </div>
                    <span className={`text-xs font-bold ${inspectedRecord.project?.lifecycle_phases?.planning ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {inspectedRecord.project?.lifecycle_phases?.planning ? '✓ Completed (25% Weight)' : 'Pending Verification'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Problem formulation, feasibility study, literature survey, and Software Requirements Specification (SRS) approval.
                  </p>
                </div>

                {/* Phase 2: Design */}
                <div className={`p-4 rounded-xl border space-y-2 ${
                  inspectedRecord.project?.lifecycle_phases?.design ? 'bg-purple-50/50 border-purple-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                        Phase 2
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">System Architecture & UI/UX Design</h4>
                    </div>
                    <span className={`text-xs font-bold ${inspectedRecord.project?.lifecycle_phases?.design ? 'text-purple-700' : 'text-slate-400'}`}>
                      {inspectedRecord.project?.lifecycle_phases?.design ? '✓ Completed (25% Weight)' : 'Pending Verification'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Database ER schemas, system architectural diagrams, API route contracts, and responsive UI wireframes.
                  </p>
                </div>

                {/* Phase 3: Development */}
                <div className={`p-4 rounded-xl border space-y-2 ${
                  inspectedRecord.project?.lifecycle_phases?.development ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                        Phase 3
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">Core System Development & API Integrations</h4>
                    </div>
                    <span className={`text-xs font-bold ${inspectedRecord.project?.lifecycle_phases?.development ? 'text-blue-700' : 'text-slate-400'}`}>
                      {inspectedRecord.project?.lifecycle_phases?.development ? '✓ Completed (25% Weight)' : 'In Progress'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Full-stack feature implementation, PostgreSQL table migrations, Next.js routing, and business logic execution.
                  </p>
                </div>

                {/* Phase 4: Testing */}
                <div className={`p-4 rounded-xl border space-y-2 ${
                  inspectedRecord.project?.lifecycle_phases?.testing ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                        Phase 4
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">QA Testing, Bug Fixes & Presentation Defense</h4>
                    </div>
                    <span className={`text-xs font-bold ${inspectedRecord.project?.lifecycle_phases?.testing ? 'text-amber-700' : 'text-slate-400'}`}>
                      {inspectedRecord.project?.lifecycle_phases?.testing ? '✓ Completed (25% Weight)' : 'Upcoming Target'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Unit and integration tests, cross-browser validation, bug fixes, and formal academic evaluation presentation.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: STUDENTS ATTENDANCE & DELIVERABLES */}
            {modalActiveTab === 'students' && (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Reg No</th>
                        <th className="p-2.5">Role</th>
                        <th className="p-2.5">Classes Attended</th>
                        <th className="p-2.5">Tasks Throughput</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {inspectedRecord.students.map(s => {
                        const sAtt = attendance.filter(a => a.student_id === s.id);
                        const sPres = sAtt.filter(a => a.status === 'present' || a.status === 'late').length;
                        const sTotal = sAtt.length;
                        const sRate = sTotal > 0 ? Math.round((sPres / sTotal) * 100) : 100;

                        const sTasks = inspectedRecord.tasks.filter(t => t.assigned_student_id === s.id || (!t.assigned_student_id && t.group_id === inspectedRecord.group.id));
                        const sDone = sTasks.filter(t => t.status === 'completed').length;
                        const sPending = sTasks.filter(t => t.status === 'todo' || t.status === 'blocked' || t.status === 'in_progress').length;

                        return (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{s.full_name}</td>
                            <td className="p-2.5 font-mono text-slate-500">{s.student_reg_no}</td>
                            <td className="p-2.5 font-medium">{s.assigned_role || 'Member'}</td>
                            <td className="p-2.5 font-bold text-emerald-700">
                              {sPres} / {sTotal} classes ({sRate}%)
                            </td>
                            <td className="p-2.5">
                              <span className="font-bold text-indigo-700">{sDone} Done</span> &middot; <span className="text-amber-700">{sPending} Pending</span>
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => generateStudentProfilePdf(s)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                <FileDown className="w-3 h-3" />
                                PDF
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Individual Tasks List */}
                <div>
                  <h5 className="text-xs font-bold text-slate-800 mb-2">Group Tasks & Deliverables Log:</h5>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                    {inspectedRecord.tasks.length === 0 ? (
                      <div className="p-4 text-center text-slate-400">No tasks logged for this group.</div>
                    ) : (
                      inspectedRecord.tasks.map(t => (
                        <div key={t.id} className="p-2.5 flex items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold text-slate-900 block">{t.title}</span>
                            <span className="text-[10px] text-slate-400">Owner: {t.assigned_student?.full_name || 'Entire Cohort'}</span>
                          </div>
                          <StatusBadge status={t.status} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: AUDIT LOGS */}
            {modalActiveTab === 'audit' && (
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                {activityLogs
                  .filter(l => l.entity_id === inspectedRecord.group.id || l.description.includes(inspectedRecord.group.name) || (inspectedRecord.project && l.entity_id === inspectedRecord.project.id))
                  .length === 0 ? (
                    <div className="p-6 text-center text-slate-400">No direct audit events logged for this group.</div>
                  ) : (
                    activityLogs
                      .filter(l => l.entity_id === inspectedRecord.group.id || l.description.includes(inspectedRecord.group.name) || (inspectedRecord.project && l.entity_id === inspectedRecord.project.id))
                      .map(log => (
                        <div key={log.id} className="p-2.5 flex items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-800 block">{log.action}</span>
                            <span className="text-[11px] text-slate-600">{log.description}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">{formatDateTimeIndian(log.created_at)}</span>
                        </div>
                      ))
                  )}
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInspectingGroup(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleExportGroupPdf(inspectedRecord)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                Download Formal Group Dossier (PDF)
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}