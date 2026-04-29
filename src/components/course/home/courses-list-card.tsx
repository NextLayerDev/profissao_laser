'use client';

import { BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { JornadaCourseItem } from '@/hooks/use-jornada-progress';
import type { CustomerPlan } from '@/types/plans';

interface CoursesListCardProps {
	uniquePlans: CustomerPlan[];
	jornadaItems: JornadaCourseItem[];
}

export function CoursesListCard({
	uniquePlans,
	jornadaItems,
}: CoursesListCardProps) {
	return (
		<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800/50 rounded-2xl p-5">
			<div className="flex justify-between items-center mb-4">
				<h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
					<BookOpen className="w-4 h-4 text-violet-500 dark:text-violet-400" />
					Meus Cursos
				</h3>
				<Link
					href="/store"
					className="text-xs text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors"
				>
					Ver loja
				</Link>
			</div>
			<div className="space-y-1">
				{uniquePlans.slice(0, 6).map((plan) => {
					const jornadaItem = jornadaItems.find((j) => j.plan.id === plan.id);
					return plan.slug ? (
						<Link
							key={plan.id}
							href={`/course/${plan.slug}`}
							className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
						>
							<div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-600/20 flex items-center justify-center shrink-0">
								<BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-slate-900 dark:text-white truncate leading-tight">
									{plan.product_name}
								</p>
								{jornadaItem ? (
									<div className="flex items-center gap-2 mt-1">
										<div className="flex-1 h-1 bg-slate-200 dark:bg-gray-800/60 rounded-full overflow-hidden">
											<div
												className="h-full bg-violet-500 rounded-full"
												style={{ width: `${jornadaItem.percentage}%` }}
											/>
										</div>
										<span className="text-[10px] text-slate-500 dark:text-gray-500 shrink-0">
											{jornadaItem.percentage}%
										</span>
									</div>
								) : null}
							</div>
							<ChevronRight className="w-4 h-4 text-slate-300 dark:text-gray-600 group-hover:text-slate-500 dark:group-hover:text-gray-400 transition-colors shrink-0" />
						</Link>
					) : (
						<div
							key={plan.id}
							className="flex items-center gap-3 p-2 rounded-lg opacity-50"
						>
							<div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-gray-800/40 flex items-center justify-center shrink-0">
								<BookOpen className="w-4 h-4 text-slate-400 dark:text-gray-600" />
							</div>
							<p className="text-sm text-slate-500 dark:text-gray-500 truncate">
								{plan.product_name}
							</p>
						</div>
					);
				})}
				{uniquePlans.length === 0 && (
					<p className="text-sm text-slate-400 dark:text-gray-600 text-center py-4">
						Nenhum curso ainda
					</p>
				)}
			</div>
		</div>
	);
}
