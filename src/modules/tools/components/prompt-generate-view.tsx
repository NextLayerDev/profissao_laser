'use client';

import {
	ArrowLeft,
	Check,
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
import type { ToolBankEntry } from '../services/tool-bank.service';
import type { ToolRunResult } from '../services/tool-definitions.service';

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
					<p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 dark:text-white">
						{file.name}
					</p>
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

/* ─────────────────── Main view ─────────────────── */

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
	/** Dispara o run (runBank no DynamicToolView). */
	onGenerate: () => void;
	/** Limpa o resultado (Gerar outra). */
	onResetResult: () => void;
	/** Volta pra galeria. */
	onBack: () => void;
	/** Aviso inline de billing (ReactNode) — renderizado abaixo da ação. */
	billingNotice?: ReactNode;
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
	onGenerate,
	onResetResult,
	onBack,
	billingNotice,
}: PromptGenerateViewProps) {
	const mode = modeOf(entry);
	const needsTema = modeUsesText(mode);
	const needsImage = modeUsesImage(mode);
	const maxImages = maxImagesOf(entry);

	const steps = useMemo(() => stepsForMode(mode), [mode]);

	// Etapas concluídas + ativa, derivadas do estado do form (NÃO bloqueia clique).
	const { completed, active } = useMemo(() => {
		const done = new Set<PromptStep['key']>();
		const hasImage = referencias
			.slice(0, maxImages)
			.some((f) => f instanceof File);
		if (needsTema && tema.trim()) done.add('tema');
		if (needsImage && hasImage) done.add('referencias');
		if (result) done.add('gerar');
		// A etapa ativa é a primeira ainda não concluída.
		const activeStep =
			steps.find((s) => !done.has(s.key))?.key ?? steps[steps.length - 1].key;
		return { completed: done, active: activeStep };
	}, [needsTema, needsImage, tema, referencias, maxImages, result, steps]);

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

			{/* Form | Result */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Form panel */}
				<div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#1a1a1d]">
					{needsTema && (
						<div className="space-y-1.5">
							<label
								htmlFor="bank-tema"
								className="block text-sm font-medium text-slate-700 dark:text-slate-300"
							>
								Tema
							</label>
							<input
								id="bank-tema"
								value={tema}
								onChange={(e) => onTemaChange(e.target.value)}
								placeholder="Ex.: cachorro astronauta no espaço"
								className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[color-mix(in_srgb,var(--screen-accent)_50%,transparent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--screen-accent)_30%,transparent)] dark:border-white/10 dark:bg-[#111] dark:text-slate-200"
							/>
						</div>
					)}

					{needsImage && (
						<div
							className={
								maxImages > 1 ? 'grid gap-4 sm:grid-cols-2' : 'space-y-4'
							}
						>
							{Array.from({ length: maxImages }).map((_, i) => (
								<ReferenceDrop
									key={`ref-${i}`}
									label={
										maxImages > 1
											? `Imagem de referência ${i + 1}`
											: 'Imagem de referência'
									}
									file={referencias[i] ?? null}
									onChange={(f) => onReferenciaChange(i, f)}
								/>
							))}
						</div>
					)}

					<button
						type="button"
						onClick={onGenerate}
						disabled={pending || insufficient || !canGenerate}
						style={screenAccentBg}
						className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
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

				{/* Result panel */}
				<div>
					{result ? (
						<div className="space-y-4">
							<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#1a1a1d]">
								<BankResultImage result={result} downloadKey={downloadKey} />
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
						<div
							className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center"
							style={{
								borderColor:
									'color-mix(in srgb, var(--screen-accent) 40%, transparent)',
								backgroundColor:
									'color-mix(in srgb, var(--screen-accent) 5%, transparent)',
							}}
						>
							<div
								className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
								style={ACCENT_TINT}
							>
								<Loader2 className="h-7 w-7 animate-spin" style={ACCENT_TEXT} />
							</div>
							<p className="text-sm font-medium text-slate-600 dark:text-slate-200">
								Gerando sua imagem...
							</p>
							<p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
								A IA está trabalhando — isso leva alguns segundos.
							</p>
						</div>
					) : (
						<div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 text-center dark:border-white/10">
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
		</div>
	);
}
