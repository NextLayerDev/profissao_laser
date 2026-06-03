'use client';

import {
	ArrowLeft,
	ArrowRight,
	Camera,
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	Download,
	Eye,
	Image,
	Loader2,
	Package,
	Palette,
	Pencil,
	RotateCcw,
	Ruler,
	Search,
	Sparkles,
	Stamp,
	Trash2,
	Type,
	Upload,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { MyMachineSection } from '@/components/previas/my-machine-section';
import { PreviaBackgroundPicker } from '@/components/previas/previa-background-picker';
import { PageHeader } from '@/components/ui/page-header';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useLaserProduct, useLaserProducts } from '@/hooks/use-laser-products';
import {
	useDeletePrevia,
	useDeleteWatermark,
	useGeneratePrevia,
	usePreviaOptions,
	usePreviasHistory,
	useUpdatePrevia,
	useUploadWatermark,
	useWatermark,
} from '@/hooks/use-previas';
import { useToolBilling } from '@/modules/tools/hooks/use-tool-billing';
import type {
	GeneratePreviaPayload,
	LaserSettings,
	PersonalizationType,
	Previa,
	PreviaFontOption,
	PreviaOptionItem,
	PreviaOptions,
} from '@/types/previas';
import {
	finishForMaterial,
	pickValidPreset,
	smartPresetFor,
	suggestedBackgrounds,
} from '@/utils/constants/previa-smart-presets';

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
	fonteFamilia: 'arial',
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
	tipoVisualizacao: 'angulo-3d',
	anguloCamera: 'frontal',
	iluminacao: 'studio-softbox',
	fundoCena: 'mesa-ambiente',
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

/* ─────────────── Google Fonts Loader ─────────────── */

const loadedFonts = new Set<string>();

function loadGoogleFont(family: string) {
	if (loadedFonts.has(family)) return;
	loadedFonts.add(family);
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`;
	document.head.appendChild(link);
}

/* ─────────────── Dynamic Select ─────────────── */

function DynamicSelect({
	label,
	value,
	options,
	onChange,
	highlight = false,
}: {
	label: string;
	value: string;
	options: PreviaOptionItem[];
	onChange: (v: string) => void;
	highlight?: boolean;
}) {
	return (
		<div>
			<span
				className={`block text-xs mb-1 ${
					highlight
						? 'text-violet-600 dark:text-violet-300 font-semibold'
						: 'text-slate-500 dark:text-gray-400'
				}`}
			>
				{label}
			</span>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 ${
					highlight
						? 'border-violet-400 dark:border-violet-500/50 ring-2 ring-violet-500/20 bg-violet-50/50 dark:bg-violet-500/10'
						: 'border-slate-200 dark:border-white/10'
				}`}
			>
				{options.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
		</div>
	);
}

/* ─────────────── Toggle Button Group ─────────────── */

