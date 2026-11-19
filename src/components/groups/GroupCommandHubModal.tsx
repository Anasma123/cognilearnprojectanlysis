'use client';

import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Group, Project, ProjectMilestone, Task, WeeklyReport, AttendanceRecord, Student, StudentPayment, PaymentMode, TaskPriority, TaskStatus, MilestoneStatus } from '@/lib/types';
import { useApp } from '@/lib/context/AppContext';
import { formatCurrencyIndian, formatDateIndian } from '@/lib/utils/formatters';
import { StatusBadge } from '../common/StatusBadge';
import { generateGroupSummaryPdf } from '@/lib/utils/exportPdf';
import {
  Users,
  FolderKanban,
  Milestone,
  ListTodo,
  CalendarCheck2,
  CalendarDays,
  IndianRupee,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  FileDown,
  UserCheck,
  Send,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Receipt
} from 'lucide-react';

interface GroupCommandHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
}

type ActiveTab = 'members' | 'project' | 'milestones' | 'tasks' | 'weekly' | 'attendance' | 'payments';

export function GroupCommandHubModal({ isOpen, onClose, group }: GroupCommandHubModalProps) {
  const {
    students,
    projects,
    milestones,
    tasks,
    weeklyReports,
    attendance,
    payments,
    updateGroup,
    updateProject,
    addMilestone,
    updateMilestone,
    createTask,
    updateTask,
    submitWeeklyReport,
    reviewWeeklyReport,
    markAttendanceBatch,
    recordPayment,
    currentUser
  } = useApp();

  const [activeTab, setActiveTab] = useState<ActiveTab>('members');

  // Associated project
  const project = useMemo(() => {
    return projects.find(p => p.group_id === group.id);
  }, [projects, group.id]);

  // Group members
  const groupMembers = useMemo(() => {
    return students.filter(s => s.group_id === group.id || group.member_ids?.includes(s.id));
  }, [students, group.id, group.member_ids]);

  // Group milestones
  const groupMilestones = useMemo(() => {
    if (!project) return [];
    return milestones
      .filter(m => m.project_id === project.id)
      .sort((a, b) => a.step_order - b.step_order);
  }, [milestones, project]);

  // Group tasks
  const groupTasks = useMemo(() => {
    return tasks.filter(t => t.group_id === group.id || (project && t.project_id === project.id));
  }, [tasks, group.id, project]);

  // Group weekly reports
  const groupWeekly = useMemo(() => {
    return weeklyReports
      .filter(w => w.group_id === group.id)
      .sort((a, b) => b.week_number - a.week_number);
  }, [weeklyReports, group.id]);

  // Group attendance
  const groupAttendance = useMemo(() => {
    const memberIds = groupMembers.map(m => m.id);
    return attendance
      .filter(a => a.group_id === group.id || memberIds.includes(a.student_id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendance, group.id, groupMembers]);

  // Group payments
  const groupPayments = useMemo(() => {
    const memberIds = groupMembers.map(m => m.id);
    return payments.filter(p => p.group_id === group.id || memberIds.includes(p.student_id));
  }, [payments, group.id, groupMembers]);

  // Modals inside Command Hub
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddWeeklyModal, setShowAddWeeklyModal] = useState(false);
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [showReviewReportModal, setShowReviewReportModal] = useState<WeeklyReport | null>(null);

  // Form states for in-hub actions
  // Task form
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    assigned_student_id: '',
    priority: 'medium' as TaskPriority,
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  });

  // Weekly report form
  const [newWeeklyData, setNewWeeklyData] = useState({
    week_number: (groupWeekly.length || 0) + 1,
    start_date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    activities_completed: '',
    tasks_completed: '',
    problems_faced: '',
    next_week_plan: '',
    submitted_by: group.group_leader_id || groupMembers[0]?.id || ''
  });

  // Attendance batch form for today
  const [attendanceRecordsToday, setAttendanceRecordsToday] = useState<{ [studentId: string]: 'present' | 'absent' | 'late' | 'leave' }>({});

  // Payment form
  const [paymentData, setPaymentData] = useState({
    student_id: '',
    amount: 1000,
    total_fee: 5000,
    payment_mode: 'upi' as PaymentMode,
    receipt_no: '',
    remarks: ''
  });

  // Milestone form
  const [newMilestoneData, setNewMilestoneData] = useState({
    name: '',
    description: '',
    assigned_student_id: group.group_leader_id || '',
    due_date: group.expected_completion_date
  });

  // Review report form
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewStatus, setReviewStatus] = useState<WeeklyReport['review_status']>('approved');

  // Handle open quick attendance
  const handleOpenAttendanceModal = () => {
    const initialMap: { [studentId: string]: 'present' | 'absent' | 'late' | 'leave' } = {};
    groupMembers.forEach(m => {
      initialMap[m.id] = 'present';
    });
    setAttendanceRecordsToday(initialMap);
    setShowMarkAttendanceModal(true);
  };

  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    const records = groupMembers.map(m => ({
      student_id: m.id,
      group_id: group.id,
      date: today,
      status: attendanceRecordsToday[m.id] || 'present',
      session_type: 'daily' as const,
      remarks: 'Marked via Group Command Hub'
    }));

    markAttendanceBatch(records);
    setShowMarkAttendanceModal(false);
  };

  // Handle Task submit
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskData.title || !project) return;

    createTask({
      project_id: project.id,
      group_id: group.id,
      title: newTaskData.title,
      description: newTaskData.description,
      assigned_student_id: newTaskData.assigned_student_id || undefined,
      assigned_date: new Date().toISOString().split('T')[0],
      due_date: newTaskData.due_date,
      priority: newTaskData.priority,
      status: 'todo'
    });

    setNewTaskData({
      title: '',
      description: '',
      assigned_student_id: '',
      priority: 'medium',
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    });
    setShowAddTaskModal(false);
  };

  // Handle Weekly submit
  const handleCreateWeekly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newWeeklyData.activities_completed) return;

    submitWeeklyReport({
      group_id: group.id,
      project_id: project.id,
      week_number: Number(newWeeklyData.week_number),
      start_date: newWeeklyData.start_date,
      end_date: newWeeklyData.end_date,
      activities_completed: newWeeklyData.activities_completed,
      tasks_completed: newWeeklyData.tasks_completed || 'Tasks progressed according to weekly targets',
      problems_faced: newWeeklyData.problems_faced || 'None reported',
      next_week_plan: newWeeklyData.next_week_plan,
      submitted_by: newWeeklyData.submitted_by || undefined,
      submitted_at: new Date().toISOString(),
      review_status: 'submitted'
    });

    setNewWeeklyData({
      week_number: groupWeekly.length + 2,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      activities_completed: '',
      tasks_completed: '',
      problems_faced: '',
      next_week_plan: '',
      submitted_by: group.group_leader_id || groupMembers[0]?.id || ''
    });
    setShowAddWeeklyModal(false);
  };

  // Handle Milestone submit
  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newMilestoneData.name) return;

    addMilestone({
      project_id: project.id,
      step_order: groupMilestones.length + 1,
      name: newMilestoneData.name,
      description: newMilestoneData.description,
      assigned_student_id: newMilestoneData.assigned_student_id || undefined,
      start_date: new Date().toISOString().split('T')[0],
      due_date: newMilestoneData.due_date,
      status: 'pending',
      is_custom: true
    });

    setNewMilestoneData({
      name: '',
      description: '',
      assigned_student_id: group.group_leader_id || '',
      due_date: group.expected_completion_date
    });
    setShowAddMilestoneModal(false);
  };

  // Handle Payment Submit
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentData.student_id || paymentData.amount <= 0) return;

    recordPayment({
      student_id: paymentData.student_id,
      group_id: group.id,
      total_fee: paymentData.total_fee,
      amount: paymentData.amount,
      payment_mode: paymentData.payment_mode,
      receipt_no: paymentData.receipt_no.trim() || `REC-${Date.now().toString().slice(-6)}`,
      remarks: paymentData.remarks.trim() || undefined
    });

    setShowPaymentModal(false);
  };

  // Handle Review Report
  const handleSaveReportReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReviewReportModal) return;

    reviewWeeklyReport(showReviewReportModal.id, reviewFeedback, reviewStatus);
    setShowReviewReportModal(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${group.name} (${group.group_code})`}
      subtitle={`360° Group Command Hub • ${group.college?.name || 'General'} • In-Charge: ${group.coordinator_name || group.mentor?.full_name || 'Staff'}`}
      maxWidth="5xl"
    >
      <div className="space-y-5">
        {/* Hub Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[11px] font-bold font-mono">
                  {group.group_code}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase">
                  {group.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 text-[11px]">
                  Batch: 2024 - 2025
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white">
                {group.project_title || project?.title || 'Academic Capstone Project'}
              </h2>
              <p className="text-xs text-blue-200/80 mt-1 max-w-2xl">
                {project?.description || 'Full-stack software development project under MES College academic curriculum.'}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/10 min-w-[200px] text-right">
              <div className="text-[11px] text-blue-200 font-medium">Overall Progress</div>
              <div className="text-2xl font-black text-white">{project?.progress_percentage || 0}%</div>
              <div className="w-full bg-white/20 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${project?.progress_percentage || 0}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-300 mt-1">
                {groupMilestones.filter(m => m.status === 'completed').length} / {groupMilestones.length} Milestones Done
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'members'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Members ({groupMembers.length})
          </button>

          <button
            onClick={() => setActiveTab('project')}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'project'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            Project Blueprint
          </button>

          <button
            onClick={() => setActiveTab('milestones')}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'milestones'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Milestone className="w-3.5 h-3.5" />
            13 Milestones ({groupMilestones.filter(m => m.status === 'completed').length}/13)
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            Tasks ({groupTasks.length})
          </button>

          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'weekly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarCheck2 className="w-3.5 h-3.5" />
            Weekly Reports ({groupWeekly.length})
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Attendance
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'payments'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" />
            Member Fees & Receipts
          </button>
        </div>

        {/* Tab 1: Members & Roster */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Assigned Student Roster</h3>
                <p className="text-xs text-slate-500">
                  Enrolled students collaborating on this academic project.
                </p>
              </div>

              <div className="text-xs text-slate-600 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                Team Leader: {group.leader?.full_name || 'Appointed'}
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
              {groupMembers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No students in this group yet. Edit group to check and add students.
                </div>
              ) : (
                groupMembers.map((member) => {
                  const isLeader = group.group_leader_id === member.id;
                  const memberPayment = payments.find(p => p.student_id === member.id);

                  return (
                    <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={member.full_name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{member.full_name}</span>
                            {isLeader && (
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                                Leader
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                            {member.student_reg_no} • {member.email} • {member.phone || 'No phone'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-semibold block">
                            {member.assigned_role}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            Fee Status: {memberPayment?.status.toUpperCase() || 'PAID'}
                          </span>
                        </div>

                        {!isLeader && currentUser.role === 'admin' && (
                          <button
                            onClick={() => updateGroup(group.id, { group_leader_id: member.id })}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                          >
                            Set Leader
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Project Blueprint & Specs */}
        {activeTab === 'project' && project && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block">Project Code</span>
                  <span className="font-mono text-sm font-bold text-slate-900">{project.project_code}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block">Category</span>
                  <span className="font-semibold text-slate-900">{project.category}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block">Project Topic</span>
                  <span className="font-semibold text-slate-900">{project.topic}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block">Status</span>
                  <StatusBadge status={project.status} />
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Project Description</span>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {project.description}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Technologies Used</span>
                <div className="flex flex-wrap gap-1.5">
                  {(project.technologies || []).map((tech, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-mono font-semibold text-[11px]">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block">Starting Date</span>
                  <span className="font-semibold text-slate-800">{formatDateIndian(project.start_date)}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px] block">Expected Completion</span>
                  <span className="font-semibold text-slate-800">{formatDateIndian(project.expected_completion_date)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Milestones (13 Steps) */}
        {activeTab === 'milestones' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Project Development Timeline (13 Steps)</h3>
                <p className="text-xs text-slate-500">
                  Official capstone lifecycle phases from requirement analysis through final evaluation.
                </p>
              </div>

              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setShowAddMilestoneModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Custom Step
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
              {groupMilestones.map((ms) => {
                const assignedStudent = students.find(s => s.id === ms.assigned_student_id);

                return (
                  <div key={ms.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        ms.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ms.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {ms.step_order}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{ms.name}</span>
                          {ms.is_custom && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 text-[10px] font-bold">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Assigned: {assignedStudent?.full_name || 'Group'} • Due: {ms.due_date ? formatDateIndian(ms.due_date) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={ms.status} />

                      {currentUser.role === 'admin' && (
                        <div className="flex items-center gap-1">
                          {ms.status !== 'completed' ? (
                            <button
                              onClick={() => updateMilestone(ms.id, { status: 'completed', completion_date: new Date().toISOString().split('T')[0] })}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-semibold text-[11px] transition-colors"
                            >
                              Approve Step
                            </button>
                          ) : (
                            <button
                              onClick={() => updateMilestone(ms.id, { status: 'in_progress' })}
                              className="px-2 py-1 text-slate-400 hover:text-slate-600 rounded text-[10px]"
                            >
                              Reopen
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Tasks */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Sprint Tasks & Action Items</h3>
                <p className="text-xs text-slate-500">
                  Granular student sprint tickets and assignments for this group.
                </p>
              </div>

              <button
                onClick={() => setShowAddTaskModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Assign Task
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
              {groupTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No tasks assigned to this group yet. Click &ldquo;Assign Task&rdquo; to create one.
                </div>
              ) : (
                groupTasks.map((task) => {
                  const student = students.find(s => s.id === task.assigned_student_id);

                  return (
                    <div key={task.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{task.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            task.priority === 'critical' ? 'bg-rose-100 text-rose-800' :
                            task.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Owner: {student?.full_name || 'Unassigned'} • Due: {formatDateIndian(task.due_date)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={task.status} />

                        <select
                          value={task.status}
                          onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                          className="px-2 py-1 text-[11px] border border-slate-200 rounded bg-white font-medium"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Weekly Reports */}
        {activeTab === 'weekly' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Chronological Weekly Progress Reports</h3>
                <p className="text-xs text-slate-500">
                  Verified log of weekly student development submissions and mentor/admin approvals.
                </p>
              </div>

              <button
                onClick={() => setShowAddWeeklyModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Submit Weekly Report
              </button>
            </div>

            <div className="space-y-3">
              {groupWeekly.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-xl">
                  No weekly progress updates recorded for this group yet.
                </div>
              ) : (
                groupWeekly.map((report) => (
                  <div key={report.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 font-bold font-mono">
                          Week {report.week_number}
                        </span>
                        <span className="text-slate-500 font-medium">
                          {formatDateIndian(report.start_date)} - {formatDateIndian(report.end_date)}
                        </span>
                      </div>
                      <StatusBadge status={report.review_status} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-700 block mb-0.5">Activities Completed:</span>
                        <p className="text-slate-600">{report.activities_completed}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 block mb-0.5">Next Week Plan:</span>
                        <p className="text-slate-600">{report.next_week_plan}</p>
                      </div>
                    </div>

                    {report.problems_faced && (
                      <p className="text-amber-800 bg-amber-50 p-2 rounded text-[11px] border border-amber-200">
                        <strong>Challenges Encountered:</strong> {report.problems_faced}
                      </p>
                    )}

                    {report.mentor_feedback && (
                      <div className="bg-blue-50/60 p-2.5 rounded text-[11px] border border-blue-100 text-blue-900">
                        <strong>Staff Feedback:</strong> {report.mentor_feedback}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400">
                        Submitted by: {report.submitter?.full_name || 'Group Leader'} on {formatDateIndian(report.submitted_at)}
                      </span>

                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => {
                            setShowReviewReportModal(report);
                            setReviewFeedback(report.mentor_feedback || 'Excellent progress. Approved.');
                            setReviewStatus(report.review_status);
                          }}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-semibold transition-colors"
                        >
                          Review & Feedback
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Daily Attendance */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Group Attendance Records</h3>
                <p className="text-xs text-slate-500">
                  Track student presence during MES College project lab visits.
                </p>
              </div>

              {currentUser.role === 'admin' && (
                <button
                  onClick={handleOpenAttendanceModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Mark Today&apos;s Attendance
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
              {groupAttendance.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No attendance entries recorded for this group yet. Click &ldquo;Mark Today&apos;s Attendance&rdquo; to log.
                </div>
              ) : (
                groupAttendance.slice(0, 15).map((att) => (
                  <div key={att.id} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{att.student?.full_name || 'Student'}</span>
                      <p className="text-[11px] text-slate-500">
                        {formatDateIndian(att.date)} • {att.session_type}
                      </p>
                    </div>

                    <StatusBadge status={att.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 7: Fees & Payments */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Group Member Fee Accounting</h3>
                <p className="text-xs text-slate-500">
                  Individual student payment records and outstanding dues for this cohort.
                </p>
              </div>

              {currentUser.role === 'admin' && (
                <button
                  onClick={() => {
                    const firstStudent = groupMembers[0];
                    const existing = payments.find(p => p.student_id === firstStudent?.id);
                    setPaymentData({
                      student_id: firstStudent?.id || '',
                      amount: existing ? existing.balance_amount : 1000,
                      total_fee: existing ? existing.total_fee : 5000,
                      payment_mode: 'upi',
                      receipt_no: `REC-${Date.now().toString().slice(-6)}`,
                      remarks: ''
                    });
                    setShowPaymentModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Record Payment
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
              {groupPayments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No fee records attached to members of this group yet.
                </div>
              ) : (
                groupPayments.map((p) => (
                  <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{p.student?.full_name}</span>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {p.student?.student_reg_no} • Receipt: {p.receipt_no || 'Pending'} • Mode: {p.payment_mode?.toUpperCase() || 'UPI'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Paid / Total</span>
                        <span className="font-bold font-mono text-emerald-600">
                          {formatCurrencyIndian(p.paid_amount)} <span className="text-slate-400">/ {formatCurrencyIndian(p.total_fee)}</span>
                        </span>
                      </div>

                      <div className="min-w-[80px]">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                          p.status === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {p.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={() => generateGroupSummaryPdf(group, project, groupWeekly)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Export Group Dossier PDF
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close Command Hub
          </button>
        </div>
      </div>

      {/* Sub-modal: Quick Attendance Marker */}
      {showMarkAttendanceModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowMarkAttendanceModal(false)}
          title={`Mark Attendance: ${group.name}`}
          subtitle={`Date: ${new Date().toLocaleDateString('en-IN')}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveAttendance} className="space-y-4">
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              {groupMembers.map((m) => (
                <div key={m.id} className="p-2.5 px-3 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{m.full_name}</span>

                  <div className="flex items-center gap-1">
                    {(['present', 'absent', 'late'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setAttendanceRecordsToday(prev => ({ ...prev, [m.id]: st }))}
                        className={`px-2 py-1 rounded text-[11px] font-bold uppercase ${
                          attendanceRecordsToday[m.id] === st
                            ? st === 'present' ? 'bg-emerald-600 text-white' :
                              st === 'absent' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMarkAttendanceModal(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded-lg text-xs hover:bg-blue-700"
              >
                Save Attendance
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Sub-modal: Assign Task */}
      {showAddTaskModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddTaskModal(false)}
          title={`Assign Task to ${group.name}`}
          subtitle="Sprint deliverable ticket"
          maxWidth="md"
        >
          <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
              <input
                type="text"
                required
                value={newTaskData.title}
                onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                placeholder="e.g. Implement JWT Auth & Middleware"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assign to Member</label>
              <select
                value={newTaskData.assigned_student_id}
                onChange={(e) => setNewTaskData({ ...newTaskData, assigned_student_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white"
              >
                <option value="">-- Entire Group --</option>
                {groupMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name} ({m.assigned_role})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  value={newTaskData.priority}
                  onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value as TaskPriority })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={newTaskData.due_date}
                  onChange={(e) => setNewTaskData({ ...newTaskData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddTaskModal(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                Create Task
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Sub-modal: Submit Weekly Report */}
      {showAddWeeklyModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddWeeklyModal(false)}
          title={`Submit Weekly Report - ${group.name}`}
          subtitle={`Week ${newWeeklyData.week_number} Update`}
          maxWidth="lg"
        >
          <form onSubmit={handleCreateWeekly} className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Week Number</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newWeeklyData.week_number}
                  onChange={(e) => setNewWeeklyData({ ...newWeeklyData, week_number: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={newWeeklyData.start_date}
                  onChange={(e) => setNewWeeklyData({ ...newWeeklyData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={newWeeklyData.end_date}
                  onChange={(e) => setNewWeeklyData({ ...newWeeklyData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Activities Completed *</label>
              <textarea
                rows={2}
                required
                value={newWeeklyData.activities_completed}
                onChange={(e) => setNewWeeklyData({ ...newWeeklyData, activities_completed: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                placeholder="What was built or documented this week?"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Next Week Targets *</label>
              <textarea
                rows={2}
                required
                value={newWeeklyData.next_week_plan}
                onChange={(e) => setNewWeeklyData({ ...newWeeklyData, next_week_plan: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                placeholder="Deliverables scheduled for the coming week..."
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Challenges / Problems Faced</label>
              <input
                type="text"
                value={newWeeklyData.problems_faced}
                onChange={(e) => setNewWeeklyData({ ...newWeeklyData, problems_faced: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                placeholder="e.g. Database connection timeouts, API rate limits..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddWeeklyModal(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                Submit Report
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Sub-modal: Record Payment for Member */}
      {showPaymentModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowPaymentModal(false)}
          title={`Record Fee Payment: ${group.name}`}
          subtitle="Issue official receipt for group member"
          maxWidth="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Member *</label>
              <select
                value={paymentData.student_id}
                onChange={(e) => {
                  const sId = e.target.value;
                  const ex = payments.find(p => p.student_id === sId);
                  setPaymentData({
                    ...paymentData,
                    student_id: sId,
                    total_fee: ex ? ex.total_fee : 5000,
                    amount: ex ? ex.balance_amount : 1000
                  });
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                required
              >
                <option value="">-- Choose Member --</option>
                {groupMembers.map(m => {
                  const pay = payments.find(p => p.student_id === m.id);
                  return (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.student_reg_no}) - Due: ₹{pay?.balance_amount || 0}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount to Collect (₹) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={paymentData.payment_mode}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_mode: e.target.value as PaymentMode })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="upi">UPI (GPay / PhonePe)</option>
                  <option value="cash">Cash Counter</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Receipt Number</label>
              <input
                type="text"
                required
                value={paymentData.receipt_no}
                onChange={(e) => setPaymentData({ ...paymentData, receipt_no: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700"
              >
                Confirm Payment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Sub-modal: Add Custom Milestone Step */}
      {showAddMilestoneModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddMilestoneModal(false)}
          title={`Add Custom Step to ${group.name}`}
          subtitle="Insert a milestone stage"
          maxWidth="md"
        >
          <form onSubmit={handleCreateMilestone} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Milestone Step Name *</label>
              <input
                type="text"
                required
                value={newMilestoneData.name}
                onChange={(e) => setNewMilestoneData({ ...newMilestoneData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                placeholder="e.g. Cloud Architecture Setup"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                value={newMilestoneData.description}
                onChange={(e) => setNewMilestoneData({ ...newMilestoneData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                placeholder="Details of the milestone..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddMilestoneModal(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                Add Milestone
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Sub-modal: Review Report */}
      {showReviewReportModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowReviewReportModal(null)}
          title={`Review Week ${showReviewReportModal.week_number} Report`}
          subtitle={`Group: ${group.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveReportReview} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Review Decision *</label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="approved">Approve Submission</option>
                <option value="revision_required">Request Revision</option>
                <option value="under_review">Mark Under Review</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Coordinator / Staff Feedback *</label>
              <textarea
                rows={3}
                required
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                placeholder="Provide constructive feedback and guidelines..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReviewReportModal(null)}
                className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                Save Review
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Modal>
  );
}
