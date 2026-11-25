import { supabase, isSupabaseConfigured } from './client';
import {
  College,
  Course,
  Student,
  Group,
  Project,
  ProjectMilestone,
  Task,
  WeeklyReport,
  AttendanceRecord,
  StudentPayment,
  StaffMember,
  Mentor,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_STAFF_PERMISSIONS
} from '../types';

export interface CloudDatabaseSnapshot {
  colleges: College[];
  courses: Course[];
  students: Student[];
  groups: Group[];
  projects: Project[];
  milestones: ProjectMilestone[];
  tasks: Task[];
  weeklyReports: WeeklyReport[];
  attendance: AttendanceRecord[];
  payments: StudentPayment[];
  staffMembers: StaffMember[];
  mentors: Mentor[];
  isCloudLoaded: boolean;
}

// RFC4122 v4 UUID Validator & Generator
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function ensureUUID(id?: string): string {
  if (id && UUID_REGEX.test(id)) return id;
  return generateUUID();
}

// All UUID columns in PostgreSQL schema that must never receive empty string "" or non-UUID
const UUID_COLUMNS = new Set([
  'id',
  'college_id',
  'course_id',
  'batch_id',
  'mentor_id',
  'group_id',
  'project_id',
  'student_id',
  'profile_id',
  'group_leader_id',
  'assigned_student_id',
  'user_id',
  'created_by'
]);

// Whitelist of valid PostgreSQL columns per table to prevent PostgREST schema cache errors (PGRST204)
export const TABLE_COLUMNS: Record<string, Set<string>> = {
  colleges: new Set([
    'id', 'name', 'code', 'address', 'contact_person', 'contact_phone', 'contact_email', 'created_at', 'updated_at'
  ]),
  courses: new Set([
    'id', 'college_id', 'name', 'code', 'department', 'duration_years', 'created_at', 'updated_at'
  ]),
  students: new Set([
    'id', 'profile_id', 'student_reg_no', 'full_name', 'email', 'phone', 'college_id', 'course_id',
    'department', 'class_year', 'group_id', 'assigned_role', 'joining_date', 'status', 'notes',
    'avatar_url', 'total_fee', 'paid_amount', 'payment_status', 'batch_id', 'created_at', 'updated_at'
  ]),
  groups: new Set([
    'id', 'group_code', 'name', 'college_id', 'course_id', 'class_year', 'batch_id', 'group_leader_id',
    'mentor_id', 'coordinator_name', 'member_ids', 'project_title', 'start_date', 'expected_completion_date',
    'status', 'created_at', 'updated_at'
  ]),
  projects: new Set([
    'id', 'group_id', 'mentor_id', 'project_code', 'title', 'topic', 'description', 'problem_statement',
    'objectives', 'proposed_solution', 'technologies', 'category', 'start_date', 'expected_completion_date',
    'status', 'manual_progress_override', 'progress_percentage', 'repository_url', 'live_demo_url',
    'created_at', 'updated_at', 'presentations', 'lifecycle_phases'
  ]),
  project_milestones: new Set([
    'id', 'project_id', 'step_order', 'name', 'description', 'assigned_student_id', 'start_date',
    'due_date', 'completion_date', 'status', 'remarks', 'supporting_documents', 'is_custom',
    'created_at', 'updated_at'
  ]),
  tasks: new Set([
    'id', 'project_id', 'group_id', 'title', 'description', 'assigned_student_id', 'assigned_date',
    'due_date', 'priority', 'status', 'completion_notes', 'attachments', 'created_by', 'created_at', 'updated_at'
  ]),
  weekly_reports: new Set([
    'id', 'group_id', 'project_id', 'week_number', 'start_date', 'end_date', 'activities_completed',
    'tasks_completed', 'tasks_in_progress', 'tasks_pending', 'problems_faced', 'solutions_implemented',
    'technologies_used', 'next_week_plan', 'student_remarks', 'submitted_by', 'submitted_at',
    'faculty_feedback', 'review_status', 'reviewed_by', 'reviewed_at', 'mentor_id', 'mentor_feedback',
    'attachments', 'work_completed', 'planned_work', 'blockers', 'created_at', 'updated_at'
  ]),
  attendance: new Set([
    'id', 'student_id', 'group_id', 'college_id', 'date', 'status', 'session_type', 'recorded_by',
    'remarks', 'marked_by', 'created_at', 'updated_at'
  ]),
  student_payments: new Set([
    'id', 'student_id', 'group_id', 'total_fee', 'paid_amount', 'balance_amount', 'status',
    'last_payment_date', 'payment_mode', 'receipt_no', 'remarks', 'transactions', 'created_at', 'updated_at'
  ]),
  profiles: new Set([
    'id', 'email', 'full_name', 'role', 'phone', 'avatar_url', 'college_id', 'designation',
    'department', 'permissions', 'password', 'is_active', 'created_at', 'updated_at'
  ]),
  mentors: new Set([
    'id', 'profile_id', 'full_name', 'email', 'phone', 'specialization', 'designation',
    'department', 'is_active', 'created_at', 'updated_at'
  ])
};

