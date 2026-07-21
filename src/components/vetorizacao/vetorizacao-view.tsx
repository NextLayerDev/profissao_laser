'use client';

import {
	ArrowLeft,
	ArrowRight,
	BookOpen,
	Check,
	ChevronDown,
	ChevronUp,
	Crown,
	Download,
	FolderOpen,
	Headphones,
	HelpCircle,
	Image,
	Layers,
	Loader2,
	PenLine,
	Play,
	RotateCcw,
	Save,
	Settings,
	Sliders,
	Sparkles,
	Upload,
	Wand2,
	Zap,
} from 'lucide-react';
import NextImage from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { useEntitlements } from '@/hooks/use-entitlements';
import {
	useAiLineartVectorize,
	useAnalyzeVectorize,
	useCustomerVectors,
	useInvertVector,
	useSaveVector,
	useVectorizeImage,
	useVectorizePreview,
} from '@/hooks/use-vectors';
import { useToolBilling } from '@/modules/tools/hooks/use-tool-billing';
import type {
	ImageProfile,
	InvertedVector,
	InvertMode,
	VectorFormat,
	VectorizeParams,
	VectorizePreset,
	VectorizeResult,
} from '@/services/vectorize';
import { chargeVectorFormat } from '@/services/vectorize';
import { VectorList } from './vector-list';
import { VectorSupportPanel } from './vector-support-panel';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type WizardStep = 1 | 2 | 3;
/** Cor de fundo da PRÉVIA — puramente cosmética, não toca o arquivo. */
type BgMode = 'transparent' | 'white' | 'black';
/** Polaridade do ARQUIVO (SVG/PNG/DXF que o cliente baixa). */
type Polarity = 'normal' | 'inverted';

/* ─────────────── Presets de qualidade ─────────────── */

const DEFAULT_PARAMS: VectorizeParams = {
	mode: 'trace',
	threshold: 128,
	invert: false,
	blur: null,
	sharpen: false,
	brightness: null,
	contrast: null,
	gamma: null,
	edgeDetection: 'none',
	turdSize: 5,
	optTolerance: 0.2,
	alphaMax: 1,
	turnPolicy: null,
	blackOnWhite: true,
	posterizeLevels: 4,
	posterizeFillStrategy: 'dominant',
	posterizeRangeDistribution: 'auto',
	ditherAlgorithm: null,
	drawingStyle: 'fill',
	color: '#000000',
	strokeWidth: 1,
	nonScalingStroke: false,
	linePattern: 'none',
	lineSpacing: 3,
	lineAngle: null,
	dpi: null,
	outputWidth: null,
	outputHeight: null,
	svgOptimize: false,
};

const PRESET_PARAMS: Record<VectorizePreset, Partial<VectorizeParams>> = {
	// Automático = ponto de partida; a análise da imagem sobrescreve com os
	// parâmetros ideais (router + image analytics) assim que chega.
	automatico: { mode: 'trace', threshold: 128, turdSize: 3, optTolerance: 0.2 },
	// Rápido = traço P&B simples → cai no fast-path da API
	rapido: { mode: 'trace', threshold: 128, turdSize: 5, optTolerance: 0.4 },
	// Detalhado = trace limpo de alta qualidade (não posterize). Posterize
	// empilhava N camadas por forma → "linhas sobrepostas" e fontes quebradas.
	// O motor faz supersampling antes de traçar; sharpen recupera bordas.
	detalhado: {
		mode: 'trace',
		threshold: 128,
		turdSize: 2,
		optTolerance: 0.2,
		alphaMax: 1.0,
		sharpen: true,
	},
	// Apenas SVG = traço puro e limpo, sem pós-processamento
	svg: {
		mode: 'trace',
		threshold: 128,
		turdSize: 2,
		optTolerance: 0.2,
		svgOptimize: true,
		linePattern: 'none',
	},
};

function presetParams(preset: VectorizePreset): VectorizeParams {
	return { ...DEFAULT_PARAMS, ...PRESET_PARAMS[preset], preset };
}

/* ─────────────── Cor vs P&B (Automático) ─────────────── */

type ColorChoice = 'auto' | 'color' | 'bw';

/**
 * Traduz o botão Cor / P&B (do modo Automático) em parâmetros do motor, usando a
 * classe detectada pela análise. É o "P&B inteligente": foto/tonal em P&B vira
 * meio-tom (posterize) preservando os tons — em vez do limiar 1-bit duro que
 * "saía muito ruim"; logo/linha/texto seguem em traço limpo.
 */
function colorOverrideParams(
	choice: ColorChoice,
	analysis: ImageProfile | null,
): Partial<VectorizeParams> {
	if (choice === 'color') {
		return {
			mode: 'color',
			edgeDetection: 'none',
			maxColors: analysis?.recommendedParams?.maxColors ?? 8,
			ditherAlgorithm: null,
		};
	}
	if (choice === 'bw') {
		const cls = analysis?.class;
		// Foto / imagem colorida → o P&B usa LINE-ART com IA (o botão "Vetorizar" vira
		// "Gerar com IA"). Estes params só preparam o trace do resultado da IA.
		if (cls === 'photo' || cls === 'grayscale_tonal' || cls === 'color_flat') {
			return {
				mode: 'trace',
				edgeDetection: 'none',
				ditherAlgorithm: null,
				turdSize: 3,
			};
		}
		// Logo / linha / texto → traço limpo (limiar Otsu; formas chapadas crispas).
		const otsu = analysis?.metrics?.otsuThreshold;
		return {
			mode: 'trace',
			edgeDetection: 'none',
			ditherAlgorithm: null,
			...(otsu != null ? { threshold: otsu } : {}),
		};
	}
	// 'auto' → recomendação da análise (reset do edgeDetection p/ não vazar 'lineart').
	return { edgeDetection: 'none', ...(analysis?.recommendedParams ?? {}) };
}

/* ─────────────── Download helpers ─────────────── */

function downloadSvg(svgContent: string, originalName: string) {
	const baseName = originalName.replace(/\.[^.]+$/, '') || 'vector';
	const blob = new Blob([svgContent], { type: 'image/svg+xml' });
	triggerDownload(URL.createObjectURL(blob), `${baseName}.svg`, true);
}

function downloadDxf(dxfContent: string, originalName: string) {
	const baseName = originalName.replace(/\.[^.]+$/, '') || 'vector';
	const blob = new Blob([dxfContent], { type: 'application/dxf' });
	triggerDownload(URL.createObjectURL(blob), `${baseName}.dxf`, true);
}

async function downloadPng(url: string, originalName: string) {
	const baseName = originalName.replace(/\.[^.]+$/, '') || 'vector';
	try {
		const res = await fetch(url);
		const blob = await res.blob();
		triggerDownload(URL.createObjectURL(blob), `${baseName}.png`, true);
	} catch {
		window.open(url, '_blank');
	}
}

function triggerDownload(url: string, fileName: string, revoke: boolean) {
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	a.click();
	if (revoke) URL.revokeObjectURL(url);
}

