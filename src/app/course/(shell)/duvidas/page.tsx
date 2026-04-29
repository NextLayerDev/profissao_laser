'use client';

import {
	BookOpen,
	Loader2,
	Lock,
	MessageSquare,
	MessagesSquare,
	Store,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DoubtsClientView } from '@/components/duvidas/doubts-client-view';
import { FAQStudentTab } from '@/components/duvidas/faq-student-tab';
import { ForumTab } from '@/components/duvidas/forum-tab';
import { useCustomerFeatures } from '@/hooks/use-customer-features';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { useDoubtChats } from '@/hooks/use-doubt-chat';
import { getCurrentUser, getToken } from '@/lib/auth';
import { FULL_FEATURES } from '@/utils/constants/class-features';

export default function DuvidasCoursePage() {
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [name, setName] = useState<string>('');
	const [isAdmin, setIsAdmin] = useState(false);
	const [tab, setTab] = useState<'faq' | 'forum' | 'pending' | 'answered'>(
		'faq',
	);

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

	const { data: allChats = [] } = useDoubtChats('all', hasAccess);
	const pendingCount = allChats.filter((c) => c.status === 'pending').length;
	const answeredCount = allChats.filter((c) => c.status === 'answered').length;

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
						Você não está logado
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

	return (
		<div className="p-4 md:p-8 max-w-4xl mx-auto">
			<div className="mb-6 flex items-center gap-3">
				<div className="bg-linear-to-br from-violet-500 to-indigo-600 rounded-lg p-2">
					<MessageSquare className="w-5 h-5 text-white" />
				</div>
				<div>
					<h2 className="text-2xl font-black text-slate-900 dark:text-white">
						Dúvidas
					</h2>
					<p className="text-slate-500 dark:text-gray-500 text-sm">
						Olá, {name || 'bem-vindo'}. Envie e acompanhe suas dúvidas.
					</p>
				</div>
			</div>

			{!hasAccess ? (
				<div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800/50 rounded-2xl text-center">
					<Lock className="w-16 h-16 text-slate-300 dark:text-gray-700 mb-4" />
					<p className="font-medium text-slate-600 dark:text-gray-400">
						{upgradeTiers?.chat
							? `Dúvidas disponível no plano ${upgradeTiers.chat}`
							: 'Dúvidas disponível no plano Ouro ou Platina'}
					</p>
					<Link
						href="/store"
						className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
					>
						<Store className="w-4 h-4" />
						Ver planos
					</Link>
				</div>
			) : (
				<div className="space-y-6">
					<div className="flex gap-1 border-b border-slate-200 dark:border-gray-800/50">
						{(
							[
								{ key: 'faq', Icon: BookOpen, label: 'Frequentes' },
								{ key: 'forum', Icon: MessagesSquare, label: 'Fórum' },
								{
									key: 'pending',
									label: 'Pendentes',
									badge: pendingCount,
									badgeClass:
										'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',
								},
								{
									key: 'answered',
									label: 'Respondidas',
									badge: answeredCount,
									badgeClass:
										'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
								},
							] as Array<{
								key: string;
								Icon?: React.ElementType;
								label: string;
								badge?: number;
								badgeClass?: string;
							}>
						).map(({ key, Icon, label, badge, badgeClass }) => (
							<button
								key={key}
								type="button"
								onClick={() =>
									setTab(key as 'faq' | 'forum' | 'pending' | 'answered')
								}
								className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all border-b-2 -mb-px ${
									tab === key
										? 'text-violet-600 dark:text-violet-400 border-violet-500'
										: 'text-slate-500 dark:text-gray-500 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
								}`}
							>
								{Icon && <Icon className="w-4 h-4" />}
								{label}
								{badge != null && badge > 0 && (
									<span
										className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${badgeClass}`}
									>
										{badge}
									</span>
								)}
							</button>
						))}
					</div>

					{tab === 'faq' && <FAQStudentTab />}
					{tab === 'forum' && <ForumTab currentUserId={customerId} />}
					{(tab === 'pending' || tab === 'answered') && (
						<DoubtsClientView
							key={tab}
							customerId={customerId}
							customerName={name || 'Utilizador'}
							hasAccess={hasAccess}
							defaultTab={tab}
						/>
					)}
				</div>
			)}
		</div>
	);
}
