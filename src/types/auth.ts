import { z } from 'zod';

// ── Customer ──────────────────────────────────────────────
export const registerCustomerSchema = z.object({
	name: z.string().min(2),
	email: z.string().email(),
	password: z.string().min(6),
});

export type RegisterCustomerPayload = z.infer<typeof registerCustomerSchema>;

export const loginCustomerSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
});

export type LoginCustomerPayload = z.infer<typeof loginCustomerSchema>;

// ── User (admin) ──────────────────────────────────────────
export const registerUserSchema = z.object({
	name: z.string().min(2),
	email: z.string().email(),
	password: z.string().min(6),
	role: z.string().min(1),
	Permissions: z.number().nullable(),
});

export type RegisterUserPayload = z.infer<typeof registerUserSchema>;

export const loginUserSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
});

export type LoginUserPayload = z.infer<typeof loginUserSchema>;

// ── Responses ─────────────────────────────────────────────
export const authTokenResponseSchema = z.object({
	token: z.string(),
});

export type AuthTokenResponse = z.infer<typeof authTokenResponseSchema>;

export const authMessageResponseSchema = z.object({
	message: z.string(),
});

export type AuthMessageResponse = z.infer<typeof authMessageResponseSchema>;
