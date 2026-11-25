import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://ptsitpiqzcxspkbrcxwi.supabase.co';
const FALLBACK_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0c2l0cGlxemN4c3BrYnJjeHdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NTI0MTY1OSwiZXhwIjoyMTEwODE3NjU5fQ.qOxU4HN-eH1PjP2PBTl3jyQVJW9uFkziP8445J_D4PQ';

function getSupabaseServerClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_STORAGE_URL ||
    process.env.STORAGE_URL ||
    process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL ||
    process.env.STORAGE_SUPABASE_URL ||
    FALLBACK_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.STORAGE_SERVICE_ROLE_KEY ||
    process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.STORAGE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    FALLBACK_SERVICE_ROLE_KEY;

  if (!url || !key || url.includes('your-project') || key.includes('...')) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

// Force dynamic rendering and prevent Vercel / browser caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const client: any = getSupabaseServerClient();
  if (!client) {
    return NextResponse.json(
      { configured: false, message: 'Supabase credentials not configured' },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        }
      }
    );
  }

  try {
    const safeSelect = async (table: string, orderCol = 'created_at') => {
      try {
        const { data, error } = await client.from(table).select('*').order(orderCol, { ascending: true });
        if (error) {
          console.warn(`Safe select notice on ${table}:`, error.message);
          return [];
        }
        return data || [];
      } catch (err: any) {
        console.warn(`Safe select exception on ${table}:`, err?.message);
        return [];
      }
    };

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
      profiles,
      mentors
    ] = await Promise.all([
      safeSelect('colleges'),
      safeSelect('courses'),
      safeSelect('students'),
      safeSelect('groups'),
      safeSelect('projects'),
      safeSelect('project_milestones', 'step_order'),
      safeSelect('tasks'),
      safeSelect('weekly_reports'),
      safeSelect('attendance'),
      safeSelect('student_payments'),
      safeSelect('profiles'),
      safeSelect('mentors')
    ]);

    return NextResponse.json(
      {
        configured: true,
        timestamp: new Date().toISOString(),
        data: {
          colleges,
          courses,
          students,
          groups,
          projects,
          milestones,
          tasks,
          weeklyReports: weekly,
          attendance,
          payments,
          staffMembers: profiles,
          mentors
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        }
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { configured: false, error: err.message },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        }
      }
    );
  }
}

export async function POST(req: Request) {
  const client: any = getSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ success: false, message: 'Supabase not configured' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { action, table, record, records, id, student_id } = body;

    // Dedicated Cascade Delete for Students
    if (action === 'delete_student_cascade' && (id || student_id)) {
      const targetStudentId = id || student_id;
      
      await Promise.allSettled([
        client.from('student_payments').delete().eq('student_id', targetStudentId),
        client.from('attendance').delete().eq('student_id', targetStudentId),
        client.from('tasks').delete().eq('assigned_student_id', targetStudentId),
        client.from('evaluations').delete().eq('student_id', targetStudentId),
        client.from('group_members').delete().eq('student_id', targetStudentId),
        client.from('project_milestones').update({ assigned_student_id: null }).eq('assigned_student_id', targetStudentId),
        client.from('weekly_reports').update({ submitted_by: null }).eq('submitted_by', targetStudentId),
        client.from('groups').update({ group_leader_id: null }).eq('group_leader_id', targetStudentId)
      ]);

      const { error } = await client.from('students').delete().eq('id', targetStudentId);
      if (error) {
        console.warn('Cascade student delete warning:', error);
      }
      return NextResponse.json({ success: true, message: 'Student and all associated records deleted' });
    }

    if (action === 'update' && table && record) {
      const targetId = id || record.id || body.id;
      if (!targetId) {
        return NextResponse.json({ success: false, message: 'Target id required for update' }, { status: 400 });
      }
      const { data, error } = await client.from(table).update(record).eq('id', targetId);
      if (error) {
        console.warn(`Sync update error on ${table}:`, error);
        throw error;
      }
      return NextResponse.json({ success: true, data });
    }

    if (action === 'upsert' && table && record) {
      const { data, error } = await client.from(table).upsert(record);
      if (error) {
        console.warn(`Sync upsert error on ${table}:`, error);
        throw error;
      }
      return NextResponse.json({ success: true, data });
    }

    if (action === 'upsert_many' && table && records) {
      const { data, error } = await client.from(table).upsert(records);
      if (error) {
        console.warn(`Sync upsert_many error on ${table}:`, error);
        throw error;
      }
      return NextResponse.json({ success: true, data });
    }

    if ((action === 'delete' || action === 'delete_by') && table) {
      const field = body.field || 'id';
      const value = body.value || id;
      if (value) {
        const { error } = await client.from(table).delete().eq(field, value);
        if (error) throw error;
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
