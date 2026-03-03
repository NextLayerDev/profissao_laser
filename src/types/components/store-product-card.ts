import type { ClassWithProducts } from '@/types/classes';
import type { Product } from '@/types/products';

export interface ProductVariant {
	product: Product;
	classInfo?: ClassWithProducts;
}

export interface StoreProductCardProps {
	variants: ProductVariant[];
}
