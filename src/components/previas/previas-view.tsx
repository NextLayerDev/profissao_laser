'use client';

import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	Download,
	Eye,
	Image,
	Loader2,
	Pencil,
	RotateCcw,
	Trash2,
	Upload,
	Zap,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import {
	useDeletePrevia,
	useGeneratePrevia,
	usePreviasHistory,
	usePreviasQuota,
	useUpdatePrevia,
} from '@/hooks/use-previas';
import type {
	GeneratePreviaPayload,
	LaserSettings,
	PersonalizationType,
	Previa,
	PreviasQuota,
} from '@/types/previas';

type WizardStep = 1 | 2 | 3 | 4;

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const DEFAULT_LASER_SETTINGS: LaserSettings = {
	tamanho: 'medio',
	posicao: 'central',
	rotacao: 0,
	intensidade: 'media',
	profundidade: 'media',
	comNome: 'sem',
	nomePersonalizado: '',
	fonteFamilia: 'Arial',
	tamanhoNome: 'medio',
	orientacaoLogo: 'horizontal',
	orientacaoNome: 'horizontal',
	material: 'madeira',
	estiloGravacao: 'clean',
	acabamentoSuperficie: 'fosco',
	contraste: 50,
	efeitoSombra: 0,
	moldura: 'nenhuma',
	posicaoTextoRelLogo: 'abaixo',
	espacamentoLogoTexto: 'medio',
	tipoVisualizacao: '3d',
	anguloCamera: 'frontal',
	iluminacao: 'natural',
	fundoCena: 'neutro',
	apenasTexto: false,
	modoLentes: false,
	textoLenteDireita: '',
	textoLenteEsquerda: '',
};

const MAX_IMAGE_DIM = 1024;
const JPEG_QUALITY = 0.7;

function compressImage(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new window.Image();
		img.onload = () => {
			let { width, height } = img;
			if (width > MAX_IMAGE_DIM || height > MAX_IMAGE_DIM) {
				const ratio = Math.min(MAX_IMAGE_DIM / width, MAX_IMAGE_DIM / height);
				width = Math.round(width * ratio);
				height = Math.round(height * ratio);
			}
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				reject(new Error('Canvas not supported'));
				return;
			}
			ctx.drawImage(img, 0, 0, width, height);
			resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
		};
		img.onerror = reject;
		img.src = URL.createObjectURL(file);
	});
}

function downloadUrl(url: string, filename: string) {
	fetch(url)
		.then((res) => res.blob())
		.then((blob) => {
			const blobUrl = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = blobUrl;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(blobUrl);
		})
		.catch(() => {
			window.open(url, '_blank');
		});
}

/* ─────────────── Step Indicator ─────────────── */

