'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { aceitaAluno, resolveCollectionConfig } from '../lib/collection-form';
import {
	lerMarca,
	MARCA_COLLECTION,
	MARCA_TOOL_KEY,
	type Marca,
} from '../lib/marca';
import {
	type CollectionEntry,
	listCollection,
	updateCollectionEntry,
} from '../services/collections.service';
import { useToolDefinition } from './use-tool-definition';

/**
 * AS MARCAS DO ALUNO — a leitura que TODA ferramenta usa.
 *
 * A coleção mora no contêiner `perfil` (ver `lib/marca.ts`), mas ninguém precisa
 * saber disso para consumir: `useMarcaAtiva()` devolve a marca que vale agora (e
 * a lista inteira, para quem quiser deixar o aluno escolher) e
 * `useMarcaDisponivel()` diz se o cadastro sequer existe para quem está olhando.
 * Uma ferramenta nova não copia nada — lê daqui, ou, do lado do servidor, com o
 * `noDaMarca()` do seed (`tool:'perfil', collection:'marca'`).
 */

/**
 * O prefixo `['collection', tool, colecao]` NÃO é decoração: é o mesmo que
 * `CollectionEntryForm` invalida ao salvar. Mudá-lo aqui faz a lista de marcas
 * parar de se atualizar depois de um cadastro, sem erro nenhum.
 */
const MARCAS_QUERY_KEY = [
	'collection',
	MARCA_TOOL_KEY,
	MARCA_COLLECTION,
	'mine',
] as const;

export interface UseMarcaDisponivel {
	/** A coleção existe PARA ESTE usuário e aceita cadastro dele. */
	disponivel: boolean;
	isLoading: boolean;
	/** A configuração declarada da coleção (campos, rótulos, visibilidade). */
	config: ReturnType<typeof resolveCollectionConfig>;
}

/**
 * "O cadastro da marca funciona para quem está olhando?" — a MESMA pergunta que
 * a tela e o item de menu precisam responder, com a mesma resposta.
 *
 * Quem responde é a definition do CONTÊINER: se ela carrega e declara a coleção
 * `marca` com `submissions.who:'student'`, o cadastro funciona. Note que isto é
 * diferente de "a tool está no catálogo do aluno": uma definition em rascunho
 * não aparece em catálogo nenhum e ainda assim RESPONDE para quem está na
 * allowlist de preview — foi assim que ela foi testada. Gatear pelo catálogo
 * esconderia a seção justamente de quem consegue usar.
 *
 * É esta a pergunta que decide se a seção "Minha marca" aparece no perfil.
 * `false` ⇒ a seção NÃO É RENDERIZADA (não vira aviso, não vira cartão de
 * erro): enquanto o contêiner estiver em `draft`, o perfil de quem está fora da
 * allowlist tem que ficar exatamente como era antes desta fase.
 *
 * Custo: uma consulta, compartilhada por react-query com a da tela (60 s de
 * frescor). Para quem não tem acesso, um 404 com uma retentativa.
 */
export function useMarcaDisponivel(): UseMarcaDisponivel {
	const def = useToolDefinition(MARCA_TOOL_KEY);
	const config = useMemo(
		() => resolveCollectionConfig(def.data?.definition, MARCA_COLLECTION),
		[def.data?.definition],
	);
	return {
		disponivel: !def.isError && aceitaAluno(config),
		isLoading: def.isLoading,
		config,
	};
}

interface UseMarcas {
	entries: CollectionEntry[];
	marcas: Marca[];
	isLoading: boolean;
	isError: boolean;
}

/**
 * `sort:'recent'` é `created_at desc` no repositório da coleção — ou seja, a
 * primeira da lista é a última CRIADA (editar uma marca antiga não a traz para
 * a frente). É a ordem que a regra de "qual marca usar" assume.
 */
