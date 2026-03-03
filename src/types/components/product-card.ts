import type { ClassTier } from '../classes';
import type { Product } from '../products';

export interface ProductClassInfo {
	id: string;
	name: string;
	tier: ClassTier;
}

export interface ProductCardProps {
	product: Product;
	/** Classes às quais o produto pertence (para exibir na listagem) */
	productClasses?: ProductClassInfo[];
}
