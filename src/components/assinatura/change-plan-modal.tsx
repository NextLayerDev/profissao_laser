'use client';

import { isAxiosError } from 'axios';
import {
	ArrowRight,
	CalendarClock,
	CreditCard,
	ExternalLink,
	Loader2,
	X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	useBillingPortal,
	useChangePlan,
	usePlanChangePreview,
} from '@/hooks/use-my-subscription';
import type {
	PlanChangeResult,
	SubscriptionInterval,
} from '@/modules/subscriptions/types/subscriptions';

interface ChangePlanModalProps {
	/** Assinatura (upvox) que vai trocar; null fecha o modal. */
	subscriptionId: string | null;
	target: {
		planKey: string;
		planName: string;
		interval: SubscriptionInterval;
	} | null;
	onClose: () => void;
}

const brl = (cents: number) =>
	new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
		cents / 100,
	);

const day = (iso: string) =>
	new Date(iso).toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	});

const per = (interval: SubscriptionInterval) =>
	interval === 'yearly' ? 'ano' : 'mês';

/** Motivos que o backend devolve (409) em linguagem de aluno. */
const CHANGE_ERRORS: Record<string, string> = {
	same_plan: 'Esse já é o seu plano atual.',
	subscription_not_changeable:
		'Sua assinatura atual já foi encerrada e não pode ser trocada. Assine o novo plano pela loja.',
	plan_interval_unavailable: 'Esse plano não está disponível nesse período.',
	card_required:
		'Para pagar a diferença, cadastre um cartão de crédito em "Alterar forma de pagamento".',
	not_found: 'Plano não encontrado.',
};

function changeErrorMessage(err: unknown): string {
	if (isAxiosError(err)) {
		const body = err.response?.data as { message?: string } | undefined;
		if (body?.message && CHANGE_ERRORS[body.message])
			return CHANGE_ERRORS[body.message];
	}
	return 'Não foi possível calcular a troca agora. Tente novamente.';
}

function Row({
	label,
	value,
	tone,
}: {
	label: string;
	value: string;
	tone?: 'credit' | 'strong';
}) {
	return (
		<div className="flex items-baseline justify-between gap-4 text-sm">
			<span
				className={
					tone === 'strong'
						? 'font-semibold text-slate-900 dark:text-white'
						: 'text-slate-600 dark:text-gray-300'
				}
			>
				{label}
			</span>
			<span
				className={`font-mono whitespace-nowrap ${
					tone === 'credit'
						? 'text-emerald-600 dark:text-emerald-400'
						: tone === 'strong'
							? 'text-lg font-bold text-slate-900 dark:text-white'
							: 'text-slate-900 dark:text-white'
				}`}
			>
				{value}
			</span>
		</div>
	);
}

/**
 * Troca de plano com o valor EXATO antes de confirmar: crédito do plano atual
 * (sobre o que o aluno de fato pagou), valor do novo até a renovação e o total
 * que sai do cartão. Plano menor fica agendado para a renovação, sem cobrança.
 */
