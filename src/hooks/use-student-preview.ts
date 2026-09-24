'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { VOX_BALANCE_KEY } from '@/hooks/use-credits';
import { useEntitlements } from '@/hooks/use-entitlements';
import {
	startStudentPreview,
	stopStudentPreview,
} from '@/services/student-preview';

/**
 * Estado da Visão Aluno. Lê de `useEntitlements` — SEM request extra: os
 * entitlements já são buscados em toda a área do aluno.
 */
export function useStudentPreview() {
	const { studentPreview, isLoading } = useEntitlements();
	const until = studentPreview?.until ?? null;
	const active = studentPreview?.active === true;

	// Recalcula a cada 30s p/ o contador do banner andar sozinho.
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		if (!active || !until) return;
		const id = setInterval(() => setNow(Date.now()), 30_000);
		return () => clearInterval(id);
	}, [active, until]);

	const msRemaining = until ? Math.max(Date.parse(until) - now, 0) : 0;

	return { active, until, msRemaining, isLoading };
}

/**
 * Invalida TUDO que deriva de entitlements.
 *
 * Prefixo cru `['entitlements']` de propósito: a chave real é
 * `['entitlements', courseSlug|null]` e existem caches por curso (o
 * `useToolBilling` passa slug). `ENTITLEMENTS_KEY()` só limparia o `null`.
 */
function invalidateEntitlements(qc: ReturnType<typeof useQueryClient>) {
	qc.invalidateQueries({ queryKey: VOX_BALANCE_KEY });
	qc.invalidateQueries({ queryKey: ['course-progress'] });
	return qc.invalidateQueries({ queryKey: ['entitlements'] });
}

export function useStartStudentPreview() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (hours?: number) => startStudentPreview(hours),
		// `await` antes de quem chama navegar: sem isso a /course pinta um frame
		// com o estado velho (tudo bloqueado) antes do refetch chegar.
		onSuccess: () => invalidateEntitlements(qc),
		onError: () =>
			toast.error('Não foi possível abrir a visão do aluno', {
				description: 'Tente de novo em alguns segundos.',
			}),
	});
}

export function useStopStudentPreview() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: stopStudentPreview,
		onSuccess: () => invalidateEntitlements(qc),
		onError: () => toast.error('Não foi possível sair da visão do aluno'),
	});
}
