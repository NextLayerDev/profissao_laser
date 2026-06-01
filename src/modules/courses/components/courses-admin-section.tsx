'use client';

import { BookOpen, Plus, Trash2, Wrench, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { formatCurrency } from '@/utils/format-currency';
import {
	useAdminCourses,
	useCourses,
	useCreateCourse,
	useDeleteCourse,
	useUpdateCourse,
	useUploadCourseImage,
} from '../hooks/use-admin-courses';
import type {
	Course,
	CourseDetail,
	CreateCoursePayload,
	UpdateCoursePayload,
} from '../types/courses';
import { CourseFormModal } from './course-form-modal';

export function CoursesAdminSection() {
	const { data: adminCourses, isLoading: adminLoading } = useAdminCourses();
	const { data: catalog, isLoading: catalogLoading } = useCourses();
	const createMut = useCreateCourse();
	const updateMut = useUpdateCourse();
	const deleteMut = useDeleteCourse();
	const uploadMut = useUploadCourseImage();

	const [editing, setEditing] = useState<Course | null>(null);
	const [open, setOpen] = useState(false);

	// Merge: base de admin (com id para editar/deletar) + planos do catálogo
	const courses: CourseDetail[] =
		catalog && catalog.length > 0
			? catalog
			: (adminCourses ?? []).map((c) => ({ ...c, plans: [] }));

	const isLoading = adminLoading || catalogLoading;

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<p className="text-sm text-slate-600 dark:text-gray-400">
					Cada curso agrupa planos de acesso e ferramentas disponíveis.
				</p>
				<button
					type="button"
					onClick={() => {
						setEditing(null);
						setOpen(true);
					}}
					className="flex items-center gap-2 bg-violet-600 rounded-xl px-5 py-3 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
				>
					<Plus className="w-4 h-4" />
					Novo curso
				</button>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-16">
					<div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
				</div>
			) : courses.length === 0 ? (
				<div className="text-center py-16">
					<BookOpen className="w-10 h-10 text-slate-400 dark:text-gray-700 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-gray-400 font-medium">
						Nenhum curso criado
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{courses.map((c) => {
						const adminCourse = (adminCourses ?? []).find(
							(a) => a.slug === c.slug,
						);
						return (
							<CourseCard
								key={c.id}
								course={c}
								onEdit={() => {
									if (adminCourse) {
										setEditing(adminCourse);
										setOpen(true);
									}
								}}
								onDelete={() => {
									if (
										adminCourse &&
										confirm(
											`Remover o curso "${c.title}"? Essa ação não pode ser desfeita.`,
										)
									) {
										deleteMut.mutate(adminCourse.id);
									}
								}}
							/>
						);
					})}
				</div>
			)}

			{open && (
				<CourseFormModal
					editing={editing}
					pending={
						createMut.isPending || updateMut.isPending || uploadMut.isPending
					}
					onClose={() => setOpen(false)}
					onSubmit={async ({ payload, imageFile }) => {
						try {
							let courseId: string;
							if (editing) {
								const updated = await updateMut.mutateAsync({
									id: editing.id,
									payload: payload as UpdateCoursePayload,
								});
								courseId = updated.id;
							} else {
								const created = await createMut.mutateAsync(
									payload as CreateCoursePayload,
								);
								courseId = created.id;
							}
							if (imageFile) {
								await uploadMut.mutateAsync({ id: courseId, file: imageFile });
							}
							setOpen(false);
						} catch {
							// erros já tratados nos toasts dos hooks
						}
					}}
				/>
			)}
		</div>
	);
}

