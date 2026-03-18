'use client';

import {
	ArrowRight,
	BookOpen,
	Check,
	CheckCircle,
	ChevronDown,
	Cpu,
	GraduationCap,
	Loader2,
	MessageCircle,
	Monitor,
	Pen,
	Search,
	Shield,
	Sparkles,
	Users,
	X,
	Zap,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useClasses } from '@/hooks/use-classes';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { useProducts } from '@/hooks/use-products';
import { useSystemClasses } from '@/hooks/use-system-classes';
import { getCurrentUser } from '@/lib/auth';
import type { ClassWithProducts } from '@/types/classes';
import type { CustomerPlan } from '@/types/plans';
import type { Product } from '@/types/products';
import type { SystemClassWithRelations } from '@/types/system-classes';
import { CLASS_FEATURES } from '@/utils/constants/class-features';
import { TIER_STYLES } from '@/utils/constants/tier-styles';
import { formatCurrency } from '@/utils/format-currency';
import { resolveOwnership, TIER_ORDER } from '@/utils/ownership';

const FEATURE_ICONS: Record<string, typeof BookOpen> = {
	aula: BookOpen,
	chat: MessageCircle,
	vetorizacao: Pen,
	suporte: Zap,
	comunidade: Users,
};

const FEATURE_DESCRIPTIONS: Record<string, string> = {
	aula: 'Aulas completas do básico ao avançado com conteúdo atualizado',
	chat: 'Tire dúvidas em tempo real com nossos especialistas',
	vetorizacao: 'Serviço de vetorização profissional para seus projetos',
	suporte: 'Suporte técnico especializado via WhatsApp e acesso remoto',
	comunidade: 'Acesso ao grupo exclusivo de profissionais do mercado laser',
};

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

/* ─── Individual product card ─── */