function useMarcas(): UseMarcas {
	const { data, isLoading, isError } = useQuery({
		queryKey: MARCAS_QUERY_KEY,
		queryFn: () =>
			listCollection(MARCA_TOOL_KEY, MARCA_COLLECTION, {
				mine: true,
				sort: 'recent',
				pageSize: 50,
			}),
		staleTime: 60_000,
	});

	const entries = data?.items ?? [];
	return { entries, marcas: entries.map(lerMarca), isLoading, isError };
}

/* ─────────────────────────── a marca escolhida ─────────────────────────── */

const ESCOLHA_KEY = 'pl.marca.ativa';
const ESCOLHA_EVENT = 'pl-marca-ativa';

function lerEscolha(): string | null {
	if (typeof window === 'undefined') return null;
	try {
		return window.localStorage.getItem(ESCOLHA_KEY);
	} catch {
		return null;
	}
}

function gravarEscolha(id: string | null): void {
	if (typeof window === 'undefined') return;
	try {
		if (id) window.localStorage.setItem(ESCOLHA_KEY, id);
		else window.localStorage.removeItem(ESCOLHA_KEY);
	} catch {
		// note: storage cheio/negado — a escolha vira efêmera e o fallback (a mais
		// recente) assume. Nada quebra.
	}
	// note: avisa esta aba (custom) e as outras (o `storage` nativo é cross-tab).
	window.dispatchEvent(new CustomEvent(ESCOLHA_EVENT));
}

interface UseMarcaEscolhida {
	/** Id guardado no navegador (pode apontar para uma marca já apagada). */
	escolhaId: string | null;
	escolher: (id: string | null) => void;
	isReady: boolean;
}

/**
 * Desempate LOCAL, enquanto a gravação de `principal` não volta do servidor.
 *
 * Já foi a fonte da verdade, e era mentira: o servidor nunca lia o
 * `localStorage`, então a tela mostrava "em uso" numa marca e a arte saía com
 * outra. Quem manda agora é o campo `principal` da coleção — ver `useMarcaAtiva`.
 * Isto sobrou para a lista não piscar entre o clique e o refetch.
 */
function useMarcaEscolhida(): UseMarcaEscolhida {
	const [escolhaId, setEscolhaId] = useState<string | null>(null);
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		const sync = () => {
			setEscolhaId(lerEscolha());
			setIsReady(true);
		};
		sync();
		const onStorage = (e: StorageEvent) => {
			if (e.key === ESCOLHA_KEY) sync();
		};
		window.addEventListener(ESCOLHA_EVENT, sync);
		window.addEventListener('storage', onStorage);
		return () => {
			window.removeEventListener(ESCOLHA_EVENT, sync);
			window.removeEventListener('storage', onStorage);
		};
	}, []);

	const escolher = useCallback((id: string | null) => {
		gravarEscolha(id);
		setEscolhaId(id);
	}, []);

	return { escolhaId, escolher, isReady };
}

export interface UseMarcaAtiva extends UseMarcas {
	/** A marca que vale agora — `null` quando o aluno não cadastrou nenhuma. */
	entry: CollectionEntry | null;
	marca: Marca | null;
	escolhaId: string | null;
	escolher: (id: string | null) => void;
	/**
	 * Marca esta como `principal` no servidor — é o que o pipeline lê.
	 *
	 * `entrada` é para quem ACABOU DE SALVAR: logo depois de gravar, o refetch da
	 * lista ainda está no ar e o registro novo não está no cache, então procurar
	 * por id não acha nada. Quem tem o registro em mãos passa ele aqui e a
	 * gravação acontece na hora. Ver o comentário de `usar`.
	 */
	usar: (id: string, entrada?: CollectionEntry) => Promise<void>;
}

/** O booleano do jsonb — `Boolean('false')` é `true`, então é explícito. */
function ehPrincipal(e: CollectionEntry): boolean {
	const v = (e.data as Record<string, unknown>)?.principal;
	return v === true || v === 'true' || v === 1 || v === '1';
}

