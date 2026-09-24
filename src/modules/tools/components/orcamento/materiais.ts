'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { listCollection } from '../../services/collections.service';

/**
 * A BASE DE MATERIAIS, lida como a tela precisa dela.
 *
 * A coleção `materiais` já guarda densidade, preço, chapa, espessuras e se o
 * material corta a laser — 20 linhas curadas pela equipe. Antes desta tela nada
 * disso chegava ao aluno: o dropdown vinha de um `enum` de vinte strings na
 * definition (`'aço carbono'`, `'mdf'`…) e a espessura era um SLIDER livre de
 * 0,1 a 100 mm. Daí saíam duas coisas ruins:
 *
 *  • **acento quebrado** — a lista da definition é minúscula e a tela aplicava
 *    `capitalize` por CSS em cima de acento decomposto: "AçO Carbono",
 *    "AlumíNio", "LatãO". Aqui o rótulo é o `title` do registro, escrito por
 *    gente, e nenhuma regra de CSS o reescreve;
 *  • **MDF de 60 mm por R$ 1.197,50** — espessura que não existe em lugar
 *    nenhum, aceita sem bloqueio. Com as espessuras REAIS da chapa virando
 *    chips, o caminho normal deixa de produzir essa peça impossível.
 *
 * A leitura é um GET de coleção: não roda pipeline, não cobra vox nenhum.
 */

export interface MaterialDaBase {
	id: string;
	/** Rótulo que o aluno lê ("Aço carbono", "MDF cru"). */
	nome: string;
	familia: string;
	/** Espessuras de chapa que existem para comprar, em mm. */
	espessuras: number[];
	/** `fibra` | `co2` | `nao`. */
	laser: string;
	/** `false` = libera cloro ou derrete; o motor BLOQUEIA o orçamento. */
	cortaALaser: boolean;
	observacoes?: string;
}

function espessurasDe(v: unknown): number[] {
	if (typeof v !== 'string') return [];
	return [
		...new Set(
			v
				.split(/[|,;\s]+/)
				.map((s) => Number(s.replace(',', '.')))
				.filter((n) => Number.isFinite(n) && n > 0),
		),
	].sort((a, b) => a - b);
}

export function useMateriais(toolKey: string) {
	const query = useQuery({
		queryKey: ['collection', toolKey, 'materiais', 'orcamento'],
		queryFn: () =>
			listCollection(toolKey, 'materiais', { pageSize: 100, sort: 'title' }),
		enabled: toolKey.length > 0 && toolKey !== 'preview',
		staleTime: 5 * 60_000,
	});

	const materiais = useMemo<MaterialDaBase[]>(() => {
		const itens = query.data?.items ?? [];
		return itens.map((e) => {
			const d = e.data as Record<string, unknown>;
			const laser = String(d.laser ?? '');
			return {
				id: e.id,
				// A FAMÍLIA é o que o bloco `quote.price` aceita como `material_id`
				// quando não é UUID; o `title` é só o rótulo. Mandar o título
				// ("MDF cru") no lugar da família daria "material não está na base".
				familia: String(d.familia ?? e.title ?? '').trim(),
				nome: (e.title || String(d.familia ?? '')).trim(),
				espessuras: espessurasDe(d.espessuras),
				laser,
				cortaALaser: laser !== 'nao',
				observacoes:
					typeof d.observacoes === 'string' && d.observacoes.trim()
						? d.observacoes.trim()
						: undefined,
			};
		});
	}, [query.data]);

	return {
		materiais,
		isLoading: query.isLoading,
		/**
		 * A base não respondeu (coleção ausente, tool em rascunho fora da
		 * allowlist). A tela CONTINUA funcionando com entrada livre — orçar é o
		 * que importa, e o back valida o material de qualquer jeito.
		 */
		indisponivel: query.isError || (!query.isLoading && materiais.length === 0),
	};
}
