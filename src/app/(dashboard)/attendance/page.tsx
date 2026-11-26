'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { AttendanceRecord, AttendanceStatus, AttendanceSession } from '@/lib/types';
import { formatDateIndian } from '@/lib/utils/formatters';
import { exportAttendanceToExcel } from '@/lib/utils/exportExcel';
import { generateAttendancePdf } from '@/lib/utils/exportPdf';
import { StatusBadge } from '@/components/common/StatusBadge';
import { AttendanceMarkerModal } from '@/components/attendance/AttendanceMarkerModal';
import { Modal } from '@/components/ui/Modal';
import {
  CalendarDays,
  CalendarCheck,
  Plus,
  FileSpreadsheet,
  FileDown,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Search,
  Percent,
  Edit
} from 'lucide-react';

export default function AttendancePage() {
  const { attendance, students, groups, colleges, updateAttendance, currentUser } = useApp();

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('ALL');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sessionFilter, setSessionFilter] = useState<'ALL' | AttendanceSession>('ALL');

  const [showMarkModal, setShowMarkModal] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('present');
  const [editRemarks, setEditRemarks] = useState('');

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return attendance.filter(r => {
      const matchDate = !selectedDate || r.date === selectedDate;
      const matchCollege = selectedCollege === 'ALL' || r.student?.college_id === selectedCollege || groups.find(g => g.id === r.group_id)?.college_id === selectedCollege;
      const matchGroup = selectedGroup === 'ALL' || r.group_id === selectedGroup;
      const matchStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
      const matchSession = sessionFilter === 'ALL' || r.session_type === sessionFilter;
      return matchDate && matchCollege && matchGroup && matchStatus && matchSession;
    });
  }, [attendance, selectedDate, selectedCollege, selectedGroup, selectedStatus, sessionFilter, groups]);

  // Overall statistics
  const presentCount = filteredRecords.filter(r => r.status === 'present').length;
  const lateCount = filteredRecords.filter(r => r.status === 'late').length;
  const absentCount = filteredRecords.filter(r => r.status === 'absent').length;
  const leaveCount = filteredRecords.filter(r => r.status === 'leave').length;
  const totalCount = filteredRecords.length;
  const attendancePercent = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 0;

  // Identify students with overall attendance < 75%
  const lowAttendanceStudents = useMemo(() => {
    const list = selectedCollege === 'ALL' ? students : students.filter(s => s && s.college_id === selectedCollege);
    return list.filter(s => {
      const sRecords = attendance.filter(a => a.student_id === s.id);
      if (sRecords.length === 0) return false;
      const sPresent = sRecords.filter(a => a.status === 'present' || a.status === 'late').length;
      const pct = (sPresent / sRecords.length) * 100;
      return pct < 75;
    });
  }, [students, attendance, selectedCollege]);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recordToEdit) {
      updateAttendance(recordToEdit.id, editStatus, editRemarks);
      setRecordToEdit(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
              Attendance Telemetry
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Daily & Meeting Attendance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            MES College student lab presence, punctuality logs, meeting rolls, and compliance exports.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportAttendanceToExcel(filteredRecords)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel Export
          </button>

          <button
            onClick={() => generateAttendancePdf(filteredRecords, selectedGroup === 'ALL' ? 'MES All Cohorts' : 'Cohort', selectedDate)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            PDF Report
          </button>

          {(currentUser.role === 'admin' || currentUser.role === 'staff' || currentUser.role === 'mentor') && (
            <button
              onClick={() => setShowMarkModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <CalendarCheck className="w-4 h-4" />
              Mark Attendance Batch
            </button>
          )}
        </div>
      </div>

      {/* Low Attendance Warning Alert (if any) */}
      {lowAttendanceStudents.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-900">
              Low Attendance Warning ({lowAttendanceStudents.length} Students below 75% threshold)
            </p>
            <p className="text-amber-800 mt-0.5">
              Flagged students below 75% threshold: {lowAttendanceStudents.map(s => `${s.full_name} (${s.student_reg_no})`).join(', ')}.
            </p>
          </div>
        </div>
      )}

      {/* Attendance Stats Cards for filtered query */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Attendance Rate</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{attendancePercent}%</p>
          <span className="text-[10px] text-slate-400">Filtered sample</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase">Present</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{presentCount}</p>
          <span className="text-[10px] text-slate-400">On time</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase">Late</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{lateCount}</p>
          <span className="text-[10px] text-slate-400">Recorded late</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-600 uppercase">Absent</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{absentCount}</p>
          <span className="text-[10px] text-slate-400">Unexcused</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-600 uppercase">Leave</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{leaveCount}</p>
          <span className="text-[10px] text-slate-400">Approved leave</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Filter by Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Filter by College
            </label>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="ALL">All Colleges</option>
              {(colleges || []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Filter by Group
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="ALL">All Project Groups</option>
              {groups
                .filter(g => selectedCollege === 'ALL' || g.college_id === selectedCollege)
                .map((g) => (
                  <option key={g.id} value={g.id}>{g.name} ({g.group_code})</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Filter by Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Session Format
            </label>
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="ALL">All Sessions</option>
              <option value="daily">Daily Lab</option>
              <option value="project_meeting">Weekly Meeting</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Register No</th>
                <th className="py-3.5 px-4">Session Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Audit Remarks</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No attendance records for this date/filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {formatDateIndian(record.date)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {record.student?.full_name || 'Student'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {record.student?.student_reg_no || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-slate-600 font-medium">
                        {record.session_type === 'daily' ? 'Daily Lab' : 'Meeting'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {record.remarks || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {(currentUser.role === 'admin' || currentUser.role === 'staff') && (
                        <button
                          onClick={() => {
                            setRecordToEdit(record);
                            setEditStatus(record.status);
                            setEditRemarks(record.remarks || '');
                          }}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                          title="Edit Status"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark Batch Modal */}
      <AttendanceMarkerModal
        isOpen={showMarkModal}
        onClose={() => setShowMarkModal(false)}
      />

      {/* Edit Record Modal */}
      {recordToEdit && (
        <Modal
          isOpen={true}
          onClose={() => setRecordToEdit(null)}
          title="Edit Attendance Audit Entry"
          subtitle={`Student: ${recordToEdit.student?.full_name} | Date: ${formatDateIndian(recordToEdit.date)}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attendance Status *
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-medium"
              >
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="leave">Leave</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Audit Remark / Justification
              </label>
              <input
                type="text"
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                placeholder="e.g. Approved medical certificate submitted"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRecordToEdit(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Save Audit Record
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