function ProductCard({
	variants,
	featured,
	ownedPlans,
}: {
	variants: ProductVariant[];
	featured?: boolean;
	ownedPlans?: CustomerPlan[];
}) {
	const [selectedIndex, setSelectedIndex] = useState(() => {
		if (variants.length <= 1) return 0;
		const ouroIdx = variants.findIndex((v) => v.classInfo?.tier === 'ouro');
		return ouroIdx >= 0 ? ouroIdx : 0;
	});
	const [selectedScIndex, setSelectedScIndex] = useState<number | null>(() => {
		const sc = variants[0].systemClasses ?? [];
		return sc.length > 0 ? 0 : null;
	});
	const [imgError, setImgError] = useState(false);
	const router = useRouter();

	const { product, classInfo } = variants[selectedIndex];
	const hasMultipleTiers = variants.length > 1;

	const allSystemClasses = variants[selectedIndex].systemClasses ?? [];
	const activeSystemClass =
		selectedScIndex !== null
			? (allSystemClasses[selectedScIndex] ?? null)
			: null;

	function handleBuy() {
		router.push(`/checkout/${product.slug}?productId=${product.id}`);
	}

	const ownershipStatus = ownedPlans
		? resolveOwnership(ownedPlans, variants, selectedIndex)
		: 'none';

	const enabledFeatures = classInfo
		? CLASS_FEATURES.filter((f) => classInfo[f.key])
		: activeSystemClass
			? CLASS_FEATURES.filter((f) => activeSystemClass[f.key])
			: [];
	const disabledFeatures = classInfo
		? CLASS_FEATURES.filter((f) => !classInfo[f.key])
		: activeSystemClass
			? CLASS_FEATURES.filter((f) => !activeSystemClass[f.key])
			: CLASS_FEATURES;

	return (
		<div
			className={`flex flex-col w-full sm:flex-1 sm:min-w-[165px] rounded-2xl border p-4 transition-all duration-200 ${
				featured
					? 'bg-gradient-to-b from-[#1e1e22] to-[#141416] border-2 border-[#f2295b]/60 shadow-2xl shadow-[#f2295b]/10 md:-mt-4 md:mb-4'
					: 'bg-[#16161a] border border-white/[0.06] hover:border-white/10'
			}`}
		>
			{/* Featured badge */}
			{featured && (
				<div className="absolute top-5 right-5 z-20">
					<div className="flex items-center gap-1.5 bg-[#f2295b] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg shadow-[#f2295b]/30">
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
								<p className="text-[10px] text-gray-500 leading-snug mt-0.5">
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
										featured ? 'bg-[#f2295b]/15' : 'bg-purple-500/15'
									}`}
								>
									<Icon
										className={`w-2.5 h-2.5 ${featured ? 'text-[#f2295b]' : 'text-purple-400'}`}
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
												? 'text-[#f2295b]'
												: 'text-purple-300'
											: 'text-gray-600 line-through'
									}`}
								>
									{o.label}
								</p>
								{enabled && (
									<p className="text-[10px] text-gray-500 leading-snug mt-0.5">
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
					featured ? 'border-[#f2295b]/20' : 'border-white/[0.06]'
				}`}
			>
				{product.refundDays && (
					<div className="flex items-center gap-1.5 mb-3">
						<Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
						<span className="text-[10px] text-emerald-400/80 font-medium">
							Garantia de {product.refundDays} dias
						</span>
					</div>
				</div>
			)}

			{/* Image / Visual header */}
			<div className="relative h-52 overflow-hidden">
				{product.image && !imgError ? (
					<>
						<Image
							src={product.image}
							alt={product.name}
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

				{/* Category pill */}
				{product.category && (
					<div className="absolute top-4 left-4 z-10">
						<span className="bg-white/10 backdrop-blur-md text-white/90 text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/10">
							{product.category}
						</span>
					</div>
				)}

				{/* System class badge */}
				{activeSystemClass && !featured && (
					<div className="absolute top-4 right-4 z-10">
						<span className="bg-purple-500/80 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1.5 rounded-full border border-purple-400/30">
							{activeSystemClass.name}
						</span>
					</div>
				)}

				{/* Title overlay at bottom of image */}
				<div className="absolute bottom-0 left-0 right-0 p-5 z-10">
					<h3 className="text-xl font-bold text-white leading-tight drop-shadow-lg">
						{product.name}
					</h3>
				</div>
			</div>

			{/* Body */}
			<div className="p-5 pt-3 flex flex-col flex-1">
				{/* Description */}
				{product.description ? (
					<p className="text-[13px] text-gray-400 leading-relaxed mb-5 line-clamp-3">
						{product.description}
					</p>
				) : (
					<p className="text-[13px] text-gray-500 leading-relaxed mb-5">
						Curso profissional completo com conteúdo exclusivo para dominar o
						mercado de gravação a laser.
					</p>
				)}

				{/* Tier selector */}
				{hasMultipleTiers && (
					<div className="mb-5">
						<p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-2.5">
							Nível de acesso
						</p>
						<div className="grid grid-cols-3 gap-1.5 bg-white/[0.03] p-1 rounded-xl">
							{variants.map((v, i) => {
								const style = v.classInfo
									? TIER_STYLES[v.classInfo.tier]
									: null;
								const label = style?.label ?? 'Padrão';
								const isActive = i === selectedIndex;
								return (
									<button
										key={v.product.id}
										type="button"
										onClick={() => {
											setSelectedIndex(i);
											const sc = variants[i].systemClasses ?? [];
											setSelectedScIndex(sc.length > 0 ? 0 : null);
											setImgError(false);
										}}
										className={`relative py-2 text-xs font-semibold rounded-lg transition-all duration-300 cursor-pointer ${
											isActive
												? 'bg-white/10 text-white shadow-sm'
												: 'text-gray-500 hover:text-gray-300'
										}`}
									>
										{label}
										{isActive && (
											<div
												className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full ${
													v.classInfo?.tier === 'prata'
														? 'bg-slate-400'
														: v.classInfo?.tier === 'ouro'
															? 'bg-amber-400'
															: v.classInfo?.tier === 'platina'
																? 'bg-violet-400'
																: 'bg-white'
												}`}
											/>
										)}
									</button>
								);
							})}
						</div>
					</div>
				)}

			{/* Pricing columns — sorted by price asc */}
			<div className="flex flex-col sm:flex-row gap-3 px-4 sm:px-5 pb-5 pt-3 sm:overflow-x-auto">
				{sorted.map((v, i) => (
					<PricingColumn
						key={v.product.id}
						variant={v}
						featured={i === featuredIndex}
					/>
				))}
			</div>
		</div>
	);
}

