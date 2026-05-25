'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShowcaseView } from '@/components/community/showcase-view';
import { AccessGate } from '@/components/ui/access-gate';
import { CardGridSkeleton } from '@/components/ui/skeletons/card-grid-skeleton';
import { useCustomerFeatures } from '@/hooks/use-customer-features';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { useIsAdmin } from '@/modules/me';
import { getCurrentUser } from '@/shared/lib/auth';
import { FULL_FEATURES } from '@/utils/constants/class-features';

export default function VitrineCoursePage() {
	const router = useRouter();
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [name, setName] = useState('');
	const isAdmin = useIsAdmin();

	useEffect(() => {
		const user = getCurrentUser();
		setEmail(user?.email ?? null);
		setName(user?.name ?? '');
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
	const hasComunidadeAccess = features?.comunidade ?? false;

	if (email === undefined || isLoading) {
		return <CardGridSkeleton count={6} cols={3} />;
	}

	if (email === null) {
		router.replace('/login');
		return null;
	}

	if (!hasComunidadeAccess) {
		return (
			<AccessGate
				feature="Vitrine"
				featureLabel="Vitrine de Projetos"
				upgradeTier={upgradeTiers?.comunidade}
			/>
		);
	}

	const userInitials = name
		? name
				.trim()
				.split(' ')
				.slice(0, 2)
				.map((w) => w[0])
				.join('')
				.toUpperCase() || (email ?? 'U').substring(0, 2).toUpperCase()
		: (email ?? 'U').substring(0, 2).toUpperCase();

	return (
		<ShowcaseView
			userName={name || email?.split('@')[0] || 'Voce'}
			userInitials={userInitials}
			isAdmin={isAdmin}
		/>
	);
}
