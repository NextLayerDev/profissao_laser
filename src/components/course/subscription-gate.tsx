'use client';

import { Lock } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { WizardSkeleton } from '@/components/ui/skeletons/wizard-skeleton';
import { getToken } from '@/lib/auth';
import { useEntitlements } from '@/modules/subscriptions';

/**
 * Gates a tool area: only customers with an ACTIVE plan (or test-unlimited, or
 * staff) can enter. Access is 100% plan-driven — no active plan ⇒ "assine um
 * plano". Per-tool USAGE is gated separately (at invoke time). Replaces the old
 * all-or-nothing AccessGate + per-course feature model.
 */
export function SubscriptionGate({ children }: { children: ReactNode }) {
	const isStaff = typeof window !== 'undefined' && !!getToken('user');
	const { isTestUnlimited, hasActiveSubscription, isLoading } =
		useEntitlements();

	if (isStaff) return <>{children}</>;
	if (isLoading) return <WizardSkeleton />;
	if (isTestUnlimited || hasActiveSubscription) return <>{children}</>;

	return (
		<div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-[fade-in-up_0.5s_ease-out_both]">
			<div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-6">
				<Lock className="w-7 h-7 text-slate-400 dark:text-gray-500" />
			</div>
			<h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
				Assine um plano para acessar
			</h2>
			<p className="text-slate-500 dark:text-gray-400 text-sm max-w-sm mb-6">
				As ferramentas ficam disponíveis com um plano ativo. Escolha um plano
				para começar.
			</p>
			<Link
				href="/course/store"
				className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-400 text-white font-medium text-sm rounded-lg transition-colors"
			>
				Ver planos
			</Link>
		</div>
	);
}
