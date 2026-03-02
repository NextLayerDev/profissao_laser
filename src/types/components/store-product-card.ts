import type { ClassWithProducts } from '@/types/classes';
import type { Product } from '@/types/products';

export interface StoreProductCardProps {
	product: Product;
	classInfo?: ClassWithProducts;
}
