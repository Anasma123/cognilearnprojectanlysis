// ==============================================================================
// COGNILEARN EXCEL EXPORT SERVICE
// Generates Clean XLSX Workbooks using SheetJS
// ==============================================================================

import * as XLSX from 'xlsx';
import { Student, Group, AttendanceRecord, WeeklyReport, Task } from '../types';
import { formatDateIndian } from './formatters';

export function exportStudentsToExcel(students: Student[], filename = 'Cognilearn_Student_Directory.xlsx') {
  const data = students.map((s, index) => ({
    'Sl. No': index + 1,
    'Student Reg No': s.student_reg_no,
    'Full Name': s.full_name,
    'Email Address': s.email,
    'Phone Number': s.phone || '-',
    'College Name': s.college?.name || 'MES College',
    'Course': s.course?.name || s.department,
    'Class / Year': s.class_year,
    'Group Code': s.group?.group_code || '-',
    'Role in Group': s.assigned_role,
    'Joining Date': formatDateIndian(s.joining_date),
    'Status': s.status.toUpperCase(),
    'Notes': s.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  XLSX.writeFile(workbook, filename);
}

export function exportGroupsToExcel(groups: Group[], filename = 'Cognilearn_Groups_Directory.xlsx') {
  const data = groups.map((g, index) => ({
    'Sl. No': index + 1,
    'Group Code': g.group_code,
    'Group Name': g.name,
    'College': g.college?.name || 'MES College',
    'Course': g.course?.name || '-',
    'Class / Year': g.class_year,
    'Mentor': g.mentor?.full_name || 'Unassigned',
    'Group Leader': g.leader?.full_name || '-',
    'Project Title': g.project_title || g.project?.title || '-',
    'Members Count': g.members?.length || 0,
    'Start Date': formatDateIndian(g.start_date),
    'Expected End Date': formatDateIndian(g.expected_completion_date),
    'Status': g.status.toUpperCase()
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Groups');
  XLSX.writeFile(workbook, filename);
}

export function exportAttendanceToExcel(records: AttendanceRecord[], filename = 'Cognilearn_Attendance_Report.xlsx') {
  const data = records.map((r, index) => ({
    'Sl. No': index + 1,
    'Date': formatDateIndian(r.date),
    'Reg No': r.student?.student_reg_no || '-',
    'Student Name': r.student?.full_name || '-',
    'Class / Course': r.student?.class_year || '-',
    'Attendance Status': r.status.toUpperCase(),
    'Remarks / Audit Note': r.remarks || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records');
  XLSX.writeFile(workbook, filename);
}

export function exportWeeklyReportsToExcel(reports: WeeklyReport[], filename = 'Cognilearn_Weekly_Progress_History.xlsx') {
  const data = reports.map((w) => ({
    'Week': `Week ${w.week_number}`,
    'Date Period': `${formatDateIndian(w.start_date)} to ${formatDateIndian(w.end_date)}`,
    'Group Code': w.group?.group_code || '-',
    'Project Title': w.project?.title || '-',
    'Submitted By': w.submitter?.full_name || 'Group Member',
    'Submission Date': formatDateIndian(w.submitted_at),
    'Review Status': w.review_status.toUpperCase(),
    'Activities Completed': w.activities_completed,
    'Tasks Completed': w.tasks_completed,
    'Problems Faced': w.problems_faced || 'None reported',
    'Solutions Implemented': w.solutions_implemented || '-',
    'Next Week Plan': w.next_week_plan,
    'Mentor Feedback': w.mentor_feedback || 'Pending Review'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Weekly Progress');
  XLSX.writeFile(workbook, filename);
}

export function exportTasksToExcel(tasks: Task[], filename = 'Cognilearn_Tasks_Export.xlsx') {
  const data = tasks.map((t, index) => ({
    'Sl. No': index + 1,
    'Task Title': t.title,
    'Project': t.project?.title || '-',
    'Assigned Student': t.assigned_student?.full_name || 'Unassigned',
    'Assigned Date': formatDateIndian(t.assigned_date),
    'Due Date': formatDateIndian(t.due_date),
    'Priority': t.priority.toUpperCase(),
    'Status': t.status.toUpperCase(),
    'Description': t.description || '',
    'Completion Notes': t.completion_notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Project Tasks');
  XLSX.writeFile(workbook, filename);
}

export interface AutomatedGroupExportRow {
  group_code: string;
  group_name: string;
  project_title: string;
  lifecycle_status: string;
  progress_percentage: number;
  presentations_summary: string;
  milestones_summary: string;
  tasks_summary: string;
  attendance_rate: string;
  fee_total: number;
  fee_paid: number;
  fee_balance: number;
  health_status: string;
  timeframe: string;
}

export interface AutomatedStudentExportRow {
  student_reg_no: string;
  full_name: string;
  group_code: string;
  group_name: string;
  assigned_role: string;
  department: string;
  attendance_rate: string;
  tasks_completed_count: number;
  tasks_total_count: number;
  fee_paid: number;
  fee_balance: number;
  payment_status: string;
  performance_rating: string;
  timeframe: string;
}

export function exportAutomatedGroupReportToExcel(rows: AutomatedGroupExportRow[], filename = 'Cognilearn_Group_Intelligence_Report.xlsx') {
  const data = rows.map((r, idx) => ({
    'Sl. No': idx + 1,
    'Group Code': r.group_code,
    'Group Name': r.group_name,
    'Project Title': r.project_title,
    'Lifecycle Status': r.lifecycle_status,
    'Progress %': `${r.progress_percentage}%`,
    'Presentations': r.presentations_summary,
    'Milestones': r.milestones_summary,
    'Tasks': r.tasks_summary,
    'Attendance': r.attendance_rate,
    'Total Fee (INR)': r.fee_total,
    'Fee Paid (INR)': r.fee_paid,
    'Fee Balance (INR)': r.fee_balance,
    'Health / Status': r.health_status,
    'Report Scope': r.timeframe
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Group Intelligence');
  XLSX.writeFile(workbook, filename);
}

export function exportAutomatedStudentReportToExcel(rows: AutomatedStudentExportRow[], filename = 'Cognilearn_Student_Performance_Report.xlsx') {
  const data = rows.map((r, idx) => ({
    'Sl. No': idx + 1,
    'Reg No': r.student_reg_no,
    'Full Name': r.full_name,
    'Group Code': r.group_code,
    'Group Name': r.group_name,
    'Role in Group': r.assigned_role,
    'Department': r.department,
    'Attendance Rate': r.attendance_rate,
    'Tasks Completed': `${r.tasks_completed_count} of ${r.tasks_total_count}`,
    'Fee Paid (INR)': r.fee_paid,
    'Fee Balance (INR)': r.fee_balance,
    'Payment Status': r.payment_status.toUpperCase(),
    'Performance Standing': r.performance_rating,
    'Report Scope': r.timeframe
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Performance');
  XLSX.writeFile(workbook, filename);
}

export function exportMonthlyAttendanceMatrixToExcel(
  monthTitle: string,
  days: { dayStr: string; dateStr: string; weekdayShort: string }[],
  students: Student[],
  groups: Group[],
  attendanceMap: Map<string, AttendanceRecord>,
  filename?: string
) {
  const data = students.map((s, index) => {
    const group = groups.find(g => g && g.id === s.group_id);

    let pCount = 0;
    let aCount = 0;
    let lCount = 0;

    const row: Record<string, any> = {
      'Sl. No': index + 1,
      'Reg No': s.student_reg_no || '-',
      'Student Name': s.full_name,
      'Project Group': group ? group.name : 'Unassigned',
    };

    days.forEach(d => {
      const rec = attendanceMap.get(`${s.id}_${d.dateStr}`);
      const colHeader = `${d.dayStr} (${d.weekdayShort})`;
      if (!rec) {
        row[colHeader] = '-';
      } else if (rec.status === 'present') {
        row[colHeader] = 'P';
        pCount++;
      } else if (rec.status === 'absent') {
        row[colHeader] = 'A';
        aCount++;
      } else if (rec.status === 'leave') {
        row[colHeader] = 'L';
        lCount++;
      } else {
        row[colHeader] = '-';
      }
    });

    const total = pCount + aCount + lCount;
    const rate = total > 0 ? Math.round((pCount / total) * 100) : 100;

    row['Total Present (P)'] = pCount;
    row['Total Absent (A)'] = aCount;
    row['Total Leave (L)'] = lCount;
    row['Attendance %'] = `${rate}%`;

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Matrix');
  XLSX.writeFile(workbook, filename || `Attendance_Matrix_${monthTitle.replace(/\s+/g, '_')}.xlsx`);
}
