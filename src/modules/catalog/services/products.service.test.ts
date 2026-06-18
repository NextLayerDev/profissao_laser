import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/msw/server';
import { getProducts } from './products.service';

const BASE = 'http://localhost/api';

function fakeProduct(overrides: Record<string, unknown> = {}) {
	return {
		id: '11111111-1111-4111-8111-111111111111',
		name: 'Curso de Laser',
		type: 'curso',
		description: null,
		image: null,
		price: 19900,
		status: 'ativo',
		slug: 'curso-de-laser',
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
		language: 'pt',
		country: 'BR',
		category: null,
		refundDays: 7,
		stripeProductId: null,
		stripePriceId: null,
		machine: null,
		software: null,
		...overrides,
	};
}

describe('getProducts', () => {
	it('retorna e valida a lista de produtos do backend', async () => {
		server.use(
			http.get(`${BASE}/products`, () =>
				HttpResponse.json([
					fakeProduct(),
					fakeProduct({ id: '22222222-2222-4222-8222-222222222222' }),
				]),
			),
		);

		const products = await getProducts();

		expect(products).toHaveLength(2);
		expect(products[0].name).toBe('Curso de Laser');
		expect(products[0].status).toBe('ativo');
	});

	it('rejeita quando a resposta não bate com o schema Zod', async () => {
		server.use(
			http.get(`${BASE}/products`, () =>
				HttpResponse.json([{ id: 'nao-e-uuid', name: 123 }]),
			),
		);

		await expect(getProducts()).rejects.toThrow();
	});
});
