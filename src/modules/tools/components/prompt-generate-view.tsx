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
	maxImagesOf,
	modeLabel,
	modeOf,
	modeUsesImage,
	modeUsesText,
	type PromptStep,
	stepsForMode,
} from '../lib/prompt-bank';
import { screenAccentBg } from '../lib/screen-ui';
import { resolveToolIcon } from '../lib/tool-icons';
import type { ToolBankEntry } from '../services/tool-bank.service';
import type {
	Creation,
	RunToolEngineImageSize,
	ToolRunResult,
} from '../services/tool-definitions.service';

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
}: {
	steps: PromptStep[];
	completed: Set<PromptStep['key']>;
	active: PromptStep['key'];
}) {
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
	const images = result.output.images;
	if (!isResultImageArray(images)) {
		return <BankResultImage result={result} downloadKey={downloadKey} />;
	}
	return (
		<div className="space-y-4">
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

function PromptHero({ entry }: { entry: ToolBankEntry }) {
	const cover = coverOf(entry);
	const mode = modeOf(entry);
	const maxImages = maxImagesOf(entry);
	const showsImage = modeUsesImage(mode);

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
}: {
	no: number;
	title: string;
	hint?: string;
}) {
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
	/** Aviso inline de billing (ReactNode) — renderizado abaixo da ação. */
	billingNotice?: ReactNode;
	/** Cards do Passo 1 (Tipos de Criação) — da definition da tool. Vazio = sem Passo 1. */
	creations?: Creation[];
	/** Id do card selecionado no Passo 1 (controlado pelo DynamicToolView). */
	creationId?: string | null;
	onCreationIdChange?: (id: string | null) => void;
	/** Variações oferecidas no Passo 3 (ex.: [1,2,4]) — da definition. Vazio = sem Passo 3. */
	returnVariations?: number[];
	/** Quantidade selecionada no Passo 3 (controlado pelo DynamicToolView). */
	variationCount?: number | null;
	onVariationCountChange?: (n: number | null) => void;
}

export function PromptGenerateView({
	entry,
	tema,
	onTemaChange,
	referencias,
	onReferenciaChange,
	result,
	downloadKey,
	actionLabel,
	pending,
	insufficient,
	canGenerate,
	imageSize,
	onImageSizeChange,
	onGenerate,
	onResetResult,
	onBack,
	billingNotice,
	creations,
	creationId,
	onCreationIdChange,
	returnVariations,
	variationCount,
	onVariationCountChange,
}: PromptGenerateViewProps) {
	const mode = modeOf(entry);
	const needsTema = modeUsesText(mode);
	const needsImage = modeUsesImage(mode);
	const maxImages = maxImagesOf(entry);
	const hasCreations = !!creations && creations.length > 0;
	const hasVariations = !!returnVariations && returnVariations.length > 0;

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
		if (needsTema && tema.trim()) done.add('tema');
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
	const sectionNo = {
		criacao: 1,
		variacoes: hasCreations ? 2 : 1,
		detalhes: (hasCreations ? 1 : 0) + (hasVariations ? 1 : 0) + 1,
	};
	// Cards compactos lado a lado (Tipo | Variações); Detalhes vai numa linha
	// própria full-width abaixo. Sem os dois compactos → nada nesta linha.
	const compactColsClass =
		hasCreations && hasVariations ? 'md:grid-cols-2' : 'grid-cols-1';
	const stepCardCls =
		'rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#1a1a1d]';

	return (
		<div className="space-y-6">
			<button
				type="button"
				onClick={onBack}
				className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
			>
				<ArrowLeft className="h-4 w-4" /> Voltar à galeria
			</button>

			<PromptHero entry={entry} />

			{/* Stepper */}
			<div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#1a1a1d]">
				<PromptStepper steps={steps} completed={completed} active={active} />
			</div>

			{/* Linha 1 — cards compactos lado a lado (① Tipo | ② Variações).
			    Detalhes vira uma linha própria full-width abaixo (não espremido). */}
			{(hasCreations || hasVariations) && (
				<div className={`grid items-stretch gap-4 ${compactColsClass}`}>
					{/* ① Tipo de Criação (cards; resolução OCULTA) */}
					{hasCreations && (
						<section className={`${stepCardCls} space-y-3`}>
							<SectionHeader
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
				</div>
			)}

			{/* Linha 2 — ③ Detalhes (linha própria, full-width). Sem nome de
			    projeto: só o textarea do prompt + referências quando o modo pede. */}
			<section className={`${stepCardCls} space-y-3.5`}>
				<SectionHeader
					no={sectionNo.detalhes}
					title="Detalhes"
					hint="Quanto mais específico, melhor"
				/>
				{needsTema && (
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
					className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
				>
					{pending ? (
						<>
							<Loader2 className="h-5 w-5 animate-spin" />
							Gerando...
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
							Preencha {needsTema ? 'o tema' : ''}
							{needsTema && needsImage ? ' e ' : ''}
							{needsImage ? 'as referências' : ''} e gere.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
