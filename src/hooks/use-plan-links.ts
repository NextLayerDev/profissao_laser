import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	createPlanLink,
	getCompanyInvoice,
	getPlanLinkPublic,
	listPlanLinkRedemptions,
	listPlanLinks,
	redeemPlanLink,
	updatePlanLinkStatus,
} from '@/services/plan-links';
import type {
	CompanyInvoiceSource,
	CreatePlanLinkPayload,
} from '@/types/plan-link';

export interface InvoiceFilters {
	source?: CompanyInvoiceSource;
	from?: string;
	to?: string;
	q?: string;
}

const KEYS = {
	links: ['plan-links'] as const,
	public: (token: string) => ['plan-link-public', token] as const,
	invoice: (offset: number, filters: InvoiceFilters) =>
		['company-invoice', offset, filters] as const,
	redemptions: (offset: number) => ['plan-link-redemptions', offset] as const,
};

export function usePlanLinks() {
	return useQuery({ queryKey: KEYS.links, queryFn: listPlanLinks });
}

export function useCreatePlanLink() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreatePlanLinkPayload) => createPlanLink(payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.links }),
	});
}

export function useUpdatePlanLinkStatus() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			status,
		}: {
			id: string;
			status: 'active' | 'disabled';
		}) => updatePlanLinkStatus(id, status),
		onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.links }),
	});
}

export function usePlanLinkPublic(token: string | null) {
	return useQuery({
		queryKey: KEYS.public(token ?? ''),
		queryFn: () => getPlanLinkPublic(token as string),
		enabled: !!token,
		retry: false,
	});
}

export function useRedeemPlanLink(token: string) {
	return useMutation({
		mutationFn: (payload: { cpf: string; plan_key?: string }) =>
			redeemPlanLink(token, payload),
	});
}

const INVOICE_PAGE_SIZE = 50;

export function useCompanyInvoice(page: number, filters: InvoiceFilters = {}) {
	const offset = page * INVOICE_PAGE_SIZE;
	return useQuery({
		queryKey: KEYS.invoice(offset, filters),
		queryFn: () =>
			getCompanyInvoice({ limit: INVOICE_PAGE_SIZE, offset, ...filters }),
		placeholderData: (prev) => prev,
	});
}

/**
 * Histórico completo de meses (Resumo por mês → "Mostrar anteriores").
 * Ignora o filtro de período do topo: janela ampla (o backend usa
 * PLATFORM_BILLING_START como início quando `from` é omitido). `limit: 1`
 * porque só interessa o rollup `monthly` (calculado no servidor sobre todas
 * as linhas, independente do limite). Só busca quando `enabled`.
 */
export function useCompanyInvoiceAllMonths(enabled: boolean) {
	return useQuery({
		queryKey: ['company-invoice-all-months'] as const,
		queryFn: () => getCompanyInvoice({ limit: 1, offset: 0 }),
		enabled,
		placeholderData: (prev) => prev,
	});
}

export function usePlanLinkRedemptions(page: number) {
	const offset = page * INVOICE_PAGE_SIZE;
	return useQuery({
		queryKey: KEYS.redemptions(offset),
		queryFn: () =>
			listPlanLinkRedemptions({ limit: INVOICE_PAGE_SIZE, offset }),
		placeholderData: (prev) => prev,
	});
}

export { INVOICE_PAGE_SIZE };
