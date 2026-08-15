'use client';

import { useQuery } from '@tanstack/react-query';
import {
	Clapperboard,
	CornerDownRight,
	Film,
	GitBranch,
	ImageOff,
	Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useEntitlements } from '@/hooks/use-entitlements';
import {
	type CollectionEntry,
	getCollectionLineage,
} from '../../services/collections.service';
import { type GalleryFilters, useGallery } from '../gallery-grid';

/**
 * "MINHAS ARTES" — o histórico do Ateliê, dentro da própria ferramenta.
 *
 * ┌─ POR QUE ESTA SEÇÃO EXISTE ──────────────────────────────────────────────┐
 * │ A tela prometia "a sua arte fica salva em Minhas artes" em QUATRO lugares │
 * │ (a desconexão, o rodapé da mesa, a nota de "acompanhar depois" e a        │
 * │ ressalva do resultado) — e não havia lugar nenhum. Quem renderiza         │
 * │ `ui.history` é o `tool-canvas-view`, e o ramo `canvas` ficou inalcançável │
 * │ para esta tool no instante em que o dispatcher passou a testar `atelie`   │
 * │ antes. Nenhuma outra página do app lista a coleção `galeria`.             │
 * │                                                                          │
 * │ Isso não era um link quebrado: era a promessa que sustenta a decisão de   │
 * │ projeto de "o socket cair NÃO é erro". Sem um lugar onde a arte aparece,  │
 * │ o aluno que perde a conexão num run JÁ COBRADO não tem como reencontrar a │
 * │ peça — e a única saída dele é pagar de novo por uma arte que já existe.   │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * É a coleção `galeria` da tool (`visibility:'owner'`, `mine:true`), a MESMA que
 * o nó `salvar` do pipeline grava. Nada de tabela nova: quem busca é o
 * `useGallery` que a tela do canvas já usava.
 *
 * O desenho é deliberadamente mais pobre que o da galeria do canvas — sem
 * filtros, sem favoritos, sem scroll infinito. Aqui ela é um HISTÓRICO de
 * resgate no rodapé de um fluxo de criação, não a tela principal; encher de
 * controles seria a densidade que esta ferramenta existe para não ter.
 */

/**
 * Identidade ESTÁVEL: `filters` entra na `queryKey` do react-query. Um literal
 * novo a cada render viraria uma chave nova a cada render — refetch infinito.
 */
const SEM_FILTRO: GalleryFilters = { modo: '', favoritos: false, q: '' };

/** Quantas cabem sem a seção virar a tela. O resto é história antiga. */
const TETO = 8;

/**
 * A tool do VÍDEO GERADO POR IA (compra separada, preço próprio). Ver a mesma
 * constante em `resultado.tsx`: é o endereço de OUTRA ferramenta, e um link
 * para uma chave que não existe é uma página em branco.
 */
const TOOL_DO_VIDEO_IA = 'estudio_video';

/* ═══════════════════ a árvore de iterações ═══════════════════ */

/** Uma miniatura da linhagem — a arte de origem ou uma das que saíram dela. */
function Elo({ e, rotulo }: { e: CollectionEntry; rotulo: string }) {
	const url =
		(typeof e.data?.thumb_url === 'string' && e.data.thumb_url) ||
		(typeof e.data?.url === 'string' && e.data.url) ||
		e.image ||
		'';
	return (
		<li className="w-28 shrink-0">
			<span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
				{rotulo}
			</span>
			<a
				href={url || undefined}
				target="_blank"
				rel="noreferrer"
				title={e.title}
				className="block overflow-hidden rounded-lg border border-slate-200 dark:border-white/10"
			>
				{/* <img> cru: URL de CDN da galeria, fora do otimizador do Next. */}
				{url ? (
					<img
						src={url}
						alt={e.title}
						loading="lazy"
						className="aspect-square w-full bg-slate-100 object-cover dark:bg-white/5"
					/>
				) : (
					<span className="flex aspect-square w-full items-center justify-center bg-slate-100 dark:bg-white/5">
						<ImageOff className="h-4 w-4 text-slate-400" />
					</span>
				)}
			</a>
		</li>
	);
}

/**
 * A CORRENTE DE UMA ARTE — de onde ela veio e o que saiu dela.
 *
 * ┌─ O QUE ISTO CONSERTA ───────────────────────────────────────────────────┐
 * │ `parent_id` era gravado desde sempre e NUNCA foi lido: a galeria era uma │
 * │ lista cronológica em que a ampliação de ontem aparecia entre dois posts  │
 * │ de assuntos diferentes, sem nada dizendo que uma saiu da outra. Um       │
 * │ nível para cada lado é o que a tela precisa; a árvore inteira sai de     │
 * │ navegar, um clique por vez.                                             │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * `enabled` pela abertura: a linhagem só é buscada quando o aluno pede. Buscar
 * as oito de uma vez seriam oito requisições para uma seção que quase ninguém
 * abre.
 */
