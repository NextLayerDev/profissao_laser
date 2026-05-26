'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { CreditModalVariant } from '@/components/credits/credit-confirm-modal';
import { VOX_QUOTA_KEY } from '@/hooks/use-credits';
import { myVoxesQueryKey } from '@/modules/voxes';
import type { VoxFeature } from '@/types/credits';

interface AxiosLikeError {
	response?: { status?: number; data?: unknown };
}

function parseError(err: unknown): {
	status?: number;
	data: Record<string, unknown>;
} {
	const e = err as AxiosLikeError;
	return {
		status: e?.response?.status,
		data: (e?.response?.data ?? {}) as Record<string, unknown>,
	};
}

interface ModalState {
	variant: CreditModalVariant;
	cost: number;
	balance: number;
	canUseCredits: boolean;
	/** info adicional para variant='free-tier-exhausted' */
	freeTier?: {
		limit: number;
		used: number;
		period: 'daily' | 'weekly';
		resetsAt: string;
	};
}

interface UseCreditActionArgs<T> {
	feature: VoxFeature;
	/** custo unitário da feature (de useVoxCosts); fallback 1 */
	cost: number;
	/** saldo atual (de useMyVoxes) */
	balance: number;
	/** executa a chamada real; recebe a flag useCredits */
	run: (opts: { useCredits: boolean }) => Promise<T>;
}

export function useCreditAction<T>({
	feature: _feature,
	cost,
	balance,
	run,
}: UseCreditActionArgs<T>) {
	const qc = useQueryClient();
	const [modal, setModal] = useState<ModalState | null>(null);
	const [pending, setPending] = useState(false);

	const finish = useCallback(() => {
		qc.invalidateQueries({ queryKey: myVoxesQueryKey });
		qc.invalidateQueries({ queryKey: VOX_QUOTA_KEY });
	}, [qc]);

	const execute = useCallback(
		async (useCredits: boolean): Promise<T | undefined> => {
			setPending(true);
			try {
				const result = await run({ useCredits });
				setModal(null);
				finish();
				return result;
			} catch (err) {
				const { status, data } = parseError(err);
				if (status === 402) {
					const reason = data.reason as string | undefined;
					setModal({
						variant:
							reason === 'insufficient_balance' ? 'insufficient' : 'confirm',
						cost: (data.cost as number) ?? cost,
						balance: (data.balance as number) ?? balance,
						canUseCredits: true,
					});
				} else if (status === 429 && data.code === 'FREE_TIER_LIMIT_REACHED') {
					setModal({
						variant: 'free-tier-exhausted',
						cost,
						balance: (data.balance as number) ?? 0,
						canUseCredits: false,
						freeTier: {
							limit: (data.limit as number) ?? 0,
							used: (data.used as number) ?? 0,
							period:
								(data.period as 'daily' | 'weekly' | undefined) ?? 'weekly',
							resetsAt: (data.resetsAt as string) ?? '',
						},
					});
				} else {
					setModal(null);
					toast.error('Não foi possível concluir a ação');
				}
				return undefined;
			} finally {
				setPending(false);
			}
		},
		[run, finish, cost, balance],
	);

	/**
	 * Chamada inicial. Sempre tenta executar sem `useCredits`:
	 *   • balance == 0 + free-tier disponível → executa e loga uso grátis
	 *   • balance == 0 + free-tier esgotado → 429 → modal 'free-tier-exhausted'
	 *   • balance > 0 → 402 confirmation_required → modal 'confirm'
	 * O parâmetro `useFreeQuotaFirst` é mantido por compatibilidade (no-op).
	 */
	const trigger = useCallback(
		(_opts?: { useFreeQuotaFirst?: boolean }) => execute(false),
		[execute],
	);

	const confirm = useCallback(() => execute(true), [execute]);
	const close = useCallback(() => setModal(null), []);

	return { trigger, confirm, close, modal, pending, execute };
}
