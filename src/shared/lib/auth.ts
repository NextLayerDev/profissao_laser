const TOKEN_KEY = 'pl_token';

export function saveToken(token: string) {
	localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
	localStorage.removeItem(TOKEN_KEY);
}

export interface JwtPayload {
	name?: string;
	email?: string;
	sub?: string;
	role?: string;
	exp?: number;
}

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

export function isTokenValid(token: string): boolean {
	const payload = decodeJwt(token);
	if (!payload) return false;
	if (!payload.exp) return true;
	return payload.exp * 1000 > Date.now();
}

export function getCurrentUser(): JwtPayload | null {
	const token = getToken();
	if (!token) return null;
	if (!isTokenValid(token)) {
		clearToken();
		return null;
	}
	return decodeJwt(token);
}
