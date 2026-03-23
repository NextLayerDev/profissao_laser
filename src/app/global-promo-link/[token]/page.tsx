'use client';

import {
	AlertCircle,
	ArrowLeft,
	ArrowRight,
	Calendar,
	Check,
	ChevronDown,
	Clock,
	Cpu,
	GraduationCap,
	Loader2,
	Monitor,
	Search,
	Shield,
	Sparkles,
	Tag,
	Users,
	X,
	XCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useClasses } from '@/hooks/use-classes';
import {
	useGlobalPromoLinkInfo,
	useRedeemGlobalPromoLink,
} from '@/hooks/use-global-promo-links';
import { useProducts } from '@/hooks/use-products';
import { useSystemClasses } from '@/hooks/use-system-classes';
import type { ClassWithProducts } from '@/types/classes';
import type { GlobalPromoLinkProduct } from '@/types/global-promo-link';
import type { Product } from '@/types/products';
import type { SystemClassWithRelations } from '@/types/system-classes';
import { CLASS_FEATURES } from '@/utils/constants/class-features';
import {
	FEATURE_DESCRIPTIONS,
	FEATURE_ICONS,
} from '@/utils/constants/feature-display';
import { SC_OPTIONS } from '@/utils/constants/system-class-options';
import { formatCurrency } from '@/utils/format-currency';

/* ─── Types ─── */

interface ProductVariant {
	product: Product;
	classInfo?: ClassWithProducts;
	systemClasses?: SystemClassWithRelations[];
}

interface ProductGroup {
	name: string;
	category: string | null;
	variants: ProductVariant[];
}

/* ─── Helpers ─── */

function getErrorStatus(error: unknown): number | null {
	if (error && typeof error === 'object' && 'response' in error) {
		return (
			(error as { response?: { status?: number } }).response?.status ?? null
		);
	}
	return null;
}

/* ─── Filter select (adapted from landing page) ─── */

