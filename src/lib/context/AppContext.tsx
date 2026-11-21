'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  UserProfile,
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
  College,
  Course,
  Mentor,
  DashboardStats,
  UserRole,
  StudentPayment,
  StaffMember,
  PaymentMode,
  PaymentStatus
} from '../types';
import {
  initialProfiles,
  initialStudents,
  initialGroups,
  initialProjects,
  initialMilestones,
  initialTasks,
  initialWeeklyReports,
  initialAttendance,
  initialEvaluations,
  initialDocuments,
  initialNotifications,
  initialActivityLogs,
  initialColleges,
  initialCourses,
  initialMentors,
  initialPayments,
  initialStaff
} from '../data/initialData';
import {
  fetchCloudData,
  seedCloudDataIfEmpty,
  cloudUpsert,
  cloudDelete,
  cloudInsertMany
} from '../supabase/syncService';
import { calculateComputedProgress } from '../utils/formatters';

interface AppContextType {
  currentUser: UserProfile;
  isAuthenticated: boolean;
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  colleges: College[];
  courses: Course[];
  mentors: Mentor[];
  students: Student[];
  groups: Group[];
  projects: Project[];
  milestones: ProjectMilestone[];
  tasks: Task[];
  weeklyReports: WeeklyReport[];
  attendance: AttendanceRecord[];
  evaluations: Evaluation[];
  documents: ProjectDocument[];
  notifications: AppNotification[];
  activityLogs: ActivityLog[];
  payments: StudentPayment[];
  staffMembers: StaffMember[];
  stats: DashboardStats;
  
  // College & Department Actions
  addCollege: (name: string, code?: string) => College;
  deleteCollege: (id: string) => void;
  addCourse: (name: string, department?: string, college_id?: string) => Course;
  deleteCourse: (id: string) => void;

  // Student Actions
  addStudent: (student: Omit<Student, 'id' | 'created_at' | 'updated_at'>) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  // Group Actions
  createGroup: (group: Omit<Group, 'id' | 'created_at' | 'updated_at'>) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  deleteGroup: (id: string) => void;

  // Payment Actions
  recordPayment: (payment: {
    student_id: string;
    group_id?: string;
    total_fee: number;
    amount: number;
    payment_mode: PaymentMode;
    receipt_no?: string;
    remarks?: string;
  }) => void;
  updatePayment: (id: string, updates: Partial<StudentPayment>) => void;

  // Staff Actions
  addStaffMember: (staff: Omit<StaffMember, 'id' | 'created_at' | 'updated_at'>) => void;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaffMember: (id: string) => void;

  // Project Actions
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Milestone Actions
  addMilestone: (milestone: Omit<ProjectMilestone, 'id' | 'created_at' | 'updated_at'>) => void;
  updateMilestone: (id: string, updates: Partial<ProjectMilestone>) => void;
  deleteMilestone: (id: string) => void;

  // Task Actions
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Weekly Report Actions
  submitWeeklyReport: (report: Omit<WeeklyReport, 'id' | 'created_at' | 'updated_at'>) => void;
  reviewWeeklyReport: (id: string, feedback: string, status: WeeklyReport['review_status']) => void;

  // Attendance Actions
  markAttendanceBatch: (records: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>[]) => void;
  updateAttendance: (id: string, status: AttendanceRecord['status'], remarks?: string) => void;

  // Document Actions
  uploadDocument: (doc: Omit<ProjectDocument, 'id' | 'created_at'>) => void;
  deleteDocument: (id: string) => void;

  // Evaluation Actions
  saveEvaluation: (evaluation: Omit<Evaluation, 'id' | 'created_at'>) => void;

