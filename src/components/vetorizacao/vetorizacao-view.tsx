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
	useAutoVectorize,
	useCustomerVectors,
	useInvertVector,
	useSaveVector,
} from '@/hooks/use-vectors';
import { useToolBilling } from '@/modules/tools/hooks/use-tool-billing';
import type {
	AutoVectorizeInfo,
	InvertedVector,
	InvertMode,
	VectorFormat,
	VectorizeResult,
} from '@/services/vectorize';
import { chargeVectorFormat, openExistingVector } from '@/services/vectorize';
import { VectorList } from './vector-list';
import { VectorSupportPanel } from './vector-support-panel';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type WizardStep = 1 | 2 | 3;
/** Cor de fundo da PRÉVIA — puramente cosmética, não toca o arquivo. */
type BgMode = 'transparent' | 'white' | 'black';
/** Polaridade do ARQUIVO (SVG/PNG/DXF que o cliente baixa). */
type Polarity = 'normal' | 'inverted';

/** Tipo forçado nas opções avançadas; 'auto' = o servidor decide. */
type AutoKind = 'auto' | 'photo' | 'logo';

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
		{ num: 2 as const, label: 'Vetorizar' },
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

/* ─────────────── Step 2: Automático ─────────────── */

/** Largura útil aceita pelo backend (mm). */
const VECTOR_FORMATS: VectorFormat[] = ['svg', 'png', 'dxf'];
const WIDTH_MM_MIN = 5;
const WIDTH_MM_MAX = 1000;
const DEFAULT_WIDTH_MM = 120;

const KIND_OPTIONS: { value: AutoKind; label: string; desc: string }[] = [
	{ value: 'auto', label: 'Detectar', desc: 'Foto ou logo, sozinho' },
	{ value: 'photo', label: 'Foto', desc: 'Pessoa, pet, cena' },
	{ value: 'logo', label: 'Logo', desc: 'Arte, texto, ícone' },
];

