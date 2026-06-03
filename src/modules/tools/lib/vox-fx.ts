'use client';

import type { QueryClient } from '@tanstack/react-query';
import type { Entitlements } from '@/services/entitlements';

/**
 * Efeitos de gasto de voxxys, compartilhados por TODAS as ferramentas (escalável):
 * quando uma tool debita, atualizamos o saldo em cache na hora (header reflete sem
 * esperar refetch) e disparamos um evento que anima um "−custo" perto do saldo.
 */
export const VOX_SPEND_EVENT = 'vox:spend';

export interface VoxSpendDetail {
	amount: number;
}

/** Dispara a animação "−custo" no header. */
export function emitVoxSpend(amount: number): void {
	if (typeof window !== 'undefined' && amount > 0) {
		window.dispatchEvent(
			new CustomEvent<VoxSpendDetail>(VOX_SPEND_EVENT, { detail: { amount } }),
		);
	}
}

/** Atualiza o saldo de voxxys em cache na hora (otimista). */
export function setOptimisticVoxBalance(
	qc: QueryClient,
	balance: number,
): void {
	qc.setQueriesData<Entitlements>({ queryKey: ['entitlements'] }, (old) =>
		old ? { ...old, vox_balance: balance } : old,
	);
}

/** A partir do resultado de invoke/consume: debita na hora + anima (se gastou). */
export function applyVoxCharge(
	qc: QueryClient,
	charge: { voxes_spent: number; balance: number },
): void {
	if (charge.voxes_spent > 0) {
		setOptimisticVoxBalance(qc, charge.balance);
		emitVoxSpend(charge.voxes_spent);
	}
}
