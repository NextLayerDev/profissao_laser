'use client';

import { SmilePlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useReactToFAQ, useRemoveReaction } from '@/hooks/use-faq';
import type { PLFAQ, PLFAQEmoji } from '@/types/faq';

const FAQ_EMOJIS: PLFAQEmoji[] = ['👍', '❤️', '🔥', '💡', '👏'];

export function FAQCard({ faq }: { faq: PLFAQ }) {
	const [showPicker, setShowPicker] = useState(false);
	const pickerRef = useRef<HTMLDivElement>(null);
	const reactMutation = useReactToFAQ();
	const removeMutation = useRemoveReaction();

	// Fechar picker ao clicar fora
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
				setShowPicker(false);
			}
		}
		if (showPicker) {
			document.addEventListener('mousedown', handleClickOutside);
			return () =>
				document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [showPicker]);

	function handleReaction(emoji: PLFAQEmoji) {
		if (faq.userReaction === emoji) {
			removeMutation.mutate(faq.id);
		} else {
			reactMutation.mutate({ faqId: faq.id, emoji });
		}
		setShowPicker(false);
	}

	const totalReactions = faq.reactions.reduce((s, r) => s + r.count, 0);
	const visibleReactions = faq.reactions.filter((r) => r.count > 0);

	return (
		<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden transition-colors hover:border-violet-500/40">
			{/* Imagem */}
			{faq.imageUrl && (
				<div className="overflow-hidden">
					<img
						src={faq.imageUrl}
						alt={faq.question}
						className="w-full object-contain transition-transform hover:scale-105"
					/>
				</div>
			)}

			<div className="p-5 space-y-3">
				{/* Pergunta */}
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					{faq.question}
				</h3>

				{/* Resposta */}
				<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
					{faq.answer}
				</p>

				{/* Barra de reações */}
				<div className="flex flex-wrap items-center gap-2 pt-2">
					{visibleReactions.map((r) => {
						const isUserReaction = faq.userReaction === r.emoji;
						return (
							<button
								key={r.emoji}
								type="button"
								onClick={() => handleReaction(r.emoji)}
								disabled={reactMutation.isPending || removeMutation.isPending}
								className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm border transition-colors disabled:opacity-50 ${
									isUserReaction
										? 'bg-violet-500/20 border-violet-500 text-violet-700 dark:text-violet-300'
										: 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
								}`}
							>
								<span>{r.emoji}</span>
								<span className="font-medium">{r.count}</span>
							</button>
						);
					})}

					{/* Botão adicionar reação */}
					<div className="relative" ref={pickerRef}>
						<button
							type="button"
							onClick={() => setShowPicker((p) => !p)}
							className="flex items-center justify-center w-8 h-8 rounded-full border border-dashed border-slate-300 dark:border-white/20 text-slate-400 dark:text-slate-500 hover:border-violet-500 hover:text-violet-500 transition-colors"
						>
							<SmilePlus className="w-4 h-4" />
						</button>

						{showPicker && (
							<div className="absolute bottom-full left-0 mb-2 flex gap-1 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-700 rounded-xl p-2 shadow-xl z-50">
								{FAQ_EMOJIS.map((emoji) => (
									<button
										key={emoji}
										type="button"
										onClick={() => handleReaction(emoji)}
										className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-lg transition-colors"
									>
										{emoji}
									</button>
								))}
							</div>
						)}
					</div>

					{/* Contagem total */}
					{totalReactions > 0 && (
						<span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
							{totalReactions} {totalReactions === 1 ? 'reação' : 'reações'}
						</span>
					)}
				</div>
			</div>
		</div>
	);
}
