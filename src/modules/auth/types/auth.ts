import { z } from 'zod';

// Login — POST /v1/auth/login
export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});
export type LoginPayload = z.infer<typeof loginSchema>;

// Signup — POST /v1/auth/signup
// phone deve seguir E.164: ^\+[1-9]\d{7,14}$
export const signupSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	phone: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Formato E.164: +5511999999999'),
	name: z.string().min(1).optional(),
});
export type SignupPayload = z.infer<typeof signupSchema>;

// Forgot password — POST /v1/auth/forgot-password
export const forgotPasswordSchema = z.object({
	email: z.string().email(),
});
export type ForgotPasswordPayload = z.infer<typeof forgotPasswordSchema>;

// Reset password — POST /v1/auth/reset-password
export const resetPasswordSchema = z.object({
	access_token: z.string().min(1),
	new_password: z.string().min(8),
});
export type ResetPasswordPayload = z.infer<typeof resetPasswordSchema>;

// Responses
export const authUserSchema = z
	.object({
		id: z.string(),
		email: z.string().email(),
		phone: z.string().nullable().optional(),
		name: z.string().nullable().optional(),
		role: z.string(),
		blocked: z.boolean().optional(),
		created_at: z.string().optional(),
		updated_at: z.string().optional(),
	})
	.passthrough();
export type AuthUser = z.infer<typeof authUserSchema>;

export const authTokenResponseSchema = z.object({
	access_token: z.string(),
	refresh_token: z.string().optional(),
	expires_at: z.number().optional(),
	user: authUserSchema,
});
export type AuthTokenResponse = z.infer<typeof authTokenResponseSchema>;

export const authMessageResponseSchema = z.object({
	message: z.string(),
});
export type AuthMessageResponse = z.infer<typeof authMessageResponseSchema>;
