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

// Strip relational / joined fields & sanitize UUID columns before sending to Supabase
function cleanRecord<T extends Record<string, any>>(record: T, relationsToStrip: string[]): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(record)) {
    if (relationsToStrip.includes(k) || v === undefined) {
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
  // 1. Try server API route fallback first (/api/sync) as it uses Service Role key and bypasses RLS
  try {
    const res = await fetch('/api/sync');
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
          isCloudLoaded: true
        };
      }
    }
  } catch (err) {
    // console.warn('Server sync route notice:', err);
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
        profilesRes
      ] = await Promise.all([
        supabase.from('colleges').select('*'),
        supabase.from('courses').select('*'),
        supabase.from('students').select('*'),
        supabase.from('groups').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('project_milestones').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('weekly_reports').select('*'),
        supabase.from('attendance').select('*'),
        supabase.from('student_payments').select('*'),
        supabase.from('profiles').select('*')
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
          isCloudLoaded: true
        };
      }
    } catch (err) {
      console.warn('Direct Supabase fetch notice:', err);
    }
  }

  return null;
}

// Migrate/Seed Supabase with existing local state if Supabase has 0 records
export async function seedCloudDataIfEmpty(snapshot: {
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
}): Promise<boolean> {
  try {
    const current = await fetchCloudData();
    if (current && (current.students.length > 0 || current.colleges.length > 0)) {
      return false;
    }

    if (snapshot.colleges.length > 0) {
      await cloudInsertMany('colleges', snapshot.colleges, []);
    }
    if (snapshot.courses.length > 0) {
      await cloudInsertMany('courses', snapshot.courses, ['college']);
    }
    if (snapshot.groups.length > 0) {
      await cloudInsertMany('groups', snapshot.groups, ['college', 'course', 'mentor', 'leader', 'members', 'project']);
    }
    if (snapshot.students.length > 0) {
      await cloudInsertMany('students', snapshot.students, ['college', 'course', 'group']);
    }
    if (snapshot.projects.length > 0) {
      await cloudInsertMany('projects', snapshot.projects, ['group', 'mentor', 'milestones', 'tasks']);
    }
    if (snapshot.milestones.length > 0) {
      await cloudInsertMany('project_milestones', snapshot.milestones, ['assigned_student']);
    }
    if (snapshot.tasks.length > 0) {
      await cloudInsertMany('tasks', snapshot.tasks, ['assigned_student', 'project']);
    }
    if (snapshot.attendance.length > 0) {
      await cloudInsertMany('attendance', snapshot.attendance, ['student']);
    }
    if (snapshot.payments.length > 0) {
      await cloudInsertMany('student_payments', snapshot.payments, ['student', 'group']);
    }
    if (snapshot.staffMembers.length > 0) {
      const staffPayload = snapshot.staffMembers.map(s => ({
        id: s.id,
        email: s.email,
        full_name: s.full_name,
        role: s.role,
        phone: s.phone,
        avatar_url: s.avatar_url,
        is_active: s.is_active,
        created_at: s.created_at,
        updated_at: s.updated_at
      }));
      await cloudInsertMany('profiles', staffPayload, []);
    }

    return true;
  } catch (err) {
    console.warn('Could not seed local data to Supabase:', err);
    return false;
  }
}

// Real-time Cloud Mutation Helpers: Always use server API route first to bypass RLS with Service Role Key
export async function cloudUpsert(table: string, data: Record<string, any>, relationsToStrip: string[] = []) {
  const payload = cleanRecord(data, relationsToStrip);

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', table, record: payload })
    });
    if (res.ok) return;
  } catch (err) {
    // console.warn(`Server route upsert notice on ${table}:`, err);
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
    // console.warn(`Server route delete notice on ${table}:`, err);
  }

  if (supabase && isSupabaseConfigured) {
    try {
      await supabase.from(table).delete().eq('id', id);
    } catch (err) {
      console.warn(`Direct delete notice on ${table}:`, err);
    }
  }
}

export async function cloudInsertMany(table: string, records: Record<string, any>[], relationsToStrip: string[] = []) {
  if (!records || records.length === 0) return;
  const payload = records.map(r => cleanRecord(r, relationsToStrip));

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert_many', table, records: payload })
    });
    if (res.ok) return;
  } catch (err) {
    // console.warn(`Server route batch upsert notice on ${table}:`, err);
  }

  if (supabase && isSupabaseConfigured) {
    try {
      await supabase.from(table).upsert(payload);
    } catch (err) {
      console.warn(`Direct batch upsert notice on ${table}:`, err);
    }
  }
}
