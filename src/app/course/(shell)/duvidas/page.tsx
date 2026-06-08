'use client';

import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { SuporteOnlineView } from '@/components/suporte/suporte-online-view';
import { SupportSkeleton } from '@/components/ui/skeletons/support-skeleton';
import { getCurrentUser } from '@/lib/auth';

export default function DuvidasCoursePage() {
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [name, setName] = useState<string>('');

	useEffect(() => {
		const user = getCurrentUser();
		setEmail(user?.email ?? null);
		setName(user?.name ?? '');
	}, []);

	const customerId = getCurrentUser()?.sub ?? 'customer-1';

	if (email === undefined) {
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

	return (
		<SubscriptionGate>
			<SuporteOnlineView
				customerId={customerId}
				customerName={name || 'Utilizador'}
				hasAccess={true}
			/>
		</SubscriptionGate>
	);
}