function StepIndicator({ current }: { current: WizardStep }) {
	const steps = [
		{ num: 1 as const, label: 'Imagens' },
		{ num: 2 as const, label: 'Produto' },
		{ num: 3 as const, label: 'Laser' },
		{ num: 4 as const, label: 'Gerar' },
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
										? 'bg-violet-700 text-white'
										: active
											? 'bg-violet-700 text-white ring-4 ring-violet-600/20'
											: 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-gray-400'
								}`}
							>
								{done ? <Check className="w-5 h-5" /> : step.num}
							</div>
							<span
								className={`mt-2 text-xs font-medium hidden sm:block ${
									active
										? 'text-violet-700 dark:text-violet-400'
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
										? 'bg-violet-700'
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

/* ─────────────── Image Upload Zone ─────────────── */

function ImageUploadZone({
	label,
	required,
	preview,
	onSelect,
	onUrlPaste,
}: {
	label: string;
	required?: boolean;
	preview: string | null;
	onSelect: (file: File) => void;
	onUrlPaste: (url: string) => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [showUrlInput, setShowUrlInput] = useState(false);
	const [urlValue, setUrlValue] = useState('');

	const handleFile = useCallback(
		(file: File) => {
			if (!ACCEPTED_TYPES.includes(file.type)) {
				toast.error('Formato nao suportado. Use PNG, JPG ou WEBP.');
				return;
			}
			if (file.size > MAX_FILE_SIZE) {
				toast.error('Ficheiro demasiado grande (max. 10MB).');
				return;
			}
			onSelect(file);
		},
		[onSelect],
	);

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<span className="text-sm font-medium text-slate-700 dark:text-slate-300">
					{label}
				</span>
				{required && <span className="text-red-500 text-xs">*</span>}
			</div>

			{preview ? (
				<div className="relative rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden">
					<img
						src={preview}
						alt={label}
						className="w-full h-40 object-contain bg-slate-50 dark:bg-[#1a1a1d]"
					/>
					<button
						type="button"
						onClick={() => {
							onUrlPaste('');
							if (inputRef.current) {
								inputRef.current.value = '';
							}
						}}
						className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-black/60 rounded-lg hover:bg-white dark:hover:bg-black/80 transition-colors"
					>
						<RotateCcw className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
					</button>
				</div>
			) : (
				<div
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
					}}
					onDrop={(e) => {
						e.preventDefault();
						setIsDragging(false);
						const f = e.dataTransfer.files[0];
						if (f) handleFile(f);
					}}
					onDragOver={(e) => {
						e.preventDefault();
						setIsDragging(true);
					}}
					onDragLeave={(e) => {
						e.preventDefault();
						setIsDragging(false);
					}}
					onClick={() => inputRef.current?.click()}
					className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 cursor-pointer transition-colors ${
						isDragging
							? 'border-violet-600 bg-violet-500/10'
							: 'border-slate-200 dark:border-white/10 hover:border-violet-500/50'
					}`}
				>
					<input
						ref={inputRef}
						type="file"
						accept={ACCEPTED_TYPES.join(',')}
						onChange={(e) => {
							const f = e.target.files?.[0];
							if (f) handleFile(f);
							e.target.value = '';
						}}
						className="hidden"
					/>
					<Upload className="w-6 h-6 text-slate-400 mb-2" />
					<p className="text-xs text-slate-500 text-center">
						Arraste ou clique
					</p>
				</div>
			)}

			{!preview && (
				<div>
					<button
						type="button"
						onClick={() => setShowUrlInput(!showUrlInput)}
						className="text-xs text-violet-600 hover:text-violet-400"
					>
						{showUrlInput ? 'Fechar' : 'Ou cole uma URL'}
					</button>
					{showUrlInput && (
						<div className="flex gap-2 mt-1">
							<input
								type="url"
								placeholder="https://..."
								value={urlValue}
								onChange={(e) => setUrlValue(e.target.value)}
								className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
							/>
							<button
								type="button"
								onClick={() => {
									if (urlValue.trim()) {
										onUrlPaste(urlValue.trim());
										setUrlValue('');
										setShowUrlInput(false);
									}
								}}
								className="px-3 py-1.5 text-xs bg-violet-700 text-white rounded-lg hover:bg-violet-600"
							>
								OK
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

/* ─────────────── Collapsible Section ─────────────── */

function CollapsibleSection({
	title,
	defaultOpen,
	children,
}: {
	title: string;
	defaultOpen?: boolean;
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(defaultOpen ?? false);

	return (
		<div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="w-full flex items-center justify-between p-4 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
			>
				{title}
				{open ? (
					<ChevronUp className="w-4 h-4" />
				) : (
					<ChevronDown className="w-4 h-4" />
				)}
			</button>
			{open && <div className="p-4 pt-0 space-y-4">{children}</div>}
		</div>
	);
}

/* ─────────────── History Card ─────────────── */

function HistoryCard({
	previa,
	onEdit,
	onDelete,
}: {
	previa: Previa;
	onEdit: (id: string, name: string, notes: string) => void;
	onDelete: (id: string) => void;
}) {
	const [editing, setEditing] = useState(false);
	const [editName, setEditName] = useState(previa.name);
	const [editNotes, setEditNotes] = useState(previa.notes ?? '');

	return (
		<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden group">
			<div className="aspect-[4/3] bg-slate-100 dark:bg-[#1a1a1d] flex items-center justify-center overflow-hidden">
				{previa.previewUrl ? (
					<img
						src={previa.previewUrl}
						alt={previa.name}
						className="w-full h-full object-cover"
					/>
				) : (
					<Eye className="w-10 h-10 text-slate-300 dark:text-slate-600" />
				)}
			</div>
			<div className="p-3">
				{editing ? (
					<div className="space-y-2">
						<input
							type="text"
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
							className="w-full px-2 py-1 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
						/>
						<textarea
							value={editNotes}
							onChange={(e) => setEditNotes(e.target.value)}
							rows={2}
							placeholder="Notas..."
							className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
						/>
						<div className="flex gap-1">
							<button
								type="button"
								onClick={() => {
									onEdit(previa.id, editName, editNotes);
									setEditing(false);
								}}
								className="flex-1 text-xs py-1 bg-violet-700 text-white rounded-lg hover:bg-violet-600"
							>
								Salvar
							</button>
							<button
								type="button"
								onClick={() => setEditing(false)}
								className="flex-1 text-xs py-1 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5"
							>
								Cancelar
							</button>
						</div>
					</div>
				) : (
					<>
						<h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
							{previa.name || previa.productName}
						</h4>
						<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
							{previa.productName} &middot;{' '}
							{new Date(previa.createdAt).toLocaleDateString('pt-BR')}
						</p>
						{previa.notes && (
							<p className="text-xs text-slate-400 dark:text-gray-500 mt-1 line-clamp-2">
								{previa.notes}
							</p>
						)}
						<div className="flex gap-1 mt-2">
							<button
								type="button"
								onClick={() => setEditing(true)}
								className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
							>
								<Pencil className="w-3 h-3" />
								Editar
							</button>
							{previa.previewUrl && (
								<button
									type="button"
									onClick={() =>
										downloadUrl(
											previa.previewUrl,
											`${previa.name || 'previa'}.png`,
										)
									}
									className="p-1.5 text-slate-500 dark:text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-lg transition-colors"
									title="Download"
								>
									<Download className="w-3.5 h-3.5" />
								</button>
							)}
							<button
								type="button"
								onClick={() => onDelete(previa.id)}
								className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
							>
								<Trash2 className="w-3.5 h-3.5" />
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

/* ─────────────── Pagination ─────────────── */

function Pagination({
	page,
	total,
	limit,
	onPageChange,
}: {
	page: number;
	total: number;
	limit: number;
	onPageChange: (p: number) => void;
}) {
	const totalPages = Math.max(1, Math.ceil(total / limit));
	if (totalPages <= 1) return null;

	return (
		<div className="flex items-center justify-center gap-2 mt-6">
			<button
				type="button"
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
				className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
			>
				<ChevronLeft className="w-4 h-4" />
			</button>
			<span className="text-sm text-slate-500 dark:text-gray-400">
				{page} / {totalPages}
			</span>
			<button
				type="button"
				disabled={page >= totalPages}
				onClick={() => onPageChange(page + 1)}
				className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
			>
				<ChevronRight className="w-4 h-4" />
			</button>
		</div>
	);
}

/* ─────────────── Quota Banner ─────────────── */

function QuotaBanner({
	quota,
	isLoading,
}: {
	quota?: PreviasQuota;
	isLoading: boolean;
}) {
	if (isLoading || !quota) return null;

	const pct = quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0;
	const isLow = quota.remaining > 0 && quota.remaining <= 2;
	const isAtLimit = quota.remaining <= 0;

	const resetTime = new Date(quota.resetsAt).toLocaleTimeString('pt-PT', {
		hour: '2-digit',
		minute: '2-digit',
	});

	let barColor = 'bg-violet-600';
	let borderColor = 'border-violet-200 dark:border-violet-800/40';
	let bgColor = 'bg-violet-50 dark:bg-violet-950/20';
	if (isAtLimit) {
		barColor = 'bg-red-600';
		borderColor = 'border-red-300 dark:border-red-800/50';
		bgColor = 'bg-red-50 dark:bg-red-950/20';
	} else if (isLow) {
		barColor = 'bg-violet-600';
		borderColor = 'border-violet-200 dark:border-violet-800/40';
		bgColor = 'bg-violet-50 dark:bg-violet-950/20';
	}

	return (
		<div className={`rounded-xl border ${borderColor} ${bgColor} p-4 mb-8`}>
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
					{isAtLimit ? (
						<AlertTriangle className="w-4 h-4 text-red-500" />
					) : (
						<Zap className="w-4 h-4 text-violet-600" />
					)}
					{isAtLimit
						? 'Limite diario atingido'
						: `${quota.remaining} de ${quota.limit} previas restantes hoje`}
				</div>
				<span className="text-xs text-slate-500 dark:text-gray-400">
					Renova as {resetTime}
				</span>
			</div>
			<div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
				<div
					className={`h-full rounded-full transition-all ${barColor}`}
					style={{ width: `${Math.min(pct, 100)}%` }}
				/>
			</div>
		</div>
	);
}

/* ─────────────── Main View ─────────────── */

export function PreviasView() {
	const [step, setStep] = useState<WizardStep>(1);

	// Step 1: Images
	const [imageBase, setImageBase] = useState<string | null>(null);
	const [imageProduct, setImageProduct] = useState<string | null>(null);
	const [imageLogo, setImageLogo] = useState<string | null>(null);

	// Step 2: Product info
	const [productName, setProductName] = useState('');
	const [productColor, setProductColor] = useState('');
	const [personalizationType, setPersonalizationType] =
		useState<PersonalizationType>('logo');
	const [customName, setCustomName] = useState('');
	const [modoLentes, setModoLentes] = useState(false);
	const [textoLenteDireita, setTextoLenteDireita] = useState('');
	const [textoLenteEsquerda, setTextoLenteEsquerda] = useState('');
	const [instrucoesPersonalizadas, setInstrucoesPersonalizadas] = useState('');

	// Step 3: Laser settings
	const [laserSettings, setLaserSettings] = useState<LaserSettings>(
		DEFAULT_LASER_SETTINGS,
	);

	// Step 4: Result
	const [generatedPrevia, setGeneratedPrevia] = useState<{
		previewUrl: string;
	} | null>(null);

	// History
	const [histPage, setHistPage] = useState(1);
	const histLimit = 12;

	const generateMutation = useGeneratePrevia();
	const { data: quota, isLoading: quotaLoading } = usePreviasQuota();
	const isAtLimit = quota ? quota.remaining <= 0 : false;
	const { data: historyData, isLoading: histLoading } = usePreviasHistory(
		histPage,
		histLimit,
	);
	const updateMutation = useUpdatePrevia();
	const deleteMutation = useDeletePrevia();

	const handleImageFile = useCallback(
		async (setter: (url: string | null) => void, file: File) => {
			const compressed = await compressImage(file);
			setter(compressed);
		},
		[],
	);

	const handleGenerate = useCallback(async () => {
		if (isAtLimit) {
			toast.error('Limite diario de previas atingido. Tente novamente amanha.');
			return;
		}
		if (!imageBase || !imageProduct) {
			toast.error('Imagem base e do produto sao obrigatorias.');
			return;
		}
		if (!productName.trim()) {
			toast.error('Nome do produto e obrigatorio.');
			return;
		}

		const payload: GeneratePreviaPayload = {
			imagebase_url: imageBase,
			imageproduct_url: imageProduct,
			imagelogo_url: imageLogo || undefined,
			productName: productName.trim(),
			productColor: productColor.trim() || undefined,
			personalizationType,
			customName: customName.trim() || undefined,
			instrucoesPersonalizadas: instrucoesPersonalizadas.trim() || undefined,
			modoLentes,
			textoLenteDireita: textoLenteDireita.trim() || undefined,
			textoLenteEsquerda: textoLenteEsquerda.trim() || undefined,
			laserSettings,
		};

		try {
			const result = await generateMutation.mutateAsync(payload);
			setGeneratedPrevia({ previewUrl: result.previewUrl });
			if (quota && quota.remaining <= 3) {
				toast.warning(
					`Atencao! Restam ${Math.max(0, quota.remaining - 1)} previas hoje.`,
					{ duration: 5000 },
				);
			}
		} catch {
			// toast handled by mutation
		}
	}, [
		isAtLimit,
		imageBase,
		imageProduct,
		imageLogo,
		productName,
		productColor,
		personalizationType,
		customName,
		instrucoesPersonalizadas,
		modoLentes,
		textoLenteDireita,
		textoLenteEsquerda,
		laserSettings,
		generateMutation,
		quota,
	]);

	const handleReset = useCallback(() => {
		setStep(1);
		setImageBase(null);
		setImageProduct(null);
		setImageLogo(null);
		setProductName('');
		setProductColor('');
		setPersonalizationType('logo');
		setCustomName('');
		setModoLentes(false);
		setTextoLenteDireita('');
		setTextoLenteEsquerda('');
		setInstrucoesPersonalizadas('');
		setLaserSettings(DEFAULT_LASER_SETTINGS);
		setGeneratedPrevia(null);
	}, []);

	const updateLS = useCallback(
		(key: keyof LaserSettings, value: LaserSettings[keyof LaserSettings]) => {
			setLaserSettings((prev) => ({ ...prev, [key]: value }));
		},
		[],
	);

	const canProceedStep1 = !!imageBase && !!imageProduct;
	const canProceedStep2 = !!productName.trim();

	return (
		<div className="p-4 md:p-8">
			<PageHeader
				title="Previas IA"
				subtitle="Gere previas realistas de personalizacao a laser com IA."
				icon={Eye}
			/>

			{/* Quota Banner */}
			<QuotaBanner quota={quota} isLoading={quotaLoading} />

			{/* Wizard card */}
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-6 mb-8">
				<StepIndicator current={step} />

				{/* Step 1: Images */}
				{step === 1 && (
					<div className="space-y-6">
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<ImageUploadZone
								label="Imagem Base"
								required
								preview={imageBase}
								onSelect={(f) => handleImageFile(setImageBase, f)}
								onUrlPaste={(url) => setImageBase(url || null)}
							/>
							<ImageUploadZone
								label="Imagem do Produto"
								required
								preview={imageProduct}
								onSelect={(f) => handleImageFile(setImageProduct, f)}
								onUrlPaste={(url) => setImageProduct(url || null)}
							/>
							<ImageUploadZone
								label="Logo (opcional)"
								preview={imageLogo}
								onSelect={(f) => handleImageFile(setImageLogo, f)}
								onUrlPaste={(url) => setImageLogo(url || null)}
							/>
						</div>
						<div className="flex justify-end">
							<button
								type="button"
								disabled={!canProceedStep1}
								onClick={() => setStep(2)}
								className="flex items-center gap-2 px-6 py-3 bg-violet-700 hover:bg-violet-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-40"
							>
								Continuar
								<ArrowRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				)}

				{/* Step 2: Product Info */}
				{step === 2 && (
					<div className="space-y-6">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
									Nome do Produto *
								</span>
								<input
									type="text"
									value={productName}
									onChange={(e) => setProductName(e.target.value)}
									placeholder="Ex: Oculos Ray-Ban Aviator"
									className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
								/>
							</div>
							<div>
								<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
									Cor do Produto
								</span>
								<input
									type="text"
									value={productColor}
									onChange={(e) => setProductColor(e.target.value)}
									placeholder="Ex: Preto, Dourado"
									className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
								/>
							</div>
						</div>

						{/* Personalization Type */}
						<div>
							<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
								Tipo de Personalizacao
							</span>
							<div className="flex flex-wrap gap-3">
								{[
									{ key: 'logo' as const, label: 'Apenas Logo' },
									{ key: 'text' as const, label: 'Apenas Texto' },
									{ key: 'both' as const, label: 'Logo + Texto' },
								].map((opt) => (
									<button
										key={opt.key}
										type="button"
										onClick={() => setPersonalizationType(opt.key)}
										className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
											personalizationType === opt.key
												? 'bg-violet-700 text-white'
												: 'bg-slate-100 dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
										}`}
									>
										{opt.label}
									</button>
								))}
							</div>
						</div>

						{/* Custom Name (if text or both) */}
						{(personalizationType === 'text' ||
							personalizationType === 'both') && (
							<div>
								<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
									Nome Personalizado
								</span>
								<input
									type="text"
									value={customName}
									onChange={(e) => setCustomName(e.target.value)}
									placeholder="Nome que sera gravado"
									className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
								/>
							</div>
						)}

						{/* Modo Lentes */}
						<div className="flex items-center gap-3">
							<button
								type="button"
								role="switch"
								aria-checked={modoLentes}
								onClick={() => setModoLentes(!modoLentes)}
								className={`relative w-11 h-6 rounded-full transition-colors ${
									modoLentes ? 'bg-violet-700' : 'bg-slate-300 dark:bg-white/20'
								}`}
							>
								<span
									className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
										modoLentes ? 'translate-x-5' : 'translate-x-0'
									}`}
								/>
							</button>
							<span className="text-sm text-slate-700 dark:text-slate-300">
								Modo Lentes
							</span>
						</div>

						{modoLentes && (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
										Texto Lente Direita
									</span>
									<input
										type="text"
										value={textoLenteDireita}
										onChange={(e) => setTextoLenteDireita(e.target.value)}
										className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									/>
								</div>
								<div>
									<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
										Texto Lente Esquerda
									</span>
									<input
										type="text"
										value={textoLenteEsquerda}
										onChange={(e) => setTextoLenteEsquerda(e.target.value)}
										className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									/>
								</div>
							</div>
						)}

						{/* Instrucoes personalizadas */}
						<div>
							<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
								Instrucoes Personalizadas (opcional)
							</span>
							<textarea
								value={instrucoesPersonalizadas}
								onChange={(e) => setInstrucoesPersonalizadas(e.target.value)}
								rows={3}
								placeholder="Ex: Gravar no canto superior direito com angulo de 45 graus..."
								className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
							/>
						</div>

						<div className="flex justify-between">
							<button
								type="button"
								onClick={() => setStep(1)}
								className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
							>
								<ArrowLeft className="w-4 h-4" />
								Voltar
							</button>
							<button
								type="button"
								disabled={!canProceedStep2}
								onClick={() => setStep(3)}
								className="flex items-center gap-2 px-6 py-3 bg-violet-700 hover:bg-violet-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-40"
							>
								Continuar
								<ArrowRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				)}

				{/* Step 3: Laser Settings */}
				{step === 3 && (
					<div className="space-y-4">
						<CollapsibleSection title="Tamanho e Posicao" defaultOpen>
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Tamanho
									</span>
									<select
										value={laserSettings.tamanho}
										onChange={(e) => updateLS('tamanho', e.target.value)}
										className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									>
										<option value="pequeno">Pequeno</option>
										<option value="medio">Medio</option>
										<option value="grande">Grande</option>
										<option value="custom">Custom</option>
									</select>
								</div>
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Posicao
									</span>
									<select
										value={laserSettings.posicao}
										onChange={(e) => updateLS('posicao', e.target.value)}
										className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									>
										<option value="central">Central</option>
										<option value="superior">Superior</option>
										<option value="inferior">Inferior</option>
										<option value="lateral">Lateral</option>
									</select>
								</div>
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Rotacao
									</span>
									<input
										type="number"
										value={laserSettings.rotacao}
										onChange={(e) =>
											updateLS('rotacao', Number(e.target.value))
										}
										min={-360}
										max={360}
										className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									/>
								</div>
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Moldura
									</span>
									<select
										value={laserSettings.moldura}
										onChange={(e) => updateLS('moldura', e.target.value)}
										className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									>
										<option value="nenhuma">Nenhuma</option>
										<option value="simples">Simples</option>
										<option value="dupla">Dupla</option>
										<option value="ornamental">Ornamental</option>
										<option value="arredondada">Arredondada</option>
									</select>
								</div>
							</div>
						</CollapsibleSection>

						<CollapsibleSection title="Estilo e Material">
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Material
									</span>
									<input
										type="text"
										value={laserSettings.material}
										onChange={(e) => updateLS('material', e.target.value)}
										className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									/>
								</div>
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Estilo Gravacao
									</span>
									<select
										value={laserSettings.estiloGravacao}
										onChange={(e) => updateLS('estiloGravacao', e.target.value)}
										className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									>
										<option value="clean">Clean</option>
										<option value="vintage">Vintage</option>
										<option value="elegante">Elegante</option>
										<option value="industrial">Industrial</option>
										<option value="futurista">Futurista</option>
									</select>
								</div>
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Acabamento
									</span>
									<select
										value={laserSettings.acabamentoSuperficie}
										onChange={(e) =>
											updateLS('acabamentoSuperficie', e.target.value)
										}
										className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									>
										<option value="fosco">Fosco</option>
										<option value="brilhante">Brilhante</option>
										<option value="escovado">Escovado</option>
									</select>
								</div>
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Intensidade
									</span>
									<select
										value={laserSettings.intensidade}
										onChange={(e) => updateLS('intensidade', e.target.value)}
										className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									>
										<option value="baixa">Baixa</option>
										<option value="media">Media</option>
										<option value="alta">Alta</option>
										<option value="maxima">Maxima</option>
									</select>
								</div>
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Profundidade
									</span>
									<select
										value={laserSettings.profundidade}
										onChange={(e) => updateLS('profundidade', e.target.value)}
										className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									>
										<option value="superficial">Superficial</option>
										<option value="media">Media</option>
										<option value="profunda">Profunda</option>
									</select>
								</div>
							</div>
						</CollapsibleSection>

						<CollapsibleSection title="Nome e Fonte">
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Com Nome
									</span>
									<select
										value={laserSettings.comNome}
										onChange={(e) => updateLS('comNome', e.target.value)}
										className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									>
										<option value="com">Com</option>
										<option value="sem">Sem</option>
									</select>
								</div>
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Fonte
									</span>
									<input
										type="text"
										value={laserSettings.fonteFamilia}
										onChange={(e) => updateLS('fonteFamilia', e.target.value)}
										className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									/>
								</div>
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Tamanho Nome
									</span>
									<select
										value={laserSettings.tamanhoNome}
										onChange={(e) => updateLS('tamanhoNome', e.target.value)}
										className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									>
										<option value="pequeno">Pequeno</option>
										<option value="medio">Medio</option>
										<option value="grande">Grande</option>
									</select>
								</div>
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Orientacao Logo
									</span>
									<select
										value={laserSettings.orientacaoLogo}
										onChange={(e) => updateLS('orientacaoLogo', e.target.value)}
										className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									>
										<option value="horizontal">Horizontal</option>
										<option value="vertical">Vertical</option>
									</select>
								</div>
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Orientacao Nome
									</span>
									<select
										value={laserSettings.orientacaoNome}
										onChange={(e) => updateLS('orientacaoNome', e.target.value)}
										className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									>
										<option value="horizontal">Horizontal</option>
										<option value="vertical">Vertical</option>
									</select>
								</div>
							</div>
						</CollapsibleSection>

						<CollapsibleSection title="Efeitos">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Contraste: {laserSettings.contraste}%
									</span>
									<input
										type="range"
										min={0}
										max={100}
										value={laserSettings.contraste}
										onChange={(e) =>
											updateLS('contraste', Number(e.target.value))
										}
										className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-white/10 accent-violet-700"
									/>
								</div>
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Sombra: {laserSettings.efeitoSombra}%
									</span>
									<input
										type="range"
										min={0}
										max={100}
										value={laserSettings.efeitoSombra}
										onChange={(e) =>
											updateLS('efeitoSombra', Number(e.target.value))
										}
										className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-white/10 accent-violet-700"
									/>
								</div>
							</div>
						</CollapsibleSection>

						<CollapsibleSection title="Visualizacao e Camera">
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Visualizacao
									</span>
									<input
										type="text"
										value={laserSettings.tipoVisualizacao}
										onChange={(e) =>
											updateLS('tipoVisualizacao', e.target.value)
										}
										className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									/>
								</div>
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Angulo Camera
									</span>
									<input
										type="text"
										value={laserSettings.anguloCamera}
										onChange={(e) => updateLS('anguloCamera', e.target.value)}
										className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									/>
								</div>
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Iluminacao
									</span>
									<input
										type="text"
										value={laserSettings.iluminacao}
										onChange={(e) => updateLS('iluminacao', e.target.value)}
										className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									/>
								</div>
								<div>
									<span className="block text-xs text-slate-500 mb-1">
										Fundo Cena
									</span>
									<input
										type="text"
										value={laserSettings.fundoCena}
										onChange={(e) => updateLS('fundoCena', e.target.value)}
										className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									/>
								</div>
							</div>
						</CollapsibleSection>

						<div className="flex justify-between pt-2">
							<button
								type="button"
								onClick={() => setStep(2)}
								className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
							>
								<ArrowLeft className="w-4 h-4" />
								Voltar
							</button>
							<button
								type="button"
								onClick={() => setStep(4)}
								className="flex items-center gap-2 px-6 py-3 bg-violet-700 hover:bg-violet-600 text-white font-semibold rounded-xl transition-colors"
							>
								Revisar e Gerar
								<ArrowRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				)}

				{/* Step 4: Review & Generate */}
				{step === 4 && (
					<div className="space-y-6">
						{/* Summary */}
						<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1a1a1d] p-5 space-y-3">
							<h4 className="font-semibold text-slate-900 dark:text-white">
								Resumo
							</h4>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
								<div>
									<span className="text-slate-500 dark:text-gray-400 text-xs">
										Produto
									</span>
									<p className="text-slate-900 dark:text-white font-medium">
										{productName}
									</p>
								</div>
								{productColor && (
									<div>
										<span className="text-slate-500 dark:text-gray-400 text-xs">
											Cor
										</span>
										<p className="text-slate-900 dark:text-white font-medium">
											{productColor}
										</p>
									</div>
								)}
								<div>
									<span className="text-slate-500 dark:text-gray-400 text-xs">
										Tipo
									</span>
									<p className="text-slate-900 dark:text-white font-medium capitalize">
										{personalizationType}
									</p>
								</div>
								<div>
									<span className="text-slate-500 dark:text-gray-400 text-xs">
										Estilo
									</span>
									<p className="text-slate-900 dark:text-white font-medium capitalize">
										{laserSettings.estiloGravacao}
									</p>
								</div>
								<div>
									<span className="text-slate-500 dark:text-gray-400 text-xs">
										Material
									</span>
									<p className="text-slate-900 dark:text-white font-medium capitalize">
										{laserSettings.material}
									</p>
								</div>
								<div>
									<span className="text-slate-500 dark:text-gray-400 text-xs">
										Tamanho
									</span>
									<p className="text-slate-900 dark:text-white font-medium capitalize">
										{laserSettings.tamanho}
									</p>
								</div>
							</div>
							{/* Image previews */}
							<div className="flex gap-3 mt-3">
								{imageBase && (
									<img
										src={imageBase}
										alt="Base"
										className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-white/10"
									/>
								)}
								{imageProduct && (
									<img
										src={imageProduct}
										alt="Produto"
										className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-white/10"
									/>
								)}
								{imageLogo && (
									<img
										src={imageLogo}
										alt="Logo"
										className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-white/10"
									/>
								)}
							</div>
						</div>

						{/* Generated result */}
						{generatedPrevia && (
							<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-4">
								<p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">
									Resultado
								</p>
								<div className="aspect-[4/3] bg-slate-100 dark:bg-[#1a1a1d] rounded-lg flex items-center justify-center overflow-hidden">
									<img
										src={generatedPrevia.previewUrl}
										alt="Previa gerada"
										className="max-w-full max-h-full object-contain"
									/>
								</div>
								<button
									type="button"
									onClick={() =>
										downloadUrl(generatedPrevia.previewUrl, 'previa.png')
									}
									className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-700 hover:bg-violet-600 text-white font-medium rounded-xl transition-colors text-sm"
								>
									<Download className="w-4 h-4" />
									Download
								</button>
							</div>
						)}

						{/* Loading state */}
						{generateMutation.isPending && (
							<div className="flex flex-col items-center gap-3 py-8">
								<Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
								<p className="text-sm text-slate-500 font-medium">
									Gerando previa com IA...
								</p>
							</div>
						)}

						{/* Action buttons */}
						<div className="flex flex-wrap gap-3">
							<button
								type="button"
								onClick={() => setStep(3)}
								className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
							>
								<ArrowLeft className="w-4 h-4" />
								Voltar
							</button>
							<button
								type="button"
								disabled={generateMutation.isPending || isAtLimit}
								onClick={handleGenerate}
								className="flex items-center gap-2 px-6 py-3 bg-violet-700 hover:bg-violet-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
							>
								{generateMutation.isPending ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Eye className="w-4 h-4" />
								)}
								{isAtLimit
									? 'Limite Atingido'
									: generatedPrevia
										? 'Gerar Novamente'
										: 'Gerar Previa'}
							</button>
							{generatedPrevia && (
								<button
									type="button"
									onClick={handleReset}
									className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
								>
									<RotateCcw className="w-4 h-4" />
									Nova Previa
								</button>
							)}
						</div>
					</div>
				)}
			</div>

			{/* History Section */}
			<div id="previas-historico">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
					<Image className="w-5 h-5 text-violet-600" />
					Historico de Previas
				</h3>

				{histLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
					</div>
				) : !historyData?.data.length ? (
					<div className="text-center py-12 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl">
						<Eye className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
						<p className="text-slate-500 dark:text-gray-400 font-medium">
							Nenhuma previa gerada ainda
						</p>
						<p className="text-sm text-slate-400 dark:text-gray-500 mt-1">
							Use o wizard acima para gerar sua primeira previa.
						</p>
					</div>
				) : (
					<>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
							{historyData.data.map((previa) => (
								<HistoryCard
									key={previa.id}
									previa={previa}
									onEdit={(id, name, notes) =>
										updateMutation.mutate({
											id,
											payload: { name, notes },
										})
									}
									onDelete={(id) => deleteMutation.mutate(id)}
								/>
							))}
						</div>
						<Pagination
							page={histPage}
							total={historyData.total}
							limit={histLimit}
							onPageChange={setHistPage}
						/>
					</>
				)}
			</div>
		</div>
	);
}
