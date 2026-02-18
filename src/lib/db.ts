import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey && !supabaseUrl) {
	console.log('Env not set for db');
}

export const db = createClient(
	supabaseUrl as string,
	supabaseAnonKey as string,
);
