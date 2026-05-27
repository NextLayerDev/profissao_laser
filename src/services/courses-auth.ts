import { apiCourses } from '@/shared/lib/api-courses';

/**
 * Auth da API de cursos/planos (upvox). É SEPARADO da API principal:
 * /v1/subscription, /v1/plans etc. só aceitam tokens emitidos aqui.
 * O access_token é guardado como token de "customer" (getActiveToken),
 * e o interceptor do apiCourses o anexa nas chamadas seguintes.
 */

interface CoursesAuthResponse {
	access_token: string;
	refresh_token?: string;
	expires_at?: number | null;
}

export interface CoursesMe {
	id: string;
	email: string;
	name?: string | null;
	role?: string;
}

/** Telefone BR digitado → E.164 exigido pela upvox (ex.: +5511999999999). */
export function toE164(phone: string): string {
	const d = phone.replace(/\D/g, '');
	if (!d) return '';
	return `+${d.startsWith('55') ? d : `55${d}`}`;
}

export async function signupCourses(payload: {
	name: string;
	email: string;
	password: string;
	phone: string;
}): Promise<string> {
	const { data } = await apiCourses.post<CoursesAuthResponse>(
		'/v1/auth/signup',
		{
			name: payload.name,
			email: payload.email,
			password: payload.password,
			phone: toE164(payload.phone),
		},
	);
	return data.access_token;
}

export async function loginCourses(payload: {
	email: string;
	password: string;
}): Promise<string> {
	const { data } = await apiCourses.post<CoursesAuthResponse>(
		'/v1/auth/login',
		payload,
	);
	return data.access_token;
}

/** Valida o token atual na upvox (200 = logado lá; 401 = não). */
export async function getCoursesMe(): Promise<CoursesMe> {
	const { data } = await apiCourses.get<CoursesMe>('/v1/me');
	return data;
}