function Linhagem({
	toolKey,
	colecao,
	id,
}: {
	toolKey: string;
	colecao: string;
	id: string;
}) {
	const { data, isLoading, isError } = useQuery({
		queryKey: ['gallery-lineage', toolKey, colecao, id],
		queryFn: () => getCollectionLineage(toolKey, colecao, id),
		staleTime: 30_000,
	});

	if (isLoading) {
		return (
			<div className="flex justify-center py-4">
				<Loader2 className="h-4 w-4 animate-spin text-slate-400" />
			</div>
		);
	}
	if (isError || !data) {
		return (
			<p className="py-3 text-xs text-slate-500 dark:text-slate-400">
				Não consegui carregar a origem desta arte agora.
			</p>
		);
	}

	const temPai = Boolean(data.parent);
	const filhos = data.children;
	/**
	 * `parent_id` gravado + `parent` nulo = a origem foi apagada da galeria.
	 * Estado normal (o aluno limpou), e dizê-lo é melhor que um card quebrado.
	 */
	const paiSumiu =
		!temPai &&
		typeof data.item.data?.parent_id === 'string' &&
		Boolean(data.item.data.parent_id);

	if (!temPai && filhos.length === 0) {
		return (
			<p className="py-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
				{paiSumiu
					? 'A arte que deu origem a esta não está mais na sua galeria.'
					: 'Esta arte não veio de nenhuma outra e ainda não gerou ajustes. Use “Ajustar esta arte” no resultado para criar uma versão a partir dela.'}
			</p>
		);
	}

	return (
		<div className="space-y-2 py-3">
			{paiSumiu ? (
				<p className="text-xs text-slate-500 dark:text-slate-400">
					A arte que deu origem a esta não está mais na sua galeria.
				</p>
			) : null}
			<ul className="flex items-start gap-3 overflow-x-auto pb-1">
				{data.parent ? <Elo e={data.parent} rotulo="Veio de" /> : null}
				<Elo e={data.item} rotulo="Esta arte" />
				{filhos.map((f) => (
					<li key={f.id} className="flex shrink-0 items-start gap-3">
						<CornerDownRight className="mt-6 h-3.5 w-3.5 shrink-0 text-slate-400" />
						<ul className="contents">
							<Elo e={f} rotulo="Saiu daqui" />
						</ul>
					</li>
				))}
			</ul>
		</div>
	);
}

export interface GaleriaDoAtelieProps {
	toolKey: string;
	/** A coleção declarada em `ui.history.source`. É DADO, não literal da tela. */
	colecao: string;
	/** O título declarado em `ui.history.title`. */
	titulo: string;
}