// Strip relational / joined fields, whitelist columns, & sanitize UUID columns before sending to Supabase
export function cleanRecord<T extends Record<string, any>>(
  table: string,
  record: T,
  relationsToStrip: string[] = []
): Record<string, any> {
  const allowed = TABLE_COLUMNS[table];
  const clean: Record<string, any> = {};

  for (const [k, v] of Object.entries(record)) {
    if (relationsToStrip.includes(k) || v === undefined) {
      continue;
    }
    // Whitelist only columns that actually exist in PostgreSQL for this table
    if (allowed && !allowed.has(k)) {
      continue;
    }

    if (UUID_COLUMNS.has(k)) {
      if (k === 'id') {
        clean[k] = ensureUUID(v);
      } else if (!v || v === '' || v === 'null' || !UUID_REGEX.test(String(v))) {
        clean[k] = null;
      } else {
        clean[k] = v;
      }
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

export async function fetchCloudData(): Promise<CloudDatabaseSnapshot | null> {
  // 1. Server API route (/api/sync) bypasses client network/CORS/RLS using Service Role
  try {
    const res = await fetch('/api/sync', {
      cache: 'no-store',
      headers: { 'pragma': 'no-cache', 'cache-control': 'no-cache' }
    });
    if (res.ok) {
      const json = await res.json();
      if (json.configured && json.data) {
        const d = json.data;
        const staffMembers: StaffMember[] = (d.staffMembers || []).map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          phone: p.phone,
          role: (p.role === 'admin' ? 'admin' : 'staff') as 'admin' | 'staff',
          designation: p.designation || (p.role === 'admin' ? 'Administrator' : 'Staff Coordinator'),
          department: p.department || 'Management',
          is_active: p.is_active ?? true,
          password: p.password || '123',
          permissions: p.permissions || (p.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_STAFF_PERMISSIONS),
          avatar_url: p.avatar_url,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString()
        }));

        return {
          colleges: d.colleges || [],
          courses: d.courses || [],
          students: d.students || [],
          groups: d.groups || [],
          projects: d.projects || [],
          milestones: d.milestones || [],
          tasks: d.tasks || [],
          weeklyReports: d.weeklyReports || [],
          attendance: d.attendance || [],
          payments: d.payments || [],
          staffMembers,
          mentors: d.mentors || [],
          isCloudLoaded: true
        };
      }
    }
  } catch (err) {
    // API route fetch fallback
  }

  // 2. Direct Supabase client fallback
  if (supabase && isSupabaseConfigured) {
    try {
      const [
        collegesRes,
        coursesRes,
        studentsRes,
        groupsRes,
        projectsRes,
        milestonesRes,
        tasksRes,
        weeklyRes,
        attendanceRes,
        paymentsRes,
        profilesRes,
        mentorsRes
      ] = await Promise.all([
        supabase.from('colleges').select('*'),
        supabase.from('courses').select('*'),
        supabase.from('students').select('*'),
        supabase.from('groups').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('project_milestones').select('*').order('step_order', { ascending: true }),
        supabase.from('tasks').select('*'),
        supabase.from('weekly_reports').select('*'),
        supabase.from('attendance').select('*'),
        supabase.from('student_payments').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('mentors').select('*')
      ]);

      if (!collegesRes.error && !studentsRes.error) {
        const staffMembers: StaffMember[] = (profilesRes.data || []).map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          phone: p.phone,
          role: (p.role === 'admin' ? 'admin' : 'staff') as 'admin' | 'staff',
          designation: p.designation || (p.role === 'admin' ? 'Administrator' : 'Staff Coordinator'),
          department: p.department || 'Management',
          is_active: p.is_active ?? true,
          password: p.password || '123',
          permissions: p.permissions || (p.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_STAFF_PERMISSIONS),
          avatar_url: p.avatar_url,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString()
        }));

        return {
          colleges: (collegesRes.data || []) as College[],
          courses: (coursesRes.data || []) as Course[],
          students: (studentsRes.data || []) as Student[],
          groups: (groupsRes.data || []) as Group[],
          projects: (projectsRes.data || []) as Project[],
          milestones: (milestonesRes.data || []) as ProjectMilestone[],
          tasks: (tasksRes.data || []) as Task[],
          weeklyReports: (weeklyRes.data || []) as WeeklyReport[],
          attendance: (attendanceRes.data || []) as AttendanceRecord[],
          payments: (paymentsRes.data || []) as StudentPayment[],
          staffMembers,
          mentors: (mentorsRes.data || []) as Mentor[],
          isCloudLoaded: true
        };
      }
    } catch (err) {
      console.warn('Direct Supabase fetch notice:', err);
    }
  }

  return null;
}

