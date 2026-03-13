'use client';

import {
	ChevronDown,
	ChevronRight,
	Edit,
	Loader2,
	MoveDown,
	MoveUp,
	Plus,
	Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	useCreateFAQ,
	useDeleteFAQ,
	useFAQsAdmin,
	useReorderFAQs,
	useUpdateFAQ,
} from '@/hooks/use-faq-admin';
import type { PLFAQ } from '@/types/faq';
import { FAQModal } from './faq-modal';

export function FAQAdminSection() {
	const { data: faqs = [], isLoading } = useFAQsAdmin();
	const createMutation = useCreateFAQ();
	const updateMutation = useUpdateFAQ();
	const deleteMutation = useDeleteFAQ();
	const reorderMutation = useReorderFAQs();

	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
	const [modal, setModal] = useState<{
		open: boolean;
		editing: PLFAQ | null;
	}>({ open: false, editing: null });

	function toggleExpanded(id: string) {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	async function handleSave(data: {
		question: string;
		answer: string;
		order: number;
		file?: File;
	}) {
		try {
			if (modal.editing) {
				await updateMutation.mutateAsync({
					id: modal.editing.id,
					payload: data,
				});
				toast.success('FAQ atualizada!');
			} else {
				await createMutation.mutateAsync(data);
				toast.success('FAQ criada!');
			}
			setModal({ open: false, editing: null });
		} catch {
			toast.error('Erro ao salvar');
		}
	}

	async function handleDelete(faq: PLFAQ) {
		if (!confirm(`Excluir a FAQ "${faq.question}"?`)) return;
		try {
			await deleteMutation.mutateAsync(faq.id);
			toast.success('FAQ excluída!');
		} catch {
			toast.error('Erro ao excluir');
		}
	}

	async function moveFAQ(idx: number, dir: -1 | 1) {
		const newIdx = idx + dir;
		if (newIdx < 0 || newIdx >= faqs.length) return;
		const reordered = [...faqs];
		[reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
		try {
			await reorderMutation.mutateAsync(reordered.map((f) => f.id));
			toast.success('Ordem atualizada');
		} catch {
			toast.error('Erro ao reordenar');
		}
	}

	if (isLoading) {
		return (
			<div className="flex justify-center py-16">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-slate-900 dark:text-white">
						Dúvidas Frequentes
					</h2>
					<p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
						{faqs.length} FAQ{faqs.length !== 1 ? 's' : ''}
					</p>
				</div>
				<button
					type="button"
					onClick={() => setModal({ open: true, editing: null })}
					className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
				>
					<Plus className="w-4 h-4" />
					Nova FAQ
				</button>
			</div>

			{/* Lista */}
			{faqs.length === 0 ? (
				<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl p-12 text-center">
					<p className="text-slate-600 dark:text-gray-400 mb-4">
						Nenhuma FAQ cadastrada
					</p>
					<button
						type="button"
						onClick={() => setModal({ open: true, editing: null })}
						className="text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 font-medium"
					>
						Criar primeira FAQ
					</button>
				</div>
			) : (
				<div className="space-y-3">
					{faqs.map((faq, idx) => {
						const isExpanded = expandedIds.has(faq.id);
						const totalReactions = faq.reactions.reduce(
							(s, r) => s + r.count,
							0,
						);
						return (
							<div
								key={faq.id}
								className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden"
							>
								<div className="flex items-center gap-2 px-3 py-3">
									{/* Reorder */}
									<div className="flex flex-col gap-0.5 shrink-0">
										<button
											type="button"
											onClick={() => void moveFAQ(idx, -1)}
											disabled={idx === 0 || reorderMutation.isPending}
											className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-20"
										>
											<MoveUp className="w-3 h-3 text-slate-500 dark:text-gray-400" />
										</button>
										<button
											type="button"
											onClick={() => void moveFAQ(idx, 1)}
											disabled={
												idx === faqs.length - 1 || reorderMutation.isPending
											}
											className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-20"
										>
											<MoveDown className="w-3 h-3 text-slate-500 dark:text-gray-400" />
										</button>
									</div>

									{/* Expand */}
									<button
										type="button"
										onClick={() => toggleExpanded(faq.id)}
										className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded transition-colors"
									>
										{isExpanded ? (
											<ChevronDown className="w-4 h-4 text-slate-500 dark:text-gray-400" />
										) : (
											<ChevronRight className="w-4 h-4 text-slate-500 dark:text-gray-400" />
										)}
									</button>

									{/* Título */}
									<div className="flex-1 min-w-0">
										<p className="font-semibold text-slate-900 dark:text-white truncate">
											{faq.question}
										</p>
										{totalReactions > 0 && (
											<p className="text-xs text-slate-500 dark:text-gray-400">
												{totalReactions}{' '}
												{totalReactions === 1 ? 'reação' : 'reações'}
											</p>
										)}
									</div>

									{/* Ações */}
									<button
										type="button"
										onClick={() => setModal({ open: true, editing: faq })}
										className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
										aria-label="Editar"
									>
										<Edit className="w-4 h-4 text-slate-500 dark:text-gray-400" />
									</button>
									<button
										type="button"
										onClick={() => void handleDelete(faq)}
										className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
										aria-label="Excluir"
									>
										<Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
									</button>
								</div>

								{/* Preview expandido */}
								{isExpanded && (
									<div className="px-4 pb-4 pt-0 border-t border-slate-200 dark:border-gray-700 space-y-3">
										<div className="pt-3">
											<p className="text-sm font-medium text-slate-700 dark:text-gray-300">
												Pergunta:
											</p>
											<p className="text-sm text-slate-600 dark:text-slate-400">
												{faq.question}
											</p>
										</div>
										<div>
											<p className="text-sm font-medium text-slate-700 dark:text-gray-300">
												Resposta:
											</p>
											<p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
												{faq.answer}
											</p>
										</div>
										{faq.imageUrl && (
											<div>
												<p className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
													Imagem:
												</p>
												<img
													src={faq.imageUrl}
													alt={faq.question}
													className="w-full max-w-sm h-40 object-cover rounded-lg border border-slate-200 dark:border-gray-700"
												/>
											</div>
										)}
										{faq.reactions.length > 0 && (
											<div>
												<p className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
													Reações:
												</p>
												<div className="flex gap-2">
													{faq.reactions
														.filter((r) => r.count > 0)
														.map((r) => (
															<span
																key={r.emoji}
																className="flex items-center gap-1 text-sm bg-slate-100 dark:bg-white/5 rounded-full px-2.5 py-0.5"
															>
																{r.emoji} {r.count}
															</span>
														))}
												</div>
											</div>
										)}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{/* Modal */}
			{modal.open && (
				<FAQModal
					editing={modal.editing}
					nextOrder={faqs.length}
					onClose={() => setModal({ open: false, editing: null })}
					onSave={handleSave}
				/>
			)}
		</div>
	);
}
