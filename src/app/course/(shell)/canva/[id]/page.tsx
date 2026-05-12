'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DesignEditorView } from '@/components/canva/design-editor-view';
import { AccessGate } from '@/components/ui/access-gate';
import { EditorSkeleton } from '@/components/ui/skeletons/editor-skeleton';
import { useCustomerFeatures } from '@/hooks/use-customer-features';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { getCurrentUser, getToken } from '@/lib/auth';
import { FULL_FEATURES } from '@/utils/constants/class-features';

export default function DesignEditorPage() {
	const { id } = useParams<{ id: string }>();
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
		return <EditorSkeleton />;
	}

	if (!hasAccess) {
		return (
			<AccessGate feature="Canva" upgradeTier={upgradeTiers?.vetorizacao} />
		);
	}

	return <DesignEditorView designId={id} />;
}
