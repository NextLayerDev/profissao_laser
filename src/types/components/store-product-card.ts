import type { ClassWithProducts } from '@/types/classes';
import type { Product } from '@/types/products';
import type { SystemClassWithRelations } from '@/types/system-classes';

export interface ProductVariant {
	product: Product;
	classInfo?: ClassWithProducts;
	systemClassInfo?: SystemClassWithRelations;
	systemClasses?: SystemClassWithRelations[];
}

export interface StoreProductCardProps {
	variants: ProductVariant[];
}
