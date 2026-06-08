'use client';

import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
	useAttachAddon,
	useMyAddons,
	useRemoveAddon,
} from '@/hooks/use-addons';
import { useProducts } from '@/hooks/use-products';
import type { SubscriptionAddonItem } from '@/types/addons';
import { formatCurrency } from '@/utils/format-currency';
import { RemoveAddonModal } from './remove-addon-modal';

const FRIENDLY_ERRORS: Record<string, string> = {
	'Addon already attached to subscription':
		'Esse voxxy já está ativo na sua assinatura.',
	'No active or trialing Stripe subscription found':
		'Você precisa ter uma assinatura ativa pra adicionar voxxys.',
	'Product is not an addon': 'Esse produto não é um voxxy.',
	'Addon not configured for payments':
		'Esse voxxy ainda não está configurado pra cobrança.',
	'Cannot remove the main plan item':
		'Não é possível remover o plano principal por aqui.',
	'Subscription item not found': 'Esse item de assinatura não foi encontrado.',
};

function friendlyError(err: unknown, fallback: string) {
	const raw = (err as { response?: { data?: { message?: string } } })?.response
		?.data?.message;
	if (raw && FRIENDLY_ERRORS[raw]) return FRIENDLY_ERRORS[raw];
	return raw ?? fallback;
}

export function AddonsSection() {
	const { data: myAddons, isLoading: isLoadingMine } = useMyAddons();
	const { products, isLoading: isLoadingProducts } = useProducts();
	const attach = useAttachAddon();
	const remove = useRemoveAddon();

	const [removeTarget, setRemoveTarget] =
		useState<SubscriptionAddonItem | null>(null);

	const attachedProductIds = useMemo(
		() => new Set((myAddons ?? []).map((a) => a.productId)),
		[myAddons],
	);

	const availableAddons = useMemo(
		() =>
			(products ?? []).filter(
				(p) =>
					p.type === 'addon' &&
					p.status === 'ativo' &&
					!attachedProductIds.has(p.id),
			),
		[products, attachedProductIds],
	);

	function handleAttach(productId: string) {
		attach.mutate(productId, {
			onSuccess: () => toast.success('Voxxy adicionado à sua assinatura.'),
			onError: (err) =>
				toast.error(friendlyError(err, 'Erro ao adicionar voxxy.')),
		});
	}

	function handleConfirmRemove() {
		if (!removeTarget) return;
		remove.mutate(removeTarget.itemId, {
			onSuccess: () => {
				toast.success(
					'Voxxy removido. A proração será creditada no próximo invoice.',
				);
				setRemoveTarget(null);
			},
			onError: (err) =>
				toast.error(friendlyError(err, 'Erro ao remover voxxy.')),
		});
	}

	const isLoading = isLoadingMine || isLoadingProducts;

	return (
		<section className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl p-6 mt-6">
			<header className="mb-4">
				<h2 className="text-base font-semibold text-slate-900 dark:text-white">
					Voxxys
				</h2>
				<p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
					Funcionalidades extras que você pode anexar à sua assinatura. A
					cobrança é prorada imediatamente.
				</p>
			</header>

			{isLoading ? (
				<div className="flex items-center justify-center py-10">
					<Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
				</div>
			) : (
				<>
					<div className="mb-6">
						<h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
							Meus voxxys
						</h3>
						{(myAddons ?? []).length === 0 ? (
							<p className="text-sm text-slate-500 dark:text-gray-500">
								Você ainda não tem voxxys ativos.
							</p>
						) : (
							<ul className="space-y-2">
								{(myAddons ?? []).map((addon) => (
									<li
										key={addon.itemId}
										className="flex items-center justify-between gap-3 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3"
									>
										<div>
											<p className="text-sm font-medium text-slate-900 dark:text-white">
												{addon.productName}
											</p>
											<p className="text-xs text-slate-500 dark:text-gray-500">
												Quantidade: {addon.quantity}
											</p>
										</div>
										<button
											type="button"
											onClick={() => setRemoveTarget(addon)}
											disabled={remove.isPending}
											className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-red-500/30 text-red-600 dark:text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50"
										>
											<Trash2 size={12} />
											Remover
										</button>
									</li>
								))}
							</ul>
						)}
					</div>

					<div>
						<h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
							Voxxys disponíveis
						</h3>
						{availableAddons.length === 0 ? (
							<p className="text-sm text-slate-500 dark:text-gray-500">
								Nenhum voxxy disponível no momento.
							</p>
						) : (
							<ul className="space-y-2">
								{availableAddons.map((addon) => (
									<li
										key={addon.id}
										className="flex items-center justify-between gap-3 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3"
									>
										<div>
											<p className="text-sm font-medium text-slate-900 dark:text-white">
												{addon.name}
											</p>
											{addon.description && (
												<p className="text-xs text-slate-500 dark:text-gray-500 line-clamp-2">
													{addon.description}
												</p>
											)}
											<p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
												{formatCurrency(addon.price, 'BRL')}
											</p>
										</div>
										<button
											type="button"
											onClick={() => handleAttach(addon.id)}
											disabled={attach.isPending}
											className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
										>
											{attach.isPending ? (
												<Loader2 size={12} className="animate-spin" />
											) : (
												<Plus size={12} />
											)}
											Adicionar
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</>
			)}

			<RemoveAddonModal
				isOpen={!!removeTarget}
				addon={removeTarget}
				onClose={() => setRemoveTarget(null)}
				onConfirm={handleConfirmRemove}
				isPending={remove.isPending}
			/>
		</section>
	);
}
