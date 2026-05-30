'use client';

import { useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { VOX_BALANCE_KEY } from '@/hooks/use-credits';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { invokeTool } from '../services/tools.service';

/** A run blocked in a way the UI must react to (e.g. open a buy-voxxys modal). */
export type RunToolBlock = { kind: 'insufficient_voxes' };

interface ApiErrorBody {
	message?: string;
	code?: string;
}

/**
 * Runs a tool end-to-end under the new billing model — billing is owned by
 * upvox, the engine is just the worker:
 *
 *   1. invoke on upvox → authorizes + debits quota/voxxys, returns an
 *      `invocation_id` (pending);
 *   2. run the engine (main API) with that id → it re-validates on upvox, does
 *      the work, then settles (ok) or refunds (failure) the invocation;
 *   3. refresh entitlements + balance (quota/saldo changed either way).
 *
 * upvox's gate errors map to UX: 402 → buy voxxys (surfaced via `block` so the
 * caller can show the modal with its own cost/balance); 403 `tool_not_entitled`
 * → upgrade; 403 `subscription_*` → assine (both send the user to the store).
 * The engine refunds server-side on its own failure, so an engine error here is
 * only a toast.
 */
export function useRunTool(toolKey: string, courseSlug: string | undefined) {
	const qc = useQueryClient();
	const router = useRouter();
	const [pending, setPending] = useState(false);
	const [block, setBlock] = useState<RunToolBlock | null>(null);

	const clearBlock = useCallback(() => setBlock(null), []);

	const run = useCallback(
		async <T>(
			engine: (invocationId: string) => Promise<T>,
		): Promise<T | null> => {
			if (!courseSlug) {
				toast.error('Nenhum curso ativo encontrado para esta ferramenta.');
				return null;
			}
			setPending(true);
			setBlock(null);

			// 1) authorize + bill on upvox
			let invocationId: string;
			try {
				const res = await invokeTool(toolKey, courseSlug);
				invocationId = res.invocation_id;
			} catch (err) {
				const status =
					err instanceof AxiosError ? err.response?.status : undefined;
				const reason =
					err instanceof AxiosError
						? (err.response?.data as ApiErrorBody | undefined)?.message
						: undefined;

				if (status === 402) {
					setBlock({ kind: 'insufficient_voxes' });
				} else if (status === 403 && reason === 'tool_not_entitled') {
					toast.error(
						'Seu plano não inclui esta ferramenta. Faça upgrade para usá-la.',
					);
					router.push('/course/store');
				} else if (status === 403) {
					toast.error(
						'Você precisa de uma assinatura ativa para usar esta ferramenta.',
					);
					router.push('/course/store');
				} else {
					toast.error(getApiErrorMessage(err, 'Erro ao iniciar a ferramenta.'));
				}
				setPending(false);
				return null;
			}

			// 2) run the engine — it settles/refunds the invocation on upvox
			try {
				return await engine(invocationId);
			} catch (err) {
				toast.error(getApiErrorMessage(err, 'Erro ao processar.'));
				return null;
			} finally {
				setPending(false);
				// quota/saldo moved (debit on run, or refund on failure)
				qc.invalidateQueries({ queryKey: ['entitlements'] });
				qc.invalidateQueries({ queryKey: VOX_BALANCE_KEY });
			}
		},
		[toolKey, courseSlug, qc, router],
	);

	return { run, pending, block, clearBlock };
}
