import { getEntitlements } from '@/modules/subscriptions';
import {
	cancelSubscription,
	listMySubscriptions,
} from '@/modules/subscriptions/services/subscriptions.service';
import type { Subscription } from '@/modules/subscriptions/types/subscriptions';
import type { MySubscription } from '@/types/my-subscription';

/** A assinatura ativa do customer agora vive no upvox (não mais na base legada). */
function pickActive(subs: Subscription[]): Subscription | null {
	return (
		subs.find((s) => s.status === 'active' || s.status === 'trialing') ??
		subs[0] ??
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
		amount: active.price_cents / 100,
		currency: 'BRL',
		interval: active.interval === 'yearly' ? 'year' : 'month',
		currentPeriodEnd: active.current_period_end,
		cancelAtPeriodEnd: active.cancel_at_period_end,
	};
}

export async function cancelMySubscription(): Promise<void> {
	const active = pickActive(await listMySubscriptions());
	if (active) await cancelSubscription(active.id);
}
