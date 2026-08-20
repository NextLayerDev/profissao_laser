'use client';

import {
	ArrowLeft,
	Check,
	Clock,
	Download,
	ImageIcon,
	Loader2,
	RotateCcw,
	Sparkles,
	Upload,
	Wand2,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
	type CSSProperties,
	type ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useImageSizePresets } from '../hooks/use-image-size-presets';
import {
	coverOf,
	downloadUrl,
	hasTextInput,
	maxImagesOf,
	modeLabel,
	modeOf,
	modeUsesImage,
	modeUsesText,
	type PromptStep,
	type SpecDef,
	stepsForMode,
} from '../lib/prompt-bank';
import { screenAccentBg } from '../lib/screen-ui';
import { resolveToolIcon } from '../lib/tool-icons';
import type { LicensedBrand } from '../services/licensed-brand.service';
import type { ToolBankEntry } from '../services/tool-bank.service';
import type {
	Creation,
	RunToolEngineImageSize,
	ToolRunResult,
} from '../services/tool-definitions.service';
import { ArtLicensePanel } from './art-license-panel';
import {
	CAMPO_NEUTRO,
	CARIMBO,
	LinhaDeRegistro,
	MONO,
	SeloAtivo,
	TEMA_LICENCIADA,
	useAnimar,
} from './licenciada-ui';
import {
	LicensedPiecesEditor,
	type PecaDaLista,
	pecaVazia,
} from './licensed-pieces-editor';

/**
 * Tela de detalhe + geração de um "Prompt Mágico" (registro do Banco do Admin
 * escolhido). Componente PRESENTACIONAL: recebe TODO o estado e handlers do
 * `DynamicToolView` (tema, referências, result, pending, billing) — não detém
 * regra de negócio, só desenha a experiência premium (hero + stepper + form +
 * resultado). Cor de destaque pela CSS var `--screen-accent` herdada do root.
 */

/** Cor de destaque sólida. */
const ACCENT_BG: CSSProperties = { backgroundColor: 'var(--screen-accent)' };
/** Texto na cor de destaque. */
const ACCENT_TEXT: CSSProperties = { color: 'var(--screen-accent)' };
/** Fundo tingido. */
const ACCENT_TINT: CSSProperties = {
	backgroundColor: 'color-mix(in srgb, var(--screen-accent) 12%, transparent)',
};

/* ─────────────────── Reference drop (drag/drop + preview) ─────────────────── */

function ReferenceDrop({
	label,
	file,
	onChange,
}: {
	label: string;
	file: File | null;
	onChange: (f: File | null) => void;
}) {
	const [dragging, setDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const previewUrl = useMemo(
		() => (file ? URL.createObjectURL(file) : null),
		[file],
	);
	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [previewUrl]);

	// Resolução real do arquivo escolhido (lida do próprio bitmap, não do EXIF).
	const [dimensions, setDimensions] = useState<{
		width: number;
		height: number;
	} | null>(null);
	useEffect(() => {
		if (!file) {
			setDimensions(null);
			return;
		}
		let cancelled = false;
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			if (!cancelled) {
				setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
			}
			URL.revokeObjectURL(url);
		};
		img.onerror = () => URL.revokeObjectURL(url);
		img.src = url;
		return () => {
			cancelled = true;
		};
	}, [file]);
	return (
		<div className="space-y-3">
			<span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
				{label}
			</span>
			<button
				type="button"
				onClick={() => inputRef.current?.click()}
				onDrop={(e) => {
					e.preventDefault();
					setDragging(false);
					const f = e.dataTransfer.files[0];
					if (f) onChange(f);
				}}
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={(e) => {
					e.preventDefault();
					setDragging(false);
				}}
				style={
					dragging
						? {
								borderColor: 'var(--screen-accent)',
								backgroundColor:
									'color-mix(in srgb, var(--screen-accent) 10%, transparent)',
							}
						: undefined
				}
				className="relative flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 px-6 py-8 transition-colors hover:border-[color-mix(in_srgb,var(--screen-accent)_50%,transparent)] dark:border-white/10"
			>
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					onChange={(e) => {
						onChange(e.target.files?.[0] ?? null);
						e.target.value = '';
					}}
					className="hidden"
				/>
				<div className="mb-3 rounded-xl p-3 text-white" style={ACCENT_BG}>
					<Upload className="h-7 w-7" />
				</div>
				<p className="text-center text-sm font-medium text-slate-600 dark:text-gray-400">
					Arraste sua imagem ou clique para selecionar
				</p>
			</button>
			{file && (
				<div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#1a1a1d]">
					<div
						className="h-10 w-10 shrink-0 overflow-hidden rounded-lg"
						style={ACCENT_TINT}
					>
						{previewUrl ? (
							// <img> intencional: preview local de Blob
							<img
								src={previewUrl}
								alt={file.name}
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center">
								<ImageIcon className="h-5 w-5" style={ACCENT_TEXT} />
							</div>
						)}
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium text-slate-900 dark:text-white">
							{file.name}
						</p>
						<p className="text-xs text-slate-400 dark:text-slate-500">
							{dimensions
								? `${dimensions.width}×${dimensions.height}px`
								: 'lendo resolução…'}
						</p>
					</div>
					<button
						type="button"
						onClick={() => onChange(null)}
						className="text-xs text-slate-400 hover:text-rose-500"
					>
						remover
					</button>
				</div>
			)}
		</div>
	);
}

/* ─────────────────── Stepper (visual de progresso) ─────────────────── */

