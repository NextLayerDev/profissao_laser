import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import type { ProductCardProps } from '@/types/components/product-card';
import type { ProductGridProps } from '@/types/components/product-grid';
import { groupProductsByName } from '@/utils/products/group-products';
import { ProductGroupCard } from './product-group-card';

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
	systemClasses,
}: ProductGridProps) {
	const systemClassesByVersion = useMemo(() => {
		const map = new Map<string, ProductCardProps['productSystemClasses']>();
		products.forEach((p) => {
			map.set(p.id, getProductSystemClasses(p.id, systemClasses));
		});
		return map;
	}, [products, systemClasses]);

	const groups = useMemo(() => groupProductsByName(products), [products]);

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
			{groups.map((group) => (
				<ProductGroupCard
					key={group[0].name}
					versions={group}
					systemClassesByVersion={systemClassesByVersion}
				/>
			))}
		</div>
	);
}
