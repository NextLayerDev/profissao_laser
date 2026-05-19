'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { CreditModalVariant } from '@/components/credits/credit-confirm-modal';
import { VOX_BALANCE_KEY } from '@/hooks/use-credits';
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
}

interface UseCreditActionArgs<T> {
	feature: VoxFeature;
	/** custo unitário da feature (de useVoxCosts); fallback 1 */
	cost: number;
	/** saldo atual (de useVoxBalance) */
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
		qc.invalidateQueries({ queryKey: VOX_BALANCE_KEY });
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
				} else if (status === 429 && data.code === 'DAILY_LIMIT_REACHED') {
					const opt = data.creditOption as {
						cost: number;
						balance: number;
						canUseCredits: boolean;
					} | null;
					setModal({
						variant: 'daily-limit',
						cost: opt?.cost ?? cost,
						balance: opt?.balance ?? balance,
						canUseCredits: !!opt?.canUseCredits,
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

	/** Chamada inicial. Para prévia, useFreeQuotaFirst=true tenta sem flag. */
	const trigger = useCallback(
		(opts?: { useFreeQuotaFirst?: boolean }) => {
			if (opts?.useFreeQuotaFirst) {
				return execute(false);
			}
			if (balance < cost) {
				setModal({
					variant: 'insufficient',
					cost,
					balance,
					canUseCredits: false,
				});
				return Promise.resolve(undefined);
			}
			setModal({ variant: 'confirm', cost, balance, canUseCredits: true });
			return Promise.resolve(undefined);
		},
		[balance, cost, execute],
	);

	const confirm = useCallback(() => execute(true), [execute]);
	const close = useCallback(() => setModal(null), []);

	return { trigger, confirm, close, modal, pending, execute };
}
