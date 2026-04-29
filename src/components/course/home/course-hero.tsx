'use client';

import { BookOpen, Play } from 'lucide-react';
import Link from 'next/link';
import type { JornadaCourseItem } from '@/hooks/use-jornada-progress';

interface CourseHeroProps {
	displayName: string;
	firstActiveItem: JornadaCourseItem | undefined;
	overallProgress: number;
}

export function CourseHero({
	displayName,
	firstActiveItem,
	overallProgress,
}: CourseHeroProps) {
	return (
		<section className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-gray-800/50 bg-white dark:bg-[#1a1a1d] p-8 isolate">
			<div className="absolute top-0 right-0 -z-10 w-125 h-125 bg-violet-500/10 dark:bg-violet-600/15 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />
			<div className="absolute bottom-0 left-0 -z-10 w-75 h-75 bg-fuchsia-500/8 dark:bg-fuchsia-600/10 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2" />
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
				<div>
					<h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2">
						Bem-vindo de volta, {displayName}!
					</h2>
					{firstActiveItem ? (
						<p className="text-slate-600 dark:text-gray-300 text-base max-w-xl">
							Você está a{' '}
							<span className="text-violet-600 dark:text-violet-400 font-semibold">
								{firstActiveItem.totalLessons - firstActiveItem.watchedCount}{' '}
								aulas
							</span>{' '}
							de completar o curso{' '}
							<span className="text-slate-900 dark:text-white font-medium">
								{firstActiveItem.course.name}
							</span>
							. Continue seu progresso.
						</p>
					) : (
						<p className="text-slate-600 dark:text-gray-300 text-base max-w-xl">
							Continue aprendendo e domine o mercado de produtos personalizados
							a laser.
						</p>
					)}
					<div className="mt-6">
						{firstActiveItem ? (
							<Link
								href={`/course/${firstActiveItem.plan.slug}${firstActiveItem.nextLessonId ? `?lesson=${firstActiveItem.nextLessonId}` : ''}`}
								className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-[0_0_20px_rgba(108,56,255,0.3)]"
							>
								<Play className="w-4 h-4 fill-current" />
								Continuar Aula
							</Link>
						) : (
							<Link
								href="/store"
								className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-full font-medium transition-colors"
							>
								<BookOpen className="w-4 h-4" />
								Ver Cursos
							</Link>
						)}
					</div>
				</div>

				<div className="bg-slate-50 dark:bg-[#040405]/60 backdrop-blur-md border border-slate-200 dark:border-gray-800/50 rounded-xl p-5 min-w-65 shrink-0">
					<div className="flex justify-between items-center mb-3">
						<span className="text-sm font-medium text-slate-600 dark:text-gray-300">
							Seu Progresso Atual
						</span>
						<span className="text-xl font-bold text-violet-600 dark:text-violet-400">
							{overallProgress}%
						</span>
					</div>
					<div className="w-full h-2 bg-slate-200 dark:bg-gray-800/60 rounded-full overflow-hidden">
						<div
							className="h-full bg-linear-to-r from-violet-500 to-fuchsia-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.4)] transition-all"
							style={{ width: `${overallProgress}%` }}
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
