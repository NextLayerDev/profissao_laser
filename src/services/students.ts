import { z } from 'zod';
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

/** Ofensiva (streak) do aluno — embutida no detalhe (`GET /students/:id`). */
export const studentStreakSchema = z.object({
	current_streak: z.number(),
	longest_streak: z.number(),
	last_seen_date: z.string().nullable(),
});
export type StudentStreak = z.infer<typeof studentStreakSchema>;

export const studentDetailSchema = studentSchema.extend({
	subscription: customerSubscriptionSchema.nullable(),
	// `.optional()` (não só `.nullable()`): o upvox antigo (pré-#32) não devolve
	// a chave `streak`; sem optional o parse quebraria a página inteira até o
	// deploy. Ausente → undefined → a seção "Ofensiva" mostra "sem atividade".
	streak: studentStreakSchema.nullable().optional(),
});
export type StudentDetail = z.infer<typeof studentDetailSchema>;

/* ------------------------------------------------------------------ */
/*  Activity (uso de ferramentas + histórico de voxxys)                */
/*  `GET /v1/admin/students/:id/activity`                              */
/* ------------------------------------------------------------------ */

export const toolUsageItemSchema = z.object({
	id: z.string(),
	tool_key: z.string(),
	course_id: z.string().nullable(),
	status: z.string(),
	// `quota_consumed` é numérico (int) no upvox, não booleano.
	quota_consumed: z.number(),
	voxes_spent: z.number(),
	created_at: z.string(),
});
export type ToolUsageItem = z.infer<typeof toolUsageItemSchema>;

export const voxxysLedgerReasonSchema = z.enum([
	'purchase',
	'spend',
	'refund',
	'adjustment',
	'plan_grant',
]);
export type VoxxysLedgerReason = z.infer<typeof voxxysLedgerReasonSchema>;

export const voxxysLedgerItemSchema = z.object({
	id: z.string(),
	delta: z.number(),
	// O upvox tipa `reason` como string livre (restringido pelo enum do banco).
	// Mantemos string aqui para não quebrar o parse caso surja um motivo novo;
	// os rótulos pt-BR conhecidos ficam em LEDGER_REASON_LABELS (com fallback).
	reason: z.string(),
	ref_type: z.string().nullable(),
	ref_id: z.string().nullable(),
	created_at: z.string(),
});
export type VoxxysLedgerItem = z.infer<typeof voxxysLedgerItemSchema>;

function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
	return z.object({
		items: z.array(item),
		total: z.number(),
		page: z.number(),
		limit: z.number(),
	});
}

export const studentActivitySchema = z.object({
	tool_usage: paginatedSchema(toolUsageItemSchema),
	voxxys_ledger: paginatedSchema(voxxysLedgerItemSchema),
});
export type StudentActivity = z.infer<typeof studentActivitySchema>;

export interface StudentActivityParams {
	tools_page?: number;
	tools_limit?: number;
	voxxys_page?: number;
	voxxys_limit?: number;
}

export const listStudentsResponseSchema = z.object({
	items: z.array(studentSchema),
	total: z.number(),
	page: z.number(),
	limit: z.number(),
});
export type ListStudentsResponse = z.infer<typeof listStudentsResponseSchema>;

const studentResponseSchema = z.object({ student: studentSchema });

/** Resultado da tentativa imediata de cobrança da fatura aberta (Stripe). */
export const forceChargeResponseSchema = z.object({
	invoice_id: z.string(),
	status: z.string(),
	amount_paid: z.number(),
	currency: z.string(),
});
export type ForceChargeResult = z.infer<typeof forceChargeResponseSchema>;

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

/** Uso de ferramentas + histórico de voxxys (paginados de forma independente). */
export async function getStudentActivity(
	id: string,
	params: StudentActivityParams,
): Promise<StudentActivity> {
	const { data } = await apiCourses.get(`/v1/admin/students/${id}/activity`, {
		params,
	});
	return studentActivitySchema.parse(data);
}

/**
 * Dá/ajusta voxxys do aluno (`delta` ≠ 0; negativo debita). Retorna o aluno com
 * o saldo já atualizado.
 */
export async function grantStudentVoxes(
	id: string,
	delta: number,
	note?: string,
): Promise<Student> {
	const { data } = await apiCourses.patch(`/v1/admin/students/${id}/voxes`, {
		delta,
		...(note?.trim() ? { note: note.trim() } : {}),
	});
	return studentResponseSchema.parse(data).student;
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

/**
 * Força uma nova tentativa de cobrança da fatura aberta da assinatura no Stripe.
 * Use quando o pagamento falhou (past_due) e o aluno atualizou o método de
 * pagamento. O status da assinatura é atualizado depois via webhook do Stripe.
 * `POST /v1/admin/students/{id}/force-charge` — sem body. Admin/staff.
 */
export async function forceChargeStudent(
	id: string,
): Promise<ForceChargeResult> {
	const { data } = await apiCourses.post(
		`/v1/admin/students/${id}/force-charge`,
	);
	return forceChargeResponseSchema.parse(data);
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
 * `DELETE /v1/user/{id}` — permanently deletes the user (auth + cascade to all
 * related data). Cannot delete yourself. Admin only. Responds 204.
 */
export async function deleteStudent(id: string): Promise<void> {
	await apiCourses.delete(`/v1/user/${id}`);
}
