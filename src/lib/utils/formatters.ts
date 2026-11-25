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

  // 1. If status is explicitly completed, progress is 100%
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

  // 4. Tasks Calculation with Priority Weighting
  // Priority weights:
  // - Critical: 4 points (Urgent blockades / core deliverables)
  // - High: 3 points (Major architectural/sprint components)
  // - Medium: 2 points (Standard deliverables)
  // - Low: 1 point (Minor enhancements/polish)
  // Status completion factor:
  // - Completed: 1.0 (100%)
  // - Under Review: 0.75 (75%)
  // - In Progress: 0.5 (50%)
  // - Other (Todo/Blocked/Overdue): 0.0 (0%)
  const totalTasks = Array.isArray(tasks) ? tasks.length : 0;
  let taskScore = 0;
  let hasTasks = false;
  if (totalTasks > 0) {
    hasTasks = true;
    let totalTaskWeight = 0;
    let earnedTaskWeight = 0;

    tasks.forEach(t => {
      if (!t) return;
      // Determine priority weight
      const normPriority = String(t.priority || 'medium').toLowerCase();
      let weight = 2; // Default Medium
      if (normPriority === 'critical') weight = 4;
      else if (normPriority === 'high') weight = 3;
      else if (normPriority === 'medium') weight = 2;
      else if (normPriority === 'low') weight = 1;

      totalTaskWeight += weight;

      // Determine status completion factor
      const normTaskStatus = String(t.status || '').toLowerCase();
      let statusFactor = 0;
      if (normTaskStatus === 'completed') statusFactor = 1.0;
      else if (normTaskStatus === 'under_review') statusFactor = 0.75;
      else if (normTaskStatus === 'in_progress') statusFactor = 0.5;

      earnedTaskWeight += weight * statusFactor;
    });

    taskScore = totalTaskWeight > 0 ? Math.min(100, Math.round((earnedTaskWeight / totalTaskWeight) * 100)) : 0;
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

  if (hasMilestones && hasTasks) {
    if (phaseScore > 0 && hasPresentations) {
      // Milestones 35%, Tasks 30%, Phases 20%, Presentations 15%
      computed = milestoneScore * 0.35 + taskScore * 0.30 + phaseScore * 0.20 + presScore * 0.15;
    } else if (phaseScore > 0) {
      // Milestones 40%, Tasks 35%, Phases 25%
      computed = milestoneScore * 0.40 + taskScore * 0.35 + phaseScore * 0.25;
    } else if (hasPresentations) {
      // Milestones 45%, Tasks 40%, Presentations 15%
      computed = milestoneScore * 0.45 + taskScore * 0.40 + presScore * 0.15;
    } else {
      // Milestones 55%, Tasks 45%
      computed = milestoneScore * 0.55 + taskScore * 0.45;
    }
  } else if (hasMilestones && !hasTasks) {
    if (phaseScore > 0) {
      computed = milestoneScore * 0.65 + phaseScore * 0.35;
    } else if (hasPresentations) {
      computed = milestoneScore * 0.80 + presScore * 0.20;
    } else {
      computed = milestoneScore;
    }
  } else if (!hasMilestones && hasTasks) {
    if (phaseScore > 0) {
      computed = taskScore * 0.65 + phaseScore * 0.35;
    } else if (hasPresentations) {
      computed = taskScore * 0.80 + presScore * 0.20;
    } else {
      computed = taskScore;
    }
  } else {
    // Neither milestones nor tasks recorded yet
    if (phaseScore > 0 && hasPresentations) {
      computed = phaseScore * 0.75 + presScore * 0.25;
    } else if (phaseScore > 0) {
      computed = phaseScore;
    } else if (hasPresentations) {
      computed = presScore;
    } else {
      // Baseline status fallback
      switch (normStatus) {
        case 'design': computed = 25; break;
        case 'develop':
        case 'development':
        case 'in_progress': computed = 50; break;
        case 'test':
        case 'testing': computed = 75; break;
        default: computed = 0; break;
      }
    }
  }

  // If all milestones and tasks are 100% completed
  if (
    hasMilestones &&
    milestoneScore === 100 &&
    (!hasTasks || taskScore === 100) &&
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

