'use client';

import { Image as ImageIcon, Loader2, Send, X } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';
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
 * Composer estilo rede social no topo do feed da home: expande inline
 * (sem modal) e publica direto no feed da comunidade (useCreateProject).
 */
export function PublishComposer() {
	const [expanded, setExpanded] = useState(false);
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
	const initials = initialsOf(user?.name ?? user?.email);

	function reset() {
		setTitle('');
		setDescription('');
		setMaterial('');
		setTechnique('');
		setImage(null);
	}

	function collapse() {
		setExpanded(false);
		reset();
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
				onSuccess: () => collapse(),
			},
		);
	}

	const inputClass =
		'w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500 transition-colors';

	// Recolhido: gatilho compacto estilo rede social.
	if (!expanded) {
		return (
			<button
				type="button"
				onClick={() => setExpanded(true)}
				className="w-full flex items-center gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-left hover:border-violet-300 dark:hover:border-violet-500/40 hover:shadow-sm transition-all"
			>
				<span className="w-9 h-9 rounded-full bg-violet-600 grid place-items-center text-xs font-bold text-white shrink-0">
					{initials}
				</span>
				<span className="flex-1 text-sm text-slate-400 dark:text-gray-400 truncate">
					O que você criou hoje, {firstName}? Publique no feed…
				</span>
				<span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold shrink-0">
					<Send className="w-3.5 h-3.5" />
					Publicar
				</span>
			</button>
		);
	}

	// Expandido inline: formulário no próprio feed.
	return (
		<div className="bg-white dark:bg-white/5 border border-violet-300 dark:border-violet-500/40 rounded-xl p-3 sm:p-4 ring-1 ring-violet-500/10">
			<div className="flex items-center gap-3 mb-3">
				<span className="w-9 h-9 rounded-full bg-violet-600 grid place-items-center text-xs font-bold text-white shrink-0">
					{initials}
				</span>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
						Publicar no feed
					</p>
					<p className="text-[11px] text-slate-500 dark:text-gray-400">
						Compartilhe seu trabalho com a comunidade.
					</p>
				</div>
				<button
					type="button"
					onClick={collapse}
					className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
					title="Fechar"
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
				<div className="relative rounded-lg overflow-hidden mb-3">
					<img
						src={image}
						alt="Pré-visualização"
						className="w-full max-h-60 object-cover"
					/>
					<button
						type="button"
						onClick={() => setImage(null)}
						className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white"
					>
						<X className="w-4 h-4" />
					</button>
				</div>
			) : null}

			<div className="space-y-2.5">
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
				<div className="grid grid-cols-2 gap-2.5">
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

			<div className="flex items-center justify-between gap-2 mt-3">
				<button
					type="button"
					onClick={() => fileRef.current?.click()}
					className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
				>
					<ImageIcon className="w-4 h-4" />
					{image ? 'Trocar imagem' : 'Adicionar imagem'}
				</button>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={collapse}
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
		</div>
	);
}
