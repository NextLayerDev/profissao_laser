'use client';

import { Check, Loader2, ShoppingCart, Star } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { LoginRequiredModal } from '@/components/store/login-required-modal';
import { usePurchase } from '@/hooks/use-purchase';
import { getCurrentUser } from '@/lib/auth';
import type { StoreProductCardProps } from '@/types/components/store-product-card';
import { CLASS_FEATURES } from '@/utils/constants/class-features';
import { TIER_STYLES } from '@/utils/constants/tier-styles';
import { formatCurrency } from '@/utils/format-currency';

export function StoreProductCard({ variants }: StoreProductCardProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const { mutate: purchase, isPending } = usePurchase();
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [imgError, setImgError] = useState(false);

	const { product, classInfo } = variants[selectedIndex];
	const hasMultipleTiers = variants.length > 1;

	function handleBuy() {
		if (!getCurrentUser()) {
			setShowLoginModal(true);
			return;
		}

		purchase({ productId: product.id });
	}

	const enabledFeatures = classInfo
		? CLASS_FEATURES.filter((f) => classInfo[f.key])
		: [];

	return (
		<>
			<LoginRequiredModal
				isOpen={showLoginModal}
				onClose={() => setShowLoginModal(false)}
			/>
			<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl overflow-hidden border border-slate-200 dark:border-gray-800 hover:border-violet-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 flex flex-col shadow-sm dark:shadow-none">
				<div className="relative h-48 bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center">
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
				</div>

				{hasMultipleTiers && (
					<div className="flex gap-2 px-5 pt-4">
						{variants.map((v, i) => {
							const style = v.classInfo ? TIER_STYLES[v.classInfo.tier] : null;
							const label = style?.label ?? 'Padrão';
							const isActive = i === selectedIndex;
							return (
								<button
									key={v.product.id}
									type="button"
									onClick={() => {
										setSelectedIndex(i);
										setImgError(false);
									}}
									className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 cursor-pointer ${
										isActive
											? (style?.badge ??
												'bg-violet-400/20 text-violet-300 border-violet-500/40')
											: 'bg-transparent text-slate-500 dark:text-gray-500 border-slate-300 dark:border-gray-700 hover:border-slate-400 dark:hover:border-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
									}`}
								>
									{label}
								</button>
							);
						})}
					</div>
				)}

				<div className="p-5 flex flex-col flex-1">
					<h3 className="font-semibold text-slate-900 dark:text-white text-lg leading-snug mb-2">
						{product.name}
					</h3>

					{product.description && (
						<p className="text-sm text-slate-600 dark:text-gray-400 line-clamp-2 mb-3">
							{product.description}
						</p>
					)}

					{enabledFeatures.length > 0 && (
						<div className="mb-4 grid grid-cols-2 gap-x-3 gap-y-1.5">
							{enabledFeatures.map((feat) => (
								<div key={feat.key} className="flex items-center gap-1.5">
									<Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
									<span className="text-xs text-slate-600 dark:text-gray-300">
										{feat.label}
									</span>
								</div>
							))}
						</div>
					)}

					<div className="flex items-center gap-1 mb-4">
						{Array.from({ length: 5 }).map((_, i) => (
							<Star
								// biome-ignore lint/suspicious/noArrayIndexKey: static mock stars
								key={i}
								className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
							/>
						))}
						<span className="text-xs text-slate-500 dark:text-gray-500 ml-1">
							(4.9)
						</span>
					</div>

					<div className="mt-auto border-t border-slate-200 dark:border-gray-800 pt-4">
						<div className="flex items-center justify-between mb-3">
							<div>
								<p className="text-xs text-slate-500 dark:text-gray-500 mb-0.5">
									Por apenas
								</p>
								<p className="text-2xl font-bold text-slate-900 dark:text-white">
									{formatCurrency(product.price, 'BRL')}
								</p>
							</div>
							{product.refundDays && (
								<span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
									{product.refundDays} dias de garantia
								</span>
							)}
						</div>

						<button
							type="button"
							onClick={handleBuy}
							disabled={isPending}
							className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200 cursor-pointer"
						>
							{isPending ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Aguarde...
								</>
							) : (
								<>
									<ShoppingCart className="w-4 h-4" />
									Comprar agora
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
