'use client';

import { Loader2, Plus, Settings2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	useLinkProduct,
	useSystemClasses,
	useUnlinkProduct,
} from '@/hooks/use-system-classes';
import { CLASS_FEATURES } from '@/utils/constants/class-features';

const TIER_BADGES = [
	{
		key: 'prata' as const,
		label: 'Prata',
		style: 'bg-slate-400/20 text-slate-300 border border-slate-500/40',
	},
	{
		key: 'gold' as const,
		label: 'Gold',
		style: 'bg-amber-400/20 text-amber-300 border border-amber-500/40',
	},
	{
		key: 'platina' as const,
		label: 'Platina',
		style: 'bg-violet-400/20 text-violet-300 border border-violet-500/40',
	},
];

interface ProductSystemClassesSectionProps {
	productId: string;
}

export function ProductSystemClassesSection({
	productId,
}: ProductSystemClassesSectionProps) {
	const { systemClasses, isLoading } = useSystemClasses();
	const linkMutation = useLinkProduct();
	const unlinkMutation = useUnlinkProduct();
	const [selectedId, setSelectedId] = useState('');

	const linkedSystemClasses = systemClasses.filter((sc) =>
		sc.products.some((p) => p.id === productId),
	);

	const linkedIds = new Set(linkedSystemClasses.map((sc) => sc.id));
	const availableSystemClasses = systemClasses.filter(
		(sc) => sc.status === 'ativo' && !linkedIds.has(sc.id),
	);

	async function handleLink() {
		if (!selectedId) return;
		try {
			await linkMutation.mutateAsync({ id: selectedId, productId });
			toast.success('System class vinculada ao produto!');
			setSelectedId('');
		} catch {
			toast.error('Erro ao vincular system class');
		}
	}

	async function handleUnlink(systemClassId: string) {
		try {
			await unlinkMutation.mutateAsync({ id: systemClassId, productId });
			toast.success('System class desvinculada!');
		} catch {
			toast.error('Erro ao desvincular system class');
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
			</div>

			{/* Vincular nova system class */}
			<div className="bg-white dark:bg-[#1a1a1d] rounded-xl border border-slate-200 dark:border-gray-800 p-5 mb-6 shadow-sm dark:shadow-none">
				<p className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-3">
					Vincular a uma System Class
				</p>
				<div className="flex items-center gap-2">
					<select
						value={selectedId}
						onChange={(e) => setSelectedId(e.target.value)}
						className="flex-1 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-gray-300 focus:outline-none focus:border-violet-500/50"
					>
						<option value="">Selecione uma system class...</option>
						{availableSystemClasses.map((sc) => (
							<option key={sc.id} value={sc.id}>
								{sc.name}
							</option>
						))}
					</select>
					<button
						type="button"
						onClick={handleLink}
						disabled={!selectedId || linkMutation.isPending}
						className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
					>
						{linkMutation.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Plus className="w-4 h-4" />
						)}
						Vincular
					</button>
				</div>
			</div>

			{/* Lista de system classes vinculadas */}
			{linkedSystemClasses.length === 0 ? (
				<div className="text-center py-12 bg-white dark:bg-[#1a1a1d] rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm dark:shadow-none">
					<Settings2 className="w-10 h-10 text-slate-400 dark:text-gray-700 mx-auto mb-3" />
					<p className="text-slate-600 dark:text-gray-400 font-medium">
						Nenhuma system class vinculada
					</p>
					<p className="text-sm text-slate-500 dark:text-gray-600 mt-1">
						Vincule este produto a uma system class para configurar acessos.
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{linkedSystemClasses.map((sc) => {
						const enabledFeatures = CLASS_FEATURES.filter((f) => sc[f.key]);
						const enabledTiers = TIER_BADGES.filter((t) => sc[t.key]);

						return (
							<div
								key={sc.id}
								className="bg-white dark:bg-[#1a1a1d] rounded-xl border border-slate-200 dark:border-gray-800 p-5 shadow-sm dark:shadow-none"
							>
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-2">
											<h3 className="font-semibold text-slate-900 dark:text-white truncate">
												{sc.name}
											</h3>
											<span
												className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
													sc.status === 'ativo'
														? 'bg-emerald-500/10 text-emerald-400'
														: 'bg-slate-200 dark:bg-gray-700 text-slate-600 dark:text-gray-400'
												}`}
											>
												{sc.status === 'ativo' ? 'Ativo' : 'Inativo'}
											</span>
										</div>

										{sc.description && (
											<p className="text-sm text-slate-600 dark:text-gray-400 mb-3 line-clamp-1">
												{sc.description}
											</p>
										)}

										<div className="flex flex-wrap gap-1.5">
											{enabledFeatures.map((f) => (
												<span
													key={f.key}
													className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20"
												>
													{f.label}
												</span>
											))}
											{enabledTiers.map((t) => (
												<span
													key={t.key}
													className={`text-xs px-2 py-0.5 rounded-full ${t.style}`}
												>
													{t.label}
												</span>
											))}
										</div>
									</div>

									<button
										type="button"
										onClick={() => handleUnlink(sc.id)}
										disabled={unlinkMutation.isPending}
										className="p-2 text-slate-400 dark:text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#252528] shrink-0"
										title="Desvincular"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
