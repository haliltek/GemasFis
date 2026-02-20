/**
 * Supabase Client — singleton instance for the entire app.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

let supabase: SupabaseClient;

export function getSupabase(): SupabaseClient {
    if (!supabase) {
        supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
            auth: {
                storage: AsyncStorage as any,
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false,
            },
        });
    }
    return supabase;
}

export { supabase };
