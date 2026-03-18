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
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useClasses } from '@/hooks/use-classes';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { useProducts } from '@/hooks/use-products';
import { useSystemClasses } from '@/hooks/use-system-classes';
import { getCurrentUser } from '@/lib/auth';
import type { ClassWithProducts, FeatureKey } from '@/types/classes';
import type { CustomerPlan } from '@/types/plans';
import type { Product } from '@/types/products';
import type { SystemClassWithRelations } from '@/types/system-classes';
import {
	CLASS_FEATURES,
	SYSTEM_EXTRA_FEATURES,
} from '@/utils/constants/class-features';
import { TIER_STYLES } from '@/utils/constants/tier-styles';
import { formatCurrency } from '@/utils/format-currency';
import { resolveOwnership, TIER_ORDER } from '@/utils/ownership';

const FEATURE_ICONS: Record<string, typeof BookOpen> = {
	aula: BookOpen,
	chat: MessageCircle,
	vetorizacao: Pen,
	suporte: Zap,
	comunidade: Users,
	sistemaGerenciamento: Sparkles,
	iaPrevias: Sparkles,
	iaWhatsappPrevias: Sparkles,
};

const FEATURE_DESCRIPTIONS: Record<string, string> = {
	aula: 'Aulas completas do básico ao avançado com conteúdo atualizado',
	chat: 'Tire dúvidas em tempo real com nossos especialistas',
	vetorizacao: 'Serviço de vetorização profissional para seus projetos',
	suporte: 'Suporte técnico especializado via WhatsApp e acesso remoto',
	comunidade: 'Acesso ao grupo exclusivo de profissionais do mercado laser',
	sistemaGerenciamento: 'Sistema de gerenciamento integrado à plataforma',
	iaPrevias: 'Geração de prévias automáticas com Inteligência Artificial',
	iaWhatsappPrevias: 'Envio de prévias via WhatsApp com IA integrada',
};

const ALL_COMPARISON_FEATURES = [...CLASS_FEATURES, ...SYSTEM_EXTRA_FEATURES];

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

const CLASS_FEATURE_KEY_SET = new Set<string>(CLASS_FEATURES.map((f) => f.key));

function isFeatureEnabled(key: string, variant: ProductVariant): boolean {
	const { classInfo, systemClasses } = variant;
	const sc = systemClasses?.[0] ?? null;
	if (CLASS_FEATURE_KEY_SET.has(key)) {
		if (classInfo) {
			// Standard course features → from classInfo when present
			return Boolean((classInfo as Record<string, unknown>)[key]);
		}
		// No class tier, but has a system class → course content is included
		return sc != null;
	}
	// System class extra features → from systemClasses[0]
	if (!sc) return false;
	return Boolean((sc as Record<string, unknown>)[key]);
}

function computeActiveFeatureKeys(variants: ProductVariant[]) {
	const hasAnyClassInfo = variants.some((v) => v.classInfo != null);
	const hasAnySystemClass = variants.some(
		(v) => (v.systemClasses?.length ?? 0) > 0,
	);
	return ALL_COMPARISON_FEATURES.filter((feat) => {
		if (CLASS_FEATURE_KEY_SET.has(feat.key as FeatureKey))
			return hasAnyClassInfo || hasAnySystemClass;
		return hasAnySystemClass;
	});
}

/* ─── Variant column card ─── */

