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
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
			<div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-md mx-4 p-6">
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-2 text-red-400">
						<AlertTriangle size={18} />
						<h2 className="text-base font-semibold">Excluir produto</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-gray-400 hover:text-white transition-colors"
					>
						<X size={18} />
					</button>
				</div>

				<p className="text-gray-300 text-sm mb-1">
					Tem certeza que deseja excluir o produto:
				</p>
				<p className="text-white font-semibold mb-4">"{product.name}"</p>
				<p className="text-gray-500 text-sm mb-6">
					Esta ação não pode ser desfeita. Todos os módulos, aulas e materiais
					associados serão removidos permanentemente.
				</p>

				<div className="flex justify-end gap-3">
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="px-4 py-2 text-sm rounded-lg border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50"
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
