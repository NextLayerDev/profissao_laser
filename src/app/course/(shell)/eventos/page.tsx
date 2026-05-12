'use client';

import { Loader2, Lock, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EventsView } from '@/components/community/events-view';
import { useCustomerFeatures } from '@/hooks/use-customer-features';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { getCurrentUser, getToken } from '@/lib/auth';
import { FULL_FEATURES } from '@/utils/constants/class-features';

export default function EventosShellPage() {
	const router = useRouter();
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
	const hasComunidadeAccess = features?.comunidade ?? false;

	if (email === undefined || isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (email === null) {
		router.replace('/login');
		return null;
	}

	if (!hasComunidadeAccess) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="text-center max-w-md px-6">
					<div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-6 shadow-lg dark:shadow-none">
						<Lock className="w-16 h-16 text-violet-400 mx-auto mb-4" />
						<h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
							Acesso a Eventos
						</h2>
						<p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
							{upgradeTiers?.comunidade
								? `Os eventos estao disponiveis no plano ${upgradeTiers.comunidade}. Faca upgrade para aceder.`
								: 'Os eventos estao disponiveis apenas para planos com acesso a comunidade. Faca upgrade na loja para aceder.'}
						</p>
					</div>
					<Link
						href="/course/store"
						className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors"
					>
						<Store className="w-5 h-5" />
						Ver planos na loja
					</Link>
				</div>
			</div>
		);
	}

	return <EventsView isAdmin={isAdmin} />;
}
