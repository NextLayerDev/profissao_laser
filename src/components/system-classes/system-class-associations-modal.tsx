'use client';

import { Layers, Loader2, Package, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useClasses } from '@/hooks/use-classes';
import { useProducts } from '@/hooks/use-products';
import {
	useLinkClass,
	useLinkProduct,
	useUnlinkClass,
	useUnlinkProduct,
} from '@/hooks/use-system-classes';
import type { SystemClassAssociationsModalProps } from '@/types/components/system-class-associations-modal';

export function SystemClassAssociationsModal({
	isOpen,
	onClose,
	systemClass,
}: SystemClassAssociationsModalProps) {
	const { products } = useProducts();
	const { classes } = useClasses();
	const linkProductMutation = useLinkProduct();
	const unlinkProductMutation = useUnlinkProduct();
	const linkClassMutation = useLinkClass();
	const unlinkClassMutation = useUnlinkClass();

	const [selectedProductId, setSelectedProductId] = useState('');
	const [selectedClassId, setSelectedClassId] = useState('');

	if (!isOpen) return null;

	const linkedProductIds = new Set(systemClass.products.map((p) => p.id));
	const linkedClassIds = new Set(systemClass.classes.map((c) => c.id));

	const availableProducts = (products ?? []).filter(
		(p) => p.status === 'ativo' && !linkedProductIds.has(p.id),
	);
	const availableClasses = classes.filter(
		(c) => c.status === 'ativo' && !linkedClassIds.has(c.id),
	);

	async function handleLinkProduct() {
		if (!selectedProductId) return;
		try {
			await linkProductMutation.mutateAsync({
				id: systemClass.id,
				productId: selectedProductId,
			});
			toast.success('Produto vinculado!');
			setSelectedProductId('');
		} catch {
			toast.error('Erro ao vincular produto');
		}
	}

	async function handleUnlinkProduct(productId: string) {
		try {
			await unlinkProductMutation.mutateAsync({
				id: systemClass.id,
				productId,
			});
			toast.success('Produto desvinculado!');
		} catch {
			toast.error('Erro ao desvincular produto');
		}
	}

	async function handleLinkClass() {
		if (!selectedClassId) return;
		try {
			await linkClassMutation.mutateAsync({
				id: systemClass.id,
				classId: selectedClassId,
			});
			toast.success('Classe vinculada!');
			setSelectedClassId('');
		} catch {
			toast.error('Erro ao vincular classe');
		}
	}

	async function handleUnlinkClass(classId: string) {
		try {
			await unlinkClassMutation.mutateAsync({
				id: systemClass.id,
				classId,
			});
			toast.success('Classe desvinculada!');
		} catch {
			toast.error('Erro ao desvincular classe');
		}
	}

	const isLinkingProduct = linkProductMutation.isPending;
	const isLinkingClass = linkClassMutation.isPending;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			>
				<span className="sr-only">Fechar modal</span>
			</button>

			<div className="relative bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-2xl w-full max-w-2xl mx-4 p-6 shadow-2xl max-h-[90vh] flex flex-col">
				<div className="flex items-center justify-between mb-6 shrink-0">
					<div>
						<h2 className="text-xl font-bold text-slate-900 dark:text-white">
							Associações
						</h2>
						<p className="text-sm text-slate-600 dark:text-gray-400 mt-0.5">
							{systemClass.name}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#252528]"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="overflow-y-auto flex-1 space-y-6">
					{/* Produtos */}
					<div>
						<h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 flex items-center gap-2">
							<Package className="w-4 h-4" />
							Produtos vinculados
						</h3>

						{systemClass.products.length > 0 ? (
							<ul className="space-y-2 mb-3">
								{systemClass.products.map((p) => (
									<li
										key={p.id}
										className="flex items-center justify-between gap-3 px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-800 rounded-xl"
									>
										<span className="text-sm text-slate-700 dark:text-gray-300 truncate">
											{p.name}
										</span>
										<button
											type="button"
											onClick={() => handleUnlinkProduct(p.id)}
											disabled={unlinkProductMutation.isPending}
											className="p-1.5 text-slate-400 dark:text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-200 dark:hover:bg-[#252528]"
										>
											<Trash2 className="w-3.5 h-3.5" />
										</button>
									</li>
								))}
							</ul>
						) : (
							<p className="text-xs text-slate-500 dark:text-gray-600 mb-3">
								Nenhum produto vinculado
							</p>
						)}

						<div className="flex items-center gap-2">
							<select
								value={selectedProductId}
								onChange={(e) => setSelectedProductId(e.target.value)}
								className="flex-1 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-gray-300 focus:outline-none focus:border-violet-500/50"
							>
								<option value="">Selecione um produto...</option>
								{availableProducts.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name}
									</option>
								))}
							</select>
							<button
								type="button"
								onClick={handleLinkProduct}
								disabled={!selectedProductId || isLinkingProduct}
								className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
							>
								{isLinkingProduct ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Plus className="w-4 h-4" />
								)}
								Vincular
							</button>
						</div>
					</div>

					{/* Classes */}
					<div>
						<h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 flex items-center gap-2">
							<Layers className="w-4 h-4" />
							Classes vinculadas
						</h3>

						{systemClass.classes.length > 0 ? (
							<ul className="space-y-2 mb-3">
								{systemClass.classes.map((c) => (
									<li
										key={c.id}
										className="flex items-center justify-between gap-3 px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-800 rounded-xl"
									>
										<div className="flex items-center gap-2 truncate">
											<span className="text-sm text-slate-700 dark:text-gray-300 truncate">
												{c.name}
											</span>
											<span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
												{c.tier}
											</span>
										</div>
										<button
											type="button"
											onClick={() => handleUnlinkClass(c.id)}
											disabled={unlinkClassMutation.isPending}
											className="p-1.5 text-slate-400 dark:text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-200 dark:hover:bg-[#252528]"
										>
											<Trash2 className="w-3.5 h-3.5" />
										</button>
									</li>
								))}
							</ul>
						) : (
							<p className="text-xs text-slate-500 dark:text-gray-600 mb-3">
								Nenhuma classe vinculada
							</p>
						)}

						<div className="flex items-center gap-2">
							<select
								value={selectedClassId}
								onChange={(e) => setSelectedClassId(e.target.value)}
								className="flex-1 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-gray-300 focus:outline-none focus:border-violet-500/50"
							>
								<option value="">Selecione uma classe...</option>
								{availableClasses.map((c) => (
									<option key={c.id} value={c.id}>
										{c.name} ({c.tier})
									</option>
								))}
							</select>
							<button
								type="button"
								onClick={handleLinkClass}
								disabled={!selectedClassId || isLinkingClass}
								className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
							>
								{isLinkingClass ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Plus className="w-4 h-4" />
								)}
								Vincular
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
