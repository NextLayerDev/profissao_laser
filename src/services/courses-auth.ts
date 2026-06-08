import { apiCourses } from '@/shared/lib/api-courses';

/**
 * Auth da API de cursos/planos (upvox). É SEPARADO da API principal:
 * /v1/subscription, /v1/plans etc. só aceitam tokens emitidos aqui.
 * O access_token é guardado como token de "customer" (getActiveToken),
 * e o interceptor do apiCourses o anexa nas chamadas seguintes.
 */

export interface CoursesUser {
	id: string;
	email: string;
	phone?: string | null;
	name?: string | null;
	role?: string;
	blocked?: boolean;
	created_at?: string;
	updated_at?: string;
}

interface CoursesAuthResponse {
	access_token: string;
	refresh_token?: string;
	expires_at?: number | null;
	user?: CoursesUser;
}

export type CoursesMe = CoursesUser;

/** Telefone BR digitado → E.164 exigido pela upvox (ex.: +5511999999999). */
export function toE164(phone: string): string {
	const d = phone.replace(/\D/g, '');
	if (!d) return '';
	return `+${d.startsWith('55') ? d : `55${d}`}`;
}

export interface CoursesAuthResult {
	accessToken: string;
	refreshToken?: string;
	user?: CoursesUser;
}

function toResult(data: CoursesAuthResponse): CoursesAuthResult {
	return {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		user: data.user,
	};
}

export async function signupCourses(payload: {
	name: string;
	email: string;
	password: string;
	phone: string;
}): Promise<CoursesAuthResult> {
	const { data } = await apiCourses.post<CoursesAuthResponse>(
		'/v1/auth/signup',
		{
			name: payload.name,
			email: payload.email,
			password: payload.password,
			phone: toE164(payload.phone),
		},
	);
	return toResult(data);
}

export async function loginCourses(payload: {
	email: string;
	password: string;
}): Promise<CoursesAuthResult> {
	const { data } = await apiCourses.post<CoursesAuthResponse>(
		'/v1/auth/login',
		payload,
	);
	return toResult(data);
}

/** Dispara o envio do e-mail de recuperação de senha. */
export async function forgotPasswordCourses(email: string): Promise<void> {
	await apiCourses.post('/v1/auth/forgot-password', { email });
}

/** Redefine a senha usando o access_token recebido por e-mail. */
export async function resetPasswordCourses(
	accessToken: string,
	newPassword: string,
): Promise<void> {
	await apiCourses.post('/v1/auth/reset-password', {
		access_token: accessToken,
		new_password: newPassword,
	});
}

/** Valida o token atual na upvox (200 = logado lá; 401 = não). */
export async function getCoursesMe(): Promise<CoursesMe> {
	const { data } = await apiCourses.get<CoursesMe>('/v1/me');
	return data;
}
