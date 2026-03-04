const KEYS = {
	user: 'pl_user_token',
	customer: 'pl_customer_token',
} as const;

export type AuthRole = keyof typeof KEYS;

export function saveToken(role: AuthRole, token: string) {
	localStorage.setItem(KEYS[role], token);
}

export function getToken(role: AuthRole): string | null {
	return localStorage.getItem(KEYS[role]);
}

export function clearToken(role: AuthRole) {
	localStorage.removeItem(KEYS[role]);
}

/** Retorna o primeiro token disponível: user tem prioridade sobre customer */
export function getActiveToken(): string | null {
	return getToken('user') ?? getToken('customer');
}

/** Retorna true se o utilizador tem token de admin (user) */
export function isAdmin(): boolean {
	return !!getToken('user');
}

export interface JwtPayload {
	name?: string;
	email?: string;
	sub?: string;
	role?: string;
	exp?: number;
}

/** Decodifica o payload do JWT sem verificar assinatura */
export function decodeJwt(token: string): JwtPayload | null {
	try {
		const base64Url = token.split('.')[1];
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		const json = decodeURIComponent(
			atob(base64)
				.split('')
				.map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
				.join(''),
		);
		return JSON.parse(json) as JwtPayload;
	} catch {
		return null;
	}
}

/** Retorna true se o token existe e ainda não expirou */
export function isTokenValid(token: string): boolean {
	const payload = decodeJwt(token);
	if (!payload) return false;
	if (!payload.exp) return true; // sem campo exp, considera válido
	return payload.exp * 1000 > Date.now();
}

export function clearAllTokens() {
	clearToken('user');
	clearToken('customer');
}

/** Retorna o payload do token ativo, ou null se não logado ou expirado */
export function getCurrentUser(): JwtPayload | null {
	const token = getActiveToken();
	if (!token) return null;
	if (!isTokenValid(token)) {
		clearAllTokens();
		return null;
	}
	return decodeJwt(token);
}
