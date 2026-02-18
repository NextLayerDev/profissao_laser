import { Loader2 } from 'lucide-react';
import type { ProductGridProps } from '@/types/components/product-grid';
import { ProductCard } from './product-card';

export function ProductGrid({ products, isLoading, error }: ProductGridProps) {
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
				<ProductCard key={product.id} product={product} />
			))}
		</div>
	);
}
