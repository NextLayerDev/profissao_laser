'use client';

import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import { usePermissions } from '@/modules/access';
import { useAdminCourses } from '@/modules/courses';

const PREVIEW_COUNT = 4;

/** Mesma paleta dos antigos cards de estatística — mantém a identidade visual do painel. */
const GRADIENT_THEMES = [
	'from-blue-100 to-white dark:from-blue-700/30 dark:to-[#1a1a1d]',
	'from-amber-100 to-white dark:from-amber-600/30 dark:to-[#1a1a1d]',
	'from-emerald-100 to-white dark:from-emerald-600/30 dark:to-[#1a1a1d]',
	'from-rose-100 to-white dark:from-rose-600/30 dark:to-[#1a1a1d]',
];

export function ProductsShortcut() {
	const { data: courses, isLoading } = useAdminCourses();
	const { can } = usePermissions();

	if (!can('planos.view')) return null;

	const preview = (courses ?? []).slice(0, PREVIEW_COUNT);

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">
					Planos
				</h3>
				<Link
					href="/products"
					className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
				>
					Ver todos
				</Link>
			</div>
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
				{isLoading &&
					Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
						<div
							key={i}
							className="h-32 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse"
						/>
					))}
				{!isLoading && preview.length === 0 && (
					<div className="col-span-full bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-gray-800/50 p-6 text-center text-sm text-slate-500 dark:text-gray-500 shadow-sm dark:shadow-none">
						Nenhum plano cadastrado.
					</div>
				)}
				{preview.map((course, idx) => {
					const gradient = GRADIENT_THEMES[idx % GRADIENT_THEMES.length];
					return (
						<Link
							key={course.id}
							href="/products"
							className={`group relative overflow-hidden bg-linear-to-br ${gradient} rounded-2xl border border-slate-200 dark:border-gray-800/50 hover:border-slate-300 dark:hover:border-gray-700 shadow-sm dark:shadow-none transition-all duration-300`}
						>
							<div className="h-20 flex items-center justify-center overflow-hidden">
								{course.image_url ? (
									<img
										src={course.image_url}
										alt={course.title}
										className="w-full h-full object-cover"
									/>
								) : (
									<BookOpen className="w-6 h-6 text-slate-400 dark:text-gray-500" />
								)}
							</div>
							<div className="relative p-3">
								<p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors">
									{course.title}
								</p>
								<span
									className={`inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
										course.published
											? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
											: 'bg-slate-500/15 text-slate-500'
									}`}
								>
									{course.published ? 'Publicado' : 'Rascunho'}
								</span>
							</div>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
