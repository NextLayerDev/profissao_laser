'use client';

import { BookOpen, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
	useAdminCourses,
	useCreateCourse,
	useDeleteCourse,
	useUpdateCourse,
	useUploadCourseImage,
} from '../hooks/use-admin-courses';
import type {
	Course,
	CreateCoursePayload,
	UpdateCoursePayload,
} from '../types/courses';
import { CourseFormModal } from './course-form-modal';

export function CoursesAdminSection() {
	const { data: courses, isLoading, error } = useAdminCourses();
	const createMut = useCreateCourse();
	const updateMut = useUpdateCourse();
	const deleteMut = useDeleteCourse();
	const uploadMut = useUploadCourseImage();

	const [editing, setEditing] = useState<Course | null>(null);
	const [open, setOpen] = useState(false);

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<p className="text-sm text-slate-600 dark:text-gray-400">
					Conteúdo dos cursos. Preço e acesso ficam na aba Planos.
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
			) : error ? (
				<div className="text-center py-16">
					<p className="text-red-500 font-medium">Erro ao carregar cursos</p>
				</div>
			) : (courses ?? []).length === 0 ? (
				<div className="text-center py-16">
					<BookOpen className="w-10 h-10 text-slate-400 dark:text-gray-700 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-gray-400 font-medium">
						Nenhum curso criado
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{(courses ?? []).map((c) => (
						<CourseCard
							key={c.id}
							course={c}
							onEdit={() => {
								setEditing(c);
								setOpen(true);
							}}
							onDelete={() => {
								if (
									confirm(
										`Remover o curso "${c.title}"? Essa ação não pode ser desfeita.`,
									)
								) {
									deleteMut.mutate(c.id);
								}
							}}
						/>
					))}
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
							// erros já são tratados nos toasts dos hooks
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
	course: Course;
	onEdit: () => void;
	onDelete: () => void;
}) {
	return (
		<div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/30 dark:from-[#1a1a1d] dark:via-sky-950/20 dark:to-indigo-950/10 p-5 flex flex-col">
			<div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full bg-sky-500/15 dark:bg-sky-500/10 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 blur-3xl" />

			<div className="relative flex flex-col flex-1">
				<Link href={`/courses/${course.slug}`} className="block">
					{course.image_url ? (
						<img
							src={course.image_url}
							alt={course.title}
							className="w-full h-32 object-cover rounded-xl mb-3 ring-1 ring-slate-200 dark:ring-white/10"
						/>
					) : (
						<div className="w-full h-32 rounded-xl bg-slate-100/80 dark:bg-[#0d0d0f]/80 mb-3 flex items-center justify-center ring-1 ring-slate-200 dark:ring-white/10">
							<BookOpen className="w-8 h-8 text-sky-400 dark:text-sky-500/70" />
						</div>
					)}

					<div className="flex items-start justify-between gap-2">
						<div className="flex-1 min-w-0">
							<p className="font-bold text-slate-900 dark:text-white truncate">
								{course.title}
							</p>
							<p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
								/{course.slug}
							</p>
						</div>
						<span
							className={`shrink-0 text-xs px-2 py-1 rounded-md ${
								course.published
									? 'bg-emerald-500/15 text-emerald-600'
									: 'bg-slate-500/15 text-slate-500'
							}`}
						>
							{course.published ? 'Publicado' : 'Rascunho'}
						</span>
					</div>

					<p className="text-sm text-slate-500 mt-2 line-clamp-2 min-h-[2.5rem]">
						{course.description ?? ''}
					</p>
				</Link>

				<div className="mt-auto pt-4 flex gap-2">
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
