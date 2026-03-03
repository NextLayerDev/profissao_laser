import type { ClassWithProducts } from '../classes';
import type { Product } from '../products';

export interface ProductGridProps {
	products: Product[];
	isLoading: boolean;
	error: Error | null;
	/** Lista de classes (com produtos) para mostrar a qual classe cada produto pertence */
	classes?: ClassWithProducts[];
}
