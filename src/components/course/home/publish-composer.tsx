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
 * Composer estilo rede social, sempre aberto no topo do feed da home:
 * campo pronto pra digitar; os campos extras aparecem conforme a pessoa
 * escreve. Publica direto no feed da comunidade (useCreateProject).
 */
export function PublishComposer() {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [material, setMaterial] = useState('');
	const [technique, setTechnique] = useState('');
	const [image, setImage] = useState<string | null>(null);
	const [focused, setFocused] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);
	const createProject = useCreateProject();

	const user = getCurrentUser();
	const authorName = user?.name ?? user?.email ?? 'Você';
	const firstName = user?.name?.split(' ')[0] || 'você';
	const initials = initialsOf(user?.name ?? user?.email);

	// Mostra os campos extras assim que a pessoa interage.
	const open =
		focused ||
		!!title.trim() ||
		!!description.trim() ||
		!!material.trim() ||
		!!technique.trim() ||
		!!image;

	function reset() {
		setTitle('');
		setDescription('');
		setMaterial('');
		setTechnique('');
		setImage(null);
		setFocused(false);
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
			{ onSuccess: () => reset() },
		);
	}

	const fieldClass =
		'w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500 transition-colors';

	return (
		<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 sm:p-4">
			<div className="flex items-start gap-3">
				<span className="w-10 h-10 rounded-full bg-violet-600 grid place-items-center text-sm font-bold text-white shrink-0">
					{initials}
				</span>
				<div className="flex-1 min-w-0">
					<input
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						onFocus={() => setFocused(true)}
						placeholder={`Mostre o que você criou hoje, ${firstName}! 🔥`}
						className="w-full bg-transparent text-[15px] sm:text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal focus:outline-none py-1.5"
					/>

					{open ? (
						<div className="mt-2 space-y-2.5">
							{image ? (
								<div className="relative rounded-lg overflow-hidden">
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
							<textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Conte sobre o seu projeto... (opcional)"
								rows={2}
								className={`${fieldClass} resize-none`}
							/>
							<div className="grid grid-cols-2 gap-2.5">
								<input
									type="text"
									value={material}
									onChange={(e) => setMaterial(e.target.value)}
									placeholder="Material (opcional)"
									className={fieldClass}
								/>
								<input
									type="text"
									value={technique}
									onChange={(e) => setTechnique(e.target.value)}
									placeholder="Técnica (opcional)"
									className={fieldClass}
								/>
							</div>
						</div>
					) : null}
				</div>
			</div>

			<div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
				<button
					type="button"
					onClick={() => fileRef.current?.click()}
					className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
				>
					<ImageIcon className="w-4 h-4" />
					{image ? 'Trocar imagem' : 'Foto'}
				</button>
				<div className="flex items-center gap-2">
					{open ? (
						<button
							type="button"
							onClick={reset}
							className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
						>
							Limpar
						</button>
					) : null}
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

			<input
				ref={fileRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={handleImage}
			/>
		</div>
	);
}
