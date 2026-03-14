'use client';

import { Package, Pencil, Settings2, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useDeleteClass } from '@/hooks/use-classes';
import type { ClassCardProps } from '@/types/components/class-card';
import { CLASS_FEATURES } from '@/utils/constants/class-features';
import { TIER_STYLES } from '@/utils/constants/tier-styles';

export function ClassCard({ cls, onEdit, systemClasses }: ClassCardProps) {
	const [confirming, setConfirming] = useState(false);
	const { mutate: del, isPending } = useDeleteClass();
	const style = TIER_STYLES[cls.tier];

	const linkedSystemClasses = useMemo(() => {
		if (!systemClasses?.length) return [];
		return systemClasses.filter((sc) =>
			sc.classes.some((c) => c.id === cls.id),
		);
	}, [systemClasses, cls.id]);

	function handleDelete() {
		if (!confirming) {
			setConfirming(true);
			return;
		}
		del(cls.id, {
			onSuccess: () => toast.success('Classe removida'),
			onError: () => toast.error('Erro ao remover classe'),
		});
	}

	return (
		<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl overflow-hidden border border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 transition-all duration-300 shadow-sm dark:shadow-none">
			<div className={`h-2 bg-linear-to-r ${style.gradient}`} />

			<div className="p-5">
				<div className="flex items-start justify-between gap-3 mb-3">
					<div>
						<span
							className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.badge}`}
						>
							{style.label}
						</span>
						<h3 className="text-slate-900 dark:text-white font-semibold mt-2 text-lg leading-snug">
							{cls.name}
						</h3>
					</div>
					<span
						className={`text-xs px-2 py-1 rounded-full shrink-0 ${
							cls.status === 'ativo'
								? 'bg-emerald-500/10 text-emerald-400'
								: 'bg-slate-200 dark:bg-gray-700 text-slate-600 dark:text-gray-400'
						}`}
					>
						{cls.status === 'ativo' ? 'Ativo' : 'Inativo'}
					</span>
				</div>

				{cls.description && (
					<p className="text-sm text-slate-600 dark:text-gray-400 mb-4 line-clamp-2">
						{cls.description}
					</p>
				)}

				{CLASS_FEATURES.some((f) => cls[f.key]) && (
					<div className="flex flex-wrap gap-1.5 mb-3">
						{CLASS_FEATURES.filter((f) => cls[f.key]).map((f) => (
							<span
								key={f.key}
								className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20"
							>
								{f.label}
							</span>
						))}
					</div>
				)}

				<div className="mb-4">
					<p className="text-xs text-slate-500 dark:text-gray-500 mb-2 font-medium">
						{cls.products.length} produto{cls.products.length !== 1 ? 's' : ''}{' '}
						incluído
						{cls.products.length !== 1 ? 's' : ''}
					</p>
					{cls.products.length > 0 ? (
						<ul className="space-y-1">
							{cls.products.slice(0, 4).map((p) => (
								<li
									key={p.id}
									className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300"
								>
									<Package className="w-3 h-3 text-slate-400 dark:text-gray-500 shrink-0" />
									<span className="truncate">{p.name}</span>
								</li>
							))}
							{cls.products.length > 4 && (
								<li className="text-xs text-slate-500 dark:text-gray-500 pl-5">
									+{cls.products.length - 4} mais
								</li>
							)}
						</ul>
					) : (
						<p className="text-xs text-slate-500 dark:text-gray-600">
							Nenhum produto adicionado
						</p>
					)}
				</div>

				{linkedSystemClasses.length > 0 && (
					<div className="mb-4">
						<p className="text-xs text-slate-500 dark:text-gray-500 mb-2 font-medium">
							{linkedSystemClasses.length} classe
							{linkedSystemClasses.length !== 1 ? 's' : ''} de sistema
						</p>
						<div className="flex flex-wrap gap-1.5">
							{linkedSystemClasses.map((sc) => (
								<span
									key={sc.id}
									className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/20"
								>
									<Settings2 className="w-3 h-3 shrink-0" />
									{sc.name}
								</span>
							))}
						</div>
					</div>
				)}

				<div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-gray-800">
					<button
						type="button"
						onClick={() => onEdit(cls)}
						className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-[#252528] hover:bg-slate-200 dark:hover:bg-[#2a2a2d] text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors"
					>
						<Pencil className="w-3.5 h-3.5" />
						Editar
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
						{confirming ? 'Confirmar' : 'Excluir'}
					</button>
				</div>
			</div>
		</div>
	);
}
