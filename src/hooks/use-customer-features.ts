'use client';

import { useMemo } from 'react';
import { useClasses } from '@/hooks/use-classes';
import type { CustomerFeatures } from '@/types/classes';
import type { CustomerPlan } from '@/types/plans';

export type { CustomerFeatures };

export function useCustomerFeatures(
	plans: CustomerPlan[] | undefined,
): CustomerFeatures | null {
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

		return {
			aula: userClasses.some((c) => c.aula),
			chat: userClasses.some((c) => c.chat),
			vetorizacao: userClasses.some((c) => c.vetorizacao),
			suporte: userClasses.some((c) => c.suporte),
			comunidade: userClasses.some((c) => c.comunidade),
		};
	}, [plans, classes]);
}
