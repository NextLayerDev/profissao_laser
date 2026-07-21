'use client';

import { Bot, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import type { KbHealth } from '@/types/ai-knowledge';
import { formatWhen, pontosCegosOf, statusOf } from './derive';
import { NO_EDIT_HINT } from './permission-hints';

/**
 * Barra do agente — SLIM de propósito.
 *
 * Antes o topo comia ~570px (card grande + composição + pendências) e empurrava
 * as abas pro pé da tela, que é onde o trabalho de verdade acontece. Tudo que
 * era leitura de estado desceu pro painel de desempenho, na coluna da direita;
 * aqui fica só a identidade do agente, se dá pra contar com ele agora, e a ação
 * principal.
 */
export function ConhecimentoHeader({
	health,
	canEdit,
	onTeach,
}: {
	health?: KbHealth;
	canEdit: boolean;
	onTeach: () => void;
}) {
	const pontosCegos = useMemo(() => pontosCegosOf(health), [health]);
	const status = statusOf(health, pontosCegos);
	const alive = health?.embeddings_available ?? false;
	const total = health?.sources_total ?? 0;

	return (
		<div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-gray-800/50 bg-linear-to-br from-violet-100 to-white dark:from-violet-600/25 dark:to-[#1a1a1d] px-4 py-3 md:px-5">
			<Bot
				className="absolute -bottom-4 -right-2 w-24 h-24 text-violet-400 opacity-10 pointer-events-none"
				aria-hidden="true"
			/>

			<div className="relative flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3 min-w-0">
					<div className="relative shrink-0">
						<div className="w-11 h-11 rounded-xl bg-linear-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-md shadow-violet-500/25">
							<Bot className="w-6 h-6" />
						</div>
						{/* Pulsa em verde enquanto entende por significado; âmbar parado
						    quando cai pra palavra-chave. */}
						<span
							aria-hidden
							className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#1a1a1d] ${
								alive ? 'bg-emerald-500 kb-respiro' : 'bg-amber-500'
							}`}
						/>
					</div>

					<div className="min-w-0">
						<h2 className="font-display text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
							Cérebro da IA
							<Sparkles className="w-3.5 h-3.5 text-violet-500" />
						</h2>
						<p className="text-xs text-slate-600 dark:text-gray-400 truncate">
							{status} · {total.toLocaleString('pt-BR')}{' '}
							{total === 1 ? 'conhecimento' : 'conhecimentos'} · leu{' '}
							{formatWhen(health?.last_synced_at)}
						</p>
					</div>
				</div>

				<button
					type="button"
					onClick={onTeach}
					disabled={!canEdit}
					title={canEdit ? undefined : NO_EDIT_HINT}
					className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-violet-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none shrink-0"
				>
					<Sparkles className="w-4 h-4" />
					Ensinar sobre a plataforma
				</button>
			</div>
		</div>
	);
}
