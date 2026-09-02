'use client';

// Primitivas de dashboard da Mentoria 360°.
//
// Tudo aqui é DOM normal vestido com os tokens do design system
// (@upvox-dev/ui): `bg-surface`, `border-subtle`, `rounded-card`, `text-page`,
// `bg-brand-wash`… Mesmo padrão já adotado em
// `src/app/mentoria-admin/_components/ui.tsx`, e pela mesma razão: o DS é
// React Native + react-native-web, então importar componentes dele arrasta esse
// runtime para dentro de telas densas. Onde o DS TEM o componente (Button,
// Badge, Input, Modal…), usa-se o do DS.
//
// Nenhuma das peças abaixo existe no DS hoje — StatCard, donut de progresso,
// segmented control, linha de lista e card de seção são todos vãos do catálogo.
// Estão listadas em docs/mentoria-360-design-system.md como candidatas a subir
// para a lib; por isso moram em `src/modules/` (compartilhável entre aluno e
// admin) e não dentro de uma rota.
//
// Os tokens resolvem claro e escuro sozinhos — o `.dark` deles mora em
// app/globals.css. Onde sobrar um par `dark:`, há comentário no ponto.

import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

// ── Card de seção ────────────────────────────────────────────────────────────

export function SectionCard({
	title,
	description,
	action,
	children,
	className = '',
	bodyClassName = 'p-5 pt-0',
}: {
	title?: string;
	description?: string;
	/** Canto superior direito: filtro, link "ver todos", contador. */
	action?: ReactNode;
	children: ReactNode;
	className?: string;
	bodyClassName?: string;
}) {
	return (
		<section
			className={`rounded-card border border-subtle bg-surface ${className}`}
		>
			{(title || action) && (
				<div className="flex flex-wrap items-start justify-between gap-3 p-5">
					<div className="min-w-0">
						{title && <h2 className="text-title text-primary">{title}</h2>}
						{description && (
							<p className="text-caption text-muted mt-0.5">{description}</p>
						)}
					</div>
					{action && <div className="shrink-0">{action}</div>}
				</div>
			)}
			<div className={bodyClassName}>{children}</div>
		</section>
	);
}

// ── Stat card (KPI de topo) ──────────────────────────────────────────────────

type StatTone = 'brand' | 'success' | 'warning' | 'danger';

// Fundo do chip vem do DS; a cor do ÍCONE não.
//
// Os `*-wash` são rgba translúcido e funcionam nos dois temas. Já
// `text-success`/`text-danger`/`text-brand` são valores de modo claro e o DS
// não publica versão escura de nenhum — o mesmo token serve de FUNDO no botão
// primário, onde precisa continuar #7c3aed, então não dá para corrigir na
// paleta. Enquanto o DS não tiver tons semânticos de texto para o escuro, o
// par `dark:` fica. É a mesma ressalva do Badge do admin.
const STAT_TONES: Record<StatTone, string> = {
	brand: 'bg-brand-wash text-violet-600 dark:text-violet-400',
	success: 'bg-success-wash text-emerald-600 dark:text-emerald-400',
	warning: 'bg-warning-wash text-amber-600 dark:text-amber-400',
	danger: 'bg-danger-wash text-red-600 dark:text-red-400',
};

export function StatCard({
	label,
	value,
	sub,
	icon: Icon,
	tone = 'brand',
	delta,
	href,
}: {
	label: string;
	value: string;
	sub?: string;
	icon?: LucideIcon;
	tone?: StatTone;
	delta?: DeltaPillProps | null;
	href?: string;
}) {
	const body = (
		<>
			<div className="flex items-start justify-between gap-3">
				<p className="text-caption uppercase tracking-wide text-secondary">
					{label}
				</p>
				{Icon && (
					<div
						className={`w-9 h-9 shrink-0 rounded-control flex items-center justify-center ${STAT_TONES[tone]}`}
					>
						<Icon className="w-4 h-4" />
					</div>
				)}
			</div>
			<p className="text-page text-primary mt-2 tabular-nums">{value}</p>
			{sub && <p className="text-caption text-muted mt-0.5">{sub}</p>}
			{delta && (
				<div className="mt-3">
					<DeltaPill {...delta} />
				</div>
			)}
		</>
	);

	const shell =
		'rounded-card border border-subtle bg-surface p-4 flex flex-col h-full';

	if (!href) return <div className={shell}>{body}</div>;

	return (
		<a
			href={href}
			className={`${shell} transition-colors hover:border-brand-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus`}
		>
			{body}
		</a>
	);
}

type DeltaPillProps = {
	/** Variação já calculada, em pontos percentuais ou %. */
	pct: number;
	/** Texto à direita da pílula. Ex.: "vs mês anterior". */
	caption?: string;
	/**
	 * Se subir é bom. KPIs de custo invertem isso (`direction: 'down_good'`),
	 * então a cor não pode sair só do sinal do número.
	 */
	upIsGood?: boolean;
	/** Sufixo da unidade: "%" para variação relativa, "p.p." para absoluta. */
	unit?: string;
};

