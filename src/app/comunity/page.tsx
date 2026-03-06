'use client';

import { Loader2, Lock, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CommunityView } from '@/components/community/community-view';
import { useCustomerFeatures } from '@/hooks/use-customer-features';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { getCurrentUser, getToken } from '@/lib/auth';
import { FULL_FEATURES } from '@/utils/constants/class-features';

const Background = () => (
	<div className="fixed inset-0 bg-linear-to-br from-slate-100 via-white to-slate-50 dark:from-[#12103a] dark:via-[#0d0b1e] dark:to-[#0a0818] pointer-events-none" />
);

export default function ComunityPage() {
	const router = useRouter();
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [name, setName] = useState<string>('');
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		const user = getCurrentUser();
		setEmail(user?.email ?? null);
		setName(user?.name ?? '');
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
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0b1e] flex items-center justify-center">
				<Background />
				<Loader2 className="relative z-10 w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (email === null) {
		router.replace('/login');
		return null;
	}

	if (!hasComunidadeAccess) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0b1e] flex items-center justify-center">
				<Background />
				<div className="relative z-10 text-center max-w-md px-6">
					<div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-6 shadow-lg dark:shadow-none">
						<Lock className="w-16 h-16 text-violet-400 mx-auto mb-4" />
						<h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
							Acesso à Comunidade
						</h2>
						<p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
							{upgradeTiers?.comunidade
								? `A comunidade está disponível no plano ${upgradeTiers.comunidade}. Faça upgrade para aceder.`
								: 'A comunidade VIP está disponível apenas para planos com acesso à comunidade. Faça upgrade na loja para aceder.'}
						</p>
					</div>
					<Link
						href="/store"
						className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors"
					>
						<Store className="w-5 h-5" />
						Ver planos na loja
					</Link>
					<Link
						href="/course"
						className="block mt-4 text-violet-400 hover:text-violet-300 text-sm"
					>
						Voltar aos cursos
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0b1e] text-slate-900 dark:text-white font-sans">
			<Background />
			<CommunityView
				userName={name || email?.split('@')[0] || 'Você'}
				userEmail={email}
				isAdmin={isAdmin}
				userInitials={
					name
						? name
								.trim()
								.split(' ')
								.slice(0, 2)
								.map((w) => w[0])
								.join('')
								.toUpperCase() || (email ?? 'U').substring(0, 2).toUpperCase()
						: (email ?? 'U').substring(0, 2).toUpperCase()
				}
				onBack={() => router.push('/course')}
			/>
		</div>
	);
}
