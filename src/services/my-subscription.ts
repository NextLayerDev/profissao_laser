import {
	cancelSubscription,
	listMySubscriptions,
	refundSubscription,
} from '@/modules/subscriptions/services/subscriptions.service';
import type {
	Subscription,
	SubscriptionRefundResult,
} from '@/modules/subscriptions/types/subscriptions';
import { getEntitlements } from '@/services/entitlements';
import type { MySubscription } from '@/types/my-subscription';

/** A assinatura ativa do customer agora vive no upvox (não mais na base legada). */
function pickActive(subs: Subscription[]): Subscription | null {
	// Pacote vitalício não é "assinatura": não cancela, não troca, não renova.
	const recurring = subs.filter((s) => s.interval !== 'lifetime');
	return (
		recurring.find((s) => s.status === 'active' || s.status === 'trialing') ??
		recurring[0] ??
		null
	);
}

/**
 * Detalhes da assinatura para a tela "Sua assinatura". Funde o `/v1/me/subscriptions`
 * (status, valor, intervalo, período, cancelamento) com o nome do plano vindo dos
 * entitlements. Substitui o endpoint legado `/me/subscription` (base antiga, vazia
 * para clientes migrados/upvox).
 */
export async function getMySubscription(): Promise<MySubscription | null> {
	const [subs, ent] = await Promise.all([
		listMySubscriptions(),
		getEntitlements().catch(() => null),
	]);
	const active = pickActive(subs);
	if (!active) return null;
	return {
		id: active.id,
		status: active.status,
		product_name: ent?.subscription?.plan?.name ?? 'Seu plano',
		planKey: ent?.subscription?.plan?.key ?? null,
		amount: active.price_cents / 100,
		currency: 'BRL',
		interval: active.interval === 'yearly' ? 'year' : 'month',
		currentPeriodStart: active.current_period_start,
		currentPeriodEnd: active.current_period_end,
		cancelAtPeriodEnd: active.cancel_at_period_end,
	};
}

export async function cancelMySubscription(): Promise<void> {
	const active = pickActive(await listMySubscriptions());
	if (active) await cancelSubscription(active.id);
}

/** Reembolsa (garantia de 7 dias) e cancela a assinatura ativa do customer. */
export async function refundMySubscription(): Promise<SubscriptionRefundResult> {
	const active = pickActive(await listMySubscriptions());
	if (!active) throw new Error('Nenhuma assinatura ativa encontrada.');
	return refundSubscription(active.id);
}