function PromptStepper({
	steps,
	completed,
	active,
	licenciada,
	animar,
}: {
	steps: PromptStep[];
	completed: Set<PromptStep['key']>;
	active: PromptStep['key'];
	licenciada?: boolean;
	animar?: boolean;
}) {
	if (licenciada) {
		return (
			<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
				{steps.map((step, i) => {
					const isDone = completed.has(step.key);
					const isActive = step.key === active;
					return (
						<span
							key={step.key}
							className={`${MONO} inline-flex items-center gap-1.5 ${
								isActive
									? 'text-[var(--al-ink)]'
									: isDone
										? 'text-[var(--al-seal)]'
										: 'text-[var(--al-mute)]'
							}`}
						>
							{/* O check CARIMBA quando o passo fecha — é o gesto de quem
							    atesta, o mesmo do selo de licença. Passo pendente é só um
							    número, sem cor: nada a atestar ainda. */}
							{isDone ? (
								<motion.span
									initial={animar ? { scale: 0 } : false}
									animate={{ scale: 1 }}
									transition={CARIMBO}
									className="inline-flex"
								>
									<Check className="h-3.5 w-3.5" />
								</motion.span>
							) : (
								<span className="tabular-nums">{i + 1}</span>
							)}
							{step.label}
						</span>
					);
				})}
			</div>
		);
	}

	return (
		<div className="flex items-center">
			{steps.map((step, i) => {
				const isDone = completed.has(step.key);
				const isActive = step.key === active;
				const isLast = i === steps.length - 1;
				return (
					<div
						key={step.key}
						className="flex flex-1 items-center last:flex-none"
					>
						<div className="flex items-center gap-2">
							<span
								className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
									isDone || isActive
										? 'text-white'
										: 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500'
								}`}
								style={isDone || isActive ? ACCENT_BG : undefined}
							>
								{isDone ? <Check className="h-4 w-4" /> : i + 1}
							</span>
							<span
								className={`hidden whitespace-nowrap text-sm font-medium sm:inline ${
									isActive
										? 'text-slate-900 dark:text-white'
										: 'text-slate-400 dark:text-slate-500'
								}`}
							>
								{step.label}
							</span>
						</div>
						{!isLast && (
							<span
								className={`mx-3 h-0.5 flex-1 rounded-full transition-colors ${
									isDone ? '' : 'bg-slate-200 dark:bg-white/10'
								}`}
								style={isDone ? ACCENT_BG : undefined}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}

/* ─────────────────── Result image (preview ?? primary + download) ─────────────────── */

function BankResultImage({
	result,
	downloadKey,
}: {
	result: ToolRunResult;
	downloadKey: string;
}) {
	const output = result.output;
	const preview =
		typeof output.preview === 'string'
			? output.preview
			: typeof output.primary === 'string'
				? output.primary
				: undefined;
	const primary =
		typeof output[downloadKey] === 'string'
			? (output[downloadKey] as string)
			: typeof output.primary === 'string'
				? output.primary
				: undefined;
	const shown = preview ?? primary;

	return (
		<div className="space-y-4">
			{result.license ? <ArtLicensePanel license={result.license} /> : null}
			{shown ? (
				<div className="flex max-h-[70vh] w-full items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-[#111]">
					{/* <img> intencional: preview de data URL / CDN dinâmico */}
					<img
						src={shown}
						alt="Resultado"
						className="max-h-[70vh] w-full object-contain"
					/>
				</div>
			) : (
				<p className="text-sm text-slate-500 dark:text-gray-400">
					Pronto. Sem prévia visual.
				</p>
			)}
			{primary && (
				<button
					type="button"
					onClick={() => downloadUrl(primary, 'resultado')}
					style={ACCENT_BG}
					className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90"
				>
					<Download className="h-5 w-5" />
					Baixar imagem
				</button>
			)}
		</div>
	);
}

/* ─────────────────── Peças do lote (arte licenciada) ─────────────────── */

/** Uma peça de um lote licenciado: arquivo próprio, código próprio. */
type Peca = { index: number; code: string; url: string };

function ehLoteDePecas(v: unknown): v is Peca[] {
	return (
		Array.isArray(v) &&
		v.length > 0 &&
		v.every(
			(p) =>
				typeof p === 'object' &&
				p !== null &&
				typeof (p as Peca).url === 'string' &&
				typeof (p as Peca).code === 'string',
		)
	);
}

/**
 * O LOTE. Cada peça é um arquivo com o SEU código gravado dentro — é isso que
 * transforma tiragem em algo contável: não existe "a arte" para gravar quantas
 * vezes quiser, existem N peças numeradas.
 *
 * O nome do arquivo é o código, de propósito: no chão de fábrica é assim que se
 * acha a peça 23 e se confere o que está gravado nela sem abrir o arquivo.
 */
function BankResultBatch({ pecas }: { pecas: Peca[] }) {
	const uma = pecas.length === 1;
	return (
		<div className="space-y-4">
			{!uma && (
				<p className="text-sm text-slate-600 dark:text-gray-300">
					<span className="font-semibold">{pecas.length} peças</span> — cada uma
					com o próprio código gravado. Baixe uma a uma e grave na ordem.
				</p>
			)}
			<div
				className={
					uma ? 'space-y-3' : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
				}
			>
				{pecas.map((p) => (
					<div
						key={p.code}
						className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#111]"
					>
						{/* Fundo CLARO mesmo no tema escuro: a peça é um PNG com fundo
						    transparente e tinta preta — sobre escuro, o carimbo sumiria. */}
						<div className="flex max-h-[55vh] items-center justify-center overflow-hidden bg-white">
							{/* <img> intencional: a peça vem de CDN dinâmico. */}
							<img
								src={p.url}
								alt={`Peça ${p.index}`}
								className="max-h-[55vh] w-full object-contain"
							/>
						</div>
						<div className="space-y-1.5 px-3 py-2">
							<div className="flex items-center justify-between gap-2">
								<span className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{uma ? 'Peça' : `Peça ${p.index} de ${pecas.length}`}
								</span>
								<a
									href={p.url}
									download
									className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
									style={ACCENT_BG}
								>
									<Download className="h-3.5 w-3.5" />
									Baixar
								</a>
							</div>
							<p className="font-mono truncate text-[11px] text-slate-500 dark:text-gray-400">
								{p.code}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/* ─────────────────── Result gallery (N variações) ─────────────────── */

/** Item de imagem vindo do bloco `ai.generate_image` (`output.images`). */
type ResultImage = { pngBase64?: string; png?: string };

function isResultImageArray(v: unknown): v is ResultImage[] {
	return (
		Array.isArray(v) &&
		v.length > 0 &&
		v.every(
			(it) =>
				typeof it === 'object' &&
				it !== null &&
				typeof (it as ResultImage).pngBase64 === 'string',
		)
	);
}

/**
 * Grade de N variações (Passo 3 → `variation_count`). Cada tile mostra a
 * imagem (`pngBase64` é data URL → serve pra preview e download) + botão
 * baixar. Fallback pra `BankResultImage` quando `output.images` não é array
 * (tool legada sem `images` no output).
 */
function BankResultGallery({
	result,
	downloadKey,
}: {
	result: ToolRunResult;
	downloadKey: string;
}) {
	// Arte licenciada: o lote vem em `pieces`, uma peça por código. Vem ANTES
	// das variações porque são coisas diferentes — variação é a mesma peça
	// desenhada de outro jeito; peça é uma unidade licenciada a mais.
	const pecas = result.output.pieces;
	if (ehLoteDePecas(pecas)) {
		return (
			<div className="space-y-4">
				{result.license ? <ArtLicensePanel license={result.license} /> : null}
				<BankResultBatch pecas={pecas} />
			</div>
		);
	}

	const images = result.output.images;
	if (!isResultImageArray(images)) {
		return <BankResultImage result={result} downloadKey={downloadKey} />;
	}
	return (
		<div className="space-y-4">
			{/* Um código por RODADA, não por variação: as N imagens saíram do mesmo
			    pedido e compartilham a licença. */}
			{result.license ? <ArtLicensePanel license={result.license} /> : null}
			<div
				className={
					images.length > 1 ? 'grid gap-3 sm:grid-cols-2' : 'space-y-3'
				}
			>
				{images.map((img, i) => (
					<div
						key={i}
						className="space-y-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#111]"
					>
						<div className="flex max-h-[55vh] items-center justify-center overflow-hidden bg-slate-100 dark:bg-black/30">
							{/* <img> intencional: preview de data URL */}
							<img
								src={img.pngBase64}
								alt={`Variação ${i + 1}`}
								className="max-h-[55vh] w-full object-contain"
							/>
						</div>
						<div className="flex items-center justify-between gap-2 px-3 py-2">
							<span className="text-xs font-medium text-slate-500 dark:text-slate-400">
								Variação {i + 1} de {images.length}
							</span>
							<button
								type="button"
								onClick={() =>
									downloadUrl(img.pngBase64 as string, `variacao-${i + 1}`)
								}
								className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
								style={ACCENT_BG}
							>
								<Download className="h-3.5 w-3.5" />
								Baixar
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/* ─────────────────── Hero ─────────────────── */

function PromptHero({
	entry,
	licenciada,
	marca,
}: {
	entry: ToolBankEntry;
	licenciada?: boolean;
	marca?: LicensedBrand | null;
}) {
	const cover = coverOf(entry);
	const mode = modeOf(entry);
	const maxImages = maxImagesOf(entry);
	const showsImage = modeUsesImage(mode);

	if (licenciada) {
		return (
			<div className="overflow-hidden rounded-lg border border-[var(--al-rule)] bg-[var(--al-card)]">
				{/* A TARJA DA MARCA. É o conserto da quebra do fluxo: quem entrou por
				    "Corinthians → Caneca 360°" via só "Caneca 360°" na tela seguinte,
				    e a marca — que é o produto inteiro — sumia bem onde ele vai
				    gastar voxxy. */}
				{marca && (
					<div className="flex items-center gap-3 border-b border-[var(--al-rule)] px-4 py-3">
						<div
							className="flex h-10 w-10 shrink-0 items-center justify-center rounded p-1.5"
							style={{ backgroundColor: marca.accent_color || CAMPO_NEUTRO }}
						>
							{marca.crest_url ? (
								/* <img> intencional: a arte vem de CDN dinâmico. */
								<img
									src={marca.crest_url}
									alt=""
									className="max-h-full max-w-full object-contain"
								/>
							) : null}
						</div>
						<div className="min-w-0 flex-1">
							<p className="font-display truncate text-sm font-bold tracking-[-0.01em] text-[var(--al-ink)]">
								{marca.display_name}
							</p>
							<p className="mt-1.5">
								<SeloAtivo />
							</p>
						</div>
					</div>
				)}

				<div className="flex flex-col gap-4 p-4 sm:flex-row">
					<div className="h-24 w-24 shrink-0 overflow-hidden rounded bg-[var(--al-poco)] sm:h-28 sm:w-28">
						{cover ? (
							/* <img> intencional: data URL / CDN dinâmico */
							<img
								src={cover}
								alt={entry.title}
								className="h-full w-full object-cover"
							/>
						) : marca?.crest_url ? (
							/* Sem exemplo, o escudo apagado — marca d'água, não amostra. */
							<div className="flex h-full items-center justify-center p-6">
								{/* <img> intencional: a arte vem de CDN dinâmico. */}
								<img
									src={marca.crest_url}
									alt=""
									className="max-h-full max-w-full object-contain opacity-20 grayscale dark:opacity-[0.14]"
								/>
							</div>
						) : null}
					</div>

					<div className="min-w-0 flex-1 space-y-2.5">
						<p className={`${MONO} text-[var(--al-mute)]`}>Modelo</p>
						<h2 className="font-display text-lg font-bold tracking-[-0.01em] text-[var(--al-ink)]">
							{entry.title}
						</h2>
						<LinhaDeRegistro rotulo="Entrada">
							{modeLabel(mode)}
						</LinhaDeRegistro>
						{showsImage && (
							<LinhaDeRegistro rotulo="Fotos">
								{maxImages > 1 ? `até ${maxImages}` : 'até 1'}
							</LinhaDeRegistro>
						)}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#1a1a1d]">
			<div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
				<div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-white/5 sm:h-32 sm:w-32">
					{cover ? (
						// <img> intencional: data URL / CDN dinâmico
						<img
							src={cover}
							alt={entry.title}
							className="h-full w-full object-cover"
						/>
					) : (
						<div
							className="flex h-full w-full items-center justify-center"
							style={ACCENT_TINT}
						>
							<Sparkles className="h-9 w-9" style={ACCENT_TEXT} />
						</div>
					)}
				</div>
				<div className="min-w-0 flex-1">
					{entry.category && (
						<span
							className="text-xs font-semibold uppercase tracking-wide"
							style={ACCENT_TEXT}
						>
							{entry.category}
						</span>
					)}
					<h2 className="mt-0.5 font-display text-xl font-bold text-slate-900 dark:text-white">
						{entry.title}
					</h2>
					<div className="mt-2 flex flex-wrap items-center gap-2">
						<span
							className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
							style={ACCENT_BG}
						>
							{modeLabel(mode)}
						</span>
						{showsImage && (
							<span
								className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
								style={ACCENT_TINT}
							>
								<ImageIcon className="h-3 w-3" style={ACCENT_TEXT} />
								<span style={ACCENT_TEXT}>
									{maxImages > 1
										? `Até ${maxImages} imagens de referência`
										: '1 imagem de referência'}
								</span>
							</span>
						)}
					</div>
					{entry.description && (
						<p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
							{entry.description}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

/* ─────────────────── Resolução de saída (opcional) ─────────────────── */

/** Select de resolução: default da tool, um preset cadastrado, ou personalizado. */
function ImageSizePicker({
	value,
	onChange,
}: {
	value: RunToolEngineImageSize | null;
	onChange: (v: RunToolEngineImageSize | null) => void;
}) {
	const { data: presets } = useImageSizePresets();
	const customValue =
		value && typeof value === 'object' && value.unit === 'px' ? value : null;
	const isCustom = customValue !== null;
	const [customW, setCustomW] = useState(
		customValue ? String(customValue.width) : '',
	);
	const [customH, setCustomH] = useState(
		customValue ? String(customValue.height) : '',
	);

	const selectValue =
		value === null
			? 'default'
			: value === 'native'
				? 'native'
				: value.unit === 'preset'
					? `preset:${value.preset_id}`
					: 'custom';

	return (
		<div className="space-y-1.5">
			<label
				htmlFor="bank-image-size"
				className="block text-sm font-medium text-slate-700 dark:text-slate-300"
			>
				Resolução de saída{' '}
				<span className="font-normal text-slate-400">(opcional)</span>
			</label>
			<select
				id="bank-image-size"
				value={selectValue}
				onChange={(e) => {
					const v = e.target.value;
					if (v === 'default') onChange(null);
					else if (v === 'native') onChange('native');
					else if (v === 'custom') {
						onChange({
							unit: 'px',
							width: Number(customW) || 1024,
							height: Number(customH) || 1024,
						});
					} else
						onChange({ unit: 'preset', preset_id: v.slice('preset:'.length) });
				}}
				className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[color-mix(in_srgb,var(--screen-accent)_50%,transparent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--screen-accent)_30%,transparent)] dark:border-white/10 dark:bg-[#111] dark:text-slate-200"
			>
				<option value="default">Padrão da ferramenta</option>
				<option value="native">
					Manter resolução gerada pela IA (sem redimensionar)
				</option>
				{(presets ?? []).map((p) => (
					<option key={p.id} value={`preset:${p.id}`}>
						{p.name} ({p.width}×{p.height}px)
					</option>
				))}
				<option value="custom">Personalizado…</option>
			</select>
			{isCustom && (
				<div className="flex items-center gap-2">
					<input
						type="number"
						min={64}
						max={4096}
						value={customW}
						onChange={(e) => {
							setCustomW(e.target.value);
							onChange({
								unit: 'px',
								width: Number(e.target.value) || 64,
								height: Number(customH) || 64,
							});
						}}
						placeholder="Largura"
						className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none dark:border-white/10 dark:bg-[#111] dark:text-slate-200"
					/>
					<span className="text-slate-400">×</span>
					<input
						type="number"
						min={64}
						max={4096}
						value={customH}
						onChange={(e) => {
							setCustomH(e.target.value);
							onChange({
								unit: 'px',
								width: Number(customW) || 64,
								height: Number(e.target.value) || 64,
							});
						}}
						placeholder="Altura"
						className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none dark:border-white/10 dark:bg-[#111] dark:text-slate-200"
					/>
				</div>
			)}
		</div>
	);
}

/* ─────────────────── Main view ─────────────────── */

/* ─────────────────── Estado "gerando" (loader premium) ─────────────────── */

const GEN_MESSAGES = [
	'Interpretando o tema…',
	'Compondo a cena…',
	'Desenhando os traços em preto e branco…',
	'Trabalhando profundidade e hachura…',
	'Ajustando a emenda do wrap 360°…',
	'Refinando os detalhes finais…',
	'Quase lá…',
];

function GeneratingState() {
	const [idx, setIdx] = useState(0);
	const [sec, setSec] = useState(0);
	useEffect(() => {
		const m = setInterval(
			() => setIdx((i) => (i + 1) % GEN_MESSAGES.length),
			3500,
		);
		const t = setInterval(() => setSec((s) => s + 1), 1000);
		return () => {
			clearInterval(m);
			clearInterval(t);
		};
	}, []);
	const mmss = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

	return (
		<div
			className="relative flex h-full min-h-[420px] flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border p-6"
			style={{
				borderColor:
					'color-mix(in srgb, var(--screen-accent) 35%, transparent)',
				backgroundColor:
					'color-mix(in srgb, var(--screen-accent) 6%, transparent)',
			}}
		>
			{/* "Canvas" 2:1 com traços de gravação sendo desenhados + scan */}
			<div
				className="relative w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0d]"
				style={{ aspectRatio: '2 / 1' }}
			>
				<div className="pmg-hatch absolute inset-0" />
				<div
					className="pmg-scan absolute inset-x-0 h-20"
					style={{
						background:
							'linear-gradient(to bottom, transparent, color-mix(in srgb, var(--screen-accent) 45%, transparent), transparent)',
					}}
				/>
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="relative flex h-16 w-16 items-center justify-center">
						<div
							className="pmg-ring absolute inset-0 rounded-full"
							style={{
								background:
									'conic-gradient(from 0deg, transparent 0%, var(--screen-accent) 72%, transparent 100%)',
							}}
						/>
						<div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-[#0b0b0d]">
							<Wand2
								className="pmg-float h-7 w-7"
								style={{ color: 'var(--screen-accent)' }}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Mensagem que gira + timer + expectativa correta */}
			<div className="text-center">
				<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
					{GEN_MESSAGES[idx]}
				</p>
				<p className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
					<Clock className="h-3 w-3" />
					{mmss} · a IA está criando uma arte única — pode levar 1–3 min
				</p>
			</div>

			{/* Barra de progresso indeterminada */}
			<div className="h-1 w-full max-w-md overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
				<div
					className="pmg-bar h-full rounded-full"
					style={{ backgroundColor: 'var(--screen-accent)' }}
				/>
			</div>

			<style>{`
				@keyframes pmgScan { 0%{transform:translateY(-5rem)} 100%{transform:translateY(220%)} }
				.pmg-scan{ animation: pmgScan 2.4s ease-in-out infinite; }
				@keyframes pmgSpin { to{transform:rotate(360deg)} }
				.pmg-ring{ animation: pmgSpin 2.6s linear infinite; }
				@keyframes pmgFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
				.pmg-float{ animation: pmgFloat 2.2s ease-in-out infinite; }
				.pmg-hatch{ background-image: repeating-linear-gradient(58deg, rgba(255,255,255,.07) 0 2px, transparent 2px 8px); animation: pmgHatch 1.8s ease-in-out infinite; }
				@keyframes pmgHatch { 0%,100%{opacity:.3} 50%{opacity:.65} }
				@keyframes pmgBar { 0%{transform:translateX(-120%)} 100%{transform:translateX(320%)} }
				.pmg-bar{ width:30%; animation: pmgBar 1.5s ease-in-out infinite; }
			`}</style>
		</div>
	);
}

/* ─────────────────── Section header numerado (Passo 1/2/3) ─────────────────── */

function SectionHeader({
	no,
	title,
	hint,
	licenciada,
}: {
	no: number;
	title: string;
	hint?: string;
	licenciada?: boolean;
}) {
	if (licenciada) {
		return (
			<div>
				<p className={`${MONO} text-[var(--al-mute)]`}>{`Passo ${no}`}</p>
				<h3 className="font-display mt-1.5 text-sm font-bold tracking-[-0.01em] text-[var(--al-ink)]">
					{title}
				</h3>
				{hint && <p className="mt-0.5 text-xs text-[var(--al-mute)]">{hint}</p>}
			</div>
		);
	}

	return (
		<div className="flex items-start gap-2.5">
			<span
				className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
				style={ACCENT_BG}
			>
				{no}
			</span>
			<div className="min-w-0">
				<h3 className="text-sm font-semibold text-slate-900 dark:text-white">
					{title}
				</h3>
				{hint && (
					<p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
				)}
			</div>
		</div>
	);
}

export interface PromptGenerateViewProps {
	entry: ToolBankEntry;
	/** Valor do tema (controlado pelo DynamicToolView). */
	tema: string;
	onTemaChange: (v: string) => void;
	/** Especificações do registro (nome aberto, no lugar do tema genérico) — vazio = comportamento legado. */
	specs: SpecDef[];
	specValues: Record<string, string>;
	onSpecValueChange: (name: string, v: string) => void;
	/** Slots de referência (até 3) — controlados pelo DynamicToolView. */
	referencias: (File | null)[];
	onReferenciaChange: (index: number, file: File | null) => void;
	/** Resultado do run (ou null). */
	result: ToolRunResult | null;
	/** Chave de download dentro de `output`. */
	downloadKey: string;
	/** Rótulo do botão de ação (ui.action.label). */
	actionLabel: string;
	/** Geração em andamento. */
	pending: boolean;
	/**
	 * O que o botão diz ENQUANTO roda. "Gerando…" serve para um trabalho de 40
	 * segundos; para um lote de 30 peças, que leva minutos, ele é indistinguível
	 * de tela travada — e o aluno já pagou, então recarregar é o pior que ele
	 * pode fazer. Ausente = "Gerando…".
	 */
	pendingLabel?: string;
	/** Sem saldo de voxxys → bloqueia ação. */
	insufficient: boolean;
	/** Validação local satisfeita (tema/imagens conforme o modo). */
	canGenerate: boolean;
	/** Resolução de saída escolhida (null = default da tool/banco). */
	imageSize: RunToolEngineImageSize | null;
	onImageSizeChange: (v: RunToolEngineImageSize | null) => void;
	/** Dispara o run (runBank no DynamicToolView). */
	onGenerate: () => void;
	/** Limpa o resultado (Gerar outra). */
	onResetResult: () => void;
	/** Volta pra galeria. */
	onBack: () => void;
	/** Rótulo do voltar. A tela anterior nem sempre é uma "galeria". */
	backLabel?: string;
	/**
	 * Veste a tela na linguagem da Arte Licenciada — versalete, linha pontilhada
	 * e a moldura escura do balcão, no lugar do cromo genérico.
	 *
	 * OPCIONAL E AUSENTE POR PADRÃO, e isto não é detalhe: esta tela é a MESMA
	 * dos Prompts Mágicos. Todo ramo aqui dentro é
	 * `licenciada ? <novo/> : <o de sempre/>`, nunca uma edição da marcação
	 * compartilhada — quem não passa a prop recebe exatamente o que recebia.
	 */
	variante?: 'licenciada';
	/**
	 * A marca em uso. Sem ela o aluno entrava por "Corinthians → Caneca 360°" e
	 * a tela seguinte não dizia Corinthians em lugar nenhum: a marca sumia
	 * justamente onde ele gasta voxxy. Vem do `onSelect` do balcão, que já a
	 * entrega inteira — nenhuma chamada nova.
	 */
	marca?: LicensedBrand | null;
	/** Aviso inline de billing (ReactNode) — renderizado abaixo da ação. */
	billingNotice?: ReactNode;
	/** Cards do Passo 1 (Tipos de Criação) — da definition da tool. Vazio = sem Passo 1. */
	creations?: Creation[];
	/** Id do card selecionado no Passo 1 (controlado pelo DynamicToolView). */
	creationId?: string | null;
	onCreationIdChange?: (id: string | null) => void;
	/** Variações oferecidas no Passo 3 (ex.: [1,2,4]) — da definition. Vazio = sem Passo 3. */
	returnVariations?: number[];
	/**
	 * TIRAGEM: quantas peças licenciadas a rodada produz. Só as tools que
	 * declaram `print_run` na definition mostram esta etapa — nas outras, nada
	 * muda.
	 */
	printRunOptions?: number[];
	printRun?: number;
	onPrintRunChange?: (n: number) => void;
	/** Teto da tiragem (env do motor, espelhado pela definition). */
	printRunMax?: number;
	/**
	 * DADOS VARIÁVEIS: uma linha por peça, cada uma com seu nome e/ou sua foto.
	 * `null` é o lote uniforme — N cópias da mesma arte, que é o padrão.
	 */
	pecas?: PecaDaLista[] | null;
	onPecasChange?: (p: PecaDaLista[] | null) => void;
	/** Quantidade selecionada no Passo 3 (controlado pelo DynamicToolView). */
	variationCount?: number | null;
	onVariationCountChange?: (n: number | null) => void;
}

export function PromptGenerateView({
	entry,
	tema,
	onTemaChange,
	specs,
	specValues,
	onSpecValueChange,
	referencias,
	onReferenciaChange,
	result,
	downloadKey,
	actionLabel,
	pending,
	pendingLabel,
	insufficient,
	canGenerate,
	imageSize,
	onImageSizeChange,
	onGenerate,
	onResetResult,
	onBack,
	backLabel = 'Voltar à galeria',
	variante,
	marca,
	billingNotice,
	creations,
	creationId,
	onCreationIdChange,
	returnVariations,
	variationCount,
	onVariationCountChange,
	printRunOptions,
	printRun = 1,
	onPrintRunChange,
	printRunMax = 50,
	pecas = null,
	onPecasChange,
}: PromptGenerateViewProps) {
	const mode = modeOf(entry);
	const needsTema = modeUsesText(mode);
	const needsImage = modeUsesImage(mode);
	const maxImages = maxImagesOf(entry);
	const hasCreations = !!creations && creations.length > 0;
	const hasVariations = !!returnVariations && returnVariations.length > 0;
	const hasTiragem = !!printRunOptions && printRunOptions.length > 1;
	// Tiragem > 1 desliga variações: 4 versões × 50 peças são 200 arquivos, e
	// não é fluxo real — quem encomenda tiragem já escolheu a arte.
	const variacoesTravadas = hasTiragem && printRun > 1;

	const steps = useMemo(
		() =>
			stepsForMode(mode, {
				creations: creations ?? [],
				returnVariations: returnVariations ?? [],
			}),
		[mode, creations, returnVariations],
	);

	// Etapas concluídas + ativa, derivadas do estado do form (NÃO bloqueia clique).
	const { completed, active } = useMemo(() => {
		const done = new Set<PromptStep['key']>();
		if (hasCreations && creationId) done.add('criacao');
		const hasImage = referencias
			.slice(0, maxImages)
			.some((f) => f instanceof File);
		if (needsTema && hasTextInput(specs, specValues, tema)) done.add('tema');
		if (needsImage && hasImage) done.add('referencias');
		if (hasVariations && variationCount) done.add('variacoes');
		if (result) done.add('gerar');
		// A etapa ativa é a primeira ainda não concluída.
		const activeStep =
			steps.find((s) => !done.has(s.key))?.key ?? steps[steps.length - 1].key;
		return { completed: done, active: activeStep };
	}, [
		hasCreations,
		creationId,
		needsTema,
		needsImage,
		specs,
		specValues,
		tema,
		referencias,
		maxImages,
		hasVariations,
		variationCount,
		result,
		steps,
	]);

	// Numeração das seções visíveis (1, 2, 3…) — só conta as que aparecem. Ordem
	// visual: ① Tipo → ② Variações → ③ Detalhes (este último em linha própria).
	const antesDaLista =
		(hasCreations ? 1 : 0) + (hasVariations ? 1 : 0) + (hasTiragem ? 1 : 0);
	const temLista = hasTiragem && !!pecas && !!onPecasChange;
	const sectionNo = {
		criacao: 1,
		variacoes: hasCreations ? 2 : 1,
		tiragem: (hasCreations ? 1 : 0) + (hasVariations ? 1 : 0) + 1,
		lista: antesDaLista + 1,
		detalhes: antesDaLista + (temLista ? 1 : 0) + 1,
	};
	// Cards compactos lado a lado (Tipo | Variações); Detalhes vai numa linha
	// própria full-width abaixo. Sem os dois compactos → nada nesta linha.
	const compactos = [hasCreations, hasVariations, hasTiragem].filter(
		Boolean,
	).length;
	const compactColsClass =
		// Três cards compactos quando a tool tem tiragem (Tipo | Variações |
		// Tiragem); dois quando não tem.
		compactos >= 3
			? 'md:grid-cols-3'
			: compactos === 2
				? 'md:grid-cols-2'
				: 'grid-cols-1';
	// A identidade da tela cabe em poucos lugares; este é um deles. O ramo
	// licenciado veste a moldura do balcão para a tela deixar de ser uma ilha
	// clara entre duas telas de certificado.
	const licenciada = variante === 'licenciada';
	const animar = useAnimar();
	/**
	 * O campo de número exato está aberto? Os atalhos cobrem o pedido redondo; a
	 * encomenda real é "23 canecas", e sem isto ela obrigava a pagar 25.
	 */
	const [pediuNumero, setNumeroLivre] = useState(false);
	/**
	 * Nenhum atalho casa com o número atual — então o campo aparece com ele
	 * dentro, em vez de a tela mostrar quatro botões apagados e nenhum valor. É
	 * o caso normal quando a LISTA manda na tiragem: 23 linhas, 23 peças.
	 */
	const numeroLivre =
		pediuNumero || (!!printRunOptions && !printRunOptions.includes(printRun));

	const stepCardCls = licenciada
		? 'rounded-lg border border-[var(--al-rule)] bg-[var(--al-card)] p-5'
		: 'rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#1a1a1d]';

	return (
		<div
			className={
				licenciada
					? `${TEMA_LICENCIADA} space-y-5 text-[var(--al-ink)]`
					: 'space-y-6'
			}
		>
			<button
				type="button"
				onClick={onBack}
				className={
					licenciada
						? `${MONO} inline-flex items-center gap-1.5 text-[var(--al-mute)] transition-colors hover:text-[var(--al-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-ink)]`
						: 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
				}
			>
				<ArrowLeft className={licenciada ? 'h-3.5 w-3.5' : 'h-4 w-4'} />{' '}
				{backLabel}
			</button>

			<PromptHero entry={entry} licenciada={licenciada} marca={marca} />

			{/* Stepper */}
			<div
				className={
					licenciada
						? 'rounded-lg border border-[var(--al-rule)] bg-[var(--al-card)] px-4 py-3'
						: 'rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#1a1a1d]'
				}
			>
				<PromptStepper
					steps={steps}
					completed={completed}
					active={active}
					licenciada={licenciada}
					animar={animar}
				/>
			</div>

			{/* Linha 1 — cards compactos lado a lado (① Tipo | ② Variações).
			    Detalhes vira uma linha própria full-width abaixo (não espremido). */}
			{(hasCreations || hasVariations || hasTiragem) && (
				<div className={`grid items-stretch gap-4 ${compactColsClass}`}>
					{/* ① Tipo de Criação (cards; resolução OCULTA) */}
					{hasCreations && (
						<section className={`${stepCardCls} space-y-3`}>
							<SectionHeader
								licenciada={licenciada}
								no={sectionNo.criacao}
								title="Tipo de criação"
								hint="Escolha o formato"
							/>
							<div className="grid grid-cols-2 gap-2.5">
								{creations!
									.filter((c) => c.active !== false)
									.map((c) => {
										const selected = creationId === c.id;
										const Icon = resolveToolIcon(c.icon);
										return (
											<button
												key={c.id}
												type="button"
												onClick={() =>
													onCreationIdChange?.(selected ? null : c.id)
												}
												className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors ${
													selected
														? 'border-transparent text-white'
														: 'border-slate-200 bg-slate-50 text-slate-700 hover:border-[color-mix(in_srgb,var(--screen-accent)_50%,transparent)] dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
												}`}
												style={
													selected
														? {
																backgroundColor: 'var(--screen-accent)',
																boxShadow:
																	'0 0 0 2px color-mix(in srgb, var(--screen-accent) 40%, transparent)',
															}
														: undefined
												}
											>
												<Icon className="h-6 w-6" />
												<span className="text-xs font-semibold leading-tight">
													{c.label}
												</span>
											</button>
										);
									})}
							</div>
						</section>
					)}

					{/* ② Variações (1×/2×/4×) — pills horizontais compactos */}
					{hasVariations && (
						<section className={`${stepCardCls} space-y-3`}>
							<SectionHeader
								licenciada={licenciada}
								no={sectionNo.variacoes}
								title="Variações"
								hint="Quantas versões gerar"
							/>
							<div className="flex flex-wrap gap-2">
								{returnVariations!.map((n) => {
									const selected = variationCount === n;
									return (
										<button
											key={n}
											type="button"
											disabled={variacoesTravadas && n !== 1}
											onClick={() =>
												onVariationCountChange?.(selected ? null : n)
											}
											className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
												selected
													? 'border-transparent text-white'
													: 'border-slate-200 bg-slate-50 text-slate-700 hover:border-[color-mix(in_srgb,var(--screen-accent)_50%,transparent)] dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
											}`}
											style={selected ? ACCENT_BG : undefined}
										>
											<span className="text-base leading-none">{n}×</span>
											{n === 1 ? '1 imagem' : `${n} imagens`}
										</button>
									);
								})}
							</div>
						</section>
					)}

					{/* ③ Tiragem — quantas PEÇAS licenciadas a rodada produz */}
					{hasTiragem && (
						<section className={`${stepCardCls} space-y-3`}>
							<SectionHeader
								licenciada={licenciada}
								no={sectionNo.tiragem}
								title="Tiragem"
								hint="Quantas peças você vai gravar"
							/>
							<div className="flex flex-wrap items-center gap-2">
								{printRunOptions!.map((n) => {
									const selected = printRun === n && !numeroLivre;
									return (
										<button
											key={n}
											type="button"
											onClick={() => {
												setNumeroLivre(false);
												onPrintRunChange?.(n);
											}}
											className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
												selected
													? 'border-transparent text-white'
													: 'border-slate-200 bg-slate-50 text-slate-700 hover:border-[color-mix(in_srgb,var(--screen-accent)_50%,transparent)] dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
											}`}
											style={selected ? ACCENT_BG : undefined}
										>
											{n === 1 ? '1 peça' : `${n} peças`}
										</button>
									);
								})}
								{/* O NÚMERO EXATO. Os atalhos cobrem o pedido redondo; a
								    encomenda real é "23 canecas", e sem este campo ela
								    obrigava a pagar 25 ou gerar 10 e ampliar. */}
								{numeroLivre ? (
									<input
										type="number"
										min={1}
										max={printRunMax}
										// Foco por ref, e não `autoFocus`: o campo só existe
										// depois de o aluno pedir "outro número", então o foco
										// aqui é a continuação do gesto dele, não um sequestro
										// do teclado na carga da página.
										ref={(el) => el?.focus()}
										value={printRun}
										onChange={(e) => {
											const n = Number.parseInt(e.target.value, 10);
											if (Number.isFinite(n)) {
												onPrintRunChange?.(
													Math.max(1, Math.min(printRunMax, n)),
												);
											}
										}}
										className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
									/>
								) : (
									<button
										type="button"
										onClick={() => setNumeroLivre(true)}
										className="rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:border-[color-mix(in_srgb,var(--screen-accent)_50%,transparent)] dark:border-white/15 dark:text-slate-300"
									>
										Outro número
									</button>
								)}
							</div>

							{/* Uniforme ou personalizado — a escolha que muda a natureza
							    (e o preço) do lote. */}
							{onPecasChange && (
								<div className="flex flex-wrap gap-2 border-t border-[var(--al-rule)] pt-3">
									{(
										[
											['iguais', 'Todas iguais'],
											['variaveis', 'Cada peça diferente'],
										] as const
									).map(([modo, rotulo]) => {
										const ativo = (modo === 'variaveis') === !!pecas;
										return (
											<button
												key={modo}
												type="button"
												onClick={() => {
													if (modo === 'iguais') return onPecasChange(null);
													onPecasChange(
														Array.from({ length: Math.max(2, printRun) }, () =>
															pecaVazia(),
														),
													);
												}}
												className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
													ativo
														? 'border-transparent text-white'
														: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
												}`}
												style={ativo ? ACCENT_BG : undefined}
											>
												{rotulo}
											</button>
										);
									})}
								</div>
							)}

							<p className="text-xs leading-relaxed text-slate-500 dark:text-gray-400">
								{pecas
									? 'Cada linha vira uma peça gerada só para ela, com seu próprio código de autenticidade. Por isso o lote personalizado custa por linha, e não por cópia.'
									: 'Cada peça sai num arquivo próprio, com um código de autenticidade diferente gravado nela. É esse código que prova que a peça é oficial — e é por peça que a marca é remunerada.'}
							</p>
						</section>
					)}
				</div>
			)}

			{/* A LISTA, em linha própria: ela cresce até 50 linhas e não cabe num
			    cartão de um terço de largura. */}
			{hasTiragem && pecas && onPecasChange && (
				<section className={`${stepCardCls} space-y-3.5`}>
					<SectionHeader
						licenciada={licenciada}
						no={sectionNo.lista}
						title="O que muda em cada peça"
						hint="Um nome, uma foto, ou os dois"
					/>
					<LicensedPiecesEditor
						pecas={pecas}
						onChange={onPecasChange}
						max={printRunMax}
					/>
				</section>
			)}

			{/* Linha 2 — ③ Detalhes (linha própria, full-width). Sem nome de
			    projeto: só o textarea do prompt + referências quando o modo pede. */}
			<section className={`${stepCardCls} space-y-3.5`}>
				<SectionHeader
					licenciada={licenciada}
					no={sectionNo.detalhes}
					title="Detalhes"
					hint="Quanto mais específico, melhor"
				/>
				{needsTema && specs.length > 0 && (
					<div className="space-y-3">
						{specs.map((s) => (
							<div key={s.name} className="space-y-1.5">
								<label
									htmlFor={`bank-spec-${s.name}`}
									className="block text-xs font-medium text-slate-500 dark:text-slate-400"
								>
									{s.label}
									{s.required && <span className="text-rose-400"> *</span>}
								</label>
								<input
									id={`bank-spec-${s.name}`}
									value={specValues[s.name] ?? ''}
									onChange={(e) => onSpecValueChange(s.name, e.target.value)}
									placeholder={s.placeholder}
									className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[color-mix(in_srgb,var(--screen-accent)_50%,transparent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--screen-accent)_30%,transparent)] dark:border-white/10 dark:bg-[#111] dark:text-slate-200"
								/>
							</div>
						))}
					</div>
				)}
				{needsTema && specs.length === 0 && (
					<div className="space-y-1.5">
						<label
							htmlFor="bank-tema"
							className="block text-xs font-medium text-slate-500 dark:text-slate-400"
						>
							Detalhes do prompt
						</label>
						<textarea
							id="bank-tema"
							value={tema}
							onChange={(e) => onTemaChange(e.target.value)}
							rows={5}
							placeholder="Ex.: cachorro astronauta no espaço, estilo traço preto, hachura"
							className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[color-mix(in_srgb,var(--screen-accent)_50%,transparent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--screen-accent)_30%,transparent)] dark:border-white/10 dark:bg-[#111] dark:text-slate-200"
						/>
					</div>
				)}
				{needsImage && (
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: maxImages }).map((_, i) => (
							<ReferenceDrop
								key={`ref-${i}`}
								label={
									maxImages > 1 ? `Referência ${i + 1}` : 'Imagem de referência'
								}
								file={referencias[i] ?? null}
								onChange={(f) => onReferenciaChange(i, f)}
							/>
						))}
					</div>
				)}
				{!needsTema && !needsImage && (
					<p className="text-sm text-slate-400 dark:text-slate-500">
						Nenhum detalhe necessário — é só gerar.
					</p>
				)}
			</section>

			{/* Resolução de saída (opcional, largura total) */}
			<section className={`${stepCardCls} space-y-3`}>
				<ImageSizePicker value={imageSize} onChange={onImageSizeChange} />
			</section>

			{/* Gerar (largura total) */}
			<div className="space-y-3">
				<button
					type="button"
					onClick={onGenerate}
					disabled={pending || insufficient || !canGenerate}
					style={screenAccentBg}
					className={`flex w-full items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 ${
						// O carimbo no clique: o mesmo gesto do campo da marca no balcão.
						licenciada ? 'rounded-lg active:scale-[0.985]' : 'rounded-xl'
					}`}
				>
					{pending ? (
						<>
							<Loader2 className="h-5 w-5 animate-spin" />
							{pendingLabel ?? 'Gerando...'}
						</>
					) : (
						<>
							<Wand2 className="h-5 w-5" />
							{actionLabel}
						</>
					)}
				</button>
				{billingNotice}
			</div>

			{/* Resultado (largura total) */}
			<div>
				{result ? (
					<div className="space-y-4">
						<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#1a1a1d]">
							<BankResultGallery result={result} downloadKey={downloadKey} />
						</div>
						<button
							type="button"
							onClick={onResetResult}
							className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
						>
							<RotateCcw className="h-4 w-4" /> Gerar outra
						</button>
					</div>
				) : pending ? (
					<GeneratingState />
				) : (
					<div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center dark:border-white/10">
						<div
							className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
							style={ACCENT_TINT}
						>
							<Sparkles className="h-7 w-7" style={ACCENT_TEXT} />
						</div>
						<p className="text-sm font-medium text-slate-500 dark:text-gray-400">
							O resultado da IA aparece aqui
						</p>
						<p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
							Preencha{' '}
							{needsTema ? (specs.length > 0 ? 'os campos' : 'o tema') : ''}
							{needsTema && needsImage ? ' e ' : ''}
							{needsImage ? 'as referências' : ''} e gere.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