export function DeltaPill({
	pct,
	caption,
	upIsGood = true,
	unit = '%',
}: DeltaPillProps) {
	const up = pct >= 0;
	const good = up === upIsGood;
	const Icon = up ? ArrowUpRight : ArrowDownRight;

	return (
		<span className="inline-flex items-center gap-1 text-caption">
			<span
				className={`inline-flex items-center gap-0.5 rounded-chip px-1.5 py-0.5 ${
					good
						? 'bg-success-wash text-emerald-600 dark:text-emerald-400'
						: 'bg-danger-wash text-red-600 dark:text-red-400'
				}`}
			>
				<Icon className="w-3 h-3" aria-hidden />
				<span className="tabular-nums">
					{up ? '+' : ''}
					{formatDelta(pct)}
					{unit}
				</span>
			</span>
			{caption && <span className="text-muted">{caption}</span>}
		</span>
	);
}

function formatDelta(pct: number) {
	return pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

// ── Segmented control ────────────────────────────────────────────────────────

export function SegmentedControl<T extends string>({
	value,
	options,
	onChange,
	label,
}: {
	value: T;
	options: Array<{ value: T; label: string }>;
	onChange: (value: T) => void;
	/** Nome do grupo para leitores de tela. Ex.: "Período". */
	label: string;
}) {
	return (
		<div
			role="toolbar"
			aria-label={label}
			className="inline-flex items-center gap-1 rounded-control bg-surface-sunken p-1"
		>
			{options.map((opt) => {
				const active = opt.value === value;
				return (
					<button
						key={opt.value}
						type="button"
						// `aria-pressed` e nao `role="radio"`: um radiogroup de verdade
						// exige navegacao por setas, e aqui sao tres botoes de alternancia
						// numa toolbar. Botao pressionado descreve isso sem mentir.
						aria-pressed={active}
						onClick={() => onChange(opt.value)}
						className={`px-3 py-1.5 rounded-chip text-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
							active
								? 'bg-brand text-on-brand'
								: 'text-secondary hover:text-primary'
						}`}
					>
						{opt.label}
					</button>
				);
			})}
		</div>
	);
}

// ── Donut de progresso ───────────────────────────────────────────────────────

export function DonutProgress({
	pct,
	caption,
	size = 132,
	thickness = 14,
}: {
	pct: number;
	/** Legenda sob o número. Ex.: "Concluído". */
	caption?: string;
	size?: number;
	thickness?: number;
}) {
	const clamped = Math.max(0, Math.min(100, pct));
	const radius = (size - thickness) / 2;
	const circumference = 2 * Math.PI * radius;
	const center = size / 2;

	return (
		<div
			className="relative inline-flex items-center justify-center"
			style={{ width: size, height: size }}
		>
			<svg width={size} height={size} role="img">
				<title>{`${Math.round(clamped)}% ${caption ?? 'concluído'}`}</title>
				{/* `stroke-subtle` (branco 10% no escuro) contrasta com o card; o
				    sunken sumiria dentro dele no tema escuro. */}
				<circle
					cx={center}
					cy={center}
					r={radius}
					fill="none"
					strokeWidth={thickness}
					className="stroke-subtle"
				/>
				<circle
					cx={center}
					cy={center}
					r={radius}
					fill="none"
					strokeWidth={thickness}
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={circumference * (1 - clamped / 100)}
					// Começa às 12h em vez das 3h.
					transform={`rotate(-90 ${center} ${center})`}
					className="stroke-brand transition-all duration-500"
				/>
			</svg>
			<div
				aria-hidden
				className="absolute inset-0 flex flex-col items-center justify-center"
			>
				<span className="text-section text-primary tabular-nums">
					{Math.round(clamped)}%
				</span>
				{caption && <span className="text-caption text-muted">{caption}</span>}
			</div>
		</div>
	);
}

/** Linha "Encontros … 8/10" do bloco de progresso. */
export function StatLine({
	label,
	value,
}: {
	label: string;
	value: ReactNode;
}) {
	return (
		<div className="flex items-baseline justify-between gap-3">
			<span className="text-body text-secondary">{label}</span>
			<span className="text-label text-primary tabular-nums">{value}</span>
		</div>
	);
}

// ── Linha de lista ───────────────────────────────────────────────────────────

/**
 * Serve "Prioridades Atuais" (índice numerado + badge de prioridade) e
 * "Próximas Ações" (data + badge de status). É a mesma linha, muda o que entra
 * em `leading` e em `trailing`.
 */
export function ListRow({
	leading,
	title,
	description,
	trailing,
	href,
	boxed = false,
}: {
	leading?: ReactNode;
	title: string;
	description?: string;
	trailing?: ReactNode;
	href?: string;
	/** Envolve a linha numa caixa própria, como no bloco de prioridades. */
	boxed?: boolean;
}) {
	const shell = `flex items-center gap-3 ${
		boxed ? 'rounded-control border border-subtle px-4 py-3' : 'py-2.5'
	} ${href ? 'transition-colors hover:border-brand-border hover:bg-surface-sunken' : ''}`;

	const body = (
		<>
			{leading && <div className="shrink-0">{leading}</div>}
			<div className="min-w-0 flex-1">
				<p className="text-body text-primary truncate">{title}</p>
				{description && (
					<p className="text-caption text-muted truncate">{description}</p>
				)}
			</div>
			{trailing && (
				<div className="shrink-0 flex items-center gap-3">{trailing}</div>
			)}
		</>
	);

	if (!href) return <div className={shell}>{body}</div>;

	return (
		<a
			href={href}
			className={`${shell} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus`}
		>
			{body}
		</a>
	);
}

/** Marcador numérico das prioridades. */
export function RowIndex({ n }: { n: number }) {
	return (
		<span className="w-5 text-label text-brand tabular-nums dark:text-violet-400">
			{n}
		</span>
	);
}
