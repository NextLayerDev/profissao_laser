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

		const userSlugs = new Set(
			plans.map((p) => p.slug).filter((s): s is string => s !== null),
		);

		const userClasses = classes.filter((cls) =>
			cls.products.some((p) => userSlugs.has(p.slug)),
		);

		if (userClasses.length === 0) return null;

		const features: CustomerFeatures = {
			aula: userClasses.some((c) => c.aula),
			chat: userClasses.some((c) => c.chat),
			vetorizacao: userClasses.some((c) => c.vetorizacao),
			suporte: userClasses.some((c) => c.suporte),
			comunidade: userClasses.some((c) => c.comunidade),
		};

		const upgradeTiers = computeUpgradeTiers(userClasses, features);

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

		const hasPlanForCourse = plans.some((p) => p.slug === courseSlug);
		if (!hasPlanForCourse) return null;

		const userClasses = classes.filter((cls) =>
			cls.products.some((p) => p.slug === courseSlug),
		);

		if (userClasses.length === 0) return null;

		const features: CustomerFeatures = {
			aula: userClasses.some((c) => c.aula),
			chat: userClasses.some((c) => c.chat),
			vetorizacao: userClasses.some((c) => c.vetorizacao),
			suporte: userClasses.some((c) => c.suporte),
			comunidade: userClasses.some((c) => c.comunidade),
		};

		const upgradeTiers = computeUpgradeTiers(userClasses, features);

		return { features, upgradeTiers };
	}, [plans, courseSlug, classes]);
}
