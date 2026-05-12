'use client';

import { Loader2, Lock, Store } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DesignEditorView } from '@/components/canva/design-editor-view';
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
		return (
			<div className="flex items-center justify-center py-32">
				<Loader2 className="w-8 h-8 text-lime-500 animate-spin" />
			</div>
		);
	}

	if (!hasAccess) {
		return (
			<div className="flex items-center justify-center py-32">
				<div className="text-center max-w-sm">
					<div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800/50 mb-4">
						<Lock className="w-14 h-14 text-lime-400 mx-auto mb-3" />
						<h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
							Acesso ao Canva
						</h2>
						<p className="text-slate-500 dark:text-gray-500 text-sm">
							{upgradeTiers?.vetorizacao
								? `Disponivel no plano ${upgradeTiers.vetorizacao}.`
								: 'Disponivel em planos com Canva.'}
						</p>
					</div>
					<Link
						href="/store"
						className="inline-flex items-center gap-2 px-5 py-2.5 bg-lime-600 hover:bg-lime-500 text-white font-medium rounded-xl transition-colors"
					>
						<Store className="w-4 h-4" />
						Ver planos
					</Link>
				</div>
			</div>
		);
	}

	return <DesignEditorView designId={id} />;
}
