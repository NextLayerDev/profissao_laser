import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/msw/server';
import { getEntitlements } from './entitlements.service';

const BASE = 'http://localhost/api';

function fakeEntitlements(overrides: Record<string, unknown> = {}) {
	return {
		is_test_unlimited: false,
		vox_balance: 120,
		subscription: {
			status: 'active',
			plan: { id: 'p1', key: 'avan', name: 'Avançado' },
			current_period_start: '2026-06-01T00:00:00.000Z',
			current_period_end: '2026-07-01T00:00:00.000Z',
			vox_monthly_grant: 100,
		},
		courses: [{ id: 'c1', slug: 'laser', title: 'Laser' }],
		tools: [
			{
				key: 'vetorizacao',
				name: 'Vetorização',
				entitled: true,
				free_quota: 10,
				remaining_free: 7,
				vox_cost: 2,
			},
		],
		...overrides,
	};
}

describe('getEntitlements', () => {
	it('busca e valida os entitlements do customer', async () => {
		server.use(
			http.get(`${BASE}/v1/me/entitlements`, () =>
				HttpResponse.json(fakeEntitlements()),
			),
		);

		const ent = await getEntitlements();

		expect(ent.subscription?.plan.key).toBe('avan');
		expect(ent.vox_balance).toBe(120);
		expect(ent.tools[0].remaining_free).toBe(7);
	});

	it('repassa course_slug como query param quando informado', async () => {
		let received: string | null = null;
		server.use(
			http.get(`${BASE}/v1/me/entitlements`, ({ request }) => {
				received = new URL(request.url).searchParams.get('course_slug');
				return HttpResponse.json(fakeEntitlements());
			}),
		);

		await getEntitlements('laser');

		expect(received).toBe('laser');
	});

	it('aceita subscription nula (sem plano ativo)', async () => {
		server.use(
			http.get(`${BASE}/v1/me/entitlements`, () =>
				HttpResponse.json(fakeEntitlements({ subscription: null, tools: [] })),
			),
		);

		const ent = await getEntitlements();

		expect(ent.subscription).toBeNull();
		expect(ent.tools).toEqual([]);
	});

	it('rejeita resposta fora do schema', async () => {
		server.use(
			http.get(`${BASE}/v1/me/entitlements`, () =>
				HttpResponse.json({ vox_balance: 'muito' }),
			),
		);

		await expect(getEntitlements()).rejects.toThrow();
	});
});
