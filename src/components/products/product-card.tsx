'use client';

import { Link2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { ProductCardProps } from '@/types/components/product-card';
import { formatCurrency } from '@/utils/format-currency';
import { DeleteProductModal } from './delete-product-modal';

export function ProductCard({ product }: ProductCardProps) {
	const [imgError, setImgError] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	return (
		<>
			<Link
				href={`/products/${product.id}`}
				className="bg-[#1a1a1d] rounded-2xl overflow-hidden border border-violet-500/30 hover:border-violet-500/60 transition-all duration-300 hover:scale-[1.02] block"
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
					<h3 className="font-semibold text-white mb-2">{product.name}</h3>
					<p className="text-sm text-gray-400 mb-4 line-clamp-2">
						{product.description}
					</p>

					<div className="border-t border-gray-800 pt-4">
						<div className="flex items-center justify-between">
							<div className="text-sm">
								<span className="text-gray-500">Preço: </span>
								<span className="text-white font-medium">
									{formatCurrency(product.price, 'BRL')}
								</span>
							</div>
							<div className="flex items-center gap-1">
								<button
									type="button"
									className="p-2 text-gray-500 hover:text-white transition-colors"
									onClick={(e) => e.stopPropagation()}
								>
									<Link2 className="w-4 h-4" />
								</button>
								<button
									type="button"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										setShowDeleteModal(true);
									}}
									className="p-2 text-gray-500 hover:text-red-400 transition-colors"
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
		</>
	);
}
