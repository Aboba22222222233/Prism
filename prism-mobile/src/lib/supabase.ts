import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import SecureStoreAdapter from './SecureStoreAdapter';

// HARDCODED DEMO CREDENTIALS
const SUPABASE_URL = "https://bdytsdycnaaierdzwhak.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkeXRzZHljbmFhaWVyZHp3aGFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NTQyNDgsImV4cCI6MjA4MjQzMDI0OH0.3Dj_Nfm96GiPXwYwmpxuw0u_vWibNRZbwgRqGEgM4YQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: SecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
