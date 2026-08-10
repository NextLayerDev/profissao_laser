'use client';

import { BookOpen, Store } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StoreCourseCard } from '@/components/store/store-course-card';
import { ThemeToggle } from '@/components/theme-toggle';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useCourses } from '@/modules/courses';

/** Página do curso: /comprar/{slug}. Link de plano único vai direto ao checkout. */
export default function ComprarCursoPage() {
	const { slug } = useParams<{ slug: string }>();
	const { data: courses, isLoading, error } = useCourses();
	const { entitlements } = useEntitlements();

	const course = (courses ?? []).find((c) => c.slug === slug && c.published);

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white font-sans">
			<header className="border-b border-slate-200 dark:border-gray-800 bg-slate-50/80 dark:bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-10">
				<div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
					<Link href="/store" className="flex items-center gap-2">
						<Store className="w-6 h-6 text-violet-400" />
						<span className="text-lg font-bold tracking-tight">
							Profissão Laser
						</span>
					</Link>
					<ThemeToggle />
				</div>
			</header>

			<main className="max-w-5xl mx-auto px-4 md:px-6 py-10">
				{isLoading ? (
					<div className="animate-pulse bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
						<div className="h-52 bg-slate-200 dark:bg-white/5" />
						<div className="p-6 space-y-3">
							<div className="h-5 w-48 rounded bg-slate-200 dark:bg-white/5" />
							<div className="h-4 w-full rounded bg-slate-200 dark:bg-white/5" />
							<div className="flex gap-3 mt-4">
								<div className="flex-1 h-40 rounded-lg bg-slate-200 dark:bg-white/5" />
								<div className="flex-1 h-40 rounded-lg bg-slate-200 dark:bg-white/5" />
							</div>
						</div>
					</div>
				) : error ? (
					<div className="text-center py-20">
						<p className="text-red-400 font-medium">Erro ao carregar o curso</p>
						<p className="text-slate-500 dark:text-gray-500 text-sm mt-1">
							Tente novamente mais tarde
						</p>
					</div>
				) : course ? (
					<StoreCourseCard
						course={course}
						currentPlanKey={entitlements?.subscription?.plan?.key ?? null}
					/>
				) : (
					<div className="text-center py-20">
						<BookOpen className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
						<p className="text-slate-600 dark:text-gray-400 font-medium">
							Curso não encontrado ou indisponível
						</p>
						<Link
							href="/store"
							className="inline-block mt-4 text-sm text-violet-500 hover:underline"
						>
							Ver todos os cursos
						</Link>
					</div>
				)}
			</main>
		</div>
	);
}
