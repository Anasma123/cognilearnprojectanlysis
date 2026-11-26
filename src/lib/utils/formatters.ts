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

  // 1. Explicit project status completion:
  // Only 100% if explicitly completed AND there are no open tasks
  const totalTasks = Array.isArray(tasks) ? tasks.length : 0;
  const openTasks = totalTasks > 0 ? tasks.filter(t => t && t.status !== 'completed') : [];
  const hasOpenTasks = openTasks.length > 0;

  if (normStatus === 'completed' && !hasOpenTasks) {
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
  const phaseScore = completedPhasesCount * 25; // 0, 25, 50, 75, 100

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

  // 4. Tasks Calculation with Priority Weighting
  // Priority weights:
  // - Critical: 4 points
  // - High: 3 points
  // - Medium: 2 points
  // - Low: 1 point
  let taskScore = 0;
  let hasTasks = false;
  let totalTaskWeight = 0;
  let earnedTaskWeight = 0;
  let priorityDrag = 0;

  if (totalTasks > 0) {
    hasTasks = true;

    tasks.forEach(t => {
      if (!t) return;
      const normPriority = String(t.priority || 'medium').toLowerCase();
      let weight = 2;
      let dragMultiplier = 1.0;

      if (normPriority === 'critical') {
        weight = 4;
        dragMultiplier = 2.5; // Critical pending tasks create high drag
      } else if (normPriority === 'high') {
        weight = 3;
        dragMultiplier = 1.8; // High pending tasks are problematic for working
      } else if (normPriority === 'medium') {
        weight = 2;
        dragMultiplier = 1.0;
      } else if (normPriority === 'low') {
        weight = 1;
        dragMultiplier = 0.4; // Low pending tasks have minimal drag
      }

      totalTaskWeight += weight;

      const normTaskStatus = String(t.status || '').toLowerCase();
      let factor = 0;
      if (normTaskStatus === 'completed') {
        factor = 1.0;
      } else if (normTaskStatus === 'under_review') {
        factor = 0.75;
        priorityDrag += (weight * 0.25) * dragMultiplier;
      } else if (normTaskStatus === 'in_progress') {
        factor = 0.50;
        priorityDrag += (weight * 0.50) * dragMultiplier;
      } else {
        // todo / blocked / overdue
        factor = 0.0;
        priorityDrag += (weight * 1.0) * dragMultiplier;
      }

      earnedTaskWeight += weight * factor;
    });

    taskScore = totalTaskWeight > 0 ? (earnedTaskWeight / totalTaskWeight) * 100 : 0;
  }

  // 5. Presentations Score (Completed = 100%, Revision Required = 50%)
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

  // 6. Objective Blended Progress Calculation
  let computed = 0;

  if (hasTasks && phaseScore > 0) {
    // Both verified lifecycle phases and priority-weighted tasks are active
    if (hasPresentations) {
      computed = phaseScore * 0.45 + taskScore * 0.45 + presScore * 0.10;
    } else {
      computed = phaseScore * 0.50 + taskScore * 0.50;
    }
  } else if (!hasTasks && phaseScore > 0) {
    // Verified lifecycle phases drive progress directly
    if (hasPresentations) {
      computed = phaseScore * 0.85 + presScore * 0.15;
    } else {
      computed = phaseScore;
    }
  } else if (hasTasks && phaseScore === 0) {
    // Tasks drive progress
    if (hasPresentations) {
      computed = taskScore * 0.85 + presScore * 0.15;
    } else {
      computed = taskScore;
    }
  } else {
    // Initial stage: estimate based on lifecycle status
    if (hasPresentations) {
      computed = presScore;
    } else {
      switch (normStatus) {
        case 'design': computed = 25; break;
        case 'develop': case 'development': case 'in_progress': computed = 50; break;
        case 'test': case 'testing': computed = 75; break;
        default: computed = 15; break;
      }
    }
  }

  // 7. Apply Priority Drag Penalty for Problematic Pending Tasks
  // High and Critical tasks pending have a significant negative impact
  if (hasTasks && priorityDrag > 0) {
    const dragPercent = Math.min(25, priorityDrag * 2.5);
    computed = Math.max(0, computed - dragPercent);
  }

  // 8. STRICT CAP: If there are ANY open/in-progress tasks, progress CANNOT be 100%
  if (hasOpenTasks) {
    computed = Math.min(95, computed);
  }

  // If all lifecycle phases and tasks are 100% completed
  if (
    phaseScore === 100 &&
    (!hasTasks || (!hasOpenTasks && taskScore === 100)) &&
    (!hasPresentations || presScore === 100)
  ) {
    return 100;
  }

  return Math.min(100, Math.max(0, Math.round(computed)));
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

