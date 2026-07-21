'use client';

import { Loader2, Pin, X } from 'lucide-react';
import { useState } from 'react';
import { ModalOverlay } from '@/components/ui/modal-overlay';

export interface SourceFormValues {
	title: string;
	body: string;
	label: string;
	pinned: boolean;
}

/**
 * Escrever/editar conhecimento à mão. É o jeito da staff ensinar algo que não
 * está em lugar nenhum da plataforma (política de reembolso, combinados etc).
 */
export function SourceModal({
	initial,
	saving,
	onSave,
	onClose,
}: {
	initial?: Partial<SourceFormValues>;
	saving: boolean;
	onSave: (values: SourceFormValues) => void;
	onClose: () => void;
}) {
	const editing = !!initial?.title;
	const [title, setTitle] = useState(initial?.title ?? '');
	const [body, setBody] = useState(initial?.body ?? '');
	const [label, setLabel] = useState(initial?.label ?? '');
	const [pinned, setPinned] = useState(initial?.pinned ?? false);

	const valid = title.trim().length > 0 && body.trim().length > 0;

	function submit() {
		if (!valid || saving) return;
		onSave({
			title: title.trim(),
			body: body.trim(),
			label: label.trim(),
			pinned,
		});
	}

	return (
		<ModalOverlay onClose={onClose} tone="plans" widthClassName="max-w-2xl">
			<div className="p-6">
				<div className="flex items-start justify-between gap-3 mb-1">
					<h2 className="text-xl font-bold text-slate-900 dark:text-white">
						{editing ? 'Editar conhecimento' : 'Escrever um conhecimento'}
					</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label="Fechar"
						className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
					>
						<X className="w-4 h-4" />
					</button>
				</div>
				<p className="text-sm text-slate-600 dark:text-gray-400 mb-5">
					Escreva com as suas palavras, como se estivesse explicando para um
					aluno. A IA vai usar isso nas respostas.
				</p>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						submit();
					}}
					className="space-y-4"
				>
					<div>
						<label
							htmlFor="kb-title"
							className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5"
						>
							Sobre o que é
						</label>
						<input
							id="kb-title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Ex.: Como funciona o reembolso do plano anual"
							className="w-full px-3 py-2.5 bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-600 focus:outline-none"
						/>
					</div>

					<div>
						<label
							htmlFor="kb-body"
							className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5"
						>
							O que a IA precisa saber
						</label>
						<textarea
							id="kb-body"
							value={body}
							onChange={(e) => setBody(e.target.value)}
							rows={10}
							placeholder="Explique com detalhes. Quanto mais claro e completo, melhor a IA responde."
							className="w-full px-3 py-2.5 bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-600 focus:outline-none resize-y"
						/>
					</div>

					<div>
						<label
							htmlFor="kb-label"
							className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5"
						>
							Etiqueta{' '}
							<span className="font-normal text-slate-400">(opcional)</span>
						</label>
						<input
							id="kb-label"
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							placeholder="Ex.: Financeiro"
							className="w-full px-3 py-2.5 bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-600 focus:outline-none"
						/>
					</div>

					<label className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
						<input
							type="checkbox"
							checked={pinned}
							onChange={(e) => setPinned(e.target.checked)}
							className="mt-0.5 w-4 h-4 accent-violet-600"
						/>
						<span>
							<span className="flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-white">
								<Pin className="w-3.5 h-3.5" />
								Destacar
							</span>
							<span className="block text-xs text-slate-500 dark:text-gray-400 mt-0.5">
								A IA dá preferência a este conteúdo quando a pergunta tiver a
								ver com ele.
							</span>
						</span>
					</label>

					<div className="flex justify-end gap-2 pt-1">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={!valid || saving}
							className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						>
							{saving && <Loader2 className="w-4 h-4 animate-spin" />}
							{editing ? 'Salvar' : 'Ensinar isso à IA'}
						</button>
					</div>
				</form>
			</div>
		</ModalOverlay>
	);
}
