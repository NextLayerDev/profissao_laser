'use client';

import { Copy, Layers, Link2, Settings2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import type { ProductCardProps } from '@/types/components/product-card';
import { TIER_STYLES } from '@/utils/constants/tier-styles';
import { formatCurrency } from '@/utils/format-currency';
import { DeleteProductModal } from './delete-product-modal';
import { DuplicateProductModal } from './duplicate-product-modal';

export function ProductCard({
	product,
	productClasses,
	productSystemClasses,
}: ProductCardProps) {
	const { canPrice } = usePermissions();
	const [imgError, setImgError] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showDuplicateModal, setShowDuplicateModal] = useState(false);

	return (
		<>
			<Link
				href={`/products/${product.id}`}
				className="bg-white dark:bg-[#1a1a1d] rounded-2xl overflow-hidden border border-slate-200 dark:border-violet-500/30 hover:border-violet-500/60 transition-all duration-300 hover:scale-[1.02] block shadow-sm dark:shadow-none"
			>
				<div className="relative h-44 bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center">
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
					{product.status === 'inativo' && (
						<span className="absolute top-2 right-2 bg-gray-900/80 text-gray-300 text-xs px-2 py-1 rounded-full">
							Inativo
						</span>
					)}
				</div>

				<div className="p-4">
					<h3 className="font-semibold text-slate-900 dark:text-white mb-2">
						{product.name}
					</h3>
					{productClasses && productClasses.length > 0 && (
						<div className="flex flex-wrap gap-1.5 mb-2">
							{productClasses.map((cls) => {
								const style = TIER_STYLES[cls.tier];
								return (
									<span
										key={cls.id}
										className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${style.badge}`}
										title={cls.name}
									>
										<Layers className="w-3 h-3 shrink-0" />
										{cls.name}
									</span>
								);
							})}
						</div>
					)}
					{productSystemClasses && productSystemClasses.length > 0 && (
						<div className="mb-2">
							<div className="flex items-center gap-1 mb-1">
								<Settings2 className="w-3 h-3 text-purple-400" />
								<span className="text-[10px] font-medium text-slate-500 dark:text-gray-500 uppercase tracking-wider">
									Sistema LaserOne
								</span>
							</div>
							<div className="flex flex-wrap gap-1.5">
								{productSystemClasses.map((sc) => (
									<span
										key={sc.id}
										className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/20"
										title={sc.name}
									>
										{sc.name}
									</span>
								))}
							</div>
						</div>
					)}
					<p className="text-sm text-slate-600 dark:text-gray-400 mb-4 line-clamp-2">
						{product.description}
					</p>

					<div className="border-t border-slate-200 dark:border-gray-800 pt-4">
						<div className="flex items-center justify-between">
							{canPrice ? (
								<div className="text-sm">
									<span className="text-slate-500 dark:text-gray-500">
										Preço:{' '}
									</span>
									<span className="text-slate-900 dark:text-white font-medium">
										{formatCurrency(product.price, 'BRL')}
									</span>
								</div>
							) : (
								<div />
							)}
							<div className="flex items-center gap-1">
								<button
									type="button"
									className="p-2 text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors"
									onClick={(e) => e.stopPropagation()}
								>
									<Link2 className="w-4 h-4" />
								</button>
								<button
									type="button"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										setShowDuplicateModal(true);
									}}
									className="p-2 text-slate-500 dark:text-gray-500 hover:text-violet-400 transition-colors"
									title="Duplicar produto"
								>
									<Copy className="w-4 h-4" />
								</button>
								<button
									type="button"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										setShowDeleteModal(true);
									}}
									className="p-2 text-slate-500 dark:text-gray-500 hover:text-red-400 transition-colors"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</Link>

			{showDeleteModal && (
				<DeleteProductModal
					product={product}
					onClose={() => setShowDeleteModal(false)}
				/>
			)}

			{showDuplicateModal && (
				<DuplicateProductModal
					product={product}
					productClasses={productClasses}
					onClose={() => setShowDuplicateModal(false)}
				/>
			)}
		</>
	);
}
