import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const GOOGLE_CALENDAR_SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

export function isConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
