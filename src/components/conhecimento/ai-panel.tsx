'use client';

import {
	ArrowRight,
	Brain,
	MessageSquare,
	TrendingUp,
	Zap,
} from 'lucide-react';
import { useMemo } from 'react';
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { useKbStats } from '@/hooks/use-ai-knowledge';
import {
	type KbHealth,
	type KbSourceKind,
	KIND_LABELS,
} from '@/types/ai-knowledge';
import { pontosCegosOf } from './derive';
import { NO_EDIT_HINT } from './permission-hints';

/**
 * Painel de desempenho da IA — a coluna da direita da aba Conhecimentos.
 *
 * As duas séries vêm de lugares diferentes de propósito: atendimento sai do log
 * de perguntas (só enche quando aluno usa o chat) e aprendizado sai das
 * varreduras. Quando o chat ainda não rodou, o gráfico de atendimento mostra
 * isso por escrito em vez de desenhar uma linha reta no zero fingindo dado.
 */

/** Barras na mesma ordem de cor do Painel, pra a tela parecer da mesma casa. */
const BAR_COLORS = [
	'bg-blue-600',
	'bg-yellow-400',
	'bg-green-400',
	'bg-orange-400',
	'bg-red-400',
	'bg-slate-400',
];

const NAMED = 5;

interface Row {
	key: string;
	kind: KbSourceKind | null;
	label: string;
	sources: number;
	pct: number;
	tail?: string;
}

interface Ordem {
	id: string;
	texto: string;
	acao: string;
	onAcao: () => void;
}

/** Composição por `sources` — o que de fato varia (de 466 a 2). */
function buildRows(health?: KbHealth): Row[] {
	const raw = (health?.by_kind ?? []).filter((r) => r.sources > 0);
	if (raw.length === 0) return [];
	const total = raw.reduce((a, r) => a + r.sources, 0);
	if (total === 0) return [];

	const sorted = [...raw].sort((a, b) => b.sources - a.sources);
	const head = sorted.slice(0, NAMED);
	const tail = sorted.slice(NAMED);

	const rows: Row[] = head.map((r) => ({
		key: r.kind,
		kind: r.kind as KbSourceKind,
		label: KIND_LABELS[r.kind as KbSourceKind] ?? r.kind,
		sources: r.sources,
		pct: (r.sources / total) * 100,
	}));

	if (tail.length > 0) {
		const tailSources = tail.reduce((a, r) => a + r.sources, 0);
		rows.push({
			key: '__outras__',
			kind: null,
			label: 'Outras origens',
			sources: tailSources,
			pct: (tailSources / total) * 100,
			tail: tail
				.map(
					(r) =>
						`${KIND_LABELS[r.kind as KbSourceKind] ?? r.kind}: ${r.sources}`,
				)
				.join(' · '),
		});
	}
	return rows;
}

const AXIS = '#6b7280';
const GRID = '#ffffff0d';

function diaCurto(iso: string): string {
	const [, m, d] = iso.split('-');
	return `${d}/${m}`;
}

