'use client';

import { useState } from 'react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import type {
	CreateLessonPayload,
	Lesson,
	UpdateLessonPayload,
} from '../types/lessons';

interface Props {
	editing: Lesson | null;
	pending: boolean;
	onClose: () => void;
	onSubmit: (payload: CreateLessonPayload | UpdateLessonPayload) => void;
}

export function LessonFormModal({
	editing,
	pending,
	onClose,
	onSubmit,
}: Props) {
	const [title, setTitle] = useState(editing?.title ?? '');
	const [description, setDescription] = useState(editing?.description ?? '');
	const [bodyMd, setBodyMd] = useState(editing?.body_md ?? '');
	const [position, setPosition] = useState(
		editing?.position != null ? String(editing.position) : '',
	);
	const [isFree, setIsFree] = useState(editing?.is_free ?? false);

	const canSubmit = !pending && !!title.trim();

	return (
		<ModalOverlay onClose={onClose} tone="courses">
			<div className="p-6 space-y-4">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					{editing ? 'Editar lição' : 'Nova lição'}
				</h3>

				<Field label="Título">
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
					/>
				</Field>

				<Field label="Descrição curta (opcional)">
					<input
						value={description ?? ''}
						onChange={(e) => setDescription(e.target.value)}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
					/>
				</Field>

				<Field label="Conteúdo (Markdown, opcional)">
					<textarea
						value={bodyMd ?? ''}
						onChange={(e) => setBodyMd(e.target.value)}
						rows={6}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm font-mono"
					/>
				</Field>

				<Field label="Posição (opcional)">
					<input
						type="number"
						min={1}
						value={position}
						onChange={(e) => setPosition(e.target.value)}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
					/>
				</Field>

				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={isFree}
						onChange={(e) => setIsFree(e.target.checked)}
					/>
					Lição gratuita (acesso anônimo permitido)
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
						onClick={() =>
							onSubmit({
								title: title.trim(),
								description: description?.trim() || undefined,
								body_md: bodyMd?.trim() || undefined,
								position: position ? Number(position) : undefined,
								is_free: isFree,
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
