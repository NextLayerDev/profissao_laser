'use client';

import {
	ArrowRight,
	BookOpen,
	Check,
	ChevronDown,
	ChevronUp,
	Crown,
	Download,
	Eye,
	HelpCircle,
	Image,
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
import type { VectorizeResult } from '@/services/vectorize';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type WizardStep = 1 | 2 | 3;
type VectorMode = 'contorno' | 'detalhado' | 'preenchimento';
type BgMode = 'transparent' | 'white' | 'black';

function downloadSvg(svgContent: string, originalName: string) {
	const baseName = originalName.replace(/\.[^.]+$/, '') || 'vector';
	const fileName = `${baseName}.svg`;
	const blob = new Blob([svgContent], { type: 'image/svg+xml' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	a.click();
	URL.revokeObjectURL(url);
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
		{ num: 2 as const, label: 'Ajuste os parametros' },
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
	result,
	isVectorizing,
	originalPreviewUrl,
}: {
	onFileSelected: (file: File) => void;
	file: File | null;
	result: VectorizeResult | null;
	isVectorizing: boolean;
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

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

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
			{/* Drop zone */}
			<div
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
				}}
				aria-label="Arraste imagens ou clique para selecionar"
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
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

			{/* File info card */}
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
						{isVectorizing && (
							<div className="flex items-center gap-2 text-violet-600">
								<Loader2 className="w-5 h-5 animate-spin" />
								<span className="text-sm font-medium">Vetorizando...</span>
							</div>
						)}
						{result && !isVectorizing && (
							<div className="flex items-center gap-2 text-emerald-500">
								<Check className="w-5 h-5" />
								<span className="text-sm font-medium">Pronto</span>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Side-by-side preview */}
			{file && (originalPreviewUrl || result) && (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{originalPreviewUrl && (
						<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-4">
							<p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">
								Original
							</p>
							<div className="aspect-square bg-slate-100 dark:bg-[#1a1a1d] rounded-lg flex items-center justify-center overflow-hidden">
								<img
									src={originalPreviewUrl}
									alt="Original"
									className="max-w-full max-h-full object-contain"
								/>
							</div>
						</div>
					)}
					<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-4">
						<p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">
							Vetorizado
						</p>
						<div className="aspect-square bg-slate-100 dark:bg-[#1a1a1d] rounded-lg flex items-center justify-center overflow-hidden">
							{isVectorizing ? (
								<div className="flex flex-col items-center gap-3">
									<Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
									<span className="text-sm text-slate-500">Processando...</span>
								</div>
							) : result ? (
								<img
									src={svgToDataUrl(result.svgContent)}
									alt="Vetorizado"
									className="max-w-full max-h-full object-contain"
								/>
							) : (
								<span className="text-sm text-slate-400">Aguardando...</span>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

/* ─────────────── Step 2: Parameters ─────────────── */

function StepParams({
	mode,
	setMode,
	sliders,
	setSliders,
	toggles,
	setToggles,
	onContinue,
}: {
	mode: VectorMode;
	setMode: (m: VectorMode) => void;
	sliders: { detalhes: number; suavizacao: number; ruidos: number };
	setSliders: (s: {
		detalhes: number;
		suavizacao: number;
		ruidos: number;
	}) => void;
	toggles: { pb: boolean; invertColors: boolean };
	setToggles: (t: { pb: boolean; invertColors: boolean }) => void;
	onContinue: () => void;
}) {
	const [advancedOpen, setAdvancedOpen] = useState(false);

	const modes: {
		key: VectorMode;
		label: string;
		desc: string;
		icon: React.ReactNode;
	}[] = [
		{
			key: 'contorno',
			label: 'Contorno',
			desc: 'Apenas bordas e contornos',
			icon: <PenLine className="w-6 h-6" />,
		},
		{
			key: 'detalhado',
			label: 'Detalhado',
			desc: 'Maximo de detalhes preservados',
			icon: <Eye className="w-6 h-6" />,
		},
		{
			key: 'preenchimento',
			label: 'Preenchimento',
			desc: 'Areas solidas com preenchimento',
			icon: <Wand2 className="w-6 h-6" />,
		},
	];

	return (
		<div className="space-y-8">
			{/* Mode selector */}
			<div>
				<h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
					Modo de vetorizacao
				</h4>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					{modes.map((m) => (
						<button
							key={m.key}
							type="button"
							onClick={() => setMode(m.key)}
							className={`rounded-xl border-2 p-4 text-left transition-all ${
								mode === m.key
									? 'border-violet-600 bg-violet-50 dark:bg-violet-500/10'
									: 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] hover:border-slate-300 dark:hover:border-white/20'
							}`}
						>
							<div
								className={`mb-2 ${
									mode === m.key
										? 'text-violet-600 dark:text-violet-400'
										: 'text-slate-400 dark:text-gray-500'
								}`}
							>
								{m.icon}
							</div>
							<p
								className={`font-semibold text-sm ${
									mode === m.key
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

			{/* Sliders */}
			<div className="space-y-5">
				<h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
					Parametros
				</h4>
				{[
					{
						key: 'detalhes' as const,
						label: 'Detalhes',
						icon: <Sliders className="w-4 h-4" />,
					},
					{
						key: 'suavizacao' as const,
						label: 'Suavizacao',
						icon: <Settings className="w-4 h-4" />,
					},
					{
						key: 'ruidos' as const,
						label: 'Ruidos',
						icon: <Zap className="w-4 h-4" />,
					},
				].map((s) => (
					<div key={s.key}>
						<div className="flex items-center justify-between mb-1.5">
							<div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
								{s.icon}
								{s.label}
							</div>
							<span className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{sliders[s.key]}%
							</span>
						</div>
						<input
							type="range"
							min={0}
							max={100}
							value={sliders[s.key]}
							onChange={(e) =>
								setSliders({ ...sliders, [s.key]: Number(e.target.value) })
							}
							className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-white/10 accent-violet-600"
						/>
					</div>
				))}
			</div>

			{/* Toggles */}
			<div className="flex flex-wrap gap-4">
				{[
					{ key: 'pb' as const, label: 'P&B' },
					{ key: 'invertColors' as const, label: 'Inverter cores' },
				].map((t) => (
					<label
						key={t.key}
						className="flex items-center gap-2.5 cursor-pointer select-none"
					>
						<button
							type="button"
							role="switch"
							aria-checked={toggles[t.key]}
							onClick={() =>
								setToggles({ ...toggles, [t.key]: !toggles[t.key] })
							}
							className={`relative w-11 h-6 rounded-full transition-colors ${
								toggles[t.key]
									? 'bg-violet-600'
									: 'bg-slate-300 dark:bg-white/20'
							}`}
						>
							<span
								className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
									toggles[t.key] ? 'translate-x-5' : 'translate-x-0'
								}`}
							/>
						</button>
						<span className="text-sm text-slate-700 dark:text-slate-300">
							{t.label}
						</span>
					</label>
				))}
			</div>

			{/* Advanced settings */}
			<div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
				<button
					type="button"
					onClick={() => setAdvancedOpen(!advancedOpen)}
					className="w-full flex items-center justify-between p-4 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
				>
					<div className="flex items-center gap-2">
						<Settings className="w-4 h-4" />
						Configuracoes avancadas
					</div>
					{advancedOpen ? (
						<ChevronUp className="w-4 h-4" />
					) : (
						<ChevronDown className="w-4 h-4" />
					)}
				</button>
				{advancedOpen && (
					<div className="p-4 pt-0 text-sm text-slate-500 dark:text-gray-400">
						<p>
							Configuracoes avancadas estarao disponiveis em breve. Os
							parametros atuais ja oferecem excelentes resultados para a maioria
							dos casos de uso.
						</p>
					</div>
				)}
			</div>

			{/* Continue button */}
			<div className="flex justify-end">
				<button
					type="button"
					onClick={onContinue}
					className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-600 text-white font-semibold rounded-xl transition-colors"
				>
					Continuar
					<ArrowRight className="w-4 h-4" />
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
			{/* SVG Preview */}
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

			{/* Background toggle */}
			<div className="flex items-center gap-2">
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

			{/* Download buttons */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<button
					type="button"
					onClick={() => downloadSvg(result.svgContent, result.originalName)}
					className="flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-600 text-white font-semibold rounded-xl transition-colors"
				>
					<Download className="w-5 h-5" />
					Baixar SVG
				</button>
				<button
					type="button"
					onClick={() => toast.info('Exportacao DXF em breve!')}
					className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-gray-400 font-semibold rounded-xl transition-colors hover:bg-slate-300 dark:hover:bg-white/20"
				>
					<Download className="w-5 h-5" />
					Baixar DXF
					<span className="text-[10px] bg-slate-300 dark:bg-white/10 text-slate-500 dark:text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
						Em breve
					</span>
				</button>
				<button
					type="button"
					onClick={() => toast.info('Exportacao PNG em breve!')}
					className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-gray-400 font-semibold rounded-xl transition-colors hover:bg-slate-300 dark:hover:bg-white/20"
				>
					<Download className="w-5 h-5" />
					Baixar PNG
					<span className="text-[10px] bg-slate-300 dark:bg-white/10 text-slate-500 dark:text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
						Em breve
					</span>
				</button>
			</div>

			{/* Action buttons */}
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
					Nova vetorizacao
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
			desc: 'Veja exemplos de vetorizacao',
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
					Vetorizacao em lote
				</h4>
				<p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
					Vetorize multiplas imagens de uma vez. Recurso disponivel em breve.
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
			{/* Background image */}
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
					Desbloqueie vetorizacao em lote, exportacao DXF, historico ilimitado e
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

	// Step 2 visual-only state
	const [mode, setMode] = useState<VectorMode>('detalhado');
	const [sliders, setSliders] = useState({
		detalhes: 75,
		suavizacao: 60,
		ruidos: 30,
	});
	const [toggles, setToggles] = useState({ pb: false, invertColors: false });

	const vectorizeMutation = useVectorizeImage();
	const { data: voxBalance } = useVoxBalance();
	const { data: voxCosts } = useVoxCosts();
	const vectorizeCost =
		voxCosts?.find((c) => c.feature === 'vectorize')?.cost ?? 1;
	const [pendingFile, setPendingFile] = useState<File | null>(null);

	const creditAction = useCreditAction({
		feature: 'vectorize',
		cost: vectorizeCost,
		balance: voxBalance?.balance ?? 0,
		run: async ({ useCredits }) => {
			if (!pendingFile) throw new Error('no-file');
			const res = await vectorizeMutation.mutateAsync({
				file: pendingFile,
				useCredits,
			});
			setResult(res);
			return res;
		},
	});
	const saveMutation = useSaveVector();

	const handleFileSelected = useCallback(
		async (selectedFile: File) => {
			// Validate
			if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
				toast.error('Formato nao suportado. Use PNG, JPG ou WEBP.');
				return;
			}
			if (selectedFile.size > MAX_FILE_SIZE) {
				toast.error('Ficheiro demasiado grande (max. 10MB).');
				return;
			}

			setFile(selectedFile);
			setResult(null);

			// Create preview URL for original
			const previewUrl = URL.createObjectURL(selectedFile);
			setOriginalPreviewUrl(previewUrl);

			// Confirmação proativa de voxes antes de vetorizar
			setPendingFile(selectedFile);
			creditAction.trigger();
		},
		[creditAction],
	);

	const handleReset = useCallback(() => {
		setStep(1);
		setFile(null);
		setResult(null);
		setOriginalPreviewUrl(null);
		setMode('detalhado');
		setSliders({ detalhes: 75, suavizacao: 60, ruidos: 30 });
		setToggles({ pb: false, invertColors: false });
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

	const canProceedStep1 = !!result && !vectorizeMutation.isPending;

	return (
		<div className="p-4 md:p-8">
			<PageHeader
				title="Vetorizacao"
				subtitle="Converta imagens PNG, JPG ou WEBP em SVG vetorial."
				icon={PenLine}
			/>

			{/* Wizard card */}
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-6 mb-8">
				<StepIndicator current={step} />

				{/* Step 1 */}
				{step === 1 && (
					<div>
						<StepUpload
							onFileSelected={handleFileSelected}
							file={file}
							result={result}
							isVectorizing={vectorizeMutation.isPending}
							originalPreviewUrl={originalPreviewUrl}
						/>
						{canProceedStep1 && (
							<div className="flex justify-end mt-6">
								<button
									type="button"
									onClick={() => setStep(2)}
									className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-600 text-white font-semibold rounded-xl transition-colors"
								>
									Continuar
									<ArrowRight className="w-4 h-4" />
								</button>
							</div>
						)}
					</div>
				)}

				{/* Step 2 */}
				{step === 2 && (
					<StepParams
						mode={mode}
						setMode={setMode}
						sliders={sliders}
						setSliders={setSliders}
						toggles={toggles}
						setToggles={setToggles}
						onContinue={() => setStep(3)}
					/>
				)}

				{/* Step 3 */}
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

			{/* Additional sections */}
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
