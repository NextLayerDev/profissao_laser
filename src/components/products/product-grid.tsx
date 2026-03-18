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
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
			{products.map((product) => (
				<ProductCard
					key={product.id}
					product={product}
					productClasses={productClassesMap.get(product.id)}
					productSystemClasses={productSystemClassesMap.get(product.id)}
				/>
			))}
		</div>
	);
}
