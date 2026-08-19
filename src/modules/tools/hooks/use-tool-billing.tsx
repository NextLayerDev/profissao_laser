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
 * `viewOnly` = tool grátis (`is_free`) que o aluno vê SEM assinatura: `consume`
 * (consulta/GET) passa livre e sem cobrar; `runEngine` (usar/rodar) é bloqueado.
 * Use-o pra esconder botões de escrita/uso. Renderize `{notice}` abaixo da ação.
 */
export function useToolBilling(
	featureKey: string,
	courseSlug: string | undefined,
	/** Variações selecionadas (Passo 3 dos Prompts Mágicos). Escala o custo
	 *  exibido e o gate de saldo: `vox_cost × variationCount`. Default 1. */
	variationCount = 1,
	/**
	 * TIRAGEM: quantas peças licenciadas a rodada vai produzir. A primeira já
	 * vem no `vox_cost` da geração; a partir da segunda cada peça custa
	 * `license_unit_cost` — e essa parte NUNCA é coberta por cota grátis, porque
	 * cada peça remunera o licenciante.
	 */
	printRun = 1,
) {
	const qc = useQueryClient();
	const ent = useEntitlements(courseSlug);
	const tool = ent.toolFor(featureKey);
	// View-only: tool grátis (is_free) que o aluno vê sem assinatura. Pode
	// consultar (GET), mas NÃO pode rodar/usar — use/invoke exigem plano.
	const viewOnly = !!tool && !tool.entitled && tool.is_free;
	// Só cobra quem realmente tem direito de usar (entitled). View-only não cobra.
	const billed = !!tool && tool.entitled;
	const cost = tool?.vox_cost ?? 0;
	const licenseUnitCost = tool?.license_unit_cost ?? 0;
	const licenseUnits = Math.max(0, printRun - 1);
	const custoTiragem = Math.round(licenseUnitCost * licenseUnits * 100) / 100;
	const remainingFree = ent.remainingFree(featureKey);
	/** Há cota para esta rodada? `null` = ilimitada pelo plano. */
	const temCota = remainingFree === null || remainingFree > 0;
	/**
	 * A COTA COBRE UMA GERAÇÃO — A PRIMEIRA. As demais são sempre voxxy.
	 *
	 * Espelha `authorizeAndCharge` no upvox, que é quem manda. Errar aqui não
	 * cobra errado (o débito é lá), mas mostra um preço que não é o da conta —
	 * e preço na tela que não bate com o extrato é pior que preço alto.
	 */
	const geracoesPagas = temCota
		? Math.max(0, variationCount - 1)
		: variationCount;
	const custoGeracao = Math.round(cost * geracoesPagas * 100) / 100;
	const effectiveCost = Math.round((custoGeracao + custoTiragem) * 100) / 100;
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
	/**
	 * Precisa pagar = a rodada TEM custo, tenha cota ou não.
	 *
	 * Era `remainingFree === 0 && ...`, o que valia enquanto cota e cobrança
	 * fossem exclusivas. Deixaram de ser: a cota cobre a primeira geração e a
	 * tiragem nunca é coberta, então uma rodada com cota disponível pode debitar
	 * voxxy. Com a condição antiga, quem tinha cota e não tinha saldo passava
	 * pelo gate, clicava, e levava um erro genérico do backend em vez do aviso
	 * com "comprar voxxys".
	 */
	const mustPay = billed && effectiveCost > 0;
	const insufficient = mustPay && !ent.isLoading && voxBalance < effectiveCost;

	const runEngine = useCallback(
		async <T,>(engineFn: (invocationId?: string) => Promise<T>) => {
			// View-only não roda a ferramenta — só assinante executa (use/invoke).
			if (viewOnly) {
				toast.error('Assine um plano para usar esta ferramenta.');
				return;
			}
			if (insufficient) return; // o aviso inline mostra "comprar voxxys"
			return billed
				? runTool.run(
						(invocationId) => engineFn(invocationId),
						variationCount,
						licenseUnits,
					)
				: Promise.resolve(engineFn(undefined));
		},
		[billed, viewOnly, insufficient, runTool, variationCount, licenseUnits],
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
				cost={effectiveCost}
				unitCost={cost}
				remainingFree={remainingFree}
				balance={voxBalance}
				insufficient={insufficient}
				/* A cota vai absorver uma geração desta rodada? É o que separa
				   "grátis" de "quase grátis" — e o aviso tem de dizer qual. */
				cotaCobreUma={temCota && variationCount > 0}
			/>
		) : null;

	return {
		billed,
		viewOnly,
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
