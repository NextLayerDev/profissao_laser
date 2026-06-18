'use client';

import { useQuery } from '@tanstack/react-query';
import {
	BookOpen,
	Check,
	ChevronDown,
	Compass,
	PackageX,
	Play,
	Store,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { CardListSkeleton } from '@/components/ui/skeletons/card-list-skeleton';
import { useJornadaProgress } from '@/hooks/use-jornada-progress';
import { getCurrentUser, getToken } from '@/lib/auth';
import { catalogQueryKeys, listPublicCourses } from '@/modules/catalog';
import { useEntitlements } from '@/modules/subscriptions';
import type { CustomerPlan } from '@/types/plans';

export default function JornadaCoursePage() {
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [name, setName] = useState<string>('');
	const [isAdmin, setIsAdmin] = useState(false);
	const [expandedPlanIds, setExpandedPlanIds] = useState<Set<string>>(
		new Set(),
	);

	useEffect(() => {
		const user = getCurrentUser();
		setEmail(user?.email ?? null);
		setName(user?.name ?? '');
		setIsAdmin(!!getToken('user'));
	}, []);

	// Admin: vê todos os cursos publicados (não depende de plano de cliente).
	// Usa a vitrine pública (/v1/courses) — não exige permissão de admin, então
	// evita o 401 que derrubava a sessão e redirecionava pro login.
	const { data: adminCourses, isLoading: adminCoursesLoading } = useQuery({
		queryKey: catalogQueryKeys.courses,
		queryFn: listPublicCourses,
		enabled: isAdmin,
	});
	const adminPlans: CustomerPlan[] = (adminCourses ?? [])
		.filter((c) => c.published)
		.map((c) => ({
			id: c.id,
			status: 'active',
			product_name: c.title,
			slug: c.slug,
			tier: undefined,
		}));

	// Customer: usa entitlements (fonte de verdade) — o endpoint /customer/plans
	// retorna slug: null para assinaturas; entitlements já tem o curso com slug real.
	const { courses: entitlementCourses, isLoading: entitlementsLoading } =
		useEntitlements();
	const customerPlans: CustomerPlan[] = entitlementCourses.map((c) => ({
		id: c.id,
		status: 'active',
		product_name: c.title,
		slug: c.slug,
		tier: undefined,
	}));

	const activePlans = isAdmin ? adminPlans : customerPlans;
	const { items, isLoading: progressLoading } = useJornadaProgress(activePlans);

	const isLoading =
		(isAdmin ? adminCoursesLoading : entitlementsLoading) || progressLoading;

	const toggleExpanded = (planId: string) => {
		setExpandedPlanIds((prev) => {
			const next = new Set(prev);
			next.has(planId) ? next.delete(planId) : next.add(planId);
			return next;
		});
	};

	if (email === undefined || isLoading) {
		return <CardListSkeleton />;
	}

	if (email === null) {
		return (
			<div className="flex items-center justify-center py-32">
				<div className="text-center">
					<Compass className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
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
		<div className="p-4 md:p-8">
			<PageHeader
				title="Minha Jornada"
				subtitle={`Ola, ${name || 'bem-vindo'}. Acompanhe o que ja concluiu e continue de onde parou.`}
				icon={Compass}
			/>

			{items.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-lg">
					<PackageX className="w-14 h-14 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-gray-400 font-medium mb-2">
						{isAdmin ? 'Nenhum curso publicado ainda' : 'Nenhum curso ainda'}
					</p>
					{isAdmin ? (
						<Link
							href="/products"
							className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-400 text-white text-sm font-medium rounded-lg transition-colors"
						>
							<BookOpen className="w-4 h-4" />
							Gerenciar cursos
						</Link>
					) : (
						<Link
							href="/store"
							className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-400 text-white text-sm font-medium rounded-lg transition-colors"
						>
							<Store className="w-4 h-4" />
							Ver loja
						</Link>
					)}
				</div>
			) : (
				<div className="space-y-2">
					{items.map((item) => {
						const isExpanded = expandedPlanIds.has(item.plan.id);
						const continueHref = item.plan.slug
							? item.nextLessonId
								? `/course/${item.plan.slug}?lesson=${item.nextLessonId}`
								: `/course/${item.plan.slug}`
							: '#';

						return (
							<div
								key={item.plan.id}
								className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden hover:border-violet-500/30 transition-colors"
							>
								<div className="p-6">
									<div className="flex items-start justify-between gap-4">
										<div className="flex items-center gap-4 min-w-0">
											<div className="w-11 h-11 bg-violet-500/10 dark:bg-violet-500/20 rounded-lg flex items-center justify-center shrink-0">
												<BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
											</div>
											<div className="min-w-0">
												<h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 truncate">
													{item.course.name}
												</h3>
												<p className="font-mono text-sm text-slate-500 dark:text-gray-400 mt-0.5">
													{item.watchedCount}/{item.totalLessons} aulas
												</p>
											</div>
										</div>
										<Link
											href={continueHref}
											className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-400 text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
										>
											<Play className="w-4 h-4 fill-current" />
											Continuar
										</Link>
									</div>

									<div className="mt-4">
										<div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 mb-1.5">
											<span>Progresso</span>
											<span className="font-mono">{item.percentage}%</span>
										</div>
										<div className="h-1.5 bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
											<div
												className="h-full bg-violet-600 rounded-full transition-all duration-500"
												style={{ width: `${item.percentage}%` }}
											/>
										</div>
									</div>

									{item.watchedLessons.length > 0 && (
										<div className="mt-4">
											<button
												type="button"
												onClick={() => toggleExpanded(item.plan.id)}
												className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
											>
												<ChevronDown
													className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
												/>
												Aulas concluidas
											</button>
											{isExpanded && (
												<ul className="mt-2 space-y-1.5 pl-6">
													{item.watchedLessons.map((lesson) => (
														<li
															key={lesson.id}
															className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400"
														>
															<Check className="w-4 h-4 text-emerald-500 shrink-0" />
															<span className="truncate">{lesson.title}</span>
														</li>
													))}
												</ul>
											)}
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
