'use client';

import { type ReactNode, useCallback, useState } from 'react';
import { CreditConfirmModal } from '@/components/credits/credit-confirm-modal';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useRunTool } from './use-run-tool';

/**
 * Billing genérico por ferramenta (engine flow). Decide cobrar ou rodar livre
 * a partir dos entitlements: `billed` = a ferramenta tem funcionalidade liberada
 * pro cliente (`toolFor(key)`). Cobrada → invoke→motor→settle (confirma quando a
 * cota grátis acabou e há custo). Não cobrada → roda o motor sem invocation.
 *
 * Uso:
 *   const { runEngine, modal } = useToolBilling('previa', courseSlug);
 *   // engineFn recebe o invocation_id (string) ou undefined (rodada livre)
 *   await runEngine((invocationId) => mutateAsync({ ...payload, invocation_id: invocationId }));
 *   // ...e renderize {modal} no JSX.
 */
export function useToolBilling(
	featureKey: string,
	courseSlug: string | undefined,
) {
	const ent = useEntitlements(courseSlug);
	const tool = ent.toolFor(featureKey);
	const billed = !!tool;
	const cost = tool?.vox_cost ?? 0;
	const remainingFree = ent.remainingFree(featureKey);
	const voxBalance = ent.voxBalance;
	const runTool = useRunTool(featureKey, courseSlug);

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

	const modal: ReactNode = (
		<>
			{pendingAction && (
				<CreditConfirmModal
					variant="confirm"
					cost={cost}
					balance={voxBalance}
					pending={runTool.pending}
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
		pending: runTool.pending,
		runEngine,
		modal,
	};
}
