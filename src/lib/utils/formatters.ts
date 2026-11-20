// ==============================================================================
// COGNILEARN UTILITIES & FORMATTERS
// Standardizing Date (DD-MM-YYYY), Timezone (Asia/Kolkata), and Status Badges
// ==============================================================================

import { format, parseISO, isValid } from 'date-fns';

/**
 * Format date to standard Indian Format: DD-MM-YYYY
 */
export function formatDateIndian(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(d)) return typeof dateInput === 'string' ? dateInput : '-';
    return format(d, 'dd-MM-yyyy');
  } catch {
    return String(dateInput);
  }
}

/**
 * Format datetime to standard Indian Format: DD-MM-YYYY hh:mm a
 */
export function formatDateTimeIndian(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(d)) return String(dateInput);
    return format(d, 'dd-MM-yyyy hh:mm a');
  } catch {
    return String(dateInput);
  }
}

/**
 * Convert bytes to readable string (KB, MB)
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Compute progress percentage automatically from milestones & tasks
 */
export function calculateComputedProgress(
  milestones: { status: string }[] = [],
  tasks: { status: string }[] = []
): number {
  if (milestones.length === 0 && tasks.length === 0) return 0;
  
  let milestoneScore = 0;
  if (milestones.length > 0) {
    const completedM = milestones.filter(m => m.status === 'completed').length;
    milestoneScore = (completedM / milestones.length) * 100;
  }

  let taskScore = 0;
  if (tasks.length > 0) {
    const completedT = tasks.filter(t => t.status === 'completed').length;
    taskScore = (completedT / tasks.length) * 100;
  }

  // Weight: 60% milestones, 40% tasks if both exist
  if (milestones.length > 0 && tasks.length > 0) {
    return Math.round(milestoneScore * 0.6 + taskScore * 0.4);
  }
  return Math.round(milestones.length > 0 ? milestoneScore : taskScore);
}

/**
 * Styling helper for Task & Project Statuses
 */
export function getStatusBadgeClass(status?: string): string {
  if (!status) return 'bg-slate-100 text-slate-700 border-slate-200';
  switch (String(status).toLowerCase()) {
    case 'completed':
    case 'approved':
    case 'present':
    case 'active':
    case 'paid':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'in_progress':
    case 'under_review':
    case 'submitted':
    case 'late':
    case 'partial':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'planning':
    case 'todo':
    case 'draft':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'on_hold':
    case 'blocked':
    case 'revision_required':
    case 'leave':
    case 'on_leave':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'overdue':
    case 'absent':
    case 'delayed':
    case 'critical':
    case 'dropped':
    case 'unpaid':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

/**
 * Clean status string for human presentation
 */
export function humanizeStatus(status?: string): string {
  if (!status) return '';
  return String(status)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Format currency to Indian Rupee currency format: ₹ 5,000
 */
export function formatCurrencyIndian(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return '₹' + amount.toLocaleString('en-IN');
}