/* ─── Filter select ─── */

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
		<div className="relative flex-1 min-w-[200px]">
			<div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
				<Icon className="w-5 h-5 text-[#f2295b]" />
			</div>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full appearance-none bg-white/[0.05] border border-white/[0.1] hover:border-[#f2295b]/40 focus:border-[#f2295b]/60 focus:ring-1 focus:ring-[#f2295b]/30 text-white rounded-2xl pl-12 pr-10 py-4 text-sm font-medium outline-none transition-all duration-300 cursor-pointer [&>option]:bg-[#16161a] [&>option]:text-white"
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

/* ─── Main section ─── */

export function ProductsSection() {
	const { products, isLoading: productsLoading } = useProducts();
	const { classes, isLoading: classesLoading } = useClasses();
	const { systemClasses, isLoading: systemClassesLoading } = useSystemClasses();

	const currentUser = getCurrentUser();
	const { data: ownedPlans } = useCustomerPlans(currentUser?.email ?? null);

	const [selectedMachine, setSelectedMachine] = useState('');
	const [selectedSoftware, setSelectedSoftware] = useState('');

	const isLoading = productsLoading || classesLoading || systemClassesLoading;

	const activeProducts = (products ?? []).filter((p) => p.status === 'ativo');
	const activeClasses = classes.filter((c) => c.status === 'ativo');
	const activeSystemClasses = systemClasses.filter(
		(sc) => sc.status === 'ativo',
	);

	/* Extract unique machine and software values */
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

	const hasFilters = selectedMachine !== '' || selectedSoftware !== '';

	const productClassMap = useMemo(() => {
		const map = new Map<string, ClassWithProducts>();
		for (const cls of activeClasses) {
			for (const product of cls.products) {
				map.set(product.id, cls);
			}
		}
		return map;
	}, [activeClasses]);

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

	const productGroups: ProductGroup[] = useMemo(() => {
		/* Filter products by machine/software before grouping */
		const filtered = activeProducts.filter((p) => {
			if (selectedMachine && p.machine !== selectedMachine) return false;
			if (selectedSoftware && p.software !== selectedSoftware) return false;
			return true;
		});

		const map = new Map<string, ProductVariant[]>();
		for (const product of filtered) {
			if (!map.has(product.name)) map.set(product.name, []);
			map.get(product.name)?.push({
				product,
				classInfo: productClassMap.get(product.id),
				systemClasses: productSystemClassesMap.get(product.id),
			});
		}

		const groups: ProductGroup[] = [];
		for (const [name, variants] of map) {
			const sorted = [...variants].sort((a, b) => {
				const aOrder = a.classInfo ? (TIER_ORDER[a.classInfo.tier] ?? 3) : 3;
				const bOrder = b.classInfo ? (TIER_ORDER[b.classInfo.tier] ?? 3) : 3;
				return aOrder - bOrder;
			});
			groups.push({
				name,
				category: sorted[0].product.category,
				variants: sorted,
			});
		}
		return groups;
	}, [
		activeProducts,
		selectedMachine,
		selectedSoftware,
		productClassMap,
		productSystemClassesMap,
	]);

	const categories = useMemo(() => {
		const catMap = new Map<string, ProductGroup[]>();
		for (const group of productGroups) {
			const cat = group.category ?? 'Outros';
			if (!catMap.has(cat)) catMap.set(cat, []);
			catMap.get(cat)?.push(group);
		}
		return Array.from(catMap.entries());
	}, [productGroups]);

	if (isLoading) {
		return (
			<section className="bg-[#0d0d0f] py-20 md:py-32 px-6">
				<div className="max-w-6xl mx-auto flex flex-col items-center justify-center py-20 gap-3">
					<Loader2 className="w-8 h-8 text-[#f2295b] animate-spin" />
					<p className="text-sm text-gray-500">Carregando cursos...</p>
				</div>
			</section>
		);
	}

	if (activeProducts.length === 0) return null;

	return (
		<section
			id="cursos"
			className="relative bg-[#0d0d0f] py-20 md:py-32 px-6 overflow-hidden scroll-mt-20"
		>
			{/* Subtle background glow */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#f2295b]/[0.03] rounded-full blur-3xl pointer-events-none" />

			<div className="relative max-w-6xl mx-auto">
				{/* Section header — estilo da seção de planos */}
				<div className="text-center mb-16">
					<p className="text-[#f2295b] uppercase tracking-widest text-sm font-bold text-center mb-3">
						Nossos cursos
					</p>
					<h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
						Domine a gravação a laser
						<br />
						<span className="text-[#f2295b]">com quem entende do assunto</span>
					</h2>
					<p className="text-gray-400 text-center text-lg mb-12 max-w-3xl mx-auto">
						Escolha o curso ideal para o seu equipamento e nível de experiência.
						Cada curso inclui conteúdo prático, suporte e acesso à comunidade
						exclusiva.
					</p>
				</div>

				{/* Course finder filters */}
				{(machines.length > 0 || softwares.length > 0) && (
					<div className="mb-16">
						<div className="relative bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.08] rounded-3xl p-6 md:p-8 backdrop-blur-sm">
							{/* Glow accent */}
							<div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[#f2295b]/60 to-transparent" />

							<div className="flex items-center gap-3 mb-5">
								<div className="w-10 h-10 rounded-xl bg-[#f2295b]/10 flex items-center justify-center">
									<Search className="w-5 h-5 text-[#f2295b]" />
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

							{/* Result message */}
							{hasFilters && (
								<div className="mt-5 flex items-center gap-3 bg-[#f2295b]/[0.08] border border-[#f2295b]/20 rounded-2xl px-5 py-3.5">
									<Sparkles className="w-5 h-5 text-[#f2295b] shrink-0" />
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
												<span className="text-[#f2295b] font-semibold">
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

				{/* Products by category */}
				{categories.map(([categoryName, groups]) => (
					<div key={categoryName} className="mb-20 last:mb-0">
						{/* Category header */}
						{categories.length > 1 && (
							<div className="flex items-center gap-4 mb-10">
								<div className="flex items-center gap-3">
									<div className="w-1 h-8 rounded-full bg-[#f2295b]" />
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

						{/* Product grid */}
						<div
							className={`grid gap-6 items-start ${
								groups.length === 1
									? 'grid-cols-1 max-w-lg mx-auto'
									: groups.length === 2
										? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
										: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
							}`}
						>
							{groups.map((group, idx) => (
								<ProductCard
									key={group.name}
									variants={group.variants}
									featured={
										groups.length >= 3 && idx === Math.floor(groups.length / 2)
									}
									ownedPlans={ownedPlans ?? []}
								/>
							))}
						</div>
					</div>
				))}

				{/* Trust badges — estilo da seção de planos */}
				<div className="flex items-center justify-center gap-6 mt-10">
					<div className="flex items-center gap-2 text-gray-500 text-sm">
						<div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
							<Check className="w-3 h-3 text-emerald-400" />
						</div>
						Compra segura
					</div>
					<div className="text-gray-500 text-sm">Stripe</div>
					<div className="text-gray-500 text-sm">Garantia de 7 dias</div>
				</div>
			</div>
		</section>
	);
}
