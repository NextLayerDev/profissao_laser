'use client';

import { ImagePlus, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PLFAQ } from '@/types/faq';

interface FAQModalProps {
	editing: PLFAQ | null;
	nextOrder: number;
	onClose: () => void;
	onSave: (data: {
		question: string;
		answer: string;
		order: number;
		file?: File;
	}) => Promise<void>;
}

export function FAQModal({
	editing,
	nextOrder,
	onClose,
	onSave,
}: FAQModalProps) {
	const [question, setQuestion] = useState(editing?.question ?? '');
	const [answer, setAnswer] = useState(editing?.answer ?? '');
	const [order, setOrder] = useState(editing?.order ?? nextOrder);
	const [file, setFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(
		editing?.imageUrl ?? null,
	);
	const [saving, setSaving] = useState(false);

	// Cleanup blob URL on unmount or when file changes
	useEffect(() => {
		return () => {
			if (file && imagePreview?.startsWith('blob:')) {
				URL.revokeObjectURL(imagePreview);
			}
		};
	}, [file, imagePreview]);

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const selected = e.target.files?.[0];
		if (!selected) return;

		// Revoke old blob URL
		if (imagePreview?.startsWith('blob:')) {
			URL.revokeObjectURL(imagePreview);
		}

		setFile(selected);
		setImagePreview(URL.createObjectURL(selected));
	}

	function removeImage() {
		if (imagePreview?.startsWith('blob:')) {
			URL.revokeObjectURL(imagePreview);
		}
		setFile(null);
		setImagePreview(null);
	}

	async function handleSave() {
		if (!question.trim()) return;
		if (!answer.trim()) return;

		setSaving(true);
		try {
			await onSave({
				question: question.trim(),
				answer: answer.trim(),
				order,
				file: file ?? undefined,
			});
			onClose();
		} catch {
			// erro tratado pelo pai
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-700">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						{editing ? 'Editar FAQ' : 'Nova FAQ'}
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
					>
						<X className="w-4 h-4 text-slate-500 dark:text-gray-400" />
					</button>
				</div>

				{/* Body */}
				<div className="p-5 space-y-4">
					{/* Pergunta */}
					<div>
						<label
							htmlFor="faq-question"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
						>
							Pergunta
						</label>
						<input
							id="faq-question"
							type="text"
							value={question}
							onChange={(e) => setQuestion(e.target.value)}
							placeholder="Ex: Como configurar potência?"
							className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
						/>
					</div>

					{/* Resposta */}
					<div>
						<label
							htmlFor="faq-answer"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
						>
							Resposta
						</label>
						<textarea
							id="faq-answer"
							value={answer}
							onChange={(e) => setAnswer(e.target.value)}
							rows={5}
							placeholder="Escreva a resposta..."
							className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none resize-none"
						/>
					</div>

					{/* Upload de imagem */}
					<div>
						<label
							htmlFor="faq-image"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
						>
							Imagem (opcional)
						</label>
						{imagePreview ? (
							<div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-gray-700">
								<img
									src={imagePreview}
									alt="Preview"
									className="w-full h-40 object-cover"
								/>
								<button
									type="button"
									onClick={removeImage}
									className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
								>
									<X className="w-4 h-4 text-white" />
								</button>
							</div>
						) : (
							<label
								htmlFor="faq-image"
								className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-violet-500 transition-colors"
							>
								<ImagePlus className="w-6 h-6 text-slate-400 dark:text-gray-500" />
								<span className="text-sm text-slate-500 dark:text-gray-400">
									Clique para selecionar imagem
								</span>
								<input
									id="faq-image"
									type="file"
									accept="image/*"
									onChange={handleFileChange}
									className="hidden"
								/>
							</label>
						)}
					</div>

					{/* Ordem */}
					<div>
						<label
							htmlFor="faq-order"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block"
						>
							Ordem
						</label>
						<input
							id="faq-order"
							type="number"
							value={order}
							onChange={(e) => setOrder(Number(e.target.value))}
							min={0}
							className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
						/>
					</div>
				</div>

				{/* Footer */}
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
						disabled={saving || !question.trim() || !answer.trim()}
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
