'use client';

import { Layers, Link2, Package, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useDeleteSystemClass } from '@/hooks/use-system-classes';
import type { SystemClassCardProps } from '@/types/components/system-class-card';
import { SC_OPTIONS } from '@/utils/constants/system-class-options';

export function SystemClassCard({
	systemClass,
	onEdit,
	onManageAssociations,
}: SystemClassCardProps) {
	const [confirming, setConfirming] = useState(false);
	const { mutate: del, isPending } = useDeleteSystemClass();

	function handleDelete() {
		if (!confirming) {
			setConfirming(true);
			return;
		}
		del(systemClass.id, {
			onSuccess: () => toast.success('System class removida'),
			onError: () => toast.error('Erro ao remover system class'),
		});
	}

	const enabledOptions = SC_OPTIONS.filter((o) => systemClass[o.key]);

	return (
		<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl overflow-hidden border border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 transition-all duration-300 shadow-sm dark:shadow-none">
			<div className="h-2 bg-linear-to-r from-violet-700 via-purple-500 to-cyan-400" />

			<div className="p-5">
				<div className="flex items-start justify-between gap-3 mb-3">
					<div>
						<h3 className="text-slate-900 dark:text-white font-semibold text-lg leading-snug">
							{systemClass.name}
						</h3>
						{systemClass.description && (
							<p className="text-sm text-slate-600 dark:text-gray-400 mt-1 line-clamp-2">
								{systemClass.description}
							</p>
						)}
					</div>
					<span
						className={`text-xs px-2 py-1 rounded-full shrink-0 ${
							systemClass.status === 'ativo'
								? 'bg-emerald-500/10 text-emerald-400'
								: 'bg-slate-200 dark:bg-gray-700 text-slate-600 dark:text-gray-400'
						}`}
					>
						{systemClass.status === 'ativo' ? 'Ativo' : 'Inativo'}
					</span>
				</div>

				{enabledOptions.length > 0 && (
					<div className="flex flex-wrap gap-1.5 mb-3">
						{enabledOptions.map((o) => (
							<span
								key={o.key}
								className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20"
							>
								{o.label}
							</span>
						))}
					</div>
				)}

				<div className="mb-4">
					<p className="text-xs text-slate-500 dark:text-gray-500 mb-2 font-medium">
						{systemClass.products.length} produto
						{systemClass.products.length !== 1 ? 's' : ''} incluído
						{systemClass.products.length !== 1 ? 's' : ''}
					</p>
					{systemClass.products.length > 0 ? (
						<ul className="space-y-1">
							{systemClass.products.slice(0, 4).map((p) => (
								<li
									key={p.id}
									className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300"
								>
									<Package className="w-3 h-3 text-slate-400 dark:text-gray-500 shrink-0" />
									<span className="truncate">{p.name}</span>
								</li>
							))}
							{systemClass.products.length > 4 && (
								<li className="text-xs text-slate-500 dark:text-gray-500 pl-5">
									+{systemClass.products.length - 4} mais
								</li>
							)}
						</ul>
					) : (
						<p className="text-xs text-slate-500 dark:text-gray-600">
							Nenhum produto adicionado
						</p>
					)}
				</div>

				<div className="mb-4">
					<p className="text-xs text-slate-500 dark:text-gray-500 mb-2 font-medium">
						{systemClass.classes.length} classe
						{systemClass.classes.length !== 1 ? 's' : ''} vinculada
						{systemClass.classes.length !== 1 ? 's' : ''}
					</p>
					{systemClass.classes.length > 0 ? (
						<ul className="space-y-1">
							{systemClass.classes.slice(0, 4).map((c) => (
								<li
									key={c.id}
									className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300"
								>
									<Layers className="w-3 h-3 text-slate-400 dark:text-gray-500 shrink-0" />
									<span className="truncate">{c.name}</span>
								</li>
							))}
							{systemClass.classes.length > 4 && (
								<li className="text-xs text-slate-500 dark:text-gray-500 pl-5">
									+{systemClass.classes.length - 4} mais
								</li>
							)}
						</ul>
					) : (
						<p className="text-xs text-slate-500 dark:text-gray-600">
							Nenhuma classe vinculada
						</p>
					)}
				</div>

				<div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-gray-800">
					<button
						type="button"
						onClick={() => onEdit(systemClass)}
						className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-[#252528] hover:bg-slate-200 dark:hover:bg-[#2a2a2d] text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors"
					>
						<Pencil className="w-3.5 h-3.5" />
						Editar
					</button>
					<button
						type="button"
						onClick={() => onManageAssociations(systemClass)}
						className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-[#252528] hover:bg-slate-200 dark:hover:bg-[#2a2a2d] text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors"
					>
						<Link2 className="w-3.5 h-3.5" />
					</button>
					<button
						type="button"
						onClick={handleDelete}
						disabled={isPending}
						onBlur={() => setConfirming(false)}
						className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
							confirming
								? 'bg-red-600 hover:bg-red-700 text-white'
								: 'bg-slate-100 dark:bg-[#252528] hover:bg-slate-200 dark:hover:bg-[#2a2a2d] text-slate-600 dark:text-gray-400 hover:text-red-400'
						}`}
					>
						<Trash2 className="w-3.5 h-3.5" />
						{confirming ? 'Confirmar' : ''}
					</button>
				</div>
			</div>
		</div>
	);
}
