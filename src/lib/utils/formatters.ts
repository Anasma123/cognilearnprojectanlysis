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
  tasks: { status?: string; priority?: string }[] = [],
  presentations: { status: string }[] = [],
  lifecyclePhases?: { planning?: boolean; design?: boolean; development?: boolean; testing?: boolean },
  lifecycleStatus?: string
): number {
  const normStatus = String(lifecycleStatus || '').toLowerCase();

  // 1. Explicit project status completion
  if (normStatus === 'completed') {
    return 100;
  }

  // 2. Lifecycle Phases (planning, design, development, testing)
  const phases = lifecyclePhases || {};
  const phaseFlags = [
    Boolean(phases.planning),
    Boolean(phases.design),
    Boolean(phases.development),
    Boolean(phases.testing)
  ];
  const completedPhasesCount = phaseFlags.filter(Boolean).length;
  if (completedPhasesCount === 4) {
    return 100;
  }
  const phaseScore = completedPhasesCount * 25; // 0, 25, 50, 75

  // 3. Milestones Calculation (Completed = 100%, In Progress = 50%)
  const totalMilestones = Array.isArray(milestones) ? milestones.length : 0;
  let milestoneScore = 0;
  let hasMilestones = false;
  if (totalMilestones > 0) {
    hasMilestones = true;
    const completedM = milestones.filter(m => m && m.status === 'completed').length;
    const inProgressM = milestones.filter(m => m && m.status === 'in_progress').length;
    milestoneScore = Math.min(100, Math.round(((completedM + inProgressM * 0.5) / totalMilestones) * 100));
  }

  // 4. Presentations Score (Completed = 100%, Revision Required = 50%)
  const hasPresentations = Array.isArray(presentations) && presentations.length > 0;
  let presScore = 0;
  if (hasPresentations) {
    let totalPresScore = 0;
    presentations.forEach(p => {
      if (p.status === 'completed') totalPresScore += 100;
      else if (p.status === 'revision_required') totalPresScore += 50;
    });
    presScore = Math.round(totalPresScore / presentations.length);
  }

  // 5. Baseline Foundation Progress
  let baseProgress = 0;
  if (hasMilestones && phaseScore > 0) {
    baseProgress = milestoneScore * 0.70 + phaseScore * 0.30;
  } else if (hasMilestones) {
    baseProgress = milestoneScore;
  } else if (phaseScore > 0) {
    baseProgress = phaseScore;
  } else {
    switch (normStatus) {
      case 'design': baseProgress = 25; break;
      case 'develop':
      case 'development':
      case 'in_progress': baseProgress = 50; break;
      case 'test':
      case 'testing': baseProgress = 75; break;
      default: baseProgress = 20; break;
    }
  }

  // 6. Tasks Modulation based on Priority:
  // Priority dictates the magnitude of impact on the overall progress:
  // - Critical: 4x impact (pending drag -18%, completed gain +25%)
  // - High: 3x impact (problematic for working: pending drag -12%, completed gain +18%)
  // - Medium: 2x impact (standard task: pending drag -6%, completed gain +10%)
  // - Low: 1x impact (minor item: pending drag -2.5%, completed gain +5%)
  const totalTasks = Array.isArray(tasks) ? tasks.length : 0;
  let taskEarnedDelta = 0;
  let taskPendingDrag = 0;
  let allTasksDone = totalTasks > 0;

  if (totalTasks > 0) {
    tasks.forEach(t => {
      if (!t) return;
      const normPriority = String(t.priority || 'medium').toLowerCase();
      let earnVal = 10;
      let dragVal = 6;

      if (normPriority === 'critical') {
        earnVal = 25;
        dragVal = 18;
      } else if (normPriority === 'high') {
        earnVal = 18;
        dragVal = 12;
      } else if (normPriority === 'medium') {
        earnVal = 10;
        dragVal = 6;
      } else if (normPriority === 'low') {
        earnVal = 5;
        dragVal = 2.5;
      }

      const normTaskStatus = String(t.status || '').toLowerCase();
      if (normTaskStatus === 'completed') {
        taskEarnedDelta += earnVal;
      } else if (normTaskStatus === 'under_review') {
        taskEarnedDelta += earnVal * 0.75;
        taskPendingDrag += dragVal * 0.25;
        allTasksDone = false;
      } else if (normTaskStatus === 'in_progress') {
        taskEarnedDelta += earnVal * 0.50;
        taskPendingDrag += dragVal * 0.50;
        allTasksDone = false;
      } else {
        // todo / blocked / overdue
        taskPendingDrag += dragVal;
        allTasksDone = false;
      }
    });
  }

  // 7. Calculate Final Progress:
  let calculated = baseProgress;
  if (totalTasks > 0) {
    calculated = baseProgress + taskEarnedDelta - taskPendingDrag;
  }

  // If all milestones and tasks are 100% completed
  if (
    (!hasMilestones || milestoneScore === 100) &&
    (!totalTasks || allTasksDone) &&
    (hasMilestones || totalTasks > 0 || phaseScore === 100)
  ) {
    if (calculated >= 95 || (!hasMilestones && allTasksDone && totalTasks >= 2)) {
      return 100;
    }
  }

  return Math.min(100, Math.max(0, Math.round(calculated)));
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

