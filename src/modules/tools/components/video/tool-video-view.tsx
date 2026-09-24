'use client';

import { useQuery } from '@tanstack/react-query';
import {
	AlertTriangle,
	Check,
	Clapperboard,
	Download,
	ExternalLink,
	Film,
	ImageOff,
	Info,
	Loader2,
	RotateCcw,
	Wand2,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { formatVox } from '@/lib/format';
import { downloadUrl } from '../../lib/prompt-bank';
import { resolveToolIcon } from '../../lib/tool-icons';
import { listCollection } from '../../services/collections.service';
import type { AiToolDefinition } from '../../services/tool-definitions.service';
import { type GalleryFilters, useGallery } from '../gallery-grid';
import {
	faltaRegraDeOuro,
	lerVideoPronto,
	precisaReenquadrar,
	tamanhoLegivel,
	type VideoPronto,
	videoUiDaDefinition,
} from './tipos';
import { useVideoRun } from './use-video-run';

/**
 * O TETO DO PEDIDO LIVRE, ecoado do servidor (`ai.video_prompt` valida
 * `pedido_do_aluno` em 600 caracteres). Vive aqui como constante e não em
 * `ui.video` de propósito: é um limite de SCHEMA, e um admin editando o
 * rascunho não pode afrouxá-lo sem que o run comece a morrer em 400 — depois de
 * cobrado.
 */
const TETO_DO_PEDIDO = 600;

/**
 * A TELA DO VÍDEO DO ANÚNCIO — o aluno comprando e recebendo o vídeo.
 *
 * ┌─ A ORDEM DA PÁGINA É A ORDEM DA DECISÃO, E ELA NÃO É ESTÉTICA ───────────┐
 * │ ① O QUE ELE JÁ TEM DE GRAÇA, ao lado do que está à venda. O aluno JÁ      │
 * │    recebeu um vídeo junto com a arte (o clipe de câmera do Ateliê). Se a  │
 * │    tela não disser em que os dois diferem, esta compra parece cobrança    │
 * │    pela mesma coisa — e a reclamação seguinte seria justa.                │
 * │ ② A ARTE. É o que faz o vídeo ser DO PRODUTO DELE; sem primeiro quadro o  │
 * │    modelo inventa outro produto.                                         │
 * │ ③ O MOVIMENTO e o FORMATO — as duas únicas coisas que ele escolhe.        │
 * │ ④ A FICHA do que sai (8 s, com áudio, marca d'água SynthID) e SÓ ENTÃO o  │
 * │    botão com o preço. Preço antes da ficha é preço sem o que se compra.   │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ TUDO O QUE ESTA TELA DIZ VEM DA DEFINITION ─────────────────────────────┐
 * │ Os textos, a comparação, os movimentos sugeridos e os formatos são DADO   │
 * │ (`ui.video`), não literais daqui. O dia em que o modelo mudar de duração  │
 * │ ou parar de gerar áudio, a correção é editar um rascunho na Fábrica — não │
 * │ esperar um deploy do front com a tela prometendo o que não entrega.       │
 * │                                                                          │
 * │ A ÚNICA exceção é o PREÇO, que vem do `useToolBilling` (ou seja, da linha │
 * │ de `public.tools`): é o mesmo número que o servidor debita, e por isso    │
 * │ não pode ser texto de definition nem constante de componente.             │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

/** A tool dona da galeria de artes. Casa com o `collection.image` do pipeline. */
const TOOL_DA_GALERIA = 'estudio_imagens';
const COLECAO_DE_VIDEOS = 'videos';

/** Identidade ESTÁVEL: `filters` entra na `queryKey`. Ver `galeria.tsx`. */
const SEM_FILTRO: GalleryFilters = { modo: '', favoritos: false, q: '' };

/** Quantas artes cabem no seletor sem ele virar a tela inteira. */
const TETO_DE_ARTES = 12;

export interface ToolVideoViewProps {
	def: AiToolDefinition;
	toolKey: string;
}

export function ToolVideoView({ def, toolKey }: ToolVideoViewProps) {
	const ui = useMemo(() => videoUiDaDefinition(def.definition), [def]);
	const run = useVideoRun(toolKey);
	const { billing } = run;

	/**
	 * A ARTE PODE VIR POR LINK. É assim que o botão "Transformar em vídeo" do
	 * Ateliê (no resultado e na galeria) chega aqui já com a peça escolhida — em
	 * vez de largar o aluno num seletor e esperar que ele reencontre a arte que
	 * acabou de ver.
	 */
	const params = useSearchParams();
	const arteDoLink = params.get('arte') ?? '';

	const [arteId, setArteId] = useState(arteDoLink);
	const [aspecto, setAspecto] = useState(ui.formatos[0]?.value ?? '9:16');
	/**
	 * ┌─ NASCE VAZIO — E ISTO É MEDIÇÃO, NÃO GOSTO ─────────────────────────────┐
	 * │ A tela pré-marcava `sugestoes[0]`, e `sugestoes[0]` era o candidato A    │
	 * │ das quatro gerações reais. Movimento médio entre quadros consecutivos:   │
	 * │ A = 1,11 contra 3,80 do escolhido — oito segundos em que a peça quase    │
	 * │ não muda de tamanho, e foi o único que voltou praticamente mudo. Quem só │
	 * │ clica "Gerar" (a maioria) pagava 12 voxxys pelo pior dos quatro.         │
	 * │                                                                          │
	 * │ Hoje quem escreve o roteiro é o Diretor de Movimento, que VÊ a arte      │
	 * │ antes — e foi ele que produziu o melhor dos quatro. Vazio é o caminho    │
	 * │ bom; o que o aluno digitar entra como PEDIDO dele, não como volante.     │
	 * └──────────────────────────────────────────────────────────────────────────┘
	 */
	const [movimento, setMovimento] = useState('');
	const [sugestaoAtiva, setSugestaoAtiva] = useState('');

	const galeria = useGallery(TOOL_DA_GALERIA, 'galeria', SEM_FILTRO);
	const artes = useMemo(
		() => galeria.images.slice(0, TETO_DE_ARTES),
		[galeria.images],
	);
	const arte = useMemo(
		() => artes.find((a) => a.id === arteId) ?? null,
		[artes, arteId],
	);

	/**
	 * O link mandou uma arte que não está entre as recentes (ela é antiga, ou de
	 * outro dono). Cair em branco é melhor do que fingir seleção: o run morreria
	 * em 404 no `collection.image` — depois de cobrado.
	 */
	useEffect(() => {
		if (!arteDoLink) return;
		if (galeria.isLoading) return;
		if (!galeria.images.some((a) => a.id === arteDoLink)) setArteId('');
	}, [arteDoLink, galeria.isLoading, galeria.images]);

	const rodando = run.estado === 'rodando' || run.estado === 'retomando';
	/**
	 * Só cobra a regra de ouro de quem ESCREVEU alguma coisa. Num campo vazio o
	 * pedido é do Diretor de Movimento, e ele já recompõe as três travas em
	 * código — avisar ali seria acusar o aluno de apagar uma frase que ele nunca
	 * viu.
	 */
	const semRegra =
		movimento.trim().length > 0 &&
		faltaRegraDeOuro(movimento, ui.movimento.regraDeOuro);
	const vaiReenquadrar = arte
		? precisaReenquadrar(arte.largura, arte.altura, aspecto)
		: false;

	/**
	 * O BOTÃO SÓ DISPARA COM ARTE E COM MOVIMENTO — e os dois são exigidos AQUI,
	 * não descobertos no servidor. Um run que morre em 400 depois de o `/invoke`
	 * ter debitado 12 voxxys é estornado, sim, mas o aluno vê um erro por um
	 * campo em branco que a tela podia ter apontado antes.
	 */
	const podeRodar =
		!rodando &&
		!billing.pending &&
		!billing.insufficient &&
		Boolean(arteId) &&
		/**
		 * ⚠ O CAMPO É OPCIONAL DE VERDADE. Ele se chamava "(opcional)" e ao mesmo
		 * tempo travava o botão enquanto estivesse vazio — dois lados dizendo
		 * coisas opostas sobre o mesmo campo, e quem apagasse não conseguia gerar.
		 * Com o Diretor de Movimento no pipeline, vazio é o caminho BOM.
		 */
		(ui.movimento.opcional || movimento.trim().length > 0);

	const acento = { '--screen-accent': '#8b5cf6' } as CSSProperties;

	return (
		<div style={acento} className="mx-auto w-full max-w-4xl space-y-8">
			<header className="space-y-1">
				<h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
					<Clapperboard className="h-5 w-5 text-violet-500" />
					{ui.titulo}
				</h1>
				<p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
					{ui.subtitulo}
				</p>
			</header>

			{/* ═══ o resultado toma a tela quando existe ═══ */}
			{run.estado === 'pronto' && run.video ? (
				<VideoEntregue
					video={run.video}
					titulo={ui.pronto.titulo}
					nota={ui.pronto.nota}
					aoRefazer={run.limpar}
				/>
			) : rodando ? (
				<EmProcessamento
					titulo={ui.espera.titulo}
					nota={ui.espera.nota}
					fase={run.progresso?.fase ?? ''}
					decorridoS={run.progresso?.decorridoS ?? 0}
					desconectado={run.desconectado}
				/>
			) : (
				<>
					{run.erro ? (
						<p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-[13px] leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-300">
							<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
							{run.erro}
						</p>
					) : null}

					<Comparacao ui={ui} custo={billing.effectiveCost} />

					{/* ── passo 1: a arte ── */}
					<section className="space-y-3">
						<Titulo n={1} texto={ui.arte.titulo} ajuda={ui.arte.ajuda} />
						{galeria.isLoading ? (
							<div className="flex justify-center py-10">
								<Loader2 className="h-5 w-5 animate-spin text-slate-400" />
							</div>
						) : artes.length === 0 ? (
							<p className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 p-4 text-[13px] leading-relaxed text-slate-500 dark:border-white/10 dark:text-slate-400">
								<ImageOff className="h-4 w-4 shrink-0" />
								{ui.arte.vazio}
							</p>
						) : (
							<ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
								{artes.map((a) => (
									<li key={a.id}>
										<button
											type="button"
											onClick={() => setArteId(a.id)}
											aria-pressed={arteId === a.id}
											title={a.title}
											className={`relative block w-full overflow-hidden rounded-xl border-2 transition-colors ${
												arteId === a.id
													? 'border-violet-500'
													: 'border-transparent hover:border-slate-300 dark:hover:border-white/25'
											}`}
										>
											{/* <img> cru: URL de CDN da galeria, fora do otimizador. */}
											<img
												src={a.thumb}
												alt={a.title}
												loading="lazy"
												className="aspect-square w-full bg-slate-100 object-cover dark:bg-white/5"
											/>
											{arteId === a.id ? (
												<span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-violet-500 text-white">
													<Check className="h-3 w-3" />
												</span>
											) : null}
										</button>
									</li>
								))}
							</ul>
						)}
					</section>

					{/* ── passo 2: o formato ── */}
					<section className="space-y-3">
						<Titulo n={2} texto="Em que formato?" ajuda="" />
						<div className="grid gap-3 sm:grid-cols-2">
							{ui.formatos.map((f) => {
								const Icone = resolveToolIcon(f.icon);
								const ativo = aspecto === f.value;
								return (
									<button
										key={f.value}
										type="button"
										onClick={() => setAspecto(f.value)}
										aria-pressed={ativo}
										className={`rounded-2xl border p-4 text-left transition-colors ${
											ativo
												? 'border-violet-500 bg-violet-500/5'
												: 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/25'
										}`}
									>
										<span className="flex items-center gap-2 text-[13px] font-semibold text-slate-800 dark:text-slate-100">
											<Icone className="h-4 w-4 text-violet-500" />
											{f.label}
										</span>
										{f.hint ? (
											<span className="mt-1 block text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
												{f.hint}
											</span>
										) : null}
									</button>
								);
							})}
						</div>

						{/*
						 * ⚠ O AVISO DE PROPORÇÃO, ANTES DO CLIQUE.
						 *
						 * Arte fora da proporção entra inteira, com as sobras desfocadas —
						 * melhor que a tarja preta que o modelo faria sozinho, mas pior que
						 * uma arte que já nasceu 9:16. Depois de pago, explicar por que as
						 * laterais estão borradas é desculpa; antes, é aviso.
						 */}
						{vaiReenquadrar && ui.arte.avisoProporcao ? (
							<p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-[12px] leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-300">
								<AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
								{ui.arte.avisoProporcao}
							</p>
						) : null}
					</section>

					{/* ── passo 3: o movimento ── */}
					<section className="space-y-3">
						<Titulo
							n={3}
							texto={ui.movimento.titulo}
							ajuda={ui.movimento.ajuda}
						/>
						{ui.movimento.sugestoes.length > 0 ? (
							<div className="flex flex-wrap gap-2">
								{ui.movimento.sugestoes.map((s) => (
									<button
										key={s.value}
										type="button"
										onClick={() => {
											setSugestaoAtiva(s.value);
											setMovimento(s.texto);
										}}
										className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
											sugestaoAtiva === s.value
												? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-300'
												: 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/25'
										}`}
									>
										{s.label}
									</button>
								))}
							</div>
						) : null}

						<textarea
							value={movimento}
							onChange={(e) => {
								setMovimento(e.target.value);
								setSugestaoAtiva('');
							}}
							rows={4}
							placeholder={ui.movimento.placeholder}
							/**
							 * ⚠ O TETO É DO SERVIDOR, ECOADO AQUI. `ai.video_prompt` valida
							 * `pedido_do_aluno` em 600 caracteres; sem este `maxLength`, colar
							 * 700 derrubava o run com uma mensagem de desenvolvedor
							 * ("params inválidos no nó 'movimento'…") DEPOIS de o `/invoke`
							 * ter debitado 12 voxxys. Estornado, sim — mas é o texto errado
							 * na tela pelo motivo errado.
							 */
							maxLength={TETO_DO_PEDIDO}
							className="w-full rounded-xl border border-slate-200 bg-white p-3 text-[13px] leading-relaxed text-slate-800 outline-none transition-colors focus:border-violet-400 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-100"
						/>

						{/*
						 * ⚠ AS DUAS COISAS QUE O MODELO FAZ E O ALUNO NÃO ESPERA — ditas
						 * ANTES do clique, porque depois de pago vira desculpa.
						 *
						 * Ambas medidas nas quatro gerações reais: texto chapado na arte
						 * desbota nos primeiros segundos (4 de 4, sem exceção), e descrever
						 * tipografia no pedido corrompeu o logo do aluno na única geração
						 * que o fez. A regra de ouro fala de forma, cor e acabamento — não
						 * cobre nenhum dos dois casos, e por isso eles têm aviso próprio.
						 */}
						{ui.movimento.avisoTexto && movimento.trim().length > 0 ? (
							<p className="flex items-start gap-2 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
								<AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
								{ui.movimento.avisoTexto}
							</p>
						) : null}
						{ui.movimento.avisoManchete ? (
							<p className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-[12px] leading-relaxed text-slate-600 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
								<Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
								{ui.movimento.avisoManchete}
							</p>
						) : null}

						{/*
						 * ⚠ A FRASE QUE SEGURA O PRODUTO NO LUGAR.
						 *
						 * Medido: sem ela o modelo REMODELA a peça e o aluno recebe o vídeo
						 * de um produto que ele não fabrica. Avisamos em vez de reescrever
						 * por baixo — o texto é dele, e há casos legítimos de quem QUER a
						 * peça se transformando.
						 */}
						{semRegra ? (
							<div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 dark:border-amber-500/30 dark:bg-amber-500/5">
								<p className="text-[12px] leading-relaxed text-amber-800 dark:text-amber-300">
									Sem a frase <strong>“{ui.movimento.regraDeOuro}”</strong> o
									vídeo pode sair com o produto diferente do seu.
								</p>
								<button
									type="button"
									onClick={() =>
										setMovimento(
											`${movimento.trim()} ${ui.movimento.regraDeOuro}`.trim(),
										)
									}
									className="shrink-0 rounded-md bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-amber-700"
								>
									Colocar de volta
								</button>
							</div>
						) : null}
					</section>

					{/* ── o que ele está comprando, e só então o preço ── */}
					<FichaDaEntrega ui={ui} />

					<section className="space-y-2">
						<button
							type="button"
							disabled={!podeRodar}
							onClick={() => run.rodar({ arteId, movimento, aspecto })}
							className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
						>
							{billing.pending ? (
								<Loader2 className="h-5 w-5 animate-spin" />
							) : (
								<Wand2 className="h-5 w-5" />
							)}
							{/*
							 * ⚠ O PREÇO ESTÁ NO BOTÃO, NÃO SÓ NO AVISO ABAIXO.
							 *
							 * O aviso inline (`billing.notice`) é o padrão de todas as tools e
							 * continua aqui — mas ele é cinza, pequeno e fica DEPOIS do
							 * clique na leitura de quem varre a página. Numa compra de 12
							 * voxxys, o número tem que estar dentro do próprio botão: ninguém
							 * pode clicar sem ter lido quanto custa.
							 *
							 * `billing.cost` (e não uma constante 12) porque a fonte de
							 * verdade é a linha de `public.tools` que o servidor debita.
							 */}
							{billing.billed && billing.effectiveCost > 0
								? `Gerar o vídeo — ${formatVox(billing.effectiveCost)} voxxys`
								: 'Gerar o vídeo'}
						</button>

						{/*
						 * O aviso padrão: com saldo, mostra custo e saldo; SEM saldo, vira
						 * "Saldo insuficiente" com o botão "Comprar voxxys". É por isso que
						 * o botão acima fica desabilitado em vez de disparar e falhar em
						 * 402 — botão morto sem caminho de saída já aconteceu aqui.
						 */}
						{billing.notice}

						{!arteId && artes.length > 0 ? (
							<p className="text-[12px] text-slate-500 dark:text-slate-400">
								Escolha uma arte no passo 1 para continuar.
							</p>
						) : null}
						{artes.length === 0 && !galeria.isLoading ? (
							<Link
								href={`/course/t/${TOOL_DA_GALERIA}`}
								className="inline-flex items-center gap-1 text-[12px] font-medium text-violet-500 hover:text-violet-400"
							>
								Criar uma arte no Estúdio de Imagens
								<ExternalLink className="h-3 w-3" />
							</Link>
						) : null}
					</section>
				</>
			)}

			<MeusVideos
				toolKey={toolKey}
				titulo={ui.historico.titulo}
				vazio={ui.historico.vazio}
				/** Recarrega quando um vídeo novo fica pronto. */
				chave={run.video?.entryId ?? ''}
			/>
		</div>
	);
}

/* ═══════════════════ pedaços ═══════════════════ */

function Titulo({
	n,
	texto,
	ajuda,
}: {
	n: number;
	texto: string;
	ajuda: string;
}) {
	return (
		<div className="space-y-1">
			<h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-slate-400">
				<span className="grid h-5 w-5 place-items-center rounded-full bg-violet-500/15 text-[11px] font-bold text-violet-500">
					{n}
				</span>
				{texto}
			</h2>
			{ajuda ? (
				<p className="text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
					{ajuda}
				</p>
			) : null}
		</div>
	);
}

/**
 * O DEGRAU DE BAIXO E O DE CIMA, LADO A LADO.
 *
 * O aluno já ganhou um vídeo com a arte. Vender outro sem mostrar a diferença é
 * o caminho mais curto para "vocês estão cobrando de novo pela mesma coisa" — e
 * ele teria razão de perguntar. A coluna da esquerda existe para ele reconhecer
 * o que já tem; a da direita, para ver o que muda.
 */
function Comparacao({
	ui,
	custo,
}: {
	ui: ReturnType<typeof videoUiDaDefinition>;
	custo: number;
}) {
	const c = ui.comparacao;
	return (
		<section className="space-y-2">
			<div className="grid gap-3 sm:grid-cols-2">
				<div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
					<div className="flex items-baseline justify-between gap-2">
						<h3 className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
							{c.gratis.titulo}
						</h3>
						<span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
							{c.gratis.preco || 'Incluído'}
						</span>
					</div>
					<ul className="mt-2 space-y-1">
						{c.gratis.itens.map((i) => (
							<li
								key={i}
								className="flex items-start gap-1.5 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400"
							>
								<Check className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
								{i}
							</li>
						))}
					</ul>
				</div>

				<div className="rounded-2xl border border-violet-500/40 bg-violet-500/[0.04] p-4">
					<div className="flex items-baseline justify-between gap-2">
						<h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-800 dark:text-slate-100">
							<Film className="h-3.5 w-3.5 text-violet-500" />
							{c.pago.titulo}
						</h3>
						{/*
						 * O preço aparece AQUI também, e vem do billing — não de
						 * `c.pago.preco`. Um preço escrito na definition envelheceria em
						 * silêncio no dia em que o admin mudasse o `vox_cost` da linha de
						 * catálogo, e a tela passaria a anunciar um número que o servidor
						 * não cobra.
						 */}
						{custo > 0 ? (
							<span className="shrink-0 rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-600 dark:text-violet-300">
								{formatVox(custo)} voxxys
							</span>
						) : null}
					</div>
					<ul className="mt-2 space-y-1">
						{c.pago.itens.map((i) => (
							<li
								key={i}
								className="flex items-start gap-1.5 text-[12px] leading-relaxed text-slate-600 dark:text-slate-300"
							>
								<Check className="mt-0.5 h-3 w-3 shrink-0 text-violet-500" />
								{i}
							</li>
						))}
					</ul>
				</div>
			</div>
			{c.nota ? (
				<p className="text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
					{c.nota}
				</p>
			) : null}
		</section>
	);
}

/**
 * A FICHA DO QUE SAI — 8 segundos, com áudio, marca d'água SynthID.
 *
 * A marca d'água é o item que ninguém pediu e que precisa estar aqui: o Google
 * grava um selo INVISÍVEL de "gerado por IA" no arquivo, e um aluno que publica
 * conteúdo comercial tem direito de saber disso ANTES de pagar — não de
 * descobrir depois, por uma plataforma que o detectou.
 */
function FichaDaEntrega({
	ui,
}: {
	ui: ReturnType<typeof videoUiDaDefinition>;
}) {
	if (ui.entrega.length === 0) return null;
	return (
		<section className="grid gap-3 rounded-2xl border border-slate-200 p-4 dark:border-white/10 sm:grid-cols-2">
			{ui.entrega.map((i) => {
				const Icone = resolveToolIcon(i.icon);
				return (
					<div key={i.titulo} className="flex items-start gap-2.5">
						<Icone className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
						<div>
							<p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
								{i.titulo}
							</p>
							<p className="text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
								{i.texto}
							</p>
						</div>
					</div>
				);
			})}
		</section>
	);
}

/** `enfileirado` → texto de gente. O aluno não precisa da palavra "job". */
const FRASE_DA_FASE: Record<string, string> = {
	enfileirado: 'Mandamos a sua arte para o gerador…',
	aguardando: 'O gerador está montando o movimento…',
	baixando: 'Trazendo o vídeo pronto…',
};

/**
 * ENQUANTO PROCESSA — e a frase "pode sair desta tela" é INFORMAÇÃO, não
 * gentileza.
 *
 * O run leva minutos. Um aluno que não sabe que pode sair fica olhando a tela —
 * ou, pior, recarrega a página achando que travou, e aí acha que perdeu os 12
 * voxxys. O trabalho é gravado na coleção ANTES de a resposta sair, então
 * fechar a aba não perde nada, e a tela precisa dizer isso com todas as letras.
 */
function EmProcessamento({
	titulo,
	nota,
	fase,
	decorridoS,
	desconectado,
}: {
	titulo: string;
	nota: string;
	fase: string;
	decorridoS: number;
	desconectado: boolean;
}) {
	return (
		<section className="space-y-4 rounded-2xl border border-violet-500/30 bg-violet-500/[0.03] p-6 text-center">
			<Loader2 className="mx-auto h-7 w-7 animate-spin text-violet-500" />
			<div className="space-y-1">
				<h2 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">
					{titulo}
				</h2>
				<p className="text-[13px] text-slate-500 dark:text-slate-400">
					{FRASE_DA_FASE[fase] ?? 'Preparando…'}
					{decorridoS > 0 ? ` (${decorridoS}s)` : ''}
				</p>
			</div>
			<p className="mx-auto max-w-lg text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
				{nota}
			</p>
			{/*
			 * O SOCKET CAIU, MAS O TRABALHO NÃO. O `/stream` da main API engole erro
			 * de escrita justamente para não jogar fora um run já cobrado: o vídeo
			 * continua sendo gerado e GRAVADO. Dizer "falhou" aqui seria mentir e
			 * empurrar o aluno a pagar de novo por um vídeo que já existe.
			 */}
			{desconectado ? (
				<p className="mx-auto max-w-lg rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-[12px] leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-300">
					Perdemos o acompanhamento ao vivo, mas o seu vídeo continua sendo
					gerado no servidor. Ele aparece em “Meus vídeos” assim que ficar
					pronto — inclusive se você fechar esta página.
				</p>
			) : null}
		</section>
	);
}

/**
 * O VÍDEO PRONTO.
 *
 * ┌─ O PLAYER, ATRIBUTO POR ATRIBUTO — e um deles é diferente do Ateliê ─────┐
 * │ `controls`   ele TOCA na página; não é um link para um arquivo.          │
 * │ `loop`       oito segundos acabam antes de o olho terminar.              │
 * │ `playsInline` no iPhone, sem ele o Safari sequestra para tela cheia.     │
 * │ `preload="metadata"` só o cabeçalho: a barra de tempo nasce certa sem a  │
 * │              página puxar megabytes por conta própria.                    │
 * │ `poster`     sem ele o player é um retângulo preto, que se lê como coisa │
 * │              quebrada.                                                    │
 * │                                                                          │
 * │ ⚠ NÃO tem `muted`, e essa é a diferença. O clipe do Ateliê é mudo de     │
 * │ propósito e ali `muted` evitava um botão de som que não faz nada. AQUI   │
 * │ O VÍDEO TEM TRILHA — foi isso que o aluno comprou. Iniciar silenciado    │
 * │ esconderia metade do produto.                                            │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
function VideoEntregue({
	video,
	titulo,
	nota,
	aoRefazer,
}: {
	video: VideoPronto;
	titulo: string;
	nota: string;
	aoRefazer: () => void;
}) {
	const peso = tamanhoLegivel(video.bytes);
	const medida =
		video.largura > 0 && video.altura > 0
			? `${video.largura} × ${video.altura}`
			: '';

	return (
		<section className="space-y-3">
			<div className="flex flex-wrap items-baseline justify-between gap-3">
				<h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-slate-400">
					<Clapperboard className="h-4 w-4" />
					{titulo}
				</h2>
				{video.rotulo ? (
					<span className="text-[12px] text-slate-500">{video.rotulo}</span>
				) : null}
			</div>

			<div className="grid gap-5 rounded-3xl border border-slate-200 p-4 dark:border-white/10 sm:grid-cols-[minmax(0,300px)_1fr] sm:p-5">
				{/*
				 * `<video>` cru, fora de qualquer wrapper do Next: a fonte é URL de CDN
				 * e não passa por otimizador nenhum. `max-h-[70vh]` porque 9:16 é ALTO —
				 * sem teto, o player empurra o resto da página para fora da tela.
				 *
				 * Sem `<track>` de legenda: a trilha que o modelo gera é ambiente e
				 * efeito (luz, superfície, sala), não FALA — não há diálogo para
				 * transcrever. Uma trilha `.vtt` vazia satisfaria o verificador e não
				 * daria nada a ninguém; e o vídeo do Ateliê logo ao lado passa no mesmo
				 * verificador só porque é `muted`, o que aqui seria pior: esconderia
				 * exatamente o que o aluno pagou para ter.
				 */}
				{/* biome-ignore lint/a11y/useMediaCaption: trilha de ambiente gerada pelo modelo, sem diálogo — não há o que legendar, e o vídeo NÃO pode nascer `muted` porque o áudio é parte do que foi vendido */}
				<video
					src={video.url}
					poster={video.posterUrl || undefined}
					controls
					loop
					playsInline
					preload="metadata"
					className="max-h-[70vh] w-full rounded-2xl bg-black object-contain"
				/>

				<div className="flex flex-col gap-3">
					{nota ? (
						<p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
							{nota}
						</p>
					) : null}

					{/*
					 * A FICHA DO ARQUIVO. Quem vai publicar precisa saber o que está
					 * mandando: proporção, duração e PESO — o teto do Instagram é 100 MB.
					 */}
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
						{medida ? <span>{medida} px</span> : null}
						{video.duracaoS > 0 ? <span>{video.duracaoS}s</span> : null}
						{peso ? <span>{peso}</span> : null}
						<span>MP4</span>
						{video.comAudio ? <span>com áudio</span> : null}
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={() => downloadUrl(video.url, 'anuncio.mp4')}
							className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-violet-500"
						>
							<Download className="h-4 w-4" />
							Baixar o vídeo
						</button>
						<a
							href={video.url}
							target="_blank"
							rel="noreferrer"
							className="flex items-center gap-1 text-[12px] text-slate-500 transition-colors hover:text-slate-800 dark:hover:text-white"
						>
							Abrir em outra aba
							<ExternalLink className="h-3 w-3" />
						</a>
						{/*
						 * "Fazer outro" e NÃO "refazer": este botão volta ao formulário, e
						 * o próximo clique COBRA DE NOVO. A palavra "refazer" sugeriria
						 * correção de graça de um vídeo que não agradou — e cobrar por
						 * isso, depois de a tela ter dito "refazer", seria armadilha.
						 */}
						<button
							type="button"
							onClick={aoRefazer}
							className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:border-slate-300 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/25"
						>
							<RotateCcw className="h-3.5 w-3.5" />
							Fazer outro vídeo
						</button>
					</div>

					{/*
					 * As RESSALVAS de um vídeo que SAIU — a arte foi reenquadrada, por
					 * exemplo. Não é erro: é a diferença entre o aluno ler o borrão das
					 * laterais como defeito e ler como consequência de uma escolha dele.
					 */}
					{video.avisos.map((a) => (
						<p
							key={a}
							className="text-[12px] leading-relaxed text-amber-600 dark:text-amber-300/80"
						>
							{a}
						</p>
					))}
				</div>
			</div>
		</section>
	);
}

/**
 * "MEUS VÍDEOS" — o lugar que a promessa "pode fechar a aba" aponta.
 *
 * Sem esta seção, a decisão de projeto de "o socket cair não é erro" não teria
 * onde aterrissar: o aluno que perde a conexão num run de 12 voxxys não teria
 * como reencontrar o arquivo, e a única saída dele seria pagar de novo por um
 * vídeo que já existe. É a mesma seção (e o mesmo motivo) de "Minhas artes" no
 * Ateliê.
 *
 * A seção NUNCA some — nem vazia, nem em erro. Sumir justamente no caso em que
 * o aluno veio procurar seria devolver a promessa ao vazio.
 */
function MeusVideos({
	toolKey,
	titulo,
	vazio,
	chave,
}: {
	toolKey: string;
	titulo: string;
	vazio: string;
	chave: string;
}) {
	const { data, isLoading, isError } = useQuery({
		queryKey: ['meus-videos', toolKey, chave],
		queryFn: () =>
			listCollection(toolKey, COLECAO_DE_VIDEOS, {
				page: 1,
				pageSize: 8,
				sort: 'recent',
				mine: true,
			}),
		staleTime: 15_000,
	});

	const itens = useMemo(
		() =>
			(data?.items ?? [])
				.map((e) => ({ id: e.id, title: e.title, v: lerVideoPronto(e.data) }))
				.filter((i): i is { id: string; title: string; v: VideoPronto } =>
					Boolean(i.v),
				),
		[data],
	);

	return (
		<section className="space-y-3 border-t border-slate-200 pt-6 dark:border-white/10">
			<h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
				{titulo}
			</h2>

			{isLoading ? (
				<div className="flex justify-center py-6">
					<Loader2 className="h-5 w-5 animate-spin text-slate-400" />
				</div>
			) : isError ? (
				<p className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-300">
					Não consegui carregar os seus vídeos agora. Recarregue em instantes —
					nenhum deles foi perdido.
				</p>
			) : itens.length === 0 ? (
				<p className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 p-4 text-xs leading-relaxed text-slate-500 dark:border-white/10 dark:text-slate-400">
					<Film className="h-4 w-4 shrink-0" />
					{vazio}
				</p>
			) : (
				<ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					{itens.map((i) => (
						<li key={i.id} className="space-y-1">
							{/*
							 * O CARTÃO É A CAPA, NÃO UM PLAYER. Oito players de MP4 numa
							 * grade pediriam oito conexões e o cabeçalho de cada arquivo só
							 * para desenhar miniatura. A capa é um JPEG; o vídeo abre no
							 * clique.
							 */}
							<a
								href={i.v.url}
								target="_blank"
								rel="noreferrer"
								title={i.title}
								className="group relative block overflow-hidden rounded-xl border border-slate-200 transition-colors hover:border-slate-300 dark:border-white/10 dark:hover:border-white/25"
							>
								{i.v.posterUrl ? (
									// <img> cru: URL de CDN, fora do otimizador do Next.
									<img
										src={i.v.posterUrl}
										alt={i.title}
										loading="lazy"
										className="aspect-square w-full bg-black object-contain"
									/>
								) : (
									<span className="flex aspect-square w-full items-center justify-center bg-slate-100 dark:bg-white/5">
										<Film className="h-5 w-5 text-slate-400" />
									</span>
								)}
								<span className="absolute inset-0 grid place-items-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
									<Clapperboard className="h-6 w-6 text-white" />
								</span>
							</a>
							<p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
								{i.title || 'Vídeo'}
							</p>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
