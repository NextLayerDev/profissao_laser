'use client';

import { Image as ImageIcon, Loader2, Send, Sparkles, X } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { useCreateProject } from '@/hooks/use-community';
import { getCurrentUser } from '@/lib/auth';

function initialsOf(name: string | null | undefined): string {
	const base = (name ?? '').trim();
	if (!base) return '?';
	return (
		base
			.split(/\s+/)
			.slice(0, 2)
			.map((w) => w[0])
			.join('')
			.toUpperCase() || '?'
	);
}

/**
 * Composer estilo rede social na home: um "Publique agora" que abre um modal
 * e publica o projeto direto na vitrine (mesmo fluxo da Vitrine), sem sair do
 * início. Incentiva o aluno a postar.
 */
export function PublishComposer() {
	const [open, setOpen] = useState(false);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [material, setMaterial] = useState('');
	const [technique, setTechnique] = useState('');
	const [image, setImage] = useState<string | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);
	const createProject = useCreateProject();

	const user = getCurrentUser();
	const authorName = user?.name ?? user?.email ?? 'Você';
	const firstName = user?.name?.split(' ')[0] || 'você';

	function reset() {
		setTitle('');
		setDescription('');
		setMaterial('');
		setTechnique('');
		setImage(null);
	}

	function handleImage(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;
		const reader = new FileReader();
		reader.onloadend = () => setImage(reader.result as string);
		reader.readAsDataURL(file);
	}

	function publish() {
		if (!title.trim()) return;
		createProject.mutate(
			{
				author: authorName,
				title: title.trim(),
				description: description.trim(),
				img: image ?? undefined,
				material: material.trim() || undefined,
				technique: technique.trim() || undefined,
			},
			{
				onSuccess: () => {
					reset();
					setOpen(false);
				},
			},
		);
	}

	const inputClass =
		'w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500 transition-colors';

	return (
		<>
			{/* Gatilho social */}
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="w-full flex items-center gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-left hover:border-violet-300 dark:hover:border-violet-500/40 hover:shadow-sm transition-all"
			>
				<span className="w-9 h-9 rounded-full bg-violet-600 grid place-items-center text-xs font-bold text-white shrink-0">
					{initialsOf(user?.name ?? user?.email)}
				</span>
				<span className="flex-1 text-sm text-slate-400 dark:text-gray-400 truncate">
					O que você criou hoje, {firstName}? Publique na vitrine…
				</span>
				<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold shrink-0">
					<Sparkles className="w-3.5 h-3.5" />
					Publicar
				</span>
			</button>

			{open ? (
				<ModalOverlay onClose={() => setOpen(false)}>
					<div className="p-6 max-h-[90vh] overflow-y-auto">
						<div className="flex items-start justify-between mb-4">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center">
									<Sparkles className="w-5 h-5 text-white" />
								</div>
								<div>
									<h3 className="text-lg font-bold text-slate-900 dark:text-white">
										Publicar na vitrine
									</h3>
									<p className="text-xs text-slate-500 dark:text-gray-400">
										Compartilhe seu trabalho com a comunidade.
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={() => setOpen(false)}
								className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<input
							ref={fileRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={handleImage}
						/>

						{image ? (
							<div className="relative rounded-xl overflow-hidden mb-3">
								<img
									src={image}
									alt="Pré-visualização"
									className="w-full max-h-64 object-cover"
								/>
								<button
									type="button"
									onClick={() => setImage(null)}
									className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white"
								>
									<X className="w-4 h-4" />
								</button>
							</div>
						) : (
							<button
								type="button"
								onClick={() => fileRef.current?.click()}
								className="w-full mb-3 border-2 border-dashed border-slate-200 dark:border-white/15 rounded-xl p-6 text-center hover:border-violet-400 dark:hover:border-violet-500/50 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
							>
								<ImageIcon className="w-8 h-8 text-violet-400 mx-auto mb-1.5" />
								<p className="text-xs text-slate-500 dark:text-gray-400">
									Adicionar uma imagem (opcional)
								</p>
							</button>
						)}

						<div className="space-y-3">
							<input
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Título do projeto"
								className={inputClass}
							/>
							<textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Conte sobre o seu projeto..."
								rows={3}
								className={`${inputClass} resize-none`}
							/>
							<div className="grid grid-cols-2 gap-3">
								<input
									type="text"
									value={material}
									onChange={(e) => setMaterial(e.target.value)}
									placeholder="Material (opcional)"
									className={inputClass}
								/>
								<input
									type="text"
									value={technique}
									onChange={(e) => setTechnique(e.target.value)}
									placeholder="Técnica (opcional)"
									className={inputClass}
								/>
							</div>
						</div>

						<div className="flex justify-end gap-2 mt-5">
							<button
								type="button"
								onClick={() => setOpen(false)}
								className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={publish}
								disabled={!title.trim() || createProject.isPending}
								className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
							>
								{createProject.isPending ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Send className="w-4 h-4" />
								)}
								Publicar
							</button>
						</div>
					</div>
				</ModalOverlay>
			) : null}
		</>
	);
}