export function ChangePlanModal({
	subscriptionId,
	target,
	onClose,
}: ChangePlanModalProps) {
	const payload = target
		? { plan_key: target.planKey, interval: target.interval }
		: null;
	const preview = usePlanChangePreview(subscriptionId, payload);
	const change = useChangePlan();
	const portal = useBillingPortal();
	const [pendingPayment, setPendingPayment] = useState<PlanChangeResult | null>(
		null,
	);

	if (!subscriptionId || !target) return null;

	const p = preview.data;
	const isNow = p?.timing === 'now';
	const needsCard = isNow && !!p?.requires_card;

	function addCard() {
		portal.mutate(undefined, {
			onSuccess: ({ portal_url }) => {
				window.location.href = portal_url;
			},
			onError: () =>
				toast.error('Erro ao abrir a área de pagamento. Tente novamente.'),
		});
	}

	function close() {
		if (change.isPending) return;
		setPendingPayment(null);
		onClose();
	}

	function confirm() {
		if (!p || !subscriptionId || !target) return;
		change.mutate(
			{
				subscriptionId,
				payload: {
					plan_key: target.planKey,
					interval: target.interval,
					proration_date: p.proration_date ?? undefined,
				},
			},
			{
				onSuccess: (result) => {
					if (result.status === 'requires_payment') {
						setPendingPayment(result);
						return;
					}
					toast.success(
						result.status === 'applied'
							? `Pronto! Você já está no plano ${target.planName}.`
							: `Troca agendada: você passa para o ${target.planName} em ${day(result.effective_at)}.`,
					);
					setPendingPayment(null);
					onClose();
				},
				onError: (err) => toast.error(changeErrorMessage(err)),
			},
		);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm p-4">
			<div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6 shadow-xl">
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-2">
						<ArrowRight size={18} className="text-violet-500" />
						<h2 className="text-base font-semibold text-slate-900 dark:text-white">
							Trocar para {target.planName}{' '}
							<span className="font-normal text-slate-500 dark:text-gray-400">
								({target.interval === 'yearly' ? 'anual' : 'mensal'})
							</span>
						</h2>
					</div>
					<button
						type="button"
						onClick={close}
						disabled={change.isPending}
						aria-label="Fechar"
						className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
					>
						<X size={18} />
					</button>
				</div>

				{preview.isLoading && (
					<div className="flex items-center gap-2 py-8 justify-center text-sm text-slate-500 dark:text-gray-400">
						<Loader2 size={16} className="animate-spin" />
						Calculando a diferença...
					</div>
				)}

				{preview.isError && (
					<p className="py-6 text-sm text-red-600 dark:text-red-400">
						{changeErrorMessage(preview.error)}
					</p>
				)}

				{pendingPayment && (
					<div className="space-y-4">
						<p className="text-sm text-slate-600 dark:text-gray-300">
							Seu cartão não aprovou a cobrança da diferença (ou o banco pediu
							uma confirmação). <strong>Seu plano continua o mesmo</strong> até
							o pagamento ser concluído.
						</p>
						{pendingPayment.invoice_url && (
							<a
								href={pendingPayment.invoice_url}
								target="_blank"
								rel="noreferrer"
								className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
							>
								<ExternalLink size={14} />
								Pagar a diferença
							</a>
						)}
						{pendingPayment.expires_at && (
							<p className="text-xs text-slate-500 dark:text-gray-400">
								Pague até{' '}
								{new Date(pendingPayment.expires_at).toLocaleString('pt-BR')}.
								Depois disso a troca é cancelada e nada é cobrado.
							</p>
						)}
					</div>
				)}

				{p && !pendingPayment && (
					<>
						{isNow ? (
							<div className="space-y-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4">
								<Row
									label={`${p.plan_name} até ${day(p.next_renewal_at)}`}
									value={brl(p.charge_cents)}
								/>
								{p.credit_cents > 0 && (
									<Row
										label="Crédito do seu plano atual (tempo não usado)"
										value={`− ${brl(p.credit_cents)}`}
										tone="credit"
									/>
								)}
								<div className="border-t border-slate-200 dark:border-white/10 pt-2.5">
									<Row
										label="Você paga agora"
										value={brl(p.amount_due_cents)}
										tone="strong"
									/>
								</div>
								{p.balance_credit_cents > 0 && (
									<p className="text-xs text-emerald-700 dark:text-emerald-400">
										Sobram {brl(p.balance_credit_cents)} de crédito, usados nas
										próximas cobranças.
									</p>
								)}
							</div>
						) : (
							<div className="flex gap-3 rounded-xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 p-4">
								<CalendarClock
									size={18}
									className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5"
								/>
								<p className="text-sm text-violet-800 dark:text-violet-200">
									Nada é cobrado agora. Você continua no plano atual (que já
									está pago) até <strong>{day(p.effective_at)}</strong> e passa
									para o {p.plan_name} nessa data.
								</p>
							</div>
						)}

						{needsCard && (
							<div className="mt-4 flex gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4">
								<CreditCard
									size={18}
									className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
								/>
								<p className="text-sm text-amber-800 dark:text-amber-200">
									Sua assinatura é paga no boleto. A diferença é cobrada no
									cartão de crédito, na hora: cadastre um cartão e volte aqui
									para concluir a troca.
								</p>
							</div>
						)}

						<ul className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-gray-400 list-disc pl-5">
							<li>
								Depois, renova por {brl(p.renewal_price_cents)}/
								{per(p.interval)} em {day(p.next_renewal_at)}.
							</li>
							{isNow && (
								<li>
									A cobrança é no cartão da assinatura. O plano só muda se o
									pagamento for aprovado.
								</li>
							)}
						</ul>

						<div className="flex justify-end gap-3 mt-6">
							<button
								type="button"
								onClick={close}
								disabled={change.isPending}
								className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-slate-700 dark:text-white"
							>
								Voltar
							</button>
							{needsCard ? (
								<button
									type="button"
									onClick={addCard}
									disabled={portal.isPending}
									className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
								>
									{portal.isPending ? (
										<Loader2 size={14} className="animate-spin" />
									) : (
										<CreditCard size={14} />
									)}
									Cadastrar cartão
								</button>
							) : (
								<button
									type="button"
									onClick={confirm}
									disabled={change.isPending}
									className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
								>
									{change.isPending ? (
										<Loader2 size={14} className="animate-spin" />
									) : isNow ? (
										<CreditCard size={14} />
									) : (
										<CalendarClock size={14} />
									)}
									{change.isPending
										? 'Processando...'
										: isNow
											? p.amount_due_cents > 0
												? `Pagar ${brl(p.amount_due_cents)} e trocar`
												: 'Confirmar troca'
											: 'Agendar troca'}
								</button>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
