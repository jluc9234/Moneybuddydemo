import { createClient } from '@supabase/supabase-js';

// Use the URL from your Supabase Dashboard
const supabaseUrl = 'https://sqbrkmileouiqeijqmyo.supabase.co';
// Get your actual 'anon' 'public' key from Settings > API
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxYnJrbWlsZW91aXFlaWpxbXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMDgyNTcsImV4cCI6MjA4Njg4NDI1N30.iiO46ossD4GWPvzskktg3jBDiKHziXdRaTdz0-_oTPQ'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
