'use client';

import {
	BookOpen,
	Check,
	ChevronDown,
	Compass,
	Loader2,
	PackageX,
	Play,
	Store,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { useJornadaProgress } from '@/hooks/use-jornada-progress';
import { getCurrentUser } from '@/lib/auth';

export default function JornadaCoursePage() {
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [name, setName] = useState<string>('');
	const [expandedPlanIds, setExpandedPlanIds] = useState<Set<string>>(
		new Set(),
	);

	useEffect(() => {
		const user = getCurrentUser();
		setEmail(user?.email ?? null);
		setName(user?.name ?? '');
	}, []);

	const { data: plans, isLoading: plansLoading } = useCustomerPlans(
		email ?? null,
	);
	const activePlans =
		plans?.filter((p) => p.status === 'active' || p.status === 'ativo') ?? [];
	const { items, isLoading: progressLoading } = useJornadaProgress(activePlans);

	const isLoading = plansLoading || progressLoading;

	const toggleExpanded = (planId: string) => {
		setExpandedPlanIds((prev) => {
			const next = new Set(prev);
			next.has(planId) ? next.delete(planId) : next.add(planId);
			return next;
		});
	};

	if (email === undefined || isLoading) {
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
					<Compass className="w-12 h-12 text-slate-400 dark:text-gray-600 mx-auto mb-4" />
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
		<div className="p-4 md:p-8 max-w-[1400px] mx-auto">
			{/* Hero Banner */}
			<section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-700 to-cyan-800 p-6 md:p-10 mb-8">
				<div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
				<div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" />
				<div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
				<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
				<div className="relative z-10 flex items-center gap-4">
					<div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
						<Compass className="w-7 h-7 text-white" />
					</div>
					<div>
						<h2 className="text-2xl md:text-3xl font-black text-white">
							Minha Jornada
						</h2>
						<p className="mt-1 text-violet-200 text-sm md:text-base">
							Olá,{' '}
							<span className="font-semibold text-white">
								{name || 'bem-vindo'}
							</span>
							. Acompanhe o que já concluiu e continue de onde parou.
						</p>
					</div>
				</div>
			</section>

			{items.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800/50 rounded-2xl">
					<PackageX className="w-16 h-16 text-slate-400 dark:text-gray-600 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-gray-500 font-medium mb-2">
						Nenhum curso ainda
					</p>
					<Link
						href="/store"
						className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
					>
						<Store className="w-4 h-4" />
						Ver loja
					</Link>
				</div>
			) : (
				<div className="space-y-3">
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
								className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800/50 rounded-2xl overflow-hidden hover:scale-[1.01] hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300"
							>
								<div className="p-6">
									<div className="flex items-start justify-between gap-4">
										<div className="flex items-center gap-4 min-w-0">
											<div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center shrink-0">
												<BookOpen className="w-6 h-6 text-white" />
											</div>
											<div className="min-w-0">
												<h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
													{item.course.name}
												</h3>
												<p className="text-slate-500 dark:text-gray-500 text-sm mt-0.5">
													{item.watchedCount} de {item.totalLessons} aulas
												</p>
											</div>
										</div>
										<Link
											href={continueHref}
											className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white text-sm font-semibold rounded-full transition-all shrink-0"
										>
											<Play className="w-4 h-4 fill-current" />
											Continuar
										</Link>
									</div>

									<div className="mt-4">
										<div className="flex justify-between text-xs text-slate-500 dark:text-gray-500 mb-1">
											<span>Progresso</span>
											<span>{item.percentage}%</span>
										</div>
										<div className="h-2 bg-slate-200 dark:bg-gray-800/60 rounded-full overflow-hidden">
											<div
												className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-500"
												style={{ width: `${item.percentage}%` }}
											/>
										</div>
									</div>

									{item.watchedLessons.length > 0 && (
										<div className="mt-4">
											<button
												type="button"
												onClick={() => toggleExpanded(item.plan.id)}
												className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors"
											>
												<ChevronDown
													className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
												/>
												Aulas concluídas
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
