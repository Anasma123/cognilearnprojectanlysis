-- ==============================================================================
-- COGNILEARN STUDENT PROJECT TRACKING & MANAGEMENT SYSTEM
-- PostgreSQL Database Schema with Row Level Security (RLS) & Triggers
-- Organization: Cognilearn | Partner: MES College
-- Timezone: Asia/Kolkata
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'mentor', 'student')),
    phone TEXT,
    avatar_url TEXT,
    college_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- 2. COLLEGES
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT,
    contact_person TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- 3. COURSES & DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    department TEXT NOT NULL,
    duration_years INTEGER DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- 4. ACADEMIC BATCHES
CREATE TABLE IF NOT EXISTS public.academic_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    start_year INTEGER NOT NULL,
    end_year INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- 5. MENTORS
CREATE TABLE IF NOT EXISTS public.mentors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    specialization TEXT,
    designation TEXT DEFAULT 'Project Mentor',
    department TEXT DEFAULT 'Computer Science & Engineering',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- 6. GROUPS
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    college_id UUID REFERENCES public.colleges(id) ON DELETE RESTRICT,
    course_id UUID REFERENCES public.courses(id) ON DELETE RESTRICT,
    class_year TEXT NOT NULL,
    batch_id UUID REFERENCES public.academic_batches(id) ON DELETE SET NULL,
    group_leader_id UUID, -- References students(id) later
    mentor_id UUID REFERENCES public.mentors(id) ON DELETE SET NULL,
    project_title TEXT,
    start_date DATE DEFAULT CURRENT_DATE,
    expected_completion_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- 7. STUDENTS
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    student_reg_no TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    college_id UUID REFERENCES public.colleges(id) ON DELETE RESTRICT,
    course_id UUID REFERENCES public.courses(id) ON DELETE RESTRICT,
    department TEXT NOT NULL,
    class_year TEXT NOT NULL,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    assigned_role TEXT DEFAULT 'Team Member',
    joining_date DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'on_leave')),
    notes TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- Foreign key for group_leader_id
ALTER TABLE public.groups
    ADD CONSTRAINT fk_group_leader
    FOREIGN KEY (group_leader_id) REFERENCES public.students(id) ON DELETE SET NULL;

-- 8. GROUP MEMBERS
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    role_in_group TEXT DEFAULT 'Team Member',
    joined_at DATE DEFAULT CURRENT_DATE,
    UNIQUE(group_id, student_id)
);

-- 9. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID UNIQUE NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    mentor_id UUID REFERENCES public.mentors(id) ON DELETE SET NULL,
    project_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    description TEXT,
    problem_statement TEXT,
    objectives TEXT,
    proposed_solution TEXT,
    technologies TEXT[] DEFAULT '{}',
    category TEXT DEFAULT 'Full-Stack Web Application',
    start_date DATE DEFAULT CURRENT_DATE,
    expected_completion_date DATE,
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('not_started', 'planning', 'in_progress', 'under_review', 'on_hold', 'completed')),
    manual_progress_override BOOLEAN DEFAULT false,
    progress_percentage NUMERIC(5,2) DEFAULT 0.0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    repository_url TEXT,
    live_demo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- 10. PROJECT MILESTONES (13 Standard Steps & Customizable)
CREATE TABLE IF NOT EXISTS public.project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    assigned_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    start_date DATE,
    due_date DATE,
    completion_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'under_review', 'completed')),
    remarks TEXT,
    supporting_documents TEXT[] DEFAULT '{}',
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- 11. TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assigned_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    assigned_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'under_review', 'completed', 'blocked', 'overdue')),
    completion_notes TEXT,
    attachments TEXT[] DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- 12. WEEKLY REPORTS (IMMUTABLE HISTORICAL PROGRESS)
CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    activities_completed TEXT NOT NULL,
    tasks_completed TEXT NOT NULL,
    tasks_in_progress TEXT,
    tasks_pending TEXT,
    problems_faced TEXT,
    solutions_implemented TEXT,
    technologies_used TEXT,
    next_week_plan TEXT NOT NULL,
    student_remarks TEXT,
    submitted_by UUID REFERENCES public.students(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    mentor_feedback TEXT,
    mentor_id UUID REFERENCES public.mentors(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_status TEXT NOT NULL DEFAULT 'submitted' CHECK (review_status IN ('draft', 'submitted', 'under_review', 'approved', 'revision_required')),
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    UNIQUE(group_id, week_number)
);

-- 13. ATTENDANCE MANAGEMENT
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'leave')),
    session_type TEXT NOT NULL DEFAULT 'daily' CHECK (session_type IN ('daily', 'project_meeting')),
    remarks TEXT,
    marked_by UUID,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    UNIQUE(student_id, date, session_type)
);

