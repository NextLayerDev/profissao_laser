'use client';

import {
	ArrowRight,
	BookOpen,
	Check,
	GraduationCap,
	Loader2,
	MessageCircle,
	Pen,
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
import { useProducts } from '@/hooks/use-products';
import type { ClassWithProducts } from '@/types/classes';
import type { Product } from '@/types/products';
import { CLASS_FEATURES } from '@/utils/constants/class-features';
import { TIER_STYLES } from '@/utils/constants/tier-styles';
import { formatCurrency } from '@/utils/format-currency';

const TIER_ORDER: Record<string, number> = { prata: 0, ouro: 1, platina: 2 };

const FEATURE_ICONS: Record<string, typeof BookOpen> = {
	aula: BookOpen,
	chat: MessageCircle,
	vetorizacao: Pen,
	suporte: Zap,
	comunidade: Users,
};

const FEATURE_DESCRIPTIONS: Record<string, string> = {
	aula: 'Aulas completas do basico ao avancado com conteudo atualizado',
	chat: 'Tire duvidas em tempo real com nossos especialistas',
	vetorizacao: 'Servico de vetorizacao profissional para seus projetos',
	suporte: 'Suporte tecnico especializado via WhatsApp e acesso remoto',
	comunidade: 'Acesso ao grupo exclusivo de profissionais do mercado laser',
};

interface ProductVariant {
	product: Product;
	classInfo?: ClassWithProducts;
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
}: {
	variants: ProductVariant[];
	featured?: boolean;
}) {
	const [selectedIndex, setSelectedIndex] = useState(() => {
		if (variants.length <= 1) return 0;
		const ouroIdx = variants.findIndex((v) => v.classInfo?.tier === 'ouro');
		return ouroIdx >= 0 ? ouroIdx : 0;
	});
	const [imgError, setImgError] = useState(false);
	const router = useRouter();

	const { product, classInfo } = variants[selectedIndex];
	const hasMultipleTiers = variants.length > 1;

	function handleBuy() {
		const classParam = classInfo ? `?classId=${classInfo.id}` : '';
		router.push(`/checkout/${product.slug}${classParam}`);
	}

	const enabledFeatures = CLASS_FEATURES.filter((f) => classInfo?.[f.key]);
	const disabledFeatures = CLASS_FEATURES.filter((f) => !classInfo?.[f.key]);

	return (
		<div
			className={`group relative rounded-3xl overflow-hidden transition-all duration-500 flex flex-col ${
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
						Mais popular
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
						Curso profissional completo com conteudo exclusivo para dominar o
						mercado de gravacao a laser.
					</p>
				)}

				{/* Tier selector */}
				{hasMultipleTiers && (
					<div className="mb-5">
						<p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-2.5">
							Nivel de acesso
						</p>
						<div className="grid grid-cols-3 gap-1.5 bg-white/[0.03] p-1 rounded-xl">
							{variants.map((v, i) => {
								const style = v.classInfo
									? TIER_STYLES[v.classInfo.tier]
									: null;
								const label = style?.label ?? 'Padrao';
								const isActive = i === selectedIndex;
								return (
									<button
										key={v.product.id}
										type="button"
										onClick={() => {
											setSelectedIndex(i);
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

				{/* Features — show enabled with details */}
				<div className="space-y-2.5 mb-5 flex-1">
					<p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
						O que esta incluso
					</p>
					{enabledFeatures.map((feat) => {
						const Icon = FEATURE_ICONS[feat.key] ?? Check;
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
					})}
					{disabledFeatures.map((feat) => (
						<div
							key={feat.key}
							className="flex items-center gap-2.5 opacity-40"
						>
							<div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center shrink-0">
								<X className="w-3 h-3 text-gray-600" />
							</div>
							<p className="text-sm text-gray-600 line-through">{feat.label}</p>
						</div>
					))}
				</div>

				{/* Divider + Price */}
				<div className="border-t border-white/[0.06] pt-5 mt-auto">
					{/* Guarantee */}
					{product.refundDays && (
						<div className="flex items-center gap-2 mb-4">
							<Shield className="w-4 h-4 text-emerald-400 shrink-0" />
							<span className="text-xs text-emerald-400/80 font-medium">
								Garantia incondicional de {product.refundDays} dias — sem
								perguntas
							</span>
						</div>
					)}

					{/* Price */}
					<div className="flex items-end justify-between mb-4">
						<div>
							<p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">
								Investimento
							</p>
							<div className="flex items-baseline gap-1">
								<span className="text-3xl font-black text-white tracking-tight">
									{formatCurrency(product.price, 'BRL')}
								</span>
							</div>
						</div>
					</div>

					{/* CTA */}
					<button
						type="button"
						onClick={handleBuy}
						className={`w-full flex items-center justify-center gap-2.5 font-bold py-4 rounded-2xl transition-all duration-300 cursor-pointer text-[15px] ${
							featured
								? 'bg-[#f2295b] hover:bg-[#e0214f] text-white shadow-lg shadow-[#f2295b]/20 hover:shadow-[#f2295b]/30'
								: 'bg-white/[0.07] hover:bg-white/[0.12] text-white'
						}`}
					>
						Comecar agora
						<ArrowRight className="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	);
}

/* ─── Main section ─── */

export function ProductsSection() {
	const { products, isLoading: productsLoading } = useProducts();
	const { classes, isLoading: classesLoading } = useClasses();

	const isLoading = productsLoading || classesLoading;

	const activeProducts = (products ?? []).filter((p) => p.status === 'ativo');
	const activeClasses = classes.filter((c) => c.status === 'ativo');

	const productClassMap = useMemo(() => {
		const map = new Map<string, ClassWithProducts>();
		for (const cls of activeClasses) {
			for (const product of cls.products) {
				map.set(product.id, cls);
			}
		}
		return map;
	}, [activeClasses]);

	const productGroups: ProductGroup[] = useMemo(() => {
		const map = new Map<string, ProductVariant[]>();
		for (const product of activeProducts) {
			if (!map.has(product.name)) map.set(product.name, []);
			map.get(product.name)?.push({
				product,
				classInfo: productClassMap.get(product.id),
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
	}, [activeProducts, productClassMap]);

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

	if (productGroups.length === 0) return null;

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
						Domine a gravacao a laser
						<br />
						<span className="text-[#f2295b]">com quem entende do assunto</span>
					</h2>
					<p className="text-gray-400 text-center text-lg mb-12 max-w-3xl mx-auto">
						Escolha o curso ideal para o seu equipamento e nivel de experiencia.
						Cada curso inclui conteudo pratico, suporte e acesso a comunidade
						exclusiva.
					</p>
				</div>

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
