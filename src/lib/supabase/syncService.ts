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
  StaffMember
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

// Strip relational / joined fields before upserting into Supabase tables
function cleanRecord<T extends Record<string, any>>(record: T, relationsToStrip: string[]): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(record)) {
    if (!relationsToStrip.includes(k) && v !== undefined) {
      clean[k] = v;
    }
  }
  return clean;
}

export async function fetchCloudData(): Promise<CloudDatabaseSnapshot | null> {
  // If client-side Supabase client is configured, try direct connection first
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
      console.warn('Direct Supabase fetch failed, falling back to server API route:', err);
    }
  }

  // Server API route fallback (/api/sync)
  try {
    const res = await fetch('/api/sync');
    if (!res.ok) return null;
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
    return null;
  } catch (err) {
    console.warn('Cloud fetch notice:', err);
    return null;
  }
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
    // Check if cloud already has records
    const current = await fetchCloudData();
    if (current && (current.students.length > 0 || current.colleges.length > 0)) {
      return false; // Already has cloud data
    }

    console.log('Seeding Supabase with local dataset...');

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

    console.log('Seeding to Supabase finished successfully!');
    return true;
  } catch (err) {
    console.warn('Could not seed local data to Supabase:', err);
    return false;
  }
}

// Real-time Cloud Mutation Helpers (Direct Supabase + API Route fallback)
export async function cloudUpsert(table: string, data: Record<string, any>, relationsToStrip: string[] = []) {
  const payload = cleanRecord(data, relationsToStrip);

  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from(table).upsert(payload);
      if (!error) return;
    } catch (err) {
      console.warn(`Direct upsert failed on ${table}, trying server route:`, err);
    }
  }

  // Fallback to server-side sync API
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', table, record: payload })
    });
  } catch (err) {
    console.warn(`Server route upsert failed on ${table}:`, err);
  }
}

export async function cloudDelete(table: string, id: string) {
  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (!error) return;
    } catch (err) {
      console.warn(`Direct delete failed on ${table}, trying server route:`, err);
    }
  }

  // Fallback to server-side sync API
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', table, id })
    });
  } catch (err) {
    console.warn(`Server route delete failed on ${table}:`, err);
  }
}

export async function cloudInsertMany(table: string, records: Record<string, any>[], relationsToStrip: string[] = []) {
  if (!records || records.length === 0) return;
  const payload = records.map(r => cleanRecord(r, relationsToStrip));

  if (supabase && isSupabaseConfigured) {
    try {
      const { error } = await supabase.from(table).upsert(payload);
      if (!error) return;
    } catch (err) {
      console.warn(`Direct batch upsert failed on ${table}, trying server route:`, err);
    }
  }

  // Fallback to server-side sync API
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert_many', table, records: payload })
    });
  } catch (err) {
    console.warn(`Server route batch upsert failed on ${table}:`, err);
  }
}