function FilterSelect({
	icon: Icon,
	label,
	value,
	options,
	onChange,
}: {
	icon: typeof Monitor;
	label: string;
	value: string;
	options: string[];
	onChange: (v: string) => void;
}) {
	return (
		<div className="relative flex-1 min-w-0 sm:min-w-[200px]">
			<div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
				<Icon className="w-5 h-5 text-emerald-400" />
			</div>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full appearance-none bg-white/[0.05] border border-white/[0.1] hover:border-emerald-500/40 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 text-white rounded-2xl pl-12 pr-10 py-4 text-sm font-medium outline-none transition-all duration-300 cursor-pointer [&>option]:bg-[#16161a] [&>option]:text-white"
			>
				<option value="">{label}</option>
				{options.map((opt) => (
					<option key={opt} value={opt}>
						{opt}
					</option>
				))}
			</select>
			<div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
				<ChevronDown className="w-4 h-4 text-gray-500" />
			</div>
		</div>
	);
}

/* ─── Pricing column (one per variant) ─── */

function PromoPricingColumn({
	variant,
	promoProduct,
	discountPercent,
	durationMonths,
	featured,
	onSelect,
}: {
	variant: ProductVariant;
	promoProduct: GlobalPromoLinkProduct;
	discountPercent: number;
	durationMonths: number;
	featured?: boolean;
	onSelect: (product: GlobalPromoLinkProduct) => void;
}) {
	const { classInfo, systemClasses } = variant;
	const systemClass: SystemClassWithRelations | null =
		systemClasses?.[0] ?? null;
	const hasSc = systemClass !== null;
	const classFeatures = CLASS_FEATURES.filter((f) => classInfo?.[f.key]);

	return (
		<div
			className={`flex flex-col flex-1 sm:min-w-[165px] rounded-2xl border p-4 transition-all duration-200 ${
				featured
					? 'border-emerald-500/50 bg-gradient-to-b from-emerald-500/[0.08] to-transparent shadow-lg shadow-emerald-500/10'
					: hasSc
						? 'border-purple-500/30 bg-purple-500/[0.06]'
						: 'border-white/[0.07] bg-white/[0.03]'
			}`}
		>
			{/* Plan badge */}
			<div className="mb-3">
				{featured && (
					<div className="flex items-center gap-1 mb-2">
						<Sparkles className="w-3 h-3 text-emerald-400" />
						<span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
							Mais popular
						</span>
					</div>
				)}
				{hasSc ? (
					<span
						className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
							featured
								? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
								: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
						}`}
					>
						<Sparkles className="w-3 h-3" />
						{systemClass.name}
					</span>
				) : (
					<span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-white/[0.05] text-gray-400 border border-white/[0.08]">
						Sem sistema
					</span>
				)}
				<p className="text-[11px] text-gray-500 mt-1.5">
					{hasSc ? `Curso + ${systemClass.name}` : 'Curso sem sistema'}
				</p>
			</div>

			{/* Features */}
			<div className="flex-1 space-y-2 mb-4">
				{classFeatures.map((f) => {
					const Icon = FEATURE_ICONS[f.key] ?? Check;
					return (
						<div key={f.key} className="flex items-start gap-2">
							<div className="w-4 h-4 rounded-md bg-emerald-500/10 flex items-center justify-center mt-0.5 shrink-0">
								<Icon className="w-2.5 h-2.5 text-emerald-400" />
							</div>
							<div className="min-w-0">
								<p className="text-xs text-gray-200 font-medium leading-tight">
									{f.label}
								</p>
								<p className="text-[10px] text-gray-500 leading-snug mt-0.5 hidden sm:block">
									{FEATURE_DESCRIPTIONS[f.key]}
								</p>
							</div>
						</div>
					);
				})}
				{SC_OPTIONS.map((o) => {
					const enabled = hasSc && systemClass[o.key] === true;
					const Icon = FEATURE_ICONS[o.key] ?? Check;
					return (
						<div
							key={o.key}
							className={`flex items-start gap-2 ${enabled ? '' : 'opacity-25'}`}
						>
							{enabled ? (
								<div
									className={`w-4 h-4 rounded-md flex items-center justify-center mt-0.5 shrink-0 ${
										featured ? 'bg-emerald-500/15' : 'bg-purple-500/15'
									}`}
								>
									<Icon
										className={`w-2.5 h-2.5 ${featured ? 'text-emerald-400' : 'text-purple-400'}`}
									/>
								</div>
							) : (
								<div className="w-4 h-4 rounded-md bg-white/[0.03] flex items-center justify-center mt-0.5 shrink-0">
									<X className="w-2.5 h-2.5 text-gray-600" />
								</div>
							)}
							<div className="min-w-0">
								<p
									className={`text-xs font-medium leading-tight ${
										enabled
											? featured
												? 'text-emerald-400'
												: 'text-purple-300'
											: 'text-gray-600 line-through'
									}`}
								>
									{o.label}
								</p>
								{enabled && (
									<p className="text-[10px] text-gray-500 leading-snug mt-0.5 hidden sm:block">
										{FEATURE_DESCRIPTIONS[o.key]}
									</p>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Price + CTA */}
			<div
				className={`border-t pt-4 mt-auto ${
					featured ? 'border-emerald-500/20' : 'border-white/[0.06]'
				}`}
			>
				{variant.product.refundDays && (
					<div className="flex items-center gap-1.5 mb-3">
						<Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
						<span className="text-[10px] text-emerald-400/80 font-medium">
							Garantia de {variant.product.refundDays} dias
						</span>
					</div>
				)}

				<div className="flex items-center gap-2 mb-1">
					<span className="text-gray-500 line-through text-xs">
						{formatCurrency(promoProduct.originalPrice, 'BRL')}
					</span>
					<span className="inline-flex items-center gap-0.5 bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
						<Tag className="w-2.5 h-2.5" />-{discountPercent}%
					</span>
				</div>
				<p className="text-2xl font-black text-white tracking-tight mb-0.5">
					{formatCurrency(promoProduct.discountedPrice, 'BRL')}
				</p>
				<p className="text-[10px] text-gray-500 mb-3">
					por {durationMonths} {durationMonths === 1 ? 'mês' : 'meses'}
				</p>

				<button
					type="button"
					onClick={() => onSelect(promoProduct)}
					className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-all duration-300 cursor-pointer text-sm ${
						featured
							? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20'
							: hasSc
								? 'bg-purple-600/80 hover:bg-purple-600 text-white'
								: 'bg-white/[0.07] hover:bg-white/[0.12] text-white'
					}`}
				>
					Escolher este plano
					<ArrowRight className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
}

/* ─── Product card (shared header + pricing columns) ─── */

function PromoProductCard({
	group,
	promoProductMap,
	discountPercent,
	durationMonths,
	onSelectProduct,
}: {
	group: ProductGroup;
	promoProductMap: Map<string, GlobalPromoLinkProduct>;
	discountPercent: number;
	durationMonths: number;
	onSelectProduct: (product: GlobalPromoLinkProduct) => void;
}) {
	const [imgError, setImgError] = useState(false);

	const sorted = [...group.variants].sort(
		(a, b) => a.product.price - b.product.price,
	);
	const primaryProduct = sorted[0].product;

	// Featured = most expensive plan with a SC
	const featuredIndex = sorted.reduce((best, v, i) => {
		if (!v.systemClasses?.[0]) return best;
		return i;
	}, -1);

	return (
		<div className="group relative rounded-3xl overflow-hidden border border-white/[0.06] hover:border-white/10 bg-[#16161a] transition-all duration-500">
			{/* Image header */}
			<div className="relative h-52 overflow-hidden">
				{primaryProduct.image && !imgError ? (
					<>
						<Image
							src={primaryProduct.image}
							alt={primaryProduct.name}
							fill
							className="object-cover transition-transform duration-700 group-hover:scale-105"
							onError={() => setImgError(true)}
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-[#16161a] via-[#16161a]/40 to-transparent" />
					</>
				) : (
					<div className="absolute inset-0 bg-gradient-to-br from-violet-900/50 via-purple-900/30 to-[#16161a]">
						<div className="absolute inset-0 flex items-center justify-center">
							<GraduationCap className="w-16 h-16 text-white/10" />
						</div>
					</div>
				)}
				{primaryProduct.category && (
					<div className="absolute top-4 left-4 z-10">
						<span className="bg-white/10 backdrop-blur-md text-white/90 text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/10">
							{primaryProduct.category}
						</span>
					</div>
				)}
				<span className="absolute top-4 right-4 z-10 inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
					<Tag className="w-3 h-3" />-{discountPercent}%
				</span>
				<div className="absolute bottom-0 left-0 right-0 p-5 z-10">
					<h3 className="text-xl font-bold text-white leading-tight drop-shadow-lg">
						{primaryProduct.name}
					</h3>
				</div>
			</div>

			{/* Body info */}
			<div className="px-5 pt-3 pb-2">
				{primaryProduct.description && (
					<p className="text-[13px] text-gray-400 leading-relaxed line-clamp-2 mb-3">
						{primaryProduct.description}
					</p>
				)}
				{(primaryProduct.machine || primaryProduct.software) && (
					<div className="flex flex-wrap gap-2">
						{primaryProduct.machine && (
							<span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white/[0.05] px-2.5 py-1 rounded-full">
								<Monitor className="w-3.5 h-3.5 text-violet-400" />
								{primaryProduct.machine}
							</span>
						)}
						{primaryProduct.software && (
							<span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white/[0.05] px-2.5 py-1 rounded-full">
								<Cpu className="w-3.5 h-3.5 text-violet-400" />
								{primaryProduct.software}
							</span>
						)}
					</div>
				)}
			</div>

			{/* Pricing columns */}
			<div className="flex flex-col sm:flex-row gap-3 px-5 pb-5 pt-3">
				{sorted.map((v, i) => {
					const promoProduct = promoProductMap.get(v.product.id);
					if (!promoProduct) return null;
					return (
						<PromoPricingColumn
							key={v.product.id}
							variant={v}
							promoProduct={promoProduct}
							discountPercent={discountPercent}
							durationMonths={durationMonths}
							featured={i === featuredIndex}
							onSelect={onSelectProduct}
						/>
					);
				})}
			</div>
		</div>
	);
}

/* ─── Fallback simple card (when full product data unavailable) ─── */

function SimpleProductCard({
	product,
	discountPercent,
	durationMonths,
	onSelect,
}: {
	product: GlobalPromoLinkProduct;
	discountPercent: number;
	durationMonths: number;
	onSelect: (product: GlobalPromoLinkProduct) => void;
}) {
	return (
		<div className="bg-[#1a1a1d] rounded-2xl border border-gray-800 overflow-hidden flex flex-col">
			<div className="relative h-44 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center">
				{product.image ? (
					<img
						src={product.image}
						alt={product.name}
						className="w-full h-full object-cover"
					/>
				) : (
					<span className="text-lg font-bold text-white/80 px-6 text-center">
						{product.name}
					</span>
				)}
				<span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
					<Tag className="w-3 h-3" />-{discountPercent}%
				</span>
			</div>
			<div className="p-5 flex flex-col flex-1">
				<h3 className="text-lg font-bold text-white mb-1">{product.name}</h3>
				{product.description && (
					<p className="text-gray-400 text-sm mb-4 line-clamp-2">
						{product.description}
					</p>
				)}
				<div className="mt-auto pt-4 border-t border-gray-800">
					<div className="flex items-center gap-2">
						<span className="text-gray-500 line-through text-sm">
							{formatCurrency(product.originalPrice, 'BRL')}
						</span>
					</div>
					<p className="text-2xl font-bold text-white mt-0.5">
						{formatCurrency(product.discountedPrice, 'BRL')}
					</p>
					<p className="text-gray-500 text-xs mt-1">
						por {durationMonths} {durationMonths === 1 ? 'mês' : 'meses'}
					</p>
				</div>
				<button
					type="button"
					onClick={() => onSelect(product)}
					className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer mt-4"
				>
					Escolher este plano
				</button>
			</div>
		</div>
	);
}

/* ─── Main page ─── */

export default function GlobalPromoLinkPage() {
	const { token } = useParams<{ token: string }>();
	const {
		data,
		error,
		isLoading: promoLoading,
	} = useGlobalPromoLinkInfo(token);
	const redeemMutation = useRedeemGlobalPromoLink(token);

	// Full product data for rich cards
	const { products, isLoading: productsLoading } = useProducts();
	const { classes, isLoading: classesLoading } = useClasses();
	const { systemClasses, isLoading: scLoading } = useSystemClasses();

	const [step, setStep] = useState<'select' | 'form'>('select');
	const [selectedProduct, setSelectedProduct] =
		useState<GlobalPromoLinkProduct | null>(null);

	// Filters
	const [selectedMachine, setSelectedMachine] = useState('');
	const [selectedSoftware, setSelectedSoftware] = useState('');

	// Form fields
	const [customerName, setCustomerName] = useState('');
	const [companyName, setCompanyName] = useState('');
	const [customerPhone, setCustomerPhone] = useState('');
	const [customerCpf, setCustomerCpf] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const isLoading =
		promoLoading || productsLoading || classesLoading || scLoading;

	// Promo product map: product ID → GlobalPromoLinkProduct
	const promoProductMap = useMemo(() => {
		const map = new Map<string, GlobalPromoLinkProduct>();
		if (!data?.products) return map;
		for (const p of data.products) map.set(p.id, p);
		return map;
	}, [data?.products]);

	// Filter to active products that exist in the promo link
	const activeProducts = useMemo(
		() =>
			(products ?? []).filter(
				(p) => p.status === 'ativo' && promoProductMap.has(p.id),
			),
		[products, promoProductMap],
	);

	const activeClasses = useMemo(
		() => (classes ?? []).filter((c) => c.status === 'ativo'),
		[classes],
	);
	const activeSystemClasses = useMemo(
		() => (systemClasses ?? []).filter((sc) => sc.status === 'ativo'),
		[systemClasses],
	);

	// Product → class map
	const productClassMap = useMemo(() => {
		const map = new Map<string, ClassWithProducts>();
		for (const cls of activeClasses) {
			for (const product of cls.products) {
				map.set(product.id, cls);
			}
		}
		return map;
	}, [activeClasses]);

	// Product → system classes map
	const productSystemClassesMap = useMemo(() => {
		const map = new Map<string, SystemClassWithRelations[]>();
		for (const sc of activeSystemClasses) {
			for (const product of sc.products) {
				if (!map.has(product.id)) map.set(product.id, []);
				map.get(product.id)?.push(sc);
			}
		}
		return map;
	}, [activeSystemClasses]);

	// Unique machines + softwares from promo-available products
	const { machines, softwares } = useMemo(() => {
		const machineSet = new Set<string>();
		const softwareSet = new Set<string>();
		for (const p of activeProducts) {
			if (p.machine) machineSet.add(p.machine);
			if (p.software) softwareSet.add(p.software);
		}
		return {
			machines: Array.from(machineSet).sort(),
			softwares: Array.from(softwareSet).sort(),
		};
	}, [activeProducts]);

	// Pre-select Fiber Laser + EZCAD
	useEffect(() => {
		if (isLoading || machines.length === 0 || selectedMachine !== '') return;
		setSelectedMachine(
			machines.includes('Fiber Laser') ? 'Fiber Laser' : machines[0],
		);
	}, [isLoading, machines, selectedMachine]);

	useEffect(() => {
		if (isLoading || softwares.length === 0 || selectedSoftware !== '') return;
		setSelectedSoftware(softwares.includes('EZCAD') ? 'EZCAD' : softwares[0]);
	}, [isLoading, softwares, selectedSoftware]);

	const hasFilters = selectedMachine !== '' || selectedSoftware !== '';

	// Whether rich product data is available
	const hasRichData = activeProducts.length > 0;

	// Product groups (same logic as landing page)
	const productGroups: ProductGroup[] = useMemo(() => {
		const map = new Map<string, ProductVariant[]>();
		for (const product of activeProducts) {
			if (!map.has(product.name)) map.set(product.name, []);
			map.get(product.name)?.push({
				product,
				classInfo: productClassMap.get(product.id),
				systemClasses: productSystemClassesMap.get(product.id),
			});
		}

		// Sort variants within each group
		const allGroups: ProductGroup[] = [];
		for (const [name, variants] of map) {
			const sorted = [...variants].sort((a, b) => {
				const aHasSc = (a.systemClasses ?? []).length > 0;
				const bHasSc = (b.systemClasses ?? []).length > 0;
				if (!aHasSc && bHasSc) return -1;
				if (aHasSc && !bHasSc) return 1;
				const aName = a.systemClasses?.[0]?.name ?? '';
				const bName = b.systemClasses?.[0]?.name ?? '';
				return aName.localeCompare(bName);
			});
			allGroups.push({
				name,
				category: sorted[0].product.category,
				variants: sorted,
			});
		}

		// Filter at group level
		if (!selectedMachine && !selectedSoftware) return allGroups;
		return allGroups.filter((group) =>
			group.variants.some((v) => {
				const machineOk =
					!selectedMachine || v.product.machine === selectedMachine;
				const softwareOk =
					!selectedSoftware || v.product.software === selectedSoftware;
				return machineOk && softwareOk;
			}),
		);
	}, [
		activeProducts,
		selectedMachine,
		selectedSoftware,
		productClassMap,
		productSystemClassesMap,
	]);

	// Group by category
	const categories = useMemo(() => {
		const catMap = new Map<string, ProductGroup[]>();
		for (const group of productGroups) {
			const cat = group.category ?? 'Outros';
			if (!catMap.has(cat)) catMap.set(cat, []);
			catMap.get(cat)?.push(group);
		}
		return Array.from(catMap.entries());
	}, [productGroups]);

	function handleSelectProduct(product: GlobalPromoLinkProduct) {
		setSelectedProduct(product);
		setStep('form');
	}

	function handleBack() {
		setStep('select');
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (!selectedProduct) return;

		if (
			!customerName.trim() ||
			!companyName.trim() ||
			!customerPhone.trim() ||
			!customerCpf.trim() ||
			!email.trim() ||
			!password.trim()
		) {
			toast.error('Preencha todos os campos');
			return;
		}

		if (password.length < 6) {
			toast.error('A senha deve ter no mínimo 6 caracteres');
			return;
		}

		try {
			const { checkoutUrl } = await redeemMutation.mutateAsync({
				productId: selectedProduct.id,
				customerName: customerName.trim(),
				companyName: companyName.trim(),
				customerPhone: customerPhone.trim(),
				customerCpf: customerCpf.trim(),
				email: email.trim(),
				password,
			});

			window.location.href = checkoutUrl;
		} catch (err: unknown) {
			const status = getErrorStatus(err);
			if (status === 400) {
				toast.error('CPF inválido. Verifique e tente novamente.');
			} else if (status === 409) {
				toast.error(
					'Você já resgatou este link promocional com este CPF/telefone.',
				);
			} else if (status === 410) {
				toast.error('Este link já foi esgotado ou expirou.');
			} else {
				toast.error('Erro ao processar. Tente novamente.');
			}
		}
	}

	// Loading
	if (isLoading) {
		return (
			<PageWrapper>
				<div className="flex flex-col items-center justify-center py-32 gap-3">
					<Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
					<p className="text-sm text-gray-500">Carregando oferta...</p>
				</div>
			</PageWrapper>
		);
	}

	// Error: 410 Gone
	if (error && getErrorStatus(error) === 410) {
		return (
			<PageWrapper>
				<div className="max-w-md mx-auto text-center py-20">
					<div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
						<XCircle className="w-10 h-10 text-red-400" />
					</div>
					<h2 className="text-2xl font-bold text-white mb-3">
						Promoção encerrada
					</h2>
					<p className="text-gray-400 mb-2">
						Este link promocional não está mais disponível.
					</p>
					<p className="text-gray-500 text-sm">
						O limite de usos foi atingido ou o link expirou. Entre em contato
						com o administrador para um novo link.
					</p>
				</div>
			</PageWrapper>
		);
	}

	// Error: 404 Not Found
	if (error && getErrorStatus(error) === 404) {
		return (
			<PageWrapper>
				<div className="max-w-md mx-auto text-center py-20">
					<div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
						<AlertCircle className="w-10 h-10 text-red-400" />
					</div>
					<h2 className="text-2xl font-bold text-white mb-3">
						Link não encontrado
					</h2>
					<p className="text-gray-400 mb-2">
						O link que você está procurando não existe ou foi removido.
					</p>
					<p className="text-gray-500 text-sm">
						Verifique se o link está correto ou entre em contato com o
						administrador.
					</p>
				</div>
			</PageWrapper>
		);
	}

	// Generic error
	if (error) {
		return (
			<PageWrapper>
				<div className="max-w-md mx-auto text-center py-20">
					<div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
						<AlertCircle className="w-10 h-10 text-red-400" />
					</div>
					<h2 className="text-2xl font-bold text-white mb-3">
						Erro ao carregar link
					</h2>
					<p className="text-gray-400 mb-2">
						Ocorreu um erro ao carregar as informações do link.
					</p>
					<p className="text-gray-500 text-sm">
						Tente novamente mais tarde ou entre em contato com o administrador.
					</p>
				</div>
			</PageWrapper>
		);
	}

	// Data not loaded yet
	if (!data) return null;

	// No products available
	if (data.products.length === 0) {
		return (
			<PageWrapper>
				<div className="max-w-md mx-auto text-center py-20">
					<div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
						<AlertCircle className="w-10 h-10 text-amber-400" />
					</div>
					<h2 className="text-2xl font-bold text-white mb-3">
						Nenhum produto disponível
					</h2>
					<p className="text-gray-400 mb-2">
						Esta promoção não possui produtos disponíveis no momento.
					</p>
					<p className="text-gray-500 text-sm">
						Entre em contato com o administrador para mais informações.
					</p>
				</div>
			</PageWrapper>
		);
	}

	// Step 1 — Product Selection
	if (step === 'select') {
		return (
			<PageWrapper>
				{/* Promo info header */}
				<div className="text-center mb-10">
					<h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
						Oferta exclusiva para você!
					</h1>
					<p className="text-gray-400 text-lg max-w-xl mx-auto mb-6">
						Escolha o plano que deseja assinar com desconto especial.
					</p>

					<div className="flex flex-wrap items-center justify-center gap-3">
						<span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-sm font-semibold px-3 py-1.5 rounded-full border border-emerald-500/20">
							<Tag className="w-3.5 h-3.5" />
							{data.discountPercent}% de desconto
						</span>
						<span className="inline-flex items-center gap-1.5 bg-violet-500/10 text-violet-400 text-sm font-medium px-3 py-1.5 rounded-full border border-violet-500/20">
							<Clock className="w-3.5 h-3.5" />
							por {data.durationMonths}{' '}
							{data.durationMonths === 1 ? 'mês' : 'meses'}
						</span>
						<span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 text-sm font-medium px-3 py-1.5 rounded-full border border-amber-500/20">
							<Users className="w-3.5 h-3.5" />
							{data.remainingRedemptions}{' '}
							{data.remainingRedemptions === 1
								? 'vaga restante'
								: 'vagas restantes'}
						</span>
						{data.expiresAt && (
							<span className="inline-flex items-center gap-1.5 bg-slate-500/10 text-slate-400 text-sm font-medium px-3 py-1.5 rounded-full border border-slate-500/20">
								<Calendar className="w-3.5 h-3.5" />
								Válido até{' '}
								{new Date(data.expiresAt).toLocaleDateString('pt-BR', {
									day: '2-digit',
									month: '2-digit',
									year: 'numeric',
								})}
							</span>
						)}
					</div>
				</div>

				{/* Rich product display */}
				{hasRichData ? (
					<>
						{/* Course finder filters */}
						{(machines.length > 0 || softwares.length > 0) && (
							<div className="mb-12">
								<div className="relative bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.08] rounded-3xl p-6 md:p-8 backdrop-blur-sm">
									<div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

									<div className="flex items-center gap-3 mb-5">
										<div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
											<Search className="w-5 h-5 text-emerald-400" />
										</div>
										<div>
											<h3 className="text-white font-bold text-lg">
												Encontre o curso ideal para você
											</h3>
											<p className="text-gray-500 text-sm">
												Selecione sua máquina e software para ver a recomendação
											</p>
										</div>
									</div>

									<div className="flex flex-col sm:flex-row gap-3">
										{machines.length > 0 && (
											<FilterSelect
												icon={Monitor}
												label="Qual sua máquina?"
												value={selectedMachine}
												options={machines}
												onChange={setSelectedMachine}
											/>
										)}
										{softwares.length > 0 && (
											<FilterSelect
												icon={Cpu}
												label="Qual seu software?"
												value={selectedSoftware}
												options={softwares}
												onChange={setSelectedSoftware}
											/>
										)}
										{hasFilters && (
											<button
												type="button"
												onClick={() => {
													setSelectedMachine('');
													setSelectedSoftware('');
												}}
												className="flex items-center justify-center gap-2 text-gray-400 hover:text-white text-sm font-medium px-5 py-4 rounded-2xl border border-white/[0.08] hover:border-white/20 transition-all duration-300 cursor-pointer sm:w-auto"
											>
												<X className="w-4 h-4" />
												Limpar
											</button>
										)}
									</div>

									{hasFilters && (
										<div className="mt-5 flex items-center gap-3 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-2xl px-5 py-3.5">
											<Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
											{productGroups.length > 0 ? (
												<p className="text-sm text-gray-300">
													<span className="text-white font-bold">
														{productGroups.length}{' '}
														{productGroups.length === 1
															? 'curso encontrado'
															: 'cursos encontrados'}
													</span>{' '}
													para{' '}
													{selectedMachine && (
														<span className="text-emerald-400 font-semibold">
															{selectedMachine}
														</span>
													)}
													{selectedMachine && selectedSoftware && ' + '}
													{selectedSoftware && (
														<span className="text-violet-400 font-semibold">
															{selectedSoftware}
														</span>
													)}
													{' — '}
													{productGroups.length === 1
														? 'este é o curso ideal para você!'
														: 'estes são os cursos ideais para você!'}
												</p>
											) : (
												<p className="text-sm text-gray-400">
													Nenhum curso encontrado para essa combinação. Tente
													ajustar os filtros.
												</p>
											)}
										</div>
									)}
								</div>
							</div>
						)}

						{/* Product cards by category */}
						{categories.map(([categoryName, groups]) => (
							<div key={categoryName} className="mb-12 last:mb-0">
								{categories.length > 1 && (
									<div className="flex items-center gap-4 mb-8">
										<div className="flex items-center gap-3">
											<div className="w-1 h-8 rounded-full bg-emerald-500" />
											<h3 className="text-2xl font-bold text-white">
												{categoryName}
											</h3>
										</div>
										<div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
										<span className="text-xs text-gray-500 font-medium">
											{groups.length} {groups.length === 1 ? 'curso' : 'cursos'}
										</span>
									</div>
								)}

								<div className="flex flex-col gap-8">
									{groups.map((group) => (
										<PromoProductCard
											key={group.name}
											group={group}
											promoProductMap={promoProductMap}
											discountPercent={data.discountPercent}
											durationMonths={data.durationMonths}
											onSelectProduct={handleSelectProduct}
										/>
									))}
								</div>
							</div>
						))}

						{/* Trust badges */}
						<div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-10">
							<div className="flex items-center gap-2 text-gray-500 text-sm">
								<div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
									<Check className="w-3 h-3 text-emerald-400" />
								</div>
								Compra segura
							</div>
							<div className="text-gray-500 text-sm">Stripe</div>
							<div className="text-gray-500 text-sm">Garantia de 7 dias</div>
						</div>
					</>
				) : (
					/* Fallback: simple cards when rich data unavailable */
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{data.products.map((product) => (
							<SimpleProductCard
								key={product.id}
								product={product}
								discountPercent={data.discountPercent}
								durationMonths={data.durationMonths}
								onSelect={handleSelectProduct}
							/>
						))}
					</div>
				)}
			</PageWrapper>
		);
	}

	// Step 2 — Registration Form
	return (
		<PageWrapper>
			{/* Back button */}
			<button
				type="button"
				onClick={handleBack}
				className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
			>
				<ArrowLeft className="w-4 h-4" />
				<span className="text-sm font-medium">Voltar aos planos</span>
			</button>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Left — Selected product summary */}
				{selectedProduct && (
					<div className="bg-[#1a1a1d] rounded-2xl border border-gray-800 overflow-hidden">
						<div className="relative h-56 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center">
							{selectedProduct.image ? (
								<img
									src={selectedProduct.image}
									alt={selectedProduct.name}
									className="w-full h-full object-cover"
								/>
							) : (
								<span className="text-lg font-bold text-white/80 px-6 text-center">
									{selectedProduct.name}
								</span>
							)}
						</div>

						<div className="p-6">
							<h2 className="text-2xl font-bold text-white mb-2">
								{selectedProduct.name}
							</h2>
							{selectedProduct.description && (
								<p className="text-gray-400 text-sm mb-4">
									{selectedProduct.description}
								</p>
							)}

							<div className="border-t border-gray-800 pt-5">
								<div className="flex items-center gap-3">
									<span className="text-gray-500 line-through text-lg">
										{formatCurrency(selectedProduct.originalPrice, 'BRL')}
									</span>
									<span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20">
										<Tag className="w-3 h-3" />-{data.discountPercent}%
									</span>
								</div>
								<p className="text-3xl font-bold text-white mt-1">
									{formatCurrency(selectedProduct.discountedPrice, 'BRL')}
								</p>
								<p className="text-gray-500 text-xs mt-2">
									Valor promocional válido por {data.durationMonths}{' '}
									{data.durationMonths === 1 ? 'mês' : 'meses'}. Após esse
									período, o valor integral será cobrado caso a assinatura não
									seja cancelada.
								</p>
							</div>

							{/* Remaining slots */}
							<div className="mt-4 flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
								<Users className="w-4 h-4 text-amber-400 shrink-0" />
								<span className="text-sm text-amber-300">
									{data.remainingRedemptions > 0 ? (
										<>
											<span className="font-semibold">
												{data.remainingRedemptions}
											</span>{' '}
											{data.remainingRedemptions === 1
												? 'vaga restante'
												: 'vagas restantes'}
										</>
									) : (
										'Sem vagas disponíveis'
									)}
								</span>
							</div>
						</div>
					</div>
				)}

				{/* Right — Form */}
				<div className="bg-[#1a1a1d] rounded-2xl border border-gray-800 p-6">
					<h3 className="text-lg font-bold text-white mb-1">
						Oferta especial!
					</h3>
					<p className="text-sm text-gray-400 mb-6">
						Preencha seus dados para aproveitar essa promoção exclusiva.
					</p>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label
								htmlFor="global-promo-name"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Nome completo
							</label>
							<input
								id="global-promo-name"
								type="text"
								value={customerName}
								onChange={(e) => setCustomerName(e.target.value)}
								placeholder="Seu nome completo"
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>

						<div>
							<label
								htmlFor="global-promo-phone"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Telefone
							</label>
							<input
								id="global-promo-phone"
								type="tel"
								value={customerPhone}
								onChange={(e) => setCustomerPhone(e.target.value)}
								placeholder="(11) 99999-1234"
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>

						<div>
							<label
								htmlFor="global-promo-cpf"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								CPF
							</label>
							<input
								id="global-promo-cpf"
								type="text"
								value={customerCpf}
								onChange={(e) => setCustomerCpf(e.target.value)}
								placeholder="000.000.000-00"
								maxLength={14}
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>

						<div>
							<label
								htmlFor="global-promo-email"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								E-mail
							</label>
							<input
								id="global-promo-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="seu@email.com"
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>

						<div>
							<label
								htmlFor="global-promo-password"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Senha
							</label>
							<input
								id="global-promo-password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Mínimo 6 caracteres"
								minLength={6}
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>

						<div className="pt-1">
							<label
								htmlFor="global-promo-company"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Nome da empresa
							</label>
							<input
								id="global-promo-company"
								type="text"
								value={companyName}
								onChange={(e) => setCompanyName(e.target.value)}
								placeholder="Nome da sua empresa"
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>

						<button
							type="submit"
							disabled={redeemMutation.isPending}
							className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors cursor-pointer mt-2"
						>
							{redeemMutation.isPending ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Processando...
								</>
							) : (
								'Continuar para pagamento'
							)}
						</button>
						<p className="text-gray-600 text-xs text-center mt-3">
							Ao continuar, você concorda que o desconto é aplicado por{' '}
							{data.durationMonths}{' '}
							{data.durationMonths === 1 ? 'mês' : 'meses'}. Após esse prazo, o
							valor integral será cobrado automaticamente caso a assinatura não
							seja cancelada.
						</p>
					</form>
				</div>
			</div>
		</PageWrapper>
	);
}

function PageWrapper({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-[#0d0d0f] text-white font-sans">
			<header className="border-b border-white/[0.06] bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-10">
				<div className="max-w-6xl mx-auto px-6 py-4">
					<span className="text-lg font-bold tracking-tight text-white">
						Profissão Laser
					</span>
				</div>
			</header>
			<main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
		</div>
	);
}
