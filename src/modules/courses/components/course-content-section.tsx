'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
	useCourseModules,
	useCreateCourseModule,
	useDeleteCourseModule,
	useUpdateCourseModule,
} from '../hooks/use-course-modules';
import type { CourseModule, UpdateCourseModulePayload } from '../types/modules';
import { ChevronToggle, LessonsList } from './lessons-list';
import { ModuleFormModal } from './module-form-modal';

interface Props {
	courseSlug: string;
	courseId: string;
}

export function CourseContentSection({ courseSlug, courseId }: Props) {
	const { data: modules, isLoading, error } = useCourseModules(courseSlug);
	const createMut = useCreateCourseModule(courseSlug);
	const updateMut = useUpdateCourseModule(courseSlug);
	const deleteMut = useDeleteCourseModule(courseSlug);

	const [editing, setEditing] = useState<CourseModule | null>(null);
	const [open, setOpen] = useState(false);
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});

	function toggle(id: string) {
		setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3 className="text-lg font-semibold text-slate-900 dark:text-white">
						Conteúdo
					</h3>
					<p className="text-sm text-slate-500 dark:text-gray-400">
						Módulos e lições do curso.
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
					Novo módulo
				</button>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-12">
					<div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
				</div>
			) : error ? (
				<p className="text-red-500 text-center py-12">
					Erro ao carregar módulos
				</p>
			) : (modules ?? []).length === 0 ? (
				<p className="text-slate-500 text-center py-12">
					Nenhum módulo. Crie um para começar.
				</p>
			) : (
				<div className="space-y-3">
					{(modules ?? []).map((m) => {
						const isOpen = !!expanded[m.id];
						return (
							<div
								key={m.id}
								className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-4"
							>
								<div className="group flex items-center gap-3">
									<button
										type="button"
										onClick={() => toggle(m.id)}
										className="flex items-center gap-3 flex-1 text-left"
									>
										<ChevronToggle open={isOpen} />
										<span className="text-xs text-slate-400 w-6 tabular-nums">
											{m.position}
										</span>
										<div className="flex-1 min-w-0">
											<p className="font-semibold text-slate-900 dark:text-white truncate">
												{m.title}
											</p>
											{m.description && (
												<p className="text-xs text-slate-500 truncate">
													{m.description}
												</p>
											)}
										</div>
									</button>
									<button
										type="button"
										onClick={() => {
											setEditing(m);
											setOpen(true);
										}}
										className="p-2 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
									>
										<Pencil className="w-4 h-4" />
									</button>
									<button
										type="button"
										onClick={() => {
											if (
												confirm(
													`Remover o módulo "${m.title}" e todas as lições?`,
												)
											) {
												deleteMut.mutate(m.id);
											}
										}}
										className="p-2 rounded text-red-500 hover:bg-red-500/10"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>

								<LessonsList moduleId={m.id} expanded={isOpen} />
							</div>
						);
					})}
				</div>
			)}

			{open && (
				<ModuleFormModal
					editing={editing}
					pending={createMut.isPending || updateMut.isPending}
					onClose={() => setOpen(false)}
					onSubmit={(payload) => {
						if (editing) {
							updateMut.mutate(
								{
									id: editing.id,
									payload: payload as UpdateCourseModulePayload,
								},
								{ onSuccess: () => setOpen(false) },
							);
						} else {
							createMut.mutate(
								{ ...payload, course_id: courseId, title: payload.title ?? '' },
								{ onSuccess: () => setOpen(false) },
							);
						}
					}}
				/>
			)}
		</div>
	);
}
