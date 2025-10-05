import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing. Using mock authentication.');
}

// Create Supabase client
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

// Database table names
export const TABLES = {
  USERS: 'users',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  PROJECT_MEMBERS: 'project_members',
  CHAT_MESSAGES: 'chat_messages',
  USER_ANALYTICS: 'user_analytics'
};

// Auth providers configuration
export const AUTH_PROVIDERS = {
  GOOGLE: 'google',
  GITHUB: 'github'
};

export default supabase;