'use client';

import {
	ArrowRight,
	Check,
	ChevronDown,
	Cpu,
	Loader2,
	Monitor,
	Shield,
	Sparkles,
	X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useClasses } from '@/hooks/use-classes';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { useProducts } from '@/hooks/use-products';
import { useSystemClasses } from '@/hooks/use-system-classes';
import { getCurrentUser } from '@/shared/lib/auth';
import type { ClassWithProducts } from '@/types/classes';
import type { Product } from '@/types/products';
import type { SystemClassWithRelations } from '@/types/system-classes';
import { CLASS_FEATURES } from '@/utils/constants/class-features';
import {
	FEATURE_DESCRIPTIONS,
	FEATURE_ICONS,
} from '@/utils/constants/feature-display';
import { SC_OPTIONS } from '@/utils/constants/system-class-options';
import { formatCurrency } from '@/utils/format-currency';
import { type ProductVariantRef, resolveOwnership } from '@/utils/ownership';
import { ScrollReveal, StaggerReveal } from './scroll-reveal';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductVariant {
	product: Product;
	classInfo?: ClassWithProducts;
	systemClasses?: SystemClassWithRelations[];
}

interface ProductGroup {
	name: string;
	image: string | null;
	description: string | null;
	machine: string | null;
	software: string | null;
	refundDays: number | null;
	variants: ProductVariant[];
}

// ─── Featured sparkles ──────────────────────────────────────────────────────

