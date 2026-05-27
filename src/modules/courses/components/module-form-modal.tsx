'use client';

import { useState } from 'react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import type {
	CourseModule,
	CreateCourseModulePayload,
	UpdateCourseModulePayload,
} from '../types/modules';

interface Props {
	editing: CourseModule | null;
	pending: boolean;
	onClose: () => void;
	onSubmit: (
		payload: CreateCourseModulePayload | UpdateCourseModulePayload,
	) => void;
}

export function ModuleFormModal({
	editing,
	pending,
	onClose,
	onSubmit,
}: Props) {
	const [title, setTitle] = useState(editing?.title ?? '');
	const [description, setDescription] = useState(editing?.description ?? '');
	const [position, setPosition] = useState(
		editing?.position != null ? String(editing.position) : '',
	);

	const canSubmit = !pending && !!title.trim();

	return (
		<ModalOverlay onClose={onClose} tone="courses">
			<div className="p-6 space-y-4">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					{editing ? 'Editar módulo' : 'Novo módulo'}
				</h3>

				<Field label="Título">
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-gradient-to-br from-sky-50/60 via-white to-indigo-50/40 dark:from-sky-950/25 dark:via-white/[0.03] dark:to-indigo-950/20 text-slate-900 dark:text-white placeholder:text-slate-500 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition-colors"
					/>
				</Field>

				<Field label="Descrição (opcional)">
					<textarea
						value={description ?? ''}
						onChange={(e) => setDescription(e.target.value)}
						rows={3}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-gradient-to-br from-sky-50/60 via-white to-indigo-50/40 dark:from-sky-950/25 dark:via-white/[0.03] dark:to-indigo-950/20 text-slate-900 dark:text-white placeholder:text-slate-500 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition-colors"
					/>
				</Field>

				<Field label="Posição (opcional — padrão: fim da lista)">
					<input
						type="number"
						min={1}
						value={position}
						onChange={(e) => setPosition(e.target.value)}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-gradient-to-br from-sky-50/60 via-white to-indigo-50/40 dark:from-sky-950/25 dark:via-white/[0.03] dark:to-indigo-950/20 text-slate-900 dark:text-white placeholder:text-slate-500 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition-colors"
					/>
				</Field>

				<div className="flex gap-3 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
					>
						Cancelar
					</button>
					<button
						type="button"
						disabled={!canSubmit}
						onClick={() =>
							onSubmit({
								title: title.trim(),
								description: description?.trim() || undefined,
								position: position ? Number(position) : undefined,
							})
						}
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
