'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	type CardSuggestion,
	suggestCard,
} from '@/modules/tools/services/tool-bank.service';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { primaryBtn } from './ui';

/** Pontos de partida — um clique já preenche a caixa. */
const IDEIAS = [
	'Capinha com o nome da pessoa entre flores em aquarela',
	'Caneca de Dia dos Pais com frase engraçada',
	'Retrato do pet em estilo cartoon a partir da foto',
	'Chaveiro com signo e constelação',
	'Quadro de versículo bíblico com folhagens',
];

/**
 * "CRIAR COM IA" — o admin descreve o card como falaria com um cliente; a IA
 * devolve título, categoria, descrição, a instrução com `{tema}` e os
 * formatos. O formulário abaixo só recebe: nada é salvo daqui.
 */
export function IdeaBox({
	formats,
	categories,
	compact,
	onSuggest,
}: {
	formats: { id: string; label: string }[];
	categories: string[];
	/** Card já existe: a caixa vira uma linha, para refazer se quiser. */
	compact?: boolean;
	onSuggest: (s: CardSuggestion) => void;
}) {
	const [idea, setIdea] = useState('');
	const [busy, setBusy] = useState(false);

	const run = async (text = idea) => {
		const q = text.trim();
		if (q.length < 3) return;
		setBusy(true);
		try {
			onSuggest(await suggestCard({ idea: q, formats, categories }));
			toast.success('Pronto! Confira, teste e salve.');
		} catch (err) {
			toast.error(
				getApiErrorMessage(err, 'A IA não conseguiu agora. Tente de novo.'),
			);
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.07] to-transparent p-4">
			{!compact && (
				<p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-100">
					<Sparkles className="h-4 w-4 text-emerald-300" />
					Conte a ideia do card. A IA preenche o resto.
				</p>
			)}
			<form
				className="flex flex-col gap-2 sm:flex-row"
				onSubmit={(e) => {
					e.preventDefault();
					run();
				}}
			>
				<textarea
					value={idea}
					onChange={(e) => setIdea(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							run();
						}
					}}
					rows={compact ? 1 : 2}
					placeholder={
						compact
							? 'Quer refazer? Descreva de novo e a IA reescreve…'
							: 'Ex.: capinha com o nome da pessoa entre flores em aquarela'
					}
					className="min-h-11 flex-1 resize-none rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/30"
					aria-label="Ideia do card"
				/>
				<button
					type="submit"
					className={`${primaryBtn} sm:self-stretch`}
					disabled={busy || idea.trim().length < 3}
				>
					{busy ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Sparkles className="h-4 w-4" />
					)}
					{busy ? 'Criando…' : compact ? 'Refazer com IA' : 'Criar com IA'}
				</button>
			</form>
			{!compact && (
				<div className="mt-3 flex flex-wrap gap-1.5">
					{IDEIAS.map((i) => (
						<button
							key={i}
							type="button"
							disabled={busy}
							onClick={() => {
								setIdea(i);
								run(i);
							}}
							className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[12px] text-slate-300 hover:border-emerald-400/40 hover:text-white disabled:opacity-50"
						>
							{i}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
