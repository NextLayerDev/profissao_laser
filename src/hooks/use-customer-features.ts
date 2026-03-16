'use client';

import { useMemo } from 'react';
import { useClasses } from '@/hooks/use-classes';
import type {
	CustomerFeatures,
	FeatureKey,
	FeatureUpgradeTiers,
} from '@/types/classes';
import type { CustomerPlan } from '@/types/plans';
import { TIER_STYLES } from '@/utils/constants/tier-styles';

const TIER_ORDER: Record<string, number> = { prata: 0, ouro: 1, platina: 2 };

export type { CustomerFeatures };

export type CustomerFeaturesResult = {
	features: CustomerFeatures;
	upgradeTiers: FeatureUpgradeTiers;
};

function computeUpgradeTiers(
	userClasses: { tier: string; [key: string]: unknown }[],
	features: CustomerFeatures,
): FeatureUpgradeTiers {
	const featureKeys: FeatureKey[] = [
		'aula',
		'chat',
		'vetorizacao',
		'suporte',
		'comunidade',
	];
	const result: FeatureUpgradeTiers = {
		aula: null,
		chat: null,
		vetorizacao: null,
		suporte: null,
		comunidade: null,
	};
	for (const key of featureKeys) {
		if (features[key]) continue;
		const classesWithFeature = userClasses
			.filter((c) => c[key])
			.sort((a, b) => (TIER_ORDER[a.tier] ?? 99) - (TIER_ORDER[b.tier] ?? 99));
		const first = classesWithFeature[0];
		result[key] = first
			? (TIER_STYLES[first.tier as keyof typeof TIER_STYLES]?.label ??
				first.tier)
			: null;
	}
	return result;
}

export function useCustomerFeatures(
	plans: CustomerPlan[] | undefined,
): CustomerFeaturesResult | null {
	const { classes } = useClasses();

	return useMemo(() => {
		if (!plans || classes.length === 0) return null;

		// Build a map: slug → highest tier order the customer has for it
		const slugTierOrder = new Map<string, number>();
		for (const plan of plans) {
			if (plan.slug === null) continue;
			const order =
				plan.tier !== undefined ? (TIER_ORDER[plan.tier] ?? 99) : 99;
			const existing = slugTierOrder.get(plan.slug);
			if (existing === undefined || order > existing) {
				slugTierOrder.set(plan.slug, order);
			}
		}

		if (slugTierOrder.size === 0) return null;

		const userClasses = classes.filter((cls) =>
			cls.products.some((p) => {
				const tierOrder = slugTierOrder.get(p.slug);
				return (
					tierOrder !== undefined && (TIER_ORDER[cls.tier] ?? 99) <= tierOrder
				);
			}),
		);

		if (userClasses.length === 0) return null;

		// For upgrade hints, use all classes for the customer's products
		const allUserClasses = classes.filter((cls) =>
			cls.products.some((p) => slugTierOrder.has(p.slug)),
		);

		const features: CustomerFeatures = {
			aula: userClasses.some((c) => c.aula),
			chat: userClasses.some((c) => c.chat),
			vetorizacao: userClasses.some((c) => c.vetorizacao),
			suporte: userClasses.some((c) => c.suporte),
			comunidade: userClasses.some((c) => c.comunidade),
		};

		const upgradeTiers = computeUpgradeTiers(allUserClasses, features);

		return { features, upgradeTiers };
	}, [plans, classes]);
}

/** Features apenas para um curso específico (por slug) */
export function useCustomerFeaturesForCourse(
	plans: CustomerPlan[] | undefined,
	courseSlug: string | undefined,
): CustomerFeaturesResult | null {
	const { classes } = useClasses();

	return useMemo(() => {
		if (
			!plans ||
			!courseSlug ||
			courseSlug.trim() === '' ||
			classes.length === 0
		)
			return null;

		const planForCourse = plans.find((p) => p.slug === courseSlug);
		if (!planForCourse) return null;

		const customerTierOrder =
			planForCourse.tier !== undefined
				? (TIER_ORDER[planForCourse.tier] ?? 99)
				: 99; // 99 = no restriction (backward-compatible fallback)

		// Classes at the customer's tier or below
		const userClasses = classes.filter(
			(cls) =>
				cls.products.some((p) => p.slug === courseSlug) &&
				(TIER_ORDER[cls.tier] ?? 99) <= customerTierOrder,
		);

		if (userClasses.length === 0) return null;

		// For upgrade hints, use ALL classes for the product (not tier-filtered)
		const allClassesForCourse = classes.filter((cls) =>
			cls.products.some((p) => p.slug === courseSlug),
		);

		const features: CustomerFeatures = {
			aula: userClasses.some((c) => c.aula),
			chat: userClasses.some((c) => c.chat),
			vetorizacao: userClasses.some((c) => c.vetorizacao),
			suporte: userClasses.some((c) => c.suporte),
			comunidade: userClasses.some((c) => c.comunidade),
		};

		const upgradeTiers = computeUpgradeTiers(allClassesForCourse, features);

		return { features, upgradeTiers };
	}, [plans, courseSlug, classes]);
}
