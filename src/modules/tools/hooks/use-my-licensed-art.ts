'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import {
	archiveMyLicensedArt,
	listMyLicensedArt,
} from '../services/my-licensed-art.service';

/**
 * As listas de ativas e de arquivadas são DUAS entradas de cache. Se a chave
 * não carregasse o filtro, alternar entre as abas devolveria a lista errada
 * guardada da vez anterior.
 */
export const myLicensedArtQueryKey = (archived = false) =>
	['my-licensed-art', { archived }] as const;

export function useMyLicensedArt(archived = false, enabled = true) {
	return useQuery({
		queryKey: myLicensedArtQueryKey(archived),
		queryFn: () => listMyLicensedArt({ archived }),
		enabled,
		// Sem repetição: um 401 aqui derruba a sessão pelo interceptor do `api`.
		// Tentar de novo só multiplica o estrago antes do redirect.
		retry: false,
	});
}

/** Arquivar e desarquivar: a mesma mutação, com a direção como argumento. */
export function useArchiveMyLicensedArt() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
			archiveMyLicensedArt(id, archived),
		onSuccess: (_d, vars) => {
			// Sem o filtro na chave, invalida as duas listas — a peça saiu de uma
			// e entrou na outra.
			qc.invalidateQueries({ queryKey: ['my-licensed-art'] });
			toast.success(
				vars.archived
					? 'Peça arquivada. Você pode trazer de volta quando quiser.'
					: 'Peça de volta na biblioteca.',
			);
		},
		onError: (e) =>
			toast.error(getApiErrorMessage(e, 'Não foi possível mover a peça.')),
	});
}