function CourseCard({
	course,
	onEdit,
	onDelete,
}: {
	course: CourseDetail;
	onEdit: () => void;
	onDelete: () => void;
}) {
	const publishedPlans = course.plans.filter((p) => p.published);

	return (
		<div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/30 dark:from-[#1a1a1d] dark:via-sky-950/20 dark:to-indigo-950/10 flex flex-col">
			<div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full bg-sky-500/15 dark:bg-sky-500/10 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-indigo-500/10 blur-3xl" />

			<div className="relative flex flex-col flex-1 p-5">
				{/* Header */}
				<div className="flex items-start gap-3 mb-4">
					{course.image_url ? (
						<img
							src={course.image_url}
							alt={course.title}
							className="w-14 h-14 rounded-xl object-cover shrink-0 ring-1 ring-slate-200 dark:ring-white/10"
						/>
					) : (
						<div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0 ring-1 ring-slate-200 dark:ring-white/10">
							<BookOpen className="w-6 h-6 text-sky-400" />
						</div>
					)}

					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap">
							<Link
								href={`/courses/${course.slug}`}
								className="font-bold text-slate-900 dark:text-white hover:text-violet-500 dark:hover:text-violet-400 transition-colors truncate"
							>
								{course.title}
							</Link>
							<span
								className={`shrink-0 text-xs px-2 py-0.5 rounded-md ${
									course.published
										? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
										: 'bg-slate-500/15 text-slate-500'
								}`}
							>
								{course.published ? 'Publicado' : 'Rascunho'}
							</span>
						</div>
						<p className="text-xs text-slate-500 font-mono mt-0.5">
							/{course.slug}
						</p>
						{course.description && (
							<p className="text-xs text-slate-500 dark:text-gray-400 mt-1 line-clamp-2">
								{course.description}
							</p>
						)}
					</div>
				</div>

				{/* Plans + tools */}
				{publishedPlans.length > 0 ? (
					<div className="space-y-2 mb-4">
						{publishedPlans.map(({ plan, tools }) => (
							<div
								key={plan.id}
								className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] px-3 py-2.5"
							>
								<div className="flex items-center justify-between gap-2 mb-1.5">
									<div className="flex items-center gap-2 min-w-0">
										<span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
											{plan.name}
										</span>
										<span className="text-xs font-mono text-slate-400 dark:text-gray-500">
											{plan.key}
										</span>
									</div>
									<div className="flex items-center gap-2 shrink-0 text-xs text-slate-500 dark:text-gray-500">
										{plan.price_monthly_cents != null && (
											<span>
												{formatCurrency(plan.price_monthly_cents / 100, 'BRL')}
												<span className="opacity-60">/mês</span>
											</span>
										)}
										{plan.price_yearly_cents != null && (
											<span className="text-violet-400">
												{formatCurrency(plan.price_yearly_cents / 100, 'BRL')}
												<span className="opacity-60">/ano</span>
											</span>
										)}
									</div>
								</div>

								{tools.length > 0 && (
									<div className="flex flex-wrap gap-1.5">
										{tools.map(({ tool, free_quota }) => (
											<span
												key={tool.key}
												className="inline-flex items-center gap-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full px-2 py-0.5 text-xs"
											>
												<Wrench className="w-2.5 h-2.5" />
												{tool.name}
												{free_quota != null && (
													<span className="text-violet-300/70">
														·{' '}
														{free_quota === 0
															? 'ilimitado'
															: `${free_quota} grátis`}
													</span>
												)}
												{tool.vox_cost > 0 && (
													<span className="inline-flex items-center gap-0.5 text-amber-400/80">
														<Zap className="w-2 h-2" />
														{tool.vox_cost}
													</span>
												)}
											</span>
										))}
									</div>
								)}
							</div>
						))}
					</div>
				) : (
					<p className="text-xs text-slate-400 dark:text-gray-600 italic mb-4">
						Nenhum plano publicado
					</p>
				)}

				{/* Actions */}
				<div className="mt-auto flex gap-2">
					<button
						type="button"
						onClick={onEdit}
						className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
					>
						Editar
					</button>
					<button
						type="button"
						onClick={onDelete}
						className="text-sm px-3 py-2 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
					>
						<Trash2 className="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	);
}