export function GaleriaDoAtelie({
	toolKey,
	colecao,
	titulo,
}: GaleriaDoAtelieProps) {
	const { images, isLoading, isError } = useGallery(
		toolKey,
		colecao,
		SEM_FILTRO,
	);
	const recentes = useMemo(() => images.slice(0, TETO), [images]);
	/** Qual card está com a linhagem aberta. Uma por vez — ver `Linhagem`. */
	const [linhagemDe, setLinhagemDe] = useState<string | null>(null);

	/**
	 * O atalho para o vídeo por IA só existe se a ferramenta existir PARA ELE.
	 *
	 * A tool nasce em rascunho e, com a allowlist de preview, só o testador a
	 * enxerga no catálogo — para todos os outros ela some de `/v1/me/entitlements`
	 * e o `/invoke` responderia 404. Um link visível para todo mundo seria um
	 * atalho que leva a uma página que recusa, e isso já aconteceu aqui.
	 */
	const { toolFor } = useEntitlements();
	const podeOferecerVideo = Boolean(toolFor(TOOL_DO_VIDEO_IA)?.entitled);

	/**
	 * A SEÇÃO NUNCA SOME — e isso é o ponto dela.
	 *
	 * Se ela desaparecesse quando não há nada (ou quando a busca falha), a
	 * promessa de "fica salva em Minhas artes" voltaria a apontar para o vazio
	 * justamente no caso em que o aluno foi procurar: logo depois de um run cuja
	 * conexão caiu. Vazio e erro têm frase própria.
	 */
	return (
		<section className="space-y-3 border-t border-slate-200 pt-6 dark:border-white/10">
			<div className="flex items-baseline justify-between gap-3">
				<h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
					{titulo}
				</h2>
				{recentes.length > 0 ? (
					<span className="shrink-0 text-xs text-slate-400">
						as{' '}
						{recentes.length === 1 ? 'mais recente' : `${TETO} mais recentes`}
					</span>
				) : null}
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center py-8">
					<Loader2 className="h-5 w-5 animate-spin text-slate-400" />
				</div>
			) : isError ? (
				<p className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-300">
					Não consegui carregar as suas artes agora. Recarregue a página em
					instantes — nenhuma delas foi perdida.
				</p>
			) : recentes.length === 0 ? (
				<p className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 p-4 text-xs leading-relaxed text-slate-500 dark:border-white/10 dark:text-slate-400">
					<ImageOff className="h-4 w-4 shrink-0" />
					Ainda não há artes por aqui. Cada peça que você criar fica guardada
					neste lugar.
				</p>
			) : (
				<>
					<ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						{recentes.map((img) => (
							<li key={img.id}>
								{/*
								 * Abre em aba nova em vez de um lightbox: o aluno que chegou aqui
								 * está no meio de um fluxo de criação com uma FOTO já escolhida —
								 * um modal que ele feche errado, ou uma navegação, jogaria o
								 * `File` fora (ele não sobrevive a troca de página).
								 */}
								<a
									href={img.url}
									target="_blank"
									rel="noreferrer"
									title={img.title}
									className="group block overflow-hidden rounded-t-xl border border-b-0 border-slate-200 transition-colors hover:border-slate-300 dark:border-white/10 dark:hover:border-white/25"
								>
									{/* <img> cru: URL de CDN da galeria, fora do otimizador do Next. */}
									<img
										src={img.thumb}
										alt={img.title}
										loading="lazy"
										className="aspect-square w-full bg-slate-100 object-cover dark:bg-white/5"
									/>
									<span className="block truncate px-2 py-1.5 text-[11px] text-slate-600 dark:text-slate-300">
										{img.title || 'Sem título'}
									</span>
								</a>
								{/*
								 * A ÁRVORE, num botão por card — e ele NÃO navega nem abre
								 * modal, pelo mesmo motivo do link acima: a foto que o aluno
								 * escolheu no passo 2 é um `File` que não sobrevive a uma
								 * troca de página.
								 */}
								<div className="flex items-stretch rounded-b-xl border border-t-0 border-slate-200 dark:border-white/10">
									<button
										type="button"
										onClick={() =>
											setLinhagemDe((atual) =>
												atual === img.id ? null : img.id,
											)
										}
										aria-expanded={linhagemDe === img.id}
										className="flex flex-1 items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
									>
										<GitBranch className="h-3 w-3" />
										{linhagemDe === img.id ? 'fechar' : 'origem e ajustes'}
									</button>
									{/*
									 * O VÍDEO SOBREVIVE AO FECHAR DA ABA — e é por isto que ele
									 * está aqui.
									 *
									 * O MP4 vive no CDN, mas o endereço dele só existia na
									 * resposta do run: fechar a página perdia o anúncio embora o
									 * arquivo continuasse lá. Com `video_url` gravado na linha
									 * da galeria, este link é o caminho de volta.
									 *
									 * Abre em aba nova, como a imagem ao lado, e pela mesma
									 * razão: o aluno pode estar no meio de um fluxo com uma foto
									 * já escolhida, e um `File` não sobrevive a troca de página.
									 */}
									{img.videoUrl ? (
										<a
											href={img.videoUrl}
											target="_blank"
											rel="noreferrer"
											title="Abrir o vídeo do anúncio"
											className="flex items-center gap-1 border-l border-slate-200 px-2 py-1.5 text-[10px] font-medium text-slate-500 transition-colors hover:text-slate-800 dark:border-white/10 dark:text-slate-400 dark:hover:text-slate-100"
										>
											<Clapperboard className="h-3 w-3" />
											vídeo
										</a>
									) : null}
									{/*
									 * A SEGUNDA PORTA PARA O VÍDEO GERADO POR IA — a primeira é o
									 * convite no resultado, que só existe enquanto o run da arte
									 * está na tela.
									 *
									 * Esta é a que serve para a arte de ONTEM: o aluno abre a
									 * ferramenta, vê a peça no histórico e transforma em vídeo sem
									 * ter de gerar nada de novo. É navegação (não roda nem cobra
									 * nada aqui): quem mostra o preço, a ficha do que sai e o
									 * gate de saldo é a tela do vídeo, onde a compra acontece.
									 */}
									{podeOferecerVideo ? (
										<Link
											href={`/course/t/${TOOL_DO_VIDEO_IA}?arte=${encodeURIComponent(img.id)}`}
											title="Gerar um vídeo com IA a partir desta arte"
											className="flex items-center gap-1 border-l border-slate-200 px-2 py-1.5 text-[10px] font-medium text-violet-500 transition-colors hover:text-violet-400 dark:border-white/10"
										>
											<Film className="h-3 w-3" />
											vídeo IA
										</Link>
									) : null}
								</div>
							</li>
						))}
					</ul>
					{linhagemDe ? (
						<div className="rounded-xl border border-slate-200 px-3 dark:border-white/10">
							<Linhagem toolKey={toolKey} colecao={colecao} id={linhagemDe} />
						</div>
					) : null}
				</>
			)}
		</section>
	);
}
