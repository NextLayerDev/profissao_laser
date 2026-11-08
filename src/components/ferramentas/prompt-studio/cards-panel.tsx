'use client';

import { Loader2, Plus, Search, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useToolBank } from '@/modules/tools/hooks/use-tool-bank';
import { parseFormats } from '@/modules/tools/lib/creation-template';
import { modeLabel } from '@/modules/tools/lib/prompt-bank';
import type { ToolBankEntry } from '@/modules/tools/services/tool-bank.service';
import type { AiToolDefinition } from '@/modules/tools/services/tool-definitions.service';
import { CardEditor } from './card-editor';
import { chipCls, fieldCls, panelCls, primaryBtn } from './ui';

type Status = 'todos' | 'publicados' | 'rascunhos';

/**
 * CARDS — a vitrine do aluno vista pelo admin: busca, categoria e status no
 * topo, grade de cards embaixo. Abrir um card (ou "Novo card") troca a grade
 * pela ficha; voltar devolve a grade com os filtros como estavam.
 */
export function CardsPanel({ definition }: { definition: AiToolDefinition }) {
	const list = useToolBank(definition.tool_key);
	const [q, setQ] = useState('');
	const [category, setCategory] = useState<string | null>(null);
	const [status, setStatus] = useState<Status>('todos');
	const [editing, setEditing] = useState<ToolBankEntry | 'novo' | null>(null);

	const entries = list.data ?? [];
	const categories = useMemo(
		() =>
			[
				...new Set(
					entries
						.map((e) => e.category?.trim())
						.filter((c): c is string => !!c),
				),
			].sort((a, b) => a.localeCompare(b, 'pt-BR')),
		[entries],
	);
	const formatLabel = useMemo(
		() =>
			new Map(
				(definition.definition.creations ?? []).map((c) => [c.id, c.label]),
			),
		[definition],
	);

	const needle = q.trim().toLowerCase();
	const shown = entries.filter(
		(e) =>
			(!category || e.category?.trim() === category) &&
			(status === 'todos' || (status === 'publicados') === e.active) &&
			(!needle ||
				e.title.toLowerCase().includes(needle) ||
				(e.description ?? '').toLowerCase().includes(needle) ||
				String(e.data?.prompt_script ?? '')
					.toLowerCase()
					.includes(needle)),
	);
	const rascunhos = entries.filter((e) => !e.active).length;

	if (editing) {
		return (
			<CardEditor
				// Remonta ao trocar de card: o formulário nasce do registro.
				key={editing === 'novo' ? 'novo' : editing.id}
				definition={definition}
				entry={editing === 'novo' ? null : editing}
				categories={categories}
				onClose={() => setEditing(null)}
			/>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-2">
				<div className="relative min-w-[220px] flex-1">
					<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
					<input
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Buscar por título, descrição ou texto do prompt…"
						className={`${fieldCls} pl-9`}
						aria-label="Buscar cards"
					/>
				</div>
				<fieldset className="flex gap-1.5" aria-label="Status">
					{(['todos', 'publicados', 'rascunhos'] as const).map((s) => (
						<button
							key={s}
							type="button"
							className={chipCls(status === s)}
							onClick={() => setStatus(s)}
						>
							{s === 'todos'
								? `Todos (${entries.length})`
								: s === 'publicados'
									? 'Publicados'
									: `Rascunhos${rascunhos ? ` (${rascunhos})` : ''}`}
						</button>
					))}
				</fieldset>
				<button
					type="button"
					className={primaryBtn}
					onClick={() => setEditing('novo')}
				>
					<Plus className="h-4 w-4" /> Novo card
				</button>
			</div>

			{categories.length > 0 && (
				<fieldset className="flex flex-wrap gap-1.5" aria-label="Categoria">
					<button
						type="button"
						className={chipCls(category === null)}
						onClick={() => setCategory(null)}
					>
						Todas as categorias
					</button>
					{categories.map((c) => (
						<button
							key={c}
							type="button"
							className={chipCls(category === c)}
							onClick={() => setCategory(category === c ? null : c)}
						>
							{c}
						</button>
					))}
				</fieldset>
			)}

			{list.isLoading ? (
				<div className="flex justify-center py-16">
					<Loader2 className="h-6 w-6 animate-spin text-slate-500" />
				</div>
			) : shown.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-white/10 py-14 text-center text-sm text-slate-500">
					{entries.length === 0
						? 'Nenhum card ainda. Crie o primeiro.'
						: 'Nenhum card com esses filtros.'}
				</div>
			) : (
				<ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{shown.map((e) => {
						const formats = parseFormats(e.data?.formats);
						const cover = e.example_after_url ?? e.example_before_url;
						return (
							<li key={e.id}>
								<button
									type="button"
									onClick={() => setEditing(e)}
									className={`${panelCls} group flex h-full w-full flex-col overflow-hidden text-left transition-colors hover:border-emerald-400/30`}
								>
									<div className="relative aspect-[4/3] w-full bg-black/40">
										{cover ? (
											// <img> intencional: capa vem de CDN dinâmico
											<img
												src={cover}
												alt=""
												className="h-full w-full object-cover"
											/>
										) : (
											<div className="grid h-full place-items-center text-slate-600">
												<Sparkles className="h-7 w-7" />
											</div>
										)}
										<span
											className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
												e.active
													? 'bg-emerald-400/90 text-black'
													: 'bg-black/70 text-amber-200'
											}`}
										>
											{e.active ? 'Publicado' : 'Rascunho'}
										</span>
									</div>
									<div className="flex flex-1 flex-col gap-1 p-3">
										<p className="line-clamp-1 text-sm font-semibold text-slate-100">
											{e.title}
										</p>
										<p className="text-[11px] text-slate-500">
											{[e.category, modeLabel(String(e.data?.mode ?? 'texto'))]
												.filter(Boolean)
												.join(' · ')}
										</p>
										<p className="mt-auto line-clamp-1 pt-1 text-[11px] text-slate-400">
											{formats.length === 0
												? 'Todos os formatos'
												: formats
														.map((f) => formatLabel.get(f) ?? f)
														.join(', ')}
										</p>
									</div>
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
