// ==============================================================================
// COGNILEARN PROFESSIONAL PDF EXPORT SERVICE
// Generates Branded Reports with Header, Tables and Signatures
// ==============================================================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, Group, Project, AttendanceRecord, WeeklyReport, Evaluation, College, Course, StudentPayment, Task, ProjectDocument } from '../types';
import { formatDateIndian } from './formatters';

const PRIMARY_COLOR: [number, number, number] = [15, 23, 42]; // Navy #0f172a
const ACCENT_COLOR: [number, number, number] = [30, 64, 175]; // Blue #1e40af
const TEXT_MUTED: [number, number, number] = [100, 116, 139];

/**
 * Standard PDF-safe currency formatter (uses 'Rs. ' instead of Unicode '₹' to prevent font encoding glitches)
 */
function formatCurrencyPdf(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rs. 0';
  return 'Rs. ' + Math.round(amount).toLocaleString('en-IN');
}

function addCognilearnHeader(doc: jsPDF, title: string, subtitle = 'Academic Project Tracking & Management System') {
  // Brand Header Bar
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, 210, 24, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('COGNILEARN', 14, 12);

  // Subtitle
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('ACADEMIC PROJECT MONITORING & EVALUATION SYSTEM', 14, 18);

  // Generation timestamp
  const dateStr = `Generated: ${formatDateIndian(new Date().toISOString())}`;
  doc.setFontSize(8);
  doc.text(dateStr, 196, 15, { align: 'right' });

  // Document Title
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 35);

  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 14, 41);

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 45, 196, 45);
}

function addReportFooter(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text('Cognilearn Academic Management System | Confidential Office Document', 14, 290);
    doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: 'right' });
  }
}

/**
 * Generate Individual Student Profile PDF - Exhaustive Academic & Financial Dossier
 */
export interface ComprehensiveStudentDossierOptions {
  group?: Group;
  project?: Project;
  payment?: StudentPayment;
  attendanceRecords?: AttendanceRecord[];
  tasks?: Task[];
  staffInChargeName?: string;
}