-- 14. EVALUATIONS & PERFORMANCE
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE RESTRICT,
    technical_skills INTEGER CHECK (technical_skills BETWEEN 1 AND 10),
    teamwork INTEGER CHECK (teamwork BETWEEN 1 AND 10),
    communication INTEGER CHECK (communication BETWEEN 1 AND 10),
    problem_solving INTEGER CHECK (problem_solving BETWEEN 1 AND 10),
    project_management INTEGER CHECK (project_management BETWEEN 1 AND 10),
    overall_performance INTEGER CHECK (overall_performance BETWEEN 1 AND 10),
    remarks TEXT,
    evaluation_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- 15. DOCUMENTS
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'proposal', 'requirement', 'weekly_report', 'screenshot', 
        'database_diagram', 'code', 'presentation', 'final_doc', 'certificate'
    )),
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    uploaded_by UUID,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- 16. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('task', 'weekly', 'attendance', 'milestone', 'feedback', 'system')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- 17. ACTIVITY AUDIT LOG
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- 18. STUDENT PAYMENTS & FEE LEDGER (CASCADE ON DELETE STUDENT)
CREATE TABLE IF NOT EXISTS public.student_payments (
    id TEXT PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    total_fee NUMERIC(10,2) DEFAULT 5000.00,
    paid_amount NUMERIC(10,2) DEFAULT 0.00,
    balance_amount NUMERIC(10,2) DEFAULT 5000.00,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'partial', 'unpaid', 'overdue')),
    last_payment_date DATE,
    payment_mode TEXT DEFAULT 'upi' CHECK (payment_mode IN ('upi', 'cash', 'bank_transfer', 'cheque')),
    receipt_no TEXT,
    remarks TEXT,
    transactions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_students_group ON public.students(group_id);
CREATE INDEX IF NOT EXISTS idx_students_college ON public.students(college_id);
CREATE INDEX IF NOT EXISTS idx_groups_mentor ON public.groups(mentor_id);
CREATE INDEX IF NOT EXISTS idx_projects_group ON public.projects(group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_student ON public.tasks(assigned_student_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_group ON public.weekly_reports(group_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week ON public.weekly_reports(group_id, week_number);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_group_date ON public.attendance(group_id, date);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON public.project_milestones(project_id, step_order);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_mentor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'mentor'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public read for colleges, courses, batches for authenticated users
CREATE POLICY "Allow authenticated read for colleges" ON public.colleges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read for courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read for batches" ON public.academic_batches FOR SELECT TO authenticated USING (true);

-- Admins full access policy for all tables
CREATE POLICY "Admin full access colleges" ON public.colleges FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access courses" ON public.courses FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access batches" ON public.academic_batches FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access mentors" ON public.mentors FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access groups" ON public.groups FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access students" ON public.students FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access group_members" ON public.group_members FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access projects" ON public.projects FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access milestones" ON public.project_milestones FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access tasks" ON public.tasks FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access weekly_reports" ON public.weekly_reports FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access attendance" ON public.attendance FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access evaluations" ON public.evaluations FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access documents" ON public.documents FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin full access activity_logs" ON public.activity_logs FOR ALL TO authenticated USING (public.is_admin());

-- General authenticated access policies
CREATE POLICY "Profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Mentors readable by authenticated" ON public.mentors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Groups readable by authenticated" ON public.groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students readable by authenticated" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Projects readable by authenticated" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Milestones readable by authenticated" ON public.project_milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Tasks readable by authenticated" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Weekly reports readable by authenticated" ON public.weekly_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Attendance readable by authenticated" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Evaluations readable by authenticated" ON public.evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Documents readable by authenticated" ON public.documents FOR SELECT TO authenticated USING (true);

-- Student-specific actions
CREATE POLICY "Students can update assigned tasks" ON public.tasks FOR UPDATE TO authenticated 
    USING (assigned_student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()));

CREATE POLICY "Students can insert weekly reports for their group" ON public.weekly_reports FOR INSERT TO authenticated 
    WITH CHECK (group_id IN (SELECT group_id FROM public.students WHERE profile_id = auth.uid()));

-- Mentor-specific actions
CREATE POLICY "Mentors can update weekly reports feedback" ON public.weekly_reports FOR UPDATE TO authenticated 
    USING (mentor_id IN (SELECT id FROM public.mentors WHERE profile_id = auth.uid()));

CREATE POLICY "Mentors can update milestones" ON public.project_milestones FOR UPDATE TO authenticated 
    USING (project_id IN (SELECT id FROM public.projects WHERE mentor_id IN (SELECT id FROM public.mentors WHERE profile_id = auth.uid())));

CREATE POLICY "Mentors can insert evaluations" ON public.evaluations FOR INSERT TO authenticated 
    WITH CHECK (mentor_id IN (SELECT id FROM public.mentors WHERE profile_id = auth.uid()));

-- Notifications user policy
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Triggers for auto-updating timestamps
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW() AT TIME ZONE 'Asia/Kolkata';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();
CREATE TRIGGER set_mentors_updated_at BEFORE UPDATE ON public.mentors FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();
CREATE TRIGGER set_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();
CREATE TRIGGER set_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();
CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();
CREATE TRIGGER set_milestones_updated_at BEFORE UPDATE ON public.project_milestones FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();
CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();
CREATE TRIGGER set_weekly_reports_updated_at BEFORE UPDATE ON public.weekly_reports FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();
CREATE TRIGGER set_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();
