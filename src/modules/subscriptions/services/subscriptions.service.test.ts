import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/msw/server';
import {
	createSubscription,
	downgradeSubscription,
	upgradeSubscription,
} from './subscriptions.service';

const BASE = 'http://localhost/api';
const PRODUCT_ID = '11111111-1111-4111-8111-111111111111';

describe('createSubscription', () => {
	it('faz POST /subscription com o payload do customer', async () => {
		let body: Record<string, unknown> | null = null;
		server.use(
			http.post(`${BASE}/subscription`, async ({ request }) => {
				body = (await request.json()) as Record<string, unknown>;
				return HttpResponse.json({}, { status: 201 });
			}),
		);

		await createSubscription({
			email: 'a@b.com',
			stripeProductId: 'prod_1',
			amount: 9900,
			interval: 'month',
			intervalCount: 1,
			endsAt: '2027-01-01T00:00:00.000Z',
		});

		expect(body).toMatchObject({ email: 'a@b.com', stripeProductId: 'prod_1' });
	});
});

describe('upgradeSubscription', () => {
	it('faz POST /subscription/upgrade e valida a resposta de troca', async () => {
		server.use(
			http.post(`${BASE}/subscription/upgrade`, () =>
				HttpResponse.json({
					subscriptionId: 'sub_1',
					status: 'active',
					previousPlan: 'prata',
					newPlan: 'ouro',
				}),
			),
		);

		const res = await upgradeSubscription({ productId: PRODUCT_ID });

		expect(res.previousPlan).toBe('prata');
		expect(res.newPlan).toBe('ouro');
	});

	it('rejeita resposta fora do schema', async () => {
		server.use(
			http.post(`${BASE}/subscription/upgrade`, () =>
				HttpResponse.json({ status: 'active' }),
			),
		);

		await expect(
			upgradeSubscription({ productId: PRODUCT_ID }),
		).rejects.toThrow();
	});
});

describe('downgradeSubscription', () => {
	it('faz POST /subscription/downgrade', async () => {
		server.use(
			http.post(`${BASE}/subscription/downgrade`, () =>
				HttpResponse.json({
					subscriptionId: 'sub_1',
					status: 'active',
					previousPlan: 'ouro',
					newPlan: 'prata',
				}),
			),
		);

		const res = await downgradeSubscription({ productId: PRODUCT_ID });

		expect(res.newPlan).toBe('prata');
	});
});
