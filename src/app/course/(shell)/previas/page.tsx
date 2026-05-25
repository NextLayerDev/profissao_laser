'use client';

import { useEffect, useState } from 'react';
import { PreviasView } from '@/components/previas/previas-view';
import { AccessGate } from '@/components/ui/access-gate';
import { WizardSkeleton } from '@/components/ui/skeletons/wizard-skeleton';
import { useCustomerFeatures } from '@/hooks/use-customer-features';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { useIsAdmin } from '@/modules/me';
import { getCurrentUser } from '@/shared/lib/auth';
import { FULL_FEATURES } from '@/utils/constants/class-features';

export default function PreviasCoursePage() {
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const isAdmin = useIsAdmin();

	useEffect(() => {
		const user = getCurrentUser();
		setEmail(user?.email ?? null);
	}, []);

	const { data: plans, isLoading } = useCustomerPlans(email ?? null);
	const activePlans =
		plans?.filter((p) => p.status === 'active' || p.status === 'ativo') ?? [];
	const customerFeatures = useCustomerFeatures(
		activePlans.length > 0 ? activePlans : undefined,
	);
	const features = isAdmin
		? FULL_FEATURES
		: (customerFeatures?.features ?? null);
	const upgradeTiers = isAdmin
		? null
		: (customerFeatures?.upgradeTiers ?? null);
	const hasAccess = features?.vetorizacao ?? false;

	if (email === undefined || isLoading) {
		return <WizardSkeleton />;
	}

	if (!hasAccess) {
		return (
			<AccessGate
				feature="Previas IA"
				upgradeTier={upgradeTiers?.vetorizacao}
			/>
		);
	}

	return <PreviasView />;
}
