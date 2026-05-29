import { api } from '@/lib/fetch';
import {
	type AuthTokenResponse,
	authMessageResponseSchema,
	authTokenResponseSchema,
	type LoginCustomerPayload,
	type LoginUserPayload,
	type RegisterCustomerPayload,
	type RegisterUserPayload,
} from '@/types/auth';

export async function registerCustomer(
	payload: RegisterCustomerPayload,
): Promise<string> {
	const { data } = await api.post('/register/customer', payload);
	const parsed = authMessageResponseSchema.parse(data);
	return parsed.message;
}

export async function loginCustomer(
	payload: LoginCustomerPayload,
): Promise<AuthTokenResponse> {
	const { data } = await api.post('/login/customer', payload);
	return authTokenResponseSchema.parse(data);
}

export async function registerUser(
	payload: RegisterUserPayload,
): Promise<string> {
	const { data } = await api.post('/register/user', payload);
	const parsed = authMessageResponseSchema.parse(data);
	return parsed.message;
}

export async function loginUser(
	payload: LoginUserPayload,
): Promise<AuthTokenResponse> {
	const { data } = await api.post('/login/user', payload);
	return authTokenResponseSchema.parse(data);
}
