// ==============================================================================
// COGNILEARN STUDENT PROJECT TRACKING & MANAGEMENT SYSTEM
// Comprehensive TypeScript Definitions
// ==============================================================================

export type UserRole = 'admin' | 'staff' | 'mentor' | 'student';

export function hasAdminPrivileges(role?: UserRole | string): boolean {
  return role === 'admin' || role === 'staff';
}

export interface StaffPermissions {
  manage_students: boolean;
  manage_groups: boolean;
  manage_projects: boolean;
  mark_attendance: boolean;
  assign_tasks: boolean;
  record_payments: boolean;
  export_reports: boolean;
  mentor_reviews: boolean;
}

export const DEFAULT_ADMIN_PERMISSIONS: StaffPermissions = {
  manage_students: true,
  manage_groups: true,
  manage_projects: true,
  mark_attendance: true,
  assign_tasks: true,
  record_payments: true,
  export_reports: true,
  mentor_reviews: true,
};

export const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = {
  manage_students: true,
  manage_groups: true,
  manage_projects: true,
  mark_attendance: true,
  assign_tasks: true,
  record_payments: false,
  export_reports: true,
  mentor_reviews: true,
};

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  college_id?: string;
  password?: string;
  is_active: boolean;
  permissions?: StaffPermissions;
  created_at: string;
  updated_at: string;
}

export interface College {
  id: string;
  name: string;
  code: string;
  address?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  created_at: string;
}

export interface Course {
  id: string;
  college_id: string;
  name: string;
  code: string;
  department: string;
  duration_years: number;
  created_at: string;
}

export interface AcademicBatch {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
  is_active: boolean;
  created_at: string;
}

