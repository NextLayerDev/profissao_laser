import { z } from 'zod';
import { api } from '@/lib/fetch';
import { apiCourses } from '@/shared/lib/api-courses';

/* ------------------------------------------------------------------ */
/*  Schemas / types (mirror api-upvox `admin-students` contract)       */
/* ------------------------------------------------------------------ */

export const studentPlanSchema = z.object({
	id: z.string(),
	key: z.string(),
	name: z.string(),
});
export type StudentPlan = z.infer<typeof studentPlanSchema>;

export const studentSchema = z.object({
	id: z.string(),
	name: z.string().nullable(),
	email: z.string(),
	phone: z.string().nullable(),
	blocked: z.boolean(),
	is_test_unlimited: z.boolean(),
	plan: studentPlanSchema.nullable(),
	subscription_status: z.string().nullable(),
	current_period_end: z.string().nullable(),
	voxes_balance: z.number(),
});
export type Student = z.infer<typeof studentSchema>;

const customerSubscriptionSchema = z.object({
	id: z.string(),
	customer_id: z.string(),
	plan_id: z.string(),
	interval: z.string(),
	stripe_subscription_id: z.string(),
	stripe_customer_id: z.string(),
	status: z.string(),
	current_period_start: z.string(),
	current_period_end: z.string(),
	cancel_at_period_end: z.boolean(),
	price_cents: z.number(),
	created_at: z.string(),
	updated_at: z.string(),
});

export const studentDetailSchema = studentSchema.extend({
	subscription: customerSubscriptionSchema.nullable(),
});
export type StudentDetail = z.infer<typeof studentDetailSchema>;

export const listStudentsResponseSchema = z.object({
	items: z.array(studentSchema),
	total: z.number(),
	page: z.number(),
	limit: z.number(),
});
export type ListStudentsResponse = z.infer<typeof listStudentsResponseSchema>;

const studentResponseSchema = z.object({ student: studentSchema });

export type ChangePlanMode = 'override' | 'stripe';

export interface ListStudentsParams {
	page?: number;
	limit?: number;
	/** Busca por nome OU email. */
	q?: string;
	/** Filtro por status da assinatura (active, trialing, ...). */
	status?: string;
	/** Filtro por plano. */
	plan_id?: string;
}

/* ------------------------------------------------------------------ */
/*  Service (upvox admin endpoints — `apiCourses`, paths /v1/*)        */
/* ------------------------------------------------------------------ */

export async function listStudents(
	params: ListStudentsParams,
): Promise<ListStudentsResponse> {
	const { data } = await apiCourses.get('/v1/admin/students', { params });
	return listStudentsResponseSchema.parse(data);
}

export async function getStudent(id: string): Promise<StudentDetail> {
	const { data } = await apiCourses.get(`/v1/admin/students/${id}`);
	return studentDetailSchema.parse(data);
}

export async function changeStudentPlan(
	id: string,
	planId: string,
	mode: ChangePlanMode,
): Promise<Student> {
	const { data } = await apiCourses.post(
		`/v1/admin/students/${id}/change-plan`,
		{ plan_id: planId, mode },
	);
	return studentResponseSchema.parse(data).student;
}

export async function cancelStudentSubscription(id: string): Promise<Student> {
	const { data } = await apiCourses.post(
		`/v1/admin/students/${id}/cancel-subscription`,
	);
	return studentResponseSchema.parse(data).student;
}

export async function setStudentTestUnlimited(
	id: string,
	isTestUnlimited: boolean,
): Promise<Student> {
	const { data } = await apiCourses.patch(
		`/v1/admin/students/${id}/test-unlimited`,
		{ is_test_unlimited: isTestUnlimited },
	);
	return studentResponseSchema.parse(data).student;
}

/**
 * Block / unblock — reuses the existing upvox admin endpoint.
 * Body field is `blocked` (see api-upvox `UpdateBlockedBodySchema`).
 */
export async function setStudentBlocked(
	id: string,
	blocked: boolean,
): Promise<void> {
	await apiCourses.patch(`/v1/user/${id}/block`, { blocked });
}

/**
 * Set password — reuses the existing upvox admin endpoint.
 * Body field is `new_password` (see api-upvox `AdminSetPasswordBodySchema`).
 */
export async function setStudentPassword(
	id: string,
	newPassword: string,
): Promise<void> {
	await apiCourses.patch(`/v1/user/${id}/password`, {
		new_password: newPassword,
	});
}

/**
 * Delete a student.
 * TODO(upvox): upvox has no student-delete endpoint yet — keep the legacy main
 * API call (`api` from `@/lib/fetch`) until it lands, then move this to upvox.
 */
export async function deleteStudent(id: string): Promise<void> {
	await api.delete('/customer', { data: { id } });
}
