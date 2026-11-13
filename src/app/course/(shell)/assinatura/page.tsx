'use client';

import { isAxiosError } from 'axios';
import {
	AlertTriangle,
	BookOpen,
	CreditCard,
	Loader2,
	Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AddonsSection } from '@/components/assinatura/addons-section';
import { CancelSubscriptionModal } from '@/components/assinatura/cancel-subscription-modal';
import { ChangePlanModal } from '@/components/assinatura/change-plan-modal';
import { ChangePlanSection } from '@/components/assinatura/change-plan-section';
import { RefundSubscriptionModal } from '@/components/assinatura/refund-subscription-modal';
import { PageHeader } from '@/components/ui/page-header';
import { SubscriptionSkeleton } from '@/components/ui/skeletons/subscription-skeleton';
import { useLandingPlans } from '@/hooks/use-landing-plans';
import {
	useBillingPortal,
	useCancelMySubscription,
	useMySubscription,
	useRefundMySubscription,
} from '@/hooks/use-my-subscription';
import { getCurrentUser } from '@/lib/auth';
import type { SubscriptionInterval } from '@/modules/subscriptions/types/subscriptions';
import type { MySubscription } from '@/types/my-subscription';

const REFUND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function refundErrorMessage(err: unknown): string {
	if (!isAxiosError(err))
		return 'Erro ao processar reembolso. Tente novamente.';
	const status = err.response?.status;
	const apiMessage = (err.response?.data as { message?: string } | undefined)
		?.message;

	if (status === 403) return 'Essa assinatura nao pertence a sua conta.';
	if (status === 404) return 'Assinatura nao encontrada.';
	if (status === 400 || status === 422) {
		if (apiMessage?.includes('garantia'))
			return 'Fora do prazo de 7 dias para reembolso.';
		if (
			apiMessage?.includes('estornavel') ||
			apiMessage?.includes('estornável')
		)
			return 'Nenhum pagamento estornavel encontrado.';
		return apiMessage ?? 'Assinatura nao pode ser reembolsada.';
	}
	return 'Erro ao processar reembolso. Tente novamente.';
}

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
	if (status === 'past_due') {
		return (
			<span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
				Pagamento pendente
			</span>
		);
	}
	if (status === 'canceled') {
		return (
			<span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 border border-slate-200 dark:border-white/10">
				Cancelada
			</span>
		);
	}
	if (status === 'paused') {
		return (
			<span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 border border-slate-200 dark:border-white/10">
				Pausada
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
	onRefundClick,
	showRefundButton,
	onPaymentMethodClick,
	isPaymentMethodPending,
}: {
	subscription: MySubscription;
	onCancelClick: () => void;
	onRefundClick: () => void;
	showRefundButton: boolean;
	onPaymentMethodClick: () => void;
	isPaymentMethodPending: boolean;
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
							: subscription.status === 'past_due'
								? 'Periodo atual ate'
								: 'Proxima cobranca em'}{' '}
						<span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
							{formatDate(subscription.currentPeriodEnd)}
						</span>
					</p>
				)}
			</div>

			{subscription.status === 'past_due' && (
				<div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
					<AlertTriangle
						size={15}
						className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
					/>
					<p className="text-sm text-amber-700 dark:text-amber-300">
						Nao conseguimos cobrar a ultima fatura. Atualize sua forma de
						pagamento para manter o acesso — vamos tentar cobrar novamente nos
						proximos dias.
					</p>
				</div>
			)}

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

			<div className="pl-13 flex flex-wrap gap-3">
				<button
					type="button"
					onClick={onPaymentMethodClick}
					disabled={isPaymentMethodPending}
					className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-violet-500/50 hover:text-violet-700 dark:hover:text-violet-400 transition-colors disabled:opacity-50"
				>
					{isPaymentMethodPending ? (
						<Loader2 size={14} className="animate-spin" />
					) : (
						<Wallet size={14} />
					)}
					Alterar forma de pagamento
				</button>

				{showRefundButton && (
					<button
						type="button"
						onClick={onRefundClick}
						className="px-4 py-2 text-sm rounded-lg border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
					>
						Solicitar reembolso
					</button>
				)}

				{!subscription.cancelAtPeriodEnd && (
					<button
						type="button"
						onClick={onCancelClick}
						className="px-4 py-2 text-sm rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
					>
						Cancelar assinatura
					</button>
				)}
			</div>
		</div>
	);
}

