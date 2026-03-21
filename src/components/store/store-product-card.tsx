'use client';

import {
	ArrowRight,
	BookOpen,
	Check,
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
import type {
	ProductVariant,
	StoreProductCardProps,
} from '@/types/components/store-product-card';
import type { CustomerPlan } from '@/types/plans';
import { CLASS_FEATURES } from '@/utils/constants/class-features';
import { SC_OPTIONS } from '@/utils/constants/system-class-options';
import { formatCurrency } from '@/utils/format-currency';
import {
	type OwnershipStatus,
	type ProductVariantRef,
	resolveOwnership,
} from '@/utils/ownership';

const FEATURE_ICONS: Record<string, typeof BookOpen> = {
	aula: BookOpen,
	chat: MessageCircle,
	vetorizacao: Pen,
	suporte: Zap,
	comunidade: Users,
	gerenciamentoSistema: Shield,
	iaPrevias: Sparkles,
	iaWhatsappPrevias: MessageCircle,
};

const FEATURE_DESCRIPTIONS: Record<string, string> = {
	aula: 'Aulas completas do basico ao avancado com conteudo atualizado',
	chat: 'Tire duvidas em tempo real com nossos especialistas',
	vetorizacao: 'Servico de vetorizacao profissional para seus projetos',
	suporte: 'Suporte tecnico especializado via WhatsApp e acesso remoto',
	comunidade: 'Acesso ao grupo exclusivo de profissionais do mercado laser',
	gerenciamentoSistema: 'Acesso completo ao sistema de gerenciamento',
	iaPrevias: 'Geracao de previas automaticas com Inteligencia Artificial',
	iaWhatsappPrevias: 'Envio de previas via WhatsApp com IA integrada',
};

/* ─── Pricing column (one per plan variant) ─── */

function PricingColumn({
	variant,
	featured,
	ownership,
}: {
	variant: ProductVariant;
	featured?: boolean;
	ownership: OwnershipStatus;
}) {
	const router = useRouter();
	const { product, classInfo, systemClasses } = variant;
	const systemClass = systemClasses?.[0] ?? null;
	const hasSc = systemClass !== null;

	const classFeatures = CLASS_FEATURES.filter((f) => classInfo?.[f.key]);

	function handleBuy() {
		router.push(`/checkout/${product.slug}?productId=${product.id}`);
	}

	const isOwned = ownership === 'owned';

	function renderButton() {
		if (isOwned) {
			return (
				<>
					<Check className="w-4 h-4" />
					Seu plano atual
				</>
			);
		}
		if (ownership === 'upgrade') {
			return (
				<>
					<Sparkles className="w-4 h-4" />
					Evoluir agora
					<ArrowRight className="w-4 h-4" />
				</>
			);
		}
		if (ownership === 'downgrade') {
			return (
				<>
					Trocar plano
					<ArrowRight className="w-4 h-4" />
				</>
			);
		}
		return (
			<>
				Começar agora
				<ArrowRight className="w-4 h-4" />
			</>
		);
	}

	function getButtonClass() {
		const base =
			'w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-sm transition-all duration-300';
		if (isOwned) {
			return `${base} bg-emerald-500/10 dark:bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-default`;
		}
		if (ownership === 'upgrade') {
			return `${base} bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 cursor-pointer`;
		}
		if (ownership === 'downgrade') {
			return `${base} bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-600 dark:text-gray-300 cursor-pointer`;
		}
		if (featured) {
			return `${base} bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 cursor-pointer`;
		}
		if (hasSc) {
			return `${base} bg-violet-600/80 hover:bg-violet-600 text-white cursor-pointer`;
		}
		return `${base} bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-white cursor-pointer`;
	}

	return (
		<div
			className={`flex flex-col flex-1 sm:min-w-[165px] rounded-2xl border p-4 transition-all duration-200 ${
				featured
					? 'border-violet-500/50 bg-violet-500/[0.05] dark:bg-violet-500/[0.08] shadow-lg shadow-violet-500/10'
					: hasSc
						? 'border-violet-500/30 bg-violet-500/[0.03] dark:bg-violet-500/[0.06]'
						: 'border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.03]'
			}`}
		>
			{/* Plan badge */}
			<div className="mb-3">
				{featured && (
					<div className="flex items-center gap-1 mb-2">
						<Sparkles className="w-3 h-3 text-violet-500 dark:text-violet-400" />
						<span className="text-[10px] font-bold uppercase tracking-wider text-violet-500 dark:text-violet-400">
							Mais popular
						</span>
					</div>
				)}
				{hasSc ? (
					<span
						className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
							featured
								? 'bg-violet-600/15 text-violet-600 dark:text-violet-300 border-violet-500/30'
								: 'bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30'
						}`}
					>
						<Sparkles className="w-3 h-3" />
						{systemClass.name}
					</span>
				) : (
					<span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-white/[0.08]">
						Sem sistema
					</span>
				)}
				<p className="text-[11px] text-slate-400 dark:text-gray-500 mt-1.5">
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
								<Icon className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" />
							</div>
							<div className="min-w-0">
								<p className="text-xs text-slate-700 dark:text-gray-200 font-medium leading-tight">
									{f.label}
								</p>
								<p className="text-[10px] text-slate-400 dark:text-gray-500 leading-snug mt-0.5 hidden sm:block">
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
										featured
											? 'bg-violet-500/15'
											: 'bg-violet-500/10 dark:bg-violet-500/15'
									}`}
								>
									<Icon
										className={`w-2.5 h-2.5 ${featured ? 'text-violet-500 dark:text-violet-400' : 'text-violet-500 dark:text-violet-400'}`}
									/>
								</div>
							) : (
								<div className="w-4 h-4 rounded-md bg-slate-100 dark:bg-white/[0.03] flex items-center justify-center mt-0.5 shrink-0">
									<X className="w-2.5 h-2.5 text-slate-400 dark:text-gray-600" />
								</div>
							)}
							<div className="min-w-0">
								<p
									className={`text-xs font-medium leading-tight ${
										enabled
											? 'text-violet-600 dark:text-violet-300'
											: 'text-slate-400 dark:text-gray-600 line-through'
									}`}
								>
									{o.label}
								</p>
								{enabled && (
									<p className="text-[10px] text-slate-400 dark:text-gray-500 leading-snug mt-0.5 hidden sm:block">
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
					featured
						? 'border-violet-500/20'
						: 'border-slate-200 dark:border-white/[0.06]'
				}`}
			>
				{product.refundDays && (
					<div className="flex items-center gap-1.5 mb-3">
						<Shield className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
						<span className="text-[10px] text-emerald-600 dark:text-emerald-400/80 font-medium">
							Garantia de {product.refundDays} dias
						</span>
					</div>
				)}
				<p className="text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1">
					Investimento
				</p>
				<p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
					{formatCurrency(product.price, 'BRL')}
				</p>
				<button
					type="button"
					onClick={isOwned ? undefined : handleBuy}
					disabled={isOwned}
					className={getButtonClass()}
				>
					{renderButton()}
				</button>
			</div>
		</div>
	);
}

/* ─── Parent card (shared header + plan columns) ─── */

export function StoreProductCard({
	variants,
	ownedPlans,
}: StoreProductCardProps) {
	const [imgError, setImgError] = useState(false);

	// Sort by price ascending
	const sorted = [...variants].sort(
		(a, b) => a.product.price - b.product.price,
	);
	const { product } = sorted[0];

	// Featured = most expensive plan with a SC (last SC variant after price sort)
	const featuredIndex = sorted.reduce((best, v, i) => {
		if (!v.systemClasses?.[0]) return best;
		return i;
	}, -1);

	// Compute ownership for each variant
	const plans = ownedPlans ?? [];
	const variantRefs: ProductVariantRef[] = sorted.map((v) => ({
		product: v.product,
		classInfo: v.classInfo,
	}));

	return (
		<div className="group relative bg-white dark:bg-[#16161a] rounded-3xl overflow-hidden border border-slate-200 dark:border-white/[0.06] hover:border-violet-500/40 dark:hover:border-white/10 transition-all duration-500 shadow-sm dark:shadow-none">
			{/* Shared image header */}
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
						<div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#16161a] via-white/40 dark:via-[#16161a]/40 to-transparent" />
					</>
				) : (
					<div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500">
						<div className="absolute inset-0 flex items-center justify-center">
							<GraduationCap className="w-16 h-16 text-white/10" />
						</div>
					</div>
				)}
				{product.category && (
					<div className="absolute top-4 left-4 z-10">
						<span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/10">
							{product.category}
						</span>
					</div>
				)}
				<div className="absolute bottom-0 left-0 right-0 p-5 z-10">
					<h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight drop-shadow-lg">
						{product.name}
					</h3>
				</div>
			</div>

			{/* Shared body info */}
			<div className="px-5 pt-3 pb-2">
				{product.description && (
					<p className="text-[13px] text-slate-500 dark:text-gray-400 leading-relaxed line-clamp-2 mb-3">
						{product.description}
					</p>
				)}
				{(product.machine || product.software) && (
					<div className="flex flex-wrap gap-2 mb-2">
						{product.machine && (
							<span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-gray-400 bg-slate-100 dark:bg-white/[0.05] px-2.5 py-1 rounded-full">
								<Monitor className="w-3.5 h-3.5 text-violet-500" />
								{product.machine}
							</span>
						)}
						{product.software && (
							<span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-gray-400 bg-slate-100 dark:bg-white/[0.05] px-2.5 py-1 rounded-full">
								<Cpu className="w-3.5 h-3.5 text-violet-500" />
								{product.software}
							</span>
						)}
					</div>
				)}
				<div className="flex items-center gap-0.5 mb-1">
					{Array.from({ length: 5 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static mock stars
						<Star
							key={i}
							className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
						/>
					))}
					<span className="text-xs text-slate-400 dark:text-gray-500 ml-1">
						(4.9)
					</span>
				</div>
			</div>

			{/* Pricing columns — responsive: stack on mobile, side-by-side on desktop */}
			<div className="flex flex-col sm:flex-row gap-3 px-5 pb-5 pt-3">
				{sorted.map((v, i) => (
					<PricingColumn
						key={v.product.id}
						variant={v}
						featured={i === featuredIndex}
						ownership={resolveOwnership(plans, variantRefs, i)}
					/>
				))}
			</div>
		</div>
	);
}
