import { api } from '@/shared/lib/fetch';
import {
	type AuthTokenResponse,
	authTokenResponseSchema,
	type ForgotPasswordPayload,
	type LoginPayload,
	type ResetPasswordPayload,
	type SignupPayload,
} from '../types/auth';

export async function login(payload: LoginPayload): Promise<AuthTokenResponse> {
	const { data } = await api.post('/v1/auth/login', payload);
	return authTokenResponseSchema.parse(data);
}

// Extrai uma mensagem informativa de qualquer formato de resposta da API,
// sem falhar se o shape mudar. Aceita { message }, { msg }, ou string crua.
function extractMessage(data: unknown, fallback: string): string {
	if (typeof data === 'string') return data;
	if (data && typeof data === 'object') {
		const obj = data as Record<string, unknown>;
		if (typeof obj.message === 'string') return obj.message;
		if (typeof obj.msg === 'string') return obj.msg;
	}
	return fallback;
}

export async function signup(
	payload: SignupPayload,
): Promise<AuthTokenResponse> {
	const { data } = await api.post('/v1/auth/signup', payload);
	return authTokenResponseSchema.parse(data);
}

export async function forgotPassword(
	payload: ForgotPasswordPayload,
): Promise<string> {
	const { data } = await api.post('/v1/auth/forgot-password', payload);
	return extractMessage(data, 'Email de recuperação enviado.');
}

export async function resetPassword(
	payload: ResetPasswordPayload,
): Promise<string> {
	const { data } = await api.post('/v1/auth/reset-password', payload);
	return extractMessage(data, 'Senha redefinida com sucesso.');
}
