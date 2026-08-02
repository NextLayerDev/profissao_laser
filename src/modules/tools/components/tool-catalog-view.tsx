'use client';

import {
	AlertTriangle,
	Check,
	ChevronLeft,
	ChevronRight,
	Loader2,
	Search,
	SlidersHorizontal,
	ThumbsDown,
	ThumbsUp,
	X,
} from 'lucide-react';
import { useState } from 'react';
import { useCollection } from '../hooks/use-collection';
import type { CollectionEntry, Facet } from '../services/collections.service';

/**
 * Layout `catalog` — navegação de um dataset da Fábrica.
 *
 * É GENÉRICO: facetas, cards e detalhe saem todos da `definition`. Serve o
 * Metallic hoje e qualquer coleção futura (materiais, velocidades de corte,
 * biblioteca de estilos) sem uma linha nova.
 */

export interface CatalogSpec {
	/** Nome da coleção na definition. */
	source?: string;
	/** De onde sai cada peça do card: `{ title:'title', badge:'data.material' }`. */
	card?: Record<string, string>;
	/** Seções do painel de detalhe. */
	detail?: {
		sections?: { label: string; fields: string[] }[];
	};
	/** Rótulo humano de valores crus (`aco_carbono` → `Aço carbono`). */
	labels?: Record<string, string>;
}

interface Props {
	toolKey: string;
	spec: CatalogSpec;
	isStaff: boolean;
	title?: string;
	subtitle?: string;
}

/* ─────────────────────────── helpers ─────────────────────────── */

/** Resolve um path do card (`title`, `data.material`) num registro. */
function pick(entry: CollectionEntry, path?: string): unknown {
	if (!path) return undefined;
	if (path.startsWith('data.')) return entry.data?.[path.slice(5)];
	return (entry as unknown as Record<string, unknown>)[path];
}

