'use client';

import { ArrowRight, ArrowUpDown, Layers, Loader2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { useProducts } from '@/hooks/use-products';
import { useAdminChangePlan } from '@/hooks/use-subscription';
import { useSystemClasses } from '@/hooks/use-system-classes';
import type { Customer } from '@/types/customer';
import type { SystemClassWithRelations } from '@/types/system-classes';

interface AdminChangePlanModalProps {
	customer: Customer | null;
	isOpen: boolean;
	onClose: () => void;
}

type TierKey = 'prata' | 'ouro' | 'platina';

const TIER_CONFIG: Record<
	TierKey,
	{
		color: string;
		bg: string;
		border: string;
		ring: string;
		dot: string;
	}
> = {
	prata: {
		color: 'text-slate-500 dark:text-slate-300',
		bg: 'bg-slate-100 dark:bg-slate-700/50',
		border: 'border-slate-300 dark:border-slate-500',
		ring: 'ring-slate-400',
		dot: 'bg-slate-400',
	},
	ouro: {
		color: 'text-yellow-600 dark:text-yellow-400',
		bg: 'bg-yellow-50 dark:bg-yellow-500/10',
		border: 'border-yellow-300 dark:border-yellow-500/50',
		ring: 'ring-yellow-400',
		dot: 'bg-yellow-400',
	},
	platina: {
		color: 'text-violet-600 dark:text-violet-400',
		bg: 'bg-violet-50 dark:bg-violet-500/10',
		border: 'border-violet-300 dark:border-violet-500/50',
		ring: 'ring-violet-500',
		dot: 'bg-violet-500',
	},
};

const DEFAULT_TIER = {
	color: 'text-cyan-600 dark:text-cyan-400',
	bg: 'bg-cyan-50 dark:bg-cyan-500/10',
	border: 'border-cyan-300 dark:border-cyan-500/50',
	ring: 'ring-cyan-500',
	dot: 'bg-cyan-500',
};

const TIER_ORDER: TierKey[] = ['prata', 'ouro', 'platina'];

function inferTier(text: string | null | undefined): TierKey | undefined {
	if (!text) return undefined;
	const t = text.toLowerCase();
	if (t.includes('platina')) return 'platina';
	if (t.includes('ouro')) return 'ouro';
	if (t.includes('prata')) return 'prata';
	return undefined;
}

function getTierStyle(tier: TierKey | undefined) {
	return tier ? TIER_CONFIG[tier] : DEFAULT_TIER;
}

interface LevelBadgeProps {
	label: string;
	tier: TierKey | undefined;
	muted?: boolean;
}

function LevelBadge({ label, tier, muted = false }: LevelBadgeProps) {
	const s = getTierStyle(tier);
	return (
		<span
			className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${s.bg} ${s.color} ${s.border} ${
				muted ? 'opacity-60' : ''
			}`}
		>
			<span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
			{label}
		</span>
	);
}

export function AdminChangePlanModal({
	customer,
	isOpen,
	onClose,
}: AdminChangePlanModalProps) {
	const [productId, setProductId] = useState('');

	const { data: customerPlans, isLoading: loadingPlans } = useCustomerPlans(
		isOpen && customer ? customer.email : null,
	);
	const { products, isLoading: loadingProducts } = useProducts();
	const { systemClasses, isLoading: loadingSystemClasses } = useSystemClasses();
	const changePlan = useAdminChangePlan();

	// productId -> SystemClass
	const productSystemClass = useMemo(() => {
		const map = new Map<string, SystemClassWithRelations>();
		for (const sc of systemClasses) {
			if (sc.status !== 'ativo') continue;
			for (const p of sc.products) {
				map.set(p.id, sc);
			}
		}
		return map;
	}, [systemClasses]);

	const activePlan =
		customerPlans?.find((p) => p.status === 'active') ?? customerPlans?.[0];

	// Look up current plan's systemClass via its product id
	const currentSystemClass = activePlan
		? (productSystemClass.get(activePlan.id) ?? null)
		: null;
	const currentTierKey =
		inferTier(currentSystemClass?.name) ?? activePlan?.tier;
	const currentLevelLabel = currentSystemClass?.name
		? currentSystemClass.name
		: activePlan?.tier
			? activePlan.tier[0].toUpperCase() + activePlan.tier.slice(1)
			: null;

	const availablePlans = useMemo(() => {
		return (products ?? [])
			.filter((p) => p.stripeProductId && p.status === 'ativo')
			.map((p) => {
				const sc = productSystemClass.get(p.id) ?? null;
				const tier = inferTier(sc?.name ?? p.name ?? p.slug);
				return { product: p, systemClass: sc, tier };
			})
			.sort((a, b) => {
				const ia = a.tier ? TIER_ORDER.indexOf(a.tier) : 99;
				const ib = b.tier ? TIER_ORDER.indexOf(b.tier) : 99;
				if (ia !== ib) return ia - ib;
				return a.product.name.localeCompare(b.product.name);
			});
	}, [products, productSystemClass]);

	if (!isOpen || !customer) return null;

	async function handleConfirm() {
		if (!customer || !productId) return;
		try {
			const result = await changePlan.mutateAsync({
				customerId: customer.id,
				payload: { productId },
			});
			toast.success(
				`Plano alterado: ${result.previousPlan} → ${result.newPlan}`,
			);
			setProductId('');
			onClose();
		} catch {
			toast.error('Erro ao alterar o plano do aluno.');
		}
	}

	const loading = loadingPlans || loadingProducts || loadingSystemClasses;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
			<div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-2">
						<ArrowUpDown size={18} className="text-violet-500" />
						<h2 className="text-base font-semibold text-slate-900 dark:text-white">
							Alterar plano do aluno
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						disabled={changePlan.isPending}
						className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
					>
						<X size={18} />
					</button>
				</div>

				{/* Customer info */}
				<p className="text-slate-900 dark:text-white font-semibold text-sm">
					{customer.name}
				</p>
				<p className="text-slate-500 dark:text-gray-500 text-xs mb-4">
					{customer.email}
				</p>

				{/* Current course + system level */}
				<div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-white/5 dark:to-white/2 border border-slate-200 dark:border-white/10 mb-5">
					<div className="flex items-center justify-between mb-3">
						<span className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
							<Layers size={12} />
							Nível do sistema
						</span>
						{loadingPlans || loadingSystemClasses ? (
							<Loader2 size={12} className="animate-spin text-slate-400" />
						) : currentLevelLabel ? (
							<LevelBadge
								label={currentLevelLabel}
								tier={currentTierKey as TierKey | undefined}
							/>
						) : (
							<span className="text-xs text-slate-400 dark:text-gray-500">
								Sem plano
							</span>
						)}
					</div>

					<p className="text-xs text-slate-500 dark:text-gray-500 mb-1">
						Curso atual
					</p>
					<p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
						{activePlan?.product_name ?? 'Nenhum curso ativo'}
					</p>

					{/* Tier scale: prata -> ouro -> platina */}
					<div className="flex items-center justify-center gap-1 pt-3 border-t border-slate-200 dark:border-white/5">
						{TIER_ORDER.map((tier, i) => {
							const cfg = TIER_CONFIG[tier];
							const isActive = currentTierKey === tier;
							const label = tier[0].toUpperCase() + tier.slice(1);
							return (
								<div key={tier} className="flex items-center gap-1">
									<div
										className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
											isActive
												? `${cfg.bg} ${cfg.border} ${cfg.color} ring-2 ${cfg.ring} ring-offset-1 ring-offset-slate-50 dark:ring-offset-[#1a1a1d]`
												: `${cfg.bg} ${cfg.border} ${cfg.color} opacity-40`
										}`}
									>
										<span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
										{label}
									</div>
									{i < TIER_ORDER.length - 1 && (
										<ArrowRight
											size={11}
											className="text-slate-300 dark:text-gray-600 shrink-0"
										/>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* Available plans */}
				<p className="text-xs font-medium text-slate-600 dark:text-gray-400 mb-2">
					Selecionar novo plano
				</p>

				{loading ? (
					<div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-500 py-3">
						<Loader2 size={14} className="animate-spin" />
						Carregando planos...
					</div>
				) : availablePlans.length === 0 ? (
					<div className="text-sm text-slate-500 dark:text-gray-500 py-3 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-lg">
						Nenhum plano disponível.
					</div>
				) : (
					<div className="space-y-2 max-h-64 overflow-y-auto pr-1">
						{availablePlans.map(({ product: p, systemClass, tier }) => {
							const selected = productId === p.id;
							const isCurrent = activePlan?.id === p.id;
							const levelLabel = systemClass?.name ?? '—';
							return (
								<button
									key={p.id}
									type="button"
									onClick={() => !isCurrent && setProductId(p.id)}
									disabled={!!isCurrent}
									className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
										isCurrent
											? 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/2 opacity-60 cursor-not-allowed'
											: selected
												? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
												: 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
									}`}
								>
									<div className="flex flex-col min-w-0">
										<span className="text-sm font-medium text-slate-900 dark:text-white truncate">
											{p.name}
										</span>
										{isCurrent ? (
											<span className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
												Plano atual
											</span>
										) : !systemClass ? (
											<span className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
												Sem nível definido
											</span>
										) : null}
									</div>
									<LevelBadge label={levelLabel} tier={tier} />
								</button>
							);
						})}
					</div>
				)}

				{/* Actions */}
				<div className="flex justify-end gap-3 mt-6">
					<button
						type="button"
						onClick={onClose}
						disabled={changePlan.isPending}
						className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-slate-700 dark:text-white"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={changePlan.isPending || !productId}
						className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
					>
						{changePlan.isPending && (
							<Loader2 size={14} className="animate-spin" />
						)}
						{changePlan.isPending ? 'Alterando...' : 'Confirmar alteração'}
					</button>
				</div>
			</div>
		</div>
	);
}
