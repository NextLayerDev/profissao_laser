import { AxiosError } from 'axios';

const API_ERROR_MESSAGES: Record<string, string> = {
	email_taken: 'Este email já está cadastrado.',
	invalid_credentials: 'Email ou senha inválidos.',
	user_not_found: 'Usuário não encontrado.',
	invalid_token: 'Token inválido ou expirado.',
	weak_password: 'Senha muito fraca. Use pelo menos 8 caracteres.',
};

interface ApiErrorBody {
	message?: string;
	error?: string;
	code?: string;
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
	if (err instanceof AxiosError) {
		const body = err.response?.data as ApiErrorBody | undefined;
		const raw = body?.message ?? body?.code ?? body?.error;
		if (raw) {
			return API_ERROR_MESSAGES[raw] ?? raw;
		}
	}
	if (err instanceof Error) return err.message;
	return fallback;
}
