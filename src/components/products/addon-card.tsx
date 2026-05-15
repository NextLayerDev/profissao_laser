'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import type { Product } from '@/types/products';
import { formatCurrency } from '@/utils/format-currency';
import { DeleteProductModal } from './delete-product-modal';

interface AddonCardProps {
	addon: Product;
}

export function AddonCard({ addon }: AddonCardProps) {
	const { canPrice } = usePermissions();
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	return (
		<>
			<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-violet-500/30 hover:border-violet-500/60 transition-all duration-300 p-5 flex flex-col shadow-sm dark:shadow-none">
				<div className="flex items-start justify-between gap-2 mb-2">
					<h3 className="font-semibold text-slate-900 dark:text-white">
						{addon.name}
					</h3>
					<span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-violet-500/40 text-violet-600 dark:text-violet-300 bg-violet-500/10 shrink-0">
						Addon
					</span>
				</div>

				<p className="text-sm text-slate-600 dark:text-gray-400 mb-4 line-clamp-2 flex-1">
					{addon.description ?? 'Sem descrição'}
				</p>

				<div className="border-t border-slate-200 dark:border-gray-800 pt-4 flex items-center justify-between">
					<div className="flex items-center gap-2">
						{canPrice && (
							<div className="text-sm">
								<span className="text-slate-500 dark:text-gray-500">
									Preço:{' '}
								</span>
								<span className="text-slate-900 dark:text-white font-medium">
									{formatCurrency(addon.price, 'BRL')}
								</span>
							</div>
						)}
						{addon.status === 'inativo' && (
							<span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 dark:bg-gray-800 dark:text-gray-400">
								Inativo
							</span>
						)}
					</div>
					<button
						type="button"
						onClick={() => setShowDeleteModal(true)}
						className="p-2 text-slate-500 dark:text-gray-500 hover:text-red-400 transition-colors"
						title="Excluir addon"
					>
						<Trash2 className="w-4 h-4" />
					</button>
				</div>
			</div>

			{showDeleteModal && (
				<DeleteProductModal
					product={addon}
					onClose={() => setShowDeleteModal(false)}
				/>
			)}
		</>
	);
}
