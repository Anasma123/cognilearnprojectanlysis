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
 * Compute progress percentage automatically from lifecycle phases, presentations, milestones & tasks
 */
export function calculateComputedProgress(
  milestones: { status: string }[] = [],
  tasks: { status: string }[] = [],
  presentations: { status: string }[] = [],
  lifecyclePhases?: { planning?: boolean; design?: boolean; development?: boolean; testing?: boolean },
  lifecycleStatus?: string
): number {
  // 1. Calculate phase score from the 4 lifecycle phases (planning, design, development, testing)
  // Each phase carries exactly 25% weight (1 = 25%, 2 = 50%, 3 = 75%, 4 = 100%)
  const phases = lifecyclePhases || {};
  const phaseFlags = [
    Boolean(phases.planning),
    Boolean(phases.design),
    Boolean(phases.development),
    Boolean(phases.testing)
  ];
  const completedPhasesCount = phaseFlags.filter(Boolean).length;
  const allPhasesDone = completedPhasesCount === 4;

  // If status is explicitly completed OR all 4 phases are verified, project progress is 100%
  if (lifecycleStatus === 'completed' || allPhasesDone) {
    return 100;
  }

  const phaseScore = completedPhasesCount * 25;
  const hasPresentations = Boolean(presentations && presentations.length > 0);

  // If no presentations recorded yet, progress is strictly the 4 lifecycle phases (25% each)
  if (!hasPresentations) {
    if (phaseScore > 0) return phaseScore;

    // Fallback baseline from lifecycle status string if no phases checked yet
    switch (String(lifecycleStatus).toLowerCase()) {
      case 'design': return 25;
      case 'develop':
      case 'development': return 50;
      case 'test':
      case 'testing': return 75;
      case 'completed': return 100;
      case 'planning':
      default: return 0;
    }
  }

  // 2. Presentations score calculation
  // Completed = 100%, Revision Required = 50%, Scheduled = 0%
  let totalPresScore = 0;
  presentations.forEach(p => {
    if (p.status === 'completed') {
      totalPresScore += 100;
    } else if (p.status === 'revision_required') {
      totalPresScore += 50;
    } else {
      totalPresScore += 0; // scheduled
    }
  });
  const avgPresScore = Math.round(totalPresScore / presentations.length);

  // If presentations exist:
  // Completed presentation confirms readiness for current stage
  if (avgPresScore === 100) {
    if (phaseScore >= 75) return 100;
    return Math.min(100, Math.max(phaseScore, Math.round(phaseScore * 0.75 + avgPresScore * 0.25)));
  }

  if (phaseScore > 0) {
    const combined = phaseScore * 0.75 + avgPresScore * 0.25;
    return Math.min(100, Math.max(0, Math.round(combined)));
  }

  return avgPresScore;
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
    case 'design':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'develop':
    case 'development':
    case 'in_progress':
    case 'under_review':
    case 'submitted':
    case 'late':
    case 'partial':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'test':
    case 'testing':
      return 'bg-amber-50 text-amber-700 border-amber-200';
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

