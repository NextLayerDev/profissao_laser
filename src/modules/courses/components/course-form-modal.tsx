'use client';

import { useState } from 'react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import type {
	Course,
	CreateCoursePayload,
	UpdateCoursePayload,
} from '../types/courses';

interface Props {
	editing: Course | null;
	pending: boolean;
	onClose: () => void;
	onSubmit: (args: {
		payload: CreateCoursePayload | UpdateCoursePayload;
		imageFile: File | null;
	}) => void;
}

export function CourseFormModal({
	editing,
	pending,
	onClose,
	onSubmit,
}: Props) {
	const [slug, setSlug] = useState(editing?.slug ?? '');
	const [title, setTitle] = useState(editing?.title ?? '');
	const [description, setDescription] = useState(editing?.description ?? '');
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [published, setPublished] = useState(editing?.published ?? false);

	const canSubmit =
		!pending && !!title.trim() && (editing !== null || !!slug.trim());

	return (
		<ModalOverlay onClose={onClose} tone="courses">
			<div className="p-6 space-y-4">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					{editing ? 'Editar curso' : 'Novo curso'}
				</h3>

				<Field label="Slug (URL)">
					<input
						value={slug}
						onChange={(e) => setSlug(e.target.value)}
						placeholder="meu-curso"
						disabled={editing !== null}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm disabled:opacity-60"
					/>
				</Field>

				<Field label="Título">
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
					/>
				</Field>

				<Field label="Descrição (opcional)">
					<textarea
						value={description ?? ''}
						onChange={(e) => setDescription(e.target.value)}
						rows={3}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
					/>
				</Field>

				<Field label="Imagem (opcional)">
					<input
						type="file"
						accept="image/*"
						onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm file:mr-3 file:px-3 file:py-1 file:rounded-md file:border-0 file:bg-violet-600/20 file:text-violet-300 file:text-xs file:cursor-pointer"
					/>
					{editing?.image_url && !imageFile && (
						<p className="text-xs text-slate-500 mt-1">
							Imagem atual será mantida se nenhum arquivo for selecionado.
						</p>
					)}
				</Field>

				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={published}
						onChange={(e) => setPublished(e.target.checked)}
					/>
					Publicado
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
						onClick={() => {
							const base = {
								title: title.trim(),
								description: description?.trim() || undefined,
								published,
							};
							const payload = editing ? base : { ...base, slug: slug.trim() };
							onSubmit({ payload, imageFile });
						}}
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