/**
 * A marca que vale agora: a marcada como principal, senão a mais recente.
 *
 * A ORDEM MUDOU, e por um defeito real: a escolha vivia só no `localStorage`, e
 * o servidor — que é quem gera a arte e escreve o anúncio — nunca a enxergava.
 * Ele lia sempre a mais recente. Um aluno com duas marcas escolhia a antiga,
 * via o selo "em uso" na tela, e recebia a peça com a outra identidade, sem
 * erro e sem como desconfiar. A tela dizia uma coisa e o produto fazia outra.
 *
 * Agora `principal` é campo da coleção (`seed-estudio-imagens.ts`), então a
 * escolha atravessa para o servidor e vale em qualquer navegador. O
 * `localStorage` continua como desempate LOCAL enquanto a gravação não volta —
 * some sozinho quando a lista recarrega.
 *
 * "Nenhuma" é um estado NORMAL — a ferramenta continua funcionando sem marca.
 */
export function useMarcaAtiva(): UseMarcaAtiva {
	const lista = useMarcas();
	const { escolhaId, escolher } = useMarcaEscolhida();

	const qc = useQueryClient();

	/**
	 * Marca a escolhida como `principal` NO SERVIDOR e desmarca as outras.
	 *
	 * Uma por vez, com `updateCollectionEntry`, porque não existe escrita em
	 * lote — e um aluno tem duas ou três marcas, não duzentas. Se um dos PATCHes
	 * falhar, sobra mais de uma marcada: `escolherMarca` (back) trata isso caindo
	 * na mais recente entre as principais, em vez de recusar.
	 *
	 * A escolha local é gravada ANTES da rede para a lista não piscar; o refetch
	 * do fim é quem torna a decisão verdadeira para todo mundo.
	 *
	 * ┌─ POR QUE `entrada` EXISTE (defeito medido, não zelo) ────────────────────┐
	 * │ Procurar o registro só na lista em cache faz esta função DESISTIR EM     │
	 * │ SILÊNCIO logo depois de um cadastro: o `onSaved` dispara antes de o      │
	 * │ refetch voltar, o id novo ainda não está em `lista.entries`, o `return`  │
	 * │ acontece e NENHUM PATCH é enviado. Medido na seção do perfil: com uma    │
	 * │ marca já principal, cadastrar uma segunda deixava a nova SEM `principal` │
	 * │ e o selo "Em uso" na antiga — o aluno cadastra uma marca e a arte sai    │
	 * │ com a outra, que é exatamente a classe de bug que o `principal` no       │
	 * │ servidor veio matar.                                                     │
	 * │                                                                          │
	 * │ Quem acabou de salvar TEM o registro em mãos, então ele entra por aqui e │
	 * │ a gravação não depende mais de corrida com a rede. O Ateliê resolvia o   │
	 * │ mesmo problema esperando a lista alcançar (`recemCriada`); com `entrada` │
	 * │ a espera deixa de ser necessária e o buraco fecha para todo chamador.    │
	 * └──────────────────────────────────────────────────────────────────────────┘
	 */
	const usar = useCallback(
		async (id: string, entrada?: CollectionEntry) => {
			escolher(id);
			const alvo =
				(entrada?.id === id ? entrada : null) ??
				lista.entries.find((e) => e.id === id);
			if (!alvo) return;
			const desmarcar = lista.entries.filter(
				(e) => e.id !== id && ehPrincipal(e),
			);
			try {
				await updateCollectionEntry(MARCA_TOOL_KEY, MARCA_COLLECTION, id, {
					data: { ...alvo.data, principal: true },
				});
				for (const e of desmarcar) {
					await updateCollectionEntry(MARCA_TOOL_KEY, MARCA_COLLECTION, e.id, {
						data: { ...e.data, principal: false },
					});
				}
			} finally {
				qc.invalidateQueries({ queryKey: MARCAS_QUERY_KEY });
			}
		},
		[escolher, lista.entries, qc],
	);

	const entry =
		lista.entries.find(ehPrincipal) ??
		lista.entries.find((e) => e.id === escolhaId) ??
		lista.entries[0] ??
		null;

	return {
		...lista,
		entry,
		marca: entry ? lerMarca(entry) : null,
		escolhaId,
		escolher,
		usar,
	};
}
