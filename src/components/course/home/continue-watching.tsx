'use client';

import { BookOpen, Loader2, PackageX, Play } from 'lucide-react';
import Link from 'next/link';
import type { JornadaCourseItem } from '@/hooks/use-jornada-progress';
import type { CustomerPlan } from '@/types/plans';
import {
	COURSE_STATUS_LABELS,
	COURSE_STATUS_STYLES,
} from '@/utils/constants/course-status';

interface ContinueWatchingProps {
	jornadaItems: JornadaCourseItem[];
	jornadaLoading: boolean;
	uniquePlans: CustomerPlan[];
	isError: boolean;
	hasPlans: boolean;
}

export function ContinueWatching({
	jornadaItems,
	jornadaLoading,
	uniquePlans,
	isError,
	hasPlans,
}: ContinueWatchingProps) {
	return (
		<section>
			<div className="flex justify-between items-end mb-4">
				<h3 className="text-xl font-bold text-slate-900 dark:text-white">
					Continue de onde parou
				</h3>
				<Link
					href="/store"
					className="text-violet-600 dark:text-violet-400 hover:text-violet-600 dark:hover:text-violet-400 font-medium text-sm transition-colors"
				>
					Ver todas
				</Link>
			</div>

			{isError || !hasPlans || uniquePlans.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl">
					<PackageX className="w-12 h-12 text-red-400 mx-auto mb-4" />
					<p className="text-red-400">
						{isError
							? 'Erro ao carregar seus cursos.'
							: 'Nenhum curso disponível ainda.'}
					</p>
					<Link
						href="/store"
						className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-600 text-white text-sm font-medium rounded-xl transition-colors"
					>
						Ver loja
					</Link>
				</div>
			) : jornadaLoading ? (
				<div className="flex justify-center py-12">
					<Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
				</div>
			) : jornadaItems.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{jornadaItems.slice(0, 4).map((item) => (
						<Link
							key={item.plan.id}
							href={`/course/${item.plan.slug}${item.nextLessonId ? `?lesson=${item.nextLessonId}` : ''}`}
							className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-white/[0.03] hover:border-violet-500/20 transition-all group cursor-pointer"
						>
							<div className="w-28 h-20 rounded-lg overflow-hidden relative shrink-0 bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center">
								<BookOpen className="w-8 h-8 text-violet-600 dark:text-violet-400" />
								<div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
									<Play className="w-7 h-7 text-white fill-current" />
								</div>
							</div>
							<div className="flex flex-col justify-between flex-1 py-0.5 min-w-0">
								<div>
									<span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 rounded text-[10px] font-bold uppercase tracking-wider">
										{item.watchedCount}/{item.totalLessons} aulas
									</span>
									<h4 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2 leading-snug mt-1">
										{item.course.name}
									</h4>
								</div>
								<div className="mt-2">
									<div className="w-full h-1 bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
										<div
											className="h-full bg-gradient-to-r from-violet-600 to-violet-600 rounded-full"
											style={{ width: `${item.percentage}%` }}
										/>
									</div>
									<p className="text-[11px] text-slate-500 dark:text-gray-500 mt-1">
										{item.percentage}% concluído
									</p>
								</div>
							</div>
						</Link>
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{uniquePlans.slice(0, 4).map((plan) => {
						const statusStyle =
							COURSE_STATUS_STYLES[plan.status] ?? 'bg-gray-700 text-gray-400';
						const statusLabel =
							COURSE_STATUS_LABELS[plan.status] ?? plan.status;
						return plan.slug ? (
							<Link
								key={plan.id}
								href={`/course/${plan.slug}`}
								className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all group"
							>
								<div className="w-28 h-20 rounded-lg bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center shrink-0">
									<BookOpen className="w-8 h-8 text-violet-600 dark:text-violet-400" />
								</div>
								<div className="flex flex-col justify-between flex-1 py-0.5">
									<h4 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2">
										{plan.product_name}
									</h4>
									<span
										className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle}`}
									>
										{statusLabel}
									</span>
								</div>
							</Link>
						) : (
							<div
								key={plan.id}
								className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl p-4 flex gap-4 opacity-60 cursor-not-allowed"
							>
								<div className="w-28 h-20 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
									<BookOpen className="w-8 h-8 text-slate-400 dark:text-gray-500" />
								</div>
								<div className="flex flex-col justify-between flex-1 py-0.5">
									<h4 className="font-semibold text-slate-600 dark:text-gray-500 text-sm line-clamp-2">
										{plan.product_name}
									</h4>
									<span
										className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle}`}
									>
										{statusLabel}
									</span>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</section>
	);
}
