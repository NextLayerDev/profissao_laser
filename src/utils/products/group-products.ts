import type { Product } from '@/types/products';

/**
 * Agrupa produtos por `name`, preservando a ordem de primeira aparição
 * tanto dos grupos quanto dos itens dentro de cada grupo.
 */
export function groupProductsByName(products: Product[]): Product[][] {
	const map = new Map<string, Product[]>();
	for (const p of products) {
		const existing = map.get(p.name);
		if (existing) {
			existing.push(p);
		} else {
			map.set(p.name, [p]);
		}
	}
	return Array.from(map.values());
}

/**
 * Versão padrão de um grupo: a versão `ativo` de menor preço.
 * Se nenhuma estiver ativa, a primeira versão do grupo.
 */
export function pickDefaultVersion(versions: Product[]): Product {
	const active = versions.filter((v) => v.status === 'ativo');
	const pool = active.length > 0 ? active : versions;
	return pool.reduce((cheapest, v) =>
		v.price < cheapest.price ? v : cheapest,
	);
}

/**
 * Menor preço entre as versões `ativo`; se nenhuma ativa,
 * menor preço entre todas as versões.
 */
export function groupStartingPrice(versions: Product[]): number {
	const active = versions.filter((v) => v.status === 'ativo');
	const pool = active.length > 0 ? active : versions;
	return pool.reduce(
		(min, v) => (v.price < min ? v.price : min),
		pool[0].price,
	);
}
