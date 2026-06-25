'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	createToolBankEntry,
	deleteToolBankEntry,
	listToolBank,
	reorderToolBank,
	type ToolBankEntry,
	updateToolBankEntry,
} from '../services/tool-bank.service';

/** Chave da query do banco de uma tool (opcionalmente filtrado por categoria). */
export const TOOL_BANK_KEY = (toolKey: string, category?: string) =>
	['tool-bank', toolKey, category ?? null] as const;

/**
 * Lista os registros do banco de uma tool. Pro cliente, o back já devolve só os
 * ativos; pro admin (token de painel), devolve todos. `category` filtra no back.
 */
export function useToolBank(
	toolKey: string,
	opts?: { category?: string; enabled?: boolean },
) {
	return useQuery<ToolBankEntry[]>({
		queryKey: TOOL_BANK_KEY(toolKey, opts?.category),
		queryFn: () => listToolBank(toolKey, opts?.category),
		enabled: (opts?.enabled ?? true) && !!toolKey,
		staleTime: 30_000,
	});
}

/** Invalida todas as listas (com/sem filtro) do banco de uma tool. */
function useInvalidateBank(toolKey: string) {
	const qc = useQueryClient();
	return () => qc.invalidateQueries({ queryKey: ['tool-bank', toolKey] });
}

export function useCreateBankEntry(toolKey: string) {
	const invalidate = useInvalidateBank(toolKey);
	return useMutation({
		mutationFn: (body: FormData) => createToolBankEntry(toolKey, body),
		onSuccess: invalidate,
	});
}

export function useUpdateBankEntry(toolKey: string) {
	const invalidate = useInvalidateBank(toolKey);
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: FormData }) =>
			updateToolBankEntry(toolKey, id, body),
		onSuccess: invalidate,
	});
}

export function useDeleteBankEntry(toolKey: string) {
	const invalidate = useInvalidateBank(toolKey);
	return useMutation({
		mutationFn: (id: string) => deleteToolBankEntry(toolKey, id),
		onSuccess: invalidate,
	});
}

export function useReorderBank(toolKey: string) {
	const invalidate = useInvalidateBank(toolKey);
	return useMutation({
		mutationFn: (ids: string[]) => reorderToolBank(toolKey, ids),
		onSuccess: invalidate,
	});
}
