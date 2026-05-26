'use client';

import { useState } from 'react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { useAdminCourses } from '@/modules/courses';
import type { PlanDetailsCourse } from '../types/plan-details';

interface Props {
	editing: PlanDetailsCourse | null;
	/** Slugs já vinculados (escondidos do dropdown ao criar). */
	excludeSlugs: string[];
	pending: boolean;
	onClose: () => void;
	onSubmit: (args: { slug: string; published: boolean }) => void;
}

export function CoursePlanFormModal({
	editing,
	excludeSlugs,
	pending,
	onClose,
	onSubmit,
}: Props) {
	const courses = useAdminCourses();

	const [slug, setSlug] = useState(editing?.course.slug ?? '');
	const [published, setPublished] = useState(
		editing?.course_plan.published ?? true,
	);

	const availableCourses = (courses.data ?? []).filter(
		(c) => !excludeSlugs.includes(c.slug),
	);

	const canSubmit = !pending && !!slug;

	return (
		<ModalOverlay onClose={onClose} tone="plans">
			<div className="p-6 space-y-4">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					{editing ? 'Editar vínculo' : 'Vincular curso'}
				</h3>

				{editing ? (
					<div>
						<p className="text-sm font-medium text-slate-900 dark:text-white">
							{editing.course.title}
						</p>
						<p className="text-xs text-slate-500 font-mono">
							/{editing.course.slug}
						</p>
					</div>
				) : (
					<Field label="Curso">
						<select
							value={slug}
							onChange={(e) => setSlug(e.target.value)}
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] px-3 py-2 text-sm"
						>
							<option value="">Selecione...</option>
							{availableCourses.map((c) => (
								<option key={c.id} value={c.slug}>
									{c.title} (/{c.slug})
								</option>
							))}
						</select>
						{availableCourses.length === 0 && !courses.isLoading && (
							<p className="text-xs text-amber-500 mt-1">
								Todos os cursos já estão vinculados a este plano.
							</p>
						)}
					</Field>
				)}

				<p className="text-xs text-slate-500">
					O preço é definido no próprio plano. Aqui você só vincula o curso e
					controla se ele aparece publicado neste plano.
				</p>

				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={published}
						onChange={(e) => setPublished(e.target.checked)}
					/>
					Publicado (visível no catálogo)
				</label>

				<div className="flex gap-3 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-white/10"
					>
						Cancelar
					</button>
					<button
						type="button"
						disabled={!canSubmit}
						onClick={() => onSubmit({ slug, published })}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white disabled:opacity-60"
					>
						{pending ? 'Salvando...' : 'Salvar'}
					</button>
				</div>
			</div>
		</ModalOverlay>
	);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: label wraps children implicitly
		<label className="block">
			<span className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5">
				{label}
			</span>
			{children}
		</label>
	);
}