  // Notification Actions
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Password Actions
  changePassword: (oldPass: string, newPass: string, usernameOrRole?: string) => { success: boolean; message: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Current user & auth state
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialProfiles[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('cognilearn_auth');
      if (auth === 'admin') {
        setIsAuthenticated(true);
        setCurrentUser(initialProfiles[0]);
      } else if (auth === 'staff') {
        setIsAuthenticated(true);
        setCurrentUser(initialProfiles[1] || {
          id: '00000000-0000-0000-0000-000000000002',
          email: 'staff@cognilearn.org',
          full_name: 'Staff Coordinator',
          role: 'staff',
          phone: '+91 98470 55667',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
  }, []);

  const [passwords, setPasswords] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return { admin: '123', staff: '123' };
    try {
      const item = localStorage.getItem('cognilearn_passwords');
      return item ? JSON.parse(item) : { admin: '123', staff: '123' };
    } catch {
      return { admin: '123', staff: '123' };
    }
  });

  const login = (username: string, pass: string): boolean => {
    const cleanUser = username.trim().toLowerCase();
    const adminPass = passwords['admin'] || '123';
    const staffPass = passwords['staff'] || '123';

    // 1. Admin login
    if ((cleanUser === 'admin' || cleanUser === 'admin@cognilearn.org') && pass === adminPass) {
      setIsAuthenticated(true);
      setCurrentUser(initialProfiles[0]);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cognilearn_auth', 'admin');
      }
      return true;
    }

    // 2. Staff login
    if ((cleanUser === 'staff' || cleanUser === 'staff@cognilearn.org') && pass === staffPass) {
      setIsAuthenticated(true);
      const staffUser: UserProfile = initialProfiles[1] || {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'staff@cognilearn.org',
        full_name: 'Staff Coordinator',
        role: 'staff',
        phone: '+91 98470 55667',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setCurrentUser(staffUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cognilearn_auth', 'staff');
      }
      return true;
    }

    // 3. Dynamic staff member login (any staff email or name added by admin)
    const matchedStaff = staffMembers.find(
      s => (s.email.toLowerCase() === cleanUser || s.full_name.toLowerCase() === cleanUser) && s.is_active
    );
    const userPass = passwords[cleanUser] || (matchedStaff?.role === 'staff' ? staffPass : adminPass);
    if (matchedStaff && pass === userPass) {
      setIsAuthenticated(true);
      const dynamicUser: UserProfile = {
        id: matchedStaff.id,
        email: matchedStaff.email,
        full_name: matchedStaff.full_name,
        role: matchedStaff.role === 'admin' ? 'admin' : 'staff',
        phone: matchedStaff.phone,
        avatar_url: matchedStaff.avatar_url,
        is_active: true,
        created_at: matchedStaff.created_at,
        updated_at: matchedStaff.updated_at
      };
      setCurrentUser(dynamicUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cognilearn_auth', matchedStaff.role === 'admin' ? 'admin' : 'staff');
      }
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cognilearn_auth');
    }
  };

  // Safe storage helpers
  function loadFromStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;
      const parsed = JSON.parse(item);
      if (parsed === null || parsed === undefined) return fallback;
      if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
      return parsed as T;
    } catch {
      return fallback;
    }
  }

  function saveToStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`Could not save ${key} to storage`, err);
    }
  }

  // Data states
  const [colleges, setColleges] = useState<College[]>(() => loadFromStorage('cognilearn_colleges', initialColleges));
  const [courses, setCourses] = useState<Course[]>(() => loadFromStorage('cognilearn_courses', initialCourses));
  const [mentors] = useState<Mentor[]>(initialMentors);
  const [students, setStudents] = useState<Student[]>(() => loadFromStorage('cognilearn_students', initialStudents));
  const [groups, setGroups] = useState<Group[]>(() => loadFromStorage('cognilearn_groups', initialGroups));
  const [projects, setProjects] = useState<Project[]>(() => loadFromStorage('cognilearn_projects', initialProjects));
  const [milestones, setMilestones] = useState<ProjectMilestone[]>(() => loadFromStorage('cognilearn_milestones', initialMilestones));
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage('cognilearn_tasks', initialTasks));
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>(() => loadFromStorage('cognilearn_weekly', initialWeeklyReports));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => loadFromStorage('cognilearn_attendance', initialAttendance));
  const [evaluations, setEvaluations] = useState<Evaluation[]>(initialEvaluations);
  const [documents, setDocuments] = useState<ProjectDocument[]>(initialDocuments);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);
  const [payments, setPayments] = useState<StudentPayment[]>(() => loadFromStorage('cognilearn_payments', initialPayments));
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => loadFromStorage('cognilearn_staff', initialStaff));

  // Sync state changes to storage
  useEffect(() => { saveToStorage('cognilearn_colleges', colleges); }, [colleges]);
  useEffect(() => { saveToStorage('cognilearn_courses', courses); }, [courses]);
  useEffect(() => { saveToStorage('cognilearn_students', students); }, [students]);
  useEffect(() => { saveToStorage('cognilearn_groups', groups); }, [groups]);
  useEffect(() => { saveToStorage('cognilearn_projects', projects); }, [projects]);
  useEffect(() => { saveToStorage('cognilearn_milestones', milestones); }, [milestones]);
  useEffect(() => { saveToStorage('cognilearn_tasks', tasks); }, [tasks]);
  useEffect(() => { saveToStorage('cognilearn_weekly', weeklyReports); }, [weeklyReports]);
  useEffect(() => { saveToStorage('cognilearn_attendance', attendance); }, [attendance]);
  useEffect(() => { saveToStorage('cognilearn_payments', payments); }, [payments]);
  useEffect(() => { saveToStorage('cognilearn_staff', staffMembers); }, [staffMembers]);

  // Track user's latest local edit to prevent polling from wiping active data
  const lastLocalEditTime = useRef<number>(0);

  // Cloud Database Live Synchronization (Supabase)
  useEffect(() => {
    let isMounted = true;

    async function initCloudSync() {
      try {
        const cloud = await fetchCloudData();
        if (!cloud || !isMounted) return;

        const hasCloudRecords = (
          cloud.students.length > 0 ||
          cloud.groups.length > 0 ||
          cloud.colleges.length > 0 ||
          cloud.projects.length > 0
        );

        if (hasCloudRecords) {
          // Cloud has existing data -> synchronize to state
          if (cloud.colleges.length > 0) setColleges(cloud.colleges);
          if (cloud.courses.length > 0) setCourses(cloud.courses);
          if (cloud.students.length > 0) setStudents(cloud.students);
          if (cloud.groups.length > 0) setGroups(cloud.groups);
          if (cloud.projects.length > 0) setProjects(cloud.projects);
          if (cloud.milestones.length > 0) setMilestones(cloud.milestones);
          if (cloud.tasks.length > 0) setTasks(cloud.tasks);
          if (cloud.weeklyReports.length > 0) setWeeklyReports(cloud.weeklyReports);
          if (cloud.attendance.length > 0) setAttendance(cloud.attendance);
          if (cloud.payments.length > 0) setPayments(cloud.payments);
          if (cloud.staffMembers.length > 0) setStaffMembers(cloud.staffMembers);
        } else {
          // Cloud is empty -> Seed existing local data to cloud so other users can see it immediately
          await seedCloudDataIfEmpty({
            colleges,
            courses,
            students,
            groups,
            projects,
            milestones,
            tasks,
            weeklyReports,
            attendance,
            payments,
            staffMembers
          });
        }
      } catch (err) {
        console.warn('Cloud sync initialization notice:', err);
      }
    }

    initCloudSync();

    // 15-second background polling without overwriting active user typing
    const pollInterval = setInterval(async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      if (Date.now() - lastLocalEditTime.current < 8000) return; // Skip if user actively made edits in last 8s

      const cloud = await fetchCloudData();
      if (!cloud || !isMounted) return;

      if (cloud.students.length > 0 || cloud.groups.length > 0 || cloud.colleges.length > 0) {
        setColleges(prev => JSON.stringify(prev) !== JSON.stringify(cloud.colleges) ? cloud.colleges : prev);
        setCourses(prev => JSON.stringify(prev) !== JSON.stringify(cloud.courses) ? cloud.courses : prev);
        setStudents(prev => JSON.stringify(prev) !== JSON.stringify(cloud.students) ? cloud.students : prev);
        setGroups(prev => JSON.stringify(prev) !== JSON.stringify(cloud.groups) ? cloud.groups : prev);
        setProjects(prev => JSON.stringify(prev) !== JSON.stringify(cloud.projects) ? cloud.projects : prev);
        setMilestones(prev => JSON.stringify(prev) !== JSON.stringify(cloud.milestones) ? cloud.milestones : prev);
        setTasks(prev => JSON.stringify(prev) !== JSON.stringify(cloud.tasks) ? cloud.tasks : prev);
        setWeeklyReports(prev => JSON.stringify(prev) !== JSON.stringify(cloud.weeklyReports) ? cloud.weeklyReports : prev);
        setAttendance(prev => JSON.stringify(prev) !== JSON.stringify(cloud.attendance) ? cloud.attendance : prev);
        setPayments(prev => JSON.stringify(prev) !== JSON.stringify(cloud.payments) ? cloud.payments : prev);
        setStaffMembers(prev => JSON.stringify(prev) !== JSON.stringify(cloud.staffMembers) ? cloud.staffMembers : prev);
      }
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  // Auto-delete projects that have no students assigned
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setProjects(prevProjects => {
      if (!Array.isArray(prevProjects)) return prevProjects;
      const orphanProjects = prevProjects.filter(p => {
        if (!p) return true;
        const grp = groups.find(g => g && g.id === p.group_id);
        if (!grp) return true; // Group does not exist
        // Check if any active student is assigned to this group
        const hasStudents = students.some(s => s && (s.group_id === grp.id || grp.member_ids?.includes(s.id)));
        return !hasStudents; // If no students assigned, it is an orphan project
      });

      if (orphanProjects.length > 0) {
        const orphanIds = new Set(orphanProjects.map(p => p.id));
        setMilestones(prev => prev.filter(m => !orphanIds.has(m.project_id)));
        setTasks(prev => prev.filter(t => !orphanIds.has(t.project_id)));
        setEvaluations(prev => prev.filter(e => !orphanIds.has(e.project_id)));
        return prevProjects.filter(p => !orphanIds.has(p.id));
      }
      return prevProjects;
    });
  }, [groups, students]);

  // Sync relation helper
  const enrichedStudents = useMemo(() => {
    const list = Array.isArray(students) ? students : initialStudents;
    const clgs = Array.isArray(colleges) ? colleges : initialColleges;
    const crss = Array.isArray(courses) ? courses : initialCourses;
    const grps = Array.isArray(groups) ? groups : initialGroups;

    return list.map(s => {
      if (!s) return null;
      const college = clgs.find(c => c && c.id === s.college_id);
      const course = crss.find(c => c && c.id === s.course_id);
      const group = grps.find(g => g && g.id === s.group_id);
      return { ...s, college, course, group };
    }).filter(Boolean) as Student[];
  }, [students, colleges, courses, groups]);

  // Dynamic project progress & relation synchronization
  const enrichedProjects = useMemo(() => {
    const projs = Array.isArray(projects) ? projects : initialProjects;
    const ms = Array.isArray(milestones) ? milestones : initialMilestones;
    const tsks = Array.isArray(tasks) ? tasks : initialTasks;
    const grps = Array.isArray(groups) ? groups : initialGroups;
    const mntrs = Array.isArray(mentors) ? mentors : initialMentors;
    const studs = Array.isArray(students) ? students : initialStudents;

    return projs.map(p => {
      if (!p) return null;
      const group = grps.find(g => g && g.id === p.group_id);
      if (!group) return null;

      // Auto-exclude if no students are assigned to this project's group
      const assignedStudents = studs.filter(s => s && (s.group_id === p.group_id || group.member_ids?.includes(s.id)));
      if (assignedStudents.length === 0) return null;

      const mentor = mntrs.find(m => m && (m.id === p.mentor_id || m.id === group?.mentor_id));
      const pMilestones = ms.filter(m => m && m.project_id === p.id);
      const pTasks = tsks.filter(t => t && (t.project_id === p.id || (p.group_id && t.group_id === p.group_id)));

      // Dynamically calculate progress unless manual override is explicitly enabled
      let progress = p.progress_percentage || 0;
      if (!p.manual_progress_override) {
        progress = calculateComputedProgress(pMilestones, pTasks);
      }

      // Automatically sync project status based on progress
      let status = p.status;
      if (progress === 100) {
        status = 'completed';
      } else if (progress > 0 && status === 'planning') {
        status = 'in_progress';
      }

      return {
        ...p,
        progress_percentage: progress,
        status,
        group,
        mentor,
        milestones: pMilestones,
        tasks: pTasks
      };
    }).filter(Boolean) as Project[];
  }, [projects, milestones, tasks, groups, mentors, students]);

  const enrichedGroups = useMemo(() => {
    const grps = Array.isArray(groups) ? groups : initialGroups;
    const clgs = Array.isArray(colleges) ? colleges : initialColleges;
    const crss = Array.isArray(courses) ? courses : initialCourses;
    const mntrs = Array.isArray(mentors) ? mentors : initialMentors;
    const studs = Array.isArray(students) ? students : initialStudents;

    return grps.map(g => {
      if (!g) return null;
      const college = clgs.find(c => c && c.id === g.college_id);
      const course = crss.find(c => c && c.id === g.course_id);
      const mentor = mntrs.find(m => m && m.id === g.mentor_id);
      const leader = studs.find(s => s && s.id === g.group_leader_id);
      const members = studs.filter(s => s && s.group_id === g.id);
      const project = enrichedProjects.find(p => p && p.group_id === g.id);
      return { ...g, college, course, mentor, leader, members, project };
    }).filter(Boolean) as Group[];
  }, [groups, colleges, courses, mentors, students, enrichedProjects]);

  const enrichedTasks = useMemo(() => {
    const tsks = Array.isArray(tasks) ? tasks : initialTasks;
    const studs = Array.isArray(students) ? students : initialStudents;

    return tsks.map(t => {
      if (!t) return null;
      const assigned_student = studs.find(s => s && s.id === t.assigned_student_id);
      const project = enrichedProjects.find(p => p && p.id === t.project_id);
      return { ...t, assigned_student, project };
    }).filter(Boolean) as Task[];
  }, [tasks, students, enrichedProjects]);

  const enrichedWeeklyReports = useMemo(() => {
    const rprts = Array.isArray(weeklyReports) ? weeklyReports : initialWeeklyReports;
    const grps = Array.isArray(groups) ? groups : initialGroups;
    const studs = Array.isArray(students) ? students : initialStudents;
    const mntrs = Array.isArray(mentors) ? mentors : initialMentors;

    return rprts.map(w => {
      if (!w) return null;
      const group = grps.find(g => g && g.id === w.group_id);
      const project = enrichedProjects.find(p => p && p.id === w.project_id);
      const submitter = studs.find(s => s && s.id === w.submitted_by);
      const mentor = mntrs.find(m => m && m.id === w.mentor_id);
      return { ...w, group, project, submitter, mentor };
    }).filter(Boolean) as WeeklyReport[];
  }, [weeklyReports, groups, enrichedProjects, students, mentors]);

  const enrichedAttendance = useMemo(() => {
    const attnd = Array.isArray(attendance) ? attendance : initialAttendance;
    const studs = Array.isArray(students) ? students : initialStudents;

    return attnd.map(a => {
      if (!a) return null;
      const student = studs.find(s => s && s.id === a.student_id);
      return { ...a, student };
    }).filter(Boolean) as AttendanceRecord[];
  }, [attendance, students]);

  const enrichedPayments = useMemo(() => {
    const pymnts = Array.isArray(payments) ? payments : initialPayments;
    const studs = Array.isArray(students) ? students : initialStudents;
    const grps = Array.isArray(groups) ? groups : initialGroups;

    return pymnts.map(p => {
      if (!p) return null;
      const student = studs.find(s => s && s.id === p.student_id);
      const group = grps.find(g => g && (g.id === p.group_id || g.id === student?.group_id));
      return { ...p, student, group };
    }).filter(Boolean) as StudentPayment[];
  }, [payments, students, groups]);

  // Compute live dashboard stats
  const stats: DashboardStats = useMemo(() => {
    const studs = Array.isArray(students) ? students : [];
    const grps = Array.isArray(groups) ? groups : [];
    const projs = Array.isArray(enrichedProjects) ? enrichedProjects : [];
    const tsks = Array.isArray(tasks) ? tasks : [];
    const attnd = Array.isArray(attendance) ? attendance : [];
    const rprts = Array.isArray(weeklyReports) ? weeklyReports : [];
    const pymnts = Array.isArray(payments) ? payments : [];

    const totalStudents = studs.length;
    const totalGroups = grps.length;
    const totalActiveProjects = projs.filter(p => p && p.status !== 'completed').length;
    const completedProjects = projs.filter(p => p && p.status === 'completed').length;
    const ongoingProjects = projs.filter(p => p && p.status === 'in_progress').length;
    const delayedProjects = projs.filter(p => p && p.status === 'on_hold').length;

    const totalFeeCollected = pymnts.reduce((acc, p) => acc + ((p && p.paid_amount) || 0), 0);
    const totalFeePending = pymnts.reduce((acc, p) => acc + ((p && p.balance_amount) || 0), 0);

    // Today's attendance calculation (local date comparison: YYYY-MM-DD)
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todaysRecords = attnd.filter(a => a && a.date === today);
    const todayPresentCount = todaysRecords.filter(a => a && (a.status === 'present' || a.status === 'late')).length;
    const todayAbsentCount = todaysRecords.filter(a => a && (a.status === 'absent' || a.status === 'leave')).length;

    // Overall attendance percentage
    const totalRecords = attnd.length;
    const presentRecords = attnd.filter(a => a && (a.status === 'present' || a.status === 'late')).length;
    const overallAttendancePercentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

    const pendingTasks = tsks.filter(t => t && t.status !== 'completed').length;
    const overdueTasks = tsks.filter(t => {
      if (!t) return false;
      if (t.status === 'overdue') return true;
      if (t.status !== 'completed' && t.due_date) {
        const d = new Date(t.due_date);
        return !isNaN(d.getTime()) && d < new Date();
      }
      return false;
    }).length;

    const weeklyUpdatesPendingReview = rprts.filter(w => w && (w.review_status === 'submitted' || w.review_status === 'under_review')).length;

    return {
      totalStudents,
      totalGroups,
      totalActiveProjects,
      completedProjects,
      ongoingProjects,
      delayedProjects,
      todayPresentCount,
      todayAbsentCount,
      overallAttendancePercentage,
      pendingTasks,
      overdueTasks,
      weeklyUpdatesPendingReview,
      totalFeeCollected,
      totalFeePending
    };
  }, [students, groups, projects, attendance, tasks, weeklyReports, payments]);

  // Role switcher
  const switchRole = (role: UserRole) => {
    if (role === 'admin') {
      setCurrentUser(initialProfiles[0]);
    } else if (role === 'staff') {
      setCurrentUser(initialProfiles[1] || {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'staff@cognilearn.org',
        full_name: 'Staff Coordinator',
        role: 'staff',
        phone: '+91 98470 55667',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } else if (role === 'mentor') {
      setCurrentUser({
        id: '00000000-0000-0000-0000-000000000003',
        email: 'mentor@cognilearn.org',
        full_name: 'Project Mentor',
        role: 'mentor',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } else {
      setCurrentUser({
        id: '00000000-0000-0000-0000-000000000010',
        email: 'student@mescet.ac.in',
        full_name: 'Student Lead',
        role: 'student',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  };

  // Activity logger helper
  const logActivity = (action: string, entity_type: string, description: string, entity_id?: string) => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      user_id: currentUser.id,
      user_name: `${currentUser.full_name} (${currentUser.role.toUpperCase()})`,
      action,
      entity_type,
      entity_id,
      description,
      created_at: new Date().toISOString()
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // College & Department Actions
  const addCollege = (name: string, code?: string): College => {
    const trimmed = name.trim();
    const existing = colleges.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const newCol: College = {
      id: `col-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: trimmed,
      code: code?.trim() || trimmed.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 8),
      created_at: new Date().toISOString()
    };
    setColleges(prev => [...prev, newCol]);
    cloudUpsert('colleges', newCol);
    logActivity('COLLEGE_ADDED', 'college', `Added college: ${trimmed}`, newCol.id);
    return newCol;
  };

  const deleteCollege = (id: string) => {
    setColleges(prev => prev.filter(c => c.id !== id));
    cloudDelete('colleges', id);
    logActivity('COLLEGE_DELETED', 'college', `Removed college`, id);
  };

  const addCourse = (name: string, department?: string, college_id?: string): Course => {
    const trimmed = name.trim();
    const existing = courses.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const newCourse: Course = {
      id: `crs-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      college_id: college_id || '',
      name: trimmed,
      code: trimmed.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 8),
      department: department?.trim() || trimmed,
      duration_years: 4,
      created_at: new Date().toISOString()
    };
    setCourses(prev => [...prev, newCourse]);
    cloudUpsert('courses', newCourse, ['college']);
    logActivity('COURSE_ADDED', 'course', `Added department/course: ${trimmed}`, newCourse.id);
    return newCourse;
  };

  const deleteCourse = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    cloudDelete('courses', id);
    logActivity('COURSE_DELETED', 'course', `Removed department/course`, id);
  };

  // Student Actions
  const addStudent = (data: Omit<Student, 'id' | 'created_at' | 'updated_at'>) => {
    lastLocalEditTime.current = Date.now();
    const now = new Date().toISOString();
    const newStudentId = `s-${Date.now()}`;
    const totalFee = data.total_fee || 5000;
    const paidAmount = data.paid_amount || 0;
    const balance = Math.max(0, totalFee - paidAmount);
    const feeStatus: PaymentStatus = balance === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    // Compute sequential unique student ID: 1, 2, 3...
    const computeNextRegNo = () => {
      const nums = (students || [])
        .map(s => s && s.student_reg_no ? parseInt(String(s.student_reg_no), 10) : NaN)
        .filter(n => !isNaN(n) && n > 0);
      return nums.length > 0 ? String(Math.max(...nums) + 1) : String((students?.length || 0) + 1);
    };

    const finalRegNo = (data.student_reg_no && data.student_reg_no.trim() !== '')
      ? data.student_reg_no.trim()
      : computeNextRegNo();

    const newStudent: Student = {
      ...data,
      id: newStudentId,
      student_reg_no: finalRegNo,
      total_fee: totalFee,
      paid_amount: paidAmount,
      payment_status: feeStatus,
      created_at: now,
      updated_at: now
    };
    setStudents(prev => [newStudent, ...prev]);
    cloudUpsert('students', newStudent, ['college', 'course', 'group']);

    // Automatically create payment record for fee management
    const newPayment: StudentPayment = {
      id: `pay-${Date.now()}`,
      student_id: newStudentId,
      group_id: data.group_id,
      total_fee: totalFee,
      paid_amount: paidAmount,
      balance_amount: balance,
      status: feeStatus,
      last_payment_date: paidAmount > 0 ? now.split('T')[0] : undefined,
      payment_mode: 'upi',
      receipt_no: paidAmount > 0 ? `REC-${Date.now().toString().slice(-6)}` : undefined,
      remarks: 'Initial academic enrollment fee ledger',
      created_at: now,
      updated_at: now
    };
    setPayments(prev => [newPayment, ...prev]);
    cloudUpsert('student_payments', newPayment, ['student', 'group']);

    logActivity('STUDENT_ENROLLED', 'student', `Enrolled student ${data.full_name} (ID: ${finalRegNo})`, newStudentId);
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    const existing = students.find(s => s.id === id);
    const oldGroupId = existing?.group_id;
    const newGroupId = updates.group_id;

    setStudents(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, ...updates, updated_at: new Date().toISOString() };
      cloudUpsert('students', updated, ['college', 'course', 'group']);
      return updated;
    }));

    // If group membership changed
    if (newGroupId !== undefined && newGroupId !== oldGroupId) {
      setGroups(prev => prev.map(g => {
        let memberIds = g.member_ids || [];
        // Remove from old group
        if (oldGroupId && g.id === oldGroupId) {
          memberIds = memberIds.filter(mid => mid !== id);
          const updatedG = {
            ...g,
            member_ids: memberIds,
            group_leader_id: g.group_leader_id === id ? memberIds[0] || '' : g.group_leader_id,
            updated_at: new Date().toISOString()
          };
          cloudUpsert('groups', updatedG, ['college', 'course', 'mentor', 'leader', 'members', 'project']);
          return updatedG;
        }
        // Add to new group
        if (newGroupId && g.id === newGroupId) {
          if (!memberIds.includes(id)) {
            memberIds = [...memberIds, id];
          }
          const updatedG = { ...g, member_ids: memberIds, updated_at: new Date().toISOString() };
          cloudUpsert('groups', updatedG, ['college', 'course', 'mentor', 'leader', 'members', 'project']);
          return updatedG;
        }
        return g;
      }));

      // Check if old group now has 0 students -> auto delete project
      if (oldGroupId) {
        const remainingInOld = students.filter(s => s.id !== id && s.group_id === oldGroupId).length;
        if (remainingInOld === 0) {
          const orphanProjs = projects.filter(p => p.group_id === oldGroupId);
          const orphanIds = new Set(orphanProjs.map(p => p.id));
          if (orphanIds.size > 0) {
            setProjects(prev => prev.filter(p => !orphanIds.has(p.id)));
            orphanIds.forEach(pId => cloudDelete('projects', pId));
            setMilestones(prev => prev.filter(m => !orphanIds.has(m.project_id)));
            setTasks(prev => prev.filter(t => !orphanIds.has(t.project_id)));
            setEvaluations(prev => prev.filter(e => !orphanIds.has(e.project_id)));
            logActivity('PROJECT_AUTO_DELETED', 'project', `Auto-deleted project for group ${oldGroupId} because no students remain assigned`, oldGroupId);
          }
        }
      }
    }

    logActivity('STUDENT_UPDATED', 'student', `Updated student profile information`, id);
  };

  const deleteStudent = (id: string) => {
    const target = students.find(s => s.id === id);
    setStudents(prev => prev.filter(s => s.id !== id));
    setPayments(prev => prev.filter(p => p.student_id !== id));
    cloudDelete('students', id);
    cloudDelete('student_payments', id);

    // Remove student from any groups
    setGroups(prev => prev.map(g => {
      const isMember = (g.member_ids || []).includes(id);
      if (!isMember && g.group_leader_id !== id) return g;
      const newMemberIds = (g.member_ids || []).filter(mid => mid !== id);
      const updatedG = {
        ...g,
        member_ids: newMemberIds,
        group_leader_id: g.group_leader_id === id ? newMemberIds[0] || '' : g.group_leader_id,
        updated_at: new Date().toISOString()
      };
      cloudUpsert('groups', updatedG, ['college', 'course', 'mentor', 'leader', 'members', 'project']);
      return updatedG;
    }));

    logActivity('STUDENT_DELETED', 'student', `Removed student ${target?.full_name || id}`, id);
  };

  // Group Actions (Students-first workflow)
  const createGroup = (data: Omit<Group, 'id' | 'created_at' | 'updated_at'>) => {
    lastLocalEditTime.current = Date.now();
    const now = new Date().toISOString();
    const newGroupId = `g-${Date.now()}`;

    // Disallow students who already exist in any other group
    const existingGroupStudentIds = new Set<string>();
    groups.forEach(g => {
      (g.member_ids || []).forEach(mid => existingGroupStudentIds.add(mid));
    });
    students.forEach(s => {
      if (s.group_id) existingGroupStudentIds.add(s.id);
    });

    // Only allow students that do not already belong to any other group
    const validMemberIds = (data.member_ids || []).filter(sid => !existingGroupStudentIds.has(sid));

    const newGroup: Group = {
      ...data,
      id: newGroupId,
      member_ids: validMemberIds,
      group_leader_id: validMemberIds.includes(data.group_leader_id || '') ? data.group_leader_id : validMemberIds[0] || '',
      created_at: now,
      updated_at: now
    };
    setGroups(prev => [newGroup, ...prev]);
    cloudUpsert('groups', newGroup, ['college', 'course', 'mentor', 'leader', 'members', 'project']);

    // Automatically link selected students to this group
    if (validMemberIds.length > 0) {
      setStudents(prev => prev.map(s => {
        if (validMemberIds.includes(s.id)) {
          const updatedStudent = {
            ...s,
            group_id: newGroupId,
            assigned_role: s.id === newGroup.group_leader_id ? ('Team Leader' as const) : s.assigned_role,
            updated_at: now
          };
          cloudUpsert('students', updatedStudent, ['college', 'course', 'group']);
          return updatedStudent;
        }
        return s;
      }));

      // Update payment records with this group_id
      setPayments(prev => prev.map(p => {
        if (validMemberIds.includes(p.student_id)) {
          const updatedPay = { ...p, group_id: newGroupId, updated_at: now };
          cloudUpsert('student_payments', updatedPay, ['student', 'group']);
          return updatedPay;
        }
        return p;
      }));

      // Automatically initialize project for this group ONLY IF students are assigned
      const newProjectId = `p-${Date.now()}`;
      const newProject: Project = {
        id: newProjectId,
        group_id: newGroupId,
        project_code: `PRJ-${data.group_code}`,
        title: data.project_title || `${data.name} Project`,
        topic: 'Full-Stack Software Development',
        description: `Academic capstone project assigned to ${data.name}.`,
        technologies: ['Next.js', 'PostgreSQL', 'Tailwind CSS'],
        category: 'Full-Stack Software System',
        start_date: data.start_date,
        expected_completion_date: data.expected_completion_date,
        status: 'planning',
        manual_progress_override: false,
        progress_percentage: 0,
        created_at: now,
        updated_at: now
      };
      setProjects(prev => [newProject, ...prev]);
      cloudUpsert('projects', newProject, ['group', 'mentor', 'milestones', 'tasks']);

      // Automatically create the 13 standard developmental stages for this project
      const defaultSteps = [
        'Requirement Analysis',
        'Problem Identification',
        'Research and Documentation',
        'System Architecture',
        'UI/UX Design',
        'Database Design',
        'Backend Development',
        'Frontend Development',
        'Integration',
        'Testing',
        'Bug Fixing',
        'Final Documentation',
        'Final Presentation'
      ];
      const initialGroupMilestones: ProjectMilestone[] = defaultSteps.map((stepName, idx) => ({
        id: `ms-${newProjectId}-${idx + 1}`,
        project_id: newProjectId,
        step_order: idx + 1,
        name: stepName,
        description: `Academic milestone phase ${idx + 1} for ${newProject.title}.`,
        assigned_student_id: newGroup.group_leader_id,
        start_date: data.start_date,
        due_date: data.expected_completion_date,
        status: 'pending' as const,
        is_custom: false,
        created_at: now,
        updated_at: now
      }));
      setMilestones(prev => [...prev, ...initialGroupMilestones]);
      cloudInsertMany('project_milestones', initialGroupMilestones, ['assigned_student']);
    }

    logActivity('GROUP_CREATED', 'group', `Formed cohort ${data.name} (${data.group_code}) with ${validMemberIds.length} students`, newGroupId);
  };

  const updateGroup = (id: string, updates: Partial<Group>) => {
    const now = new Date().toISOString();

    // Prevent adding students who already belong to another group
    let sanitizedMemberIds = updates.member_ids;
    if (sanitizedMemberIds !== undefined) {
      const otherGroupStudentIds = new Set<string>();
      groups.forEach(g => {
        if (g.id !== id) {
          (g.member_ids || []).forEach(mid => otherGroupStudentIds.add(mid));
        }
      });
      students.forEach(s => {
        if (s.group_id && s.group_id !== id) {
          otherGroupStudentIds.add(s.id);
        }
      });
      sanitizedMemberIds = sanitizedMemberIds.filter(sid => !otherGroupStudentIds.has(sid));
    }

    const finalUpdates: Partial<Group> = {
      ...updates,
      ...(sanitizedMemberIds !== undefined ? { member_ids: sanitizedMemberIds } : {})
    };

    setGroups(prev => prev.map(g => {
      if (g.id !== id) return g;
      const updated = { ...g, ...finalUpdates, updated_at: now };
      cloudUpsert('groups', updated, ['college', 'course', 'mentor', 'leader', 'members', 'project']);
      return updated;
    }));

    if (sanitizedMemberIds !== undefined) {
      // Sync student group assignments: unassign removed students, assign newly included
      setStudents(prev => prev.map(s => {
        if (sanitizedMemberIds!.includes(s.id)) {
          const updated = { ...s, group_id: id, updated_at: now };
          cloudUpsert('students', updated, ['college', 'course', 'group']);
          return updated;
        } else if (s.group_id === id) {
          const updated = { ...s, group_id: undefined, assigned_role: s.assigned_role === 'Team Leader' ? ('Member' as const) : s.assigned_role, updated_at: now };
          cloudUpsert('students', updated, ['college', 'course', 'group']);
          return updated;
        }
        return s;
      }));

      // AUTO DELETE PROJECT if no students remain in the group
      if (sanitizedMemberIds.length === 0) {
        const orphanProjects = projects.filter(p => p.group_id === id);
        const orphanIds = new Set(orphanProjects.map(p => p.id));
        if (orphanIds.size > 0) {
          setProjects(prev => prev.filter(p => !orphanIds.has(p.id)));
          orphanIds.forEach(pId => cloudDelete('projects', pId));
          setMilestones(prev => prev.filter(m => !orphanIds.has(m.project_id)));
          setTasks(prev => prev.filter(t => !orphanIds.has(t.project_id)));
          setEvaluations(prev => prev.filter(e => !orphanIds.has(e.project_id)));
          logActivity('PROJECT_AUTO_DELETED', 'project', `Auto-deleted project for group ${id} because all students were unassigned`, id);
        }
      }
    }

    logActivity('GROUP_UPDATED', 'group', `Updated details for group`, id);
  };

  const deleteGroup = (id: string) => {
    const target = groups.find(g => g.id === id);
    setGroups(prev => prev.filter(g => g.id !== id));
    cloudDelete('groups', id);

    // Auto-delete the project for this group
    const relatedProjects = projects.filter(p => p.group_id === id);
    const relatedProjectIds = new Set(relatedProjects.map(p => p.id));
    if (relatedProjectIds.size > 0) {
      setProjects(prev => prev.filter(p => !relatedProjectIds.has(p.id)));
      relatedProjectIds.forEach(pId => cloudDelete('projects', pId));
      setMilestones(prev => prev.filter(m => !relatedProjectIds.has(m.project_id)));
      setTasks(prev => prev.filter(t => !relatedProjectIds.has(t.project_id)));
      setEvaluations(prev => prev.filter(e => !relatedProjectIds.has(e.project_id)));
    }

    // Unassign students from this deleted group
    setStudents(prev => prev.map(s => {
      if (s.group_id === id) {
        const updated = { ...s, group_id: undefined, assigned_role: s.assigned_role === 'Team Leader' ? ('Member' as const) : s.assigned_role, updated_at: new Date().toISOString() };
        cloudUpsert('students', updated, ['college', 'course', 'group']);
        return updated;
      }
      return s;
    }));

    logActivity('GROUP_DELETED', 'group', `Disbanded project group ${target?.name || id} and auto-deleted associated project`, id);
  };

  // Payment Actions
  const recordPayment = (data: {
    student_id: string;
    group_id?: string;
    total_fee: number;
    amount: number;
    payment_mode: PaymentMode;
    receipt_no?: string;
    remarks?: string;
  }) => {
    const now = new Date().toISOString();
    const receiptNo = data.receipt_no || `REC-${Date.now().toString().slice(-6)}`;

    let paymentToSync: StudentPayment | null = null;
    setPayments(prev => {
      const existing = prev.find(p => p.student_id === data.student_id);
      if (existing) {
        const newPaid = existing.paid_amount + data.amount;
        const newBalance = Math.max(0, existing.total_fee - newPaid);
        const newStatus: PaymentStatus = newBalance === 0 ? 'paid' : 'partial';

        const transaction = {
          id: `tx-${Date.now()}`,
          payment_id: existing.id,
          amount: data.amount,
          payment_mode: data.payment_mode,
          date: now.split('T')[0],
          receipt_no: receiptNo,
          notes: data.remarks,
          created_at: now
        };

        const updated = {
          ...existing,
          paid_amount: newPaid,
          balance_amount: newBalance,
          status: newStatus,
          last_payment_date: now.split('T')[0],
          payment_mode: data.payment_mode,
          receipt_no: receiptNo,
          remarks: data.remarks || existing.remarks,
          transactions: [...(existing.transactions || []), transaction],
          updated_at: now
        };
        paymentToSync = updated;
        return prev.map(p => p.id === existing.id ? updated : p);
      } else {
        const balance = Math.max(0, data.total_fee - data.amount);
        const status: PaymentStatus = balance === 0 ? 'paid' : data.amount > 0 ? 'partial' : 'unpaid';
        const newRecord: StudentPayment = {
          id: `pay-${Date.now()}`,
          student_id: data.student_id,
          group_id: data.group_id,
          total_fee: data.total_fee,
          paid_amount: data.amount,
          balance_amount: balance,
          status,
          last_payment_date: now.split('T')[0],
          payment_mode: data.payment_mode,
          receipt_no: receiptNo,
          remarks: data.remarks,
          created_at: now,
          updated_at: now
        };
        paymentToSync = newRecord;
        return [newRecord, ...prev];
      }
    });

    if (paymentToSync) {
      cloudUpsert('student_payments', paymentToSync, ['student', 'group']);
    }

    setStudents(prev => prev.map(s => {
      if (s.id === data.student_id) {
        const currentPaid = s.paid_amount || 0;
        const updatedPaid = currentPaid + data.amount;
        const fee = s.total_fee || data.total_fee;
        const status: PaymentStatus = (fee - updatedPaid <= 0) ? 'paid' : 'partial';
        const updated = { ...s, paid_amount: updatedPaid, payment_status: status, updated_at: now };
        cloudUpsert('students', updated, ['college', 'course', 'group']);
        return updated;
      }
      return s;
    }));

    logActivity('PAYMENT_RECORDED', 'payment', `Recorded payment of ₹${data.amount} (Receipt: ${receiptNo})`, data.student_id);
  };

  const updatePayment = (id: string, updates: Partial<StudentPayment>) => {
    setPayments(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, ...updates, updated_at: new Date().toISOString() };
      cloudUpsert('student_payments', updated, ['student', 'group']);
      return updated;
    }));
    logActivity('PAYMENT_UPDATED', 'payment', `Updated fee ledger record`, id);
  };

  // Staff & Admin Actions
  const addStaffMember = (data: Omit<StaffMember, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newStaff: StaffMember = {
      ...data,
      id: `staff-${Date.now()}`,
      created_at: now,
      updated_at: now
    };
    setStaffMembers(prev => [newStaff, ...prev]);
    cloudUpsert('profiles', {
      id: newStaff.id,
      email: newStaff.email,
      full_name: newStaff.full_name,
      role: newStaff.role,
      phone: newStaff.phone,
      avatar_url: newStaff.avatar_url,
      is_active: newStaff.is_active,
      created_at: now,
      updated_at: now
    });
    logActivity('STAFF_ADDED', 'staff', `Added ${data.role.toUpperCase()} staff member ${data.full_name}`, newStaff.id);
  };

  const updateStaffMember = (id: string, updates: Partial<StaffMember>) => {
    setStaffMembers(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, ...updates, updated_at: new Date().toISOString() };
      cloudUpsert('profiles', updated);
      return updated;
    }));
    logActivity('STAFF_UPDATED', 'staff', `Updated staff permissions/profile`, id);
  };

  const deleteStaffMember = (id: string) => {
    setStaffMembers(prev => prev.filter(s => s.id !== id));
    cloudDelete('profiles', id);
    logActivity('STAFF_REMOVED', 'staff', `Removed staff member`, id);
  };

  // Project Actions
  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, ...updates, updated_at: new Date().toISOString() };
      if (!updated.manual_progress_override) {
        const pMilestones = milestones.filter(m => m.project_id === id);
        const pTasks = tasks.filter(t => t.project_id === id);
        updated.progress_percentage = calculateComputedProgress(pMilestones, pTasks);
      }
      cloudUpsert('projects', updated, ['group', 'mentor', 'milestones', 'tasks']);
      return updated;
    }));
    logActivity('PROJECT_UPDATED', 'project', `Modified project details and status`, id);
  };

  const deleteProject = (id: string) => {
    const target = projects.find(p => p.id === id);
    setProjects(prev => prev.filter(p => p.id !== id));
    cloudDelete('projects', id);
    setMilestones(prev => prev.filter(m => m.project_id !== id));
    setTasks(prev => prev.filter(t => t.project_id !== id));
    setEvaluations(prev => prev.filter(e => e.project_id !== id));
    logActivity('PROJECT_DELETED', 'project', `Deleted project portfolio ${target?.title || id}`, id);
  };

  // Milestone Actions
  const addMilestone = (data: Omit<ProjectMilestone, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newMilestone: ProjectMilestone = {
      ...data,
      id: `ms-${Date.now()}`,
      created_at: now,
      updated_at: now
    };
    setMilestones(prev => [...prev, newMilestone]);
    cloudUpsert('project_milestones', newMilestone, ['assigned_student']);
    logActivity('MILESTONE_ADDED', 'milestone', `Added milestone: ${data.name}`, newMilestone.id);
  };

  const updateMilestone = (id: string, updates: Partial<ProjectMilestone>) => {
    setMilestones(prev => prev.map(m => {
      if (m.id !== id) return m;
      const updated = { ...m, ...updates, updated_at: new Date().toISOString() };
      cloudUpsert('project_milestones', updated, ['assigned_student']);
      return updated;
    }));
    logActivity('MILESTONE_UPDATED', 'milestone', `Updated milestone status`, id);
  };

  const deleteMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
    cloudDelete('project_milestones', id);
  };

  // Task Actions
  const createTask = (data: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...data,
      id: `t-${Date.now()}`,
      created_at: now,
      updated_at: now
    };
    setTasks(prev => [newTask, ...prev]);
    cloudUpsert('tasks', newTask, ['assigned_student', 'project']);
    logActivity('TASK_CREATED', 'task', `Assigned task: ${data.title}`, newTask.id);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates, updated_at: new Date().toISOString() };
      cloudUpsert('tasks', updated, ['assigned_student', 'project']);
      return updated;
    }));
    logActivity('TASK_UPDATED', 'task', `Updated task state`, id);
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    cloudDelete('tasks', id);
    logActivity('TASK_DELETED', 'task', `Removed task item`, id);
  };

  // Weekly Report Actions (Immutable - Never Overwrites Old Weeks)
  const submitWeeklyReport = (data: Omit<WeeklyReport, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newReport: WeeklyReport = {
      ...data,
      id: `w-${Date.now()}`,
      created_at: now,
      updated_at: now
    };
    setWeeklyReports(prev => [newReport, ...prev]);
    cloudUpsert('weekly_reports', newReport, ['group', 'project', 'submitter', 'mentor']);
    logActivity('WEEKLY_REPORT_SUBMITTED', 'weekly_report', `Submitted Week ${data.week_number} progress report`, newReport.id);

    // Notify Admins & Mentors
    const newNotification: AppNotification = {
      id: `notif-${Date.now()}`,
      user_id: '00000000-0000-0000-0000-000000000001',
      title: `Week ${data.week_number} Report Submitted`,
      message: `A new weekly progress submission is awaiting review.`,
      link: '/weekly-progress',
      type: 'weekly',
      is_read: false,
      created_at: now
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const reviewWeeklyReport = (id: string, feedback: string, status: WeeklyReport['review_status']) => {
    const now = new Date().toISOString();
    setWeeklyReports(prev => prev.map(w => {
      if (w.id !== id) return w;
      const updated = {
        ...w,
        mentor_feedback: feedback,
        review_status: status,
        reviewed_at: now,
        mentor_id: currentUser.id,
        updated_at: now
      };
      cloudUpsert('weekly_reports', updated, ['group', 'project', 'submitter', 'mentor']);
      return updated;
    }));
    logActivity('WEEKLY_REPORT_REVIEWED', 'weekly_report', `Reviewed weekly report: Marked as ${status}`, id);
  };

  // Attendance Actions
  const markAttendanceBatch = (records: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>[]) => {
    const now = new Date().toISOString();
    const newRecords: AttendanceRecord[] = records.map(r => ({
      ...r,
      id: `att-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      created_at: now,
      updated_at: now
    }));

    // Prevent duplicate entries for same student, date, and session_type
    setAttendance(prev => {
      const filtered = prev.filter(p => !records.some(r => r.student_id === p.student_id && r.date === p.date && r.session_type === p.session_type));
      return [...newRecords, ...filtered];
    });
    cloudInsertMany('attendance', newRecords, ['student']);

    logActivity('ATTENDANCE_MARKED', 'attendance', `Marked attendance for ${records.length} students on ${records[0]?.date || 'today'}`);
  };

  const updateAttendance = (id: string, status: AttendanceRecord['status'], remarks?: string) => {
    setAttendance(prev => prev.map(a => {
      if (a.id !== id) return a;
      const updated = { ...a, status, remarks: remarks || a.remarks, updated_at: new Date().toISOString() };
      cloudUpsert('attendance', updated, ['student']);
      return updated;
    }));
    logActivity('ATTENDANCE_EDITED', 'attendance', `Modified attendance record`, id);
  };

  // Document Actions
  const uploadDocument = (data: Omit<ProjectDocument, 'id' | 'created_at'>) => {
    const newDoc: ProjectDocument = {
      ...data,
      id: `doc-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setDocuments(prev => [newDoc, ...prev]);
    logActivity('DOCUMENT_UPLOADED', 'document', `Uploaded document: ${data.title}`, newDoc.id);
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    logActivity('DOCUMENT_DELETED', 'document', `Deleted document record`, id);
  };

  // Evaluation Actions
  const saveEvaluation = (data: Omit<Evaluation, 'id' | 'created_at'>) => {
    const newEval: Evaluation = {
      ...data,
      id: `eval-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setEvaluations(prev => [newEval, ...prev]);
    logActivity('EVALUATION_SAVED', 'evaluation', `Submitted milestone evaluation score`, newEval.id);
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  // Password Management
  const changePassword = (
    oldPass: string,
    newPass: string,
    usernameOrRole?: string
  ): { success: boolean; message: string } => {
    const target = (usernameOrRole || currentUser.role || 'admin').trim().toLowerCase();
    const currentStoredPass = passwords[target] || (target === 'staff' ? passwords['staff'] : passwords['admin']) || '123';

    if (oldPass !== currentStoredPass) {
      return { success: false, message: 'Current password does not match!' };
    }

    if (!newPass || newPass.trim().length < 3) {
      return { success: false, message: 'New password must be at least 3 characters long.' };
    }

    const updated = {
      ...passwords,
      [target]: newPass.trim()
    };
    if (target === 'admin' || target === 'admin@cognilearn.org') {
      updated['admin'] = newPass.trim();
    }
    if (target === 'staff' || target === 'staff@cognilearn.org') {
      updated['staff'] = newPass.trim();
    }

    setPasswords(updated);
    saveToStorage('cognilearn_passwords', updated);

    logActivity('SECURITY_UPDATE', 'auth', `Updated password for account: ${target}`);

    return { success: true, message: 'Password updated successfully!' };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        logout,
        switchRole,
        colleges,
        courses,
        mentors,
        students: enrichedStudents,
        groups: enrichedGroups,
        projects: enrichedProjects,
        milestones,
        tasks: enrichedTasks,
        weeklyReports: enrichedWeeklyReports,
        attendance: enrichedAttendance,
        evaluations,
        documents,
        notifications,
        activityLogs,
        payments: enrichedPayments,
        staffMembers,
        stats,
        addCollege,
        deleteCollege,
        addCourse,
        deleteCourse,
        addStudent,
        updateStudent,
        deleteStudent,
        createGroup,
        updateGroup,
        deleteGroup,
        recordPayment,
        updatePayment,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        updateProject,
        deleteProject,
        addMilestone,
        updateMilestone,
        deleteMilestone,
        createTask,
        updateTask,
        deleteTask,
        submitWeeklyReport,
        reviewWeeklyReport,
        markAttendanceBatch,
        updateAttendance,
        uploadDocument,
        deleteDocument,
        saveEvaluation,
        markNotificationRead,
        markAllNotificationsRead,
        changePassword
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