function VariantColumn({
	variant,
	activeFeatureKeys,
	featured,
	ownedPlans,
}: {
	variant: ProductVariant;
	activeFeatureKeys: typeof ALL_COMPARISON_FEATURES;
	featured: boolean;
	ownedPlans: CustomerPlan[];
}) {
	const router = useRouter();
	const { product, classInfo, systemClasses } = variant;

	/* Label / badge */
	const tierStyle = classInfo ? TIER_STYLES[classInfo.tier] : null;
	const columnLabel =
		tierStyle?.label ?? systemClasses?.[0]?.name ?? 'Sem plano';
	const columnSubtitle = classInfo
		? `Curso + ${tierStyle?.label ?? classInfo.tier}`
		: systemClasses?.[0]
			? `Curso + ${systemClasses[0].name}`
			: 'Apenas o curso';

	const badgeClass = classInfo
		? classInfo.tier === 'prata'
			? 'bg-slate-400/20 text-slate-200 border border-slate-500/40'
			: classInfo.tier === 'ouro'
				? 'bg-amber-400/20 text-amber-200 border border-amber-500/40'
				: 'bg-violet-400/20 text-violet-200 border border-violet-500/40'
		: 'bg-white/10 text-gray-200 border border-white/20';

	function handleBuy() {
		router.push(`/checkout/${product.slug}?productId=${product.id}`);
	}

	const ownershipStatus = ownedPlans.length
		? resolveOwnership(ownedPlans, [variant], 0)
		: 'none';

	return (
		<div
			className={`relative flex flex-col flex-1 min-w-[240px] rounded-2xl border p-5 transition-all duration-200 ${
				featured
					? 'bg-gradient-to-b from-[#1e1e22] to-[#141416] border-2 border-[#f2295b]/60 shadow-2xl shadow-[#f2295b]/10 md:-mt-4 md:mb-4'
					: 'bg-[#16161a] border border-white/[0.06] hover:border-white/10'
			}`}
		>
			{/* Featured badge */}
			{featured && (
				<div className="flex items-center gap-1.5 bg-[#f2295b] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg shadow-[#f2295b]/30 self-start mb-4">
					<Sparkles className="w-3 h-3" />
					Mais popular
				</div>
			)}

			{/* Tier badge + subtitle */}
			<div className="mb-4">
				<div
					className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-2 ${badgeClass}`}
				>
					<GraduationCap className="w-3.5 h-3.5" />
					{columnLabel}
				</div>
				<p className="text-[12px] text-gray-400">{columnSubtitle}</p>
			</div>

			{/* Feature list */}
			<div className="space-y-2.5 mb-5 flex-1">
				{activeFeatureKeys.map((feat) => {
					const enabled = isFeatureEnabled(feat.key, variant);
					const Icon = FEATURE_ICONS[feat.key] ?? Check;
					if (enabled) {
						return (
							<div key={feat.key} className="flex items-start gap-2.5">
								<div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center mt-0.5 shrink-0">
									<Icon className="w-3 h-3 text-emerald-400" />
								</div>
								<div className="min-w-0">
									<p className="text-sm text-gray-200 font-medium leading-tight">
										{feat.label}
									</p>
									<p className="text-[11px] text-gray-500 leading-snug mt-0.5">
										{FEATURE_DESCRIPTIONS[feat.key]}
									</p>
								</div>
							</div>
						);
					}
					return (
						<div
							key={feat.key}
							className="flex items-center gap-2.5 opacity-40"
						>
							<div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center shrink-0">
								<X className="w-3 h-3 text-gray-600" />
							</div>
							<p className="text-sm text-gray-600 line-through">{feat.label}</p>
						</div>
					);
				})}
			</div>

			{/* Bottom: guarantee + price + CTA */}
			<div className="border-t border-white/[0.06] pt-4 mt-auto">
				{product.refundDays && (
					<div className="flex items-center gap-2 mb-3">
						<Shield className="w-4 h-4 text-emerald-400 shrink-0" />
						<span className="text-xs text-emerald-400/80 font-medium">
							Garantia de {product.refundDays} dias
						</span>
					</div>
				)}

				<p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">
					Investimento
				</p>
				<p className="text-3xl font-black text-white tracking-tight mb-4">
					{formatCurrency(product.price, 'BRL')}
				</p>

				{ownershipStatus === 'owned' ? (
					<button
						type="button"
						disabled
						className="w-full flex items-center justify-center gap-2.5 font-bold py-3.5 rounded-2xl text-[14px] bg-white/[0.05] text-gray-500 cursor-not-allowed"
					>
						<CheckCircle className="w-4 h-4" />
						Já possui
					</button>
				) : (
					<button
						type="button"
						onClick={handleBuy}
						className={`w-full flex items-center justify-center gap-2.5 font-bold py-3.5 rounded-2xl transition-all duration-300 cursor-pointer text-[14px] ${
							featured
								? 'bg-[#f2295b] hover:bg-[#e0214f] text-white shadow-lg shadow-[#f2295b]/20'
								: 'bg-white/[0.07] hover:bg-white/[0.12] text-white'
						}`}
					>
						{ownershipStatus === 'upgrade' ? 'Fazer upgrade' : 'Começar agora'}
						<ArrowRight className="w-4 h-4" />
					</button>
				)}
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
	const hasAutoSelected = useRef(false);

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

	/* Auto-select Fiber + EZCAD on first data load */
	useEffect(() => {
		if (
			!productsLoading &&
			machines.length > 0 &&
			softwares.length > 0 &&
			!hasAutoSelected.current
		) {
			hasAutoSelected.current = true;
			const fiber = machines.find((m) => m.toLowerCase().includes('fiber'));
			const ezcad = softwares.find((s) => s.toLowerCase().includes('ezcad'));
			if (fiber) setSelectedMachine(fiber);
			if (ezcad) setSelectedSoftware(ezcad);
		}
	}, [productsLoading, machines, softwares]);

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
		const filtered = activeProducts.filter((p) => {
			// Products without machine/software are universal — never filtered out
			if (
				selectedMachine &&
				p.machine !== null &&
				p.machine !== selectedMachine
			)
				return false;
			if (
				selectedSoftware &&
				p.software !== null &&
				p.software !== selectedSoftware
			)
				return false;
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
				{/* Section header */}
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
											hasAutoSelected.current = false;
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

						{/* Product groups */}
						{groups.map((group) => {
							const activeFeatureKeys = computeActiveFeatureKeys(
								group.variants,
							);
							return (
								<div key={group.name} className="mb-16 last:mb-0">
									{/* Group header — shown when there are multiple variants */}
									{group.variants.length > 1 && (
										<div className="text-center mb-8">
											<h3 className="text-xl font-bold text-white mb-2">
												{group.name}
											</h3>
											{(group.variants[0].product.machine ||
												group.variants[0].product.software) && (
												<div className="flex items-center justify-center gap-3 flex-wrap">
													{group.variants[0].product.machine && (
														<span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white/[0.05] px-3 py-1.5 rounded-full border border-white/[0.08]">
															<Monitor className="w-3.5 h-3.5 text-violet-400" />
															{group.variants[0].product.machine}
														</span>
													)}
													{group.variants[0].product.software && (
														<span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white/[0.05] px-3 py-1.5 rounded-full border border-white/[0.08]">
															<Cpu className="w-3.5 h-3.5 text-violet-400" />
															{group.variants[0].product.software}
														</span>
													)}
												</div>
											)}
										</div>
									)}

									{/* Variant columns */}
									<div className="flex flex-col sm:flex-row gap-6 items-start justify-center max-w-5xl mx-auto">
										{group.variants.map((variant, i) => (
											<VariantColumn
												key={variant.product.id}
												variant={variant}
												activeFeatureKeys={activeFeatureKeys}
												featured={i === group.variants.length - 1}
												ownedPlans={ownedPlans ?? []}
											/>
										))}
									</div>
								</div>
							);
						})}
					</div>
				))}

				{/* Trust badges */}
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
