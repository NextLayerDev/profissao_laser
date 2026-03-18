import type { ClassWithProducts } from '@/types/classes';
import type { CustomerPlan } from '@/types/plans';
import type { Product } from '@/types/products';

export type OwnershipStatus = 'none' | 'owned' | 'upgrade';

export const TIER_ORDER: Record<string, number> = {
	prata: 0,
	ouro: 1,
	platina: 2,
};

export interface ProductVariantRef {
	product: Product;
	classInfo?: ClassWithProducts;
}

export function resolveOwnership(
	plans: CustomerPlan[],
	variants: ProductVariantRef[],
	selectedIndex: number,
): OwnershipStatus {
	if (variants.length === 0) return 'none';

	const ownedPlan = plans.find(
		(p) =>
			(p.status === 'ativo' || p.status === 'active') &&
			(variants.some((v) => v.product.slug === p.slug) ||
				p.product_name.trim() === variants[0].product.name.trim()),
	);

	if (!ownedPlan) return 'none';

	// No tier info on the plan — product was purchased as non-tiered
	if (!ownedPlan.tier) return 'owned';

	const selectedTier = variants[selectedIndex]?.classInfo?.tier;

	// Selected variant has no tier info — treat as owned
	if (!selectedTier) return 'owned';

	const ownedIdx = TIER_ORDER[ownedPlan.tier] ?? -1;
	const selectedIdx = TIER_ORDER[selectedTier] ?? -1;

	if (selectedIdx > ownedIdx) return 'upgrade';
	return 'owned';
}