function svgToDataUrl(svgContent: string): string {
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─────────────── Step Indicator ─────────────── */

function StepIndicator({ current }: { current: WizardStep }) {
	const steps = [
		{ num: 1 as const, label: 'Envie sua imagem' },
		{ num: 2 as const, label: 'Ajuste os parâmetros' },
		{ num: 3 as const, label: 'Resultado' },
	];

	return (
		<div className="flex items-center justify-center gap-0 mb-8">
			{steps.map((step, idx) => {
				const done = current > step.num;
				const active = current === step.num;
				return (
					<div key={step.num} className="flex items-center">
						<div className="flex flex-col items-center">
							<div
								className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
									done
										? 'bg-violet-600 text-white'
										: active
											? 'bg-violet-600 text-white ring-4 ring-violet-500/20'
											: 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-gray-400'
								}`}
							>
								{done ? <Check className="w-5 h-5" /> : step.num}
							</div>
							<span
								className={`mt-2 text-xs font-medium hidden sm:block ${
									active
										? 'text-violet-600 dark:text-violet-400'
										: done
											? 'text-slate-600 dark:text-gray-400'
											: 'text-slate-400 dark:text-gray-500'
								}`}
							>
								{step.label}
							</span>
						</div>
						{idx < steps.length - 1 && (
							<div
								className={`w-12 sm:w-20 h-0.5 mx-2 sm:mx-3 mb-5 sm:mb-0 ${
									current > step.num
										? 'bg-violet-600'
										: 'bg-slate-200 dark:bg-white/10'
								}`}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}

/* ─────────────── Step 1: Upload ─────────────── */

function StepUpload({
	onFileSelected,
	file,
	originalPreviewUrl,
}: {
	onFileSelected: (file: File) => void;
	file: File | null;
	originalPreviewUrl: string | null;
}) {
	const [isDragging, setIsDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			const dropped = e.dataTransfer.files[0];
			if (dropped) onFileSelected(dropped);
		},
		[onFileSelected],
	);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const selected = e.target.files?.[0];
			if (selected) onFileSelected(selected);
			e.target.value = '';
		},
		[onFileSelected],
	);

	return (
		<div className="space-y-6">
			<div
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
				}}
				aria-label="Arraste imagens ou clique para selecionar"
				onDrop={handleDrop}
				onDragOver={(e) => {
					e.preventDefault();
					setIsDragging(true);
				}}
				onDragLeave={(e) => {
					e.preventDefault();
					setIsDragging(false);
				}}
				onClick={() => inputRef.current?.click()}
				className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-14 transition-colors cursor-pointer ${
					isDragging
						? 'border-violet-600 bg-violet-500/10 dark:bg-violet-500/20'
						: 'border-slate-200 dark:border-white/10 hover:border-violet-500/50 dark:hover:border-white/20'
				}`}
			>
				<input
					ref={inputRef}
					type="file"
					accept={ACCEPTED_TYPES.join(',')}
					onChange={handleFileSelect}
					className="hidden"
				/>
				<div className="rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 p-4 text-white mb-4">
					<Upload className="w-10 h-10" />
				</div>
				<p className="text-slate-600 dark:text-gray-400 text-center font-medium mb-1">
					Arraste sua imagem ou clique para selecionar
				</p>
				<p className="text-slate-500 dark:text-gray-500 text-sm">
					PNG, JPG, WEBP (max. 10MB)
				</p>
			</div>

			{file && (
				<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-4">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-500/20">
							<Image className="w-5 h-5 text-violet-600 dark:text-violet-400" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="font-medium text-slate-900 dark:text-white truncate text-sm">
								{file.name}
							</p>
							<p className="text-slate-500 dark:text-gray-400 text-xs">
								{formatFileSize(file.size)} &middot;{' '}
								{file.type.split('/')[1]?.toUpperCase()}
							</p>
						</div>
						<Check className="w-5 h-5 text-emerald-500" />
					</div>
				</div>
			)}

			{file && originalPreviewUrl && (
				<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-4">
					<p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">
						Original
					</p>
					<div className="aspect-video bg-slate-100 dark:bg-[#1a1a1d] rounded-lg flex items-center justify-center overflow-hidden">
						<img
							src={originalPreviewUrl}
							alt="Original"
							className="max-w-full max-h-full object-contain"
						/>
					</div>
				</div>
			)}
		</div>
	);
}

/* ─────────────── Controles reutilizáveis ─────────────── */

function Switch({
	checked,
	onChange,
	disabled,
}: {
	checked: boolean;
	onChange: (v: boolean) => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
				checked ? 'bg-violet-600' : 'bg-slate-300 dark:bg-white/20'
			}`}
		>
			<span
				className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
					checked ? 'translate-x-5' : 'translate-x-0'
				}`}
			/>
		</button>
	);
}

function ToggleRow({
	label,
	checked,
	onChange,
	disabled,
}: {
	label: string;
	checked: boolean;
	onChange: (v: boolean) => void;
	disabled?: boolean;
}) {
	return (
		<div
			className={`flex items-center justify-between py-2 ${disabled ? 'opacity-60' : ''}`}
		>
			<span className="text-sm text-slate-600 dark:text-gray-400">{label}</span>
			<Switch checked={checked} onChange={onChange} disabled={disabled} />
		</div>
	);
}

function RangeRow({
	label,
	value,
	min,
	max,
	step,
	onChange,
	fmt,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onChange: (v: number) => void;
	fmt?: (v: number) => string;
}) {
	return (
		<div className="py-2">
			<div className="flex justify-between mb-1 text-sm">
				<span className="text-slate-600 dark:text-gray-400">{label}</span>
				<span className="font-medium text-slate-700 dark:text-slate-300">
					{fmt ? fmt(value) : value}
				</span>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-white/10 accent-violet-600"
			/>
		</div>
	);
}

function OptionalRangeRow({
	label,
	value,
	min,
	max,
	step,
	def,
	onChange,
}: {
	label: string;
	value: number | null;
	min: number;
	max: number;
	step: number;
	def: number;
	onChange: (v: number | null) => void;
}) {
	const enabled = value !== null;
	return (
		<div className="py-2">
			<div className="flex justify-between items-center mb-1 text-sm">
				<label className="flex items-center gap-2 text-slate-600 dark:text-gray-400 cursor-pointer">
					<input
						type="checkbox"
						checked={enabled}
						onChange={(e) => onChange(e.target.checked ? def : null)}
						className="accent-violet-600"
					/>
					{label}
				</label>
				<span className="font-medium text-slate-700 dark:text-slate-300">
					{enabled ? value : '—'}
				</span>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={enabled ? value : def}
				disabled={!enabled}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-white/10 accent-violet-600 disabled:opacity-40"
			/>
		</div>
	);
}

function OptionalNumberRow({
	label,
	value,
	def,
	suffix,
	onChange,
}: {
	label: string;
	value: number | null;
	def: number;
	suffix?: string;
	onChange: (v: number | null) => void;
}) {
	const enabled = value !== null;
	return (
		<div className="flex items-center justify-between py-2 gap-2">
			<label className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400 cursor-pointer">
				<input
					type="checkbox"
					checked={enabled}
					onChange={(e) => onChange(e.target.checked ? def : null)}
					className="accent-violet-600"
				/>
				{label}
			</label>
			<div className="flex items-center gap-1">
				<input
					type="number"
					value={enabled ? value : ''}
					disabled={!enabled}
					onChange={(e) =>
						onChange(e.target.value === '' ? null : Number(e.target.value))
					}
					className="w-24 px-2 py-1 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] text-slate-700 dark:text-slate-300 disabled:opacity-40"
				/>
				{suffix && <span className="text-xs text-slate-400">{suffix}</span>}
			</div>
		</div>
	);
}

function SelectRow({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: string;
	options: { value: string; label: string }[];
	onChange: (v: string) => void;
}) {
	return (
		<div className="flex items-center justify-between py-2 gap-2">
			<span className="text-sm text-slate-600 dark:text-gray-400">{label}</span>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="px-2 py-1 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] text-slate-700 dark:text-slate-300"
			>
				{options.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
		</div>
	);
}

function Group({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
			<h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">
				{title}
			</h5>
			<div className="divide-y divide-slate-100 dark:divide-white/5">
				{children}
			</div>
		</div>
	);
}

/* ─────────────── Step 2: Presets + Parâmetros ─────────────── */

function StepParams({
	preset,
	params,
	set,
	onVectorize,
	onBack,
	isVectorizing,
	file,
	originalUrl,
	analysis,
	analyzing,
	colorChoice,
	onColorChoice,
	isAiLineart,
	wantInverted,
	onWantInverted,
}: {
	preset: VectorizePreset;
	params: VectorizeParams;
	set: <K extends keyof VectorizeParams>(
		key: K,
		value: VectorizeParams[K],
	) => void;
	onVectorize: () => void;
	onBack: () => void;
	isVectorizing: boolean;
	file: File | null;
	originalUrl: string | null;
	analysis: ImageProfile | null;
	analyzing: boolean;
	colorChoice: ColorChoice;
	onColorChoice: (c: ColorChoice) => void;
	isAiLineart: boolean;
	wantInverted: boolean;
	onWantInverted: (v: boolean) => void;
}) {
	const [advancedOpen, setAdvancedOpen] = useState(false);

	// Preview ao vivo (NÃO cobrado): re-renderiza conforme os sliders mudam.
	// Desligado na line-art com IA (não dá pra rodar IA ao vivo/grátis a cada slider).
	const { data: preview, isFetching: previewLoading } = useVectorizePreview(
		file,
		{ ...params, preset },
		!isAiLineart,
	);

	// 3 modos por finalidade (o modo JÁ define cor/P&B — sem toggle separado).
	const modes: {
		choice: ColorChoice;
		label: string;
		desc: string;
		icon: React.ReactNode;
	}[] = [
		{
			choice: 'auto',
			label: 'Automático (IA)',
			desc: 'Detecta e escolhe o melhor sozinho',
			icon: <Wand2 className="w-6 h-6" />,
		},
		{
			choice: 'bw',
			label: 'Laser (P&B)',
			desc: 'Gravação P&B — foto vira gravura premium com IA',
			icon: <Zap className="w-6 h-6" />,
		},
		{
			choice: 'color',
			label: 'Laser + UV (Cores)',
			desc: 'Vetor colorido em alta definição (p/ impressão UV)',
			icon: <Layers className="w-6 h-6" />,
		},
	];

	return (
		<div className="space-y-4">
			<style>{`@keyframes aiScan{0%{transform:translateY(-60%)}100%{transform:translateY(320%)}}@keyframes aiDot{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}`}</style>
			{/* Preview: original × resultado (compacto, cabe na tela) */}
			<div>
				<div className="flex items-center justify-between mb-2">
					<h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
						Pré-visualização ao vivo
					</h4>
					{previewLoading && !isVectorizing && (
						<span className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400">
							<Loader2 className="w-3.5 h-3.5 animate-spin" /> atualizando…
						</span>
					)}
				</div>
				<div className="grid grid-cols-2 gap-3">
					{/* Original */}
					<div className="relative rounded-xl border border-slate-200 dark:border-white/10 bg-[repeating-conic-gradient(#f1f5f9_0_25%,#fff_0_50%)] dark:bg-[#1a1a1d] bg-[length:16px_16px] overflow-hidden h-[34vh] min-h-[190px] flex items-center justify-center">
						{originalUrl ? (
							// biome-ignore lint/performance/noImgElement: preview local (blob/data URL)
							<img
								src={originalUrl}
								alt="Original"
								className="max-w-full max-h-full object-contain"
							/>
						) : null}
						<span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 bg-white/70 dark:bg-black/50 px-1.5 py-0.5 rounded">
							Original
						</span>
					</div>
					{/* Resultado / prévia */}
					<div className="relative rounded-xl border border-slate-200 dark:border-white/10 bg-[repeating-conic-gradient(#f1f5f9_0_25%,#fff_0_50%)] dark:bg-[#0d0d0f] bg-[length:16px_16px] overflow-hidden h-[34vh] min-h-[190px] flex items-center justify-center">
						{isVectorizing ? (
							<>
								{originalUrl ? (
									// biome-ignore lint/performance/noImgElement: preview local
									<img
										src={originalUrl}
										alt=""
										className="absolute inset-0 w-full h-full object-contain opacity-20"
									/>
								) : null}
								<div
									className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-transparent via-violet-400/40 to-transparent"
									style={{ animation: 'aiScan 1.8s ease-in-out infinite' }}
								/>
								<div className="relative z-10 flex flex-col items-center gap-2 text-center px-4">
									<div className="relative">
										<div className="absolute inset-0 rounded-full bg-violet-500/30 blur-xl animate-pulse" />
										<Wand2 className="relative w-9 h-9 text-violet-600 dark:text-violet-400" />
										<Sparkles className="absolute -top-1.5 -right-1.5 w-4 h-4 text-fuchsia-500 animate-ping" />
									</div>
									<p className="text-sm font-bold text-violet-700 dark:text-violet-300">
										{isAiLineart ? 'Gerando com IA…' : 'Vetorizando…'}
									</p>
									{isAiLineart && (
										<p className="text-[11px] text-slate-500 dark:text-gray-400">
											Redesenhando sua imagem · ~30s
										</p>
									)}
									<div className="flex gap-1 mt-0.5">
										{[0, 0.15, 0.3].map((d) => (
											<span
												key={d}
												className="w-1.5 h-1.5 rounded-full bg-violet-500"
												style={{
													animation: 'aiDot 1s infinite',
													animationDelay: `${d}s`,
												}}
											/>
										))}
									</div>
								</div>
							</>
						) : isAiLineart ? (
							<span className="text-xs text-slate-500 dark:text-gray-400 px-4 text-center leading-relaxed">
								Gravura <strong>P&B com IA</strong> — clique{' '}
								<strong>Gerar com IA</strong>. A prévia ao vivo não roda IA.
							</span>
						) : preview?.svgContent ? (
							// biome-ignore lint/performance/noImgElement: SVG vetorizado local
							<img
								src={svgToDataUrl(preview.svgContent)}
								alt="Pré-visualização do vetor"
								className={`max-w-full max-h-full object-contain transition-opacity ${
									previewLoading ? 'opacity-60' : 'opacity-100'
								}`}
							/>
						) : (
							<span className="text-xs text-slate-400 dark:text-gray-500 px-3 text-center">
								{previewLoading
									? 'Gerando pré-visualização…'
									: 'Ajuste os parâmetros para ver o resultado'}
							</span>
						)}
						<span className="absolute top-2 left-2 z-10 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 bg-white/70 dark:bg-black/50 px-1.5 py-0.5 rounded">
							{isVectorizing ? 'Gerando' : 'Prévia'}
						</span>
					</div>
				</div>
			</div>

			{/* Presets */}
			<div>
				<h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
					Modo de vetorização
				</h4>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					{modes.map((m) => (
						<button
							key={m.choice}
							type="button"
							onClick={() => onColorChoice(m.choice)}
							className={`rounded-xl border-2 p-3 text-left transition-all ${
								colorChoice === m.choice
									? 'border-violet-600 bg-violet-50 dark:bg-violet-500/10'
									: 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] hover:border-slate-300 dark:hover:border-white/20'
							}`}
						>
							<div className="flex items-center gap-2 mb-0.5">
								<span
									className={
										colorChoice === m.choice
											? 'text-violet-600 dark:text-violet-400'
											: 'text-slate-400 dark:text-gray-500'
									}
								>
									{m.icon}
								</span>
								<p
									className={`font-semibold text-sm ${
										colorChoice === m.choice
											? 'text-violet-700 dark:text-violet-400'
											: 'text-slate-700 dark:text-slate-300'
									}`}
								>
									{m.label}
								</p>
							</div>
							<p className="text-[11px] text-slate-500 dark:text-gray-400 leading-snug">
								{m.desc}
							</p>
						</button>
					))}
				</div>

				{/* Resultado da análise automática (router + image analytics) */}
				{preset === 'automatico' && (
					<div className="mt-2 rounded-xl border border-violet-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/10 p-3">
						{analyzing && !analysis ? (
							<p className="flex items-center gap-2 text-sm text-violet-700 dark:text-violet-300">
								<Loader2 className="w-4 h-4 animate-spin" /> Analisando a
								imagem…
							</p>
						) : analysis ? (
							<>
								<div className="flex items-center gap-2">
									<Wand2 className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
									<p className="text-sm text-slate-700 dark:text-slate-200">
										Detectamos:{' '}
										<strong className="text-violet-700 dark:text-violet-300">
											{analysis.label}
										</strong>
									</p>
								</div>
								<p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
									{analysis.reason} Ajustamos os parâmetros automaticamente —
									você pode refinar nos controles abaixo.
								</p>
								{isAiLineart && (
									<p className="text-xs text-violet-700 dark:text-violet-300 mt-2 font-medium">
										Geramos uma <strong>gravura P&B com IA</strong> (alta
										qualidade, fundo removido). É só clicar{' '}
										<strong>Gerar com IA</strong> abaixo. Pra colorido, use o
										modo <strong>Laser + UV</strong>.
									</p>
								)}
							</>
						) : (
							<p className="text-sm text-slate-500 dark:text-gray-400">
								Suba uma imagem para a análise automática ajustar tudo.
							</p>
						)}
					</div>
				)}

				{/* Já entregar invertido. É a MESMA polaridade do passo 3 (grátis e
				    reversível lá) — aqui só poupa um clique. */}
				<div className="mt-3 rounded-xl border border-slate-200 dark:border-white/10 p-3">
					<ToggleRow
						label="Vetor invertido (fundo preto)"
						checked={wantInverted}
						onChange={onWantInverted}
						disabled={colorChoice === 'color'}
					/>
					<p className="text-[11px] text-slate-500 dark:text-gray-400 leading-snug mt-1">
						{colorChoice === 'color'
							? 'Indisponível no modo Cores: vetor colorido não tem negativo geométrico. Use Laser (P&B) ou Automático.'
							: 'O resultado já vem com a polaridade trocada — fundo sólido e a arte vazada. No resultado dá pra alternar entre normal e invertido, sem custo.'}
					</p>
				</div>
			</div>

			{/* Configurações avançadas */}
			<div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
				<button
					type="button"
					onClick={() => setAdvancedOpen(!advancedOpen)}
					className="w-full flex items-center justify-between p-4 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
				>
					<div className="flex items-center gap-2">
						<Settings className="w-4 h-4" />
						Configurações avançadas
					</div>
					{advancedOpen ? (
						<ChevronUp className="w-4 h-4" />
					) : (
						<ChevronDown className="w-4 h-4" />
					)}
				</button>
				{advancedOpen && (
					<div className="p-4 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
						<Group title="Pré-processamento">
							<RangeRow
								label="Limiar (threshold)"
								value={params.threshold ?? 128}
								min={0}
								max={255}
								step={1}
								onChange={(v) => set('threshold', v)}
							/>
							<OptionalRangeRow
								label="Brilho"
								value={params.brightness ?? null}
								min={0.1}
								max={3}
								step={0.1}
								def={1}
								onChange={(v) => set('brightness', v)}
							/>
							<OptionalRangeRow
								label="Contraste"
								value={params.contrast ?? null}
								min={0.1}
								max={3}
								step={0.1}
								def={1.2}
								onChange={(v) => set('contrast', v)}
							/>
							<OptionalRangeRow
								label="Gamma"
								value={params.gamma ?? null}
								min={1}
								max={3}
								step={0.1}
								def={1.5}
								onChange={(v) => set('gamma', v)}
							/>
							<OptionalRangeRow
								label="Desfoque (blur)"
								value={params.blur ?? null}
								min={0.3}
								max={20}
								step={0.1}
								def={1}
								onChange={(v) => set('blur', v)}
							/>
							<ToggleRow
								label="Nitidez (sharpen)"
								checked={params.sharpen ?? false}
								onChange={(v) => set('sharpen', v)}
							/>
							{/* NÃO confundir com "Polaridade: Invertido" do resultado: este
						    negativa o RASTER antes do limiar (muda o que vira traço);
						    aquele inverte o VETOR pronto (fundo preto de verdade). */}
							<ToggleRow
								label="Inverter cores (antes do limiar)"
								checked={params.invert ?? false}
								onChange={(v) => set('invert', v)}
							/>
							<SelectRow
								label="Detecção de bordas"
								value={params.edgeDetection ?? 'none'}
								options={[
									{ value: 'none', label: 'Nenhuma' },
									{ value: 'sobel', label: 'Sobel' },
									{ value: 'canny', label: 'Canny' },
								]}
								onChange={(v) =>
									set('edgeDetection', v as VectorizeParams['edgeDetection'])
								}
							/>
						</Group>

						<Group title="Traçado (Potrace)">
							<RangeRow
								label="Suprimir manchas (turdSize)"
								value={params.turdSize ?? 5}
								min={0}
								max={50}
								step={1}
								onChange={(v) => set('turdSize', v)}
							/>
							<RangeRow
								label="Tolerância (optTolerance)"
								value={params.optTolerance ?? 0.2}
								min={0}
								max={1}
								step={0.05}
								fmt={(v) => v.toFixed(2)}
								onChange={(v) => set('optTolerance', v)}
							/>
							<RangeRow
								label="Limiar de canto (alphaMax)"
								value={params.alphaMax ?? 1}
								min={0}
								max={1.334}
								step={0.034}
								fmt={(v) => v.toFixed(2)}
								onChange={(v) => set('alphaMax', v)}
							/>
							<SelectRow
								label="Política de curva (turnPolicy)"
								value={params.turnPolicy ?? ''}
								options={[
									{ value: '', label: 'Padrão' },
									{ value: 'minority', label: 'Minoria' },
									{ value: 'majority', label: 'Maioria' },
									{ value: 'black', label: 'Preto' },
									{ value: 'white', label: 'Branco' },
									{ value: 'left', label: 'Esquerda' },
									{ value: 'right', label: 'Direita' },
								]}
								onChange={(v) =>
									set(
										'turnPolicy',
										v === '' ? null : (v as VectorizeParams['turnPolicy']),
									)
								}
							/>
							<ToggleRow
								label="Preto sobre branco"
								checked={params.blackOnWhite ?? true}
								onChange={(v) => set('blackOnWhite', v)}
							/>
						</Group>

						<Group title="Algoritmo">
							<SelectRow
								label="Modo"
								value={params.mode ?? 'trace'}
								options={[
									{ value: 'trace', label: 'Traço (P&B)' },
									{ value: 'color', label: 'Cores (camadas)' },
									{ value: 'posterize', label: 'Posterize (tons)' },
								]}
								onChange={(v) => set('mode', v as VectorizeParams['mode'])}
							/>
							{params.mode === 'color' && (
								<RangeRow
									label="Cores"
									value={params.maxColors ?? 8}
									min={2}
									max={16}
									step={1}
									onChange={(v) => set('maxColors', v)}
								/>
							)}
							<RangeRow
								label="Níveis (posterize)"
								value={params.posterizeLevels ?? 4}
								min={2}
								max={10}
								step={1}
								onChange={(v) => set('posterizeLevels', v)}
							/>
							<SelectRow
								label="Estratégia de preenchimento"
								value={params.posterizeFillStrategy ?? 'dominant'}
								options={[
									{ value: 'dominant', label: 'Dominante' },
									{ value: 'mean', label: 'Média' },
									{ value: 'median', label: 'Mediana' },
									{ value: 'spread', label: 'Espalhada' },
								]}
								onChange={(v) =>
									set(
										'posterizeFillStrategy',
										v as VectorizeParams['posterizeFillStrategy'],
									)
								}
							/>
							<SelectRow
								label="Distribuição de faixas"
								value={params.posterizeRangeDistribution ?? 'auto'}
								options={[
									{ value: 'auto', label: 'Automática' },
									{ value: 'equal', label: 'Igual' },
								]}
								onChange={(v) =>
									set(
										'posterizeRangeDistribution',
										v as VectorizeParams['posterizeRangeDistribution'],
									)
								}
							/>
						</Group>

						<Group title="Estilo">
							<SelectRow
								label="Estilo de desenho"
								value={params.drawingStyle ?? 'fill'}
								options={[
									{ value: 'fill', label: 'Preenchido' },
									{ value: 'stroke', label: 'Traço' },
									{ value: 'outline', label: 'Contorno' },
								]}
								onChange={(v) =>
									set('drawingStyle', v as VectorizeParams['drawingStyle'])
								}
							/>
							<div className="flex items-center justify-between py-2">
								<span className="text-sm text-slate-600 dark:text-gray-400">
									Cor
								</span>
								<input
									type="color"
									value={params.color ?? '#000000'}
									onChange={(e) => set('color', e.target.value)}
									className="h-8 w-12 rounded border border-slate-200 dark:border-white/10 bg-transparent cursor-pointer"
								/>
							</div>
							<RangeRow
								label="Largura do traço"
								value={params.strokeWidth ?? 1}
								min={0.1}
								max={10}
								step={0.1}
								fmt={(v) => v.toFixed(1)}
								onChange={(v) => set('strokeWidth', v)}
							/>
							<ToggleRow
								label="Traço não-escalável"
								checked={params.nonScalingStroke ?? false}
								onChange={(v) => set('nonScalingStroke', v)}
							/>
						</Group>

						<Group title="Dithering">
							<SelectRow
								label="Algoritmo"
								value={params.ditherAlgorithm ?? 'none'}
								options={[
									{ value: 'none', label: 'Nenhum' },
									{ value: 'floydSteinberg', label: 'Floyd-Steinberg' },
									{ value: 'atkinson', label: 'Atkinson' },
									{ value: 'stucki', label: 'Stucki' },
									{ value: 'jarvis', label: 'Jarvis' },
									{ value: 'sierra', label: 'Sierra' },
									{ value: 'ordered', label: 'Ordered (Bayer)' },
									{ value: 'halftone', label: 'Halftone' },
								]}
								onChange={(v) =>
									set(
										'ditherAlgorithm',
										v === 'none'
											? null
											: (v as VectorizeParams['ditherAlgorithm']),
									)
								}
							/>
						</Group>

						<Group title="Padrões de linha">
							<SelectRow
								label="Padrão"
								value={params.linePattern ?? 'none'}
								options={[
									{ value: 'none', label: 'Nenhum' },
									{ value: 'horizontal', label: 'Horizontal' },
									{ value: 'vertical', label: 'Vertical' },
									{ value: 'diagonal45', label: 'Diagonal 45°' },
									{ value: 'diagonal135', label: 'Diagonal 135°' },
									{ value: 'crosshatch', label: 'Hachura cruzada' },
									{ value: 'diamondHatch', label: 'Hachura diamante' },
								]}
								onChange={(v) =>
									set('linePattern', v as VectorizeParams['linePattern'])
								}
							/>
							<RangeRow
								label="Espaçamento"
								value={params.lineSpacing ?? 3}
								min={0.5}
								max={10}
								step={0.5}
								fmt={(v) => v.toFixed(1)}
								onChange={(v) => set('lineSpacing', v)}
							/>
							<OptionalRangeRow
								label="Ângulo"
								value={params.lineAngle ?? null}
								min={0}
								max={360}
								step={5}
								def={45}
								onChange={(v) => set('lineAngle', v)}
							/>
						</Group>

						<Group title="Saída / dimensões">
							<OptionalRangeRow
								label="DPI"
								value={params.dpi ?? null}
								min={72}
								max={360}
								step={1}
								def={96}
								onChange={(v) => set('dpi', v)}
							/>
							<OptionalNumberRow
								label="Largura"
								value={params.outputWidth ?? null}
								def={100}
								suffix="mm"
								onChange={(v) => set('outputWidth', v)}
							/>
							<OptionalNumberRow
								label="Altura"
								value={params.outputHeight ?? null}
								def={100}
								suffix="mm"
								onChange={(v) => set('outputHeight', v)}
							/>
							<ToggleRow
								label="Otimizar SVG"
								checked={params.svgOptimize ?? false}
								onChange={(v) => set('svgOptimize', v)}
							/>
						</Group>
					</div>
				)}
			</div>

			{/* Ações */}
			<div className="flex items-center justify-between">
				<button
					type="button"
					onClick={onBack}
					className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
				>
					<ArrowLeft className="w-4 h-4" />
					Voltar
				</button>
				<button
					type="button"
					onClick={onVectorize}
					disabled={isVectorizing}
					className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
				>
					{isVectorizing ? (
						<>
							<Loader2 className="w-4 h-4 animate-spin" />
							{isAiLineart ? 'Gerando com IA…' : 'Vetorizando...'}
						</>
					) : (
						<>
							<Wand2 className="w-4 h-4" />
							{isAiLineart ? 'Gerar com IA' : 'Vetorizar'}
						</>
					)}
				</button>
			</div>
		</div>
	);
}

/* ─────────────── Step 3: Result ─────────────── */

function StepResult({
	result,
	originalUrl,
	onGoToStep2,
	onReset,
	onSave,
	onSendToSupport,
	isSaving,
	onDownload,
	chargingFormat,
	costNotice,
	billed,
	perFormatCost,
	polarity,
	inverted,
	isInverting,
	onSetPolarity,
	onSwapInvertMode,
}: {
	result: VectorizeResult;
	originalUrl: string | null;
	onGoToStep2: () => void;
	onReset: () => void;
	onSave: () => void;
	onSendToSupport: () => void;
	isSaving: boolean;
	onDownload: (format: VectorFormat) => void;
	chargingFormat: VectorFormat | null;
	costNotice: React.ReactNode;
	billed: boolean;
	perFormatCost: number;
	polarity: Polarity;
	inverted: InvertedVector | null;
	isInverting: boolean;
	onSetPolarity: (p: Polarity) => void;
	onSwapInvertMode: () => void;
}) {
	const [bgMode, setBgMode] = useState<BgMode>('transparent');

	const showingInverted = polarity === 'inverted' && !!inverted;
	// O que a prévia e os downloads usam de fato.
	const activeSvg = showingInverted ? inverted.svgContent : result.svgContent;

	// A arte invertida é um campo preto — sobre fundo preto ela some. Ao ligar o
	// invertido, força a prévia pra branco (que é como o arquivo vai ser usado).
	useEffect(() => {
		if (showingInverted) setBgMode('white');
	}, [showingInverted]);

	const bgClass = useMemo(() => {
		switch (bgMode) {
			case 'white':
				return 'bg-white';
			case 'black':
				return 'bg-black';
			default:
				return 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Crect%20x%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23e0e0e0%22%2F%3E%3Crect%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23e0e0e0%22%2F%3E%3C%2Fsvg%3E")]';
		}
	}, [bgMode]);

	return (
		<div className="space-y-4">
			{/* Antes × Depois lado a lado */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-3">
					<p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-1.5">
						Antes
					</p>
					<div className="aspect-[4/3] rounded-lg flex items-center justify-center overflow-hidden bg-[repeating-conic-gradient(#f1f5f9_0_25%,#fff_0_50%)] dark:bg-[#0d0d0f] bg-[length:16px_16px]">
						{originalUrl ? (
							// biome-ignore lint/performance/noImgElement: preview local (blob/data URL)
							<img
								src={originalUrl}
								alt="Original"
								className="max-w-full max-h-full object-contain"
							/>
						) : null}
					</div>
				</div>
				<div className="rounded-xl border-2 border-violet-400 dark:border-violet-500/50 bg-white dark:bg-[#1a1a1d] p-3">
					<p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1.5">
						Depois — vetor
					</p>
					<div
						className={`aspect-[4/3] rounded-lg flex items-center justify-center overflow-hidden ${bgClass}`}
					>
						<img
							src={svgToDataUrl(activeSvg)}
							alt={result.originalName}
							className="max-w-full max-h-full object-contain p-3"
						/>
					</div>
				</div>
			</div>

			{result.aiFallback && (
				<div className="rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
					<p className="text-sm text-amber-800 dark:text-amber-200">
						A IA não conseguiu reproduzir sua imagem com fidelidade, então
						usamos a vetorização normal. <strong>Não cobramos a geração</strong>{' '}
						— você paga só ao baixar cada formato.
					</p>
				</div>
			)}

			{/* Polaridade: muda o ARQUIVO (não é a cor da prévia) */}
			<div className="flex items-center gap-2 flex-wrap">
				<span className="text-sm text-slate-500 dark:text-gray-400 mr-2">
					Polaridade:
				</span>
				{[
					{ key: 'normal' as const, label: 'Normal' },
					{ key: 'inverted' as const, label: 'Invertido (fundo preto)' },
				].map((p) => {
					// Multi-cor não tem negativo geométrico — o backend também recusa.
					const blocked = p.key === 'inverted' && result.isColor;
					const active = polarity === p.key;
					return (
						<button
							key={p.key}
							type="button"
							disabled={blocked || isInverting}
							title={
								blocked
									? 'Disponível apenas para vetores em preto e branco.'
									: undefined
							}
							onClick={() => onSetPolarity(p.key)}
							className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
								active
									? 'bg-violet-600 text-white'
									: 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-gray-400 hover:bg-slate-300 dark:hover:bg-white/20'
							}`}
						>
							{p.key === 'inverted' && isInverting && (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							)}
							{p.label}
						</button>
					);
				})}
			</div>

			{showingInverted && (
				<div className="rounded-lg bg-slate-100 dark:bg-white/5 px-3 py-2 space-y-1">
					<p className="text-xs text-slate-600 dark:text-gray-400">
						Negativo real: o Corel/LightBurn e o laser leem a polaridade
						trocada.{' '}
						<strong>
							No DXF a inversão não altera o preenchimento (DXF não tem
							preenchimento)
						</strong>{' '}
						— o arquivo ganha apenas o retângulo da moldura.
					</p>
					<button
						type="button"
						onClick={onSwapInvertMode}
						disabled={isInverting}
						className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-40"
					>
						Trocar tipo de inversão (
						{inverted.mode === 'geometric' ? 'geométrica' : 'silhueta'})
					</button>
				</div>
			)}

			<div className="flex items-center gap-2 flex-wrap">
				<span className="text-sm text-slate-500 dark:text-gray-400 mr-2">
					Fundo (só a prévia):
				</span>
				{[
					{ key: 'transparent' as const, label: 'Transparente' },
					{ key: 'white' as const, label: 'Branco' },
					{ key: 'black' as const, label: 'Preto' },
				].map((bg) => (
					<button
						key={bg.key}
						type="button"
						onClick={() => setBgMode(bg.key)}
						className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
							bgMode === bg.key
								? 'bg-violet-600 text-white'
								: 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-gray-400 hover:bg-slate-300 dark:hover:bg-white/20'
						}`}
					>
						{bg.label}
					</button>
				))}
			</div>

			{/* Downloads — cobrança POR FORMATO (a geração foi grátis) */}
			<div>
				{billed && perFormatCost > 0 && (
					<p className="text-xs text-slate-500 dark:text-gray-400 mb-2">
						Cada formato baixado consome {perFormatCost} voxxys. Formatos já
						pagos podem ser baixados de novo sem custo.
					</p>
				)}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					{(
						[
							{ fmt: 'svg', label: 'SVG', primary: true, enabled: true },
							{
								fmt: 'png',
								label: 'PNG',
								primary: false,
								enabled: showingInverted ? !!inverted.pngUrl : !!result.pngUrl,
							},
							{
								fmt: 'dxf',
								label: 'DXF',
								primary: false,
								enabled: showingInverted
									? !!inverted.dxfContent
									: !!result.dxfContent,
							},
						] as {
							fmt: VectorFormat;
							label: string;
							primary: boolean;
							enabled: boolean;
						}[]
					).map(({ fmt, label, primary, enabled }) => {
						const paid = result.paidFormats?.includes(fmt);
						const charging = chargingFormat === fmt;
						return (
							<button
								key={fmt}
								type="button"
								disabled={!enabled || chargingFormat !== null}
								onClick={() => onDownload(fmt)}
								className={`flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl transition-colors disabled:opacity-40 ${
									primary
										? 'bg-violet-600 hover:bg-violet-500 text-white'
										: 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/20'
								}`}
							>
								{charging ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : paid ? (
									<Check className="w-5 h-5" />
								) : (
									<Download className="w-5 h-5" />
								)}
								Baixar {label}
								{billed && perFormatCost > 0 && !paid && !charging && (
									<span className="text-xs opacity-80">· {perFormatCost}</span>
								)}
							</button>
						);
					})}
				</div>
				{costNotice}
			</div>

			<div className="flex flex-wrap gap-3">
				<button
					type="button"
					onClick={onGoToStep2}
					className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
				>
					<Sliders className="w-4 h-4" />
					Ajustes finos
				</button>
				<button
					type="button"
					onClick={onReset}
					className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
				>
					<RotateCcw className="w-4 h-4" />
					Nova vetorização
				</button>
				<button
					type="button"
					onClick={onSave}
					disabled={isSaving}
					className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
				>
					{isSaving ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Save className="w-4 h-4" />
					)}
					Salvar no banco
				</button>
				<button
					type="button"
					onClick={onSendToSupport}
					className="flex items-center gap-2 px-4 py-2.5 border border-violet-300 dark:border-violet-500/40 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium rounded-xl transition-colors hover:bg-violet-100 dark:hover:bg-violet-500/20"
				>
					<Headphones className="w-4 h-4" />
					Enviar ao suporte
				</button>
			</div>
		</div>
	);
}

/* ─────────────── Help Section ─────────────── */

function HelpSection() {
	const cards = [
		{
			icon: <Play className="w-6 h-6" />,
			title: 'Tutorial',
			desc: 'Aprenda a vetorizar passo a passo',
		},
		{
			icon: <Zap className="w-6 h-6" />,
			title: 'Dicas de qualidade',
			desc: 'Melhore seus resultados',
		},
		{
			icon: <Image className="w-6 h-6" />,
			title: 'Exemplos',
			desc: 'Veja exemplos de vetorização',
		},
		{
			icon: <HelpCircle className="w-6 h-6" />,
			title: 'FAQ',
			desc: 'Perguntas frequentes',
		},
	];

	return (
		<div>
			<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
				<BookOpen className="w-5 h-5 text-violet-600" />
				Ajuda
			</h3>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
				{cards.map((card) => (
					<div
						key={card.title}
						className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-4 hover:border-violet-500/50 dark:hover:border-violet-500/30 transition-colors group"
					>
						<div className="text-slate-400 dark:text-gray-500 group-hover:text-violet-600 transition-colors mb-3">
							{card.icon}
						</div>
						<p className="font-semibold text-sm text-slate-900 dark:text-white">
							{card.title}
						</p>
						<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
							{card.desc}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}

/* ─────────────── Batch Banner ─────────────── */

function BatchBanner() {
	return (
		<div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-gradient-to-r from-violet-500/5 to-violet-700/5 dark:from-violet-500/10 dark:to-violet-700/10 p-6 flex flex-col sm:flex-row items-center gap-4">
			<div className="p-3 rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 text-white shrink-0">
				<Zap className="w-7 h-7" />
			</div>
			<div className="flex-1 text-center sm:text-left">
				<h4 className="font-bold text-slate-900 dark:text-white">
					Vetorização em lote
				</h4>
				<p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
					Vetorize múltiplas imagens de uma vez. Recurso disponível em breve.
				</p>
			</div>
			<span className="px-4 py-2 bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-gray-400 text-sm font-semibold rounded-xl">
				Em breve
			</span>
		</div>
	);
}

/* ─────────────── Pro Widget ─────────────── */

function ProWidget() {
	return (
		<div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-violet-50 to-orange-50 dark:from-violet-900/10 dark:to-orange-900/10 p-6">
			<NextImage
				src="/img/fiber-copy-min.jpg"
				alt=""
				fill
				className="object-cover opacity-[0.06]"
			/>
			<div className="relative z-10">
				<div className="flex items-center gap-3 mb-3">
					<div className="p-2 rounded-lg bg-violet-400/20">
						<Crown className="w-6 h-6 text-violet-700 dark:text-violet-400" />
					</div>
					<h4 className="font-bold text-slate-900 dark:text-white">Seja PRO</h4>
				</div>
				<p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
					Desbloqueie vetorização em lote, exportação DXF, histórico ilimitado e
					muito mais com o plano PRO.
				</p>
				<a
					href="/store"
					className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-400 text-white font-semibold rounded-xl transition-colors text-sm"
				>
					Ver planos
					<ArrowRight className="w-4 h-4" />
				</a>
			</div>
		</div>
	);
}

/* ─────────────── Main View ─────────────── */

export function VetorizacaoView({ onRefetch }: { onRefetch?: () => void }) {
	const [step, setStep] = useState<WizardStep>(1);
	const [file, setFile] = useState<File | null>(null);
	const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(
		null,
	);
	const [result, setResult] = useState<VectorizeResult | null>(null);

	// Suporte de Vetor (chat com a equipe)
	const [supportOpen, setSupportOpen] = useState(false);
	const [supportFiles, setSupportFiles] = useState<File[] | undefined>(
		undefined,
	);

	const [preset, setPreset] = useState<VectorizePreset>('automatico');
	const [params, setParams] = useState<VectorizeParams>(() =>
		presetParams('automatico'),
	);
	// Botão Cor / P&B do Automático (override manual sobre a detecção da IA).
	const [colorChoice, setColorChoice] = useState<ColorChoice>('auto');
	// Formato em cobrança agora (serializa os downloads → sem corrida no paid_formats).
	const [chargingFormat, setChargingFormat] = useState<VectorFormat | null>(
		null,
	);
	// Vetor invertido (fundo preto). Gerado sob demanda e GRÁTIS; depois de
	// pronto, alternar polaridade é só troca local. Mora aqui (e não no
	// StepResult) porque o handler de download precisa do conteúdo ativo.
	const [inverted, setInverted] = useState<InvertedVector | null>(null);
	const [polarity, setPolarity] = useState<Polarity>('normal');
	// Escolha feita LÁ NO PASSO 2 ("já quero invertido"). Não é um parâmetro de
	// geração — só diz qual polaridade aplicar assim que o vetor existir.
	const [wantInverted, setWantInverted] = useState(false);
	const invertMutation = useInvertVector();
	// Descarta o invertido sempre que o VETOR muda (nova geração, novo arquivo,
	// reset). Ancorado no id em vez de espalhado pelos setResult: atualizar
	// `paidFormats` mantém o mesmo id e não descarta, e um setResult futuro não
	// tem como esquecer de limpar.
	// biome-ignore lint/correctness/useExhaustiveDependencies: dispara na troca de vetor
	useEffect(() => {
		setInverted(null);
		setPolarity('normal');
	}, [result?.id]);
	// Análise automática (router + image analytics) — não cobrada.
	const { data: analysis, isFetching: analyzing } = useAnalyzeVectorize(file);
	// Garante aplicar a recomendação uma vez por imagem (não clobbera tweaks).
	const autoAppliedFor = useRef<string | null>(null);

	// portal só após montar (evita mismatch de hidratação)
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	// scroll-follow do passo atual / resultado (igual à prévia)
	const wizardRef = useRef<HTMLDivElement>(null);
	const resultRef = useRef<HTMLDivElement>(null);

	// vetores salvos do aluno (lista embaixo)
	const vecLimit = 12;
	const [vecPage, setVecPage] = useState(1);
	const [vecSearch, setVecSearch] = useState('');
	const { data: vectorsData, refetch: refetchVectors } = useCustomerVectors({
		page: vecPage,
		limit: vecLimit,
		search: vecSearch || undefined,
	});

	const vectorizeMutation = useVectorizeImage();
	const aiLineartMutation = useAiLineartVectorize();
	// Billing padrão pelo hook: cobra se a funcionalidade existir (confirma/debita/
	// modal saem dele, igual a Prévia/Parâmetros); roda livre se não houver.
	const { courses } = useEntitlements();
	const courseSlug = courses[0]?.slug;
	const billing = useToolBilling('vectorize', courseSlug);

	// FOTO/colorida (o analyzer às vezes marca foto/render como "color_flat") nos
	// modos Automático ou Laser (P&B) → GRAVURA P&B com IA (cobrada na geração).
	// O modo Laser + UV (cor) é SEM IA: motor de cor melhorado (grátis, cobra por
	// formato no download). Logo/texto/linha simples → vetorização normal.
	const isAi =
		colorChoice !== 'color' &&
		(analysis?.class === 'photo' ||
			analysis?.class === 'grayscale_tonal' ||
			analysis?.class === 'color_flat');

	const set = useCallback(
		<K extends keyof VectorizeParams>(key: K, value: VectorizeParams[K]) => {
			setParams((p) => ({ ...p, [key]: value }));
		},
		[],
	);

	// Os 3 modos (Automático / Laser / Laser+UV) traduzem a escolha em params
	// usando a classe detectada. Foto em Auto/Laser → `isAiLineart` (Gerar com IA).
	const applyColorChoice = useCallback(
		(choice: ColorChoice) => {
			setColorChoice(choice);
			setParams((p) => ({
				...p,
				...colorOverrideParams(choice, analysis ?? null),
			}));
		},
		[analysis],
	);

	// Modo Automático: aplica os parâmetros recomendados pela análise — uma vez
	// por imagem. Tweaks manuais não são sobrescritos (a análise não muda sem
	// novo arquivo); trocar/voltar p/ Automático reaplica.
	// biome-ignore lint/correctness/useExhaustiveDependencies: dispara na chegada da análise
	useEffect(() => {
		if (preset !== 'automatico' || !analysis?.recommendedParams || !file)
			return;
		const key = `${file.name}:${file.size}:${file.lastModified}`;
		if (autoAppliedFor.current === key) return;
		autoAppliedFor.current = key;
		// No modo Automático: aplica a recomendação da análise. Foto é tratada pelo
		// `isAiLineart` (vira "Gerar com IA") sem precisar mexer no modo.
		setParams((p) => ({
			...p,
			...analysis.recommendedParams,
			preset: 'automatico',
		}));
	}, [analysis, preset, file]);

	const runVectorize = useCallback(async () => {
		if (!file) return;
		// Vetorização com IA (foto→gravura P&B, ou colorida→vetor de cores): COBRADA
		// na geração (invoke→motor→settle). Resultado já vem com todos os formatos
		// pagos → download não recobra.
		if (isAi) {
			await billing.runEngine((invocationId) =>
				aiLineartMutation
					.mutateAsync({
						file,
						invocationId,
						variant: 'lineart',
						params: { ...params, preset },
					})
					.then((res) => {
						setResult(res);
						setStep(3);
						refetchVectors();
						return res;
					}),
			);
			return;
		}
		// Não-IA: geração NÃO cobrada — o cliente vê o resultado de graça e só paga
		// ao baixar cada formato (handleDownloadFormat).
		try {
			const res = await vectorizeMutation.mutateAsync({
				file,
				params: { ...params, preset },
			});
			setResult(res);
			setStep(3);
			refetchVectors();
		} catch {
			// erro já tratado pela mutation (toast)
		}
	}, [
		file,
		isAi,
		billing,
		aiLineartMutation,
		vectorizeMutation,
		params,
		preset,
		refetchVectors,
	]);

	// Cobrança POR FORMATO no download. Já pago (ou sem cobrança) → baixa direto;
	// senão invoca a tool (debita) → grava/liquida no backend → baixa. `chargingFormat`
	// serializa (desabilita todos os botões durante a cobrança) p/ não haver corrida.
	const handleDownloadFormat = useCallback(
		async (format: VectorFormat) => {
			if (!result) return;
			// O invertido é o MESMO vetor, então a cobrança continua chaveada em
			// `result.paidFormats`/`result.id`: quem já pagou o formato leva as duas
			// polaridades sem custo novo.
			const useInverted = polarity === 'inverted' && inverted !== null;
			const active = useInverted ? inverted : result;
			const name = useInverted
				? `${result.originalName.replace(/\.[^.]+$/, '')}-invertido`
				: result.originalName;
			const doDownload = () => {
				if (format === 'svg') downloadSvg(active.svgContent, name);
				else if (format === 'png' && active.pngUrl)
					downloadPng(active.pngUrl, name);
				else if (format === 'dxf' && active.dxfContent)
					downloadDxf(active.dxfContent, name);
			};
			if (result.paidFormats?.includes(format) || !billing.billed) {
				doDownload();
				return;
			}
			if (chargingFormat) return;
			setChargingFormat(format);
			try {
				const res = await billing.runEngine((invocationId) =>
					chargeVectorFormat(result.id, format, invocationId),
				);
				if (res && Array.isArray(res.paidFormats)) {
					const paid = res.paidFormats;
					setResult((r) => (r ? { ...r, paidFormats: paid } : r));
					doDownload();
				}
			} finally {
				setChargingFormat(null);
			}
		},
		[result, billing, chargingFormat, polarity, inverted],
	);

	/**
	 * Liga/desliga o invertido. A primeira vez chama o backend (grátis); depois
	 * é troca local. `mode` explícito refaz com o outro algoritmo.
	 */
	const handleSetPolarity = useCallback(
		async (next: Polarity, mode?: InvertMode) => {
			if (!result) return;
			if (next === 'normal') {
				setPolarity('normal');
				return;
			}
			if (inverted && !mode) {
				setPolarity('inverted');
				return;
			}
			try {
				const res = await invertMutation.mutateAsync({
					vectorId: result.id,
					mode,
					// Guarda em "Meus vetores": o invertido é um arquivo que o cliente
					// vai querer de volta depois. Idempotente por (pai, modo), então
					// alternar a polaridade não duplica a biblioteca.
					persist: true,
				});
				setInverted(res);
				setPolarity('inverted');
			} catch {
				// toast já sai do hook; mantém a polaridade atual.
				setPolarity('normal');
			}
		},
		[result, inverted, invertMutation],
	);

	// A heurística automática erra às vezes — deixa trocar o algoritmo na mão.
	const handleSwapInvertMode = useCallback(() => {
		if (!inverted) return;
		handleSetPolarity(
			'inverted',
			inverted.mode === 'geometric' ? 'silhouette' : 'geometric',
		);
	}, [inverted, handleSetPolarity]);

	/**
	 * Aplica a escolha do passo 2 assim que o vetor existe. O ref garante UMA
	 * aplicação automática por vetor — sem ele, `handleSetPolarity` muda de
	 * identidade ao gravar o resultado e o efeito se reinvocaria em loop. Só
	 * rastreia o que foi automático, então trocar a polaridade na mão no passo 3
	 * continua valendo.
	 */
	const autoInvertedFor = useRef<string | null>(null);
	// biome-ignore lint/correctness/useExhaustiveDependencies: dispara na chegada do vetor
	useEffect(() => {
		// Vetor colorido não tem negativo geométrico — o backend recusa com 422.
		if (!result || result.isColor) return;
		if (wantInverted && autoInvertedFor.current !== result.id) {
			autoInvertedFor.current = result.id;
			handleSetPolarity('inverted');
		} else if (!wantInverted && autoInvertedFor.current === result.id) {
			autoInvertedFor.current = null;
			handleSetPolarity('normal');
		}
	}, [result?.id, result?.isColor, wantInverted]);
	const saveMutation = useSaveVector();

	const handleFileSelected = useCallback((selectedFile: File) => {
		if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
			toast.error('Formato não suportado. Use PNG, JPG ou WEBP.');
			return;
		}
		if (selectedFile.size > MAX_FILE_SIZE) {
			toast.error('Ficheiro demasiado grande (max. 10MB).');
			return;
		}
		setFile(selectedFile);
		setResult(null);
		setColorChoice('auto');
		setOriginalPreviewUrl(URL.createObjectURL(selectedFile));
		setStep(2); // vai direto p/ os ajustes (mais prático — menos um clique)
	}, []);

	const handleVectorize = useCallback(() => {
		if (!file) return;
		// A confirmação (sem cota grátis e com custo) é decidida dentro do hook.
		runVectorize();
	}, [file, runVectorize]);

	const handleReset = useCallback(() => {
		setStep(1);
		setFile(null);
		setResult(null);
		setOriginalPreviewUrl(null);
		setPreset('automatico');
		setParams(presetParams('automatico'));
		setColorChoice('auto');
		setWantInverted(false);
	}, []);

	const handleSave = useCallback(async () => {
		if (!result) return;
		// A geração já persistiu este vetor em "Meus vetores" (linha `result.id`).
		// NÃO criamos duplicata: uma cópia teria `paid_formats` vazio e o re-download
		// dela recobrariam o cliente (viola "formato já pago não cobra de novo").
		toast.success('Vetor já está em "Meus vetores".');
		refetchVectors();
		onRefetch?.();
	}, [result, onRefetch, refetchVectors]);

	const handleSendToSupport = useCallback(() => {
		setSupportFiles(file ? [file] : undefined);
		setSupportOpen(true);
	}, [file]);

	// scroll acompanha a navegação do wizard
	useEffect(() => {
		if (!step) return; // `step` é a dependência real (re-scrolla a cada passo)
		const el = wizardRef.current;
		if (!el) return;
		const id = window.setTimeout(() => {
			const top = el.getBoundingClientRect().top + window.scrollY - 88;
			window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
		}, 60);
		return () => window.clearTimeout(id);
	}, [step]);

	// centraliza o resultado quando ele aparece
	useEffect(() => {
		if (!result) return;
		const el = resultRef.current;
		if (!el) return;
		const id = window.setTimeout(() => {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}, 80);
		return () => window.clearTimeout(id);
	}, [result]);

	return (
		<div className="p-4 md:p-8">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<PageHeader
					title="Vetorização"
					subtitle="Converta imagens PNG, JPG ou WEBP em SVG vetorial."
					icon={PenLine}
				/>
				<button
					type="button"
					onClick={() => {
						setSupportFiles(undefined);
						setSupportOpen(true);
					}}
					className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors shadow-sm shrink-0"
				>
					<Headphones className="w-4 h-4" />
					Suporte de Vetor
				</button>
			</div>

			<div
				ref={wizardRef}
				className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-6 mb-8"
			>
				<StepIndicator current={step} />

				{step === 1 && (
					<div>
						<StepUpload
							onFileSelected={handleFileSelected}
							file={file}
							originalPreviewUrl={originalPreviewUrl}
						/>
						{file && (
							<div className="flex justify-end mt-6">
								<button
									type="button"
									onClick={() => setStep(2)}
									className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors"
								>
									Continuar
									<ArrowRight className="w-4 h-4" />
								</button>
							</div>
						)}
					</div>
				)}

				{step === 2 && (
					<StepParams
						preset={preset}
						params={params}
						set={set}
						onVectorize={handleVectorize}
						onBack={() => setStep(1)}
						isVectorizing={
							vectorizeMutation.isPending ||
							aiLineartMutation.isPending ||
							(isAi && billing.pending)
						}
						file={file}
						originalUrl={originalPreviewUrl}
						analysis={analysis ?? null}
						analyzing={analyzing}
						colorChoice={colorChoice}
						onColorChoice={applyColorChoice}
						isAiLineart={isAi}
						wantInverted={wantInverted}
						onWantInverted={setWantInverted}
					/>
				)}

				{step === 2 && billing.billed && billing.cost > 0 && (
					<p className="mt-3 text-xs text-slate-500 dark:text-gray-400">
						{isAi
							? `Gerar com IA custa ${billing.cost} voxxys e já libera SVG, PNG e DXF (~30–40s).`
							: `A geração é grátis — você paga só ao baixar, ${billing.cost} voxxys por formato (SVG, PNG ou DXF).`}
					</p>
				)}

				{step === 3 && result && (
					<div ref={resultRef}>
						<StepResult
							result={result}
							originalUrl={originalPreviewUrl}
							onGoToStep2={() => setStep(2)}
							onReset={handleReset}
							onSave={handleSave}
							onSendToSupport={handleSendToSupport}
							isSaving={saveMutation.isPending}
							onDownload={handleDownloadFormat}
							chargingFormat={chargingFormat}
							costNotice={billing.notice}
							billed={billing.billed}
							perFormatCost={billing.cost}
							polarity={polarity}
							inverted={inverted}
							isInverting={invertMutation.isPending}
							onSetPolarity={handleSetPolarity}
							onSwapInvertMode={handleSwapInvertMode}
						/>
					</div>
				)}
			</div>

			<div className="space-y-8" id="vetorizacao-historico">
				<section>
					<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
						<FolderOpen className="w-5 h-5 text-violet-600" />
						Meus vetores
					</h3>
					<VectorList
						data={vectorsData?.data ?? []}
						total={vectorsData?.total ?? 0}
						page={vecPage}
						limit={vecLimit}
						search={vecSearch}
						onPageChange={setVecPage}
						onSearchChange={(s) => {
							setVecSearch(s);
							setVecPage(1);
						}}
						onRefetch={refetchVectors}
					/>
				</section>
				<HelpSection />
				<BatchBanner />
				<ProWidget />
			</div>

			{/* CTA flutuante (continuar/gerar sempre visível, igual à prévia) */}
			{mounted &&
				step === 1 &&
				file &&
				createPortal(
					<button
						type="button"
						onClick={() => setStep(2)}
						className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-6 py-3.5 bg-violet-700 hover:bg-violet-600 text-white font-semibold rounded-full shadow-xl shadow-violet-900/30 transition-colors"
					>
						Continuar
						<ArrowRight className="w-5 h-5" />
					</button>,
					document.body,
				)}

			{mounted &&
				step === 2 &&
				file &&
				createPortal(
					<button
						type="button"
						onClick={handleVectorize}
						disabled={billing.pending}
						className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-6 py-3.5 bg-violet-700 hover:bg-violet-600 text-white font-semibold rounded-full shadow-xl shadow-violet-900/30 transition-colors disabled:opacity-60"
					>
						{billing.pending ? (
							<>
								<Loader2 className="w-5 h-5 animate-spin" />
								Vetorizando...
							</>
						) : (
							<>
								<Wand2 className="w-5 h-5" />
								Vetorizar
							</>
						)}
					</button>,
					document.body,
				)}

			<VectorSupportPanel
				open={supportOpen}
				onClose={() => setSupportOpen(false)}
				initialFiles={supportFiles}
			/>
		</div>
	);
}