export interface Mentor {
  id: string;
  profile_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  specialization: string;
  designation: string;
  department: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type StudentStatus = 'active' | 'completed' | 'dropped' | 'on_leave';

export interface Student {
  id: string;
  profile_id?: string;
  student_reg_no: string;
  full_name: string;
  email: string;
  phone?: string;
  college_id: string;
  course_id: string;
  department: string;
  class_year: string;
  group_id?: string;
  assigned_role?: string;
  joining_date: string;
  status: StudentStatus;
  notes?: string;
  avatar_url?: string;
  total_fee?: number;
  paid_amount?: number;
  payment_status?: PaymentStatus;
  created_at: string;
  updated_at: string;
  // Join extensions
  college?: College;
  course?: Course;
  group?: Group;
}

export type GroupStatus = 'active' | 'completed' | 'on_hold';

export interface Group {
  id: string;
  group_code: string;
  name: string;
  college_id: string;
  course_id: string;
  class_year: string;
  batch_id?: string;
  group_leader_id?: string;
  mentor_id?: string;
  coordinator_name?: string;
  member_ids?: string[];
  project_title?: string;
  start_date: string;
  expected_completion_date: string;
  status: GroupStatus;
  created_at: string;
  updated_at: string;
  // Relations
  college?: College;
  course?: Course;
  mentor?: Mentor;
  leader?: Student;
  members?: Student[];
  project?: Project;
}

export interface GroupMember {
  id: string;
  group_id: string;
  student_id: string;
  role_in_group: string;
  joined_at: string;
  student?: Student;
}

export type ProjectStatus = 'planning' | 'design' | 'development' | 'testing' | 'completed' | 'not_started' | 'in_progress' | 'under_review' | 'on_hold';

export interface ProjectLifecyclePhases {
  planning: boolean;
  design: boolean;
  development: boolean;
  testing: boolean;
}

export interface ProjectPresentation {
  id: string;
  round_number: number;
  title: string;
  date: string;
  status: 'completed' | 'scheduled' | 'revision_required';
  feedback?: string;
  score?: number;
}

export interface Project {
  id: string;
  group_id: string;
  mentor_id?: string;
  project_code: string;
  title: string;
  topic: string;
  description?: string;
  problem_statement?: string;
  objectives?: string;
  proposed_solution?: string;
  technologies: string[];
  category: string;
  start_date: string;
  expected_completion_date: string;
  status: ProjectStatus;
  manual_progress_override: boolean;
  progress_percentage: number;
  repository_url?: string;
  live_demo_url?: string;
  presentations?: ProjectPresentation[];
  lifecycle_phases?: ProjectLifecyclePhases;
  created_at: string;
  updated_at: string;
  // Relations
  group?: Group;
  mentor?: Mentor;
  milestones?: ProjectMilestone[];
  tasks?: Task[];
}

export type MilestoneStatus = 'pending' | 'in_progress' | 'under_review' | 'completed';

export interface ProjectMilestone {
  id: string;
  project_id: string;
  step_order: number;
  name: string;
  description?: string;
  assigned_student_id?: string;
  start_date?: string;
  due_date?: string;
  completion_date?: string;
  status: MilestoneStatus;
  remarks?: string;
  supporting_documents?: string[];
  is_custom: boolean;
  created_at: string;
  updated_at: string;
  assigned_student?: Student;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'under_review' | 'completed' | 'blocked' | 'overdue';

export interface Task {
  id: string;
  project_id: string;
  group_id: string;
  title: string;
  description?: string;
  assigned_student_id?: string;
  assigned_date: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  completion_notes?: string;
  attachments?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
  assigned_student?: Student;
  project?: Project;
  group?: Group;
}

export type WeeklyReviewStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'revision_required';

export interface WeeklyReport {
  id: string;
  group_id: string;
  project_id: string;
  week_number: number;
  start_date: string;
  end_date: string;
  activities_completed: string;
  tasks_completed: string;
  tasks_in_progress?: string;
  tasks_pending?: string;
  problems_faced?: string;
  solutions_implemented?: string;
  technologies_used?: string;
  next_week_plan: string;
  student_remarks?: string;
  submitted_by?: string;
  submitted_at: string;
  mentor_feedback?: string;
  mentor_id?: string;
  reviewed_at?: string;
  review_status: WeeklyReviewStatus;
  attachments?: string[];
  created_at: string;
  updated_at: string;
  // Relations
  group?: Group;
  project?: Project;
  submitter?: Student;
  mentor?: Mentor;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';
export type AttendanceSession = 'daily' | 'project_meeting';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  group_id?: string;
  date: string;
  status: AttendanceStatus;
  session_type: AttendanceSession;
  remarks?: string;
  marked_by?: string;
  created_at: string;
  updated_at: string;
  student?: Student;
}

export interface Evaluation {
  id: string;
  project_id: string;
  group_id: string;
  student_id?: string;
  mentor_id: string;
  technical_skills: number;
  teamwork: number;
  communication: number;
  problem_solving: number;
  project_management: number;
  overall_performance: number;
  remarks?: string;
  evaluation_date: string;
  created_at: string;
  student?: Student;
  mentor?: Mentor;
}

export type DocumentCategory = 
  | 'proposal' 
  | 'requirement' 
  | 'weekly_report' 
  | 'screenshot' 
  | 'database_diagram' 
  | 'code' 
  | 'presentation' 
  | 'final_doc' 
  | 'certificate';

export interface ProjectDocument {
  id: string;
  college_id?: string;
  group_id: string;
  project_id: string;
  title: string;
  category: DocumentCategory;
  file_url: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  type: 'task' | 'weekly' | 'attendance' | 'milestone' | 'feedback' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalGroups: number;
  totalActiveProjects: number;
  completedProjects: number;
  ongoingProjects: number;
  delayedProjects: number;
  todayPresentCount: number;
  todayAbsentCount: number;
  overallAttendancePercentage: number;
  pendingTasks: number;
  overdueTasks: number;
  weeklyUpdatesPendingReview: number;
  totalFeeCollected?: number;
  totalFeePending?: number;
}

export type PaymentStatus = 'paid' | 'partial' | 'unpaid' | 'overdue';
export type PaymentMode = 'upi' | 'cash' | 'bank_transfer' | 'cheque';

export interface PaymentTransaction {
  id: string;
  payment_id: string;
  amount: number;
  payment_mode: PaymentMode;
  transaction_ref?: string;
  date: string;
  receipt_no: string;
  notes?: string;
  received_by?: string;
  created_at: string;
}

export interface StudentPayment {
  id: string;
  student_id: string;
  group_id?: string;
  total_fee: number;
  paid_amount: number;
  balance_amount: number;
  status: PaymentStatus;
  last_payment_date?: string;
  payment_mode?: PaymentMode;
  receipt_no?: string;
  remarks?: string;
  transactions?: PaymentTransaction[];
  created_at: string;
  updated_at: string;
  student?: Student;
  group?: Group;
}

export interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'staff';
  designation: string;
  department?: string;
  password?: string;
  is_active: boolean;
  permissions?: StaffPermissions;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}