function StepAuto({
	originalUrl,
	isVectorizing,
	onVectorize,
	onBack,
	kind,
	onKind,
	darkCup,
	onDarkCup,
	widthMm,
	onWidthMm,
}: {
	originalUrl: string | null;
	isVectorizing: boolean;
	onVectorize: () => void;
	onBack: () => void;
	kind: AutoKind;
	onKind: (k: AutoKind) => void;
	darkCup: boolean;
	onDarkCup: (v: boolean) => void;
	widthMm: number;
	onWidthMm: (v: number) => void;
}) {
	const [advancedOpen, setAdvancedOpen] = useState(false);
	const customized = kind !== 'auto' || darkCup || widthMm !== DEFAULT_WIDTH_MM;

	return (
		<div className="space-y-4">
			<style>{`@keyframes aiScan{0%{transform:translateY(-60%)}100%{transform:translateY(320%)}}`}</style>
			<div className="relative rounded-xl border border-slate-200 dark:border-white/10 bg-[repeating-conic-gradient(#f1f5f9_0_25%,#fff_0_50%)] dark:bg-[#1a1a1d] bg-[length:16px_16px] overflow-hidden h-[38vh] min-h-[200px] flex items-center justify-center">
				{originalUrl ? (
					<img
						src={originalUrl}
						alt="Sua imagem"
						className={`max-w-full max-h-full object-contain transition-opacity ${isVectorizing ? 'opacity-30' : ''}`}
					/>
				) : null}
				{isVectorizing && (
					<>
						<div
							className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-transparent via-violet-400/40 to-transparent"
							style={{ animation: 'aiScan 1.8s ease-in-out infinite' }}
						/>
						<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4">
							<Wand2 className="w-9 h-9 text-violet-600 dark:text-violet-400" />
							<p className="text-sm font-bold text-violet-700 dark:text-violet-300">
								Vetorizando…
							</p>
							<p className="text-[11px] text-slate-600 dark:text-gray-300">
								Logo pronto sai em segundos · foto leva ~30–60s
							</p>
						</div>
					</>
				)}
			</div>

			<div className="rounded-xl border border-violet-200 dark:border-violet-500/30 bg-violet-50/60 dark:bg-violet-500/10 px-4 py-3 flex items-start gap-3">
				<Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
				<p className="text-sm text-slate-700 dark:text-gray-300">
					<strong>Automático.</strong> Detectamos se é foto ou logo. Logo limpo
					é traçado direto; se precisar, a IA redesenha. Foto tem o fundo
					removido e vira gravura nanquim pronta para o laser.
				</p>
			</div>

			<div className="rounded-xl border border-slate-200 dark:border-white/10">
				<button
					type="button"
					onClick={() => setAdvancedOpen((v) => !v)}
					aria-expanded={advancedOpen}
					className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300"
				>
					<span className="flex items-center gap-2">
						<Settings className="w-4 h-4" />
						Opções avançadas
						{customized && !advancedOpen && (
							<span className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/20 px-1.5 py-0.5 rounded">
								alteradas
							</span>
						)}
					</span>
					{advancedOpen ? (
						<ChevronUp className="w-4 h-4" />
					) : (
						<ChevronDown className="w-4 h-4" />
					)}
				</button>
				{advancedOpen && (
					<div className="px-4 pb-4 space-y-4 border-t border-slate-200 dark:border-white/10 pt-4">
						<fieldset>
							<legend className="text-xs font-semibold text-slate-600 dark:text-gray-400 mb-2">
								Tipo de imagem
							</legend>
							<div className="grid grid-cols-3 gap-2">
								{KIND_OPTIONS.map((o) => (
									<button
										key={o.value}
										type="button"
										aria-pressed={kind === o.value}
										onClick={() => onKind(o.value)}
										className={`rounded-lg border px-3 py-2 text-left transition-colors ${
											kind === o.value
												? 'border-violet-500 bg-violet-50 dark:bg-violet-500/15'
												: 'border-slate-200 dark:border-white/10 hover:border-violet-300'
										}`}
									>
										<span className="block text-sm font-semibold text-slate-800 dark:text-white">
											{o.label}
										</span>
										<span className="block text-[11px] text-slate-500 dark:text-gray-400">
											{o.desc}
										</span>
									</button>
								))}
							</div>
						</fieldset>

						<label className="flex items-start justify-between gap-4 cursor-pointer">
							<span>
								<span className="block text-sm font-medium text-slate-800 dark:text-white">
									Copo escuro (negativo)
								</span>
								<span className="block text-xs text-slate-500 dark:text-gray-400">
									Grava os claros, recortado pela silhueta — sem quadrado de
									fundo.
								</span>
							</span>
							<input
								type="checkbox"
								checked={darkCup}
								onChange={(e) => onDarkCup(e.target.checked)}
								className="mt-1 h-5 w-5 accent-violet-600"
							/>
						</label>

						<label className="block">
							<span className="block text-sm font-medium text-slate-800 dark:text-white">
								Largura da gravação (mm)
							</span>
							<span className="block text-xs text-slate-500 dark:text-gray-400 mb-1.5">
								O SVG sai nessa medida; a altura segue a proporção.
							</span>
							<input
								type="number"
								inputMode="decimal"
								min={WIDTH_MM_MIN}
								max={WIDTH_MM_MAX}
								step={1}
								value={widthMm}
								onChange={(e) => {
									const v = Number(e.target.value);
									if (Number.isFinite(v)) onWidthMm(v);
								}}
								className="w-32 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111113] px-3 py-2 text-sm text-slate-900 dark:text-white"
							/>
						</label>
					</div>
				)}
			</div>

			<div className="flex items-center justify-between gap-3">
				<button
					type="button"
					onClick={onBack}
					disabled={isVectorizing}
					className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
				>
					<ArrowLeft className="w-4 h-4" />
					Trocar imagem
				</button>
				<button
					type="button"
					onClick={onVectorize}
					disabled={isVectorizing}
					className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
				>
					{isVectorizing ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Wand2 className="w-4 h-4" />
					)}
					{isVectorizing ? 'Vetorizando…' : 'Vetorizar'}
				</button>
			</div>
		</div>
	);
}

