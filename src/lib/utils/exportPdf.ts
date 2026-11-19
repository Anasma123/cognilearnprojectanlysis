// ==============================================================================
// COGNILEARN PROFESSIONAL PDF EXPORT SERVICE
// Generates Branded Reports with Header, Tables and Signatures
// ==============================================================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, Group, Project, AttendanceRecord, WeeklyReport, Evaluation } from '../types';
import { formatDateIndian } from './formatters';

const PRIMARY_COLOR: [number, number, number] = [15, 23, 42]; // Navy #0f172a
const ACCENT_COLOR: [number, number, number] = [30, 64, 175]; // Blue #1e40af
const TEXT_MUTED: [number, number, number] = [100, 116, 139];

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
  doc.text('MES COLLEGE PROJECT COLLABORATION PORTAL', 14, 18);

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
 * Generate Individual Student Profile PDF
 */
export function generateStudentProfilePdf(student: Student) {
  const doc = new jsPDF();
  addCognilearnHeader(doc, `STUDENT PROFILE: ${student.full_name.toUpperCase()}`);

  const studentDetails = [
    ['Register Number', student.student_reg_no, 'Joining Date', formatDateIndian(student.joining_date)],
    ['Full Name', student.full_name, 'Status', student.status.toUpperCase()],
    ['Email', student.email, 'Phone', student.phone || 'N/A'],
    ['College', student.college?.name || 'MES College', 'Class / Year', student.class_year],
    ['Department', student.department, 'Group Assigned', student.group?.group_code || 'Unassigned'],
    ['Assigned Role', student.assigned_role, 'Project Code', student.group?.project?.project_code || 'N/A'],
  ];

  autoTable(doc, {
    startY: 50,
    head: [['Field', 'Details', 'Field', 'Details']],
    body: studentDetails,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3.5 },
  });

  const lastY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Mentor & Institutional Remarks:', 14, lastY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(student.notes || 'Student is in good academic standing and actively participating in sprint sessions.', 14, lastY + 6);

  // Signature Block
  const sigY = lastY + 35;
  doc.setDrawColor(148, 163, 184);
  doc.line(14, sigY, 65, sigY);
  doc.line(135, sigY, 196, sigY);
  doc.setFontSize(8);
  doc.text('Project Mentor Signature', 14, sigY + 5);
  doc.text('Cognilearn Academic Director', 135, sigY + 5);

  addReportFooter(doc);
  doc.save(`Student_${student.student_reg_no}_Profile.pdf`);
}

/**
 * Generate Group Summary & Progress PDF
 */
