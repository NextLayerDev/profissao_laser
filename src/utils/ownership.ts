import type { ClassWithProducts } from '@/types/classes';
import type { CustomerPlan } from '@/types/plans';
import type { Product } from '@/types/products';

export type OwnershipStatus = 'none' | 'owned' | 'upgrade' | 'downgrade';

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

	const selected = variants[selectedIndex];
	if (!selected) return 'owned';

	// Try price-based comparison first (covers both tier and system class changes)
	const ownedVariant = variants.find((v) => v.product.slug === ownedPlan.slug);

	if (ownedVariant) {
		if (selected.product.price > ownedVariant.product.price) return 'upgrade';
		if (selected.product.price < ownedVariant.product.price) return 'downgrade';
		return 'owned';
	}

	// Fallback: tier-based comparison when owned variant is not in the list
	if (!ownedPlan.tier) return 'owned';

	const selectedTier = selected.classInfo?.tier;
	if (!selectedTier) return 'owned';

	const ownedIdx = TIER_ORDER[ownedPlan.tier] ?? -1;
	const selectedIdx = TIER_ORDER[selectedTier] ?? -1;

	if (selectedIdx > ownedIdx) return 'upgrade';
	if (selectedIdx < ownedIdx) return 'downgrade';
	return 'owned';
}
