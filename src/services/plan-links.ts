import { apiCourses } from '@/shared/lib/api-courses';
import {
	type CompanyInvoice,
	type CompanyInvoiceSource,
	type CreatePlanLinkPayload,
	companyInvoiceSchema,
	type PlanLink,
	type PlanLinkListItem,
	type PlanLinkRedemptions,
	type PublicPlanLink,
	planLinkListItemSchema,
	planLinkRedemptionsSchema,
	planLinkSchema,
	publicPlanLinkSchema,
} from '@/types/plan-link';

/** Cria um Link de Plano (staff/admin). */
export async function createPlanLink(
	payload: CreatePlanLinkPayload,
): Promise<PlanLink> {
	const { data } = await apiCourses.post('/v1/plan-links', payload);
	return planLinkSchema.parse(data);
}

/** Lista os Links de Plano com contadores (staff/admin). */
export async function listPlanLinks(): Promise<PlanLinkListItem[]> {
	const { data } = await apiCourses.get('/v1/plan-links');
	return planLinkListItemSchema.array().parse(data);
}

/** Ativa/desativa um link (staff/admin). */
export async function updatePlanLinkStatus(
	id: string,
	status: 'active' | 'disabled',
): Promise<PlanLink> {
	const { data } = await apiCourses.patch(`/v1/plan-links/${id}/status`, {
		status,
	});
	return planLinkSchema.parse(data);
}

/** Vitrine pública do link (sem auth). */
export async function getPlanLinkPublic(
	token: string,
): Promise<PublicPlanLink> {
	const { data } = await apiCourses.get(`/v1/plan-links/${token}/public`);
	return publicPlanLinkSchema.parse(data);
}

/** Assinantes via links: resgates com cliente/plano/link (staff/admin). */
export async function listPlanLinkRedemptions(params: {
	limit?: number;
	offset?: number;
}): Promise<PlanLinkRedemptions> {
	const { data } = await apiCourses.get('/v1/plan-links/redemptions', {
		params,
	});
	return planLinkRedemptionsSchema.parse(data);
}

/** Resgata o link (auth): CPF (+ plano nos mensais) → URL do checkout Stripe. */
export async function redeemPlanLink(
	token: string,
	payload: { cpf: string; plan_key?: string },
): Promise<{ checkout_url: string }> {
	const { data } = await apiCourses.post(
		`/v1/plan-links/${token}/redeem`,
		payload,
	);
	return data as { checkout_url: string };
}

/** Fatura aberta da empresa (staff/admin), com filtros opcionais. */
export async function getCompanyInvoice(params: {
	limit?: number;
	offset?: number;
	source?: CompanyInvoiceSource;
	from?: string;
	to?: string;
	q?: string;
}): Promise<CompanyInvoice> {
	const { data } = await apiCourses.get('/v1/admin/company-invoice', {
		params,
	});
	return companyInvoiceSchema.parse(data);
}