/* ─────────────── Step 3: Result ─────────────── */

const AUTO_ROUTE_LABEL: Record<string, string> = {
	'logo-local': 'traço direto, sem IA',
	'logo-ai-laser': 'redesenhado pela IA',
	'logo-negative': 'negativo para copo escuro',
	'photo-fotogravacao': 'gravura nanquim com IA',
	'photo-local-positive': 'gravura nanquim com IA',
	'photo-local-negative': 'negativo para copo escuro com IA',
	'photo-negative': 'negativo para copo escuro com IA',
};

/** O que o Automático decidiu — uma linha, sem jargão de motor. */
function AutoSummary({ info }: { info: AutoVectorizeInfo }) {
	const fmt = (n: number) =>
		n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
	return (
		<p className="text-xs text-slate-500 dark:text-gray-400">
			<span className="font-semibold text-slate-700 dark:text-gray-200">
				{info.kind === 'photo' ? 'Foto' : 'Logo'}
			</span>
			{' · '}
			{AUTO_ROUTE_LABEL[info.route] ?? 'vetorizado'}
			{' · '}
			{fmt(info.widthMm)} × {fmt(info.heightMm)} mm
			{' · '}
			{fmt(info.timeMs / 1000)} s
		</p>
	);
}

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

			{result.auto && <AutoSummary info={result.auto} />}

			{/* Polaridade: muda o ARQUIVO (não é a cor da prévia) */}
			<div className="flex items-center gap-2 flex-wrap">
				<span className="text-sm text-slate-500 dark:text-gray-400 mr-2">
					Polaridade:
				</span>
				{[
					{ key: 'normal' as const, label: 'Normal' },
					{
						key: 'inverted' as const,
						label: result.auto ? 'Invertido' : 'Invertido (silhueta)',
					},
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

			{showingInverted && inverted.mode === 'geometric' && result.auto && (
				<p className="rounded-lg bg-slate-100 dark:bg-white/5 px-3 py-2 text-xs text-slate-600 dark:text-gray-400">
					Negativo real: o fundo vira preto e a arte fica vazada, num vetor só.
					O Corel/LightBurn e o laser leem a polaridade trocada.
				</p>
			)}

			{showingInverted && !result.auto && (
				<div className="rounded-lg bg-slate-100 dark:bg-white/5 px-3 py-2 space-y-1">
					<p className="text-xs text-slate-600 dark:text-gray-400">
						Negativo real: o Corel/LightBurn e o laser leem a polaridade
						trocada, delimitada pela silhueta do desenho.{' '}
						<strong>
							No DXF a inversão não altera o preenchimento (DXF não tem
							preenchimento)
						</strong>{' '}
						— o arquivo ganha o contorno da silhueta.
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
				{billed &&
					perFormatCost > 0 &&
					!VECTOR_FORMATS.every((f) => result.paidFormats?.includes(f)) && (
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
					Mudar opções
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

	// Opções avançadas do Automático (recolhidas por padrão).
	const [kind, setKind] = useState<AutoKind>('auto');
	const [darkCup, setDarkCup] = useState(false);
	const [widthMm, setWidthMm] = useState(DEFAULT_WIDTH_MM);
	// Formato em cobrança agora (serializa os downloads → sem corrida no paid_formats).
	const [chargingFormat, setChargingFormat] = useState<VectorFormat | null>(
		null,
	);
	// Vetor invertido (delimitado pela silhueta). Gerado sob demanda e GRÁTIS; depois de
	// pronto, alternar polaridade é só troca local. Mora aqui (e não no
	// StepResult) porque o handler de download precisa do conteúdo ativo.
	const [inverted, setInverted] = useState<InvertedVector | null>(null);
	const [polarity, setPolarity] = useState<Polarity>('normal');
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
	/**
	 * PONTE COM O ESTÚDIO DE IMAGENS: `/course/vetorizacao?v=<id>` abre um vetor
	 * que JÁ FOI GERADO (e já foi pago) direto no passo do resultado.
	 *
	 * Lê `window.location.search` em vez de `useSearchParams()` de propósito: o
	 * hook do Next obriga a página inteira a ficar sob um `<Suspense>` para
	 * continuar pré-renderizável, e isto aqui é uma leitura única no mount. Um
	 * `ref` garante que uma geração nova nunca seja sobrescrita pelo import.
	 */
	const importedVector = useRef<string | null>(null);
	const [importing, setImporting] = useState(false);
	useEffect(() => {
		const id = new URLSearchParams(window.location.search).get('v');
		if (!id || importedVector.current === id) return;
		importedVector.current = id;
		setImporting(true);
		openExistingVector(id)
			.then((res) => {
				setResult(res);
				setStep(3);
			})
			.catch(() => {
				toast.error(
					'Não consegui abrir esse vetor. Ele ainda está em "Meus vetores".',
				);
			})
			.finally(() => setImporting(false));
	}, []);

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

	const autoMutation = useAutoVectorize();
	// Billing padrão pelo hook: cobra se a funcionalidade existir (confirma/debita/
	// modal saem dele, igual a Prévia/Parâmetros); roda livre se não houver.
	const { courses } = useEntitlements();
	const courseSlug = courses[0]?.slug;
	const billing = useToolBilling('vectorize', courseSlug);

	// Fluxo único Automático, COBRADO NA GERAÇÃO (invoke→motor→settle; falha
	// estorna no backend). O resultado já vem com todos os formatos pagos.
	const runVectorize = useCallback(async () => {
		if (!file) return;
		const clampedWidth = Math.min(
			WIDTH_MM_MAX,
			Math.max(WIDTH_MM_MIN, widthMm || DEFAULT_WIDTH_MM),
		);
		await billing.runEngine((invocationId) =>
			autoMutation
				.mutateAsync({
					file,
					invocationId,
					kind: kind === 'auto' ? undefined : kind,
					darkCup,
					widthMm: clampedWidth,
				})
				.then((res) => {
					setResult(res);
					setStep(3);
					refetchVectors();
					return res;
				}),
		);
	}, [file, billing, autoMutation, kind, darkCup, widthMm, refetchVectors]);

	// Vetores antigos (gerados antes do Automático) ainda cobram POR FORMATO no
	// download; os novos já chegam com tudo pago e baixam direto.
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
		setKind('auto');
		setDarkCup(false);
		setWidthMm(DEFAULT_WIDTH_MM);
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
				{importing && (
					<div className="mb-4 flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
						<Loader2 className="h-4 w-4 animate-spin" />
						Abrindo o vetor que veio do Estúdio de Imagens…
					</div>
				)}

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
					<StepAuto
						originalUrl={originalPreviewUrl}
						isVectorizing={autoMutation.isPending || billing.pending}
						onVectorize={handleVectorize}
						onBack={() => setStep(1)}
						kind={kind}
						onKind={setKind}
						darkCup={darkCup}
						onDarkCup={setDarkCup}
						widthMm={widthMm}
						onWidthMm={setWidthMm}
					/>
				)}

				{/* Aviso de custo/saldo — sem ele, clicar "Vetorizar" sem saldo não
				    dava sinal nenhum na tela. */}
				{step === 2 && billing.notice}

				{step === 2 && billing.billed && billing.cost > 0 && (
					<p className="mt-3 text-xs text-slate-500 dark:text-gray-400">
						{`Vetorizar custa ${billing.cost} voxxys e já libera SVG, PNG e DXF. Se falhar, o valor volta.`}
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
