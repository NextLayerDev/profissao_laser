'use client';

import {
	Check,
	Cpu,
	Monitor,
	ShoppingCart,
	Sparkles,
	Star,
	X,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type {
	ProductVariant,
	StoreProductCardProps,
} from '@/types/components/store-product-card';
import { CLASS_FEATURES } from '@/utils/constants/class-features';
import { SC_OPTIONS } from '@/utils/constants/system-class-options';
import { formatCurrency } from '@/utils/format-currency';

/* ─── Pricing column (one per plan variant) ─── */

function PricingColumn({ variant }: { variant: ProductVariant }) {
	const router = useRouter();
	const { product, classInfo, systemClasses } = variant;
	const systemClass = systemClasses?.[0] ?? null;
	const hasSc = systemClass !== null;

	const classFeatures = CLASS_FEATURES.filter((f) => classInfo?.[f.key]);

	function handleBuy() {
		const classParam = classInfo ? `?classId=${classInfo.id}` : '';
		router.push(`/checkout/${product.slug}${classParam}`);
	}

	return (
		<div
			className={`flex flex-col flex-1 min-w-[160px] rounded-xl border p-4 transition-all duration-200 ${
				hasSc
					? 'border-violet-500/40 bg-violet-500/[0.05] dark:bg-violet-500/[0.08]'
					: 'border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-[#111113]'
			}`}
		>
			{/* Plan badge */}
			<div className="mb-3">
				{hasSc ? (
					<span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-violet-600/15 text-violet-600 dark:text-violet-300 border border-violet-500/30">
						<Sparkles className="w-3 h-3" />
						{systemClass.name}
					</span>
				) : (
					<span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-gray-700">
						Sem sistema
					</span>
				)}
				<p className="text-[11px] text-slate-400 dark:text-gray-500 mt-1.5">
					{hasSc ? `Curso + ${systemClass.name}` : 'Curso sem sistema'}
				</p>
			</div>

			{/* Features */}
			<div className="flex-1 space-y-1.5 mb-4">
				{classFeatures.map((f) => (
					<div key={f.key} className="flex items-center gap-1.5">
						<Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
						<span className="text-xs text-slate-600 dark:text-gray-300">
							{f.label}
						</span>
					</div>
				))}
				{SC_OPTIONS.map((o) => {
					const enabled = hasSc && systemClass[o.key] === true;
					return (
						<div
							key={o.key}
							className={`flex items-center gap-1.5 ${enabled ? '' : 'opacity-30'}`}
						>
							{enabled ? (
								<Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />
							) : (
								<X className="w-3.5 h-3.5 text-slate-400 dark:text-gray-600 shrink-0" />
							)}
							<span
								className={`text-xs ${
									enabled
										? 'text-violet-600 dark:text-violet-300 font-medium'
										: 'text-slate-400 dark:text-gray-500 line-through'
								}`}
							>
								{o.label}
							</span>
						</div>
					);
				})}
			</div>

			{/* Price + CTA */}
			<div className="border-t border-slate-200 dark:border-gray-800 pt-3">
				{product.refundDays && (
					<p className="text-[10px] text-emerald-500 dark:text-emerald-400 mb-1.5">
						{product.refundDays} dias de garantia
					</p>
				)}
				<p className="text-[10px] text-slate-400 dark:text-gray-500 mb-0.5">
					Por apenas
				</p>
				<p className="text-xl font-bold text-slate-900 dark:text-white mb-3">
					{formatCurrency(product.price, 'BRL')}
				</p>
				<button
					type="button"
					onClick={handleBuy}
					className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
						hasSc
							? 'bg-violet-600 hover:bg-violet-500 text-white'
							: 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300'
					}`}
				>
					<ShoppingCart className="w-3.5 h-3.5" />
					Comprar agora
				</button>
			</div>
		</div>
	);
}

/* ─── Parent card (shared header + plan columns) ─── */

export function StoreProductCard({ variants }: StoreProductCardProps) {
	const [imgError, setImgError] = useState(false);

	// Sort by price ascending
	const sorted = [...variants].sort(
		(a, b) => a.product.price - b.product.price,
	);
	const { product } = sorted[0];

	return (
		<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl overflow-hidden border border-slate-200 dark:border-gray-800 hover:border-violet-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 shadow-sm dark:shadow-none">
			{/* Shared image header */}
			<div className="relative h-44 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center">
				{product.image && !imgError ? (
					<Image
						src={product.image}
						alt={product.name}
						fill
						className="object-cover"
						onError={() => setImgError(true)}
					/>
				) : (
					<span className="text-sm text-white/60 px-4 text-center">
						{product.name}
					</span>
				)}
				{product.category && (
					<div className="absolute top-3 left-3 z-10">
						<span className="bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
							{product.category}
						</span>
					</div>
				)}
			</div>

			{/* Shared header info */}
			<div className="px-5 pt-4 pb-3">
				<h3 className="font-semibold text-slate-900 dark:text-white text-lg leading-snug mb-1">
					{product.name}
				</h3>
				{product.description && (
					<p className="text-sm text-slate-500 dark:text-gray-400 line-clamp-2 mb-2">
						{product.description}
					</p>
				)}
				{(product.machine || product.software) && (
					<div className="flex flex-wrap gap-2 mb-2">
						{product.machine && (
							<span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-gray-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-full">
								<Monitor className="w-3.5 h-3.5 text-violet-500" />
								{product.machine}
							</span>
						)}
						{product.software && (
							<span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-gray-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-full">
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

			{/* Pricing columns — one per variant, sorted price asc */}
			<div className="flex gap-3 px-5 pb-5 overflow-x-auto">
				{sorted.map((v) => (
					<PricingColumn key={v.product.id} variant={v} />
				))}
			</div>
		</div>
	);
}
