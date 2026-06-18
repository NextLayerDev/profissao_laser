'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { type ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import { useEntitlements } from '@/modules/subscriptions';
import { ToolCostNotice } from '../components/tool-cost-notice';
import { applyVoxCharge } from '../lib/vox-fx';
import { consumeTool } from '../services/tools.service';
import { useRunTool } from './use-run-tool';

/**
 * Billing genérico por ferramenta — a função padrão de TODAS as tools. A regra é
 * única: `billed` = a ferramenta tem funcionalidade liberada (`toolFor(key)`).
 *
 * Cobrada → debita **na hora** ao usar, sem modal de confirmação. O custo aparece
 * num aviso inline (`notice`) abaixo da ação; quando falta saldo, o aviso vira
 * "comprar voxxys" e a ação fica bloqueada. O débito reflete no saldo do header
 * em tempo real, com animação "−custo" (via `applyVoxCharge`).
 *
 * Dois fluxos:
 * - `runEngine(engineFn)`: tools com motor (vectorize/ai_canvas/previa).
 * - `consume(onProceed)`: tools sem motor (páginas de dados, "abrir item").
 *
 * Renderize `{notice}` logo abaixo do botão da ação.
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
		onSuccess: (res) => {
			applyVoxCharge(qc, res); // saldo cai no header + anima "−custo" na hora
			qc.invalidateQueries({ queryKey: ['entitlements'] });
		},
		onError: (err) => {
			const status =
				err instanceof AxiosError ? err.response?.status : undefined;
			// 402 → o aviso inline já mostra "comprar voxxys"; outros → toast.
			if (status !== 402) toast.error('Não foi possível usar a ferramenta.');
		},
	});

	// Precisa pagar (sem cota grátis e com custo) e não tem saldo → bloqueia + avisa.
	const mustPay = billed && remainingFree === 0 && cost > 0;
	const insufficient = mustPay && !ent.isLoading && voxBalance < cost;

	const runEngine = useCallback(
		async <T,>(engineFn: (invocationId?: string) => Promise<T>) => {
			if (insufficient) return; // o aviso inline mostra "comprar voxxys"
			return billed
				? runTool.run((invocationId) => engineFn(invocationId))
				: Promise.resolve(engineFn(undefined));
		},
		[billed, insufficient, runTool],
	);

	const consume = useCallback(
		async (onProceed: () => void) => {
			if (insufficient) return;
			if (billed && courseSlug) {
				try {
					await consumeMut.mutateAsync();
				} catch {
					return; // erro já tratado (toast / aviso inline)
				}
			}
			onProceed();
		},
		[billed, courseSlug, insufficient, consumeMut],
	);

	const pending = runTool.pending || consumeMut.isPending;

	const notice: ReactNode =
		billed && cost > 0 ? (
			<ToolCostNotice
				cost={cost}
				remainingFree={remainingFree}
				balance={voxBalance}
				insufficient={insufficient}
			/>
		) : null;

	return {
		billed,
		cost,
		remainingFree,
		voxBalance,
		insufficient,
		pending,
		runEngine,
		consume,
		notice,
	};
}