function CourseAssinaturaContent() {
	const [name, setName] = useState('');
	const [cancelModalOpen, setCancelModalOpen] = useState(false);
	const [refundModalOpen, setRefundModalOpen] = useState(false);
	const [changeTarget, setChangeTarget] = useState<{
		planKey: string;
		planName: string;
		interval: SubscriptionInterval;
	} | null>(null);
	const router = useRouter();
	const searchParams = useSearchParams();
	const { data: plans } = useLandingPlans();
	const { data, isLoading, isError } = useMySubscription();
	const { mutate: cancelSubscription, isPending: isCanceling } =
		useCancelMySubscription();
	const { mutate: refundSubscription, isPending: isRefunding } =
		useRefundMySubscription();
	const { mutate: openBillingPortal, isPending: isOpeningBillingPortal } =
		useBillingPortal();

	useEffect(() => {
		const user = getCurrentUser();
		setName(user?.name ?? '');
	}, []);

	// Vindo da loja ("Trocar para este plano"): /course/assinatura?trocar=pro&periodo=mensal
	// abre direto a troca com o valor da diferença.
	const trocar = searchParams.get('trocar');
	const periodo = searchParams.get('periodo');
	useEffect(() => {
		if (!trocar || !data || !plans) return;
		const plan = plans.find((p) => p.key === trocar);
		if (plan)
			setChangeTarget({
				planKey: plan.key,
				planName: plan.name,
				interval:
					periodo === 'mensal'
						? 'monthly'
						: periodo === 'anual'
							? 'yearly'
							: data.interval === 'year'
								? 'yearly'
								: 'monthly',
			});
		router.replace('/course/assinatura');
	}, [trocar, periodo, data, plans, router]);

	const canChangePlan =
		!!data &&
		(data.status === 'active' || data.status === 'trialing') &&
		!data.cancelAtPeriodEnd;

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

	function handleConfirmRefund() {
		refundSubscription(undefined, {
			onSuccess: () => {
				setRefundModalOpen(false);
				toast.success('Reembolso processado. Sua assinatura foi cancelada.');
			},
			onError: (error: unknown) => {
				toast.error(refundErrorMessage(error));
			},
		});
	}

	function handlePaymentMethodClick() {
		openBillingPortal(undefined, {
			onSuccess: (result) => {
				window.location.href = result.portal_url;
			},
			onError: () => {
				toast.error('Erro ao abrir a area de pagamento. Tente novamente.');
			},
		});
	}

	const periodEndFormatted = data?.currentPeriodEnd
		? formatDate(data.currentPeriodEnd)
		: '';

	const withinRefundWindow = data?.currentPeriodStart
		? Date.now() - new Date(data.currentPeriodStart).getTime() <=
			REFUND_WINDOW_MS
		: false;

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
							onRefundClick={() => setRefundModalOpen(true)}
							showRefundButton={withinRefundWindow}
							onPaymentMethodClick={handlePaymentMethodClick}
							isPaymentMethodPending={isOpeningBillingPortal}
						/>

						{canChangePlan && (
							<ChangePlanSection
								currentPlanKey={data.planKey}
								currentInterval={
									data.interval === 'year' ? 'yearly' : 'monthly'
								}
								onSelect={(plan, interval) =>
									setChangeTarget({
										planKey: plan.key,
										planName: plan.name,
										interval,
									})
								}
							/>
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

			<RefundSubscriptionModal
				isOpen={refundModalOpen}
				onClose={() => setRefundModalOpen(false)}
				onConfirm={handleConfirmRefund}
				isPending={isRefunding}
			/>

			<ChangePlanModal
				subscriptionId={data?.id ?? null}
				target={changeTarget}
				onClose={() => setChangeTarget(null)}
			/>
		</>
	);
}

/** `useSearchParams` (link "trocar de plano" vindo da loja) exige Suspense. */
export default function CourseAssinaturaPage() {
	return (
		<Suspense fallback={null}>
			<CourseAssinaturaContent />
		</Suspense>
	);
}
