'use client';

import { Gift, Layers, Loader2, Lock } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { useToolCategories } from '../hooks/use-tool-categories';
import type { ToolCategoryDTO } from '../services/tool-categories.service';

function CategoryFreeToggle({
	category,
	onToggle,
	disabled,
}: {
	category: ToolCategoryDTO;
	onToggle: () => void;
	disabled: boolean;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={category.is_free}
			aria-label={
				category.is_free
					? `Tornar a aba "${category.label}" paga`
					: `Tornar a aba "${category.label}" grátis`
			}
			disabled={disabled}
			onClick={onToggle}
			className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait ${
				category.is_free ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'
			}`}
		>
			<span
				className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
					category.is_free ? 'translate-x-5' : 'translate-x-0'
				}`}
			/>
		</button>
	);
}

export function FreeToolCategoriesAdminSection() {
	const { categories, isLoading, update } = useToolCategories();
	const [pendingId, setPendingId] = useState<string | null>(null);

	if (isLoading) {
		return (
			<div className="flex justify-center py-16">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (categories.length === 0) {
		return (
			<EmptyState
				icon={Layers}
				title="Nenhuma aba cadastrada"
				description="Crie categorias na tela de ferramentas para liberá-las aqui."
			/>
		);
	}

	return (
		<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
			{categories.map((category) => (
				<div key={category.id} className="flex items-center gap-3 px-4 py-3">
					{category.is_free ? (
						<Gift className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
					) : (
						<Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
					)}
					<span className="flex-1 min-w-0 truncate text-sm text-slate-700 dark:text-gray-200">
						{category.label}
					</span>
					<CategoryFreeToggle
						category={category}
						disabled={update.isPending && pendingId === category.id}
						onToggle={() => {
							setPendingId(category.id);
							update.mutate(
								{
									id: category.id,
									body: { is_free: !category.is_free },
								},
								{ onSettled: () => setPendingId(null) },
							);
						}}
					/>
				</div>
			))}
		</div>
	);
}
