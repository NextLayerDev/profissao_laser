'use client';

import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CommunityOpportunities } from '@/components/course/home/community-opportunities';
import { CommunityRanking } from '@/components/course/home/community-ranking';
import { CourseFooter } from '@/components/course/home/course-footer';
import { CourseSidebar } from '@/components/course/home/course-sidebar';
import { CourseTopHeader } from '@/components/course/home/course-top-header';
import { HomeGreeting } from '@/components/course/home/home-greeting';
import { HomeProjectsFeed } from '@/components/course/home/home-projects-feed';
import { LearningStreak } from '@/components/course/home/learning-streak';
import { MiniLevelCard } from '@/components/course/home/mini-level-card';
import { OnlineMembers } from '@/components/course/home/online-members';
import { QuickAccessGrid } from '@/components/course/home/quick-access-grid';
import { WeeklyChallenge } from '@/components/course/home/weekly-challenge';
import { SavedLessonsModal } from '@/components/course/saved-lessons-modal';
import { DashboardSkeleton } from '@/components/ui/skeletons/dashboard-skeleton';
import { useCustomerFeatures } from '@/hooks/use-customer-features';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { getCurrentUser, getToken } from '@/lib/auth';
import { FULL_FEATURES } from '@/utils/constants/class-features';

const TIER_ORDER: Record<string, number> = { prata: 0, ouro: 1, platina: 2 };
const SIDEBAR_KEY = 'course-sidebar-collapsed';

export default function CoursePage() {
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [name, setName] = useState<string>('');
	const [isAdmin, setIsAdmin] = useState(false);
	const [savedLessonsModalOpen, setSavedLessonsModalOpen] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

	useEffect(() => {
		const user = getCurrentUser();
		setEmail(user?.email ?? null);
		setName(user?.name ?? '');
		setIsAdmin(!!getToken('user'));
		const stored = localStorage.getItem(SIDEBAR_KEY);
		if (stored !== null) setSidebarCollapsed(stored === 'true');
	}, []);

	const handleSidebarToggle = () => {
		setSidebarCollapsed((c) => {
			const next = !c;
			localStorage.setItem(SIDEBAR_KEY, String(next));
			return next;
		});
	};

	const { data: plans, isLoading } = useCustomerPlans(
		isAdmin ? null : (email ?? null),
	);

	const _uniquePlans = useMemo(() => {
		if (!plans) return [];
		const byKey = new Map<string, (typeof plans)[0]>();
		for (const plan of plans) {
			const key = plan.slug ?? plan.product_name;
			const existing = byKey.get(key);
			if (!existing) {
				byKey.set(key, plan);
			} else {
				const existingTier = existing.tier
					? (TIER_ORDER[existing.tier] ?? -1)
					: -1;
				const currentTier = plan.tier ? (TIER_ORDER[plan.tier] ?? -1) : -1;
				const existingActive =
					existing.status === 'active' || existing.status === 'ativo';
				const currentActive =
					plan.status === 'active' || plan.status === 'ativo';
				const shouldReplace =
					currentTier > existingTier ||
					(currentTier === existingTier && currentActive && !existingActive);
				if (shouldReplace) byKey.set(key, plan);
			}
		}
		return Array.from(byKey.values());
	}, [plans]);

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

	const displayName = name ? name.split(' ')[0] : 'bem-vindo';

	if (email === undefined || isLoading) {
		return <DashboardSkeleton />;
	}

	if (email === null) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] flex items-center justify-center">
				<div className="text-center">
					<BookOpen className="w-12 h-12 text-slate-400 dark:text-gray-500 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-gray-400 font-medium">
						Voce nao esta logado
					</p>
					<Link
						href="/login"
						className="mt-4 inline-block px-5 py-2 bg-violet-600 hover:bg-violet-600 text-white text-sm font-medium rounded-xl transition-colors"
					>
						Fazer login
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="relative min-h-screen bg-slate-100 dark:bg-[#0d0d0f] text-slate-900 dark:text-white font-sans flex">
			{/* Dark mode background orbs */}
			<div className="hidden dark:block absolute inset-0 pointer-events-none overflow-hidden">
				<div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-blue-900/15 rounded-full blur-3xl" />
				<div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-indigo-900/15 rounded-full blur-3xl" />
				<div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-blue-800/8 rounded-full blur-3xl" />
			</div>

			<CourseSidebar
				isCollapsed={sidebarCollapsed}
				onToggle={handleSidebarToggle}
			/>

			<div
				className={`relative z-10 flex-1 flex flex-col min-h-screen transition-all duration-300 ${
					sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'
				}`}
			>
				<CourseTopHeader
					isAdmin={isAdmin}
					sidebarCollapsed={sidebarCollapsed}
					userName={displayName}
				/>

				<main className="flex-1 mt-16 p-4 md:p-8 overflow-x-hidden">
					{/* Greeting enxuto (substitui o banner antigo) */}
					<HomeGreeting name={name} />

					{/* Layout social: feed à esquerda, sidebar com tudo à direita.
					    Cada coluna tem scroll próprio no desktop. */}
					<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
						{/* Feed da comunidade (esquerda) — scroll próprio no desktop */}
						<div className="min-w-0 lg:h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-2">
							<HomeProjectsFeed />
						</div>

						{/* Sidebar direita: nível + acesso rápido + widgets da comunidade */}
						<aside className="space-y-4 lg:h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-1">
							<MiniLevelCard />
							<QuickAccessGrid
								features={features}
								upgradeTiers={upgradeTiers}
								onSavedLessonsOpen={() => setSavedLessonsModalOpen(true)}
								compact
							/>
							<LearningStreak />
							<CommunityOpportunities />
							<OnlineMembers />
							<WeeklyChallenge />
							<CommunityRanking />
						</aside>
					</div>

					<CourseFooter />
				</main>
			</div>

			<SavedLessonsModal
				isOpen={savedLessonsModalOpen}
				onClose={() => setSavedLessonsModalOpen(false)}
			/>
		</div>
	);
}
