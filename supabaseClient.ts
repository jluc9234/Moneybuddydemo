import { createClient } from '@supabase/supabase-js';

// Use the URL from your Supabase Dashboard
const supabaseUrl = 'https://sqbrkmileouiqeijqmyo.supabase.co';
// Get your actual 'anon' 'public' key from Settings > API
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
