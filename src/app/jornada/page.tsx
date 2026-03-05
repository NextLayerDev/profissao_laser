'use client';

import {
	ArrowLeft,
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
import { UserBadge } from '@/components/store/user-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { useJornadaProgress } from '@/hooks/use-jornada-progress';
import { getCurrentUser } from '@/lib/auth';

const Background = () => (
	<>
		<div className="fixed inset-0 bg-linear-to-br from-slate-100 via-white to-slate-50 dark:from-[#12103a] dark:via-[#0d0b1e] dark:to-[#0a0818] pointer-events-none" />
		<div className="fixed top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-violet-500/5 via-transparent to-transparent pointer-events-none" />
		<div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
	</>
);

export default function JornadaPage() {
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
					<Compass className="w-12 h-12 text-slate-400 dark:text-gray-600 mx-auto mb-4" />
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
						<div className="bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg p-1.5 shadow-lg shadow-violet-500/20">
							<Compass className="w-5 h-5 text-white" />
						</div>
						<h1 className="text-lg font-bold text-slate-900 dark:text-white">
							Minha Jornada
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
				{/* Hero */}
				<div className="mb-10">
					<h2 className="text-4xl font-black leading-tight mb-3 text-slate-900 dark:text-white">
						Sua evolução nos cursos
					</h2>
					<p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
						Olá,{' '}
						<span className="font-semibold text-slate-900 dark:text-white">
							{name || 'bem-vindo!'}
						</span>
						. Acompanhe o que já concluiu e continue de onde parou.
					</p>
				</div>

				{/* Course cards */}
				{items.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm">
						<PackageX className="w-16 h-16 text-slate-400 dark:text-gray-600 mx-auto mb-4" />
						<p className="text-slate-600 dark:text-slate-400 font-medium mb-2">
							Nenhum curso ainda
						</p>
						<p className="text-slate-500 dark:text-slate-500 text-sm mb-6">
							Adquira um curso na loja para começar sua jornada.
						</p>
						<Link
							href="/store"
							className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/20"
						>
							<Store className="w-4 h-4" />
							Ir para loja
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
									className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-none transition-shadow"
								>
									<div className="p-6">
										<div className="flex items-start justify-between gap-4">
											<div className="flex items-center gap-4 min-w-0">
												<div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
													<BookOpen className="w-6 h-6 text-white" />
												</div>
												<div className="min-w-0">
													<h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
														{item.course.name}
													</h3>
													<p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
														{item.watchedCount} de {item.totalLessons} aulas
														concluídas
													</p>
												</div>
											</div>
											<Link
												href={continueHref}
												className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white text-sm font-semibold rounded-full transition-all shadow-lg shadow-violet-500/20 hover:shadow-xl hover:scale-[1.02] shrink-0"
											>
												<Play className="w-4 h-4 fill-current" />
												Continuar
											</Link>
										</div>

										{/* Progress bar */}
										<div className="mt-4">
											<div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
												<span>Progresso</span>
												<span>{item.percentage}%</span>
											</div>
											<div className="h-2.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
												<div
													className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-500 ease-out"
													style={{ width: `${item.percentage}%` }}
												/>
											</div>
										</div>

										{/* Aulas assistidas (colapsável) */}
										{item.watchedLessons.length > 0 && (
											<div className="mt-4">
												<button
													type="button"
													onClick={() => toggleExpanded(item.plan.id)}
													className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
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
																className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
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
		</div>
	);
}
