import type { ClassTier } from '../classes';
import type { Product } from '../products';

export interface ProductClassInfo {
	id: string;
	name: string;
	tier: ClassTier;
}

export interface ProductSystemClassInfo {
	id: string;
	name: string;
}

export interface ProductCardProps {
	product: Product;
	/** Classes às quais o produto pertence (para exibir na listagem) */
	productClasses?: ProductClassInfo[];
	/** System classes às quais o produto pertence */
	productSystemClasses?: ProductSystemClassInfo[];
}
