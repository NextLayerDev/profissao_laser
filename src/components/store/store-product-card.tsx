'use client';

import {
	ArrowRight,
	BookOpen,
	Check,
	CheckCircle,
	Cpu,
	GraduationCap,
	MessageCircle,
	Monitor,
	Pen,
	Shield,
	Sparkles,
	Star,
	Users,
	X,
	Zap,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useOwnership } from '@/hooks/use-ownership';
import type { FeatureKey } from '@/types/classes';
import type { StoreProductCardProps } from '@/types/components/store-product-card';
import {
	CLASS_FEATURES,
	SYSTEM_EXTRA_FEATURES,
} from '@/utils/constants/class-features';
import { TIER_STYLES } from '@/utils/constants/tier-styles';
import { formatCurrency } from '@/utils/format-currency';

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

const ALL_COMPARISON_FEATURES = [...CLASS_FEATURES, ...SYSTEM_EXTRA_FEATURES];

type Variant = StoreProductCardProps['variants'][0];

const CLASS_FEATURE_KEY_SET = new Set<string>(CLASS_FEATURES.map((f) => f.key));

function isFeatureEnabled(key: string, variant: Variant): boolean {
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

function computeActiveFeatureKeys(variants: Variant[]) {
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

/* ─── Single variant column ─── */

function StoreVariantColumn({
	variant,
	allVariants,
	variantIndex,
	activeFeatureKeys,
	featured,
}: {
	variant: Variant;
	allVariants: Variant[];
	variantIndex: number;
	activeFeatureKeys: typeof ALL_COMPARISON_FEATURES;
	featured: boolean;
}) {
	const router = useRouter();
	const { product, classInfo, systemClasses } = variant;

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
			? 'bg-slate-400/20 text-slate-600 dark:text-slate-300 border border-slate-400/40'
			: classInfo.tier === 'ouro'
				? 'bg-amber-400/20 text-amber-600 dark:text-amber-300 border border-amber-400/40'
				: 'bg-violet-400/20 text-violet-600 dark:text-violet-300 border border-violet-400/40'
		: 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-white/20';

	function handleBuy() {
		router.push(`/checkout/${product.slug}?productId=${product.id}`);
	}

	const { status: ownershipStatus } = useOwnership(allVariants, variantIndex);

	return (
		<div
			className={`relative flex flex-col flex-1 min-w-[200px] rounded-xl border p-4 transition-all duration-200 ${
				featured
					? 'bg-violet-50 dark:bg-[#1a1a2e] border-2 border-violet-500/60 dark:border-violet-500/50 shadow-lg shadow-violet-500/10'
					: 'bg-white dark:bg-[#1a1a1d] border-slate-200 dark:border-gray-800 hover:border-violet-500/30 dark:hover:border-violet-500/30'
			}`}
		>
			{/* Featured badge */}
			{featured && (
				<div className="flex items-center gap-1.5 bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm self-start mb-3">
					<Sparkles className="w-2.5 h-2.5" />
					Mais popular
				</div>
			)}

			{/* Tier badge + subtitle */}
			<div className="mb-3">
				<div
					className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mb-1.5 ${badgeClass}`}
				>
					<GraduationCap className="w-3 h-3" />
					{columnLabel}
				</div>
				<p className="text-[11px] text-slate-500 dark:text-gray-400">
					{columnSubtitle}
				</p>
			</div>

			{/* Feature list */}
			<div className="space-y-1.5 mb-4 flex-1">
				{activeFeatureKeys.map((feat) => {
					const enabled = isFeatureEnabled(feat.key, variant);
					const Icon = FEATURE_ICONS[feat.key] ?? Check;
					if (enabled) {
						return (
							<div key={feat.key} className="flex items-center gap-2">
								<div className="w-4 h-4 rounded bg-emerald-500/10 flex items-center justify-center shrink-0">
									<Icon className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" />
								</div>
								<span className="text-xs text-slate-700 dark:text-gray-300 font-medium">
									{feat.label}
								</span>
							</div>
						);
					}
					return (
						<div key={feat.key} className="flex items-center gap-2 opacity-40">
							<div className="w-4 h-4 rounded bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
								<X className="w-2.5 h-2.5 text-slate-400 dark:text-gray-600" />
							</div>
							<span className="text-xs text-slate-400 dark:text-gray-600 line-through">
								{feat.label}
							</span>
						</div>
					);
				})}
			</div>

			{/* Price + CTA */}
			<div className="border-t border-slate-200 dark:border-gray-800 pt-3 mt-auto">
				{product.refundDays && (
					<span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mb-2">
						<Shield className="w-2.5 h-2.5" />
						{product.refundDays} dias de garantia
					</span>
				)}
				<p className="text-xs text-slate-500 dark:text-gray-500 mb-0.5">
					Por apenas
				</p>
				<p className="text-xl font-bold text-slate-900 dark:text-white mb-3">
					{formatCurrency(product.price, 'BRL')}
				</p>

				{ownershipStatus === 'owned' ? (
					<button
						type="button"
						disabled
						className="w-full flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold py-2.5 rounded-lg cursor-not-allowed text-sm"
					>
						<CheckCircle className="w-3.5 h-3.5" />
						Já possui
					</button>
				) : (
					<button
						type="button"
						onClick={handleBuy}
						className={`w-full flex items-center justify-center gap-1.5 font-semibold py-2.5 rounded-lg transition-colors duration-200 cursor-pointer text-sm ${
							featured
								? 'bg-violet-600 hover:bg-violet-500 text-white'
								: 'bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-900 dark:text-white'
						}`}
					>
						{ownershipStatus === 'upgrade' ? 'Fazer upgrade' : 'Comprar agora'}
						<ArrowRight className="w-3.5 h-3.5" />
					</button>
				)}
			</div>
		</div>
	);
}

/* ─── Main card (comparison block) ─── */

export function StoreProductCard({ variants }: StoreProductCardProps) {
	const [imgError, setImgError] = useState(false);
	const firstProduct = variants[0].product;

	const activeFeatureKeys = computeActiveFeatureKeys(variants);

	return (
		<div className="bg-white dark:bg-[#111113] rounded-2xl overflow-hidden border border-slate-200 dark:border-gray-800 shadow-sm dark:shadow-none">
			{/* Product header */}
			<div className="flex items-start gap-4 p-5 border-b border-slate-200 dark:border-gray-800">
				{/* Thumbnail */}
				<div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500">
					{firstProduct.image && !imgError ? (
						<Image
							src={firstProduct.image}
							alt={firstProduct.name}
							fill
							className="object-cover"
							onError={() => setImgError(true)}
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center">
							<GraduationCap className="w-8 h-8 text-white/60" />
						</div>
					)}
				</div>

				{/* Info */}
				<div className="flex-1 min-w-0">
					<h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug mb-1">
						{firstProduct.name}
					</h3>
					{firstProduct.description && (
						<p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-2 mb-2">
							{firstProduct.description}
						</p>
					)}
					<div className="flex flex-wrap gap-2">
						{firstProduct.machine && (
							<span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
								<Monitor className="w-3 h-3 text-violet-500" />
								{firstProduct.machine}
							</span>
						)}
						{firstProduct.software && (
							<span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
								<Cpu className="w-3 h-3 text-violet-500" />
								{firstProduct.software}
							</span>
						)}
						{firstProduct.category && (
							<span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
								{firstProduct.category}
							</span>
						)}
					</div>
				</div>

				{/* Rating */}
				<div className="flex items-center gap-1 shrink-0">
					{Array.from({ length: 5 }).map((_, i) => (
						<Star
							// biome-ignore lint/suspicious/noArrayIndexKey: static mock stars
							key={i}
							className="w-3 h-3 fill-yellow-400 text-yellow-400"
						/>
					))}
					<span className="text-xs text-slate-500 dark:text-gray-500 ml-1">
						4.9
					</span>
				</div>
			</div>

			{/* Variant comparison columns */}
			<div className="flex flex-col sm:flex-row gap-3 p-4">
				{variants.map((variant, i) => (
					<StoreVariantColumn
						key={variant.product.id}
						variant={variant}
						allVariants={variants}
						variantIndex={i}
						activeFeatureKeys={activeFeatureKeys}
						featured={i === variants.length - 1}
					/>
				))}
			</div>
		</div>
	);
}