export function generateGroupSummaryPdf(group: Group, project?: Project, weeklyReports: WeeklyReport[] = []) {
  const doc = new jsPDF();
  addCognilearnHeader(doc, `GROUP DOSSIER: ${group.name.toUpperCase()}`, `Group Code: ${group.group_code} | College: ${group.college?.name || 'MES College'}`);

  const infoRows = [
    ['Group Code', group.group_code, 'Status', group.status.toUpperCase()],
    ['Project Title', group.project_title || project?.title || 'N/A', 'Progress', `${project?.progress_percentage || 0}%`],
    ['Mentor', group.mentor?.full_name || 'Unassigned', 'Leader', group.leader?.full_name || 'N/A'],
    ['Start Date', formatDateIndian(group.start_date), 'Expected Finish', formatDateIndian(group.expected_completion_date)],
  ];

  autoTable(doc, {
    startY: 50,
    head: [['Parameter', 'Value', 'Parameter', 'Value']],
    body: infoRows,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 8.5 },
  });

  // Group Members Table
  let currentY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Group Members Roster:', 14, currentY);

  const memberRows = (group.members || []).map((m, idx) => [
    idx + 1,
    m.student_reg_no,
    m.full_name,
    m.assigned_role,
    m.email,
    m.phone || '-'
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Reg No', 'Student Name', 'Role', 'Email', 'Phone']],
    body: memberRows,
    theme: 'striped',
    headStyles: { fillColor: ACCENT_COLOR, textColor: 255 },
    styles: { fontSize: 8 },
  });

  // Weekly Progress History
  currentY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('Chronological Weekly Progress Highlights:', 14, currentY);

  const weeklyRows = weeklyReports.map(w => [
    `Week ${w.week_number}`,
    `${formatDateIndian(w.start_date)} - ${formatDateIndian(w.end_date)}`,
    w.review_status.toUpperCase(),
    w.activities_completed.length > 80 ? w.activities_completed.substring(0, 80) + '...' : w.activities_completed,
    w.mentor_feedback ? (w.mentor_feedback.length > 60 ? w.mentor_feedback.substring(0, 60) + '...' : w.mentor_feedback) : 'Pending'
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Week', 'Timeline', 'Status', 'Key Accomplishments', 'Mentor Feedback']],
    body: weeklyRows.length > 0 ? weeklyRows : [['-', '-', '-', 'No weekly reports filed yet.', '-']],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 7.5 },
  });

  addReportFooter(doc);
  doc.save(`Group_${group.group_code}_Summary.pdf`);
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
    r.session_type === 'daily' ? 'Daily' : 'Meeting',
    r.status.toUpperCase(),
    r.remarks || '-'
  ]);

  autoTable(doc, {
    startY: 50,
    head: [['#', 'Date', 'Reg No', 'Student Name', 'Session', 'Status', 'Remarks']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 8 },
    didParseCell: (data) => {
      if (data.column.index === 5) {
        if (data.cell.raw === 'PRESENT') data.cell.styles.textColor = [16, 185, 129];
        else if (data.cell.raw === 'ABSENT') data.cell.styles.textColor = [239, 68, 68];
        else if (data.cell.raw === 'LATE') data.cell.styles.textColor = [245, 158, 11];
      }
    }
  });

  addReportFooter(doc);
  doc.save(`Attendance_Report_${groupName}.pdf`);
}

/**
 * Generate Final Project Comprehensive Report PDF
 */
export function generateFinalProjectReportPdf(project: Project, group?: Group, evaluation?: Evaluation) {
  const doc = new jsPDF();
  addCognilearnHeader(doc, `PROJECT DISSERTATION SUMMARY: ${project.project_code}`, project.title);

  const metaRows = [
    ['Project Code', project.project_code, 'Category', project.category],
    ['Topic', project.topic, 'Current Status', project.status.toUpperCase()],
    ['Group Code', group?.group_code || '-', 'Overall Progress', `${project.progress_percentage}%`],
    ['Mentor', project.mentor?.full_name || 'Unassigned', 'Start / End', `${formatDateIndian(project.start_date)} - ${formatDateIndian(project.expected_completion_date)}`]
  ];

  autoTable(doc, {
    startY: 50,
    head: [['Item', 'Value', 'Item', 'Value']],
    body: metaRows,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: 255 },
    styles: { fontSize: 8.5 }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Problem Statement & Objectives:', 14, currentY);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const problemLines = doc.splitTextToSize(project.problem_statement || 'N/A', 180);
  doc.text(problemLines, 14, currentY + 5);

  currentY += 8 + (problemLines.length * 4);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Technologies Used:', 14, currentY);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(project.technologies.join(', ') || 'N/A', 14, currentY + 5);

  if (evaluation) {
    currentY += 12;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Mentor Evaluation Matrix (Score / 10):', 14, currentY);

    const evalData = [
      ['Technical Skills', `${evaluation.technical_skills}/10`, 'Teamwork', `${evaluation.teamwork}/10`],
      ['Communication', `${evaluation.communication}/10`, 'Problem Solving', `${evaluation.problem_solving}/10`],
      ['Project Management', `${evaluation.project_management}/10`, 'Overall Performance', `${evaluation.overall_performance}/10`],
    ];

    autoTable(doc, {
      startY: currentY + 3,
      body: evalData,
      theme: 'grid',
      headStyles: { fillColor: ACCENT_COLOR, textColor: 255 },
      styles: { fontSize: 8.5 }
    });
  }

  addReportFooter(doc);
  doc.save(`Project_${project.project_code}_Report.pdf`);
}
