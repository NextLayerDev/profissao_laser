import type { Product } from '../products';

export interface ProductGridProps {
	products: Product[];
	isLoading: boolean;
	error: Error | null;
}
