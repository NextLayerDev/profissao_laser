'use client';

import { BookOpen, Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { JornadaCourseItem } from '@/hooks/use-jornada-progress';

interface HighlightsSectionProps {
	jornadaItems: JornadaCourseItem[];
}

const PLACEHOLDER_GRADIENTS = [
	'from-violet-600 to-violet-600',
	'from-blue-500 to-cyan-500',
	'from-emerald-500 to-teal-500',
	'from-pink-500 to-rose-500',
	'from-violet-600 to-orange-500',
];

export function HighlightsSection({ jornadaItems }: HighlightsSectionProps) {
	return (
		<section className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/5 rounded-2xl p-6">
			<div className="flex justify-between items-center mb-5">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					Continue de onde parou
				</h3>
				<Link
					href="/store"
					className="text-violet-600 dark:text-violet-400 hover:text-violet-600 text-sm font-medium transition-colors"
				>
					Ver tudo
				</Link>
			</div>

			{jornadaItems.length === 0 ? (
				<div className="relative flex flex-col items-center justify-center py-10 text-center rounded-xl overflow-hidden">
					{/* Background image for empty state */}
					<Image
						src="/img/CURSOS.jpeg"
						alt=""
						aria-hidden
						fill
						className="object-cover"
					/>
					<div className="absolute inset-0 bg-gradient-to-br from-violet-900/85 via-violet-900/80 to-violet-900/85" />

					<div className="relative z-10">
						<div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-4 mx-auto">
							<BookOpen className="w-7 h-7 text-white" />
						</div>
						<p className="text-white/90 text-sm font-medium">
							Explore nossos cursos e comece sua jornada
						</p>
						<Link
							href="/store"
							className="mt-3 inline-block text-white text-sm font-semibold hover:underline bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/20"
						>
							Ver cursos disponiveis
						</Link>
					</div>
				</div>
			) : (
				<div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-violet-500/20">
					{jornadaItems.map((item, i) => (
						<Link
							key={item.plan.id}
							href={`/course/${item.plan.slug}${item.nextLessonId ? `?lesson=${item.nextLessonId}` : ''}`}
							className="flex-shrink-0 w-52 group"
						>
							<div
								className={`relative w-full h-32 rounded-xl overflow-hidden border border-white/10 transition-all duration-300 group-hover:shadow-lg ${
									!item.course.image
										? `bg-gradient-to-br ${PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length]}`
										: ''
								} flex items-center justify-center`}
							>
								{item.course.image ? (
									<Image
										src={item.course.image}
										alt={item.course.name}
										fill
										className="object-cover"
									/>
								) : null}
								<Play className="w-8 h-8 text-white/80 group-hover:scale-110 transition-transform relative z-10" />
								<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
								<span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/40 backdrop-blur-sm text-white text-[9px] font-bold uppercase rounded tracking-wider z-10">
									AULA
								</span>
							</div>
							<div className="mt-2">
								<p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-tight">
									{item.course.name}
								</p>
								<div className="mt-1.5">
									<div className="w-full h-1 bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
										<div
											className="h-full bg-gradient-to-r from-violet-600 to-violet-600 rounded-full"
											style={{ width: `${item.percentage}%` }}
										/>
									</div>
									<p className="text-[11px] text-slate-500 dark:text-gray-500 mt-0.5">
										{item.percentage}% concluido
									</p>
								</div>
							</div>
						</Link>
					))}
				</div>
			)}
		</section>
	);
}
