'use client';

import { Check, ShieldCheck, Sparkles, Star, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import type { ClassWithProducts } from '@/types/classes';
import type { Product } from '@/types/products';
import type { SystemClassWithRelations } from '@/types/system-classes';
import { CLASS_FEATURES } from '@/utils/constants/class-features';
import { SC_OPTIONS } from '@/utils/constants/system-class-options';
import { formatCurrency } from '@/utils/format-currency';

interface ProductVariant {
	product: Product;
	classInfo?: ClassWithProducts;
	systemClasses?: SystemClassWithRelations[];
}

interface CheckoutProductSummaryProps {
	variants: ProductVariant[];
	selectedIndex: number;
	onSelectIndex: (index: number) => void;
}

export function CheckoutProductSummary({
	variants,
	selectedIndex,
	onSelectIndex,
}: CheckoutProductSummaryProps) {
	const [imgError, setImgError] = useState(false);
	const { product, classInfo, systemClasses } = variants[selectedIndex];
	const systemClass = systemClasses?.[0] ?? null;
	const hasSc = systemClass !== null;
	const hasMultipleVariants = variants.length > 1;

	const enabledClassFeatures = CLASS_FEATURES.filter((f) => classInfo?.[f.key]);
	const disabledClassFeatures = CLASS_FEATURES.filter(
		(f) => !classInfo?.[f.key],
	);

	return (
		<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-gray-800 overflow-hidden">
			{/* Imagem do produto */}
			<div className="relative h-56 bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center">
				{product.image && !imgError ? (
					<Image
						src={product.image}
						alt={product.name}
						fill
						className="object-cover"
						onError={() => setImgError(true)}
					/>
				) : (
					<span className="text-sm text-white/70 px-4 text-center">
						Produto sem imagem
					</span>
				)}
				{product.category && (
					<div className="absolute top-3 left-3">
						<span className="bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
							{product.category}
						</span>
					</div>
				)}
				{hasSc && (
					<div className="absolute top-3 right-3">
						<span className="inline-flex items-center gap-1 bg-violet-600/80 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-violet-400/30">
							<Sparkles className="w-3 h-3" />
							{systemClass.name}
						</span>
					</div>
				)}
			</div>

			<div className="p-6">
				{/* Variant selector tabs */}
				{hasMultipleVariants && (
					<div className="flex gap-2 mb-5 overflow-x-auto pb-1">
						{variants.map((v, i) => {
							const sc = v.systemClasses?.[0] ?? null;
							const label = sc ? sc.name : 'Sem sistema';
							const isActive = i === selectedIndex;
							return (
								<button
									key={v.product.id}
									type="button"
									onClick={() => {
										onSelectIndex(i);
										setImgError(false);
									}}
									className={`flex-shrink-0 px-3 py-2 text-sm font-semibold rounded-lg border transition-all duration-200 cursor-pointer ${
										isActive
											? sc
												? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
												: 'bg-white/10 text-white border-white/20'
											: 'bg-transparent text-slate-500 dark:text-gray-500 border-slate-300 dark:border-gray-700 hover:border-slate-400 dark:hover:border-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
									}`}
								>
									{label}
								</button>
							);
						})}
					</div>
				)}

				{/* Nome e descricao */}
				<h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
					{product.name}
				</h2>
				{hasSc && (
					<p className="text-sm text-violet-400 font-medium mb-2">
						Curso + {systemClass.name}
					</p>
				)}
				{product.description && (
					<p className="text-slate-600 dark:text-gray-400 text-sm mb-5">
						{product.description}
					</p>
				)}

				{/* Features */}
				<div className="mb-5">
					<p className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide mb-3">
						Recursos inclusos
					</p>
					<div className="space-y-2">
						{/* Class features (enabled) */}
						{enabledClassFeatures.map((feat) => (
							<div key={feat.key} className="flex items-center gap-2.5">
								<Check className="w-4 h-4 text-emerald-400 shrink-0" />
								<span className="text-sm text-slate-700 dark:text-gray-200">
									{feat.label}
								</span>
							</div>
						))}

						{/* SC options */}
						{SC_OPTIONS.map((o) => {
							const enabled = hasSc && systemClass[o.key] === true;
							return (
								<div key={o.key} className="flex items-center gap-2.5">
									{enabled ? (
										<Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
									) : (
										<X className="w-4 h-4 text-gray-600 shrink-0" />
									)}
									<span
										className={`text-sm ${
											enabled
												? 'text-violet-400 font-medium'
												: 'text-slate-400 dark:text-gray-600 line-through'
										}`}
									>
										{o.label}
									</span>
								</div>
							);
						})}

						{/* Class features (disabled) */}
						{disabledClassFeatures.map((feat) => (
							<div key={feat.key} className="flex items-center gap-2.5">
								<X className="w-4 h-4 text-gray-600 shrink-0" />
								<span className="text-sm text-slate-400 dark:text-gray-600 line-through">
									{feat.label}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Rating */}
				<div className="flex items-center gap-1 mb-5">
					{Array.from({ length: 5 }).map((_, i) => (
						<Star
							// biome-ignore lint/suspicious/noArrayIndexKey: static mock stars
							key={i}
							className="w-4 h-4 fill-yellow-400 text-yellow-400"
						/>
					))}
					<span className="text-xs text-slate-500 dark:text-gray-500 ml-1">
						(4.9)
					</span>
				</div>

				{/* Preco */}
				<div className="border-t border-slate-200 dark:border-gray-800 pt-5">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs text-slate-500 dark:text-gray-500 mb-0.5">
								Total
							</p>
							<p className="text-3xl font-bold text-slate-900 dark:text-white">
								{formatCurrency(product.price, 'BRL')}
							</p>
						</div>
						{product.refundDays && (
							<div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">
								<ShieldCheck className="w-4 h-4" />
								<span className="text-xs font-medium">
									{product.refundDays} dias de garantia
								</span>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