export function generateStudentProfilePdf(student: Student, options?: ComprehensiveStudentDossierOptions) {
  const doc = new jsPDF();
  const collegeName = student.college?.name || 'Academic Institution';
  const group = options?.group || student.group;
  const project = options?.project || student.group?.project;
  const payment = options?.payment;
  const attendanceRecords = options?.attendanceRecords || [];
  const tasks = options?.tasks || [];
  const staffName = options?.staffInChargeName || group?.coordinator_name || group?.mentor?.full_name || 'Staff Coordinator';

  addCognilearnHeader(
    doc,
    `STUDENT ACADEMIC & FINANCIAL DOSSIER: ${student.full_name.toUpperCase()}`,
    `Register No: ${student.student_reg_no} | College: ${collegeName}`
  );

  // 1. Executive Student Profile Table
  const profileDetails = [
    ['Register Number', String(student.student_reg_no), 'Academic Status', student.status.toUpperCase()],
    ['Full Name', student.full_name, 'Joining Date', formatDateIndian(student.joining_date)],
    ['Email Address', student.email, 'Contact Phone', student.phone || 'N/A'],
    ['Institution', collegeName, 'Department / Course', student.course?.name || student.department || 'N/A'],
    ['Class / Year', student.class_year || 'Final Year', 'Assigned Team Role', student.assigned_role || 'Member'],
    ['Assigned Group', group?.name || 'Unassigned', 'Assigned Project', project?.title || 'Dissertation Project']
  ];

  autoTable(doc, {
    startY: 50,
    head: [['Attribute', 'Details', 'Attribute', 'Details']],
    body: profileDetails,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 8, overflow: 'linebreak', cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: 'bold' },
      1: { cellWidth: 65 },
      2: { cellWidth: 28, fontStyle: 'bold' },
      3: { cellWidth: 63 }
    }
  });

  // 2. Financial Ledger & Fee Payment Compliance Table
  let currentY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('1. Student Fee Ledger & Financial Compliance:', 14, currentY);

  const fee = payment?.total_fee ?? student.total_fee ?? 15000;
  const paid = payment?.paid_amount ?? student.paid_amount ?? 0;
  const balance = payment?.balance_amount ?? (fee - paid);
  const feeStatus = (payment?.status || (balance === 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid')).toUpperCase();
  const lastPaymentStr = payment?.last_payment_date ? formatDateIndian(payment.last_payment_date) : 'No payments logged';

  const feeData = [
    ['Total Course / Lab Fee', formatCurrencyPdf(fee), 'Fee Clearance Status', feeStatus],
    ['Total Amount Paid', formatCurrencyPdf(paid), 'Last Payment Date', lastPaymentStr],
    ['Outstanding Balance Due', formatCurrencyPdf(balance), 'Payment Compliance', balance === 0 ? 'CLEAR (No Dues)' : `OUTSTANDING: ${formatCurrencyPdf(balance)}`]
  ];

  autoTable(doc, {
    startY: currentY + 3,
    body: feeData,
    theme: 'grid',
    headStyles: { fillColor: ACCENT_COLOR, textColor: 255 },
    styles: { fontSize: 8, overflow: 'linebreak', cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 49 },
      2: { cellWidth: 42, fontStyle: 'bold' },
      3: { cellWidth: 49 }
    }
  });

  // 3. Laboratory & Sprint Attendance Audit
  currentY = (doc as any).lastAutoTable.finalY + 8;
  if (currentY > 235) { doc.addPage(); currentY = 20; }

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('2. Laboratory & Sprint Attendance Audit:', 14, currentY);

  const totalSessions = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
  const absentDays = attendanceRecords.filter(a => a.status === 'absent').length;
  const leaveDays = attendanceRecords.filter(a => a.status === 'leave').length;
  const attendanceRate = totalSessions > 0 ? Math.round((presentDays / totalSessions) * 100) : 100;
  const academicClearance = attendanceRate >= 75 ? 'ELIGIBLE FOR SUBMISSION' : 'ATTENDANCE SHORTAGE';

  const attendanceData = [
    ['Total Sessions Logged', String(totalSessions), 'Attendance Rate', `${attendanceRate}%`],
    ['Present Days', String(presentDays), 'Absent Days', String(absentDays)],
    ['Approved Leave', String(leaveDays), 'Academic Clearance', academicClearance]
  ];

  autoTable(doc, {
    startY: currentY + 3,
    body: attendanceData,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 8, overflow: 'linebreak', cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 49 },
      2: { cellWidth: 42, fontStyle: 'bold' },
      3: { cellWidth: 49 }
    }
  });

  // 4. Assigned Sprint Tasks & Deliverables Table
  currentY = (doc as any).lastAutoTable.finalY + 8;
  if (currentY > 235) { doc.addPage(); currentY = 20; }

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('3. Assigned Sprint Tasks & Deliverables:', 14, currentY);

  const studentTasks = tasks.filter(t => t.assigned_student_id === student.id);
  const displayTasks = studentTasks.length > 0 ? studentTasks : tasks.slice(0, 5);

  const taskRows = displayTasks.map((t, idx) => [
    idx + 1,
    t.title,
    (t.priority || 'medium').toUpperCase(),
    (t.status || 'todo').toUpperCase(),
    t.due_date ? formatDateIndian(t.due_date) : 'N/A'
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Task Title & Deliverable', 'Priority', 'Status', 'Due Date']],
    body: taskRows.length > 0 ? taskRows : [['-', 'No active sprint tasks registered for this student', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: ACCENT_COLOR, textColor: 255 },
    styles: { fontSize: 7.5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 94 },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 28, halign: 'center' },
      4: { cellWidth: 26, halign: 'center' }
    }
  });

  // 5. Mentor & Institutional Remarks
  currentY = (doc as any).lastAutoTable.finalY + 8;
  if (currentY > 235) { doc.addPage(); currentY = 20; }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Mentor & Institutional Remarks:', 14, currentY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const remarks = student.notes || 'Student is in good academic standing, maintaining required lab presence and sprint participation.';
  const splitRemarks = doc.splitTextToSize(remarks, 182);
  doc.text(splitRemarks, 14, currentY + 5);

  // 6. Signatures Block
  currentY += 8 + (splitRemarks.length * 3.8);
  if (currentY > 245) { doc.addPage(); currentY = 25; }

  const sigY = currentY + 14;
  doc.setDrawColor(148, 163, 184);
  doc.line(14, sigY, 75, sigY);
  doc.line(135, sigY, 196, sigY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text(`Staff In-Charge: ${staffName}`, 14, sigY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Project Coordinator & Mentor', 14, sigY + 9);

  doc.setFont('helvetica', 'bold');
  doc.text('Academic Controller / HOD', 135, sigY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Student Academic Evaluation Cell', 135, sigY + 9);

  addReportFooter(doc);
  doc.save(`Student_${student.student_reg_no}_${student.full_name.replace(/[^a-zA-Z0-9]/g, '_')}_Dossier.pdf`);
}

/**
 * Comprehensive Group Dossier & Academic Audit PDF
 * Generates an exhaustive report of the entire group and its students:
 * Overview, Project details, Student profiles, Fees ledger, Attendance audit, Tasks & Weekly reports.
 */
export interface ComprehensiveGroupDossierData {
  group: Group;
  project?: Project;
  students?: Student[];
  payments?: StudentPayment[];
  attendance?: AttendanceRecord[];
  tasks?: Task[];
  weeklyReports?: WeeklyReport[];
  staffInChargeName?: string;
}

export function generateComprehensiveGroupDossierPdf(data: ComprehensiveGroupDossierData) {
  const {
    group,
    project,
    students = [],
    payments = [],
    attendance = [],
    tasks = [],
    weeklyReports = [],
    staffInChargeName = 'Staff Coordinator'
  } = data;

  const doc = new jsPDF();
  const collegeName = group.college?.name || 'Academic Institution';

  addCognilearnHeader(
    doc,
    `COHORT AUDIT DOSSIER: ${group.name.toUpperCase()}`,
    `Group Code: ${group.group_code} | College: ${collegeName}`
  );

  // 1. Executive Cohort & Project Summary Table
  const statusStr = String(group.status || 'in_progress').toUpperCase();
  const progressStr = `${project?.progress_percentage ?? 0}%`;
  const leaderName = group.leader?.full_name || (students.find(s => s.id === group.group_leader_id)?.full_name) || 'Assigned';
  const staffName = staffInChargeName || group.coordinator_name || group.mentor?.full_name || 'Staff Coordinator';

  const phases = project?.lifecycle_phases;
  const verifiedCount = [phases?.planning, phases?.design, phases?.development, phases?.testing].filter(Boolean).length;
  const verifiedPhasesStr = verifiedCount === 4
    ? '4/4 Verified (All Phases Done)'
    : verifiedCount > 0
    ? `${verifiedCount}/4 Verified (${[
        phases?.planning ? 'Plan' : '',
        phases?.design ? 'Design' : '',
        phases?.development ? 'Dev' : '',
        phases?.testing ? 'Test' : ''
      ].filter(Boolean).join(', ')})`
    : '0/4 Verified (In Planning)';

  const infoRows = [
    ['Group Code', group.group_code, 'Cohort Status', statusStr],
    ['Project Title', project?.title || group.project_title || 'Dissertation Project', 'Overall Progress', progressStr],
    ['Staff In-Charge', staffName, 'Student Leader', leaderName],
    ['Start Date', formatDateIndian(group.start_date), 'Target Completion', formatDateIndian(group.expected_completion_date)],
    ['Tech Stack', project?.technologies?.join(', ') || 'Full-Stack Software', 'Lifecycle Phases', verifiedPhasesStr],
    ['Git Repository', project?.repository_url || 'Internal Repository', 'Live Demo URL', project?.live_demo_url || 'Staging Environment']
  ];

  autoTable(doc, {
    startY: 50,
    head: [['Attribute', 'Details', 'Attribute', 'Details']],
    body: infoRows,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 8, overflow: 'linebreak', cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: 'bold' },
      1: { cellWidth: 65 },
      2: { cellWidth: 28, fontStyle: 'bold' },
      3: { cellWidth: 63 }
    }
  });

  // Resolve group members
  const memberList = (group.members && group.members.length > 0)
    ? group.members
    : students.filter(s => s.group_id === group.id || (group.member_ids || []).includes(s.id));

  // 2. Student Members Roster Table
  let currentY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('1. Student Members Academic Roster:', 14, currentY);

  const memberRows = memberList.map((m, idx) => [
    idx + 1,
    m.student_reg_no || 'REG-' + (idx + 1),
    m.full_name,
    m.assigned_role || (m.id === group.group_leader_id ? 'Group Leader' : 'Team Member'),
    m.email,
    m.phone || '-',
    m.class_year || 'Final Year'
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Register No', 'Student Name', 'Role', 'Email Address', 'Contact Phone', 'Year/Class']],
    body: memberRows.length > 0 ? memberRows : [['-', '-', 'No student members registered yet', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: ACCENT_COLOR, textColor: 255 },
    styles: { fontSize: 7.5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 38 },
      3: { cellWidth: 32 },
      4: { cellWidth: 42 },
      5: { cellWidth: 20 },
      6: { cellWidth: 16 }
    }
  });

  // 3. Student Attendance Breakdown Table
  currentY = (doc as any).lastAutoTable.finalY + 8;
  if (currentY > 240) { doc.addPage(); currentY = 20; }

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('2. Laboratory & Class Attendance Audit:', 14, currentY);

  const attendanceRows = memberList.map((m, idx) => {
    const studentRecords = attendance.filter(a => a.student_id === m.id);
    const totalSessions = studentRecords.length;
    const presentCount = studentRecords.filter(a => a.status === 'present' || a.status === 'late').length;
    const absentCount = studentRecords.filter(a => a.status === 'absent' || a.status === 'leave').length;
    const rate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;
    const compliance = rate >= 75 ? 'ELIGIBLE' : 'ATTENDANCE SHORTAGE';

    return [
      idx + 1,
      m.full_name,
      m.student_reg_no || '-',
      totalSessions,
      presentCount,
      absentCount,
      `${rate}%`,
      compliance
    ];
  });

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Student Name', 'Reg No', 'Total Sessions', 'Present Days', 'Absent Days', 'Attendance Rate', 'Academic Clearance']],
    body: attendanceRows.length > 0 ? attendanceRows : [['-', 'No attendance records logged yet', '-', '0', '0', '0', '100%', 'ELIGIBLE']],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 7.5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 38 },
      2: { cellWidth: 20 },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 28, halign: 'center', fontStyle: 'bold' }
    }
  });

  // 4. Financial Ledger & Fee Payment Compliance Table
  currentY = (doc as any).lastAutoTable.finalY + 8;
  if (currentY > 240) { doc.addPage(); currentY = 20; }

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('3. Student Fee Ledger & Financial Compliance:', 14, currentY);

  let totalGroupFee = 0;
  let totalGroupPaid = 0;
  let totalGroupBalance = 0;

  const feeRows = memberList.map((m, idx) => {
    const p = payments.find(pay => pay.student_id === m.id);
    const fee = p?.total_fee ?? 15000;
    const paid = p?.paid_amount ?? 0;
    const balance = p?.balance_amount ?? (fee - paid);
    const status = (p?.status || (balance === 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid')).toUpperCase();

    totalGroupFee += fee;
    totalGroupPaid += paid;
    totalGroupBalance += balance;

    return [
      idx + 1,
      m.full_name,
      m.student_reg_no || '-',
      formatCurrencyPdf(fee),
      formatCurrencyPdf(paid),
      formatCurrencyPdf(balance),
      p?.last_payment_date ? formatDateIndian(p.last_payment_date) : '-',
      status
    ];
  });

  // Summary Row
  const feeComplianceStatus = totalGroupBalance === 0 ? 'FULLY SETTLED' : `OUTSTANDING: ${formatCurrencyPdf(totalGroupBalance)}`;
  feeRows.push([
    '',
    'COHORT TOTALS',
    '',
    formatCurrencyPdf(totalGroupFee),
    formatCurrencyPdf(totalGroupPaid),
    formatCurrencyPdf(totalGroupBalance),
    '',
    feeComplianceStatus
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Student Name', 'Reg No', 'Total Fee', 'Fee Paid', 'Balance Due', 'Last Payment', 'Status']],
    body: feeRows,
    theme: 'striped',
    headStyles: { fillColor: ACCENT_COLOR, textColor: 255 },
    styles: { fontSize: 7.5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 20 },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 26, halign: 'center', fontStyle: 'bold' }
    }
  });

  // 5. Sprint Tasks & Work Packages Table
  currentY = (doc as any).lastAutoTable.finalY + 8;
  if (currentY > 240) { doc.addPage(); currentY = 20; }

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('4. Sprint Tasks & Deliverable Tracking:', 14, currentY);

  const groupTasks = tasks.filter(t => t.group_id === group.id || (project && t.project_id === project.id));
  const taskRows = groupTasks.map((t, idx) => {
    const assignedStudent = memberList.find(m => m.id === t.assigned_student_id);
    return [
      idx + 1,
      t.title,
      assignedStudent?.full_name || 'Team Task',
      (t.priority || 'medium').toUpperCase(),
      (t.status || 'todo').toUpperCase(),
      t.due_date ? formatDateIndian(t.due_date) : 'N/A'
    ];
  });

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Task Title & Deliverable', 'Assigned To', 'Priority', 'Status', 'Due Date']],
    body: taskRows.length > 0 ? taskRows : [['-', 'No active sprint tasks registered', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 7.5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 68 },
      2: { cellWidth: 38 },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 24, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' }
    }
  });

  // 6. Chronological Weekly Progress Highlights
  currentY = (doc as any).lastAutoTable.finalY + 8;
  if (currentY > 240) { doc.addPage(); currentY = 20; }

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('5. Chronological Weekly Progress & Review Highlights:', 14, currentY);

  const groupWeekly = weeklyReports.filter(w => w.group_id === group.id);
  const weeklyRows = groupWeekly.map(w => [
    `Week ${w.week_number}`,
    `${formatDateIndian(w.start_date)} - ${formatDateIndian(w.end_date)}`,
    (w.review_status || 'submitted').toUpperCase(),
    w.activities_completed?.length > 80 ? w.activities_completed.substring(0, 80) + '...' : (w.activities_completed || 'Progress logged'),
    w.mentor_feedback ? (w.mentor_feedback.length > 60 ? w.mentor_feedback.substring(0, 60) + '...' : w.mentor_feedback) : 'Reviewed & Approved'
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Week', 'Timeline Scope', 'Review Status', 'Key Accomplishments', 'Staff Feedback']],
    body: weeklyRows.length > 0 ? weeklyRows : [['-', '-', '-', 'No weekly review logs recorded yet.', '-']],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 7.5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center' },
      1: { cellWidth: 34 },
      2: { cellWidth: 24, halign: 'center' },
      3: { cellWidth: 60 },
      4: { cellWidth: 48 }
    }
  });

  // 7. Academic Verification & Sign-Off Section
  currentY = (doc as any).lastAutoTable.finalY + 12;
  if (currentY > 245) { doc.addPage(); currentY = 30; }

  const sigY = currentY + 12;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);

  // Left Signature: Staff In-Charge
  doc.line(14, sigY, 75, sigY);
  doc.text(`Staff In-Charge: ${staffName}`, 14, sigY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Project Coordinator & Mentor', 14, sigY + 9);

  // Right Signature: Academic Controller
  doc.setFont('helvetica', 'bold');
  doc.line(135, sigY, 196, sigY);
  doc.text('Academic Controller / HOD', 135, sigY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Project Verification & Assessment Cell', 135, sigY + 9);

  addReportFooter(doc);
  doc.save(`Comprehensive_Dossier_${group.group_code}_${group.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

export function generateGroupSummaryPdf(
  group: Group,
  project?: Project,
  weeklyReports: WeeklyReport[] = [],
  students: Student[] = [],
  payments: StudentPayment[] = [],
  attendance: AttendanceRecord[] = [],
  tasks: Task[] = [],
  staffInChargeName?: string
) {
  return generateComprehensiveGroupDossierPdf({
    group,
    project,
    weeklyReports,
    students,
    payments,
    attendance,
    tasks,
    staffInChargeName
  });
}

/**
 * Generate Attendance Sheet PDF
 */
export function generateAttendancePdf(records: AttendanceRecord[], groupName = 'All Groups', period = 'Current Month') {
  const doc = new jsPDF();
  addCognilearnHeader(doc, `ATTENDANCE REPORT: ${groupName.toUpperCase()}`, `Audit Period: ${period}`);

  const rows = records.map((r, i) => [
    i + 1,
    formatDateIndian(r.date),
    r.student?.student_reg_no || '-',
    r.student?.full_name || '-',
    r.status.toUpperCase(),
    r.remarks || '-'
  ]);

  autoTable(doc, {
    startY: 50,
    head: [['#', 'Date', 'Reg No', 'Student Name', 'Status', 'Remarks']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 8 },
    didParseCell: (data) => {
      if (data.column.index === 4) {
        if (data.cell.raw === 'PRESENT') data.cell.styles.textColor = [16, 185, 129];
        else if (data.cell.raw === 'ABSENT') data.cell.styles.textColor = [239, 68, 68];
        else if (data.cell.raw === 'LEAVE') data.cell.styles.textColor = [59, 130, 246];
      }
    }
  });

  addReportFooter(doc);
  doc.save(`Attendance_Report_${groupName}.pdf`);
}

/**
 * Generate Final Project Comprehensive Report PDF - Exhaustive Architecture & Dissertation Portfolio
 */
export interface ComprehensiveProjectPortfolioOptions {
  students?: Student[];
  tasks?: Task[];
  documents?: ProjectDocument[];
  staffInChargeName?: string;
}

export function generateFinalProjectReportPdf(
  project: Project,
  group?: Group,
  evaluation?: Evaluation,
  options?: ComprehensiveProjectPortfolioOptions
) {
  const doc = new jsPDF();
  const collegeName = group?.college?.name || 'Academic Institution';
  const groupName = group?.name || 'Cohort Group';
  const staffName = options?.staffInChargeName || group?.coordinator_name || group?.mentor?.full_name || project.mentor?.full_name || 'Staff Coordinator';
  const students = options?.students || group?.members || [];
  const tasks = options?.tasks || [];
  const documents = options?.documents || [];

  addCognilearnHeader(
    doc,
    `PROJECT DISSERTATION & ARCHITECTURE DOSSIER`,
    `Project: ${project.title.toUpperCase()} | Group: ${groupName} | College: ${collegeName}`
  );

  // 1. Executive Meta & Architecture Table
  const phases = project.lifecycle_phases;
  const verifiedCount = [phases?.planning, phases?.design, phases?.development, phases?.testing].filter(Boolean).length;
  const verifiedPhasesStr = verifiedCount === 4
    ? '4/4 Verified (All Phases Done)'
    : verifiedCount > 0
    ? `${verifiedCount}/4 Verified (${[
        phases?.planning ? 'Plan' : '',
        phases?.design ? 'Design' : '',
        phases?.development ? 'Dev' : '',
        phases?.testing ? 'Test' : ''
      ].filter(Boolean).join(', ')})`
    : '0/4 Verified (In Planning)';

  const metaRows = [
    ['Project Title', project.title, 'Project Status', project.status.toUpperCase()],
    ['Domain Category', project.category, 'Overall Progress', `${project.progress_percentage}%`],
    ['Associated Group', groupName, 'Staff In-Charge', staffName],
    ['Start Date', formatDateIndian(project.start_date), 'Target Completion', formatDateIndian(project.expected_completion_date)],
    ['Tech Stack', (project.technologies || []).join(', ') || 'Software Stack', 'Lifecycle Phases', verifiedPhasesStr],
    ['Git Repository', project.repository_url || 'Internal Repository', 'Live Demo URL', project.live_demo_url || 'Staging Environment']
  ];

  autoTable(doc, {
    startY: 50,
    head: [['Attribute', 'Specification', 'Attribute', 'Specification']],
    body: metaRows,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 8, overflow: 'linebreak', cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: 'bold' },
      1: { cellWidth: 65 },
      2: { cellWidth: 28, fontStyle: 'bold' },
      3: { cellWidth: 63 }
    }
  });

  // 2. Problem Statement & Engineering Objectives
  let currentY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('1. Problem Statement & Engineering Objectives:', 14, currentY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const problemLines = doc.splitTextToSize(project.problem_statement || project.description || 'Project aims to deliver end-to-end cloud-native architecture with robust database and user interfaces.', 182);
  doc.text(problemLines, 14, currentY + 5);

  currentY += 6 + (problemLines.length * 3.8);

  // 3. Project Engineering Team (Students Roster)
  if (currentY > 235) { doc.addPage(); currentY = 20; }
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('2. Project Engineering Team & Student Roster:', 14, currentY);

  const studentRows = students.map((s, idx) => [
    idx + 1,
    s.student_reg_no || 'REG-' + (idx + 1),
    s.full_name,
    s.assigned_role || 'Developer',
    s.email,
    s.phone || '-'
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Register No', 'Student Name', 'Role', 'Email', 'Phone']],
    body: studentRows.length > 0 ? studentRows : [['-', '-', 'No student members assigned', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: ACCENT_COLOR, textColor: 255 },
    styles: { fontSize: 7.5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 46 },
      3: { cellWidth: 36 },
      4: { cellWidth: 42 },
      5: { cellWidth: 24 }
    }
  });

  // 4. Presentations & Evaluation Defense Rounds
  currentY = (doc as any).lastAutoTable.finalY + 8;
  if (currentY > 235) { doc.addPage(); currentY = 20; }

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('3. Presentation & Defense Review Rounds:', 14, currentY);

  const presRows = (project.presentations || []).map((p, idx) => [
    `Round ${p.round_number || (p as any).round || idx + 1}`,
    p.title || `Presentation Phase ${p.round_number || (p as any).round || idx + 1}`,
    formatDateIndian(p.date),
    p.status.toUpperCase(),
    p.feedback || (p as any).notes || 'Review completed by evaluation panel'
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Round', 'Presentation Title', 'Date', 'Status', 'Committee Feedback']],
    body: presRows.length > 0 ? presRows : [['Round 1', 'Dissertation Synopsis Review', formatDateIndian(project.start_date), 'COMPLETED', 'Initial proposal and system requirements approved']],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 7.5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 60 }
    }
  });

  // 5. Work Packages & Sprint Deliverables
  currentY = (doc as any).lastAutoTable.finalY + 8;
  if (currentY > 235) { doc.addPage(); currentY = 20; }

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('4. Work Packages & Sprint Deliverables:', 14, currentY);

  const projectTasks = tasks.filter(t => t.project_id === project.id || (group && t.group_id === group.id));
  const taskRows = projectTasks.map((t, idx) => {
    const assigned = students.find(s => s.id === t.assigned_student_id);
    return [
      idx + 1,
      t.title,
      assigned?.full_name || 'Team Work Package',
      (t.priority || 'medium').toUpperCase(),
      (t.status || 'todo').toUpperCase(),
      t.due_date ? formatDateIndian(t.due_date) : 'N/A'
    ];
  });

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Task Title & Deliverable', 'Assigned To', 'Priority', 'Status', 'Due Date']],
    body: taskRows.length > 0 ? taskRows : [['-', 'No active sprint deliverables logged', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: ACCENT_COLOR, textColor: 255 },
    styles: { fontSize: 7.5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 68 },
      2: { cellWidth: 38 },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 24, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' }
    }
  });

  // 6. Project Document Repository & Artifacts
  currentY = (doc as any).lastAutoTable.finalY + 8;
  if (currentY > 235) { doc.addPage(); currentY = 20; }

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('5. Project Document Repository & Artifacts:', 14, currentY);

  const projectDocs = documents.filter(d => d.project_id === project.id || (group && d.group_id === group.id));
  const docRows = projectDocs.map((d, idx) => [
    idx + 1,
    d.title,
    d.file_name,
    formatDateIndian(d.created_at)
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Document Title', 'File Name', 'Uploaded Date']],
    body: docRows.length > 0 ? docRows : [['-', 'Project Dissertation SRS & Source Archive', 'Dissertation_SRS_v1.0.pdf', formatDateIndian(project.start_date)]],
    theme: 'striped',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 7.5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 68 },
      3: { cellWidth: 36, halign: 'center' }
    }
  });

  // 7. Mentor Evaluation Matrix (if available)
  if (evaluation) {
    currentY = (doc as any).lastAutoTable.finalY + 8;
    if (currentY > 235) { doc.addPage(); currentY = 20; }

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text('6. Mentor Evaluation Matrix (Score / 10):', 14, currentY);

    const evalData = [
      ['Technical Skills', `${evaluation.technical_skills}/10`, 'Teamwork & Collaboration', `${evaluation.teamwork}/10`],
      ['Communication & Defense', `${evaluation.communication}/10`, 'Problem Solving & Innovation', `${evaluation.problem_solving}/10`],
      ['Project Management', `${evaluation.project_management}/10`, 'Overall Aggregate Performance', `${evaluation.overall_performance}/10`],
    ];

    autoTable(doc, {
      startY: currentY + 3,
      body: evalData,
      theme: 'grid',
      headStyles: { fillColor: ACCENT_COLOR, textColor: 255 },
      styles: { fontSize: 8, overflow: 'linebreak', cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: 'bold' },
        1: { cellWidth: 49 },
        2: { cellWidth: 42, fontStyle: 'bold' },
        3: { cellWidth: 49 }
      }
    });
  }

  // 8. Signatures Block
  currentY = (doc as any).lastAutoTable.finalY + 12;
  if (currentY > 245) { doc.addPage(); currentY = 30; }

  const sigY = currentY + 14;
  doc.setDrawColor(148, 163, 184);
  doc.line(14, sigY, 75, sigY);
  doc.line(135, sigY, 196, sigY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text(`Staff In-Charge: ${staffName}`, 14, sigY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Project Coordinator & Mentor', 14, sigY + 9);

  doc.setFont('helvetica', 'bold');
  doc.text('Academic Controller / HOD', 135, sigY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Project Verification & Assessment Cell', 135, sigY + 9);

  addReportFooter(doc);
  doc.save(`Project_${project.title.replace(/[^a-zA-Z0-9]/g, '_')}_Portfolio.pdf`);
}

/**
 * Generate Comprehensive Institutional College Report PDF
 */
export function generateCollegeReportPdf({
  college,
  departments = [],
  students = [],
  groups = [],
  projects = [],
  payments = [],
  attendance = []
}: {
  college: College;
  departments?: Course[];
  students?: Student[];
  groups?: Group[];
  projects?: Project[];
  payments?: StudentPayment[];
  attendance?: AttendanceRecord[];
}) {
  const doc = new jsPDF();
  const collegeName = college?.name || 'MES College';
  const collegeCode = college?.code || 'MES-INST';

  // 1. Header
  addCognilearnHeader(
    doc,
    `INSTITUTIONAL REPORT: ${collegeName.toUpperCase()}`,
    `College Code: ${collegeCode} | Comprehensive Academic, Cohort & Financial Audit`
  );

  // Compute metrics
  const totalStudents = students.length;
  const totalGroups = groups.length;
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p && p.status === 'completed').length;
  const ongoingProjects = projects.filter(p => p && p.status === 'in_progress').length;

  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((acc, p) => acc + ((p && p.progress_percentage) || 0), 0) / projects.length)
    : 0;

  const totalFeeCollected = payments.reduce((acc, p) => acc + ((p && p.paid_amount) || 0), 0);
  const totalFeePending = payments.reduce((acc, p) => acc + ((p && p.balance_amount) || 0), 0);

  const totalAttendanceRecords = attendance.length;
  const presentRecords = attendance.filter(a => a && (a.status === 'present' || a.status === 'late')).length;
  const attendanceRate = totalAttendanceRecords > 0
    ? Math.round((presentRecords / totalAttendanceRecords) * 100)
    : 100;

  // 2. Executive Summary KPI Table
  const kpiRows = [
    ['Total Enrolled Students', `${totalStudents} Students`, 'Total Project Groups', `${totalGroups} Groups`],
    ['Projects Active / Done', `${ongoingProjects} Ongoing / ${completedProjects} Completed`, 'Average Project Progress', `${avgProgress}%`],
    ['Total Fee Collected', `INR ${totalFeeCollected.toLocaleString('en-IN')}`, 'Pending Fee Balance', `INR ${totalFeePending.toLocaleString('en-IN')}`],
    ['Overall Attendance Rate', `${attendanceRate}%`, 'Affiliated Departments', `${departments.length} Courses/Depts`],
  ];

  autoTable(doc, {
    startY: 50,
    head: [['Executive Parameter', 'Value', 'Executive Parameter', 'Value']],
    body: kpiRows,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 8.5, cellPadding: 3.5 },
  });

  // 3. Project Groups Roster
  let currentY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Project Groups & Dissertation Overview:', 14, currentY);

  const groupRows = groups.map((g, idx) => {
    const proj = projects.find(p => p && p.group_id === g.id) || g.project;
    return [
      idx + 1,
      g.group_code,
      g.name,
      proj?.title || g.project_title || 'Dissertation in Progress',
      g.leader?.full_name || 'Assigned Member',
      g.mentor?.full_name || 'Assigned Faculty',
      `${proj?.progress_percentage || 0}%`,
      (g.status || 'Active').toUpperCase()
    ];
  });

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Code', 'Group Name', 'Project Title', 'Leader', 'Mentor', 'Progress', 'Status']],
    body: groupRows.length > 0 ? groupRows : [['-', '-', 'No project groups registered under this college', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: ACCENT_COLOR, textColor: 255 },
    styles: { fontSize: 7.5, cellPadding: 2.5 },
  });

  // 4. Student Enrolled Roster & Financial Ledger
  currentY = (doc as any).lastAutoTable.finalY + 8;
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Enrolled Students & Fee Ledger Audit:', 14, currentY);

  const studentRows = students.map((s, idx) => {
    const pay = payments.find(p => p && p.student_id === s.id);
    const grp = groups.find(g => g && g.id === s.group_id);
    const paidAmt = pay ? pay.paid_amount : 0;
    const dueAmt = pay ? pay.balance_amount : (s.total_fee || 5000);
    return [
      idx + 1,
      s.student_reg_no,
      s.full_name,
      s.course?.name || s.department || 'N/A',
      grp?.group_code || 'Unassigned',
      s.assigned_role || 'Member',
      `INR ${paidAmt.toLocaleString('en-IN')}`,
      dueAmt === 0 ? 'PAID' : `INR ${dueAmt.toLocaleString('en-IN')}`,
      (s.status || 'active').toUpperCase()
    ];
  });

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Reg No', 'Student Name', 'Dept/Course', 'Group', 'Role', 'Paid', 'Due', 'Status']],
    body: studentRows.length > 0 ? studentRows : [['-', '-', 'No students enrolled under this college', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 7, cellPadding: 2.2 },
    didParseCell: (data) => {
      if (data.column.index === 7) {
        if (data.cell.raw === 'PAID') {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (String(data.cell.raw).startsWith('INR') && data.cell.raw !== 'INR 0') {
          data.cell.styles.textColor = [225, 29, 72];
        }
      }
    }
  });

  // 5. Signature Block
  let lastY = (doc as any).lastAutoTable.finalY + 12;
  if (lastY > 250) {
    doc.addPage();
    lastY = 25;
  }

  const sigY = lastY + 20;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(14, sigY, 70, sigY);
  doc.line(135, sigY, 196, sigY);

  doc.setFontSize(8);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.text('Institutional Head / College Principal', 14, sigY + 5);
  doc.text('Cognilearn Academic Controller', 135, sigY + 5);

  doc.setFontSize(7);
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.text('Seal & Verified Signature', 14, sigY + 9);
  doc.text('MES Project Verification Cell', 135, sigY + 9);

  addReportFooter(doc);
  doc.save(`College_${collegeName.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`);
}

/**
 * Generate Automated Group Intelligence & Progress Audit PDF (Weekly & Overall)
 */
export function generateAutomatedGroupReportPdf(data: {
  groupName: string;
  groupCode: string;
  projectTitle: string;
  projectCode: string;
  status: string;
  progressPercentage: number;
  timeframe: string;
  mentorName: string;
  leaderName: string;
  attendanceRate: number;
  completedTasks: number;
  totalTasks: number;
  completedMilestones: number;
  totalMilestones: number;
  presentationsCount: number;
  feeTotal: number;
  feePaid: number;
  feeBalance: number;
  aiSummary: string;
  members: { name: string; regNo: string; role: string; attendance: string }[];
  tasksList: { title: string; priority: string; status: string; assignee: string }[];
}) {
  const doc = new jsPDF();
  addCognilearnHeader(
    doc,
    `GROUP PROGRESS AUDIT: ${data.groupCode}`,
    `Scope: ${data.timeframe} | Group: ${data.groupName} | System-Generated Audit`
  );

  // Executive AI Summary Banner
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 49, 182, 24, 2, 2, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT_COLOR);
  doc.text('AI EXECUTIVE SYNTHESIS & AUDIT BRIEF:', 18, 55);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const splitAi = doc.splitTextToSize(data.aiSummary, 174);
  doc.text(splitAi, 18, 60);

  // KPI Summary Grid
  const kpiData = [
    ['Project Velocity', `${data.progressPercentage}% (${data.status.toUpperCase()})`, 'Attendance Rate', `${data.attendanceRate}%`],
    ['Project Code', data.projectCode || '-', 'Presentations', `${data.presentationsCount} Round(s)`],
    ['Tasks Completed', `${data.completedTasks} of ${data.totalTasks}`, 'Milestones Done', `${data.completedMilestones} of ${data.totalMilestones}`],
    ['Fee Clearance', `Paid: ${formatCurrencyPdf(data.feePaid)} / Due: ${formatCurrencyPdf(data.feeBalance)}`, 'Mentor', data.mentorName || 'Assigned Mentor']
  ];

  autoTable(doc, {
    startY: 77,
    head: [['Metric', 'Details', 'Metric', 'Details']],
    body: kpiData,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2.5 }
  });

  // Group Members Table
  let currentY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Group Members Cohort:', 14, currentY);

  const memberRows = data.members.map((m, idx) => [
    idx + 1,
    m.regNo,
    m.name,
    m.role,
    m.attendance
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Reg No', 'Member Name', 'Role in Group', 'Attendance']],
    body: memberRows.length > 0 ? memberRows : [['-', '-', 'No registered members', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: ACCENT_COLOR, textColor: 255 },
    styles: { fontSize: 7.5, cellPadding: 2.2 }
  });

  // Active Tasks Table
  currentY = (doc as any).lastAutoTable.finalY + 6;
  if (currentY > 220) {
    doc.addPage();
    currentY = 25;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Key Tasks & Sprint Deliverables:', 14, currentY);

  const taskRows = data.tasksList.slice(0, 10).map((t, idx) => [
    idx + 1,
    t.title,
    t.priority.toUpperCase(),
    t.status.toUpperCase(),
    t.assignee
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Task Deliverable', 'Priority', 'Status', 'Assignee']],
    body: taskRows.length > 0 ? taskRows : [['-', 'No assigned tasks logged', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 7, cellPadding: 2 }
  });

  // Signatures
  let sigY = (doc as any).lastAutoTable.finalY + 16;
  if (sigY > 250) {
    doc.addPage();
    sigY = 30;
  }

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(14, sigY, 65, sigY);
  doc.line(135, sigY, 196, sigY);
  doc.setFontSize(7.5);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Mentor Signature', 14, sigY + 4);
  doc.text('Cognilearn Academic Cell', 135, sigY + 4);

  addReportFooter(doc);
  doc.save(`Group_${data.groupCode}_${data.timeframe.replace(/\s+/g, '_')}_Audit.pdf`);
}

/**
 * Generate Automated Student Performance Audit PDF (Weekly & Overall)
 */
export function generateAutomatedStudentReportPdf(data: {
  studentName: string;
  regNo: string;
  groupCode: string;
  groupName: string;
  role: string;
  department: string;
  timeframe: string;
  attendanceRate: number;
  attendedSessions: number;
  totalSessions: number;
  completedTasks: number;
  totalTasks: number;
  feePaid: number;
  feeBalance: number;
  paymentStatus: string;
  aiSummary: string;
  tasksList: { title: string; priority: string; status: string }[];
}) {
  const doc = new jsPDF();
  addCognilearnHeader(
    doc,
    `STUDENT PERFORMANCE: ${data.regNo}`,
    `Scope: ${data.timeframe} | Student: ${data.studentName} | Automated Academic Audit`
  );

  // Executive AI Summary Banner
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 49, 182, 24, 2, 2, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT_COLOR);
  doc.text('AI STUDENT PERFORMANCE SYNOPSIS:', 18, 55);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const splitAi = doc.splitTextToSize(data.aiSummary, 174);
  doc.text(splitAi, 18, 60);

  // Student Profile KPI Grid
  const kpiData = [
    ['Full Name', data.studentName, 'Register No', data.regNo],
    ['Group Assigned', `${data.groupName} (${data.groupCode})`, 'Assigned Role', data.role || 'Member'],
    ['Department', data.department || '-', 'Attendance', `${data.attendanceRate}% (${data.attendedSessions}/${data.totalSessions} sessions)`],
    ['Tasks Throughput', `${data.completedTasks} of ${data.totalTasks} Done`, 'Fee Standing', `${data.paymentStatus.toUpperCase()} (Bal: ${formatCurrencyPdf(data.feeBalance)})`]
  ];

  autoTable(doc, {
    startY: 77,
    head: [['Field', 'Details', 'Field', 'Details']],
    body: kpiData,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2.5 }
  });

  // Assigned Tasks
  let currentY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Student Assigned Deliverables:', 14, currentY);

  const taskRows = data.tasksList.map((t, idx) => [
    idx + 1,
    t.title,
    t.priority.toUpperCase(),
    t.status.toUpperCase()
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Task Title', 'Priority', 'Status']],
    body: taskRows.length > 0 ? taskRows : [['-', 'No individually assigned tasks', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: ACCENT_COLOR, textColor: 255 },
    styles: { fontSize: 7.5, cellPadding: 2.2 }
  });

  // Signatures
  let sigY = (doc as any).lastAutoTable.finalY + 20;
  if (sigY > 250) {
    doc.addPage();
    sigY = 30;
  }

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(14, sigY, 65, sigY);
  doc.line(135, sigY, 196, sigY);
  doc.setFontSize(7.5);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.text('Mentor Evaluation Signature', 14, sigY + 4);
  doc.text('Dean / Academic Controller', 135, sigY + 4);

  addReportFooter(doc);
  doc.save(`Student_${data.regNo}_${data.timeframe.replace(/\s+/g, '_')}_Audit.pdf`);
}

/**
 * Generate PDF for Filtered Groups Search Results
 */
export function generateFilteredGroupsPdf(
  groups: Group[],
  projects: Project[],
  filterTitle = 'Cohort Groups Audit Report'
) {
  const doc = new jsPDF();
  addCognilearnHeader(
    doc,
    filterTitle.toUpperCase(),
    `Filtered Cohort Directory | Total Records: ${groups.length} Groups`
  );

  const rows = groups.map((g, idx) => {
    const prj = projects.find(p => p.group_id === g.id);
    const progress = prj?.progress_percentage ?? 0;
    const phases = [
      prj?.lifecycle_phases?.planning ? 'Plan' : '',
      prj?.lifecycle_phases?.design ? 'Design' : '',
      prj?.lifecycle_phases?.development ? 'Dev' : '',
      prj?.lifecycle_phases?.testing ? 'Test' : ''
    ].filter(Boolean).join(', ') || 'Planning';

    return [
      idx + 1,
      g.group_code,
      g.name,
      prj?.title || g.project_title || 'N/A',
      g.leader?.full_name || 'Assigned Lead',
      g.mentor?.full_name || 'Staff Mentor',
      phases,
      `${progress}%`
    ];
  });

  autoTable(doc, {
    startY: 48,
    head: [['#', 'Code', 'Group Name', 'Project Title', 'Leader', 'Mentor', 'Phases', 'Velocity']],
    body: rows.length > 0 ? rows : [['-', '-', 'No groups found matching filter', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 7.5, cellPadding: 2.2 }
  });

  addReportFooter(doc);
  doc.save(`Cognilearn_Filtered_Groups_${Date.now()}.pdf`);
}

/**
 * Generate PDF for Filtered Students Search Results
 */
export function generateFilteredStudentsPdf(
  students: Student[],
  payments: StudentPayment[] = [],
  attendanceRateMap: Map<string, { percentage: number; present: number; total: number }> = new Map(),
  filterTitle = 'Student Academic & Fee Ledger Report'
) {
  const doc = new jsPDF();
  addCognilearnHeader(
    doc,
    filterTitle.toUpperCase(),
    `Filtered Student Ledger | Total Records: ${students.length} Enrolled Students`
  );

  const rows = students.map((s, idx) => {
    const pay = payments.find(p => p.student_id === s.id);
    const att = attendanceRateMap.get(s.id) || { percentage: 100, present: 0, total: 0 };
    const feeStatus = pay?.status === 'paid' || (pay && pay.balance_amount <= 0)
      ? 'Paid Full'
      : `Due: INR ${pay?.balance_amount ?? 5000}`;

    return [
      idx + 1,
      s.student_reg_no,
      s.full_name,
      s.course?.name || s.department || 'B.Tech',
      s.group?.group_code || 'Unassigned',
      s.assigned_role || 'Member',
      `${att.percentage}% (${att.present}/${att.total})`,
      feeStatus
    ];
  });

  autoTable(doc, {
    startY: 48,
    head: [['#', 'Reg No', 'Student Name', 'Course / Dept', 'Group', 'Role', 'Attendance', 'Fee Standing']],
    body: rows.length > 0 ? rows : [['-', '-', 'No students found matching filter', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 7.5, cellPadding: 2.2 }
  });

  addReportFooter(doc);
  doc.save(`Cognilearn_Filtered_Students_${Date.now()}.pdf`);
}
