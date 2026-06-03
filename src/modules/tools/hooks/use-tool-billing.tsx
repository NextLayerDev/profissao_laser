'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { CreditConfirmModal } from '@/components/credits/credit-confirm-modal';
import { VOX_BALANCE_KEY } from '@/hooks/use-credits';
import { useEntitlements } from '@/hooks/use-entitlements';
import { consumeTool } from '../services/tools.service';
import { useRunTool } from './use-run-tool';

/**
 * Billing genérico por ferramenta. A regra é única: `billed` = a ferramenta tem
 * funcionalidade liberada pro cliente (`toolFor(key)` nos entitlements). Cobrada
 * → debita (confirma quando a cota grátis acaba e há custo). Não cobrada → roda
 * livre, sem voxxys.
 *
 * Dois fluxos:
 * - `runEngine(engineFn)`: ferramentas com motor (vectorize/ai_canvas/previa).
 *   engineFn recebe o invocation_id (string) quando cobrada, ou undefined (livre).
 * - `consume(onProceed)`: ferramentas sem motor (páginas de dados, "abrir item").
 *   Cobra atômico via /use e então chama `onProceed()`. Livre → só `onProceed()`.
 *
 * Renderize `{modal}` no JSX da view (confirmação + saldo insuficiente).
 */
export function useToolBilling(
	featureKey: string,
	courseSlug: string | undefined,
) {
	const qc = useQueryClient();
	const ent = useEntitlements(courseSlug);
	const tool = ent.toolFor(featureKey);
	const billed = !!tool;
	const cost = tool?.vox_cost ?? 0;
	const remainingFree = ent.remainingFree(featureKey);
	const voxBalance = ent.voxBalance;
	const runTool = useRunTool(featureKey, courseSlug);

	const consumeMut = useMutation({
		mutationFn: () => consumeTool(featureKey, courseSlug ?? ''),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['entitlements'] });
			qc.invalidateQueries({ queryKey: VOX_BALANCE_KEY });
		},
		onError: (err) => {
			const status =
				err instanceof AxiosError ? err.response?.status : undefined;
			toast.error(
				status === 402
					? 'Saldo de voxxys insuficiente.'
					: 'Não foi possível usar a ferramenta.',
			);
		},
	});

	// Ação pendente de confirmação (sem cota grátis e com custo > 0).
	const [pendingAction, setPendingAction] = useState<
		(() => Promise<unknown>) | null
	>(null);

	const needsConfirm = billed && remainingFree === 0 && cost > 0;

	const runEngine = useCallback(
		async <T,>(engineFn: (invocationId?: string) => Promise<T>) => {
			const exec = () =>
				billed
					? runTool.run((invocationId) => engineFn(invocationId))
					: Promise.resolve(engineFn(undefined));
			if (needsConfirm) {
				setPendingAction(() => exec);
				return;
			}
			return exec();
		},
		[billed, needsConfirm, runTool],
	);

	const consume = useCallback(
		async (onProceed: () => void) => {
			const exec = async () => {
				if (billed && courseSlug) {
					try {
						await consumeMut.mutateAsync();
					} catch {
						return; // erro já mostrado em toast
					}
				}
				onProceed();
			};
			if (needsConfirm) {
				setPendingAction(() => exec);
				return;
			}
			return exec();
		},
		[billed, courseSlug, needsConfirm, consumeMut],
	);

	const pending = runTool.pending || consumeMut.isPending;

	const modal: ReactNode = (
		<>
			{pendingAction && (
				<CreditConfirmModal
					variant="confirm"
					cost={cost}
					balance={voxBalance}
					pending={pending}
					onConfirm={() => {
						const fn = pendingAction;
						setPendingAction(null);
						fn?.();
					}}
					onClose={() => setPendingAction(null)}
				/>
			)}
			{runTool.block?.kind === 'insufficient_voxes' && (
				<CreditConfirmModal
					variant="insufficient"
					cost={cost}
					balance={voxBalance}
					onConfirm={runTool.clearBlock}
					onClose={runTool.clearBlock}
				/>
			)}
		</>
	);

	return {
		billed,
		cost,
		remainingFree,
		voxBalance,
		pending,
		runEngine,
		consume,
		modal,
	};
}
