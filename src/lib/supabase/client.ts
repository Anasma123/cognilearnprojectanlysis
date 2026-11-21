import { createClient } from '@supabase/supabase-js';

// Resolve URL from any of the standard or Vercel integration prefixes
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_STORAGE_URL ||
  process.env.STORAGE_URL ||
  process.env.NEXT_PUBLIC_STORAGE_SUPABASE_URL ||
  process.env.STORAGE_SUPABASE_URL ||
  '';

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
  '';

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

