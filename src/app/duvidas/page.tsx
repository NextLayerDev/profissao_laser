'use client';

import {
	ArrowLeft,
	BookOpen,
	Loader2,
	Lock,
	MessageSquare,
	Store,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DoubtsClientView } from '@/components/duvidas/doubts-client-view';
import { FAQStudentTab } from '@/components/duvidas/faq-student-tab';
import { UserBadge } from '@/components/store/user-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCustomerFeatures } from '@/hooks/use-customer-features';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { useDoubtChats } from '@/hooks/use-doubt-chat';
import { getCurrentUser, getToken } from '@/lib/auth';
import { FULL_FEATURES } from '@/utils/constants/class-features';

const Background = () => (
	<>
		<div className="fixed inset-0 bg-linear-to-br from-slate-100 via-white to-slate-50 dark:from-[#12103a] dark:via-[#0d0b1e] dark:to-[#0a0818] pointer-events-none" />
		<div className="fixed top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-violet-500/5 via-transparent to-transparent pointer-events-none" />
		<div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
	</>
);

export default function DuvidasPage() {
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [name, setName] = useState<string>('');
	const [isAdmin, setIsAdmin] = useState(false);
	const [mainTab, setMainTab] = useState<'faq' | 'pending' | 'answered'>('faq');

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

	if (email === undefined || !plans) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0b1e] flex items-center justify-center">
				<Background />
				<Loader2 className="relative z-10 w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (email === null) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0b1e] flex items-center justify-center">
				<Background />
				<div className="relative z-10 text-center">
					<MessageSquare className="w-12 h-12 text-slate-400 dark:text-gray-600 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-gray-400 font-medium">
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

	const customerId = getCurrentUser()?.sub ?? 'customer-1';

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0b1e] text-slate-900 dark:text-white font-sans">
			<Background />

			{/* Header */}
			<header className="relative z-10 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-8 py-4">
				<div className="max-w-350 mx-auto flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Link
							href="/course"
							className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm"
						>
							<ArrowLeft className="w-4 h-4" />
							Voltar
						</Link>
						<div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg p-1.5 shadow-lg shadow-violet-500/20">
							<MessageSquare className="w-5 h-5 text-white" />
						</div>
						<h1 className="text-lg font-bold text-slate-900 dark:text-white">
							Dúvidas
						</h1>
					</div>

					<div className="flex items-center gap-2">
						<ThemeToggle />
						<Link
							href="/store"
							className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-violet-500/50 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium rounded-xl transition-colors"
						>
							<Store className="w-4 h-4" />
							Loja
						</Link>
						<UserBadge />
					</div>
				</div>
			</header>

			<div className="relative z-10 max-w-350 mx-auto px-6 py-8">
				{!hasAccess ? (
					<div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-600 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
						<Lock className="w-16 h-16 mb-4 opacity-50" />
						<p className="text-sm font-medium">
							{upgradeTiers?.chat
								? `Dúvidas disponível no plano ${upgradeTiers.chat}`
								: 'Dúvidas disponível no plano Ouro ou Platina'}
						</p>
						<p className="text-xs mt-1">
							Faça upgrade para enviar dúvidas aos técnicos.
						</p>
						<Link
							href="/store"
							className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
						>
							Ver planos
						</Link>
					</div>
				) : (
					<div className="space-y-6">
						{/* Tabs */}
						<div className="flex gap-1 border-b border-slate-200 dark:border-white/10">
							<button
								type="button"
								onClick={() => setMainTab('faq')}
								className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all border-b-2 -mb-px ${
									mainTab === 'faq'
										? 'text-violet-600 dark:text-violet-400 border-violet-500 bg-transparent'
										: 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
								}`}
							>
								<BookOpen className="w-4 h-4" />
								Dúvidas Frequentes
							</button>
							<button
								type="button"
								onClick={() => setMainTab('pending')}
								className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all border-b-2 -mb-px ${
									mainTab === 'pending'
										? 'text-violet-600 dark:text-violet-400 border-violet-500 bg-transparent'
										: 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
								}`}
							>
								Pendentes
								{pendingCount > 0 && (
									<span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full">
										{pendingCount}
									</span>
								)}
							</button>
							<button
								type="button"
								onClick={() => setMainTab('answered')}
								className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all border-b-2 -mb-px ${
									mainTab === 'answered'
										? 'text-violet-600 dark:text-violet-400 border-violet-500 bg-transparent'
										: 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
								}`}
							>
								Respondidas
								{answeredCount > 0 && (
									<span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full">
										{answeredCount}
									</span>
								)}
							</button>
						</div>

						{/* Conteúdo */}
						{mainTab === 'faq' && <FAQStudentTab />}
						{(mainTab === 'pending' || mainTab === 'answered') && (
							<DoubtsClientView
								key={mainTab}
								customerId={customerId}
								customerName={name || 'Utilizador'}
								hasAccess={hasAccess}
								defaultTab={mainTab}
							/>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
