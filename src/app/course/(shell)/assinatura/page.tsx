'use client';

import {
	AlertTriangle,
	ArrowDown,
	ArrowUp,
	BookOpen,
	Check,
	CreditCard,
	X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AddonsSection } from '@/components/assinatura/addons-section';
import { CancelSubscriptionModal } from '@/components/assinatura/cancel-subscription-modal';
import { ChangePlanModal } from '@/components/assinatura/change-plan-modal';
import { PageHeader } from '@/components/ui/page-header';
import { SubscriptionSkeleton } from '@/components/ui/skeletons/subscription-skeleton';
import {
	useCancelMySubscription,
	useDowngradeMySubscription,
	useMySubscription,
	useUpgradeMySubscription,
} from '@/hooks/use-my-subscription';
import { useProducts } from '@/hooks/use-products';
import { useSystemClasses } from '@/hooks/use-system-classes';
import { getCurrentUser } from '@/shared/lib/auth';
import type { MySubscription } from '@/types/my-subscription';
import type { Product } from '@/types/products';
import type { SystemClassWithRelations } from '@/types/system-classes';
import { SC_OPTIONS } from '@/utils/constants/system-class-options';

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	});
}

function formatCurrency(amount: number) {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(amount);
}

function formatAmount(amount: number, interval: 'month' | 'year') {
	return `${formatCurrency(amount)}/${interval === 'month' ? 'mes' : 'ano'}`;
}

function StatusBadge({
	status,
	cancelAtPeriodEnd,
}: {
	status: string;
	cancelAtPeriodEnd: boolean;
}) {
	if (cancelAtPeriodEnd) {
		return (
			<span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">
				Cancelamento agendado
			</span>
		);
	}
	if (status === 'trialing') {
		return (
			<span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
				Em teste
			</span>
		);
	}
	return (
		<span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
			Ativo
		</span>
	);
}

function SubscriptionCard({
	subscription,
	onCancelClick,
}: {
	subscription: MySubscription;
	onCancelClick: () => void;
}) {
	return (
		<div className="bg-white dark:bg-[#1a1a1d] border border-violet-500/30 rounded-lg p-6 space-y-5">
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="bg-violet-500/10 dark:bg-violet-500/20 rounded-lg p-2.5 shrink-0">
						<CreditCard className="w-5 h-5 text-violet-600 dark:text-violet-400" />
					</div>
					<div>
						<p className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
							Plano atual
						</p>
						<h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
							{subscription.product_name}
						</h2>
					</div>
				</div>
				<StatusBadge
					status={subscription.status}
					cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
				/>
			</div>

			<div className="flex flex-col gap-1.5 pl-[52px]">
				<p className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100">
					{formatAmount(subscription.amount, subscription.interval)}
				</p>
				{subscription.currentPeriodEnd && (
					<p className="text-sm text-slate-500 dark:text-gray-400">
						{subscription.cancelAtPeriodEnd
							? 'Encerra em'
							: 'Proxima cobranca em'}{' '}
						<span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
							{formatDate(subscription.currentPeriodEnd)}
						</span>
					</p>
				)}
			</div>

			{subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
				<div className="flex items-start gap-3 rounded-lg border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 px-4 py-3">
					<AlertTriangle
						size={15}
						className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5"
					/>
					<p className="text-sm text-violet-700 dark:text-violet-300">
						Sua assinatura sera encerrada em{' '}
						<span className="font-semibold">
							{formatDate(subscription.currentPeriodEnd)}
						</span>
						. Voce ainda tem acesso ate la.
					</p>
				</div>
			)}

			{!subscription.cancelAtPeriodEnd && (
				<div className="pl-13">
					<button
						type="button"
						onClick={onCancelClick}
						className="px-4 py-2 text-sm rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
					>
						Cancelar assinatura
					</button>
				</div>
			)}
		</div>
	);
}

