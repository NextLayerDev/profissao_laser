'use client';

import {
	ChevronDown,
	ChevronRight,
	Edit,
	HelpCircle,
	Loader2,
	Plus,
	Trash2,
	X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	useCreateDefaultQuestion,
	useDefaultQuestions,
	useDeleteDefaultQuestion,
	useTechniciansAdmin,
	useUpdateDefaultQuestion,
} from '@/hooks/use-doubt-chat-admin';
import type { DefaultQuestion } from '@/types/doubt-chat';

function QuestionModal({
	editing,
	technicianId,
	onClose,
	onSave,
}: {
	editing: DefaultQuestion | null;
	technicianId: string;
	onClose: () => void;
	onSave: (
		technicianId: string,
		data: Omit<DefaultQuestion, 'id'>,
	) => Promise<void>;
}) {
	const [text, setText] = useState(editing?.text ?? '');
	const [type, setType] = useState<DefaultQuestion['type']>(
		editing?.type ?? 'text',
	);
	const [optionsStr, setOptionsStr] = useState(
		editing?.options?.join(', ') ?? '',
	);
	const [saving, setSaving] = useState(false);

	async function handleSave() {
		if (!text.trim()) {
			toast.error('Texto é obrigatório');
			return;
		}
		setSaving(true);
		try {
			const options =
				type === 'select' && optionsStr.trim()
					? optionsStr
							.split(',')
							.map((o) => o.trim())
							.filter(Boolean)
					: undefined;
			await onSave(technicianId, {
				text: text.trim(),
				type,
				options,
				order: editing?.order ?? 0,
			});
			toast.success(editing ? 'Pergunta atualizada!' : 'Pergunta adicionada!');
			onClose();
		} catch {
			toast.error('Erro ao salvar');
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-md">
				<div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-700">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						{editing ? 'Editar pergunta' : 'Nova pergunta'}
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
					>
						<X className="w-4 h-4 text-slate-500 dark:text-gray-400" />
					</button>
				</div>
				<div className="p-5 space-y-4">
					<div>
						<label
							htmlFor="q-text"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
						>
							Pergunta
						</label>
						<input
							id="q-text"
							type="text"
							value={text}
							onChange={(e) => setText(e.target.value)}
							placeholder="Ex: Qual o modelo da sua máquina?"
							className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
						/>
					</div>
					<div>
						<label
							htmlFor="q-type"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
						>
							Tipo
						</label>
						<select
							id="q-type"
							value={type}
							onChange={(e) =>
								setType(e.target.value as DefaultQuestion['type'])
							}
							className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
						>
							<option value="text">Texto curto</option>
							<option value="textarea">Texto longo</option>
							<option value="select">Seleção</option>
						</select>
					</div>
					{type === 'select' && (
						<div>
							<label
								htmlFor="q-options"
								className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
							>
								Opções (separadas por vírgula)
							</label>
							<input
								id="q-options"
								type="text"
								value={optionsStr}
								onChange={(e) => setOptionsStr(e.target.value)}
								placeholder="Ex: EZCAD, LightBurn, Outro"
								className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
							/>
						</div>
					)}
				</div>
				<div className="flex justify-end gap-3 p-5 border-t border-slate-200 dark:border-gray-700">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors text-sm"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={() => void handleSave()}
						disabled={saving}
						className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium transition-colors text-sm disabled:opacity-50"
					>
						{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
						Guardar
					</button>
				</div>
			</div>
		</div>
	);
}

export function DefaultQuestionsSection() {
	const { data: technicians = [], isLoading: techniciansLoading } =
		useTechniciansAdmin();
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [modal, setModal] = useState<{
		open: boolean;
		technicianId: string;
		editing: DefaultQuestion | null;
	} | null>(null);

	const { data: questions = [], isLoading: questionsLoading } =
		useDefaultQuestions(expandedId, !!expandedId);

	const createMutation = useCreateDefaultQuestion();
	const updateMutation = useUpdateDefaultQuestion();
	const deleteMutation = useDeleteDefaultQuestion();

	async function handleSave(techId: string, data: Omit<DefaultQuestion, 'id'>) {
		try {
			if (modal?.editing) {
				await updateMutation.mutateAsync({
					id: modal.editing.id,
					payload: data,
				});
			} else {
				await createMutation.mutateAsync({
					technicianId: techId,
					payload: data,
				});
			}
			setModal(null);
		} catch {
			throw new Error('Erro ao salvar');
		}
	}

	async function handleDelete(questionId: string) {
		if (!confirm('Excluir esta pergunta?')) return;
		try {
			await deleteMutation.mutateAsync(questionId);
			toast.success('Pergunta excluída!');
		} catch {
			toast.error('Erro ao excluir');
		}
	}

	if (techniciansLoading) {
		return (
			<div className="flex justify-center py-16">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold text-slate-900 dark:text-white">
					Perguntas Padrão
				</h2>
				<p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
					Perguntas de qualificação que aparecem antes do atendimento
				</p>
			</div>

			<div className="space-y-3">
				{technicians.map((tech) => {
					const isExpanded = expandedId === tech.id;
					const displayQuestions = isExpanded
						? questions
						: (tech.defaultQuestions ?? []);
					const sortedQuestions = [...displayQuestions].sort(
						(a, b) => a.order - b.order,
					);
					return (
						<div
							key={tech.id}
							className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden"
						>
							<button
								type="button"
								onClick={() => setExpandedId(isExpanded ? null : tech.id)}
								className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
							>
								{isExpanded ? (
									<ChevronDown className="w-5 h-5 text-slate-500 dark:text-gray-400 shrink-0" />
								) : (
									<ChevronRight className="w-5 h-5 text-slate-500 dark:text-gray-400 shrink-0" />
								)}
								<div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
									<HelpCircle className="w-5 h-5 text-violet-500" />
								</div>
								<div className="flex-1 text-left">
									<p className="font-semibold text-slate-900 dark:text-white">
										{tech.name}
									</p>
									<p className="text-sm text-slate-500 dark:text-gray-400">
										{sortedQuestions.length} pergunta
										{sortedQuestions.length !== 1 ? 's' : ''} de qualificação
									</p>
								</div>
							</button>
							{isExpanded && (
								<div className="px-4 pb-4 pt-0 border-t border-slate-200 dark:border-gray-700">
									{questionsLoading ? (
										<div className="flex justify-center py-8">
											<Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
										</div>
									) : (
										<>
											<div className="mt-3 space-y-2">
												{sortedQuestions.map((q) => (
													<div
														key={q.id}
														className="flex items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-white/5 rounded-lg"
													>
														<div>
															<p className="text-sm font-medium text-slate-900 dark:text-white">
																{q.text}
															</p>
															<p className="text-xs text-slate-500 dark:text-gray-400">
																{q.type}
																{q.options?.length
																	? ` · ${q.options.join(', ')}`
																	: ''}
															</p>
														</div>
														<div className="flex gap-1">
															<button
																type="button"
																onClick={() =>
																	setModal({
																		open: true,
																		technicianId: tech.id,
																		editing: q,
																	})
																}
																className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors"
																aria-label="Editar"
															>
																<Edit className="w-4 h-4 text-slate-500 dark:text-gray-400" />
															</button>
															<button
																type="button"
																onClick={() => void handleDelete(q.id)}
																className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
																aria-label="Excluir"
															>
																<Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
															</button>
														</div>
													</div>
												))}
											</div>
											<button
												type="button"
												onClick={() =>
													setModal({
														open: true,
														technicianId: tech.id,
														editing: null,
													})
												}
												className="mt-3 flex items-center gap-2 px-4 py-2 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-lg transition-colors text-sm font-medium"
											>
												<Plus className="w-4 h-4" />
												Adicionar pergunta
											</button>
										</>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>

			{modal?.open && (
				<QuestionModal
					editing={modal.editing}
					technicianId={modal.technicianId}
					onClose={() => setModal(null)}
					onSave={handleSave}
				/>
			)}
		</div>
	);
}
