import {
  College,
  Course,
  AcademicBatch,
  Mentor,
  Student,
  Group,
  Project,
  ProjectMilestone,
  Task,
  WeeklyReport,
  AttendanceRecord,
  Evaluation,
  ProjectDocument,
  AppNotification,
  ActivityLog,
  UserProfile,
  StudentPayment,
  StaffMember,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_STAFF_PERMISSIONS
} from '../types';

// Admin account: username = admin, password = 123
// Staff account: username = staff, password = 123
export const initialProfiles: UserProfile[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@cognilearn.org',
    full_name: 'Administrator',
    role: 'admin',
    phone: '+91 98470 11223',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    is_active: true,
    permissions: DEFAULT_ADMIN_PERMISSIONS,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'staff@cognilearn.org',
    full_name: 'Staff Coordinator',
    role: 'staff',
    phone: '+91 98470 55667',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    is_active: true,
    permissions: DEFAULT_STAFF_PERMISSIONS,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const initialColleges: College[] = [];

export const initialCourses: Course[] = [];

export const initialBatches: AcademicBatch[] = [
  {
    id: '99999999-9999-9999-9999-999999999999',
    name: '2024-2025 Final Year Projects',
    start_year: 2024,
    end_year: 2025,
    is_active: true,
    created_at: new Date().toISOString()
  }
];

// Clean Database: all records start empty
export const initialPayments: StudentPayment[] = [];
export const initialStaff: StaffMember[] = [
  {
    id: 'staff-admin-01',
    full_name: 'Administrator',
    email: 'admin@cognilearn.org',
    phone: '+91 98470 11223',
    role: 'admin',
    designation: 'Operations Director',
    department: 'Management',
    is_active: true,
    permissions: DEFAULT_ADMIN_PERMISSIONS,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'staff-coord-02',
    full_name: 'Staff Coordinator',
    email: 'staff@cognilearn.org',
    phone: '+91 98470 55667',
    role: 'staff',
    designation: 'Staff In-Charge & Project Coordinator',
    department: 'Academic Supervision',
    is_active: true,
    permissions: DEFAULT_STAFF_PERMISSIONS,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const initialMentors: Mentor[] = [];
export const initialStudents: Student[] = [];
export const initialGroups: Group[] = [];
export const initialProjects: Project[] = [];
export const initialMilestones: ProjectMilestone[] = [];
export const initialTasks: Task[] = [];
export const initialWeeklyReports: WeeklyReport[] = [];
export const initialAttendance: AttendanceRecord[] = [];
export const initialEvaluations: Evaluation[] = [];
export const initialDocuments: ProjectDocument[] = [];
export const initialNotifications: AppNotification[] = [];
export const initialActivityLogs: ActivityLog[] = [
  {
    id: 'act-init',
    user_name: 'System Admin',
    action: 'SYSTEM_INITIALIZED',
    entity_type: 'system',
    description: 'System database initialized with clean slate. Ready for student and group enrollment.',
    created_at: new Date().toISOString()
  }
];
