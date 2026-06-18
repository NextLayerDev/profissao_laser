import type { Product } from '@/modules/catalog';
import type { ClassWithProducts } from '@/types/classes';
import type { CustomerPlan } from '@/types/plans';
import type { SystemClassWithRelations } from '@/types/system-classes';

export interface ProductVariant {
	product: Product;
	classInfo?: ClassWithProducts;
	systemClassInfo?: SystemClassWithRelations;
	systemClasses?: SystemClassWithRelations[];
}

export interface StoreProductCardProps {
	variants: ProductVariant[];
	ownedPlans?: CustomerPlan[];
}
