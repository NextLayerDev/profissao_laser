'use client';

import { ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/dashboard/header';
import { CourseContentSection, useAdminCourses } from '@/modules/courses';

export default function CourseAdminDetalhe() {
	const { slug } = useParams<{ slug: string }>();
	const { data: courses, isLoading } = useAdminCourses();

	const course = (courses ?? []).find((c) => c.slug === slug);

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />

			<main className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
				<Link
					href="/products"
					className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6"
				>
					<ArrowLeft className="w-4 h-4" />
					Voltar ao catálogo
				</Link>

				{isLoading ? (
					<div className="flex justify-center py-20">
						<div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
					</div>
				) : !course ? (
					<div className="text-center py-20">
						<BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-4" />
						<p className="text-slate-600 dark:text-gray-400 font-medium">
							Curso não encontrado
						</p>
					</div>
				) : (
					<>
						<div className="flex items-start gap-4 mb-8">
							{course.image_url ? (
								<img
									src={course.image_url}
									alt={course.title}
									className="w-24 h-24 rounded-xl object-cover shrink-0"
								/>
							) : (
								<div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-[#1a1a1d] flex items-center justify-center shrink-0">
									<BookOpen className="w-10 h-10 text-slate-400" />
								</div>
							)}
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-3">
									<h1 className="text-2xl font-bold tracking-tight">
										{course.title}
									</h1>
									<span
										className={`text-xs px-2 py-1 rounded-md ${
											course.published
												? 'bg-emerald-500/15 text-emerald-600'
												: 'bg-slate-500/15 text-slate-500'
										}`}
									>
										{course.published ? 'Publicado' : 'Rascunho'}
									</span>
								</div>
								<p className="text-sm text-slate-500 font-mono mt-1">
									/{course.slug}
								</p>
								{course.description && (
									<p className="text-sm text-slate-600 dark:text-gray-400 mt-2">
										{course.description}
									</p>
								)}
							</div>
						</div>

						<CourseContentSection
							courseSlug={course.slug}
							courseId={course.id}
						/>
					</>
				)}
			</main>
		</div>
	);
}
