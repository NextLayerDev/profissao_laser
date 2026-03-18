'use client';

import { Check, Loader2, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	useLinkProduct,
	useSystemClasses,
	useUnlinkProduct,
} from '@/hooks/use-system-classes';
import { SC_OPTIONS } from '@/utils/constants/system-class-options';

interface ProductSystemClassesSectionProps {
	productId: string;
}

export function ProductSystemClassesSection({
	productId,
}: ProductSystemClassesSectionProps) {
	const { systemClasses, isLoading } = useSystemClasses();
	const linkMutation = useLinkProduct();
	const unlinkMutation = useUnlinkProduct();
	const [togglingId, setTogglingId] = useState<string | null>(null);

	const linkedIds = new Set(
		systemClasses
			.filter((sc) => sc.products.some((p) => p.id === productId))
			.map((sc) => sc.id),
	);

	const allActiveSystemClasses = systemClasses
		.filter((sc) => sc.status === 'ativo')
		.sort((a, b) => {
			const aLinked = linkedIds.has(a.id) ? 0 : 1;
			const bLinked = linkedIds.has(b.id) ? 0 : 1;
			return aLinked - bLinked;
		});

	async function handleToggle(systemClassId: string) {
		setTogglingId(systemClassId);
		try {
			if (linkedIds.has(systemClassId)) {
				await unlinkMutation.mutateAsync({
					id: systemClassId,
					productId,
				});
				toast.success('System class desvinculada!');
			} else {
				await linkMutation.mutateAsync({
					id: systemClassId,
					productId,
				});
				toast.success('System class vinculada ao produto!');
			}
		} catch {
			toast.error('Erro ao alterar vinculação');
		} finally {
			setTogglingId(null);
		}
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	return (
		<div>
			<div className="mb-6">
				<h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
					Classes do Sistema
				</h2>
				<p className="text-sm text-slate-600 dark:text-gray-400">
					Vincule este produto a system classes para definir planos de acesso,
					permissões e tiers.
				</p>
				{allActiveSystemClasses.length > 0 && (
					<p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
						{linkedIds.size} de {allActiveSystemClasses.length} vinculada
						{allActiveSystemClasses.length !== 1 ? 's' : ''}
					</p>
				)}
			</div>

			{allActiveSystemClasses.length === 0 ? (
				<div className="text-center py-12 bg-white dark:bg-[#1a1a1d] rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm dark:shadow-none">
					<Settings2 className="w-10 h-10 text-slate-400 dark:text-gray-700 mx-auto mb-3" />
					<p className="text-slate-600 dark:text-gray-400 font-medium">
						Nenhuma system class disponível
					</p>
					<p className="text-sm text-slate-500 dark:text-gray-600 mt-1">
						Crie uma system class ativa para poder vincular a este produto.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{allActiveSystemClasses.map((sc) => {
						const isLinked = linkedIds.has(sc.id);
						const isToggling = togglingId === sc.id;
						const enabledOptions = SC_OPTIONS.filter((o) => sc[o.key]);

						return (
							<button
								key={sc.id}
								type="button"
								onClick={() => handleToggle(sc.id)}
								disabled={togglingId !== null}
								className={`relative text-left p-4 rounded-xl border-2 transition-all duration-200 ${
									isLinked
										? 'bg-violet-500/5 dark:bg-violet-500/10 border-violet-500/50 shadow-sm shadow-violet-500/10'
										: 'bg-white dark:bg-[#1a1a1d] border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 opacity-60 hover:opacity-100'
								} ${togglingId !== null ? 'cursor-wait' : 'cursor-pointer'}`}
							>
								<div className="absolute top-3 right-3">
									{isToggling ? (
										<Loader2 className="w-4 h-4 animate-spin text-violet-400" />
									) : isLinked ? (
										<div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
											<Check className="w-3 h-3 text-white" />
										</div>
									) : (
										<div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-gray-600" />
									)}
								</div>

								<h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-1 pr-8">
									{sc.name}
								</h4>
								{sc.description && (
									<p className="text-xs text-slate-500 dark:text-gray-500 line-clamp-1 mb-2">
										{sc.description}
									</p>
								)}
								<div className="flex flex-wrap gap-1">
									{enabledOptions.map((o) => (
										<span
											key={o.key}
											className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20"
										>
											{o.label}
										</span>
									))}
								</div>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