function FeaturedSparkles() {
	const bits = Array.from({ length: 8 }).map((_, i) => ({
		x: 10 + i * 11,
		delay: i * 0.27,
	}));
	return (
		<>
			<div className="orbit">
				{Array.from({ length: 6 }).map((_, i) => {
					const a = (i / 6) * Math.PI * 2;
					return (
						<span
							key={i}
							className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-violet-300 shadow-[0_0_8px_#c4b5fd]"
							style={{
								transform: `translate(${Math.cos(a) * 180}px, ${Math.sin(a) * 220}px)`,
							}}
						/>
					);
				})}
			</div>
			<div className="pointer-events-none absolute -top-1 left-0 right-0 h-10 overflow-visible">
				{bits.map((b, i) => (
					<span
						key={i}
						className="sparkle-bit absolute top-0 w-1 h-1 rounded-full bg-violet-300 shadow-[0_0_6px_#c4b5fd]"
						style={{
							left: `${b.x}%`,
							animationDelay: `${b.delay}s`,
						}}
					/>
				))}
			</div>
		</>
	);
}

// ─── Variant Pricing Card ───────────────────────────────────────────────────

function VariantCard({
	variant,
	featured,
	owned,
	onBuy,
}: {
	variant: ProductVariant;
	featured: boolean;
	owned: boolean;
	onBuy: () => void;
}) {
	const { product, classInfo, systemClasses } = variant;
	const systemClass = systemClasses?.[0] ?? null;
	const hasSc = systemClass !== null;
	const classFeatures = CLASS_FEATURES.filter((f) => classInfo?.[f.key]);

	const tierLabel = hasSc ? systemClass.name : 'Sem sistema';
	const tierDescription = hasSc
		? `Curso + ${systemClass.name}`
		: 'Curso sem sistema';

	return (
		<div
			className={`tile-hairline shine relative rounded-2xl border p-6 flex flex-col transition-all duration-300 ${
				featured
					? 'border-violet-500/50 aura lg:-translate-y-2'
					: 'card-dark hover:border-violet-500/30'
			}`}
			style={
				featured
					? {
							background:
								'linear-gradient(180deg, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0.06) 60%, #15121f 100%)',
						}
					: {}
			}
		>
			{featured && <FeaturedSparkles />}

			{featured && (
				<div className="btn-accent absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full shadow-brand whitespace-nowrap">
					MAIS POPULAR
				</div>
			)}

			{/* Tier name */}
			<div className="relative text-center pt-2">
				{hasSc ? (
					<span
						className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
							featured
								? 'bg-violet-500/20 text-violet-200 border-violet-500/30'
								: 'bg-violet-500/10 text-violet-300 border-violet-500/20'
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
				<h3 className="font-display text-xl font-bold tracking-tight text-white mt-2">
					{tierLabel}
				</h3>
				<p className="text-slate-400 text-[13px] mt-1">{tierDescription}</p>
			</div>

			{/* Price */}
			<div className="relative text-center my-5">
				<div className="font-display text-white text-4xl font-black tracking-tight">
					{formatCurrency(product.price, 'BRL')}
				</div>
				<div className="text-slate-500 text-xs mt-1.5 font-mono">
					Pagamento único
				</div>
			</div>

			{/* Features */}
			<div className="relative border-t border-violet-500/10 pt-5 mb-5 flex-1">
				<div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-3">
					Recursos inclusos
				</div>
				<ul className="space-y-2">
					{classFeatures.map((f) => {
						const Icon = FEATURE_ICONS[f.key] ?? Check;
						return (
							<li key={f.key} className="flex items-start gap-2.5">
								<div
									className={`w-4 h-4 rounded-full mt-0.5 grid place-items-center shrink-0 ${
										featured ? 'bg-violet-400/25' : 'bg-emerald-500/15'
									}`}
								>
									<Icon
										className={`w-2.5 h-2.5 ${featured ? 'text-violet-200' : 'text-emerald-400'}`}
									/>
								</div>
								<div className="min-w-0">
									<span className="text-slate-200 text-[13px] leading-snug">
										{f.label}
									</span>
									<p className="text-[10px] text-slate-500 leading-snug mt-0.5 hidden sm:block">
										{FEATURE_DESCRIPTIONS[f.key]}
									</p>
								</div>
							</li>
						);
					})}

					{/* System class features */}
					{SC_OPTIONS.map((o) => {
						const enabled = hasSc && systemClass[o.key] === true;
						const Icon = FEATURE_ICONS[o.key] ?? Check;
						return (
							<li
								key={o.key}
								className={`flex items-start gap-2.5 ${enabled ? '' : 'opacity-25'}`}
							>
								{enabled ? (
									<div
										className={`w-4 h-4 rounded-full mt-0.5 grid place-items-center shrink-0 ${
											featured ? 'bg-violet-400/25' : 'bg-violet-500/15'
										}`}
									>
										<Icon
											className={`w-2.5 h-2.5 ${featured ? 'text-violet-200' : 'text-violet-400'}`}
										/>
									</div>
								) : (
									<div className="w-4 h-4 rounded-full mt-0.5 grid place-items-center shrink-0 bg-white/[0.03]">
										<X className="w-2.5 h-2.5 text-gray-600" />
									</div>
								)}
								<div className="min-w-0">
									<span
										className={`text-[13px] leading-snug ${
											enabled
												? featured
													? 'text-violet-200 font-medium'
													: 'text-violet-300'
												: 'text-gray-600 line-through'
										}`}
									>
										{o.label}
									</span>
									{enabled && (
										<p className="text-[10px] text-slate-500 leading-snug mt-0.5 hidden sm:block">
											{FEATURE_DESCRIPTIONS[o.key]}
										</p>
									)}
								</div>
							</li>
						);
					})}
				</ul>
			</div>

			{/* CTA */}
			<button
				type="button"
				onClick={owned ? undefined : onBuy}
				disabled={owned}
				className={`relative w-full font-bold uppercase tracking-wider text-[13px] py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
					owned
						? 'bg-emerald-500/[0.08] text-emerald-400 border border-emerald-500/20 cursor-default'
						: featured
							? 'btn-accent text-white shadow-brand'
							: 'bg-white/[0.04] hover:bg-violet-500/10 text-white border border-violet-500/15 hover:border-violet-500/40'
				}`}
			>
				{owned ? (
					<>
						<Check className="w-4 h-4" />
						Seu plano atual
					</>
				) : (
					<>
						Começar agora
						<ArrowRight className="w-4 h-4" />
					</>
				)}
			</button>
		</div>
	);
}

// ─── Filter select ──────────────────────────────────────────────────────────

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
				<Icon className="w-4 h-4 text-violet-400" />
			</div>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full appearance-none bg-white/[0.05] border border-white/[0.1] hover:border-violet-500/40 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 text-white rounded-xl pl-10 pr-10 py-3 text-sm font-medium outline-none transition-all duration-300 cursor-pointer [&>option]:bg-[#16161a] [&>option]:text-white"
			>
				<option value="">{label}</option>
				{options.map((opt) => (
					<option key={opt} value={opt}>
						{opt}
					</option>
				))}
			</select>
			<div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
				<ChevronDown className="w-4 h-4 text-gray-500" />
			</div>
		</div>
	);
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function PricingSection() {
	const router = useRouter();
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

	// ─── Derive machines & softwares ─────────────────────────────────────────

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

	// ─── Auto-select defaults ────────────────────────────────────────────────

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

	// ─── Build relationship maps ─────────────────────────────────────────────

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

	// ─── Group & filter products ─────────────────────────────────────────────

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

		const allGroups: ProductGroup[] = [];
		for (const [name, variants] of map) {
			const sorted = [...variants].sort((a, b) => {
				const aHasSc = (a.systemClasses ?? []).length > 0;
				const bHasSc = (b.systemClasses ?? []).length > 0;
				if (!aHasSc && bHasSc) return -1;
				if (aHasSc && !bHasSc) return 1;
				return a.product.price - b.product.price;
			});
			const primary = sorted[0].product;
			allGroups.push({
				name,
				image: primary.image,
				description: primary.description,
				machine: primary.machine,
				software: primary.software,
				refundDays: primary.refundDays,
				variants: sorted,
			});
		}

		if (!selectedMachine && !selectedSoftware) return allGroups;
		return allGroups.filter((g) =>
			g.variants.some((v) => {
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

	// ─── Ownership ───────────────────────────────────────────────────────────

	const plans = ownedPlans ?? [];

	// ─── Render ──────────────────────────────────────────────────────────────

	if (isLoading) {
		return (
			<section id="planos" className="relative px-5 md:px-8 py-16 md:py-24">
				<div className="max-w-7xl mx-auto flex flex-col items-center justify-center py-20 gap-3">
					<Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
					<p className="text-sm text-gray-500">Carregando planos...</p>
				</div>
			</section>
		);
	}

	if (activeProducts.length === 0) return null;

	const hasFilters = selectedMachine !== '' || selectedSoftware !== '';

	return (
		<section id="planos" className="relative px-5 md:px-8 py-16 md:py-24">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<ScrollReveal className="text-center mb-8">
					<h2 className="font-display text-3xl md:text-[2.5rem] font-black text-white tracking-tight">
						Escolha o curso <span className="grad-brand">ideal para você</span>
					</h2>
					<p className="text-slate-400 mt-3 max-w-2xl mx-auto text-sm">
						Selecione sua máquina e software para ver o curso certo. Cada plano
						inclui acesso à comunidade, suporte e ferramentas exclusivas.
					</p>
				</ScrollReveal>

				{/* Course finder */}
				{(machines.length > 0 || softwares.length > 0) && (
					<ScrollReveal delay={0.1} className="mb-10">
						<div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
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
									className="flex items-center justify-center gap-1.5 text-gray-400 hover:text-white text-sm font-medium px-4 py-3 rounded-xl border border-white/[0.08] hover:border-white/20 transition-all duration-300 cursor-pointer"
								>
									<X className="w-3.5 h-3.5" />
									Limpar
								</button>
							)}
						</div>

						{hasFilters && productGroups.length > 0 && (
							<div className="max-w-2xl mx-auto mt-4 flex items-center gap-2 bg-violet-500/[0.08] border border-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-gray-300">
								<Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
								<span>
									<span className="text-white font-bold">
										{productGroups.length}{' '}
										{productGroups.length === 1
											? 'curso encontrado'
											: 'cursos encontrados'}
									</span>
									{selectedMachine && (
										<>
											{' '}
											para{' '}
											<span className="text-violet-400 font-semibold">
												{selectedMachine}
											</span>
										</>
									)}
									{selectedMachine && selectedSoftware && ' + '}
									{selectedSoftware && (
										<span className="text-violet-400 font-semibold">
											{selectedSoftware}
										</span>
									)}
								</span>
							</div>
						)}

						{hasFilters && productGroups.length === 0 && (
							<div className="max-w-2xl mx-auto mt-4 text-center text-sm text-gray-500">
								Nenhum curso encontrado para essa combinação. Tente ajustar os
								filtros.
							</div>
						)}
					</ScrollReveal>
				)}

				{/* Product groups */}
				{productGroups.map((group) => {
					const variantRefs: ProductVariantRef[] = group.variants.map((v) => ({
						product: v.product,
						classInfo: v.classInfo,
					}));
					const featuredIndex = group.variants.reduce((best, v, i) => {
						if (!v.systemClasses?.[0]) return best;
						return i;
					}, -1);

					const gridCols =
						group.variants.length <= 2
							? 'md:grid-cols-2'
							: group.variants.length === 3
								? 'md:grid-cols-3'
								: 'md:grid-cols-2 lg:grid-cols-4';

					return (
						<div key={group.name} className="mb-14 last:mb-0">
							{/* Group header (show if multiple groups) */}
							{productGroups.length > 1 && (
								<ScrollReveal className="mb-6">
									<div className="flex items-center gap-3">
										<div className="w-1 h-7 rounded-full bg-violet-500" />
										<h3 className="font-display text-lg font-bold text-white">
											{group.name}
										</h3>
										{group.machine && (
											<span className="text-xs text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded-full">
												{group.machine}
												{group.software && ` · ${group.software}`}
											</span>
										)}
									</div>
									{group.description && (
										<p className="text-slate-400 text-sm mt-1 ml-4">
											{group.description}
										</p>
									)}
								</ScrollReveal>
							)}

							{/* Single group — show name prominently */}
							{productGroups.length === 1 && (
								<ScrollReveal className="text-center mb-8">
									<h3 className="font-display text-xl font-bold text-white">
										{group.name}
									</h3>
									{group.description && (
										<p className="text-slate-400 text-sm mt-1">
											{group.description}
										</p>
									)}
								</ScrollReveal>
							)}

							{/* Variant cards */}
							<div className={`grid grid-cols-1 ${gridCols} gap-5`}>
								{group.variants.map((v, i) => (
									<StaggerReveal key={v.product.id} delay={i * 0.08}>
										<VariantCard
											variant={v}
											featured={i === featuredIndex}
											owned={
												resolveOwnership(plans, variantRefs, i) === 'owned'
											}
											onBuy={() =>
												router.push(
													`/checkout/${v.product.slug}?productId=${v.product.id}`,
												)
											}
										/>
									</StaggerReveal>
								))}
							</div>
						</div>
					);
				})}

				{/* Trust badge */}
				{productGroups.length > 0 && (
					<div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10 text-slate-400 text-sm">
						<span className="inline-flex items-center gap-2">
							<Shield size={16} className="text-violet-400" />
							{productGroups[0]?.refundDays
								? `${productGroups[0].refundDays} dias de garantia incondicional. Não gostou? Devolvemos 100% do seu dinheiro.`
								: 'Garantia incondicional. Não gostou? Devolvemos 100% do seu dinheiro.'}
						</span>
					</div>
				)}
			</div>
		</section>
	);
}
