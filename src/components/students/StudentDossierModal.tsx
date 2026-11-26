'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Student } from '@/lib/types';
import { useApp } from '@/lib/context/AppContext';
import { formatDateIndian } from '@/lib/utils/formatters';
import { generateStudentProfilePdf } from '@/lib/utils/exportPdf';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  FileDown,
  Mail,
  Phone,
  GraduationCap,
  Building,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Layers,
  FolderKanban,
  UserCheck,
  CreditCard,
  Check
} from 'lucide-react';

interface StudentDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export function StudentDossierModal({ isOpen, onClose, student }: StudentDossierModalProps) {
  const { groups, projects, payments, attendance, tasks, staffMembers, colleges } = useApp();

  if (!isOpen || !student) return null;

  const collegeName = student.college?.name || colleges.find(c => c.id === student.college_id)?.name || 'MES College';
  const group = groups.find(g => g.id === student.group_id) || student.group;
  const project = projects.find(p => p.group_id === group?.id) || group?.project;
  const payment = payments.find(p => p.student_id === student.id);
  const studentAttendance = (attendance || []).filter(a => a.student_id === student.id);
  const studentTasks = (tasks || []).filter(t => t.assigned_student_id === student.id || (group && t.group_id === group.id));
  const staffName = group?.coordinator_name || group?.mentor?.full_name || project?.mentor?.full_name || staffMembers.find(s => s.id === group?.mentor_id || s.id === project?.mentor_id)?.full_name || 'Staff Coordinator';

  // Fee calculation
  const totalFee = payment?.total_fee ?? student.total_fee ?? 15000;
  const paidAmount = payment?.paid_amount ?? student.paid_amount ?? 0;
  const balanceAmount = payment?.balance_amount ?? (totalFee - paidAmount);
  const isPaid = balanceAmount <= 0;

  // Attendance calculation
  const totalSessions = studentAttendance.length;
  const presentSessions = studentAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const absentSessions = studentAttendance.filter(a => a.status === 'absent' || a.status === 'leave').length;
  const lateSessions = studentAttendance.filter(a => a.status === 'late').length;
  const attendancePercent = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 100;
  const isEligible = attendancePercent >= 75;

  const handleDownloadPdf = () => {
    generateStudentProfilePdf(student, {
      group,
      project,
      payment,
      attendanceRecords: studentAttendance,
      tasks: studentTasks,
      staffInChargeName: staffName
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Student Academic & Financial Dossier`}
      subtitle={`${student.full_name} • Reg No: ${student.student_reg_no} • ${collegeName}`}
      maxWidth="3xl"
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
        {/* Top Profile Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={student.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={student.full_name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-500 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{student.full_name}</h3>
                <StatusBadge status={student.status} />
              </div>
              <p className="text-xs font-semibold text-blue-700">{student.assigned_role || 'Team Developer'}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {student.email}
                </span>
                {student.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {student.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {collegeName}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <FileDown className="w-4 h-4" />
            Download PDF Dossier
          </button>
        </div>

        {/* Core Profile Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Department / Course</span>
            <span className="font-bold text-slate-800 mt-0.5 block truncate">{student.course?.name || student.department || 'Computer Science'}</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Class / Academic Year</span>
            <span className="font-bold text-slate-800 mt-0.5 block">{student.class_year || 'Final Year'}</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Enrolled Date</span>
            <span className="font-bold text-slate-800 mt-0.5 block">{formatDateIndian(student.joining_date)}</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Staff In-Charge</span>
            <span className="font-bold text-blue-700 mt-0.5 block truncate">{staffName}</span>
          </div>
        </div>

        {/* Group & Project Affiliation */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FolderKanban className="w-4 h-4 text-blue-600" />
              Project & Cohort Affiliation
            </span>
            <span className="text-xs font-bold text-emerald-600">
              {project?.progress_percentage ?? 0}% Completed
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block">Assigned Group Name</span>
              <strong className="text-slate-900 text-sm">{group?.name || 'Unassigned Group'}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block">Dissertation Project</span>
              <strong className="text-slate-900 text-sm truncate block">{project?.title || 'No Project Assigned'}</strong>
            </div>
          </div>
        </div>

        {/* Financial Ledger & Fee Payment Compliance */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              1. Student Fee Ledger & Financial Compliance
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isPaid
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {isPaid ? 'FEES CLEARED' : `OUTSTANDING: Rs. ${balanceAmount.toLocaleString('en-IN')}`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-medium block">Total Lab/Project Fee</span>
              <span className="font-bold text-slate-900 text-sm">Rs. {totalFee.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-medium block">Total Amount Paid</span>
              <span className="font-bold text-emerald-700 text-sm">Rs. {paidAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-medium block">Balance Outstanding</span>
              <span className={`font-bold text-sm ${isPaid ? 'text-slate-800' : 'text-rose-600'}`}>
                Rs. {balanceAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-medium block">Last Payment Date</span>
              <span className="font-bold text-slate-800 text-xs">
                {payment?.last_payment_date ? formatDateIndian(payment.last_payment_date) : 'No receipts logged'}
              </span>
            </div>
          </div>
        </div>

        {/* Laboratory & Sprint Attendance Audit */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              2. Laboratory & Sprint Attendance Audit
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isEligible
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {isEligible ? 'ELIGIBLE FOR SUBMISSION' : 'ATTENDANCE SHORTAGE (<75%)'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-medium block">Total Logged Sessions</span>
              <span className="font-bold text-slate-900 text-sm">{totalSessions} Sessions</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-emerald-600 font-medium block">Present Days</span>
              <span className="font-bold text-emerald-700 text-sm">{presentSessions} Days</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-rose-500 font-medium block">Absent Days</span>
              <span className="font-bold text-rose-600 text-sm">{absentSessions} Days</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-amber-500 font-medium block">Recorded Late</span>
              <span className="font-bold text-amber-700 text-sm">{lateSessions} Days</span>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium">Session Compliance Rate</span>
              <span className={`font-black ${isEligible ? 'text-emerald-600' : 'text-amber-600'}`}>
                {attendancePercent}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isEligible ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${attendancePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Assigned Sprint Tasks & Deliverables */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-600" />
              3. Assigned Sprint Tasks & Deliverables ({studentTasks.length})
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Task Deliverable</th>
                  <th className="py-2 px-3">Priority</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                      No sprint tasks registered for this student.
                    </td>
                  </tr>
                ) : (
                  studentTasks.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{t.title}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mentor Remarks & Institutional Notes */}
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5 text-xs">
          <span className="font-bold text-amber-900 block">Mentor Remarks & Institutional Assessment:</span>
          <p className="text-amber-800 leading-relaxed">
            {student.notes || 'Student is in good academic standing, maintaining required lab presence and sprint deliverable submissions.'}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            Download PDF Dossier
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
