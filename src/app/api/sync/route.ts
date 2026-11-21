import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseServerClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_STORAGE_URL ||
    process.env.STORAGE_URL ||
    process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL ||
    process.env.STORAGE_SUPABASE_URL ||
    '';

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.STORAGE_SERVICE_ROLE_KEY ||
    process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.STORAGE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.STORAGE_ANON_KEY ||
    process.env.STORAGE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    '';

  if (!url || !key || url.includes('your-project') || key.includes('...')) {
    return null;
  }
  return createClient(url, key);
}

export async function GET() {
  const client = getSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ configured: false, message: 'Supabase credentials not configured' }, { status: 200 });
  }

  try {
    const [
      colleges,
      courses,
      students,
      groups,
      projects,
      milestones,
      tasks,
      weekly,
      attendance,
      payments,
      profiles
    ] = await Promise.all([
      client.from('colleges').select('*'),
      client.from('courses').select('*'),
      client.from('students').select('*'),
      client.from('groups').select('*'),
      client.from('projects').select('*'),
      client.from('project_milestones').select('*'),
      client.from('tasks').select('*'),
      client.from('weekly_reports').select('*'),
      client.from('attendance').select('*'),
      client.from('student_payments').select('*'),
      client.from('profiles').select('*')
    ]);

    return NextResponse.json({
      configured: true,
      data: {
        colleges: colleges.data || [],
        courses: courses.data || [],
        students: students.data || [],
        groups: groups.data || [],
        projects: projects.data || [],
        milestones: milestones.data || [],
        tasks: tasks.data || [],
        weeklyReports: weekly.data || [],
        attendance: attendance.data || [],
        payments: payments.data || [],
        staffMembers: profiles.data || []
      }
    });
  } catch (err: any) {
    return NextResponse.json({ configured: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const client = getSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ success: false, message: 'Supabase not configured' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { action, table, record, records, id } = body;

    if (action === 'upsert' && table && record) {
      const { data, error } = await client.from(table).upsert(record).select();
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'upsert_many' && table && records) {
      const { data, error } = await client.from(table).upsert(records).select();
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (action === 'delete' && table && id) {
      const { error } = await client.from(table).delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
