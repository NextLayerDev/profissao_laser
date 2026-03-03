'use client';

import { AlertTriangle, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useDeleteProduct } from '@/hooks/use-products';
import type { Product } from '@/types/products';

interface DeleteProductModalProps {
	product: Product;
	onClose: () => void;
	onDeleted?: () => void;
}

export function DeleteProductModal({
	product,
	onClose,
	onDeleted,
}: DeleteProductModalProps) {
	const { mutate: deleteProduct, isPending } = useDeleteProduct();

	function handleDelete() {
		deleteProduct(product.id, {
			onSuccess: () => {
				toast.success('Produto excluído com sucesso.');
				onDeleted ? onDeleted() : onClose();
			},
			onError: () => {
				toast.error('Erro ao excluir produto.');
			},
		});
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
			<div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl">
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-2 text-red-500 dark:text-red-400">
						<AlertTriangle size={18} />
						<h2 className="text-base font-semibold text-slate-900 dark:text-white">
							Excluir produto
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
					>
						<X size={18} />
					</button>
				</div>

				<p className="text-slate-600 dark:text-gray-300 text-sm mb-1">
					Tem certeza que deseja excluir o produto:
				</p>
				<p className="text-slate-900 dark:text-white font-semibold mb-4">
					"{product.name}"
				</p>
				<p className="text-slate-500 dark:text-gray-500 text-sm mb-6">
					Esta ação não pode ser desfeita. Todos os módulos, aulas e materiais
					associados serão removidos permanentemente.
				</p>

				<div className="flex justify-end gap-3">
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-slate-700 dark:text-white"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={handleDelete}
						disabled={isPending}
						className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors"
					>
						<Trash2 size={14} />
						{isPending ? 'Excluindo...' : 'Excluir produto'}
					</button>
				</div>
			</div>
		</div>
	);
}
