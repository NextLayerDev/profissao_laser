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

export interface JwtPayload {
	name?: string;
	email?: string;
	sub?: string;
	role?: string;
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

/** Retorna o payload do token ativo, ou null se não logado */
export function getCurrentUser(): JwtPayload | null {
	const token = getActiveToken();
	if (!token) return null;
	return decodeJwt(token);
}