// Push local records that do not yet exist in Supabase to cloud so all connected devices see them
export async function pushMissingLocalToCloud(local: {
  colleges: College[];
  courses: Course[];
  students: Student[];
  groups: Group[];
  projects: Project[];
  milestones: ProjectMilestone[];
  tasks: Task[];
  weeklyReports: WeeklyReport[];
  attendance: AttendanceRecord[];
  payments: StudentPayment[];
  staffMembers: StaffMember[];
}, cloud: CloudDatabaseSnapshot): Promise<boolean> {
  try {
    const existingCollegeIds = new Set((cloud.colleges || []).map(c => c.id));
    const missingColleges = (local.colleges || []).filter(c => c && !existingCollegeIds.has(c.id));
    if (missingColleges.length > 0) {
      await cloudInsertMany('colleges', missingColleges, []);
    }

    const existingCourseIds = new Set((cloud.courses || []).map(c => c.id));
    const missingCourses = (local.courses || []).filter(c => c && !existingCourseIds.has(c.id));
    if (missingCourses.length > 0) {
      await cloudInsertMany('courses', missingCourses, ['college']);
    }

    const existingStudentIds = new Set((cloud.students || []).map(s => s.id));
    const missingStudents = (local.students || []).filter(s => s && !existingStudentIds.has(s.id));
    if (missingStudents.length > 0) {
      await cloudInsertMany('students', missingStudents, ['college', 'course', 'group']);
    }

    const existingGroupIds = new Set((cloud.groups || []).map(g => g.id));
    const missingGroups = (local.groups || []).filter(g => g && !existingGroupIds.has(g.id));
    if (missingGroups.length > 0) {
      await cloudInsertMany('groups', missingGroups, ['college', 'course', 'mentor', 'leader', 'members', 'project']);
    }

    const existingProjectIds = new Set((cloud.projects || []).map(p => p.id));
    const missingProjects = (local.projects || []).filter(p => p && !existingProjectIds.has(p.id));
    if (missingProjects.length > 0) {
      await cloudInsertMany('projects', missingProjects, ['group', 'mentor', 'milestones', 'tasks']);
    }

    const existingPaymentIds = new Set((cloud.payments || []).map(p => p.id));
    const missingPayments = (local.payments || []).filter(p => p && !existingPaymentIds.has(p.id));
    if (missingPayments.length > 0) {
      await cloudInsertMany('student_payments', missingPayments, ['student', 'group']);
    }

    const existingTaskIds = new Set((cloud.tasks || []).map(t => t.id));
    const missingTasks = (local.tasks || []).filter(t => t && !existingTaskIds.has(t.id));
    if (missingTasks.length > 0) {
      await cloudInsertMany('tasks', missingTasks, ['assigned_student', 'project']);
    }

    const existingMilestoneIds = new Set((cloud.milestones || []).map(m => m.id));
    const missingMilestones = (local.milestones || []).filter(m => m && !existingMilestoneIds.has(m.id));
    if (missingMilestones.length > 0) {
      await cloudInsertMany('project_milestones', missingMilestones, ['assigned_student']);
    }

    const existingAttendanceIds = new Set((cloud.attendance || []).map(a => a.id));
    const missingAttendance = (local.attendance || []).filter(a => a && !existingAttendanceIds.has(a.id));
    if (missingAttendance.length > 0) {
      await cloudInsertMany('attendance', missingAttendance, ['student']);
    }

    const existingWeeklyIds = new Set((cloud.weeklyReports || []).map(w => w.id));
    const missingWeekly = (local.weeklyReports || []).filter(w => w && !existingWeeklyIds.has(w.id));
    if (missingWeekly.length > 0) {
      await cloudInsertMany('weekly_reports', missingWeekly, ['group', 'project', 'submitter', 'mentor']);
    }

    return true;
  } catch (err) {
    console.warn('Push missing local to cloud notice:', err);
    return false;
  }
}

