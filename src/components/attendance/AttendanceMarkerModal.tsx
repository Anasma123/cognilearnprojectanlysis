'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useApp } from '@/lib/context/AppContext';
import { AttendanceStatus, AttendanceSession, Student } from '@/lib/types';
import { Check, Clock, X, AlertCircle, Search, Users, Filter, CheckCircle2, XCircle } from 'lucide-react';

interface AttendanceMarkerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AttendanceMarkerModal({ isOpen, onClose }: AttendanceMarkerModalProps) {
  const { groups, students, colleges, attendance, markAttendanceBatch, currentUser } = useApp();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const sessionType: AttendanceSession = 'daily';

  const [studentStates, setStudentStates] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});

  // Filter students based on group, college, and search query
  const filteredStudents = useMemo(() => {
    if (!students || !Array.isArray(students)) return [];
    return students.filter(s => {
      if (!s) return false;
      const matchGroup = selectedGroupId === 'ALL' || s.group_id === selectedGroupId;
      const matchCollege = selectedCollegeId === 'ALL' || s.college_id === selectedCollegeId;

      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (s.full_name || '').toLowerCase().includes(q) ||
        String(s.student_reg_no || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.department || '').toLowerCase().includes(q);

      return matchGroup && matchCollege && matchSearch;
    });
  }, [students, selectedGroupId, selectedCollegeId, searchQuery]);

  // When modal opens or date/session changes, initialize statuses from existing attendance records or default to 'present'
  useEffect(() => {
    if (!isOpen) return;

    const initial: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    (students || []).forEach(s => {
      if (!s) return;
      // Pre-fill from existing record if already marked on this date & session
      const existing = (attendance || []).find(
        a => a.student_id === s.id && a.date === selectedDate && a.session_type === sessionType
      );
      if (existing) {
        initial[s.id] = { status: existing.status, remarks: existing.remarks || '' };
      } else {
        initial[s.id] = { status: 'present', remarks: '' };
      }
    });

    setStudentStates(initial);
  }, [isOpen, selectedDate, sessionType]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudentStates(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { remarks: '' }),
        status
      }
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setStudentStates(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'present' }),
        remarks
      }
    }));
  };

  const handleMarkAllVisible = (status: AttendanceStatus) => {
    setStudentStates(prev => {
      const updated = { ...prev };
      filteredStudents.forEach(s => {
        updated[s.id] = {
          ...(updated[s.id] || { remarks: '' }),
          status
        };
      });
      return updated;
    });
  };

  // Compute live counter for displayed students
  const counts = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let leave = 0;

    filteredStudents.forEach(s => {
      const st = studentStates[s.id]?.status || 'present';
      if (st === 'present') present++;
      else if (st === 'late') late++;
      else if (st === 'absent') absent++;
      else if (st === 'leave') leave++;
    });

    return { total: filteredStudents.length, present, late, absent, leave };
  }, [filteredStudents, studentStates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredStudents.length === 0) {
      alert('No students found to mark attendance.');
      return;
    }

    const records = filteredStudents.map(s => ({
      student_id: s.id,
      group_id: s.group_id || undefined,
      date: selectedDate,
      status: studentStates[s.id]?.status || 'present',
      session_type: sessionType,
      remarks: studentStates[s.id]?.remarks?.trim() || undefined,
      marked_by: currentUser?.id || 'admin'
    }));

    markAttendanceBatch(records);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Attendance Marker"
      subtitle="Record student presence for all cohorts and individuals in one place"
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date & Filters Header */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Attendance Date *
            </label>
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Filter by Cohort / Group
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">All Students ({students.length} Total)</option>
              {groups.map((g) => {
                const count = students.filter(s => s && s.group_id === g.id).length;
                return (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.group_code}) • {count} Students
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quick Search Student
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, Reg No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Live Attendance Stats Counter & Bulk Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-slate-800">
              Showing: {counts.total} Students
            </span>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              <Check className="w-3 h-3" /> {counts.present} Present
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
              <Clock className="w-3 h-3" /> {counts.late} Late
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
              <X className="w-3 h-3" /> {counts.absent} Absent
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              <AlertCircle className="w-3 h-3" /> {counts.leave} Leave
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMarkAllVisible('present')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAllVisible('absent')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Student List */}
        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-96 overflow-y-auto bg-white">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No students match the current filters or search query.
            </div>
          ) : (
            filteredStudents.map((student) => {
              const current = studentStates[student.id] || { status: 'present', remarks: '' };
              const group = groups.find(g => g && g.id === student.group_id);

              return (
                <div
                  key={student.id}
                  className="p-3 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  {/* Student Details */}
                  <div className="flex items-center gap-3 min-w-0 sm:w-1/3">
                    <img
                      src={student.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={student.full_name}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 truncate">{student.full_name}</p>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                          ID: {student.student_reg_no}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 truncate">
                        {group ? (
                          <span className="text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 truncate">
                            {group.name} ({group.group_code})
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Unassigned</span>
                        )}
                        <span>•</span>
                        <span className="truncate">{student.assigned_role || 'Member'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'present')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                        current.status === 'present'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Present
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'late')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                        current.status === 'late'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Late
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'absent')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                        current.status === 'absent'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      Absent
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'leave')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                        current.status === 'leave'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      Leave
                    </button>
                  </div>

                  {/* Individual Remark input */}
                  <div className="sm:w-44">
                    <input
                      type="text"
                      placeholder="Remarks (e.g. Bus delay)"
                      value={current.remarks}
                      onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Saving will register attendance for {counts.total} students on {selectedDate}.
          </p>
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              Save Attendance Records ({counts.total})
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
