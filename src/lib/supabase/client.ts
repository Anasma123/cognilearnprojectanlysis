import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://ptsitpiqzcxspkbrcxwi.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0c2l0cGlxemN4c3BrYnJjeHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyNDE2NTksImV4cCI6MjExMDgxNzY1OX0.S23mfv3RsderiAlxyBd28gpXdyJGvIaW1XbsKGr5rTc';

// Resolve URL from any of the standard or Vercel integration prefixes
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_STORAGE_URL ||
  process.env.STORAGE_URL ||
  process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL ||
  process.env.STORAGE_SUPABASE_URL ||
  FALLBACK_URL;

// Resolve Anon / Publishable key
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_STORAGE_ANON_KEY ||
  process.env.STORAGE_ANON_KEY ||
  process.env.NEXT_PUBLIC_STORAGE_SUPABASE_ANON_KEY ||
  process.env.STORAGE_SUPABASE_ANON_KEY ||
  FALLBACK_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('example.com') &&
  !supabaseAnonKey.includes('...') &&
  supabaseAnonKey.length > 20
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
