'use client';

import { AlertTriangle, Bot, Loader2, MessageSquare, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';
import { useTestKbRetrieval } from '@/hooks/use-ai-knowledge';
import {
	type KbTestResult,
	MODE_LABELS,
	REASON_LABELS,
} from '@/types/ai-knowledge';
import { KindBadge } from './kind-badge';
import { NO_EDIT_HINT } from './permission-hints';

/** Evita a staff metralhar o botão (cada teste custa uma chamada de IA). */
const COOLDOWN_MS = 2000;

function ScoreBar({ score }: { score: number }) {
	const pct = Math.max(0, Math.min(100, Math.round(score * 100)));
	const cls =
		pct >= 70
			? 'bg-emerald-500'
			: pct >= 45
				? 'bg-amber-500'
				: 'bg-slate-400 dark:bg-white/25';
	return (
		<span
			className="flex items-center gap-2 shrink-0"
			title={`Relevância: ${pct}%`}
		>
			<span className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
				<span
					className={`block h-full rounded-full ${cls}`}
					style={{ width: `${pct}%` }}
				/>
			</span>
			<span className="text-[11px] font-semibold text-slate-500 dark:text-gray-400 tabular-nums">
				{pct}%
			</span>
		</span>
	);
}

function ResultPanel({ result }: { result: KbTestResult }) {
	const degraded = result.reason !== 'ok';

	return (
		<div className="space-y-4">
			{/* Como a IA buscou */}
			<div className="flex flex-wrap items-center gap-2">
				<span
					className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
						result.mode === 'vector'
							? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
							: result.mode === 'keyword'
								? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
								: 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-gray-400'
					}`}
				>
					{MODE_LABELS[result.mode]}
				</span>
				<span className="text-xs text-slate-500 dark:text-gray-400">
					{result.hits.length}{' '}
					{result.hits.length === 1
						? 'trecho encontrado'
						: 'trechos encontrados'}{' '}
					· {result.latencyMs}ms
				</span>
				{result.handoff && (
					<span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
						<MessageSquare className="w-3.5 h-3.5" />A IA passaria para um
						humano
					</span>
				)}
			</div>

			{degraded && (
				<div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
					<AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
					<p className="text-sm text-amber-800 dark:text-amber-200">
						{REASON_LABELS[result.reason]}.
					</p>
				</div>
			)}

			{/* Resposta gerada */}
			{result.reply && (
				<div className="rounded-xl border border-violet-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/10 p-4">
					<div className="flex items-center gap-2 mb-2">
						<Bot className="w-4 h-4 text-violet-600 dark:text-violet-400" />
						<h3 className="text-sm font-semibold text-slate-900 dark:text-white">
							O que a IA responderia
						</h3>
					</div>
					<p className="text-sm text-slate-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
						{result.reply}
					</p>
				</div>
			)}

			{/* Trechos usados */}
			<div>
				<h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2.5">
					De onde ela tirou isso
				</h3>
				{result.hits.length === 0 ? (
					<p className="text-sm text-slate-500 dark:text-gray-400 py-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-white/10">
						A IA não encontrou nada sobre isso na base. Vale escrever esse
						conhecimento à mão na aba Conhecimentos.
					</p>
				) : (
					<div className="space-y-2.5">
						{result.hits.map((hit) => (
							<div
								key={hit.chunkId}
								className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-3.5"
							>
								<div className="flex items-start justify-between gap-3 mb-2">
									<span className="flex flex-wrap items-center gap-2 min-w-0">
										<KindBadge kind={hit.kind} />
										<span className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">
											{hit.title}
										</span>
										{hit.pinned && (
											<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
												Destacado
											</span>
										)}
									</span>
									<ScoreBar score={hit.score} />
								</div>
								<p className="text-sm text-slate-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed line-clamp-6">
									{hit.content}
								</p>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export function PlaygroundTab({ canEdit }: { canEdit: boolean }) {
	const [question, setQuestion] = useState('');
	const [withReply, setWithReply] = useState(true);
	const [result, setResult] = useState<KbTestResult | null>(null);
	const [cooling, setCooling] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const test = useTestKbRetrieval();

	useEffect(
		() => () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		},
		[],
	);

	function run() {
		const q = question.trim();
		if (!q || !canEdit || cooling || test.isPending) return;

		setCooling(true);
		timerRef.current = setTimeout(() => setCooling(false), COOLDOWN_MS);

		test.mutate(
			{ question: q, withReply },
			{
				onSuccess: setResult,
				onError: () => toast.error('Não foi possível testar agora.'),
			},
		);
	}

	const disabled = !canEdit || cooling || test.isPending || !question.trim();

	return (
		<div className="space-y-5 max-w-4xl">
			<div>
				<h2 className="text-lg font-bold text-slate-900 dark:text-white">
					Testar a IA
				</h2>
				<p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
					Faça uma pergunta como um aluno faria e veja o que a IA encontra — sem
					falar com ninguém de verdade.
				</p>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					run();
				}}
				className="space-y-3"
			>
				<div className="flex items-start gap-2">
					<textarea
						value={question}
						onChange={(e) => setQuestion(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault();
								run();
							}
						}}
						rows={2}
						disabled={!canEdit}
						placeholder="Ex.: como faço para cancelar minha assinatura?"
						title={canEdit ? undefined : NO_EDIT_HINT}
						className="flex-1 px-3.5 py-3 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-600 focus:outline-none resize-none disabled:opacity-60"
					/>
					<button
						type="submit"
						disabled={disabled}
						title={canEdit ? undefined : NO_EDIT_HINT}
						className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
					>
						{test.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Send className="w-4 h-4" />
						)}
						Testar
					</button>
				</div>

				<label className="inline-flex items-center gap-2.5 cursor-pointer">
					<input
						type="checkbox"
						checked={withReply}
						onChange={(e) => setWithReply(e.target.checked)}
						disabled={!canEdit}
						className="w-4 h-4 accent-violet-600"
					/>
					<span className="text-sm text-slate-700 dark:text-gray-300">
						Gerar também a resposta da IA
					</span>
				</label>
			</form>

			{test.isPending && !result ? null : result ? (
				<ResultPanel result={result} />
			) : (
				<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d]">
					<EmptyState
						icon={MessageSquare}
						title="Nenhum teste ainda"
						description="Escreva uma pergunta acima para ver o que a IA sabe responder."
					/>
				</div>
			)}
		</div>
	);
}
