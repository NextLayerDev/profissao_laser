'use client';

import { Eye, Heart, Loader2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useCommunityProjects } from '@/hooks/use-community';

export function HomeProjectsFeed() {
	const { data: projects = [], isLoading } = useCommunityProjects(1, 8, {
		sort: 'recent',
	});

	return (
		<section className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
					Feed da Comunidade
				</h2>
				<Link
					href="/course/vitrine"
					className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline"
				>
					Ver toda a vitrine →
				</Link>
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center py-16">
					<Loader2 className="w-6 h-6 animate-spin text-violet-500" />
				</div>
			) : projects.length === 0 ? (
				<div className="py-16 text-center">
					<p className="text-sm text-slate-500 dark:text-gray-400">
						Nenhum projeto na comunidade ainda. Seja o primeiro!
					</p>
					<Link
						href="/course/vitrine"
						className="inline-block mt-3 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
					>
						Publicar projeto
					</Link>
				</div>
			) : (
				<div className="space-y-4">
					{projects.map((p) => (
						<article
							key={p.id}
							className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden hover:border-violet-300 dark:hover:border-violet-500/40 transition-colors"
						>
							{/* Author + time */}
							<div className="flex items-center gap-3 px-4 pt-4">
								<div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 flex items-center justify-center text-sm font-bold shrink-0">
									{p.author?.[0]?.toUpperCase() ?? '?'}
								</div>
								<div className="min-w-0">
									<p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
										{p.author || 'Anônimo'}
									</p>
									<p className="text-xs text-slate-500 dark:text-gray-400">
										{p.time || 'recentemente'}
									</p>
								</div>
							</div>

							{/* Image */}
							{p.img ? (
								<Link
									href={`/course/vitrine?project=${p.id}`}
									className="block mt-3"
								>
									{/* biome-ignore lint/performance/noImgElement: feed externo, sem otimização do Next/Image */}
									<img
										src={p.img}
										alt={p.title}
										className="w-full aspect-[4/3] object-cover bg-slate-100 dark:bg-white/[0.03]"
										loading="lazy"
									/>
								</Link>
							) : null}

							{/* Content */}
							<div className="p-4 space-y-2">
								<Link href={`/course/vitrine?project=${p.id}`}>
									<h3 className="font-bold text-slate-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
										{p.title}
									</h3>
								</Link>
								{p.description ? (
									<p className="text-sm text-slate-600 dark:text-gray-300 line-clamp-2">
										{p.description}
									</p>
								) : null}
								{p.material || p.technique ? (
									<div className="flex flex-wrap gap-2 pt-1">
										{p.material ? (
											<span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300">
												{p.material}
											</span>
										) : null}
										{p.technique ? (
											<span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">
												{p.technique}
											</span>
										) : null}
									</div>
								) : null}
							</div>

							{/* Actions */}
							<div className="flex items-center gap-5 px-4 py-3 border-t border-slate-100 dark:border-white/5 text-sm text-slate-500 dark:text-gray-400">
								<span className="flex items-center gap-1.5">
									<Heart className="w-4 h-4" />
									{p.likes ?? 0}
								</span>
								<span className="flex items-center gap-1.5">
									<MessageSquare className="w-4 h-4" />
									{p.comments ?? 0}
								</span>
								<Link
									href={`/course/vitrine?project=${p.id}`}
									className="ml-auto flex items-center gap-1.5 text-violet-600 dark:text-violet-400 hover:underline"
								>
									<Eye className="w-4 h-4" />
									Ver
								</Link>
							</div>
						</article>
					))}
				</div>
			)}
		</section>
	);
}
