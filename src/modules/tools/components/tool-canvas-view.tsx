'use client';

import { Loader2, Sparkles, Wand2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
	type CSSProperties,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { VoxxysIcon } from '@/components/ui/voxxys-icon';
import { useEntitlements } from '@/hooks/use-entitlements';
import { formatVox } from '@/lib/format';
import { useImageModelCatalog } from '../hooks/use-image-model-catalog';
import { useToolBilling } from '../hooks/use-tool-billing';
import { resolveToolIcon } from '../lib/tool-icons';
import {
	deleteCollectionEntry,
	updateCollectionEntry,
} from '../services/collections.service';
import {
	enhancePrompt,
	galleryToVector,
	urlToFile,
} from '../services/image-studio.service';
import {
	type AiToolDefinition,
	runToolEngine,
	type ToolRunResult,
} from '../services/tool-definitions.service';
import {
	type GalleryFilters,
	GalleryGrid,
	type GalleryImage,
	useGallery,
} from './gallery-grid';
import { ImageLightbox, type LightboxAction } from './image-lightbox';
import { MaskPainter } from './mask-painter';
import { ScreenNotice } from './screen-notice';
import { StudioDropzone } from './studio-dropzone';
import { type StyleChoice, StyleStrip } from './style-strip';
import { TilePreview } from './tile-preview';

/**
 * LAYOUT `canvas` — a tela do ESTÚDIO DE IMAGENS.
 *
 * A diferença para os Prompts Mágicos não é visual, é de fluxo: lá o aluno
 * escolhe um prompt do banco do admin e recebe uma imagem; aqui ele escreve o
 * que quiser, abre o próprio resultado e continua trabalhando em cima dele
 * (variar → editar → ampliar → vetorizar). Toda ação do lightbox volta para o
 * composer com o modo certo e a imagem já carregada como referência — é isso
 * que fecha o laço.
 *
 * A tela é GENÉRICA: modos, o que cada modo mostra e exige, custo, notas e a
 * biblioteca de estilos saem de `definition.ui.canvas`. Nenhum modo é
 * conhecido pelo nome aqui dentro, com uma exceção declarada: `editar_mascara`
 * troca o campo de imagem pelo pincel, porque pintar máscara não é um widget
 * genérico.
 */

/* ─────────────────────────── tipos da definition ─────────────────────────── */

export interface CanvasMode {
	value: string;
	label: string;
	icon?: string;
	/** Campos obrigatórios (`prompt`, `imagem`). */
	needs?: string[];
	/** Campos exibidos (`prompt`, `imagem`, `aspect`, `factor`, `estilos`…). */
	shows?: string[];
	/** Multiplicador declarado sobre o `vox_cost`. Ver o aviso de cobrança. */
	cost?: number;
	note?: string;
	/** `tile3x3` liga a prévia de textura repetida. */
	preview?: string;
}

export interface CanvasSpec {
	modes?: CanvasMode[];
	tilePreview?: { repeat?: number };
	styles?: {
		collection?: string;
		bind?: {
			style_suffix?: string;
			style_system?: string;
			cover?: string;
			label?: string;
		};
	};
	labels?: Record<string, string>;
}

/* ─────────────────────────── constantes ─────────────────────────── */

/**
 * TETO DE CONCORRÊNCIA DO LOTE. Não existe fila de jobs em nenhum dos três
 * repositórios: um lote de N imagens é o front disparando N runs de verdade.
 * Quatro em paralelo é o que a main API absorve sem estrangular os outros
 * alunos; acima disso seria preciso uma fila durável, que é outro projeto.
 */
const MAX_CONCURRENCY = 4;
const BATCH_OPTIONS = [1, 2, 4];

const IMAGE_SLOTS = ['imagem', 'imagem2', 'imagem3'] as const;

/** Executa `tasks` com no máximo `limit` em voo. Sem dependência externa. */
async function runPool<T>(
	tasks: (() => Promise<T>)[],
	limit: number,
): Promise<PromiseSettledResult<T>[]> {
	const results: PromiseSettledResult<T>[] = new Array(tasks.length);
	let next = 0;
	const worker = async () => {
		while (next < tasks.length) {
			const i = next++;
			try {
				results[i] = { status: 'fulfilled', value: await tasks[i]() };
			} catch (reason) {
				results[i] = { status: 'rejected', reason };
			}
		}
	};
	await Promise.all(
		Array.from({ length: Math.min(limit, tasks.length) }, worker),
	);
	return results;
}

/* ─────────────────────────── componente ─────────────────────────── */

interface Props {
	def: AiToolDefinition;
	toolKey: string;
	spec: CanvasSpec;
	isStaff: boolean;
	isDraft: boolean;
	title?: string;
	subtitle?: string;
	notice?: {
		type?: 'info' | 'warning' | 'success';
		title?: string;
		message?: string;
	} | null;
}

export function ToolCanvasView({
	def,
	toolKey,
	spec,
	isStaff,
	isDraft,
	title,
	subtitle,
	notice,
}: Props) {
	const router = useRouter();
	const { courses } = useEntitlements();
	const courseSlug = courses[0]?.slug;

	const modes = useMemo<CanvasMode[]>(
		() => (spec.modes?.length ? spec.modes : []),
		[spec.modes],
	);
	const historySource =
		(def.definition.ui as { history?: { source?: string } } | undefined)
			?.history?.source ?? 'galeria';

	/* ── estado do composer ── */
	const [modeValue, setModeValue] = useState(modes[0]?.value ?? '');
	const [prompt, setPrompt] = useState('');
	const [aspect, setAspect] = useState<string>(
		(def.definition.input.aspect?.default as string) ?? '1:1',
	);
	const [factor, setFactor] = useState<string>(
		(def.definition.input.factor?.default as string) ?? '2',
	);
	const [images, setImages] = useState<(File | null)[]>([null, null, null]);
	const [mask, setMask] = useState<File | null>(null);
	const [style, setStyle] = useState<StyleChoice | null>(null);
	const [batch, setBatch] = useState(1);
	const [modelId, setModelId] = useState('');
	const [parentId, setParentId] = useState<string | null>(null);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [enhancing, setEnhancing] = useState(false);

	/* ── estado da galeria ── */
	const [filters, setFilters] = useState<GalleryFilters>({
		modo: '',
		favoritos: false,
		q: '',
	});
	const [open, setOpen] = useState<GalleryImage | null>(null);
	const [running, setRunning] = useState(0);
	const [vectorizing, setVectorizing] = useState(false);
	const [lastResult, setLastResult] = useState<ToolRunResult | null>(null);

	const composerRef = useRef<HTMLDivElement>(null);
	const models = useImageModelCatalog();

	/**
	 * `variationCount = 1` de propósito: cada imagem do lote é uma invocação
	 * própria (cobra e liquida sozinha). Passar o tamanho do lote aqui faria o
	 * upvox multiplicar o custo DENTRO de cada invocação — N invocações de N×,
	 * ou seja N² voxxys.
	 */
	const billing = useToolBilling(toolKey, courseSlug, 1);
	/**
	 * BILLING SEPARADO PARA A PONTE. Mandar a imagem para a Vetorização cobra a
	 * tool `vectorize` — é o que o `resolveToolBilling` do endpoint valida. Reusar
	 * o `billing` do Estúdio aqui criaria uma invocação de `estudio_imagens`, o
	 * back rejeitaria com `invalid_invocation` e o débito ficaria pendente para
	 * sempre. A tela da Vetorização usa exatamente este mesmo hook.
	 */
	const vectorBilling = useToolBilling('vectorize', courseSlug, 1);
	const gallery = useGallery(toolKey, historySource, filters, !isDraft);

	const mode = useMemo(
		() => modes.find((m) => m.value === modeValue) ?? modes[0],
		[modes, modeValue],
	);
	const shows = useCallback(
		(field: string) => !!mode?.shows?.includes(field),
		[mode],
	);
	const labelOf = useCallback(
		(value: string) =>
			spec.labels?.[value] ??
			modes.find((m) => m.value === value)?.label ??
			value,
		[spec.labels, modes],
	);

	const aspectOptions = (def.definition.input.aspect?.options ??
		[]) as string[];
	const factorOptions = (def.definition.input.factor?.options ??
		[]) as string[];

	/** URL local da imagem base — o pincel de máscara precisa dela. */
	const [baseUrl, setBaseUrl] = useState<string | null>(null);
	useEffect(() => {
		const f = images[0];
		if (!f) {
			setBaseUrl(null);
			return;
		}
		const url = URL.createObjectURL(f);
		setBaseUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [images]);

	/* ── validação local (espelha o `superRefine` do bloco) ── */
	const missing = useMemo(() => {
		const needs = mode?.needs ?? [];
		if (needs.includes('prompt') && !prompt.trim()) return 'prompt';
		if (needs.includes('imagem') && !images[0]) return 'imagem';
		return null;
	}, [mode, prompt, images]);

	/**
	 * Custo REAL do lote. O `mode_cost` da definition (0× no ampliar, 0,5× no
	 * remover fundo) ainda não é executável: o upvox só escala custo por
	 * `variation_count`, que é inteiro ≥ 1. Mostrar aqui o preço com desconto
	 * seria cobrar uma coisa e escrever outra — então a tela mostra o que de
	 * fato sai do saldo e avisa quando o modo deveria custar menos.
	 */
	const modeCost = mode?.cost ?? 1;
	const chargePerRun = billing.cost;
	const batchCost = Math.round(chargePerRun * batch * 100) / 100;
	const insufficient =
		billing.billed &&
		billing.remainingFree === 0 &&
		batchCost > 0 &&
		billing.voxBalance < batchCost;

	/* ─────────────────────────── ações ─────────────────────────── */

	const resetRefs = useCallback(() => {
		setImages([null, null, null]);
		setMask(null);
		setParentId(null);
	}, []);

	const pickMode = useCallback(
		(value: string) => {
			setModeValue(value);
			setSuggestions([]);
			// Máscara pintada sobre a imagem antiga não vale para outro modo — e
			// mandá-la junto silenciosamente editaria a região errada.
			setMask(null);
			/**
			 * Modo que não declara `imagem` também não pode CARREGAR uma: o `runOnce`
			 * manda todo slot preenchido, então uma referência esquecida de um modo
			 * anterior transformaria um "texto → imagem" numa variação sem que nada
			 * na tela dissesse isso.
			 */
			const next = modes.find((m) => m.value === value);
			if (!next?.shows?.includes('imagem')) {
				setImages([null, null, null]);
				setParentId(null);
			}
		},
		[modes],
	);

	const enhance = useCallback(async () => {
		if (!prompt.trim() || enhancing) return;
		setEnhancing(true);
		try {
			const res = await enhancePrompt(prompt.trim(), modeValue);
			if (res.limited) {
				toast.info('Você já usou as melhorias desta hora. Tente mais tarde.');
			} else if (res.enhanced && res.enhanced !== prompt) {
				setPrompt(res.enhanced);
			}
			setSuggestions(res.suggestions);
		} finally {
			setEnhancing(false);
		}
	}, [prompt, modeValue, enhancing]);

	/** Um run: monta os valores do formulário e entrega ao motor com billing. */
	const runOnce = useCallback(() => {
		const values: Record<string, unknown> = {
			modo: modeValue,
			prompt: prompt.trim(),
			aspect,
			factor,
			style_suffix: style?.suffix ?? '',
			style_system: style?.system ?? '',
			parent_id: parentId ?? '',
			...(modelId ? { modelo: modelId } : {}),
		};
		IMAGE_SLOTS.forEach((slot, i) => {
			if (images[i]) values[slot] = images[i];
		});
		if (mask) values.mascara = mask;

		return billing.runEngine((invocationId) =>
			runToolEngine(toolKey, {
				values,
				inputSpec: def.definition.input,
				invocationId,
			}).then((r) => {
				setLastResult(r);
				const saveError = (r.output.meta as Record<string, unknown> | undefined)
					?.save_error;
				if (saveError) {
					// O bloco de saída não derruba o run quando o storage cai: a imagem
					// vem inline e some ao recarregar. Se a tela não avisasse, o aluno
					// perderia uma geração paga sem entender por quê.
					toast.warning(
						'A imagem foi gerada, mas não entrou na galeria. Baixe agora.',
					);
				}
				return r;
			}),
		);
	}, [
		modeValue,
		prompt,
		aspect,
		factor,
		style,
		parentId,
		modelId,
		images,
		mask,
		billing,
		toolKey,
		def.definition.input,
	]);

	/**
	 * LOTE. `runPool` com teto 4 e `allSettled` por dentro: cada imagem tem a
	 * própria invocação, então uma falha no meio não derruba as outras nem deixa
	 * invocação órfã (quem falha estorna sozinho, no motor).
	 */
	const generate = useCallback(async () => {
		if (missing) {
			toast.error(
				missing === 'prompt'
					? 'Descreva o que você quer gerar.'
					: 'Escolha uma imagem.',
			);
			return;
		}
		if (insufficient) return;
		setRunning(batch);
		try {
			await runPool(
				Array.from({ length: batch }, () => runOnce),
				MAX_CONCURRENCY,
			);
		} finally {
			setRunning(0);
			gallery.invalidate();
		}
	}, [missing, insufficient, batch, runOnce, gallery]);

	/** Ação do lightbox → composer pré-preenchido. É o laço iterativo. */
	const applyAction = useCallback(
		async (action: LightboxAction, image: GalleryImage) => {
			if (action === 'refazer') {
				setModeValue(image.modo || modes[0]?.value || '');
				setPrompt(image.prompt);
				resetRefs();
				setOpen(null);
				composerRef.current?.scrollIntoView({ behavior: 'smooth' });
				return;
			}

			setOpen(null);
			try {
				const file = await urlToFile(image.url, image.title || 'referencia');
				// `pickMode` ANTES de carregar a imagem: ele limpa os slots de um modo
				// que não aceita referência, e faria justamente isso com a imagem que
				// acabamos de baixar se a ordem fosse a inversa.
				pickMode(action);
				setImages([file, null, null]);
				setMask(null);
				setParentId(image.id);
				// O prompt do modo textura/variação continua sendo do aluno; nos modos
				// que não usam prompt ele é ignorado pelo motor.
				if (action === 'variacao' || action === 'textura') {
					setPrompt((p) => p || image.prompt);
				}
				composerRef.current?.scrollIntoView({ behavior: 'smooth' });
			} catch {
				toast.error(
					'Não consegui carregar a imagem original. Baixe-a e envie manualmente.',
				);
			}
		},
		[modes, pickMode, resetRefs],
	);

	/** A ponte. Roda no servidor e leva o aluno para a Vetorização. */
	const vectorize = useCallback(
		async (image: GalleryImage) => {
			if (vectorBilling.insufficient) {
				toast.error('Saldo insuficiente para vetorizar.');
				return;
			}
			setVectorizing(true);
			try {
				const res = await vectorBilling.runEngine((invocationId) =>
					galleryToVector(image.id, toolKey, historySource, invocationId),
				);
				if (res?.vectorId) {
					setOpen(null);
					router.push(`/course/vetorizacao?v=${res.vectorId}`);
				}
			} finally {
				setVectorizing(false);
			}
		},
		[vectorBilling, toolKey, historySource, router],
	);

	const toggleFavorite = useCallback(
		async (image: GalleryImage) => {
			try {
				await updateCollectionEntry(toolKey, historySource, image.id, {
					data: { favorito: !image.favorito },
				});
				setOpen((cur) =>
					cur && cur.id === image.id
						? { ...cur, favorito: !image.favorito }
						: cur,
				);
				gallery.invalidate();
			} catch {
				toast.error('Não consegui favoritar agora.');
			}
		},
		[toolKey, historySource, gallery],
	);

	const remove = useCallback(
		async (image: GalleryImage) => {
			try {
				await deleteCollectionEntry(toolKey, historySource, image.id);
				setOpen(null);
				gallery.invalidate();
			} catch {
				toast.error('Não consegui excluir agora.');
			}
		},
		[toolKey, historySource, gallery],
	);

	/* ─────────────────────────── render ─────────────────────────── */

	const busy = running > 0 || vectorizing;
	const pill = (active: boolean) =>
		`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
			active
				? 'text-white'
				: 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
		}`;
	const pillStyle = (active: boolean) =>
		active ? { backgroundColor: 'var(--screen-accent)' } : undefined;
	const selectCls =
		'rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none dark:border-white/10 dark:bg-[#111] dark:text-slate-200';

	const tileRepeat = spec.tilePreview?.repeat ?? 3;
	const lastPreview = lastResult?.output?.preview as string | undefined;
	const showTilePreview = mode?.preview === 'tile3x3' && lastPreview;

	return (
		<div className="p-4 md:p-8">
			<PageHeader
				title={title ?? def.title}
				subtitle={subtitle ?? def.description ?? undefined}
				icon={resolveToolIcon(
					(def.definition.ui as { icon?: string } | undefined)?.icon,
				)}
			/>

			{notice && <ScreenNotice notice={notice} />}

			{/* ───────────────── COMPOSER ───────────────── */}
			<div
				ref={composerRef}
				className="sticky top-2 z-30 mb-6 space-y-3 rounded-2xl border border-slate-200 bg-white/95 p-4 backdrop-blur dark:border-white/10 dark:bg-[#1a1a1d]/95"
			>
				<div className="flex flex-wrap gap-1.5">
					{modes.map((m) => {
						const Icon = resolveToolIcon(m.icon);
						const active = m.value === modeValue;
						return (
							<button
								key={m.value}
								type="button"
								onClick={() => pickMode(m.value)}
								className={pill(active)}
								style={pillStyle(active)}
							>
								<Icon className="h-3.5 w-3.5" />
								{m.label}
							</button>
						);
					})}
				</div>

				{mode?.note && (
					<p className="text-xs text-slate-500 dark:text-gray-400">
						{mode.note}
					</p>
				)}

				{shows('prompt') && (
					<div className="space-y-2">
						<div className="relative">
							<textarea
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
								rows={3}
								placeholder="Descreva a arte que você quer. Ex.: uma coruja geométrica de traço fino, vista de frente, sem sombra"
								className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-28 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-300 dark:border-white/10 dark:bg-[#111] dark:text-slate-100"
							/>
							<button
								type="button"
								onClick={enhance}
								disabled={enhancing || !prompt.trim()}
								className="absolute right-2 top-2 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-[#1a1a1d] dark:text-slate-300"
							>
								{enhancing ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
								) : (
									<Sparkles className="h-3.5 w-3.5" />
								)}
								Melhorar
							</button>
						</div>

						{suggestions.length > 0 && (
							<div className="flex flex-wrap items-center gap-1.5">
								<span className="text-[11px] text-slate-400">Ideias:</span>
								{suggestions.map((s) => (
									<button
										key={s}
										type="button"
										onClick={() => setPrompt(s)}
										className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600 transition-colors hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
									>
										{s}
									</button>
								))}
								<button
									type="button"
									onClick={() => setSuggestions([])}
									className="rounded-full p-1 text-slate-400 hover:text-slate-600"
								>
									<X className="h-3 w-3" />
								</button>
							</div>
						)}
					</div>
				)}

				{shows('estilos') && spec.styles?.collection && (
					<StyleStrip
						toolKey={toolKey}
						collection={spec.styles.collection}
						bind={spec.styles.bind ?? {}}
						selectedId={style?.id ?? null}
						onSelect={setStyle}
					/>
				)}

				{/* Imagem base: no modo de máscara ela vira a tela do pincel. */}
				{shows('imagem') && (
					<div className="space-y-3">
						{shows('mascara') && images[0] && baseUrl ? (
							<>
								<MaskPainter imageUrl={baseUrl} onChange={setMask} />
								<button
									type="button"
									onClick={resetRefs}
									className="text-xs text-slate-500 underline underline-offset-2 dark:text-gray-400"
								>
									Trocar imagem
								</button>
							</>
						) : (
							<StudioDropzone
								label="Envie a imagem base"
								file={images[0]}
								onChange={(f) =>
									setImages((prev) => [f, prev[1] ?? null, prev[2] ?? null])
								}
							/>
						)}

						{(shows('imagem2') || shows('imagem3')) && (
							<div className="grid grid-cols-2 gap-3">
								{shows('imagem2') && (
									<StudioDropzone
										label="Referência 2 (opcional)"
										file={images[1]}
										onChange={(f) =>
											setImages((prev) => [prev[0], f, prev[2] ?? null])
										}
									/>
								)}
								{shows('imagem3') && (
									<StudioDropzone
										label="Referência 3 (opcional)"
										file={images[2]}
										onChange={(f) =>
											setImages((prev) => [prev[0], prev[1] ?? null, f])
										}
									/>
								)}
							</div>
						)}
					</div>
				)}

				<div className="flex flex-wrap items-center gap-3">
					{shows('aspect') && aspectOptions.length > 0 && (
						<label className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
							Formato
							<select
								value={aspect}
								onChange={(e) => setAspect(e.target.value)}
								className={selectCls}
							>
								{aspectOptions.map((a) => (
									<option key={a} value={a}>
										{a}
									</option>
								))}
							</select>
						</label>
					)}

					{shows('factor') && factorOptions.length > 0 && (
						<label className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
							Ampliar em
							<select
								value={factor}
								onChange={(e) => setFactor(e.target.value)}
								className={selectCls}
							>
								{factorOptions.map((f) => (
									<option key={f} value={f}>
										{f}×
									</option>
								))}
							</select>
						</label>
					)}

					<div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400">
						Quantidade
						{BATCH_OPTIONS.map((n) => (
							<button
								key={n}
								type="button"
								onClick={() => setBatch(n)}
								className={pill(batch === n)}
								style={pillStyle(batch === n)}
							>
								{n}
							</button>
						))}
					</div>

					{isStaff && (
						<label className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
							Modelo
							<select
								value={modelId}
								onChange={(e) => setModelId(e.target.value)}
								className={selectCls}
							>
								<option value="">Padrão da ferramenta</option>
								{(models.data ?? []).map((m) => (
									<option key={m.id} value={m.id}>
										{m.label}
									</option>
								))}
							</select>
						</label>
					)}
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="min-w-0 space-y-1">
						{billing.billed && chargePerRun > 0 && (
							<p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400">
								<VoxxysIcon className="h-3.5 w-3.5" />
								{batch > 1 ? (
									<span>
										{batch} imagens ={' '}
										<strong className="text-slate-700 dark:text-gray-200">
											{formatVox(batchCost)}
										</strong>{' '}
										voxxys · saldo {formatVox(billing.voxBalance)}
									</span>
								) : (
									<span>
										Custa{' '}
										<strong className="text-slate-700 dark:text-gray-200">
											{formatVox(chargePerRun)}
										</strong>{' '}
										voxxys · saldo {formatVox(billing.voxBalance)}
									</span>
								)}
							</p>
						)}
						{/* Honestidade sobre o preço: enquanto a cobrança por modo não é
						    executável no upvox, este modo cobra o valor cheio. */}
						{billing.billed && modeCost !== 1 && chargePerRun > 0 && (
							<p className="text-[11px] text-amber-600 dark:text-amber-400">
								{modeCost === 0
									? 'Este modo não usa IA e deveria ser grátis, mas a cobrança por modo ainda não está ligada — ele cobra o valor cheio.'
									: `Este modo deveria custar ${modeCost}× — a cobrança por modo ainda não está ligada e ele cobra o valor cheio.`}
							</p>
						)}
						{batch > MAX_CONCURRENCY && (
							<p className="text-[11px] text-slate-400">
								Geramos até {MAX_CONCURRENCY} de cada vez; o resto entra em
								seguida. Não há fila durável — se você fechar a página no meio,
								o que faltou não roda.
							</p>
						)}
						{insufficient && (
							<p className="text-xs text-amber-600 dark:text-amber-400">
								Saldo insuficiente para {batch} imagem(ns).{' '}
								<button
									type="button"
									onClick={() => router.push('/course/voxes')}
									className="font-semibold underline underline-offset-2"
								>
									Comprar voxxys
								</button>
							</p>
						)}
					</div>

					<button
						type="button"
						onClick={generate}
						disabled={busy || insufficient || !!missing || isDraft}
						className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
						style={{ backgroundColor: 'var(--screen-accent)' }}
					>
						{running > 0 ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Gerando {running}…
							</>
						) : (
							<>
								<Wand2 className="h-4 w-4" />
								Gerar
							</>
						)}
					</button>
				</div>

				{isDraft && (
					<p className="text-xs text-amber-600 dark:text-amber-400">
						Prévia de rascunho: o Estúdio não roda aqui porque cada geração é
						cobrada e arquivada na galeria de quem gerou.
					</p>
				)}
			</div>

			{showTilePreview && (
				<div className="mb-6 max-w-sm">
					<TilePreview url={lastPreview} repeat={tileRepeat} />
				</div>
			)}

			{/* ───────────────── GALERIA ───────────────── */}
			<GalleryGrid
				images={gallery.images}
				loading={gallery.isLoading}
				placeholders={running}
				hasNextPage={!!gallery.hasNextPage}
				fetchingNextPage={gallery.isFetchingNextPage}
				onLoadMore={() => gallery.fetchNextPage()}
				onOpen={setOpen}
				filters={filters}
				onFilters={setFilters}
				modeLabels={modes.map((m) => ({ value: m.value, label: m.label }))}
			/>

			{open && (
				<ImageLightbox
					image={open}
					onClose={() => setOpen(null)}
					onAction={applyAction}
					onVectorize={vectorize}
					onToggleFavorite={toggleFavorite}
					onDelete={remove}
					vectorizing={vectorizing}
					busy={busy}
					modeLabel={labelOf}
					tileRepeat={tileRepeat}
				/>
			)}
		</div>
	);
}

/** Estilo do acento, exportado para o `DynamicToolView` montar o container. */
export const canvasAccentStyle = (accent: string): CSSProperties =>
	({ '--screen-accent': accent }) as CSSProperties;
