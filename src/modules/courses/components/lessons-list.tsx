'use client';

import {
	ChevronRight,
	FileText,
	Lock,
	Paperclip,
	Pencil,
	Plus,
	Trash2,
} from 'lucide-react';
import { useState } from 'react';
import {
	useCreateLesson,
	useDeleteLesson,
	useModuleLessons,
	useUpdateLesson,
} from '../hooks/use-lessons';
import type {
	CreateLessonPayload,
	Lesson,
	UpdateLessonPayload,
} from '../types/lessons';
import { LessonFormModal } from './lesson-form-modal';
import { LessonMaterialsModal } from './lesson-materials-modal';

interface Props {
	moduleId: string;
	expanded: boolean;
}

export function LessonsList({ moduleId, expanded }: Props) {
	const { data: lessons, isLoading } = useModuleLessons(moduleId, expanded);
	const createMut = useCreateLesson(moduleId);
	const updateMut = useUpdateLesson(moduleId);
	const deleteMut = useDeleteLesson(moduleId);

	const [editing, setEditing] = useState<Lesson | null>(null);
	const [open, setOpen] = useState(false);
	const [materialsLesson, setMaterialsLesson] = useState<Lesson | null>(null);

	if (!expanded) return null;

	return (
		<div className="mt-3 pl-4 border-l border-slate-200 dark:border-white/10 space-y-2">
			{isLoading ? (
				<div className="py-3 text-sm text-slate-500">Carregando lições...</div>
			) : (lessons ?? []).length === 0 ? (
				<div className="py-3 text-sm text-slate-500">Nenhuma lição.</div>
			) : (
				<ul className="space-y-1.5">
					{(lessons ?? []).map((l) => (
						<li key={l.id} className="group relative">
							<button
								type="button"
								onClick={() => {
									setEditing(l);
									setOpen(true);
								}}
								className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200/70 dark:border-white/10 bg-gradient-to-r from-sky-50/50 via-white to-indigo-50/40 dark:from-sky-950/20 dark:via-white/[0.02] dark:to-indigo-950/15 hover:from-sky-100/70 hover:to-indigo-100/60 dark:hover:from-sky-900/30 dark:hover:to-indigo-900/25 text-left transition-colors"
							>
								<span className="text-xs text-slate-400 w-6 tabular-nums">
									{l.position}
								</span>
								<FileText className="w-4 h-4 text-slate-400 shrink-0" />
								<span className="flex-1 text-sm text-slate-900 dark:text-white truncate">
									{l.title}
								</span>
								{l.is_free ? (
									<span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600">
										grátis
									</span>
								) : (
									<Lock className="w-3.5 h-3.5 text-slate-400" />
								)}
								<span className="w-14" aria-hidden />
							</button>
							<div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100">
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										setMaterialsLesson(l);
									}}
									className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
									title="Materiais"
								>
									<Paperclip className="w-3.5 h-3.5" />
								</button>
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										setEditing(l);
										setOpen(true);
									}}
									className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
								>
									<Pencil className="w-3.5 h-3.5" />
								</button>
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										if (confirm(`Remover a lição "${l.title}"?`)) {
											deleteMut.mutate(l.id);
										}
									}}
									className="p-1.5 rounded text-red-500 hover:bg-red-500/10"
								>
									<Trash2 className="w-3.5 h-3.5" />
								</button>
							</div>
						</li>
					))}
				</ul>
			)}

			<button
				type="button"
				onClick={() => {
					setEditing(null);
					setOpen(true);
				}}
				className="mt-2 flex items-center gap-2 px-3 py-2 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 rounded-lg"
			>
				<Plus className="w-4 h-4" />
				Nova lição
			</button>

			{open && (
				<LessonFormModal
					editing={editing}
					pending={createMut.isPending || updateMut.isPending}
					onClose={() => setOpen(false)}
					onSubmit={(payload) => {
						if (editing) {
							return updateMut.mutateAsync({
								id: editing.id,
								payload: payload as UpdateLessonPayload,
							});
						}
						return createMut.mutateAsync({
							...(payload as CreateLessonPayload),
							module_id: moduleId,
						});
					}}
				/>
			)}

			{materialsLesson && (
				<LessonMaterialsModal
					lessonId={materialsLesson.id}
					lessonTitle={materialsLesson.title}
					onClose={() => setMaterialsLesson(null)}
				/>
			)}
		</div>
	);
}

export function ChevronToggle({ open }: { open: boolean }) {
	return (
		<ChevronRight
			className={`w-4 h-4 text-slate-400 transition-transform ${
				open ? 'rotate-90' : ''
			}`}
		/>
	);
}
