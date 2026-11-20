'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useApp } from '@/lib/context/AppContext';
import { AttendanceStatus, AttendanceSession } from '@/lib/types';
import { Check, Clock, X, AlertCircle } from 'lucide-react';

interface AttendanceMarkerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AttendanceMarkerModal({ isOpen, onClose }: AttendanceMarkerModalProps) {
  const { groups, students, markAttendanceBatch, currentUser } = useApp();

  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionType, setSessionType] = useState<AttendanceSession>('daily');

  // Filter students by selected group
  const groupStudents = students.filter(s => s.group_id === selectedGroupId);

  const [studentStates, setStudentStates] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});

  // Initialize or update statuses when group changes
  React.useEffect(() => {
    const initial: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    groupStudents.forEach(s => {
      initial[s.id] = { status: 'present', remarks: '' };
    });
    setStudentStates(initial);
  }, [selectedGroupId, students]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudentStates(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setStudentStates(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    groupStudents.forEach(s => {
      updated[s.id] = { status: 'present', remarks: '' };
    });
    setStudentStates(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupStudents.length === 0) {
      alert('No students found in this group.');
      return;
    }

    const records = groupStudents.map(s => ({
      student_id: s.id,
      group_id: selectedGroupId,
      date: selectedDate,
      status: studentStates[s.id]?.status || 'present',
      session_type: sessionType,
      remarks: studentStates[s.id]?.remarks || undefined,
      marked_by: currentUser.id
    }));

    markAttendanceBatch(records);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily & Meeting Attendance Marker"
      subtitle="Record student presence with individual audit trail"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Group *
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.group_code}) {g.college?.name ? `• ${g.college.name}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Attendance Date *
            </label>
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Session Format *
            </label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as AttendanceSession)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="daily">Daily Organization Lab Session</option>
              <option value="project_meeting">Weekly Project Review Meeting</option>
            </select>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Students in Group ({groupStudents.length})
          </p>
          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
          >
            Mark All Present
          </button>
        </div>

        {/* Student List */}
        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {groupStudents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No students are currently assigned to this group.
            </div>
          ) : (
            groupStudents.map((student) => {
              const current = studentStates[student.id] || { status: 'present', remarks: '' };

              return (
                <div key={student.id} className="p-3.5 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={student.full_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{student.full_name}</p>
                      <p className="text-[11px] text-slate-500">{student.student_reg_no} • {student.assigned_role}</p>
                    </div>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'present')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                        current.status === 'present'
                          ? 'bg-emerald-600 text-white shadow-sm'
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
                          ? 'bg-amber-600 text-white shadow-sm'
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
                          ? 'bg-rose-600 text-white shadow-sm'
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
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      Leave
                    </button>
                  </div>

                  {/* Individual Remark input */}
                  <input
                    type="text"
                    placeholder="Audit remark (e.g. Bus delay)"
                    value={current.remarks}
                    onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                    className="sm:w-44 px-2 py-1 border border-slate-200 rounded text-xs text-slate-700 placeholder-slate-400"
                  />
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            Save Attendance Records
          </button>
        </div>
      </form>
    </Modal>
  );
}
