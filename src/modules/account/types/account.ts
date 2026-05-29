import { z } from 'zod';

export const meSchema = z.object({
	id: z.string(),
	email: z.string(),
	phone: z.string().nullable().optional(),
	name: z.string().nullable().optional(),
	role: z.enum(['customer', 'staff', 'admin']),
	blocked: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
});
export type Me = z.infer<typeof meSchema>;

export const streakSchema = z.object({
	user_id: z.string(),
	current_streak: z.number().int(),
	longest_streak: z.number().int(),
	last_seen_date: z.string().nullable().optional(),
	updated_at: z.string(),
});
export type Streak = z.infer<typeof streakSchema>;

export interface UpdateMePayload {
	name?: string;
}

export interface ChangePasswordPayload {
	current_password: string;
	new_password: string;
}
