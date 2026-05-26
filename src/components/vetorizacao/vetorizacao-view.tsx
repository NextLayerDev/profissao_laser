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
	Upload,
	Wand2,
	Zap,
} from 'lucide-react';
import NextImage from 'next/image';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CreditConfirmModal } from '@/components/credits/credit-confirm-modal';
import { PageHeader } from '@/components/ui/page-header';
import { useCreditAction } from '@/hooks/use-credit-action';
import { useVoxBalance, useVoxCosts } from '@/hooks/use-credits';
import { useSaveVector, useVectorizeImage } from '@/hooks/use-vectors';
import type {
	VectorizeParams,
	VectorizePreset,
	VectorizeResult,
} from '@/services/vectorize';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type WizardStep = 1 | 2 | 3;
type BgMode = 'transparent' | 'white' | 'black';

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
	// Rápido = traço P&B simples → cai no fast-path da API
	rapido: { mode: 'trace', threshold: 128, turdSize: 5, optTolerance: 0.4 },
	// Detalhado = posterize com tons + leve desfoque p/ ruído
	detalhado: {
		mode: 'posterize',
		posterizeLevels: 4,
		posterizeFillStrategy: 'dominant',
		turdSize: 2,
		optTolerance: 0.2,
		blur: 0.6,
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
}: {
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			onClick={() => onChange(!checked)}
			className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
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
}: {
	label: string;
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between py-2">
			<span className="text-sm text-slate-600 dark:text-gray-400">{label}</span>
			<Switch checked={checked} onChange={onChange} />
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
	onApplyPreset,
	params,
	set,
	onVectorize,
	onBack,
	isVectorizing,
}: {
	preset: VectorizePreset;
	onApplyPreset: (p: VectorizePreset) => void;
	params: VectorizeParams;
	set: <K extends keyof VectorizeParams>(
		key: K,
		value: VectorizeParams[K],
	) => void;
	onVectorize: () => void;
	onBack: () => void;
	isVectorizing: boolean;
}) {
	const [advancedOpen, setAdvancedOpen] = useState(false);

	const presets: {
		key: VectorizePreset;
		label: string;
		desc: string;
		icon: React.ReactNode;
	}[] = [
		{
			key: 'rapido',
			label: 'Rápido',
			desc: 'Traço P&B simples e veloz',
			icon: <Zap className="w-6 h-6" />,
		},
		{
			key: 'detalhado',
			label: 'Detalhado',
			desc: 'Posterize com tons e curvas',
			icon: <Layers className="w-6 h-6" />,
		},
		{
			key: 'svg',
			label: 'Apenas SVG',
			desc: 'Traço puro, SVG limpo',
			icon: <PenLine className="w-6 h-6" />,
		},
	];

	return (
		<div className="space-y-8">
			{/* Presets */}
			<div>
				<h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
					Modo de vetorização
				</h4>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					{presets.map((m) => (
						<button
							key={m.key}
							type="button"
							onClick={() => onApplyPreset(m.key)}
							className={`rounded-xl border-2 p-4 text-left transition-all ${
								preset === m.key
									? 'border-violet-600 bg-violet-50 dark:bg-violet-500/10'
									: 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] hover:border-slate-300 dark:hover:border-white/20'
							}`}
						>
							<div
								className={`mb-2 ${
									preset === m.key
										? 'text-violet-600 dark:text-violet-400'
										: 'text-slate-400 dark:text-gray-500'
								}`}
							>
								{m.icon}
							</div>
							<p
								className={`font-semibold text-sm ${
									preset === m.key
										? 'text-violet-700 dark:text-violet-400'
										: 'text-slate-700 dark:text-slate-300'
								}`}
							>
								{m.label}
							</p>
							<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
								{m.desc}
							</p>
						</button>
					))}
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
							<ToggleRow
								label="Inverter cores"
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

						<Group title="Posterize (modo Detalhado)">
							<SelectRow
								label="Algoritmo"
								value={params.mode ?? 'trace'}
								options={[
									{ value: 'trace', label: 'Trace (traço)' },
									{ value: 'posterize', label: 'Posterize (tons)' },
								]}
								onChange={(v) => set('mode', v as VectorizeParams['mode'])}
							/>
							<RangeRow
								label="Níveis"
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
							Vetorizando...
						</>
					) : (
						<>
							<Wand2 className="w-4 h-4" />
							Vetorizar
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
	onGoToStep2,
	onReset,
	onSave,
	isSaving,
}: {
	result: VectorizeResult;
	onGoToStep2: () => void;
	onReset: () => void;
	onSave: () => void;
	isSaving: boolean;
}) {
	const [bgMode, setBgMode] = useState<BgMode>('transparent');

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
		<div className="space-y-6">
			<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-4">
				<div
					className={`aspect-[4/3] rounded-lg flex items-center justify-center overflow-hidden ${bgClass}`}
				>
					<img
						src={svgToDataUrl(result.svgContent)}
						alt={result.originalName}
						className="max-w-full max-h-full object-contain p-4"
					/>
				</div>
			</div>

			<div className="flex items-center gap-2 flex-wrap">
				<span className="text-sm text-slate-500 dark:text-gray-400 mr-2">
					Fundo:
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

			{/* Downloads */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<button
					type="button"
					onClick={() => downloadSvg(result.svgContent, result.originalName)}
					className="flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors"
				>
					<Download className="w-5 h-5" />
					Baixar SVG
				</button>
				<button
					type="button"
					disabled={!result.pngUrl}
					onClick={() =>
						result.pngUrl && downloadPng(result.pngUrl, result.originalName)
					}
					className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors hover:bg-slate-300 dark:hover:bg-white/20 disabled:opacity-40"
				>
					<Download className="w-5 h-5" />
					Baixar PNG
				</button>
				<button
					type="button"
					disabled={!result.dxfContent}
					onClick={() =>
						result.dxfContent &&
						downloadDxf(result.dxfContent, result.originalName)
					}
					className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors hover:bg-slate-300 dark:hover:bg-white/20 disabled:opacity-40"
				>
					<Download className="w-5 h-5" />
					Baixar DXF
				</button>
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

	const [preset, setPreset] = useState<VectorizePreset>('rapido');
	const [params, setParams] = useState<VectorizeParams>(() =>
		presetParams('rapido'),
	);

	const vectorizeMutation = useVectorizeImage();
	const { data: voxBalance } = useVoxBalance();
	const { data: voxCosts } = useVoxCosts();
	const vectorizeCost =
		voxCosts?.find((c) => c.feature === 'vectorize')?.cost ?? 1;

	const set = useCallback(
		<K extends keyof VectorizeParams>(key: K, value: VectorizeParams[K]) => {
			setParams((p) => ({ ...p, [key]: value }));
		},
		[],
	);

	const applyPreset = useCallback((p: VectorizePreset) => {
		setPreset(p);
		setParams(presetParams(p));
	}, []);

	const creditAction = useCreditAction({
		feature: 'vectorize',
		cost: vectorizeCost,
		balance: voxBalance?.balance ?? 0,
		run: async ({ useCredits }) => {
			if (!file) throw new Error('no-file');
			const res = await vectorizeMutation.mutateAsync({
				file,
				useCredits,
				params: { ...params, preset },
			});
			setResult(res);
			setStep(3);
			return res;
		},
	});
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
		setOriginalPreviewUrl(URL.createObjectURL(selectedFile));
	}, []);

	const handleVectorize = useCallback(() => {
		if (!file) return;
		creditAction.trigger();
	}, [file, creditAction]);

	const handleReset = useCallback(() => {
		setStep(1);
		setFile(null);
		setResult(null);
		setOriginalPreviewUrl(null);
		setPreset('rapido');
		setParams(presetParams('rapido'));
	}, []);

	const handleSave = useCallback(async () => {
		if (!result) return;
		try {
			await saveMutation.mutateAsync({
				svgContent: result.svgContent,
				originalName: result.originalName,
			});
			onRefetch?.();
		} catch {
			// toast handled by mutation
		}
	}, [result, saveMutation, onRefetch]);

	return (
		<div className="p-4 md:p-8">
			<PageHeader
				title="Vetorização"
				subtitle="Converta imagens PNG, JPG ou WEBP em SVG vetorial."
				icon={PenLine}
			/>

			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-6 mb-8">
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
						onApplyPreset={applyPreset}
						params={params}
						set={set}
						onVectorize={handleVectorize}
						onBack={() => setStep(1)}
						isVectorizing={vectorizeMutation.isPending}
					/>
				)}

				{step === 3 && result && (
					<StepResult
						result={result}
						onGoToStep2={() => setStep(2)}
						onReset={handleReset}
						onSave={handleSave}
						isSaving={saveMutation.isPending}
					/>
				)}
			</div>

			<div className="space-y-8" id="vetorizacao-historico">
				<HelpSection />
				<BatchBanner />
				<ProWidget />
			</div>

			{creditAction.modal && (
				<CreditConfirmModal
					variant={creditAction.modal.variant}
					cost={creditAction.modal.cost}
					balance={creditAction.modal.balance}
					canUseCredits={creditAction.modal.canUseCredits}
					pending={creditAction.pending}
					onConfirm={creditAction.confirm}
					onClose={creditAction.close}
				/>
			)}
		</div>
	);
}