function ToggleButtonGroup({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: string;
	options: PreviaOptionItem[];
	onChange: (v: string) => void;
}) {
	return (
		<div>
			<span className="block text-xs text-slate-500 dark:text-gray-400 mb-1">
				{label}
			</span>
			<div className="flex gap-1">
				{options.map((opt) => (
					<button
						key={opt.value}
						type="button"
						onClick={() => onChange(opt.value)}
						className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
							value === opt.value
								? 'bg-violet-700 text-white'
								: 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
						}`}
					>
						{opt.label}
					</button>
				))}
			</div>
		</div>
	);
}

/* ─────────────── Font Selector ─────────────── */

function FontSelector({
	value,
	fonts,
	onChange,
}: {
	value: string;
	fonts: PreviaFontOption[];
	onChange: (v: string) => void;
}) {
	const grouped = useMemo(() => {
		const map = new Map<string, PreviaFontOption[]>();
		for (const f of fonts) {
			const list = map.get(f.category) ?? [];
			list.push(f);
			map.set(f.category, list);
		}
		return map;
	}, [fonts]);

	const selectedFont = fonts.find((f) => f.value === value);

	useEffect(() => {
		if (selectedFont) loadGoogleFont(selectedFont.family);
	}, [selectedFont]);

	return (
		<div className="col-span-2 sm:col-span-3">
			<span className="block text-xs text-slate-500 dark:text-gray-400 mb-1">
				Fonte
			</span>
			<select
				value={value}
				onChange={(e) => {
					const font = fonts.find((f) => f.value === e.target.value);
					if (font) loadGoogleFont(font.family);
					onChange(e.target.value);
				}}
				className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
			>
				{Array.from(grouped.entries()).map(([category, catFonts]) => (
					<optgroup key={category} label={category}>
						{catFonts.map((f) => (
							<option key={f.value} value={f.value}>
								{f.label}
							</option>
						))}
					</optgroup>
				))}
			</select>
			{selectedFont && (
				<div
					className="mt-2 p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-lg text-slate-900 dark:text-white"
					style={{ fontFamily: `'${selectedFont.family}', sans-serif` }}
				>
					Profissao Laser — Abc 123
				</div>
			)}
		</div>
	);
}

/* ─────────────── Step Indicator ─────────────── */

function StepIndicator({ current }: { current: WizardStep }) {
	const steps = [
		{ num: 1 as const, label: 'Produto' },
		{ num: 2 as const, label: 'Personalizacao' },
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

/* ─────────────── Product Selector (Step 1) ─────────────── */

function ProductSelector({
	selectedProductId,
	selectedVariantId,
	onSelectProduct,
	onSelectVariant,
}: {
	selectedProductId: string | null;
	selectedVariantId: string | null;
	onSelectProduct: (id: string) => void;
	onSelectVariant: (id: string) => void;
}) {
	const [searchQuery, setSearchQuery] = useState('');
	const [variantSearch, setVariantSearch] = useState('');
	const { data: productsData, isLoading } = useLaserProducts({
		search: searchQuery.trim() || undefined,
		limit: 50,
	});
	const { data: selectedProduct } = useLaserProduct(
		selectedProductId,
		!!selectedProductId,
	);

	const products = productsData?.data ?? [];

	// If a product is selected, show variant selection
	if (selectedProductId && selectedProduct) {
		const variants = (selectedProduct.variants ?? []).filter(
			(v) => v.status === 'ativo',
		);
		const vq = variantSearch.trim().toLowerCase();
		const filteredVariants = vq
			? variants.filter((v) =>
					[v.name, v.colorName, v.tipo].some((s) =>
						s?.toLowerCase().includes(vq),
					),
				)
			: variants;

		return (
			<div className="space-y-5">
				{/* Selected product header */}
				<div className="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 rounded-xl">
					<Package className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0" />
					<div className="flex-1 min-w-0">
						<p className="font-semibold text-sm text-violet-700 dark:text-violet-400">
							{selectedProduct.name}
						</p>
						<p className="text-xs text-violet-600/70 dark:text-violet-400/70">
							{selectedProduct.category}
						</p>
					</div>
					<button
						type="button"
						onClick={() => {
							onSelectProduct('');
							onSelectVariant('');
						}}
						className="text-xs text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 font-medium"
					>
						Trocar
					</button>
				</div>

				{/* Variant selection — pesquisa + seleção rápida + grade de imagens */}
				<div>
					<p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
						Escolha a variante (cor/tipo):
					</p>
					{variants.length === 0 ? (
						<p className="text-sm text-slate-500 dark:text-gray-400 py-4 text-center">
							Nenhuma variante disponivel para este produto.
						</p>
					) : (
						<>
							{/* Pesquisa inteligente (esquerda) + seleção rápida por texto (direita) */}
							<div className="flex flex-col sm:flex-row gap-2 mb-3">
								<div className="relative flex-1">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
									<input
										type="text"
										value={variantSearch}
										onChange={(e) => setVariantSearch(e.target.value)}
										placeholder="Pesquisar variante (cor, tipo, nome)..."
										className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
									/>
								</div>
								<div className="relative sm:w-56">
									<select
										value={selectedVariantId ?? ''}
										onChange={(e) => onSelectVariant(e.target.value)}
										className="w-full appearance-none pl-3 pr-9 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
									>
										<option value="">Seleção rápida...</option>
										{variants.map((variant) => (
											<option key={variant.id} value={variant.id}>
												{variant.colorName || variant.tipo
													? `${variant.name} — ${variant.colorName ?? variant.tipo}`
													: variant.name}
											</option>
										))}
									</select>
									<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
								</div>
							</div>

							{filteredVariants.length === 0 ? (
								<p className="text-sm text-slate-500 dark:text-gray-400 py-4 text-center">
									Nenhuma variante encontrada para "{variantSearch}".
								</p>
							) : (
								<div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
									{filteredVariants.map((variant) => (
										<button
											key={variant.id}
											type="button"
											onClick={() => onSelectVariant(variant.id)}
											className={`group flex flex-col rounded-2xl border overflow-hidden text-left transition-all ${
												selectedVariantId === variant.id
													? 'border-violet-500 ring-2 ring-violet-500/40 shadow-lg shadow-violet-500/10'
													: 'border-slate-200 dark:border-white/10 hover:border-violet-500/50 hover:shadow-md'
											}`}
										>
											<div className="relative aspect-square w-full bg-slate-100 dark:bg-white/5">
												{variant.imageUrl &&
												!variant.imageUrl.includes('placeholder') ? (
													<img
														src={variant.imageUrl}
														alt={variant.name}
														className="w-full h-full object-cover"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center">
														<Package className="w-7 h-7 text-slate-400" />
													</div>
												)}
												{selectedVariantId === variant.id && (
													<div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center shadow">
														<Check className="w-4 h-4 text-white" />
													</div>
												)}
											</div>
											<div className="p-2 min-w-0">
												<p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
													{variant.name}
												</p>
												<div className="flex items-center gap-1.5 mt-1">
													{variant.colorHex && (
														<span
															className="w-3 h-3 rounded-full border border-slate-200 dark:border-gray-600 shrink-0"
															style={{
																backgroundColor: variant.colorHex,
															}}
														/>
													)}
													<span className="text-xs text-slate-500 dark:text-gray-400 truncate">
														{variant.colorName ?? variant.tipo ?? ''}
													</span>
												</div>
											</div>
										</button>
									))}
								</div>
							)}
						</>
					)}
				</div>
			</div>
		);
	}

	// Product list
	return (
		<div className="space-y-4">
			<p className="text-sm font-medium text-slate-700 dark:text-slate-300">
				Escolha um produto do catalogo:
			</p>

			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
				<input
					type="text"
					placeholder="Buscar produto..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full pl-9 pr-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:outline-none"
				/>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-8">
					<Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
				</div>
			) : products.length === 0 ? (
				<div className="text-center py-8">
					<Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
					<p className="text-sm text-slate-500">Nenhum produto encontrado</p>
				</div>
			) : (
				<div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
					{products.map((product) => {
						const firstVariant = product.variants?.[0];
						// Prefere a imagem do PRODUTO (parent); cai pra 1ª variant se
						// o produto não tiver imagem própria cadastrada.
						const productImage =
							product.imageUrl && !product.imageUrl.includes('placeholder')
								? product.imageUrl
								: firstVariant?.imageUrl &&
										!firstVariant.imageUrl.includes('placeholder')
									? firstVariant.imageUrl
									: null;
						return (
							<button
								key={product.id}
								type="button"
								onClick={() => onSelectProduct(product.id)}
								className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden text-left hover:border-violet-500/50 transition-colors"
							>
								<div className="aspect-[4/3] bg-slate-100 dark:bg-black/30">
									{productImage ? (
										<img
											src={productImage}
											alt={product.name}
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center">
											<Package className="w-8 h-8 text-slate-300 dark:text-slate-600" />
										</div>
									)}
								</div>
								<div className="p-2">
									<p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
										{product.name}
									</p>
									<p className="text-xs text-slate-500 dark:text-gray-400 capitalize mt-0.5">
										{product.category}
									</p>
								</div>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}

/* ─────────────── Logo Upload Zone ─────────────── */

function LogoUploadZone({
	onSelect,
}: {
	preview?: string | null;
	onSelect: (dataUrl: string | null) => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);

	async function handleFile(file: File) {
		if (!ACCEPTED_TYPES.includes(file.type)) {
			toast.error('Formato nao suportado. Use PNG, JPG ou WEBP.');
			return;
		}
		if (file.size > MAX_FILE_SIZE) {
			toast.error('Ficheiro demasiado grande (max. 10MB).');
			return;
		}
		const compressed = await compressImage(file);
		onSelect(compressed);
	}

	return (
		<div>
			<div
				onClick={() => inputRef.current?.click()}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
				}}
				className="w-28 h-28 rounded-lg border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-violet-500/50 cursor-pointer transition-colors bg-white dark:bg-[#1a1a1d] flex flex-col items-center justify-center shrink-0"
			>
				<Upload className="w-6 h-6 text-slate-400 dark:text-slate-500" />
				<p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">
					Enviar
				</p>
			</div>
			<input
				ref={inputRef}
				type="file"
				accept={ACCEPTED_TYPES.join(',')}
				className="hidden"
				onChange={(e) => {
					const f = e.target.files?.[0];
					if (f) void handleFile(f);
					e.target.value = '';
				}}
			/>
		</div>
	);
}

/* ─────────────── Collapsible Section ─────────────── */

function CollapsibleSection({
	title,
	icon: Icon,
	defaultOpen,
	className,
	children,
}: {
	title: string;
	icon?: React.ComponentType<{ className?: string }>;
	defaultOpen?: boolean;
	className?: string;
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(defaultOpen ?? false);

	return (
		<div
			className={`rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden ${className ?? ''}`}
		>
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="w-full flex items-center justify-between p-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
			>
				<span className="flex items-center gap-2">
					{Icon && <Icon className="w-4 h-4 text-violet-500" />}
					{title}
				</span>
				{open ? (
					<ChevronUp className="w-4 h-4" />
				) : (
					<ChevronDown className="w-4 h-4" />
				)}
			</button>
			{open && <div className="p-3 pt-0 space-y-3">{children}</div>}
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

/* ─────────────── Main View ─────────────── */

export function PreviasView() {
	const [step, setStep] = useState<WizardStep>(1);
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);

	// Options from API
	const { data: options, isLoading: optionsLoading } = usePreviaOptions();

	// Step 1: Product + Variant selection
	const [selectedProductId, setSelectedProductId] = useState<string | null>(
		null,
	);
	const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
		null,
	);
	const [imageLogo, setImageLogo] = useState<string | null>(null);

	// Fetch selected product for summary
	const { data: selectedProduct } = useLaserProduct(
		selectedProductId,
		!!selectedProductId,
	);
	const selectedVariant = selectedProduct?.variants?.find(
		(v) => v.id === selectedVariantId,
	);

	// Step 2: Personalization
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

	// Refs pra centralizar o conteúdo ativo no scroll conforme o step muda
	// ou quando a prévia gerada aparece (o conteúdo cresce/diminui).
	const wizardRef = useRef<HTMLDivElement>(null);
	const previewRef = useRef<HTMLDivElement>(null);

	// History
	const [histPage, setHistPage] = useState(1);
	const histLimit = 12;

	const generateMutation = useGeneratePrevia();
	// Billing opcional: se houver funcionalidade `previa` liberada → cobra; senão livre.
	const { courses } = useEntitlements();
	const courseSlug = courses[0]?.slug;
	const previaBilling = useToolBilling('previa', courseSlug);
	const { data: historyData, isLoading: histLoading } = usePreviasHistory(
		histPage,
		histLimit,
	);
	const updateMutation = useUpdatePrevia();
	const deleteMutation = useDeletePrevia();

	// Watermark
	const { data: watermark } = useWatermark();
	const uploadWatermarkMutation = useUploadWatermark();
	const deleteWatermarkMutation = useDeleteWatermark();
	const [watermarkMode, setWatermarkMode] = useState<
		'none' | 'corners' | 'tiled'
	>('corners');
	const watermarkFileRef = useRef<HTMLInputElement>(null);
	const hasWatermark = !!watermark;
	const useWatermarkFlag = hasWatermark && watermarkMode !== 'none';

	const buildPayload = useCallback((): GeneratePreviaPayload | null => {
		if (!selectedVariantId) return null;
		return {
			productVariantId: selectedVariantId,
			imagelogo_url: imageLogo || undefined,
			personalizationType,
			customName: customName.trim() || undefined,
			instrucoesPersonalizadas: instrucoesPersonalizadas.trim() || undefined,
			modoLentes,
			textoLenteDireita: textoLenteDireita.trim() || undefined,
			textoLenteEsquerda: textoLenteEsquerda.trim() || undefined,
			laserSettings,
			useWatermark: useWatermarkFlag || undefined,
			watermarkMode: useWatermarkFlag ? watermarkMode : undefined,
		};
	}, [
		selectedVariantId,
		imageLogo,
		personalizationType,
		customName,
		instrucoesPersonalizadas,
		modoLentes,
		textoLenteDireita,
		textoLenteEsquerda,
		laserSettings,
		useWatermarkFlag,
		watermarkMode,
	]);

	// Billing opcional: cobra se a ferramenta `previa` tiver funcionalidade; senão
	// roda livre. O invocation_id (quando cobrada) vai no payload pro motor liquidar.
	const handleGenerate = useCallback(async () => {
		const payload = buildPayload();
		if (!payload) {
			toast.error('Selecione um produto e uma variante.');
			return;
		}
		await previaBilling.runEngine((invocationId) =>
			generateMutation
				.mutateAsync({ ...payload, invocation_id: invocationId })
				.then((result) => {
					setGeneratedPrevia({ previewUrl: result.previewUrl });
					return result;
				}),
		);
	}, [buildPayload, generateMutation, previaBilling]);

	const handleReset = useCallback(() => {
		setStep(1);
		setSelectedProductId(null);
		setSelectedVariantId(null);
		setImageLogo(null);
		setPersonalizationType('logo');
		setCustomName('');
		setModoLentes(false);
		setTextoLenteDireita('');
		setTextoLenteEsquerda('');
		setInstrucoesPersonalizadas('');
		setLaserSettings(DEFAULT_LASER_SETTINGS);
		setGeneratedPrevia(null);
		setWatermarkMode('corners');
	}, []);

	// Ao trocar de step, traz o topo do wizard pro topo visível (com folga
	// pro header) — o conteúdo de cada step tem altura bem diferente.
	useEffect(() => {
		// `step` é a dependência real: re-scrolla a cada navegação de step.
		if (!step) return;
		const el = wizardRef.current;
		if (!el) return;
		const id = window.setTimeout(() => {
			const top = el.getBoundingClientRect().top + window.scrollY - 88;
			window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
		}, 60);
		return () => window.clearTimeout(id);
	}, [step]);

	// Quando a prévia é gerada (imagem aparece/muda de tamanho), centraliza o
	// resultado no viewport.
	useEffect(() => {
		if (!generatedPrevia) return;
		const el = previewRef.current;
		if (!el) return;
		const id = window.setTimeout(() => {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}, 80);
		return () => window.clearTimeout(id);
	}, [generatedPrevia]);

	const updateLS = useCallback(
		(key: keyof LaserSettings, value: LaserSettings[keyof LaserSettings]) => {
			setLaserSettings((prev) => ({ ...prev, [key]: value }));
		},
		[],
	);

	// Trocar o Material também ajusta o Acabamento sugerido (clampado às opções).
	const updateMaterial = useCallback(
		(material: string) => {
			const finish = finishForMaterial(material);
			const finishValues =
				options?.acabamentoSuperficie?.map((o) => o.value) ?? [];
			setLaserSettings((prev) => ({
				...prev,
				material,
				...(finish && finishValues.includes(finish)
					? { acabamentoSuperficie: finish }
					: {}),
			}));
		},
		[options],
	);

	// Garante um fundo válido: se o default (mesa-ambiente) ainda não existir nas
	// opções (motor não deployado), cai pro 1º fundo disponível.
	useEffect(() => {
		const fundos = options?.fundoCena;
		if (
			fundos?.length &&
			!fundos.some((o) => o.value === laserSettings.fundoCena)
		) {
			setLaserSettings((prev) => ({ ...prev, fundoCena: fundos[0].value }));
		}
	}, [options, laserSettings.fundoCena]);

	const canProceedStep1 = !!selectedVariantId;

	// Auto-set material from product
	const handleSelectProduct = useCallback((id: string) => {
		setSelectedProductId(id || null);
		setSelectedVariantId(null);
	}, []);

	// Ao escolher a variante, aplica um preset inteligente (material + acabamento)
	// derivado do produto — clampado contra as opções reais de /previas/options.
	const handleSelectVariant = useCallback(
		(id: string) => {
			setSelectedVariantId(id || null);
			if (!selectedProduct) return;
			const valid = pickValidPreset(smartPresetFor(selectedProduct), {
				material: options?.material?.map((m) => m.value) ?? [],
				acabamentoSuperficie:
					options?.acabamentoSuperficie?.map((m) => m.value) ?? [],
			});
			if (Object.keys(valid).length > 0) {
				setLaserSettings((prev) => ({ ...prev, ...valid }));
			}
		},
		[selectedProduct, options],
	);

	// Helper to get range from options or fallback
	const getRange = useCallback(
		(key: string, fallbackMin: number, fallbackMax: number) => {
			if (options?.ranges?.[key]) {
				return options.ranges[key];
			}
			return { min: fallbackMin, max: fallbackMax };
		},
		[options],
	);

	// Helper to get options list or fallback
	const getOptions = useCallback(
		(key: keyof PreviaOptions): PreviaOptionItem[] => {
			if (!options) return [];
			const val = options[key];
			if (Array.isArray(val)) return val as PreviaOptionItem[];
			return [];
		},
		[options],
	);

	return (
		<div className="p-4 md:p-8">
			<PageHeader
				title="Previas IA"
				subtitle="Gere previas realistas de personalizacao a laser com IA."
				icon={Eye}
			/>

			<div className="flex justify-end -mt-2 mb-5">
				<button
					type="button"
					onClick={() =>
						document
							.getElementById('previas-historico')
							?.scrollIntoView({ behavior: 'smooth', block: 'start' })
					}
					className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
				>
					<Image className="w-4 h-4 text-violet-600 dark:text-violet-400" />
					Historico de previas
				</button>
			</div>

			{/* Wizard card */}
			<div
				ref={wizardRef}
				className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-6 mb-8 scroll-mt-24"
			>
				<StepIndicator current={step} />

				{/* Options loading state */}
				{optionsLoading && step === 3 && (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
						<span className="ml-2 text-sm text-slate-500">
							Carregando opcoes...
						</span>
					</div>
				)}

				{/* Step 1: Product + Variant + Logo */}
				{step === 1 && (
					<div className="space-y-6">
						<ProductSelector
							selectedProductId={selectedProductId}
							selectedVariantId={selectedVariantId}
							onSelectProduct={handleSelectProduct}
							onSelectVariant={handleSelectVariant}
						/>

						{/* Botao Continuar flutuante: fixo no canto, sempre visivel ao escolher variante */}
						{mounted &&
							canProceedStep1 &&
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
					</div>
				)}

				{/* Step 2: Personalization */}
				{step === 2 && (
					<div className="space-y-6">
						{/* Selected product summary */}
						{selectedProduct && selectedVariant && (
							<div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
								{selectedVariant.imageUrl &&
								!selectedVariant.imageUrl.includes('placeholder') ? (
									<img
										src={selectedVariant.imageUrl}
										alt={selectedVariant.name}
										className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-white/10"
									/>
								) : (
									<div className="w-16 h-16 bg-slate-200 dark:bg-white/10 rounded-lg flex items-center justify-center">
										<Package className="w-6 h-6 text-slate-400" />
									</div>
								)}
								<div>
									<p className="font-semibold text-sm text-slate-900 dark:text-white">
										{selectedProduct.name}
									</p>
									<p className="text-xs text-slate-500 dark:text-gray-400">
										{selectedVariant.name}
										{selectedVariant.colorName
											? ` · ${selectedVariant.colorName}`
											: ''}
									</p>
								</div>
							</div>
						)}

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

						{/* Logo (quando a personalizacao usa logo) */}
						{(personalizationType === 'logo' ||
							personalizationType === 'both') && (
							<div>
								<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
									Logo{personalizationType === 'both' ? ' (opcional)' : ''}
								</span>
								<div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
									{imageLogo ? (
										<>
											<div className="w-28 h-28 rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#1a1a1d] shrink-0 relative">
												<img
													src={imageLogo}
													alt="Logo"
													className="w-full h-full object-contain"
												/>
												<button
													type="button"
													onClick={() => setImageLogo(null)}
													className="absolute top-0.5 right-0.5 p-1 bg-white/90 dark:bg-black/60 rounded-md hover:bg-white dark:hover:bg-black/80 transition-colors"
												>
													<RotateCcw className="w-3 h-3 text-slate-600 dark:text-slate-300" />
												</button>
											</div>
											<div className="min-w-0">
												<p className="text-xs text-slate-500 dark:text-gray-400">
													Logo
												</p>
												<p className="text-sm font-semibold text-slate-900 dark:text-white">
													Enviada
												</p>
											</div>
										</>
									) : (
										<>
											<LogoUploadZone preview={null} onSelect={setImageLogo} />
											<div className="min-w-0">
												<p className="text-xs text-slate-500 dark:text-gray-400">
													Logo
												</p>
												<p className="text-sm text-slate-500 dark:text-gray-400">
													{personalizationType === 'logo'
														? 'Envie sua logo'
														: 'Opcional'}
												</p>
											</div>
										</>
									)}
								</div>
							</div>
						)}

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

						{/* Watermark / Marca d'agua */}
						<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
							<div className="flex items-center gap-3">
								<Stamp className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0" />
								<div className="flex-1 min-w-0">
									<p className="text-sm font-semibold text-slate-900 dark:text-white">
										Marca d&apos;agua da empresa
									</p>
									<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
										{hasWatermark
											? 'Sera aplicada nos cantos das suas previas quando ativada.'
											: "Cadastre sua logo para usar como marca d'agua nas previas."}
									</p>
								</div>
								{hasWatermark && watermark?.imageUrl && (
									<img
										src={watermark.imageUrl}
										alt="Marca d'agua"
										className="w-12 h-12 rounded-lg object-contain border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d]"
									/>
								)}
								<div className="flex gap-1.5 shrink-0">
									<button
										type="button"
										onClick={() => watermarkFileRef.current?.click()}
										className="px-3 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
									>
										{hasWatermark ? 'Trocar' : 'Enviar'}
									</button>
									{hasWatermark && (
										<button
											type="button"
											onClick={() => deleteWatermarkMutation.mutate()}
											disabled={deleteWatermarkMutation.isPending}
											className="px-3 py-1.5 text-xs font-medium border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
										>
											Remover
										</button>
									)}
								</div>
							</div>
							<input
								ref={watermarkFileRef}
								type="file"
								accept="image/png,image/jpeg"
								className="hidden"
								onChange={(e) => {
									const f = e.target.files?.[0];
									if (f) uploadWatermarkMutation.mutate(f);
									e.target.value = '';
								}}
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
								onClick={() => setStep(3)}
								className="flex items-center gap-2 px-6 py-3 bg-violet-700 hover:bg-violet-600 text-white font-semibold rounded-xl transition-colors"
							>
								Continuar
								<ArrowRight className="w-4 h-4" />
							</button>
						</div>
					</div>
				)}

				{/* Step 3: Laser Settings */}
				{step === 3 && !optionsLoading && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
						<CollapsibleSection
							title="Tamanho e Posicao"
							icon={Ruler}
							defaultOpen
						>
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
								<DynamicSelect
									label="Tamanho"
									value={laserSettings.tamanho}
									options={getOptions('tamanho')}
									onChange={(v) => updateLS('tamanho', v)}
								/>
								<DynamicSelect
									label="Posicao"
									value={laserSettings.posicao}
									options={getOptions('posicao')}
									onChange={(v) => updateLS('posicao', v)}
								/>
								<div>
									<span className="block text-xs text-slate-500 dark:text-gray-400 mb-1">
										Rotacao
									</span>
									<input
										type="number"
										value={laserSettings.rotacao}
										onChange={(e) =>
											updateLS('rotacao', Number(e.target.value))
										}
										min={getRange('rotacao', -360, 360).min}
										max={getRange('rotacao', -360, 360).max}
										className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
									/>
								</div>
								<DynamicSelect
									label="Moldura"
									value={laserSettings.moldura}
									options={getOptions('moldura')}
									onChange={(v) => updateLS('moldura', v)}
								/>
							</div>
						</CollapsibleSection>

						<CollapsibleSection
							title="Estilo e Material"
							icon={Palette}
							defaultOpen
						>
							{selectedVariantId && (
								<p className="mb-3 text-xs text-violet-600 dark:text-violet-300 flex items-center gap-1.5">
									<Sparkles className="w-3.5 h-3.5" />
									Material e acabamento sugeridos pelo produto — ajuste se
									quiser.
								</p>
							)}
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
								<DynamicSelect
									label="Material"
									value={laserSettings.material}
									options={getOptions('material')}
									onChange={updateMaterial}
									highlight
								/>
								<DynamicSelect
									label="Estilo"
									value={laserSettings.estiloGravacao}
									options={getOptions('estiloGravacao')}
									onChange={(v) => updateLS('estiloGravacao', v)}
								/>
								<DynamicSelect
									label="Acabamento"
									value={laserSettings.acabamentoSuperficie}
									options={getOptions('acabamentoSuperficie')}
									onChange={(v) => updateLS('acabamentoSuperficie', v)}
								/>
								<DynamicSelect
									label="Intensidade"
									value={laserSettings.intensidade}
									options={getOptions('intensidade')}
									onChange={(v) => updateLS('intensidade', v)}
								/>
								<DynamicSelect
									label="Profundidade"
									value={laserSettings.profundidade}
									options={getOptions('profundidade')}
									onChange={(v) => updateLS('profundidade', v)}
								/>
							</div>
						</CollapsibleSection>

						<CollapsibleSection title="Nome e Fonte" icon={Type}>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
								<ToggleButtonGroup
									label="Com Nome"
									value={laserSettings.comNome}
									options={getOptions('comNome')}
									onChange={(v) => updateLS('comNome', v)}
								/>
								<DynamicSelect
									label="Tamanho Nome"
									value={laserSettings.tamanhoNome}
									options={getOptions('tamanhoNome')}
									onChange={(v) => updateLS('tamanhoNome', v)}
								/>
								<ToggleButtonGroup
									label="Orient. Logo"
									value={laserSettings.orientacaoLogo}
									options={getOptions('orientacaoLogo')}
									onChange={(v) => updateLS('orientacaoLogo', v)}
								/>
								<ToggleButtonGroup
									label="Orient. Nome"
									value={laserSettings.orientacaoNome}
									options={getOptions('orientacaoNome')}
									onChange={(v) => updateLS('orientacaoNome', v)}
								/>
								<DynamicSelect
									label="Pos. Texto/Logo"
									value={laserSettings.posicaoTextoRelLogo}
									options={getOptions('posicaoTextoRelLogo')}
									onChange={(v) => updateLS('posicaoTextoRelLogo', v)}
								/>
								<DynamicSelect
									label="Espacamento"
									value={laserSettings.espacamentoLogoTexto}
									options={getOptions('espacamentoLogoTexto')}
									onChange={(v) => updateLS('espacamentoLogoTexto', v)}
								/>
								{options?.fontes && options.fontes.length > 0 && (
									<FontSelector
										value={laserSettings.fonteFamilia}
										fonts={options.fontes}
										onChange={(v) => updateLS('fonteFamilia', v)}
									/>
								)}
							</div>
						</CollapsibleSection>

						<CollapsibleSection title="Efeitos" icon={Sparkles}>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<span className="block text-xs text-slate-500 dark:text-gray-400 mb-1">
										Contraste: {laserSettings.contraste}%
									</span>
									<input
										type="range"
										min={getRange('contraste', 0, 100).min}
										max={getRange('contraste', 0, 100).max}
										value={laserSettings.contraste}
										onChange={(e) =>
											updateLS('contraste', Number(e.target.value))
										}
										className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-white/10 accent-violet-700"
									/>
								</div>
								<div>
									<span className="block text-xs text-slate-500 dark:text-gray-400 mb-1">
										Sombra: {laserSettings.efeitoSombra}%
									</span>
									<input
										type="range"
										min={getRange('efeitoSombra', 0, 100).min}
										max={getRange('efeitoSombra', 0, 100).max}
										value={laserSettings.efeitoSombra}
										onChange={(e) =>
											updateLS('efeitoSombra', Number(e.target.value))
										}
										className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-white/10 accent-violet-700"
									/>
								</div>
							</div>
						</CollapsibleSection>

						<CollapsibleSection
							title="Visualizacao e Camera"
							icon={Camera}
							defaultOpen
							className="lg:col-span-2"
						>
							<div className="space-y-4">
								<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
									<DynamicSelect
										label="Visualizacao"
										value={laserSettings.tipoVisualizacao}
										options={getOptions('tipoVisualizacao')}
										onChange={(v) => updateLS('tipoVisualizacao', v)}
									/>
									<DynamicSelect
										label="Camera"
										value={laserSettings.anguloCamera}
										options={getOptions('anguloCamera')}
										onChange={(v) => updateLS('anguloCamera', v)}
									/>
									<DynamicSelect
										label="Iluminacao"
										value={laserSettings.iluminacao}
										options={getOptions('iluminacao')}
										onChange={(v) => updateLS('iluminacao', v)}
									/>
								</div>
								<div>
									<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
										Fundo da cena
									</span>
									<PreviaBackgroundPicker
										value={laserSettings.fundoCena}
										options={getOptions('fundoCena')}
										suggested={
											selectedProduct
												? suggestedBackgrounds(selectedProduct)
												: []
										}
										onChange={(v) => updateLS('fundoCena', v)}
									/>
								</div>
							</div>
						</CollapsibleSection>

						<div className="flex justify-between pt-2 lg:col-span-2">
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
										{selectedProduct?.name ?? '—'}
									</p>
								</div>
								{selectedVariant && (
									<div>
										<span className="text-slate-500 dark:text-gray-400 text-xs">
											Variante
										</span>
										<p className="text-slate-900 dark:text-white font-medium">
											{selectedVariant.name}
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
								{selectedVariant?.imageUrl &&
									!selectedVariant.imageUrl.includes('placeholder') && (
										<img
											src={selectedVariant.imageUrl}
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
							<div
								ref={previewRef}
								className="rounded-2xl border-2 border-violet-200 dark:border-violet-500/30 bg-gradient-to-b from-violet-50 to-white dark:from-violet-500/5 dark:to-[#1a1a1d] p-5 scroll-mt-24 animate-in fade-in slide-in-from-bottom-4 duration-500"
							>
								<div className="flex items-center gap-2 mb-4">
									<div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center">
										<Check className="w-4 h-4 text-white" />
									</div>
									<div>
										<p className="text-sm font-bold text-slate-900 dark:text-white">
											Previa Gerada
										</p>
										<p className="text-xs text-slate-500 dark:text-gray-400">
											Visualizacao realista da gravacao a laser
										</p>
									</div>
								</div>
								<div className="mx-auto w-full max-w-lg bg-slate-100 dark:bg-black/30 rounded-xl flex items-center justify-center overflow-hidden shadow-inner">
									<img
										src={generatedPrevia.previewUrl}
										alt="Previa gerada"
										className="w-full max-h-[60vh] object-contain"
									/>
								</div>
								<button
									type="button"
									onClick={() =>
										downloadUrl(generatedPrevia.previewUrl, 'previa.png')
									}
									className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 text-sm"
								>
									<Download className="w-4 h-4" />
									Download da Previa
								</button>
							</div>
						)}

						{/* Loading */}
						{generateMutation.isPending && (
							<div className="flex flex-col items-center gap-4 py-12">
								<div className="relative">
									<div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" />
									<div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
										<Sparkles className="w-7 h-7 text-white animate-pulse" />
									</div>
								</div>
								<div className="text-center">
									<p className="text-base font-semibold text-slate-900 dark:text-white">
										Criando sua previa...
									</p>
									<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
										A IA esta gerando uma visualizacao realista da gravacao
									</p>
								</div>
							</div>
						)}

						{/* Watermark mode selector */}
						<div
							className={`rounded-xl border p-4 transition-colors ${hasWatermark ? 'border-slate-200 dark:border-white/10' : 'border-slate-100 dark:border-white/5 opacity-50'}`}
						>
							<div className="flex items-center gap-2 mb-3">
								<span className="text-sm font-medium text-slate-700 dark:text-slate-300">
									Marca d&apos;agua
								</span>
								{hasWatermark && watermark?.imageUrl && (
									<img
										src={watermark.imageUrl}
										alt=""
										className="w-6 h-6 rounded object-contain border border-slate-200 dark:border-white/10 ml-auto shrink-0"
									/>
								)}
							</div>
							{!hasWatermark ? (
								<p className="text-xs text-slate-400 dark:text-gray-500">
									Cadastre sua marca d&apos;agua no passo 2 para ativar
								</p>
							) : (
								<div className="grid grid-cols-3 gap-2">
									{[
										{
											value: 'none' as const,
											label: 'Sem marca',
											desc: 'Sem protecao',
										},
										{
											value: 'corners' as const,
											label: 'Cantos',
											desc: 'Logos nos cantos',
										},
										{
											value: 'tiled' as const,
											label: 'Grade',
											desc: 'Protecao completa',
										},
									].map((opt) => (
										<button
											key={opt.value}
											type="button"
											onClick={() => setWatermarkMode(opt.value)}
											className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-center transition-all ${
												watermarkMode === opt.value
													? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 ring-1 ring-violet-500'
													: 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
											}`}
										>
											<span
												className={`text-sm font-medium ${watermarkMode === opt.value ? 'text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-300'}`}
											>
												{opt.label}
											</span>
											<span className="text-[10px] text-slate-400 dark:text-gray-500">
												{opt.desc}
											</span>
										</button>
									))}
								</div>
							)}
						</div>

						{/* My Machine + Parameter Lookup */}
						<MyMachineSection
							productId={selectedProductId}
							variantId={selectedVariantId}
						/>

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
								disabled={generateMutation.isPending}
								onClick={handleGenerate}
								className={`flex items-center gap-2 px-8 py-3.5 font-bold rounded-xl transition-all text-white disabled:opacity-50 ${
									generatedPrevia
										? 'bg-violet-700 hover:bg-violet-600'
										: 'bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 bg-[length:200%_auto] animate-[shimmer_3s_ease-in-out_infinite] hover:shadow-xl hover:shadow-violet-500/25 hover:scale-[1.02]'
								}`}
							>
								{generateMutation.isPending ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : (
									<Sparkles className="w-5 h-5" />
								)}
								{generatedPrevia ? 'Gerar Novamente' : 'Gerar Previa com IA'}
							</button>
							<div className="basis-full">{previaBilling.notice}</div>
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
										updateMutation.mutate({ id, payload: { name, notes } })
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
