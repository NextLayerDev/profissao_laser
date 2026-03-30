'use client';

import {
	AlertTriangle,
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	BookOpen,
	Check,
	CreditCard,
	Loader2,
	X,
	Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CancelSubscriptionModal } from '@/components/assinatura/cancel-subscription-modal';
import { ChangePlanModal } from '@/components/assinatura/change-plan-modal';
import { UserBadge } from '@/components/store/user-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useClasses } from '@/hooks/use-classes';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import {
	useCancelMySubscription,
	useDowngradeMySubscription,
	useMySubscription,
	useUpgradeMySubscription,
} from '@/hooks/use-my-subscription';
import { useProducts } from '@/hooks/use-products';
import { getCurrentUser } from '@/lib/auth';
import type { ClassWithProducts } from '@/types/classes';
import type { MySubscription } from '@/types/my-subscription';
import type { Product } from '@/types/products';
import { CLASS_FEATURES } from '@/utils/constants/class-features';
import { TIER_STYLES } from '@/utils/constants/tier-styles';

const Background = () => (
	<div className="fixed inset-0 bg-linear-to-br from-slate-100 via-white to-slate-50 dark:from-[#12103a] dark:via-[#0d0b1e] dark:to-[#0a0818] pointer-events-none" />
);

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
	return `${formatCurrency(amount)}/${interval === 'month' ? 'mês' : 'ano'}`;
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
			<span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
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
		<span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 border border-green-200 dark:border-green-500/30">
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
		<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-none space-y-5">
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="bg-linear-to-br from-violet-600 to-purple-700 rounded-xl p-2.5 shrink-0">
						<CreditCard className="w-5 h-5 text-white" />
					</div>
					<div>
						<p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">
							Plano atual
						</p>
						<h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
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
				<p className="text-2xl font-black text-slate-900 dark:text-white">
					{formatAmount(subscription.amount, subscription.interval)}
				</p>
				{subscription.currentPeriodEnd && (
					<p className="text-sm text-slate-500 dark:text-slate-400">
						{subscription.cancelAtPeriodEnd
							? 'Encerra em'
							: 'Próxima cobrança em'}{' '}
						<span className="font-semibold text-slate-700 dark:text-slate-200">
							{formatDate(subscription.currentPeriodEnd)}
						</span>
					</p>
				)}
			</div>

			{subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
				<div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
					<AlertTriangle
						size={15}
						className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5"
					/>
					<p className="text-sm text-amber-700 dark:text-amber-300">
						Sua assinatura será encerrada em{' '}
						<span className="font-semibold">
							{formatDate(subscription.currentPeriodEnd)}
						</span>
						. Você ainda tem acesso até lá.
					</p>
				</div>
			)}

			{!subscription.cancelAtPeriodEnd && (
				<div className="pl-[52px]">
					<button
						type="button"
						onClick={onCancelClick}
						className="px-4 py-2 text-sm rounded-xl border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
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
	classInfo,
	onSelect,
}: {
	product: Product;
	type: 'upgrade' | 'downgrade';
	classInfo: ClassWithProducts | undefined;
	onSelect: (product: Product, type: 'upgrade' | 'downgrade') => void;
}) {
	const isUpgrade = type === 'upgrade';
	const tier = classInfo?.tier;
	const tierStyle = tier ? TIER_STYLES[tier] : null;

	const enabledFeatures = CLASS_FEATURES.filter((f) => classInfo?.[f.key]);
	const disabledFeatures = CLASS_FEATURES.filter((f) => !classInfo?.[f.key]);

	return (
		<div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none flex flex-col">
			{/* Tier stripe */}
			<div
				className={`h-1.5 bg-linear-to-r ${tierStyle?.gradient ?? 'from-violet-600 to-purple-700'}`}
			/>

			<div className="bg-white dark:bg-white/5 p-5 flex flex-col flex-1">
				{/* Tier badge */}
				{tierStyle && (
					<span
						className={`self-start text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3 ${tierStyle.badge}`}
					>
						{tierStyle.label}
					</span>
				)}

				{/* Name + price */}
				<h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug mb-1">
					{product.name}
				</h3>
				<p className="mb-5">
					<span className="text-2xl font-black text-slate-900 dark:text-white">
						{formatCurrency(product.price)}
					</span>
					<span className="text-sm text-slate-500 dark:text-slate-400">
						/mês
					</span>
				</p>

				{/* Features */}
				<div className="space-y-2 mb-5 flex-1">
					<p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
						Recursos inclusos
					</p>
					{enabledFeatures.map((feat) => (
						<div key={feat.key} className="flex items-center gap-2.5">
							<Check size={14} className="text-emerald-400 shrink-0" />
							<span className="text-sm text-slate-700 dark:text-gray-200">
								{feat.label}
							</span>
						</div>
					))}
					{disabledFeatures.map((feat) => (
						<div key={feat.key} className="flex items-center gap-2.5">
							<X
								size={14}
								className="text-slate-300 dark:text-gray-600 shrink-0"
							/>
							<span className="text-sm text-slate-400 dark:text-gray-600 line-through">
								{feat.label}
							</span>
						</div>
					))}
				</div>

				{/* Action button */}
				<button
					type="button"
					onClick={() => onSelect(product, type)}
					className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all ${
						isUpgrade
							? 'bg-linear-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white'
							: 'border border-slate-200 dark:border-white/10 hover:border-amber-400 dark:hover:border-amber-500/50 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300'
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
	const { classes } = useClasses();

	const TIER_ORDER: Record<string, number> = { prata: 0, ouro: 1, platina: 2 };

	function classForProduct(productId: string) {
		return [...classes]
			.filter((c) => c.products.some((p) => p.id === productId))
			.sort(
				(a, b) => (TIER_ORDER[a.tier] ?? 99) - (TIER_ORDER[b.tier] ?? 99),
			)[0];
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
		? products?.find((p) => p.name === data.product_name)
		: undefined;

	// Descobre o slug do curso a partir da classe que contém o produto atual
	const courseSlug = currentProduct
		? classes
				.find((c) => c.products.some((p) => p.id === currentProduct.id))
				?.products.find((p) => p.id === currentProduct.id)?.slug
		: undefined;

	// Todos os product IDs vinculados a esse slug nas classes
	const relatedProductIds = courseSlug
		? new Set(
				classes
					.filter((c) => c.products.some((p) => p.slug === courseSlug))
					.flatMap((c) =>
						c.products.filter((p) => p.slug === courseSlug).map((p) => p.id),
					),
			)
		: new Set<string>();

	const relatedPlans =
		relatedProductIds.size > 0
			? (products?.filter(
					(p) =>
						p.status === 'ativo' &&
						p.stripeProductId !== null &&
						relatedProductIds.has(p.id) &&
						p.id !== currentProduct?.id,
				) ?? [])
			: [];

	const upgradePlans = relatedPlans.filter(
		(p) => p.price > (data?.amount ?? 0),
	);
	const downgradePlans = relatedPlans.filter(
		(p) => p.price < (data?.amount ?? 0),
	);

	// Se não há upgrades mas há downgrades, seleciona a aba correta
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
					'Assinatura cancelada. Você ainda tem acesso até o fim do período.',
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
						toast.error('Este plano não é superior ao atual.');
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
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0b1e] text-slate-900 dark:text-white font-sans">
			<Background />

			{/* Header */}
			<header className="relative z-10 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-6 py-4">
				<div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<Link
							href="/course"
							className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-violet-500/40 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium rounded-xl transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
							Meus Cursos
						</Link>
					</div>

					<div className="flex items-center gap-3">
						<div className="hidden sm:flex items-center gap-2">
							<div className="bg-linear-to-br from-violet-600 to-purple-700 rounded-lg p-1.5">
								<CreditCard className="w-4 h-4 text-white" />
							</div>
							<span className="text-sm font-bold text-slate-900 dark:text-white">
								Minha Assinatura
							</span>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<ThemeToggle />
						<UserBadge />
					</div>
				</div>
			</header>

			<div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
				{/* Top tag */}
				<div className="inline-flex items-center gap-2 bg-violet-100 dark:bg-white/10 border border-violet-200 dark:border-white/20 rounded-full px-4 py-1.5 mb-6 text-xs font-semibold text-violet-700 dark:text-white uppercase tracking-wider">
					<Zap className="w-4 h-4" />
					Comunidade Profissão Laser
				</div>

				{/* Title */}
				<h2 className="text-4xl font-black leading-tight mb-1">
					{name ? (
						<>
							Olá,{' '}
							<span className="bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
								{name}
							</span>
						</>
					) : (
						<span className="bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
							Sua assinatura
						</span>
					)}
				</h2>
				<p className="text-slate-600 dark:text-slate-400 text-base mb-8">
					Gerencie os detalhes do seu plano ativo.
				</p>

				{/* Loading */}
				{isLoading && (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
					</div>
				)}

				{/* Error */}
				{isError && (
					<div className="flex items-center gap-3 bg-white dark:bg-white/5 border border-red-200 dark:border-red-500/30 rounded-2xl px-5 py-4 text-sm text-red-600 dark:text-red-400 shadow-sm dark:shadow-none">
						<AlertTriangle size={16} className="shrink-0" />
						Erro ao carregar assinatura. Tente novamente.
					</div>
				)}

				{/* Empty state */}
				{!isLoading && !isError && data === null && (
					<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-10 shadow-sm dark:shadow-none flex flex-col items-center text-center gap-5">
						<div className="bg-linear-to-br from-slate-100 to-slate-200 dark:from-white/10 dark:to-white/5 rounded-2xl p-5">
							<CreditCard
								size={32}
								className="text-slate-400 dark:text-slate-500"
							/>
						</div>
						<div>
							<p className="font-bold text-lg text-slate-900 dark:text-white">
								Nenhuma assinatura ativa
							</p>
							<p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
								Você não possui uma assinatura ativa no momento.
							</p>
						</div>
						<Link
							href="/store"
							className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white text-sm font-semibold rounded-xl transition-all"
						>
							<BookOpen className="w-4 h-4" />
							Ver planos disponíveis
						</Link>
					</div>
				)}

				{/* Content with subscription */}
				{!isLoading && !isError && data && (
					<div className="space-y-6">
						<SubscriptionCard
							subscription={data}
							onCancelClick={() => setCancelModalOpen(true)}
						/>

						{/* Plan change section */}
						{(upgradePlans.length > 0 || downgradePlans.length > 0) && (
							<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
								{/* Header */}
								<div className="flex items-center gap-3 px-6 pt-6 pb-4">
									<div className="bg-linear-to-br from-cyan-500 to-blue-600 rounded-xl p-2.5">
										<Zap className="w-5 h-5 text-white" />
									</div>
									<div>
										<h3 className="font-bold text-slate-900 dark:text-white">
											Alterar plano
										</h3>
										<p className="text-xs text-slate-500 dark:text-slate-400">
											Faça upgrade para mais recursos ou downgrade quando
											precisar
										</p>
									</div>
								</div>

								{/* Tabs */}
								<div className="flex border-b border-slate-200 dark:border-white/10 px-6">
									{upgradePlans.length > 0 && (
										<button
											type="button"
											onClick={() => setPlanTab('upgrade')}
											className={`flex items-center gap-1.5 pb-3 px-1 mr-6 text-sm font-semibold border-b-2 transition-colors ${
												planTab === 'upgrade'
													? 'border-green-500 text-green-600 dark:text-green-400'
													: 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
											}`}
										>
											<ArrowUp size={14} />
											Upgrade
											<span
												className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
													planTab === 'upgrade'
														? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
														: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
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
													? 'border-amber-500 text-amber-600 dark:text-amber-400'
													: 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
											}`}
										>
											<ArrowDown size={14} />
											Downgrade
											<span
												className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
													planTab === 'downgrade'
														? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
														: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
												}`}
											>
												{downgradePlans.length}
											</span>
										</button>
									)}
								</div>

								{/* Tab content */}
								<div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
									{effectiveTab === 'upgrade' &&
										upgradePlans.map((product) => (
											<PlanOption
												key={product.id}
												product={product}
												type="upgrade"
												classInfo={classForProduct(product.id)}
												onSelect={handleSelectPlan}
											/>
										))}
									{effectiveTab === 'downgrade' &&
										downgradePlans.map((product) => (
											<PlanOption
												key={product.id}
												product={product}
												type="downgrade"
												classInfo={classForProduct(product.id)}
												onSelect={handleSelectPlan}
											/>
										))}
								</div>
							</div>
						)}
					</div>
				)}
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
						? `${formatCurrency(changePlanModal.product.price)}/mês`
						: ''
				}
				onConfirm={handleConfirmChangePlan}
				isPending={isChangingPlan}
			/>
		</div>
	);
}
