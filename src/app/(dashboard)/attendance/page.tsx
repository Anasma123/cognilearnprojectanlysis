'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { AttendanceRecord, AttendanceStatus } from '@/lib/types';
import { formatDateIndian } from '@/lib/utils/formatters';
import { exportAttendanceToExcel, exportMonthlyAttendanceMatrixToExcel } from '@/lib/utils/exportExcel';
import { generateAttendancePdf, generateMonthlyAttendanceMatrixPdf } from '@/lib/utils/exportPdf';
import { StatusBadge } from '@/components/common/StatusBadge';
import { AttendanceMarkerModal } from '@/components/attendance/AttendanceMarkerModal';
import { Modal } from '@/components/ui/Modal';
import {
  CalendarDays,
  CalendarCheck,
  Calendar,
  FileSpreadsheet,
  FileDown,
  AlertTriangle,
  Search,
  Edit,
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
  Info
} from 'lucide-react';

export default function AttendancePage() {
  const { attendance, students, groups, colleges, updateAttendance, markAttendanceBatch, currentUser } = useApp();

  // View Mode: 'monthly' (Register Matrix) or 'records' (Detailed Record Logs)
  const [viewMode, setViewMode] = useState<'monthly' | 'records'>('monthly');

  // Month navigation (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // Shared Filters
  const [selectedCollege, setSelectedCollege] = useState('ALL');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [studentSearch, setStudentSearch] = useState('');

  // Detailed Records Filters
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('present');
  const [editRemarks, setEditRemarks] = useState('');

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setSelectedMonth(prevDate.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    setSelectedMonth(nextDate.toISOString().slice(0, 7));
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(new Date().toISOString().slice(0, 7));
  };

  const monthDisplayTitle = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const dateObj = new Date(y, m - 1, 1);
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Days in selected month
  const daysInMonth = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const totalDays = new Date(y, m, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const dayStr = String(dayNum).padStart(2, '0');
      const dateStr = `${selectedMonth}-${dayStr}`;
      const dateObj = new Date(y, m - 1, dayNum);
      const dayOfWeek = dateObj.getDay(); // 0 is Sun, 6 is Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isSunday = dayOfWeek === 0;
      const weekdayShort = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][dayOfWeek];
      const isToday = dateStr === new Date().toISOString().slice(0, 10);

      return {
        dayNum,
        dayStr,
        dateStr,
        weekdayShort,
        isWeekend,
        isSunday,
        isToday
      };
    });
  }, [selectedMonth]);

  // Map of student_id + '_' + date -> AttendanceRecord for O(1) lookups
  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendance.forEach(rec => {
      map.set(`${rec.student_id}_${rec.date}`, rec);
    });
    return map;
  }, [attendance]);

  // Filtered Students for Monthly Matrix
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (!s) return false;
      const matchCollege = selectedCollege === 'ALL' || s.college_id === selectedCollege;
      const matchGroup = selectedGroup === 'ALL' || s.group_id === selectedGroup;
      const q = studentSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        (s.full_name || '').toLowerCase().includes(q) ||
        String(s.student_reg_no || '').toLowerCase().includes(q);
      return matchCollege && matchGroup && matchSearch;
    });
  }, [students, selectedCollege, selectedGroup, studentSearch]);

  // Filtered Detailed Records
  const filteredRecords = useMemo(() => {
    return attendance.filter(r => {
      const matchDate = !selectedDate || r.date === selectedDate;
      const matchCollege =
        selectedCollege === 'ALL' ||
        r.student?.college_id === selectedCollege ||
        groups.find(g => g.id === r.group_id)?.college_id === selectedCollege;
      const matchGroup = selectedGroup === 'ALL' || r.group_id === selectedGroup;
      const matchStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
      const q = studentSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        (r.student?.full_name || '').toLowerCase().includes(q) ||
        String(r.student?.student_reg_no || '').toLowerCase().includes(q);

      return matchDate && matchCollege && matchGroup && matchStatus && matchSearch;
    });
  }, [attendance, selectedDate, selectedCollege, selectedGroup, selectedStatus, studentSearch, groups]);

  // Monthly statistics based on filtered students in the selected month
  const monthlyStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;

    const studentIds = new Set(filteredStudents.map(s => s.id));

    attendance.forEach(r => {
      if (r.date.startsWith(selectedMonth) && studentIds.has(r.student_id)) {
        if (r.status === 'present') present++;
        else if (r.status === 'absent') absent++;
        else if (r.status === 'leave') leave++;
      }
    });

    const total = present + absent + leave;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { present, absent, leave, total, rate };
  }, [attendance, selectedMonth, filteredStudents]);

  // Detailed records statistics
  const presentCount = filteredRecords.filter(r => r.status === 'present').length;
  const absentCount = filteredRecords.filter(r => r.status === 'absent').length;
  const leaveCount = filteredRecords.filter(r => r.status === 'leave').length;
  const totalCount = filteredRecords.length;
  const attendancePercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // Identify students with overall attendance < 75%
  const lowAttendanceStudents = useMemo(() => {
    const list = selectedCollege === 'ALL' ? students : students.filter(s => s && s.college_id === selectedCollege);
    return list.filter(s => {
      const sRecords = attendance.filter(a => a.student_id === s.id);
      if (sRecords.length === 0) return false;
      const sPresent = sRecords.filter(a => a.status === 'present').length;
      const pct = (sPresent / sRecords.length) * 100;
      return pct < 75;
    });
  }, [students, attendance, selectedCollege]);

  // Download handlers for Monthly Matrix
  const handleDownloadMatrixExcel = () => {
    exportMonthlyAttendanceMatrixToExcel(
      monthDisplayTitle,
      daysInMonth,
      filteredStudents,
      groups,
      attendanceMap
    );
  };

  const handleDownloadMatrixPdf = () => {
    generateMonthlyAttendanceMatrixPdf(
      monthDisplayTitle,
      daysInMonth,
      filteredStudents,
      groups,
      attendanceMap
    );
  };

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
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
              {viewMode === 'monthly' ? 'Monthly Register View' : 'Record Logs View'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Student Attendance Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            MES College student presence register, monthly matrix overview, and compliance records.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold mr-1">
            <button
              onClick={() => setViewMode('monthly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'monthly'
                  ? 'bg-white text-blue-700 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Monthly Matrix
            </button>
            <button
              onClick={() => setViewMode('records')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'records'
                  ? 'bg-white text-blue-700 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Detailed Logs
            </button>
          </div>

          {viewMode === 'monthly' ? (
            <>
              <button
                onClick={handleDownloadMatrixExcel}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors shadow-xs"
                title="Download this monthly matrix as an Excel spreadsheet (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Download Matrix (Excel)
              </button>

              <button
                onClick={handleDownloadMatrixPdf}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors shadow-xs"
                title="Download this monthly matrix as a PDF document"
              >
                <FileDown className="w-4 h-4 text-blue-600" />
                Download Matrix (PDF)
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => exportAttendanceToExcel(filteredRecords)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel Export
              </button>

              <button
                onClick={() => generateAttendancePdf(filteredRecords, selectedGroup === 'ALL' ? 'MES All Cohorts' : 'Cohort', selectedDate || selectedMonth)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors"
              >
                <FileDown className="w-4 h-4" />
                PDF Report
              </button>
            </>
          )}

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

      {/* Low Attendance Warning Alert */}
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

      {/* Attendance Stats Cards - 4 Focused Cards (Present, Absent, Leave, Rate) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">
            {viewMode === 'monthly' ? `${monthDisplayTitle} Rate` : 'Attendance Rate'}
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {viewMode === 'monthly' ? monthlyStats.rate : attendancePercent}%
          </p>
          <span className="text-[10px] text-slate-400">
            {viewMode === 'monthly' ? `${monthlyStats.total} total sessions logged` : `${totalCount} records matched`}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase">Present</span>
            <span className="w-5 h-5 rounded-md bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center">
              P
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {viewMode === 'monthly' ? monthlyStats.present : presentCount}
          </p>
          <span className="text-[10px] text-slate-400">Attended sessions</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-600 uppercase">Absent</span>
            <span className="w-5 h-5 rounded-md bg-rose-500 text-white font-black text-[10px] flex items-center justify-center">
              A
            </span>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {viewMode === 'monthly' ? monthlyStats.absent : absentCount}
          </p>
          <span className="text-[10px] text-slate-400">Unexcused absence</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-600 uppercase">Leave</span>
            <span className="w-5 h-5 rounded-md bg-blue-500 text-white font-black text-[10px] flex items-center justify-center">
              L
            </span>
          </div>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {viewMode === 'monthly' ? monthlyStats.leave : leaveCount}
          </p>
          <span className="text-[10px] text-slate-400">Authorized leave</span>
        </div>
      </div>

      {/* Primary Month Navigator & Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Changeable Month Navigator */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Select Month:
            </span>

            <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 p-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg text-slate-600 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 py-1 text-xs font-black text-slate-900 tracking-tight min-w-[130px] text-center">
                {monthDisplayTitle}
              </div>

              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white hover:text-blue-600 rounded-lg text-slate-600 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            <button
              onClick={handleCurrentMonth}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Current Month
            </button>
          </div>

          {/* Color Legend Bar */}
          <div className="flex items-center gap-3 flex-wrap text-xs bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-emerald-500 text-white font-black text-[11px] flex items-center justify-center shadow-xs">
                P
              </span>
              <span className="font-semibold text-slate-700 text-xs">Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-rose-500 text-white font-black text-[11px] flex items-center justify-center shadow-xs">
                A
              </span>
              <span className="font-semibold text-slate-700 text-xs">Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-blue-500 text-white font-black text-[11px] flex items-center justify-center shadow-xs">
                L
              </span>
              <span className="font-semibold text-slate-700 text-xs">Leave</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-white border border-slate-300 text-slate-400 font-bold text-[11px] flex items-center justify-center">
                -
              </span>
              <span className="text-slate-500 text-xs">Unrecorded</span>
            </div>
          </div>
        </div>

        {/* Second Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              Filter by Project Group
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
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Search Student
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Name or Reg No..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
              />
            </div>
          </div>

          {viewMode === 'records' ? (
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
                <option value="present">Present (P)</option>
                <option value="absent">Absent (A)</option>
                <option value="leave">Leave (L)</option>
              </select>
            </div>
          ) : (
            <div className="flex items-end">
              <div className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Monthly Register Matrix • View-only display (use &apos;Mark Attendance Batch&apos; to record attendance)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: MONTHLY ATTENDANCE REGISTER MATRIX */}
      {viewMode === 'monthly' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Monthly Register Matrix: {monthDisplayTitle}
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                ({filteredStudents.length} Students Listed)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadMatrixExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors shadow-xs"
                title="Download this monthly matrix as an Excel spreadsheet (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Download Matrix (Excel)
              </button>

              <button
                onClick={handleDownloadMatrixPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors shadow-xs"
                title="Download this monthly matrix as a PDF document"
              >
                <FileDown className="w-3.5 h-3.5" />
                Download Matrix (PDF)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
                  {/* Fixed left headers */}
                  <th className="py-2.5 px-3 sticky left-0 z-20 bg-slate-100 w-12 text-center border-r border-slate-200">
                    #
                  </th>
                  <th className="py-2.5 px-4 sticky left-12 z-20 bg-slate-100 min-w-[190px] border-r border-slate-200">
                    Student Details
                  </th>
                  <th className="py-2.5 px-3 min-w-[120px] border-r border-slate-200">
                    Group
                  </th>

                  {/* Date column headers */}
                  {daysInMonth.map((d) => (
                    <th
                      key={d.dateStr}
                      className={`py-2 px-1 text-center min-w-[34px] max-w-[38px] border-r border-slate-200/70 transition-colors ${
                        d.isToday
                          ? 'bg-blue-100/90 text-blue-900 font-black ring-1 ring-blue-400'
                          : d.isWeekend
                          ? 'bg-slate-200/50 text-slate-500'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                      title={`${d.dateStr} (${d.weekdayShort})`}
                    >
                      <div className="text-[11px] font-black leading-none">{d.dayStr}</div>
                      <div className={`text-[9px] mt-0.5 font-bold ${d.isSunday ? 'text-rose-500' : 'text-slate-400'}`}>
                        {d.weekdayShort}
                      </div>
                    </th>
                  ))}

                  {/* Summary columns */}
                  <th className="py-2.5 px-2 text-center bg-emerald-50 text-emerald-800 font-black min-w-[42px] border-l border-slate-200" title="Present Count">
                    P
                  </th>
                  <th className="py-2.5 px-2 text-center bg-rose-50 text-rose-800 font-black min-w-[42px]" title="Absent Count">
                    A
                  </th>
                  <th className="py-2.5 px-2 text-center bg-blue-50 text-blue-800 font-black min-w-[42px]" title="Leave Count">
                    L
                  </th>
                  <th className="py-2.5 px-3 text-center bg-slate-100 text-slate-900 font-black min-w-[55px] border-l border-slate-200" title="Monthly Percentage">
                    %
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={daysInMonth.length + 7} className="py-16 text-center text-slate-400">
                      No students found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => {
                    const group = groups.find(g => g && g.id === student.group_id);

                    // Compute per-student totals for this month
                    let studentP = 0;
                    let studentA = 0;
                    let studentL = 0;

                    daysInMonth.forEach(d => {
                      const rec = attendanceMap.get(`${student.id}_${d.dateStr}`);
                      if (rec) {
                        if (rec.status === 'present') studentP++;
                        else if (rec.status === 'absent') studentA++;
                        else if (rec.status === 'leave') studentL++;
                      }
                    });

                    const studentTotal = studentP + studentA + studentL;
                    const studentPct = studentTotal > 0 ? Math.round((studentP / studentTotal) * 100) : 100;
                    const isLowAttendance = studentTotal > 0 && studentPct < 75;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Row Index */}
                        <td className="py-2.5 px-3 sticky left-0 z-10 bg-white text-center font-mono font-medium text-slate-400 border-r border-slate-100">
                          {idx + 1}
                        </td>

                        {/* Student Name & Reg No */}
                        <td className="py-2.5 px-4 sticky left-12 z-10 bg-white border-r border-slate-100">
                          <div className="font-bold text-slate-900 truncate max-w-[180px]">
                            {student.full_name}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500">
                            Reg: {student.student_reg_no || '-'}
                          </div>
                        </td>

                        {/* Group Name */}
                        <td className="py-2.5 px-3 border-r border-slate-100">
                          <span className="font-semibold text-slate-700 truncate max-w-[120px] block">
                            {group ? group.name : 'Unassigned'}
                          </span>
                        </td>

                        {/* Date Grid Cells */}
                        {daysInMonth.map((d) => {
                          const record = attendanceMap.get(`${student.id}_${d.dateStr}`);
                          const status = record?.status;

                          let badgeClasses = 'bg-slate-50/80 text-slate-300 border border-slate-200/80 border-dashed';
                          let label = '-';

                          if (status === 'present') {
                            badgeClasses = 'bg-emerald-500 text-white font-black shadow-xs';
                            label = 'P';
                          } else if (status === 'absent') {
                            badgeClasses = 'bg-rose-500 text-white font-black shadow-xs';
                            label = 'A';
                          } else if (status === 'leave') {
                            badgeClasses = 'bg-blue-500 text-white font-black shadow-xs';
                            label = 'L';
                          }

                          return (
                            <td
                              key={d.dateStr}
                              className={`py-1.5 px-1 text-center border-r border-slate-100 ${
                                d.isToday ? 'bg-blue-50/30' : d.isWeekend ? 'bg-slate-50/50' : ''
                              }`}
                            >
                              <div
                                className={`w-7 h-7 sm:w-8 sm:h-7 mx-auto rounded-md text-xs flex items-center justify-center font-bold select-none cursor-default ${badgeClasses}`}
                                title={`${student.full_name} on ${d.dateStr}: ${status ? status.toUpperCase() : 'Unrecorded'}`}
                              >
                                {label}
                              </div>
                            </td>
                          );
                        })}

                        {/* Summary Counts */}
                        <td className="py-2.5 px-2 text-center bg-emerald-50/50 font-black text-emerald-700 border-l border-slate-100">
                          {studentP}
                        </td>
                        <td className="py-2.5 px-2 text-center bg-rose-50/50 font-black text-rose-700">
                          {studentA}
                        </td>
                        <td className="py-2.5 px-2 text-center bg-blue-50/50 font-black text-blue-700">
                          {studentL}
                        </td>
                        <td className="py-2.5 px-3 text-center bg-slate-50/60 font-black border-l border-slate-100">
                          <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                            isLowAttendance
                              ? 'bg-amber-100 text-amber-800 font-bold'
                              : 'text-slate-800'
                          }`}>
                            {studentPct}%
                          </span>
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

      {/* VIEW MODE 2: DETAILED RECORD LOGS */}
      {viewMode === 'records' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Detailed Attendance Logs
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                ({filteredRecords.length} Records)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Register No</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Audit Remarks</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
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
      )}

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
                <option value="present">Present (P)</option>
                <option value="absent">Absent (A)</option>
                <option value="leave">Leave (L)</option>
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