/** `aco_carbono` → `Aço carbono` quando não há rótulo declarado. */
function humanize(v: unknown, labels?: Record<string, string>): string {
	const s = String(v ?? '');
	if (!s) return '';
	if (labels?.[s]) return labels[s];
	const spaced = s.replace(/_/g, ' ');
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Cor da confiança. Verde só acima de 0,75 — abaixo disso a base ainda não
 * sustenta a receita, e mostrar tudo verde treinaria o usuário a ignorar o
 * indicador, que é justamente o que ele não pode fazer aqui.
 */
function scoreTone(score: number | null | undefined) {
	if (score === null || score === undefined) {
		return {
			label: 'sem relato',
			cls: 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400',
		};
	}
	if (score >= 0.75) {
		return {
			label: `${Math.round(score * 100)}% confiável`,
			cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
		};
	}
	if (score >= 0.5) {
		return {
			label: `${Math.round(score * 100)}% confiável`,
			cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
		};
	}
	return {
		label: `${Math.round(score * 100)}% confiável`,
		cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
	};
}

const cardCls =
	'rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#1a1a1d]';
const accent = 'var(--screen-accent, #7c3aed)';

/* ─────────────────────────── facetas ─────────────────────────── */

function FacetPanel({
	facets,
	filters,
	onToggle,
	onRange,
	labels,
}: {
	facets: Facet[];
	filters: ReturnType<typeof useCollection>['filters'];
	onToggle: (field: string, value: string | number) => void;
	onRange: (field: string, min?: number, max?: number) => void;
	labels?: Record<string, string>;
}) {
	return (
		<div className="space-y-5">
			{facets.map((f) => {
				if (f.kind === 'range') {
					const cur = filters[f.name];
					const min = cur?.kind === 'range' ? cur.min : undefined;
					const max = cur?.kind === 'range' ? cur.max : undefined;
					return (
						<fieldset key={f.name}>
							<legend className="pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
								{f.label}
								{f.unit ? ` (${f.unit})` : ''}
							</legend>
							<div className="flex items-center gap-2">
								<input
									type="number"
									inputMode="decimal"
									placeholder="mín"
									value={min ?? ''}
									onChange={(e) =>
										onRange(
											f.name,
											e.target.value === ''
												? undefined
												: Number(e.target.value),
											max,
										)
									}
									className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-right font-mono text-sm tabular-nums outline-none focus-visible:ring-2 dark:border-white/10 dark:bg-[#111]"
								/>
								<span className="text-slate-400">–</span>
								<input
									type="number"
									inputMode="decimal"
									placeholder="máx"
									value={max ?? ''}
									onChange={(e) =>
										onRange(
											f.name,
											min,
											e.target.value === ''
												? undefined
												: Number(e.target.value),
										)
									}
									className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-right font-mono text-sm tabular-nums outline-none focus-visible:ring-2 dark:border-white/10 dark:bg-[#111]"
								/>
							</div>
						</fieldset>
					);
				}

				const cur = filters[f.name];
				return (
					<fieldset key={f.name}>
						<legend className="pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
							{f.label}
						</legend>
						<div className="flex flex-wrap gap-1.5">
							{(f.values ?? []).map((opt) => {
								const value = opt.value as string | number;
								const active =
									cur?.kind === 'eq' && String(cur.value) === String(value);
								// Opção sem nenhum registro fica visível e desabilitada: some
								// significaria "o filtro quebrou"; 0 significa "a base não tem".
								const empty = opt.count === 0;
								return (
									<button
										key={String(value)}
										type="button"
										disabled={empty && !active}
										aria-pressed={active}
										onClick={() => onToggle(f.name, value)}
										className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
											active
												? 'border-transparent text-white'
												: empty
													? 'cursor-not-allowed border-slate-200 text-slate-300 dark:border-white/5 dark:text-slate-600'
													: 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-300'
										}`}
										style={active ? { background: accent } : undefined}
									>
										{humanize(value, labels)}
										<span className="ml-1.5 font-mono tabular-nums opacity-60">
											{opt.count}
										</span>
									</button>
								);
							})}
						</div>
					</fieldset>
				);
			})}
		</div>
	);
}

/* ─────────────────────────── card ─────────────────────────── */

function EntryCard({
	entry,
	spec,
	onOpen,
}: {
	entry: CollectionEntry;
	spec: CatalogSpec;
	onOpen: () => void;
}) {
	const tone = scoreTone(entry.score);
	const badge = pick(entry, spec.card?.badge);
	const metric = pick(entry, spec.card?.metric);
	const subtitle = pick(entry, spec.card?.subtitle);
	const pending = entry.status === 'pending';

	return (
		<button
			type="button"
			onClick={onOpen}
			className={`${cardCls} group flex w-full flex-col gap-3 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--screen-accent,#7c3aed)_45%,transparent)]`}
		>
			<div className="flex items-start justify-between gap-2">
				<h3 className="font-display text-sm font-semibold leading-snug text-slate-900 dark:text-white">
					{entry.title}
				</h3>
				{pending ? (
					<span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
						em análise
					</span>
				) : (
					<span
						className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.cls}`}
					>
						{tone.label}
					</span>
				)}
			</div>

			{badge || subtitle ? (
				<div className="flex flex-wrap items-center gap-1.5">
					{badge ? (
						<span
							className="rounded-md px-2 py-0.5 text-[11px] font-medium"
							style={{
								background: `color-mix(in srgb, ${accent} 14%, transparent)`,
								color: `color-mix(in srgb, ${accent} 82%, black)`,
							}}
						>
							{humanize(badge, spec.labels)}
						</span>
					) : null}
					{subtitle ? (
						<span className="text-[11px] text-slate-500 dark:text-slate-400">
							{humanize(subtitle, spec.labels)}
						</span>
					) : null}
				</div>
			) : null}

			{metric !== undefined && metric !== null ? (
				<p className="font-mono text-lg tabular-nums text-slate-900 dark:text-white">
					{String(metric)}
					{spec.card?.metricUnit ? (
						<span className="ml-1 text-xs text-slate-400">
							{spec.card.metricUnit}
						</span>
					) : null}
				</p>
			) : null}

			{entry.stats?.ok || entry.stats?.falha ? (
				<div className="flex items-center gap-3 font-mono text-[11px] tabular-nums text-slate-400">
					<span className="flex items-center gap-1">
						<ThumbsUp className="h-3 w-3" /> {entry.stats.ok ?? 0}
					</span>
					<span className="flex items-center gap-1">
						<ThumbsDown className="h-3 w-3" /> {entry.stats.falha ?? 0}
					</span>
				</div>
			) : null}
		</button>
	);
}

/* ─────────────────────────── detalhe ─────────────────────────── */

function DetailSheet({
	entry,
	spec,
	isStaff,
	onClose,
	onFeedback,
	onReview,
	busy,
}: {
	entry: CollectionEntry;
	spec: CatalogSpec;
	isStaff: boolean;
	onClose: () => void;
	onFeedback: (outcome: string) => void;
	onReview: (status: 'approved' | 'rejected') => void;
	busy: boolean;
}) {
	const tone = scoreTone(entry.score);
	const myOutcome = entry.my_feedback?.result?.outcome;
	const sections = spec.detail?.sections ?? [
		{ label: 'Dados', fields: Object.keys(entry.data ?? {}) },
	];

	return (
		<aside
			className={`${cardCls} sticky top-6 flex max-h-[calc(100vh-3rem)] flex-col overflow-hidden`}
		>
			<header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 dark:border-white/10">
				<div className="min-w-0">
					<h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
						{entry.title}
					</h2>
					<span
						className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.cls}`}
					>
						{tone.label}
					</span>
				</div>
				<button
					type="button"
					aria-label="Fechar"
					onClick={onClose}
					className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
				>
					<X className="h-4 w-4" />
				</button>
			</header>

			<div className="flex-1 overflow-y-auto p-4">
				{entry.status === 'pending' ? (
					<p className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
						<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
						Esta receita ainda não foi validada pela equipe. Use por sua conta e
						risco e faça um teste antes de cortar a peça final.
					</p>
				) : null}

				{entry.description ? (
					<p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
						{entry.description}
					</p>
				) : null}

				{sections.map((sec) => (
					<section key={sec.label} className="mb-4">
						<h3 className="pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
							{sec.label}
						</h3>
						<dl className="divide-y divide-slate-100 dark:divide-white/5">
							{sec.fields
								.filter(
									(f) => entry.data?.[f] !== undefined && entry.data[f] !== '',
								)
								.map((f) => (
									<div
										key={f}
										className="flex items-baseline justify-between gap-3 py-2"
									>
										<dt className="text-xs text-slate-500">
											{humanize(f, spec.labels)}
										</dt>
										<dd className="font-mono text-sm tabular-nums text-slate-900 dark:text-white">
											{humanize(entry.data[f], spec.labels)}
										</dd>
									</div>
								))}
						</dl>
					</section>
				))}
			</div>

			<footer className="space-y-3 border-t border-slate-200 p-4 dark:border-white/10">
				<div>
					<p className="pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
						Funcionou para você?
					</p>
					<div className="grid grid-cols-3 gap-1.5">
						{(['sucesso', 'parcial', 'falha'] as const).map((o) => {
							const active = myOutcome === o;
							return (
								<button
									key={o}
									type="button"
									disabled={busy}
									onClick={() => onFeedback(o)}
									className={`rounded-xl border px-2 py-2 text-xs font-medium capitalize transition-colors disabled:opacity-50 ${
										active
											? 'border-transparent text-white'
											: 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-300'
									}`}
									style={active ? { background: accent } : undefined}
								>
									{o}
								</button>
							);
						})}
					</div>
					{/* O relato é o que faz a confiança da base subir — vale explicar. */}
					<p className="pt-2 text-[11px] leading-snug text-slate-400">
						Seu relato ajusta a confiança desta receita para todo mundo.
					</p>
				</div>

				{isStaff && entry.status === 'pending' ? (
					<div className="flex gap-1.5 border-t border-slate-200 pt-3 dark:border-white/10">
						<button
							type="button"
							disabled={busy}
							onClick={() => onReview('approved')}
							className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
						>
							<Check className="h-3.5 w-3.5" /> Aprovar
						</button>
						<button
							type="button"
							disabled={busy}
							onClick={() => onReview('rejected')}
							className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-600 disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-400"
						>
							<X className="h-3.5 w-3.5" /> Rejeitar
						</button>
					</div>
				) : null}
			</footer>
		</aside>
	);
}

/* ─────────────────────────── tela ─────────────────────────── */

export function ToolCatalogView({
	toolKey,
	spec,
	isStaff,
	title,
	subtitle,
}: Props) {
	const collection = spec.source ?? 'default';
	const c = useCollection(toolKey, collection);
	const [openId, setOpenId] = useState<string | null>(null);
	const [showFilters, setShowFilters] = useState(false);

	const items = c.list.data?.items ?? [];
	const open = items.find((e) => e.id === openId) ?? null;
	const facets = c.facets.data?.facets ?? [];
	const sortOptions = c.facets.data?.sort ?? [];
	const loading = c.list.isLoading;
	const refetching = c.list.isFetching && !loading;

	return (
		<div className="space-y-5">
			{title ? (
				<header>
					<h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
						{title}
					</h1>
					{subtitle ? (
						<p className="pt-1 text-sm text-slate-500 dark:text-slate-400">
							{subtitle}
						</p>
					) : null}
				</header>
			) : null}

			{/* Busca + ordenação + contador */}
			<div className="flex flex-wrap items-center gap-2">
				<div className="relative min-w-[220px] flex-1">
					<Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<input
						type="search"
						value={c.q}
						onChange={(e) => c.setQ(e.target.value)}
						placeholder="Buscar…"
						className="h-11 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus-visible:ring-2 dark:border-white/10 dark:bg-[#1a1a1d]"
					/>
				</div>

				<button
					type="button"
					onClick={() => setShowFilters((v) => !v)}
					aria-expanded={showFilters}
					className="flex h-11 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-medium text-slate-600 lg:hidden dark:border-white/10 dark:text-slate-300"
				>
					<SlidersHorizontal className="h-4 w-4" />
					Filtros
					{c.activeCount ? (
						<span
							className="rounded-full px-1.5 text-[11px] font-semibold text-white"
							style={{ background: accent }}
						>
							{c.activeCount}
						</span>
					) : null}
				</button>

				{sortOptions.length ? (
					<select
						value={c.sort}
						onChange={(e) => c.setSort(e.target.value)}
						aria-label="Ordenar"
						className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm dark:border-white/10 dark:bg-[#1a1a1d]"
					>
						{sortOptions.map((s) => (
							<option key={s.value} value={s.value}>
								{s.label}
							</option>
						))}
					</select>
				) : null}
			</div>

			<div className="grid gap-5 lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr_320px]">
				{/* Facetas */}
				<div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
					<div className={`${cardCls} p-4`}>
						<div className="flex items-center justify-between pb-4">
							<span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
								Filtros
							</span>
							{c.activeCount ? (
								<button
									type="button"
									onClick={c.clearFilters}
									className="text-[11px] font-medium text-slate-400 hover:text-slate-600"
								>
									limpar
								</button>
							) : null}
						</div>
						{c.facets.isLoading ? (
							<div className="space-y-3">
								{[0, 1, 2].map((i) => (
									<div
										key={i}
										className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-white/5"
									/>
								))}
							</div>
						) : (
							<FacetPanel
								facets={facets}
								filters={c.filters}
								onToggle={c.toggleFilter}
								onRange={c.setRange}
								labels={spec.labels}
							/>
						)}
					</div>
				</div>

				{/* Grade */}
				<div className="min-w-0">
					<div className="flex items-center justify-between pb-3">
						<p className="font-mono text-xs tabular-nums text-slate-500">
							{c.list.data
								? `${c.list.data.total} registro${c.list.data.total === 1 ? '' : 's'}`
								: '—'}
						</p>
						{refetching ? (
							<span className="flex items-center gap-1.5 text-xs text-slate-400">
								<Loader2 className="h-3 w-3 animate-spin" /> atualizando
							</span>
						) : null}
					</div>

					{loading ? (
						<div className="grid gap-3 sm:grid-cols-2">
							{Array.from({ length: 6 }, (_, i) => (
								<div
									key={i}
									className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5"
								/>
							))}
						</div>
					) : items.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center dark:border-white/10">
							<p className="font-medium text-slate-600 dark:text-slate-300">
								Nenhum registro encontrado
							</p>
							<p className="pt-1 text-sm text-slate-400">
								{c.activeCount
									? 'Tente afrouxar os filtros.'
									: 'A base ainda está vazia.'}
							</p>
							{c.activeCount ? (
								<button
									type="button"
									onClick={c.clearFilters}
									className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white"
									style={{ background: accent }}
								>
									Limpar filtros
								</button>
							) : null}
						</div>
					) : (
						<div
							className={`grid gap-3 transition-opacity sm:grid-cols-2 ${refetching ? 'opacity-60' : ''}`}
						>
							{items.map((e) => (
								<EntryCard
									key={e.id}
									entry={e}
									spec={spec}
									onOpen={() => setOpenId(e.id)}
								/>
							))}
						</div>
					)}

					{(c.list.data?.pages ?? 1) > 1 ? (
						<div className="flex items-center justify-center gap-2 pt-5">
							<button
								type="button"
								disabled={c.page <= 1}
								onClick={() => c.setPage(c.page - 1)}
								aria-label="Página anterior"
								className="rounded-lg border border-slate-200 p-2 disabled:opacity-30 dark:border-white/10"
							>
								<ChevronLeft className="h-4 w-4" />
							</button>
							<span className="font-mono text-xs tabular-nums text-slate-500">
								{c.page} / {c.list.data?.pages}
							</span>
							<button
								type="button"
								disabled={c.page >= (c.list.data?.pages ?? 1)}
								onClick={() => c.setPage(c.page + 1)}
								aria-label="Próxima página"
								className="rounded-lg border border-slate-200 p-2 disabled:opacity-30 dark:border-white/10"
							>
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					) : null}
				</div>

				{/* Detalhe */}
				<div className="hidden xl:block">
					{open ? (
						<DetailSheet
							entry={open}
							spec={spec}
							isStaff={isStaff}
							busy={c.feedback.isPending || c.review.isPending}
							onClose={() => setOpenId(null)}
							onFeedback={(outcome) =>
								c.feedback.mutate({
									id: open.id,
									kind: 'result',
									outcome,
									// Clicar no relato que já está ativo desfaz.
									remove: open.my_feedback?.result?.outcome === outcome,
								})
							}
							onReview={(status) => c.review.mutate({ id: open.id, status })}
						/>
					) : (
						<div
							className={`${cardCls} sticky top-6 p-8 text-center text-sm text-slate-400`}
						>
							Selecione um registro para ver os detalhes.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
