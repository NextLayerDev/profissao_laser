import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
	if (!_client) {
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
		if (!supabaseUrl || !supabaseAnonKey) {
			throw new Error('Supabase environment variables are not set');
		}
		_client = createClient(supabaseUrl, supabaseAnonKey);
	}
	return _client;
}

export const db = new Proxy({} as SupabaseClient, {
	get(_, prop) {
		return Reflect.get(getClient(), prop);
	},
});
