'use client';

import { BookOpen, Clock, Gift, Play, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { VideoPlayer } from '@/components/course/video-player';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { CardListSkeleton } from '@/components/ui/skeletons/card-list-skeleton';
import { useEntitlements } from '@/hooks/use-entitlements';
import { getToken } from '@/lib/auth';
import { type FreeLesson, useFreeLessons } from '@/modules/lessons';
import type { CourseLesson } from '@/types/course';
import { formatDuration } from '@/utils/video';

function toCourseLesson(lesson: FreeLesson): CourseLesson {
	return {
		id: lesson.id,
		title: lesson.title,
		description: lesson.description ?? null,
		videoUrl: lesson.video_playback_url,
		duration: lesson.duration_seconds ?? null,
		order: lesson.position,
		isFree: true,
	};
}

type ModuleGroup = { module: FreeLesson['module']; lessons: FreeLesson[] };
type CourseGroup = { course: FreeLesson['course']; modules: ModuleGroup[] };

function groupByCourseAndModule(lessons: FreeLesson[]): CourseGroup[] {
	const courseGroups = new Map<string, CourseGroup>();
	for (const lesson of lessons) {
		let courseGroup = courseGroups.get(lesson.course.id);
		if (!courseGroup) {
			courseGroup = { course: lesson.course, modules: [] };
			courseGroups.set(lesson.course.id, courseGroup);
		}

		let moduleGroup = courseGroup.modules.find(
			(m) => m.module.id === lesson.module.id,
		);
		if (!moduleGroup) {
			moduleGroup = { module: lesson.module, lessons: [] };
			courseGroup.modules.push(moduleGroup);
		}
		moduleGroup.lessons.push(lesson);
	}
	return Array.from(courseGroups.values());
}

export default function AulasGratisPage() {
	const router = useRouter();
	const isStaff = typeof window !== 'undefined' && !!getToken('user');
	const {
		isTestUnlimited,
		hasActiveSubscription,
		isLoading: entitlementsLoading,
	} = useEntitlements();
	const hasFullAccess = isStaff || isTestUnlimited || hasActiveSubscription;

	const { data: lessons, isLoading, isError } = useFreeLessons();
	const [selectedId, setSelectedId] = useState<string | null>(null);

	// Prévias grátis são só pra quem não tem assinatura ativa — quem já assina
	// acessa tudo em "Aulas Gravadas", então redireciona pra lá.
	useEffect(() => {
		if (!entitlementsLoading && hasFullAccess) {
			router.replace('/course/jornada');
		}
	}, [entitlementsLoading, hasFullAccess, router]);

	const groups = useMemo(
		() => groupByCourseAndModule(lessons ?? []),
		[lessons],
	);

	const selectedLesson = useMemo(
		() => lessons?.find((l) => l.id === selectedId) ?? lessons?.[0] ?? null,
		[lessons, selectedId],
	);

	if (entitlementsLoading || hasFullAccess || isLoading) {
		return <CardListSkeleton />;
	}

	if (isError) {
		return (
			<div className="p-4 md:p-8">
				<PageHeader
					title="Aulas Grátis"
					subtitle="Prévias liberadas para qualquer aluno."
					icon={Gift}
				/>
				<EmptyState
					icon={Gift}
					title="Não foi possível carregar as aulas grátis"
					description="Tente novamente em instantes."
				/>
			</div>
		);
	}

	if (!lessons || lessons.length === 0) {
		return (
			<div className="p-4 md:p-8">
				<PageHeader
					title="Aulas Grátis"
					subtitle="Prévias liberadas para qualquer aluno."
					icon={Gift}
				/>
				<EmptyState
					icon={Gift}
					title="Nenhuma aula grátis disponível no momento"
					description="Assine um plano para desbloquear todo o conteúdo dos cursos."
					action={{
						label: 'Ver planos',
						onClick: () => {
							window.location.href = '/course/store';
						},
					}}
				/>
			</div>
		);
	}

	return (
		<div className="p-4 md:p-8">
			<PageHeader
				title="Aulas Grátis"
				subtitle="Assista prévias liberadas de vários cursos, sem precisar de assinatura."
				icon={Gift}
			/>

			{selectedLesson && (
				<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden mb-8">
					<VideoPlayer
						lesson={toCourseLesson(selectedLesson)}
						courseName={selectedLesson.course.title}
						moduleLabel={selectedLesson.module.title}
					/>
					<div className="px-6 pb-6">
						<Link
							href={`/course/${selectedLesson.course.slug}`}
							className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-400 text-white text-sm font-semibold rounded-lg transition-colors"
						>
							<BookOpen className="w-4 h-4" />
							Ver curso completo: {selectedLesson.course.title}
						</Link>
					</div>
				</div>
			)}

			<div className="space-y-10">
				{groups.map(({ course, modules }) => (
					<div key={course.id}>
						<div className="flex items-center justify-between gap-4 mb-4">
							<div className="flex items-center gap-3 min-w-0">
								{course.image_url ? (
									<img
										src={course.image_url}
										alt={course.title}
										className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-white/10 shrink-0"
									/>
								) : (
									<div className="w-10 h-10 rounded-lg bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center shrink-0">
										<BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
									</div>
								)}
								<h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 truncate">
									{course.title}
								</h2>
							</div>
							<Link
								href={`/course/${course.slug}`}
								className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
							>
								<Store className="w-4 h-4" />
								Ver curso
							</Link>
						</div>

						<div className="space-y-5 pl-2 border-l-2 border-slate-200 dark:border-white/10 ml-5">
							{modules.map(({ module, lessons: moduleLessons }) => (
								<div key={module.id} className="pl-4">
									<h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400 mb-2.5">
										{module.title}
									</h3>
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
										{moduleLessons.map((lesson) => {
											const isActive = selectedLesson?.id === lesson.id;
											return (
												<button
													key={lesson.id}
													type="button"
													onClick={() => setSelectedId(lesson.id)}
													className={`flex items-start gap-3 p-4 text-left rounded-xl border transition-colors ${
														isActive
															? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
															: 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] hover:border-violet-500/30'
													}`}
												>
													<div
														className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
															isActive
																? 'bg-violet-600 text-white'
																: 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
														}`}
													>
														<Play className="w-4 h-4 fill-current ml-0.5" />
													</div>
													<div className="min-w-0 flex-1">
														<p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
															{lesson.title}
														</p>
														{lesson.duration_seconds != null && (
															<p className="flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500 mt-1">
																<Clock className="w-3 h-3" />
																{formatDuration(lesson.duration_seconds)}
															</p>
														)}
													</div>
												</button>
											);
										})}
									</div>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
