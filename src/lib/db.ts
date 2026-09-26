import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getActiveToken } from '@/lib/auth';

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

let _userRealtime: SupabaseClient | null = null;

/**
 * Cliente só para Realtime com RLS do usuário logado. No `db` o supabase-js
 * troca o token do Realtime pelo da sessão dele (vazia aqui → chave anon) a
 * cada conexão/heartbeat, então `db.realtime.setAuth(jwt)` não segurava e o
 * canal entrava como anon: a RLS barrava todo evento do aluno. Com o callback
 * `accessToken`, o JWT do app vale também nos heartbeats.
 */
export function userRealtimeDb(): SupabaseClient {
	if (!_userRealtime) {
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
		if (!supabaseUrl || !supabaseAnonKey) {
			throw new Error('Supabase environment variables are not set');
		}
		_userRealtime = createClient(supabaseUrl, supabaseAnonKey, {
			accessToken: async () => getActiveToken() ?? supabaseAnonKey,
		});
	}
	return _userRealtime;
}
