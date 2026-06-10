import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	createPlanLink,
	getCompanyInvoice,
	getPlanLinkPublic,
	listPlanLinks,
	redeemPlanLink,
	updatePlanLinkStatus,
} from '@/services/plan-links';
import type { CreatePlanLinkPayload } from '@/types/plan-link';

const KEYS = {
	links: ['plan-links'] as const,
	public: (token: string) => ['plan-link-public', token] as const,
	invoice: (offset: number) => ['company-invoice', offset] as const,
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
		mutationFn: (payload: { cpf: string; plan_key: string }) =>
			redeemPlanLink(token, payload),
	});
}

const INVOICE_PAGE_SIZE = 50;

export function useCompanyInvoice(page: number) {
	const offset = page * INVOICE_PAGE_SIZE;
	return useQuery({
		queryKey: KEYS.invoice(offset),
		queryFn: () => getCompanyInvoice({ limit: INVOICE_PAGE_SIZE, offset }),
		placeholderData: (prev) => prev,
	});
}

export { INVOICE_PAGE_SIZE };
