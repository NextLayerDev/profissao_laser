'use client';

import {
	ArrowLeft,
	ArrowRight,
	Check,
	Copy,
	Cpu,
	Download,
	FileImage,
	Flame,
	Image,
	ImageDown,
	Loader2,
	RotateCcw,
	Sliders,
	Upload,
	Wand2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useLaserPrep } from '@/hooks/use-laser-prep';
import { downloadBmpFromPng } from '@/lib/bmp';
import { buildLbrn2, downloadLbrn2, type LaserType } from '@/lib/lightburn';
import { useToolBilling } from '@/modules/tools/hooks/use-tool-billing';
import {
	LASER_PREP_MATERIALS,
	type LaserPrepMaterial,
	type LaserPrepResult,
} from '@/services/gravacao-oneclick';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (mesmo limite do ImagR)
const DEFAULT_DPI = 254;
const DEFAULT_WIDTH_MM = 150;

type WizardStep = 1 | 2 | 3;
type OutputMode = 'png' | 'bmp' | 'lbrn2';

/** Rótulos PT pra cada chave de material (mesma ordem do motor). */
const MATERIAL_LABELS: Record<LaserPrepMaterial, string> = {
	wood: 'Madeira',
	'black slate': 'Ardósia Preta',
	glass: 'Vidro',
	acrylic: 'Acrílico',
	leather: 'Couro',
	cork: 'Cortiça',
	'andonized aluminum': 'Alumínio Anodizado',
	'stainless steel': 'Aço Inoxidável',
	'white tile': 'Azulejo Branco',
	'white tile painted black': 'Azulejo Branco pintado de preto',
};

const LASER_OPTIONS: { value: LaserType; label: string }[] = [
	{ value: 'co2', label: 'CO2' },
	{ value: 'diode', label: 'Diodo' },
	{ value: 'fiber', label: 'Fiber' },
	{ value: 'galvo', label: 'Galvo' },
	{ value: 'uv', label: 'UV' },
];

/** Lasers que pedem campos extra de frequência / largura de pulso Q. */
function laserHasPulse(laser: LaserType): boolean {
	return laser === 'fiber' || laser === 'galvo' || laser === 'uv';
}

/** Saídas disponíveis no passo 3 (PNG, BMP pra EZCAD, projeto LightBurn). */
const OUTPUT_OPTIONS: {
	value: OutputMode;
	icon: typeof FileImage;
	title: string;
	desc: string;
}[] = [
	{
		value: 'png',
		icon: FileImage,
		title: 'Imagem PNG',
		desc: 'Pronta pra qualquer software',
	},
	{
		value: 'bmp',
		icon: ImageDown,
		title: 'Imagem BMP',
		desc: 'Pra EZCAD (fiber/galvo/UV)',
	},
	{
		value: 'lbrn2',
		icon: Flame,
		title: 'LightBurn',
		desc: 'Projeto .lbrn2 com ajustes',
	},
];

/* ─────────────── Download helpers ─────────────── */

function triggerDownload(url: string, fileName: string, revoke: boolean) {
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	a.click();
	if (revoke) URL.revokeObjectURL(url);
}

async function downloadPng(url: string, baseName: string) {
	const name = `${baseName || 'gravacao'}.png`;
	try {
		const res = await fetch(url);
		const blob = await res.blob();
		triggerDownload(URL.createObjectURL(blob), name, true);
	} catch {
		window.open(url, '_blank');
	}
}

