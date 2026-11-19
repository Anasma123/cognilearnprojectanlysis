# Supabase Database & Storage Setup Guide

This guide walks you through setting up the Supabase PostgreSQL database, Row Level Security (RLS), and Storage buckets for the **Cognilearn Student Project Tracking & Management System**.

## 1. Quick Supabase CLI Setup (Local or Cloud)

### Cloud Setup via Supabase Web Dashboard
1. Go to [https://supabase.com](https://supabase.com) and create a new project.
2. Select your closest region (e.g., Singapore `ap-southeast-1` or Mumbai `ap-south-1` for Indian timezone `Asia/Kolkata`).
3. Open the **SQL Editor** in your Supabase project dashboard.
4. Open `supabase/migrations/20240101000000_init_schema.sql` and run the script.
5. Open `supabase/seed.sql` and run the script to populate the initial MES College academic project dataset.

### Local Setup via Supabase CLI
```bash
# Login to Supabase CLI
npx supabase login

# Initialize Supabase project
npx supabase init

# Link to your remote project
npx supabase link --project-ref <your-project-ref>

# Push the migrations
npx supabase db push

# Apply seed data
npx supabase db reset
```

## 2. Storage Buckets Setup
In your Supabase project, navigate to **Storage** and create a new bucket:
- **Bucket Name**: `documents`
- **Public**: No (Private bucket)
- **File size limit**: 50MB
- **Allowed MIME types**: `application/pdf`, `image/*`, `application/zip`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

Add Storage policies in the SQL Editor:
```sql
CREATE POLICY "Allow authenticated read on documents" 
ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'documents');

CREATE POLICY "Allow authenticated upload on documents" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'documents');
```

## 3. Environment Variables
Copy `.env.example` to `.env.local` and configure your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_TIMEZONE=Asia/Kolkata
```

## 4. Default Seed Accounts
For local testing or immediate review:
- **Admin**: `admin@cognilearn.org` (Full application control)
- **Mentor**: `arun.menon@cognilearn.org` (Technical Lead & Mentor)
- **Student**: `anjali.thomas@mescet.ac.in` (Group Leader, MES College CET)
