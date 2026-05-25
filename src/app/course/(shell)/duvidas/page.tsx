'use client';

import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SuporteOnlineView } from '@/components/suporte/suporte-online-view';
import { AccessGate } from '@/components/ui/access-gate';
import { SupportSkeleton } from '@/components/ui/skeletons/support-skeleton';
import { useCustomerFeatures } from '@/hooks/use-customer-features';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { useIsAdmin } from '@/modules/me';
import { getCurrentUser } from '@/shared/lib/auth';
import { FULL_FEATURES } from '@/utils/constants/class-features';

export default function DuvidasCoursePage() {
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [name, setName] = useState<string>('');
	const isAdmin = useIsAdmin();

	useEffect(() => {
		const user = getCurrentUser();
		setEmail(user?.email ?? null);
		setName(user?.name ?? '');
	}, []);

	const { data: plans } = useCustomerPlans(email ?? null);
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
	const hasAccess = !!features?.chat;

	const customerId = getCurrentUser()?.sub ?? 'customer-1';

	if (email === undefined || !plans) {
		return <SupportSkeleton />;
	}

	if (email === null) {
		return (
			<div className="flex items-center justify-center py-32">
				<div className="text-center">
					<MessageSquare className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-gray-400 font-medium">
						Voce nao esta logado
					</p>
					<Link
						href="/login"
						className="mt-4 inline-block px-5 py-2 bg-violet-600 hover:bg-violet-400 text-white text-sm font-medium rounded-lg transition-colors"
					>
						Fazer login
					</Link>
				</div>
			</div>
		);
	}

	if (!hasAccess) {
		return (
			<AccessGate
				feature="Duvidas"
				featureLabel="Suporte online"
				upgradeTier={upgradeTiers?.chat}
			/>
		);
	}

	return (
		<SuporteOnlineView
			customerId={customerId}
			customerName={name || 'Utilizador'}
			hasAccess={hasAccess}
		/>
	);
}