function baseNameOf(file: File | null): string {
	return file ? file.name.replace(/\.[^.]+$/, '') : 'gravacao';
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─────────────── Step Indicator ─────────────── */

function StepIndicator({
	current,
	onStepClick,
}: {
	current: WizardStep;
	/** Navega de volta a um passo já concluído (num < current). */
	onStepClick?: (num: WizardStep) => void;
}) {
	const steps = [
		{ num: 1 as const, label: 'Envie sua foto' },
		{ num: 2 as const, label: 'Material e tamanho' },
		{ num: 3 as const, label: 'Resultado' },
	];

	return (
		<div className="flex items-center justify-center gap-0 mb-8">
			{steps.map((step, idx) => {
				const done = current > step.num;
				const active = current === step.num;
				const clickable = done && !!onStepClick;
				const circle = (
					<div
						className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
							done
								? 'bg-violet-600 text-white'
								: active
									? 'bg-violet-600 text-white ring-4 ring-violet-500/20'
									: 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-gray-400'
						} ${clickable ? 'hover:ring-4 hover:ring-violet-500/20' : ''}`}
					>
						{done ? <Check className="w-5 h-5" /> : step.num}
					</div>
				);
				return (
					<div key={step.num} className="flex items-center">
						<div className="flex flex-col items-center">
							{clickable ? (
								<button
									type="button"
									onClick={() => onStepClick?.(step.num)}
									className="cursor-pointer"
									aria-label={`Voltar para ${step.label}`}
								>
									{circle}
								</button>
							) : (
								circle
							)}
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
				aria-label="Arraste a foto ou clique para selecionar"
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
					Arraste sua foto ou clique para selecionar
				</p>
				<p className="text-slate-500 dark:text-gray-500 text-sm">
					PNG, JPG, WEBP (máx. 50MB)
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

function NumberField({
	id,
	label,
	value,
	min,
	max,
	step,
	suffix,
	onChange,
}: {
	id: string;
	label: string;
	value: number;
	min?: number;
	max?: number;
	step?: number;
	suffix?: string;
	onChange: (v: number) => void;
}) {
	return (
		<div className="space-y-1.5">
			<label
				htmlFor={id}
				className="block text-sm font-medium text-slate-700 dark:text-slate-300"
			>
				{label}
			</label>
			<div className="flex items-center gap-2">
				<input
					id={id}
					type="number"
					value={value}
					min={min}
					max={max}
					step={step}
					onChange={(e) =>
						onChange(e.target.value === '' ? 0 : Number(e.target.value))
					}
					className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
				/>
				{suffix && (
					<span className="text-xs text-slate-400 shrink-0">{suffix}</span>
				)}
			</div>
		</div>
	);
}

/* ─────────────── Step 2: Material + parâmetros ─────────────── */

function StepParams({
	material,
	setMaterial,
	widthMm,
	setWidthMm,
	heightMm,
	dpi,
	setDpi,
	noDither,
	setNoDither,
	cleanBackground,
	setCleanBackground,
	bgTolerance,
	setBgTolerance,
	onPrepare,
	onBack,
	isPreparing,
	notice,
}: {
	material: LaserPrepMaterial;
	setMaterial: (m: LaserPrepMaterial) => void;
	widthMm: number;
	setWidthMm: (v: number) => void;
	/** Altura calculada pelo aspecto da foto (read-only, só exibição). */
	heightMm: number | null;
	dpi: number;
	setDpi: (v: number) => void;
	noDither: boolean;
	setNoDither: (v: boolean) => void;
	cleanBackground: boolean;
	setCleanBackground: (v: boolean) => void;
	bgTolerance: number;
	setBgTolerance: (v: number) => void;
	onPrepare: () => void;
	onBack: () => void;
	isPreparing: boolean;
	notice: React.ReactNode;
}) {
	return (
		<div className="space-y-8">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="space-y-1.5 sm:col-span-2">
					<label
						htmlFor="gp-material"
						className="block text-sm font-medium text-slate-700 dark:text-slate-300"
					>
						Material
					</label>
					<select
						id="gp-material"
						value={material}
						onChange={(e) => setMaterial(e.target.value as LaserPrepMaterial)}
						className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
					>
						{LASER_PREP_MATERIALS.map((key) => (
							<option key={key} value={key}>
								{MATERIAL_LABELS[key]}
							</option>
						))}
					</select>
				</div>

				<NumberField
					id="gp-width"
					label="Largura (mm)"
					value={widthMm}
					min={1}
					max={2000}
					step={1}
					suffix="mm"
					onChange={setWidthMm}
				/>
				<NumberField
					id="gp-dpi"
					label="DPI"
					value={dpi}
					min={72}
					max={1200}
					step={1}
					onChange={setDpi}
				/>

				{/* Altura: recalculada pela proporção da foto (igual ao ImagR). */}
				<div className="space-y-1.5 sm:col-span-2">
					<span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
						Altura (automática)
					</span>
					<div className="flex items-center gap-2">
						<div className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0d0d0d] text-slate-500 dark:text-slate-400">
							{heightMm != null ? `${heightMm} mm` : '—'}
						</div>
					</div>
					<p className="text-xs text-slate-400 dark:text-gray-500">
						Mantém a proporção da foto — calculada a partir da largura.
					</p>
				</div>
			</div>

			<div className="space-y-4">
				<label className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400 cursor-pointer">
					<input
						type="checkbox"
						checked={noDither}
						onChange={(e) => setNoDither(e.target.checked)}
						className="accent-violet-600"
					/>
					Desativar dithering
				</label>

				<div>
					<label className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400 cursor-pointer">
						<input
							type="checkbox"
							checked={cleanBackground}
							onChange={(e) => setCleanBackground(e.target.checked)}
							className="accent-violet-600"
						/>
						Limpar fundo
					</label>
					<p className="mt-1 ml-6 text-xs text-slate-400 dark:text-gray-500">
						Remove o fundo até os cantos (segue o gradiente a partir das
						bordas), deixando só o objeto central. Ideal pra foto de produto.
					</p>

					{cleanBackground && (
						<div className="mt-3 ml-6 max-w-sm space-y-1.5">
							<div className="flex items-center justify-between">
								<span className="text-xs font-medium text-slate-600 dark:text-slate-300">
									Tolerância do fundo
								</span>
								<span className="text-xs text-slate-400">{bgTolerance}%</span>
							</div>
							<input
								type="range"
								min={0}
								max={100}
								step={1}
								value={bgTolerance}
								aria-label="Tolerância do fundo"
								onChange={(e) => setBgTolerance(Number(e.target.value))}
								className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-white/10 accent-violet-600"
							/>
							<p className="text-xs text-slate-400 dark:text-gray-500">
								Mais alto limpa fundos mais escuros (vinheta). Se começar a
								comer o objeto, reduza.
							</p>
						</div>
					)}
				</div>
			</div>

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
					onClick={onPrepare}
					disabled={isPreparing}
					className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
				>
					{isPreparing ? (
						<>
							<Loader2 className="w-4 h-4 animate-spin" />
							Preparando...
						</>
					) : (
						<>
							<Wand2 className="w-4 h-4" />
							Preparar imagem
						</>
					)}
				</button>
			</div>

			{notice}
		</div>
	);
}

/* ─────────────── Before / After ─────────────── */

function BeforeAfter({
	originalUrl,
	resultUrl,
}: {
	originalUrl: string | null;
	resultUrl: string;
}) {
	const [pos, setPos] = useState(50);

	return (
		<div className="space-y-3">
			<div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-[#1a1a1d] select-none">
				{/* Depois (base) */}
				<img
					src={resultUrl}
					alt="Resultado da preparação"
					className="absolute inset-0 w-full h-full object-contain"
				/>
				{/* Antes (recortado pela posição do slider) */}
				{originalUrl && (
					<div
						className="absolute inset-0 overflow-hidden"
						style={{ width: `${pos}%` }}
					>
						<img
							src={originalUrl}
							alt="Foto original"
							className="absolute inset-0 h-full object-contain"
							style={{ width: `${(100 / pos) * 100}%`, maxWidth: 'none' }}
						/>
					</div>
				)}
				<div
					className="absolute inset-y-0 w-0.5 bg-violet-500 pointer-events-none"
					style={{ left: `${pos}%` }}
				/>
				<span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-semibold uppercase tracking-wider">
					Antes
				</span>
				<span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-violet-600 text-white text-[10px] font-semibold uppercase tracking-wider">
					Depois
				</span>
			</div>
			<input
				type="range"
				min={0}
				max={100}
				step={1}
				value={pos}
				aria-label="Comparar antes e depois"
				onChange={(e) => setPos(Number(e.target.value))}
				className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-white/10 accent-violet-600"
			/>
		</div>
	);
}

/* ─────────────── Step 3: Result ─────────────── */

function StepResult({
	result,
	originalUrl,
	baseName,
	materialLabel,
	onGoToStep2,
	onReset,
}: {
	result: LaserPrepResult;
	originalUrl: string | null;
	baseName: string;
	materialLabel: string;
	onGoToStep2: () => void;
	onReset: () => void;
}) {
	const [output, setOutput] = useState<OutputMode>('png');
	const [laser, setLaser] = useState<LaserType>('co2');
	const [speed, setSpeed] = useState(300);
	const [minPower, setMinPower] = useState(10);
	const [maxPower, setMaxPower] = useState(50);
	const [freqKhz, setFreqKhz] = useState(30);
	const [qPulseUs, setQPulseUs] = useState(100);
	const [bmpBusy, setBmpBusy] = useState(false);
	const [copied, setCopied] = useState(false);

	const hasPulse = laserHasPulse(laser);
	// Ajustes de laser aparecem tanto pro LightBurn (embutidos no arquivo) quanto
	// pro BMP/EZCAD (mostrados como parâmetros pra copiar).
	const showLaserSettings = output === 'lbrn2' || output === 'bmp';

	const handleDownloadPng = useCallback(() => {
		downloadPng(result.pngUrl, baseName);
	}, [result.pngUrl, baseName]);

	const handleDownloadBmp = useCallback(async () => {
		setBmpBusy(true);
		try {
			await downloadBmpFromPng(
				`${baseName || 'gravacao'}.bmp`,
				result.pngBase64,
				result.dpi,
			);
		} catch {
			toast.error('Não foi possível gerar o BMP.');
		} finally {
			setBmpBusy(false);
		}
	}, [result.pngBase64, result.dpi, baseName]);

	// Parâmetros pra colar no EZCAD (o .ezd é binário fechado — não dá pra gerar).
	const laserLabel =
		LASER_OPTIONS.find((o) => o.value === laser)?.label ?? laser;
	const ezcadParams = useMemo(() => {
		const lines = [
			`Material: ${materialLabel}`,
			`Tamanho: ${result.width_mm} x ${result.height_mm} mm @ ${result.dpi} DPI`,
			`Laser: ${laserLabel}`,
			`Velocidade: ${speed} mm/s`,
			`Potencia: ${minPower}-${maxPower} %`,
		];
		if (hasPulse) {
			lines.push(`Frequencia: ${freqKhz} kHz`);
			lines.push(`Q-pulse: ${qPulseUs} us`);
		}
		return lines.join('\n');
	}, [
		materialLabel,
		result.width_mm,
		result.height_mm,
		result.dpi,
		laserLabel,
		speed,
		minPower,
		maxPower,
		hasPulse,
		freqKhz,
		qPulseUs,
	]);

	const handleCopyEzcad = useCallback(() => {
		navigator.clipboard?.writeText(ezcadParams).then(
			() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 1500);
			},
			() => toast.error('Não foi possível copiar.'),
		);
	}, [ezcadParams]);

	const handleDownloadLbrn2 = useCallback(() => {
		const xml = buildLbrn2({
			pngBase64: result.pngBase64,
			widthMm: result.width_mm,
			heightMm: result.height_mm,
			dpi: result.dpi,
			laser,
			speed,
			minPower,
			maxPower,
			freqKhz: hasPulse ? freqKhz : undefined,
			qPulseUs: hasPulse ? qPulseUs : undefined,
		});
		downloadLbrn2(`${baseName || 'gravacao'}.lbrn2`, xml);
	}, [
		result,
		baseName,
		laser,
		speed,
		minPower,
		maxPower,
		hasPulse,
		freqKhz,
		qPulseUs,
	]);

	return (
		<div className="space-y-6">
			<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-4">
				<BeforeAfter originalUrl={originalUrl} resultUrl={result.pngBase64} />
				<div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
					{[
						materialLabel,
						`${result.width_mm}×${result.height_mm} mm`,
						`${result.px_w}×${result.px_h} px`,
						`${result.dpi} DPI`,
					].map((chip) => (
						<span
							key={chip}
							className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
						>
							{chip}
						</span>
					))}
				</div>
			</div>

			{/* Escolha de saída */}
			<fieldset className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
				<legend className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
					Saída
				</legend>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
					{OUTPUT_OPTIONS.map((opt) => (
						<label
							key={opt.value}
							className={`flex items-start gap-3 rounded-xl border-2 p-3 cursor-pointer transition-colors ${
								output === opt.value
									? 'border-violet-600 bg-violet-50 dark:bg-violet-500/10'
									: 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
							}`}
						>
							<input
								type="radio"
								name="output-mode"
								value={opt.value}
								checked={output === opt.value}
								onChange={() => setOutput(opt.value)}
								className="accent-violet-600 mt-0.5"
							/>
							<opt.icon className="w-5 h-5 shrink-0 text-violet-600 dark:text-violet-400" />
							<span className="min-w-0">
								<span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
									{opt.title}
								</span>
								<span className="block text-[11px] text-slate-400 dark:text-gray-500">
									{opt.desc}
								</span>
							</span>
						</label>
					))}
				</div>

				{showLaserSettings && (
					<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5 sm:col-span-2">
							<label
								htmlFor="gp-laser"
								className="block text-sm font-medium text-slate-700 dark:text-slate-300"
							>
								Tipo de laser
							</label>
							<select
								id="gp-laser"
								value={laser}
								onChange={(e) => setLaser(e.target.value as LaserType)}
								className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
							>
								{LASER_OPTIONS.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</select>
						</div>
						<NumberField
							id="gp-speed"
							label="Velocidade"
							value={speed}
							min={1}
							step={1}
							suffix="mm/s"
							onChange={setSpeed}
						/>
						<div />
						<NumberField
							id="gp-min-power"
							label="Potência mín"
							value={minPower}
							min={0}
							max={100}
							step={1}
							suffix="%"
							onChange={setMinPower}
						/>
						<NumberField
							id="gp-max-power"
							label="Potência máx"
							value={maxPower}
							min={0}
							max={100}
							step={1}
							suffix="%"
							onChange={setMaxPower}
						/>
						{hasPulse && (
							<>
								<NumberField
									id="gp-freq"
									label="Frequência (kHz)"
									value={freqKhz}
									min={1}
									step={1}
									suffix="kHz"
									onChange={setFreqKhz}
								/>
								<NumberField
									id="gp-qpulse"
									label="Largura de pulso Q (µs)"
									value={qPulseUs}
									min={1}
									step={1}
									suffix="µs"
									onChange={setQPulseUs}
								/>
							</>
						)}
					</div>
				)}

				{/* EZCAD: o .ezd é binário fechado (não dá pra gerar). Em vez disso,
				    entrega o BMP + estes parâmetros prontos pra colar no EZCAD. */}
				{output === 'bmp' && (
					<div className="mt-4 rounded-xl border border-violet-200 dark:border-violet-500/30 bg-violet-50/60 dark:bg-violet-500/5 p-3">
						<div className="flex items-center justify-between gap-2 mb-2">
							<span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
								<Cpu className="w-3.5 h-3.5" />
								Parâmetros pro EZCAD
							</span>
							<button
								type="button"
								onClick={handleCopyEzcad}
								className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-500/10 transition-colors"
							>
								{copied ? (
									<Check className="w-3.5 h-3.5" />
								) : (
									<Copy className="w-3.5 h-3.5" />
								)}
								{copied ? 'Copiado' : 'Copiar'}
							</button>
						</div>
						<pre className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-mono">
							{ezcadParams}
						</pre>
						<p className="mt-2 text-[11px] text-slate-400 dark:text-gray-500">
							Importe o BMP no EZCAD (Arquivo → Importar) e use estes valores na
							aba de marcação. O EZCAD não tem formato de projeto aberto, então
							os ajustes vão como referência (não embutidos no arquivo).
						</p>
					</div>
				)}
			</fieldset>

			{/* Download principal conforme a saída */}
			{output === 'png' && (
				<button
					type="button"
					onClick={handleDownloadPng}
					className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors"
				>
					<Download className="w-5 h-5" />
					Baixar imagem (PNG)
				</button>
			)}
			{output === 'bmp' && (
				<button
					type="button"
					onClick={handleDownloadBmp}
					disabled={bmpBusy}
					className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
				>
					{bmpBusy ? (
						<Loader2 className="w-5 h-5 animate-spin" />
					) : (
						<Download className="w-5 h-5" />
					)}
					{bmpBusy ? 'Gerando BMP...' : 'Baixar imagem (BMP)'}
				</button>
			)}
			{output === 'lbrn2' && (
				<button
					type="button"
					onClick={handleDownloadLbrn2}
					className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors"
				>
					<Download className="w-5 h-5" />
					Baixar projeto LightBurn
				</button>
			)}

			<div className="flex flex-wrap gap-3">
				<button
					type="button"
					onClick={onGoToStep2}
					className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
				>
					<Sliders className="w-4 h-4" />
					Ajustar material
				</button>
				<button
					type="button"
					onClick={onReset}
					className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
				>
					<RotateCcw className="w-4 h-4" />
					Nova preparação
				</button>
			</div>
		</div>
	);
}

/* ─────────────── Main View ─────────────── */

export function GravacaoOneClickView() {
	const [step, setStep] = useState<WizardStep>(1);
	const [file, setFile] = useState<File | null>(null);
	const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(
		null,
	);
	const [result, setResult] = useState<LaserPrepResult | null>(null);

	const [material, setMaterial] = useState<LaserPrepMaterial>('wood');
	const [widthMm, setWidthMm] = useState(DEFAULT_WIDTH_MM);
	const [dpi, setDpi] = useState(DEFAULT_DPI);
	const [noDither, setNoDither] = useState(false);
	const [cleanBackground, setCleanBackground] = useState(false);
	// Tolerância 0–100 (slider) → margem do limiar de fundo (bgMargin).
	const [bgTolerance, setBgTolerance] = useState(50);
	// Proporção (altura/largura) da foto original — pra prever a altura de saída.
	const [srcAspect, setSrcAspect] = useState<number | null>(null);

	// portal só após montar (evita mismatch de hidratação)
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const wizardRef = useRef<HTMLDivElement>(null);
	const resultRef = useRef<HTMLDivElement>(null);

	const prepMutation = useLaserPrep();
	// Billing padrão pelo hook: cobra se a funcionalidade existir; roda livre se não.
	const { courses } = useEntitlements();
	const courseSlug = courses[0]?.slug;
	const billing = useToolBilling('gravacao_oneclick', courseSlug);

	const runPrepare = useCallback(async () => {
		if (!file) return;
		// O hook decide: cobrada → invoke→motor→settle; livre → motor sem invocation.
		// Tolerância 0–100 → margem abaixo da mediana da borda (4 … 48). Mais alto
		// limpa fundos mais escuros (vinheta), mas pode "comer" partes claras do
		// objeto que estejam tão claras quanto o fundo.
		const bgMargin = Math.round(4 + (bgTolerance / 100) * 44);
		await billing.runEngine((invocationId) =>
			prepMutation
				.mutateAsync({
					file,
					invocationId,
					params: {
						material,
						width_mm: widthMm,
						dpi,
						noDither,
						cleanBackground,
						bgMargin: cleanBackground ? bgMargin : undefined,
					},
				})
				.then((res) => {
					setResult(res);
					setStep(3);
					return res;
				}),
		);
	}, [
		file,
		billing,
		prepMutation,
		material,
		widthMm,
		dpi,
		noDither,
		cleanBackground,
		bgTolerance,
	]);

	const handleFileSelected = useCallback((selectedFile: File) => {
		if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
			toast.error('Formato não suportado. Use PNG, JPG ou WEBP.');
			return;
		}
		if (selectedFile.size > MAX_FILE_SIZE) {
			toast.error('Arquivo muito grande (máx. 50MB).');
			return;
		}
		setFile(selectedFile);
		setResult(null);
		const url = URL.createObjectURL(selectedFile);
		setOriginalPreviewUrl(url);
		// Lê as dimensões naturais pra prever a altura de saída (mesmo cálculo do
		// motor: heightMm = widthMm * srcH/srcW). `window.Image` porque `Image`
		// aqui é o ícone do lucide-react.
		setSrcAspect(null);
		const img = new window.Image();
		img.onload = () => {
			if (img.naturalWidth > 0)
				setSrcAspect(img.naturalHeight / img.naturalWidth);
		};
		img.src = url;
	}, []);

	const handlePrepare = useCallback(() => {
		if (!file) return;
		runPrepare();
	}, [file, runPrepare]);

	const handleReset = useCallback(() => {
		setStep(1);
		setFile(null);
		setResult(null);
		setOriginalPreviewUrl(null);
		setSrcAspect(null);
		setMaterial('wood');
		setWidthMm(DEFAULT_WIDTH_MM);
		setDpi(DEFAULT_DPI);
		setNoDither(false);
		setCleanBackground(false);
		setBgTolerance(50);
	}, []);

	const baseName = useMemo(() => baseNameOf(file), [file]);

	// Altura de saída prevista (mm), arredondada a 1 casa pra exibição no passo 2.
	const previewHeightMm = useMemo(
		() =>
			srcAspect != null && widthMm > 0
				? Math.round(widthMm * srcAspect * 10) / 10
				: null,
		[srcAspect, widthMm],
	);

	// scroll acompanha a navegação do wizard
	useEffect(() => {
		if (!step) return;
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
			<PageHeader
				title="Gravação 1-Clique"
				subtitle="Prepara uma foto pra gravação a laser (imagem pronta + LightBurn)."
				icon={Flame}
			/>

			<div
				ref={wizardRef}
				className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-6 mb-8"
			>
				<StepIndicator
					current={step}
					onStepClick={(num) => {
						// Só volta pra passos já concluídos (com dados disponíveis).
						if (num === 1) setStep(1);
						else if (num === 2 && file) setStep(2);
					}}
				/>

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
						material={material}
						setMaterial={setMaterial}
						widthMm={widthMm}
						setWidthMm={setWidthMm}
						heightMm={previewHeightMm}
						dpi={dpi}
						setDpi={setDpi}
						noDither={noDither}
						setNoDither={setNoDither}
						cleanBackground={cleanBackground}
						setCleanBackground={setCleanBackground}
						bgTolerance={bgTolerance}
						setBgTolerance={setBgTolerance}
						onPrepare={handlePrepare}
						onBack={() => setStep(1)}
						isPreparing={billing.pending}
						notice={billing.notice}
					/>
				)}

				{step === 3 && result && (
					<div ref={resultRef}>
						<StepResult
							result={result}
							originalUrl={originalPreviewUrl}
							baseName={baseName}
							materialLabel={MATERIAL_LABELS[material]}
							onGoToStep2={() => setStep(2)}
							onReset={handleReset}
						/>
					</div>
				)}
			</div>

			{/* CTA flutuante (continuar/preparar sempre visível) */}
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
						onClick={handlePrepare}
						disabled={billing.pending}
						className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-6 py-3.5 bg-violet-700 hover:bg-violet-600 text-white font-semibold rounded-full shadow-xl shadow-violet-900/30 transition-colors disabled:opacity-60"
					>
						{billing.pending ? (
							<>
								<Loader2 className="w-5 h-5 animate-spin" />
								Preparando...
							</>
						) : (
							<>
								<Wand2 className="w-5 h-5" />
								Preparar imagem
							</>
						)}
					</button>,
					document.body,
				)}
		</div>
	);
}
