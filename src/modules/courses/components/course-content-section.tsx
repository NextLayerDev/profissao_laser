'use client';

import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
	useCourseModules,
	useCreateCourseModule,
	useDeleteCourseModule,
	useReorderCourseModules,
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
	const reorderMut = useReorderCourseModules(courseSlug);

	const [editing, setEditing] = useState<CourseModule | null>(null);
	const [open, setOpen] = useState(false);
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const [items, setItems] = useState<CourseModule[]>([]);
	const [dragId, setDragId] = useState<string | null>(null);

	useEffect(() => {
		if (modules) setItems(modules);
	}, [modules]);

	function toggle(id: string) {
		setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
	}

	function handleDrop(targetId: string) {
		if (!dragId || dragId === targetId) {
			setDragId(null);
			return;
		}
		const from = items.findIndex((m) => m.id === dragId);
		const to = items.findIndex((m) => m.id === targetId);
		setDragId(null);
		if (from === -1 || to === -1) return;
		const next = [...items];
		const [moved] = next.splice(from, 1);
		next.splice(to, 0, moved);
		setItems(next);
		reorderMut.mutate({ courseId, moduleIds: next.map((m) => m.id) });
	}

	const ordered = items.length > 0 ? items : (modules ?? []);

	return (
		<div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/30 dark:from-[#1a1a1d] dark:via-sky-950/20 dark:to-indigo-950/10 p-5">
			<div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl bg-sky-500/15 dark:bg-sky-500/10" />
			<div className="pointer-events-none absolute -bottom-28 -left-20 w-60 h-60 rounded-full blur-3xl bg-indigo-500/10 dark:bg-indigo-500/10" />
			<div className="relative">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h3 className="text-lg font-semibold text-slate-900 dark:text-white">
							Conteúdo
						</h3>
						<p className="text-sm text-slate-500 dark:text-gray-400">
							Módulos e lições do curso. Arraste pela alça para reordenar.
						</p>
					</div>
					<button
						type="button"
						onClick={() => {
							setEditing(null);
							setOpen(true);
						}}
						className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg shadow-sky-500/20 transition-colors"
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
				) : ordered.length === 0 ? (
					<p className="text-slate-500 text-center py-12">
						Nenhum módulo. Crie um para começar.
					</p>
				) : (
					<div className="space-y-3">
						{ordered.map((m) => {
							const isOpen = !!expanded[m.id];
							return (
								<div
									key={m.id}
									draggable
									onDragStart={() => setDragId(m.id)}
									onDragOver={(e) => e.preventDefault()}
									onDrop={() => handleDrop(m.id)}
									onDragEnd={() => setDragId(null)}
									className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/30 dark:from-[#1a1a1d] dark:via-sky-950/20 dark:to-indigo-950/10 p-4 transition-opacity ${dragId === m.id ? 'opacity-40' : ''}`}
								>
									<div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl bg-sky-500/10 dark:bg-sky-500/10" />
									<div className="pointer-events-none absolute -bottom-20 -left-12 w-36 h-36 rounded-full blur-3xl bg-indigo-500/10 dark:bg-indigo-500/10" />
									<div className="relative">
										<div className="group flex items-center gap-3">
											<span
												className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0"
												title="Arraste para reordenar"
												aria-hidden="true"
											>
												<GripVertical className="w-4 h-4" />
											</span>
											<button
												type="button"
												onClick={() => toggle(m.id)}
												className="flex items-center gap-3 flex-1 text-left"
											>
												<ChevronToggle open={isOpen} />
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
									{
										...payload,
										course_id: courseId,
										title: payload.title ?? '',
									},
									{ onSuccess: () => setOpen(false) },
								);
							}
						}}
					/>
				)}
			</div>
		</div>
	);
}