// Real-time Cloud Mutation Helpers: Always use server API route first to bypass RLS with Service Role Key
export async function cloudUpsert(table: string, data: Record<string, any>, relationsToStrip: string[] = []) {
  const payload = cleanRecord(table, data, relationsToStrip);

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', table, record: payload })
    });
    if (res.ok) return;
  } catch (err) {
    // Fallback
  }

  // Direct Supabase fallback
  if (supabase && isSupabaseConfigured) {
    try {
      await supabase.from(table).upsert(payload);
    } catch (err) {
      console.warn(`Direct upsert notice on ${table}:`, err);
    }
  }
}

export async function cloudDelete(table: string, id: string) {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', table, id })
    });
    if (res.ok) return;
  } catch (err) {
    // Fallback
  }

  if (supabase && isSupabaseConfigured) {
    try {
      await supabase.from(table).delete().eq('id', id);
    } catch (err) {
      console.warn(`Direct delete notice on ${table}:`, err);
    }
  }
}

// Atomically delete student and cascade delete all related payments, attendance, tasks, and evaluations in Supabase
export async function cloudDeleteStudentCascade(studentId: string) {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_student_cascade', student_id: studentId })
    });
    if (res.ok) return;
  } catch (err) {
    // Fallback
  }

  if (supabase && isSupabaseConfigured) {
    try {
      await Promise.allSettled([
        supabase.from('student_payments').delete().eq('student_id', studentId),
        supabase.from('attendance').delete().eq('student_id', studentId),
        supabase.from('tasks').delete().eq('assigned_student_id', studentId),
        supabase.from('evaluations').delete().eq('student_id', studentId),
        supabase.from('group_members').delete().eq('student_id', studentId),
        supabase.from('project_milestones').update({ assigned_student_id: null }).eq('assigned_student_id', studentId),
        supabase.from('weekly_reports').update({ submitted_by: null }).eq('submitted_by', studentId),
        supabase.from('groups').update({ group_leader_id: null }).eq('group_leader_id', studentId),
        supabase.from('students').delete().eq('id', studentId)
      ]);
    } catch (err) {
      console.warn('Direct cascade delete notice:', err);
    }
  }
}

export async function cloudInsertMany(table: string, records: Record<string, any>[], relationsToStrip: string[] = []) {
  if (!records || records.length === 0) return;
  const payload = records.map(r => cleanRecord(table, r, relationsToStrip));

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert_many', table, records: payload })
    });
    if (res.ok) return;
  } catch (err) {
    // Fallback
  }

  if (supabase && isSupabaseConfigured) {
    try {
      await supabase.from(table).upsert(payload);
    } catch (err) {
      console.warn(`Direct batch upsert notice on ${table}:`, err);
    }
  }
}