function PlanOption({
	product,
	type,
	systemClass,
	onSelect,
}: {
	product: Product;
	type: 'upgrade' | 'downgrade';
	systemClass: SystemClassWithRelations | null;
	onSelect: (product: Product, type: 'upgrade' | 'downgrade') => void;
}) {
	const isUpgrade = type === 'upgrade';

	return (
		<div className="rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
			<div
				className={`h-1 ${isUpgrade ? 'bg-emerald-500' : 'bg-violet-600'}`}
			/>

			<div className="bg-white dark:bg-[#1a1a1d] p-5 flex flex-col flex-1">
				{systemClass && (
					<span className="self-start text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3 bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
						{systemClass.name}
					</span>
				)}

				<h3 className="font-display font-bold text-slate-900 dark:text-slate-100 text-base leading-snug mb-1">
					{product.name}
				</h3>
				<p className="mb-5">
					<span className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100">
						{formatCurrency(product.price)}
					</span>
					<span className="text-sm text-slate-500 dark:text-gray-400">
						/mes
					</span>
				</p>

				<div className="space-y-2 mb-5 flex-1">
					<p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-3">
						Recursos inclusos
					</p>
					{SC_OPTIONS.map((o) => {
						const enabled = systemClass !== null && systemClass[o.key] === true;
						return (
							<div key={o.key} className="flex items-center gap-2.5">
								{enabled ? (
									<Check size={14} className="text-violet-600 shrink-0" />
								) : (
									<X
										size={14}
										className="text-slate-300 dark:text-slate-600 shrink-0"
									/>
								)}
								<span
									className={
										enabled
											? 'text-sm text-slate-700 dark:text-slate-200'
											: 'text-sm text-slate-400 dark:text-slate-600 line-through'
									}
								>
									{o.label}
								</span>
							</div>
						);
					})}
				</div>

				<button
					type="button"
					onClick={() => onSelect(product, type)}
					className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
						isUpgrade
							? 'bg-violet-600 hover:bg-violet-400 text-white'
							: 'border border-slate-200 dark:border-white/10 hover:border-violet-500/50 text-slate-700 dark:text-slate-200 hover:text-violet-700 dark:hover:text-violet-400'
					}`}
				>
					{isUpgrade ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
					{isUpgrade ? 'Fazer upgrade' : 'Fazer downgrade'}
				</button>
			</div>
		</div>
	);
}

export default function CourseAssinaturaPage() {
	const [name, setName] = useState('');
	const [planTab, setPlanTab] = useState<'upgrade' | 'downgrade'>('upgrade');
	const [cancelModalOpen, setCancelModalOpen] = useState(false);
	const [changePlanModal, setChangePlanModal] = useState<{
		open: boolean;
		product: Product | null;
		type: 'upgrade' | 'downgrade';
	}>({ open: false, product: null, type: 'upgrade' });

	const { data, isLoading, isError } = useMySubscription();
	const { products } = useProducts();
	const { systemClasses } = useSystemClasses();

	const activeSystemClasses = systemClasses.filter(
		(sc) => sc.status === 'ativo',
	);

	function systemClassForProduct(
		productId: string,
	): SystemClassWithRelations | null {
		return (
			activeSystemClasses.find((sc) =>
				sc.products.some((p) => p.id === productId),
			) ?? null
		);
	}
	const { mutate: cancelSubscription, isPending: isCanceling } =
		useCancelMySubscription();
	const { mutate: upgradePlan, isPending: isUpgrading } =
		useUpgradeMySubscription();
	const { mutate: downgradePlan, isPending: isDowngrading } =
		useDowngradeMySubscription();

	useEffect(() => {
		const user = getCurrentUser();
		setName(user?.name ?? '');
	}, []);

	const currentProduct = data
		? (products?.find(
				(p) => p.name === data.product_name && p.price === data.amount,
			) ?? products?.find((p) => p.name === data.product_name))
		: undefined;

	const relatedPlans = currentProduct
		? (products?.filter(
				(p) =>
					p.status === 'ativo' &&
					p.stripeProductId !== null &&
					p.name === currentProduct.name &&
					p.machine === currentProduct.machine &&
					p.software === currentProduct.software &&
					p.id !== currentProduct.id,
			) ?? [])
		: [];

	const upgradePlans = relatedPlans.filter(
		(p) => p.price > (data?.amount ?? 0),
	);
	const downgradePlans = relatedPlans.filter(
		(p) => p.price < (data?.amount ?? 0),
	);

	const effectiveTab =
		planTab === 'upgrade' &&
		upgradePlans.length === 0 &&
		downgradePlans.length > 0
			? 'downgrade'
			: planTab;

	function handleConfirmCancel() {
		cancelSubscription(undefined, {
			onSuccess: () => {
				setCancelModalOpen(false);
				toast.success(
					'Assinatura cancelada. Voce ainda tem acesso ate o fim do periodo.',
				);
			},
			onError: () => {
				toast.error('Erro ao cancelar assinatura. Tente novamente.');
			},
		});
	}

	function handleSelectPlan(product: Product, type: 'upgrade' | 'downgrade') {
		setChangePlanModal({ open: true, product, type });
	}

	function handleConfirmChangePlan() {
		if (!changePlanModal.product) return;

		const mutate =
			changePlanModal.type === 'upgrade' ? upgradePlan : downgradePlan;

		mutate(
			{ productId: changePlanModal.product.id },
			{
				onSuccess: () => {
					setChangePlanModal({ open: false, product: null, type: 'upgrade' });
					toast.success(
						changePlanModal.type === 'upgrade'
							? 'Upgrade realizado com sucesso!'
							: 'Downgrade realizado com sucesso!',
					);
				},
				onError: (error: unknown) => {
					const msg = error instanceof Error ? error.message.toLowerCase() : '';
					if (msg.includes('not higher')) {
						toast.error('Este plano nao e superior ao atual.');
					} else if (msg.includes('tenant')) {
						toast.error('Nenhuma conta ativa encontrada.');
					} else {
						toast.error('Erro ao alterar plano. Tente novamente.');
					}
				},
			},
		);
	}

	const periodEndFormatted = data?.currentPeriodEnd
		? formatDate(data.currentPeriodEnd)
		: '';

	const isChangingPlan = isUpgrading || isDowngrading;

	return (
		<>
			<div className="px-6 py-8">
				<PageHeader
					title={name ? `Ola, ${name}` : 'Sua assinatura'}
					subtitle="Gerencie os detalhes do seu plano ativo."
					icon={CreditCard}
				/>

				{isLoading && <SubscriptionSkeleton />}

				{isError && (
					<div className="flex items-center gap-3 bg-white dark:bg-[#1a1a1d] border border-red-200 dark:border-red-500/30 rounded-lg px-5 py-4 text-sm text-red-600 dark:text-red-400">
						<AlertTriangle size={16} className="shrink-0" />
						Erro ao carregar assinatura. Tente novamente.
					</div>
				)}

				{!isLoading && !isError && data === null && (
					<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-lg p-10 flex flex-col items-center text-center gap-5">
						<div className="bg-slate-100 dark:bg-white/5 rounded-xl p-5">
							<CreditCard
								size={32}
								className="text-slate-400 dark:text-gray-500"
							/>
						</div>
						<div>
							<p className="font-display font-bold text-lg text-slate-900 dark:text-slate-100">
								Nenhuma assinatura ativa
							</p>
							<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
								Voce nao possui uma assinatura ativa no momento.
							</p>
						</div>
						<Link
							href="/course/store"
							className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-400 text-white text-sm font-semibold rounded-lg transition-colors"
						>
							<BookOpen className="w-4 h-4" />
							Ver planos disponiveis
						</Link>
					</div>
				)}

				{!isLoading && !isError && data && (
					<div className="space-y-6">
						<SubscriptionCard
							subscription={data}
							onCancelClick={() => setCancelModalOpen(true)}
						/>

						{(upgradePlans.length > 0 || downgradePlans.length > 0) && (
							<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden">
								<div className="flex items-center gap-3 px-6 pt-6 pb-4">
									<div className="bg-violet-500/10 dark:bg-violet-500/20 rounded-lg p-2.5">
										<ArrowUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
									</div>
									<div>
										<h3 className="font-display font-bold text-slate-900 dark:text-slate-100">
											Alterar plano
										</h3>
										<p className="text-xs text-slate-500 dark:text-gray-400">
											Faca upgrade para mais recursos ou downgrade quando
											precisar
										</p>
									</div>
								</div>

								<div className="flex border-b border-slate-200 dark:border-white/10 px-6">
									{upgradePlans.length > 0 && (
										<button
											type="button"
											onClick={() => setPlanTab('upgrade')}
											className={`flex items-center gap-1.5 pb-3 px-1 mr-6 text-sm font-semibold border-b-2 transition-colors ${
												planTab === 'upgrade'
													? 'border-violet-600 text-violet-700 dark:text-violet-400'
													: 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-slate-200'
											}`}
										>
											<ArrowUp size={14} />
											Upgrade
											<span
												className={`font-mono text-xs px-1.5 py-0.5 rounded-full ${
													planTab === 'upgrade'
														? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'
														: 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-400'
												}`}
											>
												{upgradePlans.length}
											</span>
										</button>
									)}
									{downgradePlans.length > 0 && (
										<button
											type="button"
											onClick={() => setPlanTab('downgrade')}
											className={`flex items-center gap-1.5 pb-3 px-1 mr-6 text-sm font-semibold border-b-2 transition-colors ${
												planTab === 'downgrade'
													? 'border-violet-600 text-violet-700 dark:text-violet-400'
													: 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-slate-200'
											}`}
										>
											<ArrowDown size={14} />
											Downgrade
											<span
												className={`font-mono text-xs px-1.5 py-0.5 rounded-full ${
													planTab === 'downgrade'
														? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'
														: 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-400'
												}`}
											>
												{downgradePlans.length}
											</span>
										</button>
									)}
								</div>

								<div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
									{effectiveTab === 'upgrade' &&
										upgradePlans.map((product) => (
											<PlanOption
												key={product.id}
												product={product}
												type="upgrade"
												systemClass={systemClassForProduct(product.id)}
												onSelect={handleSelectPlan}
											/>
										))}
									{effectiveTab === 'downgrade' &&
										downgradePlans.map((product) => (
											<PlanOption
												key={product.id}
												product={product}
												type="downgrade"
												systemClass={systemClassForProduct(product.id)}
												onSelect={handleSelectPlan}
											/>
										))}
								</div>
							</div>
						)}
					</div>
				)}
				<AddonsSection />
			</div>

			<CancelSubscriptionModal
				isOpen={cancelModalOpen}
				onClose={() => setCancelModalOpen(false)}
				periodEnd={periodEndFormatted}
				onConfirm={handleConfirmCancel}
				isPending={isCanceling}
			/>

			<ChangePlanModal
				isOpen={changePlanModal.open}
				onClose={() =>
					setChangePlanModal({ open: false, product: null, type: 'upgrade' })
				}
				type={changePlanModal.type}
				productName={changePlanModal.product?.name ?? ''}
				price={
					changePlanModal.product
						? `${formatCurrency(changePlanModal.product.price)}/mes`
						: ''
				}
				onConfirm={handleConfirmChangePlan}
				isPending={isChangingPlan}
			/>
		</>
	);
}
