'use client';

import { Package, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useDeleteClass } from '@/hooks/use-classes';
import type { ClassWithProducts } from '@/types/classes';

const TIER_STYLES = {
	prata: {
		gradient: 'from-slate-600 to-slate-400',
		badge: 'bg-slate-400/20 text-slate-300 border border-slate-500/40',
		label: 'Prata',
	},
	ouro: {
		gradient: 'from-amber-600 to-yellow-400',
		badge: 'bg-amber-400/20 text-amber-300 border border-amber-500/40',
		label: 'Ouro',
	},
	platina: {
		gradient: 'from-violet-600 to-cyan-400',
		badge: 'bg-violet-400/20 text-violet-300 border border-violet-500/40',
		label: 'Platina',
	},
};

interface ClassCardProps {
	cls: ClassWithProducts;
	onEdit: (cls: ClassWithProducts) => void;
}

export function ClassCard({ cls, onEdit }: ClassCardProps) {
	const [confirming, setConfirming] = useState(false);
	const { mutate: del, isPending } = useDeleteClass();
	const style = TIER_STYLES[cls.tier];

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
		<div className="bg-[#1a1a1d] rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-300">
			<div className={`h-2 bg-linear-to-r ${style.gradient}`} />

			<div className="p-5">
				<div className="flex items-start justify-between gap-3 mb-3">
					<div>
						<span
							className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.badge}`}
						>
							{style.label}
						</span>
						<h3 className="text-white font-semibold mt-2 text-lg leading-snug">
							{cls.name}
						</h3>
					</div>
					<span
						className={`text-xs px-2 py-1 rounded-full shrink-0 ${
							cls.status === 'ativo'
								? 'bg-emerald-500/10 text-emerald-400'
								: 'bg-gray-700 text-gray-400'
						}`}
					>
						{cls.status === 'ativo' ? 'Ativo' : 'Inativo'}
					</span>
				</div>

				{cls.description && (
					<p className="text-sm text-gray-400 mb-4 line-clamp-2">
						{cls.description}
					</p>
				)}

				<div className="mb-4">
					<p className="text-xs text-gray-500 mb-2 font-medium">
						{cls.products.length} produto{cls.products.length !== 1 ? 's' : ''}{' '}
						incluído
						{cls.products.length !== 1 ? 's' : ''}
					</p>
					{cls.products.length > 0 ? (
						<ul className="space-y-1">
							{cls.products.slice(0, 4).map((p) => (
								<li
									key={p.id}
									className="flex items-center gap-2 text-sm text-gray-300"
								>
									<Package className="w-3 h-3 text-gray-500 shrink-0" />
									<span className="truncate">{p.name}</span>
								</li>
							))}
							{cls.products.length > 4 && (
								<li className="text-xs text-gray-500 pl-5">
									+{cls.products.length - 4} mais
								</li>
							)}
						</ul>
					) : (
						<p className="text-xs text-gray-600">Nenhum produto adicionado</p>
					)}
				</div>

				<div className="flex items-center gap-2 pt-4 border-t border-gray-800">
					<button
						type="button"
						onClick={() => onEdit(cls)}
						className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium bg-[#252528] hover:bg-[#2a2a2d] text-gray-300 hover:text-white transition-colors"
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
								: 'bg-[#252528] hover:bg-[#2a2a2d] text-gray-400 hover:text-red-400'
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
