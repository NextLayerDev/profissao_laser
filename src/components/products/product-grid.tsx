import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import type { ProductCardProps } from '@/types/components/product-card';
import type { ProductGridProps } from '@/types/components/product-grid';
import { ProductCard } from './product-card';

function getProductClasses(
	productId: string,
	classes?: ProductGridProps['classes'],
): ProductCardProps['productClasses'] {
	if (!classes?.length) return undefined;
	return classes
		.filter((cls) => cls.products.some((p) => p.id === productId))
		.map((cls) => ({ id: cls.id, name: cls.name, tier: cls.tier }));
}

function getProductSystemClasses(
	productId: string,
	systemClasses?: ProductGridProps['systemClasses'],
): ProductCardProps['productSystemClasses'] {
	if (!systemClasses?.length) return undefined;
	return systemClasses
		.filter((sc) => sc.products.some((p) => p.id === productId))
		.map((sc) => ({ id: sc.id, name: sc.name }));
}

export function ProductGrid({
	products,
	isLoading,
	error,
	classes,
	systemClasses,
}: ProductGridProps) {
	const productClassesMap = useMemo(() => {
		const map = new Map<string, ProductCardProps['productClasses']>();
		products.forEach((p) => {
			map.set(p.id, getProductClasses(p.id, classes));
		});
		return map;
	}, [products, classes]);

	const productSystemClassesMap = useMemo(() => {
		const map = new Map<string, ProductCardProps['productSystemClasses']>();
		products.forEach((p) => {
			map.set(p.id, getProductSystemClasses(p.id, systemClasses));
		});
		return map;
	}, [products, systemClasses]);

	// Agrupa por nome exato, preservando a ordem de primeira aparição
	const groups = useMemo(() => {
		const map = new Map<string, typeof products>();
		for (const p of products) {
			if (!map.has(p.name)) map.set(p.name, []);
			map.get(p.name)?.push(p);
		}
		return Array.from(map.values());
	}, [products]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-20">
				<p className="text-red-400">Erro ao carregar produtos.</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-8">
			{groups.map((group) => (
				<div key={group[0].name}>
					{group.length > 1 && (
						<div className="flex items-center gap-3 mb-3">
							<h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 shrink-0">
								{group[0].name}
							</h3>
							<span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20 shrink-0">
								{group.length} versões
							</span>
							<div className="flex-1 h-px bg-slate-200 dark:bg-gray-800" />
						</div>
					)}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						{group.map((product) => (
							<ProductCard
								key={product.id}
								product={product}
								productClasses={productClassesMap.get(product.id)}
								productSystemClasses={productSystemClassesMap.get(product.id)}
							/>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
