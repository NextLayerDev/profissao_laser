'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { type ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import { useEntitlements } from '@/hooks/use-entitlements';
import { ToolCostNotice } from '../components/tool-cost-notice';
import { applyVoxCharge } from '../lib/vox-fx';
import { consumeTool } from '../services/tools.service';
import { useRunTool } from './use-run-tool';

/**
 * Billing genérico por ferramenta — a função padrão de TODAS as tools. A regra é
 * única: `billed` = a ferramenta existe no catálogo (`toolFor(key)`). Assinatura
 * NÃO é pré-requisito: quem não tem plano vê e usa a ferramenta pagando voxxys
 * (sem cota grátis) — a única trava é o saldo.
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
 * Renderize `{notice}` abaixo da ação.
 */
export function useToolBilling(
	featureKey: string,
	courseSlug: string | undefined,
	/** Variações selecionadas (Passo 3 dos Prompts Mágicos). Escala o custo
	 *  exibido e o gate de saldo: `vox_cost × variationCount`. Default 1. */
	variationCount = 1,
) {
	const qc = useQueryClient();
	const ent = useEntitlements(courseSlug);
	const tool = ent.toolFor(featureKey);
	// Cobra qualquer aluno que enxergue a tool — com ou sem plano. Sem plano não
	// há cota grátis, então cai direto no débito de voxxys.
	const billed = !!tool;
	const cost = tool?.vox_cost ?? 0;
	// Custo efetivo escala por variação (1× = vox_cost, 2× = 2×, 4× = 4×). O
	// upvox debita esse valor no invoke; aqui só espelha p/ gate de saldo + aviso.
	const effectiveCost = Math.round(cost * variationCount * 100) / 100;
	const remainingFree = ent.remainingFree(featureKey);
	const voxBalance = ent.voxBalance;
	const runTool = useRunTool(featureKey, courseSlug);

	const consumeMut = useMutation({
		mutationFn: () => consumeTool(featureKey, courseSlug),
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
	const mustPay = billed && remainingFree === 0 && effectiveCost > 0;
	const insufficient = mustPay && !ent.isLoading && voxBalance < effectiveCost;

	const runEngine = useCallback(
		async <T,>(engineFn: (invocationId?: string) => Promise<T>) => {
			if (insufficient) return; // o aviso inline mostra "comprar voxxys"
			return billed
				? runTool.run((invocationId) => engineFn(invocationId), variationCount)
				: Promise.resolve(engineFn(undefined));
		},
		[billed, insufficient, runTool, variationCount],
	);

	const consume = useCallback(
		async (onProceed: () => void) => {
			if (insufficient) return;
			if (billed) {
				try {
					await consumeMut.mutateAsync();
				} catch {
					return; // erro já tratado (toast / aviso inline)
				}
			}
			onProceed();
		},
		[billed, insufficient, consumeMut],
	);

	const pending = runTool.pending || consumeMut.isPending;

	const notice: ReactNode =
		billed && cost > 0 ? (
			<ToolCostNotice
				cost={effectiveCost}
				remainingFree={remainingFree}
				balance={voxBalance}
				insufficient={insufficient}
			/>
		) : null;

	return {
		billed,
		cost,
		/** Custo efetivo já escalado por `variationCount` (vox_cost × N). */
		effectiveCost,
		remainingFree,
		voxBalance,
		insufficient,
		pending,
		runEngine,
		consume,
		notice,
	};
}