function StatTile({
	icon: Icon,
	value,
	label,
	tone = 'violet',
}: {
	icon: typeof Brain;
	value: string | number;
	label: string;
	tone?: 'violet' | 'emerald' | 'amber' | 'sky';
}) {
	const tones = {
		violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
		emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
		amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
		sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
	};
	return (
		<div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-gray-800/50 bg-white dark:bg-[#1a1a1d]">
			<div
				className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tones[tone]}`}
			>
				<Icon className="w-4.5 h-4.5" />
			</div>
			<div className="min-w-0">
				<p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums leading-tight">
					{value}
				</p>
				<p className="text-xs text-slate-500 dark:text-gray-500 truncate">
					{label}
				</p>
			</div>
		</div>
	);
}

function ChartCard({
	title,
	subtitle,
	children,
}: {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-2xl border border-slate-200 dark:border-gray-800/50 bg-white dark:bg-[#1a1a1d] p-4">
			<div className="mb-3">
				<h4 className="text-sm font-semibold text-slate-900 dark:text-white">
					{title}
				</h4>
				{subtitle && (
					<p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">
						{subtitle}
					</p>
				)}
			</div>
			{children}
		</div>
	);
}

export function AiPanel({
	health,
	canEdit,
	onTeach,
	onTeachScopes,
	onFilterKind,
	onFilterStatus,
}: {
	health?: KbHealth;
	canEdit: boolean;
	onTeach: () => void;
	onTeachScopes?: (scopes: KbSourceKind[]) => void;
	onFilterKind?: (kind: KbSourceKind) => void;
	onFilterStatus?: (status: 'error') => void;
}) {
	const { data: stats, isLoading } = useKbStats(14);
	const rows = useMemo(() => buildRows(health), [health]);
	const pontosCegos = useMemo(() => pontosCegosOf(health), [health]);

	const ordens: Ordem[] = [];
	if (health && health.chunks_no_embedding > 0) {
		ordens.push({
			id: 'sem-busca',
			texto: `${health.chunks_no_embedding} ${health.chunks_no_embedding === 1 ? 'trecho ficou' : 'trechos ficaram'} fora da busca inteligente.`,
			acao: 'Ler de novo',
			onAcao: onTeach,
		});
	}
	if (health && health.sources_error > 0) {
		ordens.push({
			id: 'erro',
			texto: `${health.sources_error} ${health.sources_error === 1 ? 'conhecimento falhou' : 'conhecimentos falharam'} quando ele leu.`,
			acao: 'Ver quais',
			onAcao: () => onFilterStatus?.('error'),
		});
	}
	if (health && health.chunks_stale_model > 0) {
		ordens.push({
			id: 'modelo-antigo',
			texto: `${health.chunks_stale_model} ${health.chunks_stale_model === 1 ? 'trecho foi aprendido' : 'trechos foram aprendidos'} com um modelo antigo.`,
			acao: 'Reaprender',
			onAcao: onTeach,
		});
	}
	if (pontosCegos.length > 0 && onTeachScopes) {
		ordens.push({
			id: 'pontos-cegos',
			texto: `Ele nunca leu: ${pontosCegos.map((k) => KIND_LABELS[k]).join(', ')}.`,
			acao: 'Ensinar isso',
			onAcao: () => onTeachScopes(pontosCegos),
		});
	}

	const semPerguntas = !stats || stats.totais.perguntas === 0;
	const crescimento = stats?.growth ?? [];

	return (
		<div className="space-y-4">
			<h3 className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">
				Desempenho da IA
			</h3>

			{/* Pendências primeiro: é a única coisa aqui que pede ação. */}
			{ordens.length > 0 && (
				<div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4">
					<h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2.5">
						Precisa de você
					</h4>
					<ul className="space-y-2">
						{ordens.map((o) => (
							<li
								key={o.id}
								className="flex flex-wrap items-center justify-between gap-2"
							>
								<p className="text-xs text-amber-800 dark:text-amber-200/90 min-w-0">
									{o.texto}
								</p>
								<button
									type="button"
									onClick={o.onAcao}
									disabled={!canEdit && o.id !== 'erro'}
									title={!canEdit && o.id !== 'erro' ? NO_EDIT_HINT : undefined}
									className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/70 dark:bg-white/10 text-amber-900 dark:text-amber-100 text-xs font-semibold hover:bg-white dark:hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
								>
									{o.acao}
									<ArrowRight className="w-3 h-3" />
								</button>
							</li>
						))}
					</ul>
				</div>
			)}

			{/* O que ele já estudou — clicar filtra a lista da esquerda. */}
			{rows.length > 0 && (
				<div className="rounded-2xl border border-slate-200 dark:border-gray-800/50 bg-white dark:bg-[#1a1a1d] p-4">
					<h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
						O que ele já estudou
					</h4>
					<div className="space-y-2.5">
						{rows.map((r, idx) => (
							<button
								key={r.key}
								type="button"
								onClick={() => r.kind && onFilterKind?.(r.kind)}
								disabled={!r.kind}
								title={r.tail}
								className="w-full text-left group disabled:cursor-default rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
							>
								<div className="flex items-center justify-between mb-1 gap-2">
									<span className="text-xs text-slate-700 dark:text-gray-300 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
										{r.label}
									</span>
									<div className="text-right shrink-0 flex items-center gap-1.5">
										<span className="text-xs font-semibold text-slate-900 dark:text-white tabular-nums">
											{r.sources}
										</span>
										<span className="text-[11px] text-slate-400 dark:text-gray-600 tabular-nums">
											{r.pct.toFixed(0)}%
										</span>
									</div>
								</div>
								<div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
									<div
										className={`h-full ${BAR_COLORS[idx] ?? 'bg-slate-400'} rounded-full transition-all duration-500`}
										style={{ width: `${Math.max(r.pct, 1.5)}%` }}
									/>
								</div>
							</button>
						))}
					</div>
				</div>
			)}

			{/* Números do atendimento */}
			<div className="grid grid-cols-2 gap-3">
				<StatTile
					icon={MessageSquare}
					value={stats?.totais.perguntas ?? 0}
					label="Perguntas (14 dias)"
					tone="violet"
				/>
				<StatTile
					icon={Brain}
					value={
						stats?.totais.usoDaBasePct === null ||
						stats?.totais.usoDaBasePct === undefined
							? '—'
							: `${stats.totais.usoDaBasePct}%`
					}
					label="Respondeu com a base"
					tone="emerald"
				/>
				<StatTile
					icon={Zap}
					value={
						stats?.totais.latenciaMediaMs == null
							? '—'
							: `${stats.totais.latenciaMediaMs} ms`
					}
					label="Tempo médio de busca"
					tone="sky"
				/>
				<StatTile
					icon={TrendingUp}
					value={health?.chunks_total ?? 0}
					label="Trechos na memória"
					tone="amber"
				/>
			</div>

			{/* Atendimento ao longo do tempo */}
			<ChartCard
				title="Perguntas por dia"
				subtitle="Quantas o aluno fez e em quantas ele achou algo na base"
			>
				{isLoading ? (
					<div className="h-44 flex items-center justify-center text-sm text-slate-500 dark:text-gray-500 animate-pulse">
						Carregando...
					</div>
				) : semPerguntas ? (
					<div className="h-44 flex flex-col items-center justify-center text-center px-4">
						<MessageSquare className="w-7 h-7 text-slate-300 dark:text-gray-700 mb-2" />
						<p className="text-sm text-slate-600 dark:text-gray-400">
							Ninguém perguntou nada ainda.
						</p>
						<p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
							Assim que os alunos usarem o chat ao vivo, o movimento aparece
							aqui.
						</p>
					</div>
				) : (
					<ResponsiveContainer width="100%" height={176}>
						<LineChart
							data={stats.questions}
							margin={{ top: 5, right: 8, left: -18, bottom: 0 }}
						>
							<CartesianGrid strokeDasharray="3 3" stroke={GRID} />
							<XAxis
								dataKey="dia"
								tickFormatter={diaCurto}
								stroke={AXIS}
								tick={{ fill: AXIS, fontSize: 11 }}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								allowDecimals={false}
								stroke={AXIS}
								tick={{ fill: AXIS, fontSize: 11 }}
								tickLine={false}
								axisLine={false}
							/>
							<Tooltip
								contentStyle={{
									background: '#1a1a1d',
									border: '1px solid rgba(255,255,255,0.1)',
									borderRadius: 12,
									fontSize: 12,
								}}
								labelFormatter={(v) => diaCurto(String(v))}
							/>
							<Line
								type="monotone"
								dataKey="perguntas"
								name="Perguntas"
								stroke="#8b5cf6"
								strokeWidth={2}
								dot={false}
							/>
							<Line
								type="monotone"
								dataKey="comBase"
								name="Achou na base"
								stroke="#10b981"
								strokeWidth={2}
								dot={false}
							/>
						</LineChart>
					</ResponsiveContainer>
				)}
			</ChartCard>

			{/* Aprendizado acumulado */}
			<ChartCard
				title="O que ele já aprendeu"
				subtitle="Total de conhecimentos depois de cada varredura"
			>
				{crescimento.length === 0 ? (
					<div className="h-40 flex items-center justify-center text-sm text-slate-500 dark:text-gray-500">
						Nenhuma varredura concluída ainda.
					</div>
				) : (
					<ResponsiveContainer width="100%" height={160}>
						<LineChart
							data={crescimento}
							margin={{ top: 5, right: 8, left: -18, bottom: 0 }}
						>
							<CartesianGrid strokeDasharray="3 3" stroke={GRID} />
							<XAxis
								dataKey="em"
								tickFormatter={(v) =>
									new Date(String(v)).toLocaleDateString('pt-BR', {
										day: '2-digit',
										month: '2-digit',
									})
								}
								stroke={AXIS}
								tick={{ fill: AXIS, fontSize: 11 }}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								allowDecimals={false}
								stroke={AXIS}
								tick={{ fill: AXIS, fontSize: 11 }}
								tickLine={false}
								axisLine={false}
							/>
							<Tooltip
								contentStyle={{
									background: '#1a1a1d',
									border: '1px solid rgba(255,255,255,0.1)',
									borderRadius: 12,
									fontSize: 12,
								}}
								labelFormatter={(v) =>
									new Date(String(v)).toLocaleString('pt-BR')
								}
							/>
							<Line
								type="monotone"
								dataKey="total"
								name="Conhecimentos"
								stroke="#8b5cf6"
								strokeWidth={2}
								dot={{ r: 3, fill: '#8b5cf6' }}
							/>
						</LineChart>
					</ResponsiveContainer>
				)}
			</ChartCard>
		</div>
	);
}
