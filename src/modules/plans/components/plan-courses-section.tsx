'use client';

import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
	useCreateCoursePlan,
	useDeleteCoursePlan,
	useUpdateCoursePlan,
} from '../hooks/use-course-plan';
import type { PlanDetailsCourse } from '../types/plan-details';
import { CoursePlanFormModal } from './course-plan-form-modal';

interface Props {
	planId: string;
	planKey: string;
	courses: PlanDetailsCourse[];
}

export function PlanCoursesSection({ planId, planKey, courses }: Props) {
	const createMut = useCreateCoursePlan(planId);
	const updateMut = useUpdateCoursePlan(planId);
	const deleteMut = useDeleteCoursePlan(planId);

	const [editing, setEditing] = useState<PlanDetailsCourse | null>(null);
	const [open, setOpen] = useState(false);

	const linkedSlugs = courses.map((c) => c.course.slug);

	return (
		<section>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3 className="text-lg font-semibold flex items-center gap-2">
						<BookOpen className="w-5 h-5 text-sky-500" />
						Cursos vinculados
					</h3>
					<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
						Cursos que incluem este plano. Os preços são definidos no plano.
					</p>
				</div>
				<button
					type="button"
					onClick={() => {
						setEditing(null);
						setOpen(true);
					}}
					className="flex items-center gap-2 bg-violet-600 rounded-xl px-5 py-3 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
				>
					<Plus className="w-4 h-4" />
					Vincular curso
				</button>
			</div>

			{courses.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-10 text-center">
					<BookOpen className="w-8 h-8 text-slate-400 dark:text-gray-700 mx-auto mb-3" />
					<p className="text-sm text-slate-600 dark:text-gray-400 font-medium">
						Nenhum curso vinculado
					</p>
					<p className="text-xs text-slate-500 mt-1">
						Vincule um curso para que ele apareça no catálogo com este plano.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{courses.map((entry) => (
						<CoursePlanCard
							key={entry.course.id}
							entry={entry}
							onEdit={() => {
								setEditing(entry);
								setOpen(true);
							}}
							onDelete={() => {
								if (
									confirm(
										`Desvincular "${entry.course.title}" do plano? Não exclui o curso.`,
									)
								) {
									deleteMut.mutate({
										slug: entry.course.slug,
										planKey,
									});
								}
							}}
							deletePending={deleteMut.isPending}
						/>
					))}
				</div>
			)}

			{open && (
				<CoursePlanFormModal
					editing={editing}
					excludeSlugs={editing ? [] : linkedSlugs}
					pending={createMut.isPending || updateMut.isPending}
					onClose={() => setOpen(false)}
					onSubmit={({ slug, published }) => {
						const mut = editing ? updateMut : createMut;
						mut.mutate(
							{ slug, planKey, payload: { published } },
							{ onSuccess: () => setOpen(false) },
						);
					}}
				/>
			)}
		</section>
	);
}

function CoursePlanCard({
	entry,
	onEdit,
	onDelete,
	deletePending,
}: {
	entry: PlanDetailsCourse;
	onEdit: () => void;
	onDelete: () => void;
	deletePending: boolean;
}) {
	const { course, course_plan } = entry;

	return (
		<div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/30 dark:from-[#1a1a1d] dark:via-sky-950/20 dark:to-indigo-950/10 p-5 flex flex-col">
			<div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full bg-sky-500/15 dark:bg-sky-500/10 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 blur-3xl" />

			<div className="relative flex flex-col flex-1">
				{/* Header */}
				<div className="flex items-start gap-3">
					<Link
						href={`/courses/${course.slug}`}
						className="shrink-0"
						title="Ver curso"
					>
						{course.image_url ? (
							<img
								src={course.image_url}
								alt={course.title}
								className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-white/10"
							/>
						) : (
							<div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-[#0d0d0f] flex items-center justify-center ring-1 ring-slate-200 dark:ring-white/10">
								<BookOpen className="w-6 h-6 text-slate-400" />
							</div>
						)}
					</Link>

					<div className="flex-1 min-w-0">
						<Link
							href={`/courses/${course.slug}`}
							className="block hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
						>
							<p className="font-bold text-slate-900 dark:text-white truncate">
								{course.title}
							</p>
						</Link>
						<p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
							/{course.slug}
						</p>
					</div>

					<span
						className={`shrink-0 text-xs px-2 py-1 rounded-md ${
							course_plan.published
								? 'bg-emerald-500/15 text-emerald-600'
								: 'bg-slate-500/15 text-slate-500'
						}`}
					>
						{course_plan.published ? 'Publicado' : 'Rascunho'}
					</span>
				</div>

				{/* Footer */}
				<div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2">
					<button
						type="button"
						onClick={onEdit}
						className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
					>
						<Pencil className="w-3.5 h-3.5" />
						Editar
					</button>
					<button
						type="button"
						disabled={deletePending}
						onClick={onDelete}
						className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-60"
					>
						<Trash2 className="w-3.5 h-3.5" />
						Desvincular
					</button>
				</div>
			</div>
		</div>
	);
}
