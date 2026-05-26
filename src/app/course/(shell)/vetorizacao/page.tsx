'use client';

import { useEffect, useState } from 'react';
import { AccessGate } from '@/components/ui/access-gate';
import { WizardSkeleton } from '@/components/ui/skeletons/wizard-skeleton';
import { VetorizacaoView } from '@/components/vetorizacao/vetorizacao-view';
import { useCustomerFeatures } from '@/hooks/use-customer-features';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { getCurrentUser, getToken } from '@/lib/auth';
import { FULL_FEATURES } from '@/utils/constants/class-features';

export default function VetorizacaoCoursePage() {
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		const user = getCurrentUser();
		setEmail(user?.email ?? null);
		setIsAdmin(!!getToken('user') && user?.role != null);
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
				feature="Vetorizacao"
				upgradeTier={upgradeTiers?.vetorizacao}
			/>
		);
	}

	return <VetorizacaoView />;
}
