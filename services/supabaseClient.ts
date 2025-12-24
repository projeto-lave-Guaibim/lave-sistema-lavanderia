import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uufmwhhkosxmfozsgzaf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1Zm13aGhrb3N4bWZvenNnemFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDQ2NzksImV4cCI6MjA3NjA4MDY3OX0.mC06yvRwvR0PM2ONVHnEbvBOTkbjrSWvraS2BOPTzVk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: window.localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
    }
});
