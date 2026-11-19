# Cognilearn Student Project Tracking & Management System

> **A real-world, production-ready enterprise office management web application built for Cognilearn to track, manage, and evaluate student academic projects from MES College.**

Designed and engineered with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase PostgreSQL**, **Recharts**, **SheetJS (xlsx)**, and **jsPDF**, fully optimized for zero-configuration deployment to **Vercel**.

---

## 🚀 Key Modules & Architecture

1. **Role-Based Access Control (RBAC)**
   - **ADMIN**: Dr. Rajesh Kumar (Full control across students, groups, projects, attendance, evaluations, reports, settings).
   - **MENTOR**: Er. Arun Menon & Prof. Priya Nair (Review weekly sprint submissions, approve 13 milestone phases, record official rubric evaluations).
   - **STUDENT**: Anjali Thomas & cohort peers (Group leader view, submit weekly progress, view assigned tasks, download dossiers, monitor attendance percentage).
   - Instant role perspective switcher in the top navigation bar for testing and evaluation.

2. **Admin & Performance Dashboard**
   - Live dynamic KPIs: Total Students, Total Groups, Active Projects, Attendance Percentage, Pending Tasks, Overdue Tasks, Weekly Updates Pending Review.
   - Interactive Group-wise Progress Comparison Bar Chart (computed automatically from milestones & tasks).
   - Attendance Distribution Pie Chart (Present, Late, Absent, Leave).
   - Live system audit trail and upcoming deadline alerts.

3. **Student Directory & Profile Management**
   - Register numbers, full contact info, college, course, department, class, group assignment, assigned role.
   - Filter by College, Course, Group, and Status.
   - Full CRUD operations with modal forms and validation.
   - 1-click **Excel Export** via SheetJS (`.xlsx`).
   - 1-click **Official Student Dossier PDF** with Cognilearn institutional header and signature blocks.

4. **Group Management & Cohorts**
   - Group codes, academic batch (2024-2025), appointed student leader, assigned faculty mentor, start and expected completion dates.
   - Detailed Group Dossier modal displaying member roster, project title, and progress.
   - Export group directories to Excel and PDF.

5. **Project Management & Architecture**
   - Project codes, title, problem statement, objectives, proposed solution, technology stack tags, GitHub monorepo links, and live Vercel demo URLs.
   - Objective progress percentage calculation (with optional manual override).
   - Export Final Project Dissertation Summary PDF.

6. **13-Step Milestone Development Lifecycle**
   - Tracks standard academic steps: *1. Requirement Analysis, 2. Problem Identification, 3. Research & Documentation, 4. System Architecture, 5. UI/UX Design, 6. Database Design, 7. Backend Development, 8. Frontend Development, 9. Integration, 10. Testing, 11. Bug Fixing, 12. Final Documentation, 13. Final Presentation*.
   - Assignees, start/due dates, completion dates, and mentor sign-off approvals.
   - Support for custom milestone steps.

7. **Sprint Tasks & Kanban Board**
   - Kanban Board columns (*To Do, In Progress, Under Review, Completed, Blocked, Overdue*).
   - Filterable List view.
   - Automated overdue detection based on Asia/Kolkata deadlines.
   - Priority levels: *Low, Medium, High, Critical*.

8. **Weekly Progress Tracking (Core Application Engine)**
   - **Strict Immutability**: Historical weekly progress entries are never overwritten. Every week is saved as a permanent audit record.
   - Detailed records: *Activities Completed, Tasks Completed, Tasks In Progress, Tasks Pending, Problems Faced, Solutions Implemented, Technologies Used, Next Week Plan, Student Remarks*.
   - Dedicated Mentor Review modal with review statuses (*Approved, Revision Required, Under Review*) and guidance feedback.
   - Export weekly chronological history to Excel and PDF.

9. **Attendance Management & Compliance**
   - Daily lab attendance and project meeting roll calls.
   - Bulk attendance marking modal with quick "Mark All Present" action.
   - Statuses: *Present, Late, Absent, Leave* with individual audit remarks.
   - Automated **Low Attendance Alerts (< 75%)** in compliance with university exam regulations.
   - Duplicate prevention per student, date, and session type.

10. **Mentor Evaluations & Scoring Rubrics**
    - Scores (1 to 10) across 6 core criteria: *Technical Skills, Teamwork, Communication, Problem Solving, Project Management, Overall Performance*.
    - Mentor remarks and semester evaluation matrix.

11. **Document Repository (Supabase Storage)**
    - Categorized hierarchy: *College → Group → Project → Category* (Proposals, Requirements, Diagrams, Screenshots, Weekly Reports, Code Bundles, Certificates).

12. **Report Center & Official PDF Generator**
    - Cognilearn branded PDF and Excel reports for Student Lists, Group Dossiers, Monthly Attendance Sheets, and Final Project Summaries.

13. **Security Audit Trail & In-App Notifications**
    - Timestamped activity logs of every database operation with operator identity.
    - Notification dispatcher for deadlines, submissions, and feedback.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14+ (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS (Navy Blue SaaS Theme) |
| **Database** | Supabase PostgreSQL with Row Level Security (RLS) |
| **Authentication** | Supabase Auth |
| **Storage** | Supabase Storage (50MB private bucket) |
| **Data Visualization** | Recharts |
| **Icons** | Lucide React |
| **Form Validation** | Zod + React Hook Form |
| **Date & Timezone** | `date-fns` (Asia/Kolkata, DD-MM-YYYY) |
| **Excel Export** | SheetJS (`xlsx`) |
| **PDF Generation** | `jspdf` & `jspdf-autotable` |
| **Deployment** | Vercel (100% Serverless & Edge ready) |

---

## 🗄️ Supabase Database Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Run the schema migration script:
   ```bash
   supabase/migrations/20240101000000_init_schema.sql
   ```
4. Run the seed data script:
   ```bash
   supabase/seed.sql
   ```
5. In **Storage**, create a bucket named `documents` (Private, 50MB limit).

---

## ⚙️ Local Development Setup

1. Clone repository & install dependencies:
   ```bash
   git clone <repo-url>
   cd cognilearn-management-system
   npm install
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```
   *(Configure your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` if running against live Supabase, or use the pre-bundled live fallback immediately)*.
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Vercel Deployment Instructions

1. Push your repository to **GitHub**.
2. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Set the environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_TIMEZONE` = `Asia/Kolkata`
5. Click **Deploy**. Vercel will build and deploy the Next.js serverless application.

---

## 👥 Default Testing Accounts

| Role | Username / Email | Password | Access |
|---|---|---|---|
| **Admin** | `admin` (or `admin@cognilearn.org`) | `123` | Full Administrator Access |
