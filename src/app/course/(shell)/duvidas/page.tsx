'use client';

import { Loader2, Lock, MessageSquare, Store } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SuporteOnlineView } from '@/components/suporte/suporte-online-view';
import { useCustomerFeatures } from '@/hooks/use-customer-features';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { getCurrentUser, getToken } from '@/lib/auth';
import { FULL_FEATURES } from '@/utils/constants/class-features';

export default function DuvidasCoursePage() {
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [name, setName] = useState<string>('');
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		const user = getCurrentUser();
		setEmail(user?.email ?? null);
		setName(user?.name ?? '');
		setIsAdmin(!!getToken('user') && user?.role != null);
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
		return (
			<div className="flex items-center justify-center py-32">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (email === null) {
		return (
			<div className="flex items-center justify-center py-32">
				<div className="text-center">
					<MessageSquare className="w-12 h-12 text-slate-400 dark:text-gray-600 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-gray-500 font-medium">
						Voce nao esta logado
					</p>
					<Link
						href="/login"
						className="mt-4 inline-block px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
					>
						Fazer login
					</Link>
				</div>
			</div>
		);
	}

	if (!hasAccess) {
		return (
			<div className="p-4 md:p-8 max-w-4xl mx-auto">
				<div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800/50 rounded-2xl text-center">
					<Lock className="w-16 h-16 text-slate-300 dark:text-gray-700 mb-4" />
					<p className="font-medium text-slate-600 dark:text-gray-400">
						{upgradeTiers?.chat
							? `Duvidas disponivel no plano ${upgradeTiers.chat}`
							: 'Duvidas disponivel no plano Ouro ou Platina'}
					</p>
					<Link
						href="/store"
						className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
					>
						<Store className="w-4 h-4" />
						Ver planos
					</Link>
				</div>
			</div>
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
