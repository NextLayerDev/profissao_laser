'use client';

import {
	Check,
	ChevronDown,
	Hash,
	Image as ImageIcon,
	List,
	type LucideIcon,
	SlidersHorizontal,
	ToggleLeft,
	Trash2,
	Type as TypeIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { BuilderField, FieldType } from './builder-model';
import { ac } from './forge-theme';

/**
 * Primitivas visuais do builder ("forge" escuro, porém premium e acessível):
 * cartões de seção, campos rotulados, inputs maiores com foco visível, toggles,
 * picker de ícone e o stepper de navegação. SÓ apresentação — quem muta o
 * `BuilderState` é a view (cada control dispara o mesmo handler de antes).
 */

/* ── classes-base ── */

export const inputCls =
	'h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:border-emerald-400/50 focus-visible:ring-2 focus-visible:ring-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-50';

/* ── seção ── */

export function FormSection({
	id,
	step,
	title,
	subtitle,
	icon,
	accent = 'emerald',
	delay = 0,
	action,
	children,
}: {
	id?: string;
	step: string;
	title: string;
	subtitle?: string;
	icon: ReactNode;
	accent?: string;
	delay?: number;
	action?: ReactNode;
	children: ReactNode;
}) {
	const a = ac(accent);
	return (
		<section
			id={id ?? `builder-step-${step}`}
			className="forge-rise group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#0e1217] to-[#0a0c10] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_18px_40px_-24px_rgba(0,0,0,0.8)]"
			style={{ animationDelay: `${delay}ms` }}
		>
			<div
				className={`absolute inset-y-0 left-0 w-[3px] ${a.bar} opacity-80`}
			/>
			<header className="flex items-center gap-3.5 border-b border-white/[0.06] px-6 py-4">
				<span
					className={`relative flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${a.chip}`}
				>
					{icon}
					<span className="absolute -bottom-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-md bg-[#0a0c10] px-1 font-mono text-[9px] font-bold text-slate-500 ring-1 ring-white/10">
						{step}
					</span>
				</span>
				<div className="min-w-0 flex-1">
					<h2 className="truncate text-[15px] font-semibold tracking-tight text-white">
						{title}
					</h2>
					{subtitle && (
						<p className="mt-0.5 truncate text-[13px] text-slate-400">
							{subtitle}
						</p>
					)}
				</div>
				{action}
			</header>
			<div className="p-6">{children}</div>
		</section>
	);
}

/* ── campo rotulado ── */

export function Field({
	label,
	hint,
	htmlFor,
	className = '',
	children,
}: {
	label: string;
	hint?: string;
	htmlFor?: string;
	className?: string;
	children: ReactNode;
}) {
	return (
		<div className={className}>
			<label
				htmlFor={htmlFor}
				className="mb-1.5 flex items-baseline gap-2 text-[13px] font-medium text-slate-300"
			>
				{label}
				{hint && (
					<span className="text-[11px] font-normal text-slate-500">{hint}</span>
				)}
			</label>
			{children}
		</div>
	);
}

/* ── select estilizado (chevron próprio) ── */

export function SelectInput({
	id,
	value,
	onChange,
	children,
	muted,
	className = '',
}: {
	id?: string;
	value: string;
	onChange: (v: string) => void;
	children: ReactNode;
	muted?: boolean;
	className?: string;
}) {
	return (
		<div className="relative">
			<select
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className={`${inputCls} cursor-pointer appearance-none pr-10 ${muted ? 'text-slate-500' : ''} ${className}`}
			>
				{children}
			</select>
			<ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
		</div>
	);
}

/* ── controle segmentado (Canvas / Etapas) ── */

export function SegmentedControl<T extends string>({
	value,
	onChange,
	options,
	accent = 'cyan',
	ariaLabel,
}: {
	value: T;
	onChange: (v: T) => void;
	options: { value: T; label: string; icon?: ReactNode }[];
	accent?: string;
	ariaLabel?: string;
}) {
	const a = ac(accent);
	return (
		<div
			role="tablist"
			aria-label={ariaLabel}
			className="inline-flex rounded-xl border border-white/10 bg-black/30 p-1"
		>
			{options.map((o) => {
				const on = o.value === value;
				return (
					<button
						key={o.value}
						type="button"
						role="tab"
						aria-selected={on}
						onClick={() => onChange(o.value)}
						className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
							on ? `${a.chip} ring-1` : 'text-slate-400 hover:text-slate-200'
						}`}
					>
						{o.icon}
						{o.label}
					</button>
				);
			})}
		</div>
	);
}

/* ── toggle (switch) ── */

export function Switch({
	checked,
	onChange,
	label,
	accent = 'emerald',
}: {
	checked: boolean;
	onChange: (v: boolean) => void;
	label?: string;
	accent?: string;
}) {
	const a = ac(accent);
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			onClick={() => onChange(!checked)}
			className={`inline-flex items-center gap-2 rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
				checked ? a.ico : 'bg-white/10'
			}`}
			style={{ width: 42, height: 24 }}
		>
			<span
				className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`}
			/>
		</button>
	);
}

/* ── chip "+ adicionar" (tipo de campo / bloco) ── */

export function TypeChip({
	onClick,
	icon,
	children,
	accent = 'sky',
}: {
	onClick: () => void;
	icon?: ReactNode;
	children: ReactNode;
	accent?: string;
}) {
	const a = ac(accent);
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[13px] font-medium text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${a.nodeHover}`}
		>
			{icon}
			{children}
		</button>
	);
}

/* ── card de um campo do formulário (redesign do FieldRow) ── */

const TYPE_META: Record<FieldType, { label: string; Icon: LucideIcon }> = {
	image: { label: 'Imagem', Icon: ImageIcon },
	number: { label: 'Número', Icon: SlidersHorizontal },
	int: { label: 'Inteiro', Icon: Hash },
	bool: { label: 'Sim/Não', Icon: ToggleLeft },
	enum: { label: 'Opções', Icon: List },
	string: { label: 'Texto', Icon: TypeIcon },
};

function MiniNumber({
	label,
	value,
	onChange,
}: {
	label: string;
	value?: number;
	onChange: (v: number) => void;
}) {
	return (
		<label className="flex items-center gap-1.5 text-xs text-slate-400">
			{label}
			<input
				type="number"
				value={value ?? ''}
				onChange={(e) => onChange(Number(e.target.value))}
				className="h-8 w-20 rounded-lg border border-white/10 bg-black/30 px-2 text-xs text-slate-100 focus-visible:outline-none focus-visible:border-emerald-400/50 focus-visible:ring-2 focus-visible:ring-emerald-400/30"
			/>
		</label>
	);
}

export function FieldCard({
	field,
	onChange,
	onRemove,
}: {
	field: BuilderField;
	onChange: (f: BuilderField) => void;
	onRemove: () => void;
}) {
	const meta = TYPE_META[field.type];
	const Icon = meta.Icon;
	const hasSub =
		field.type === 'number' ||
		field.type === 'int' ||
		field.type === 'bool' ||
		field.type === 'enum' ||
		field.type === 'string';
	return (
		<div className="rounded-xl border border-white/10 bg-black/20 p-3.5 transition-colors hover:border-white/20">
			<div className="flex items-center gap-3">
				<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-slate-400 ring-1 ring-white/10">
					<Icon className="h-4 w-4" />
				</span>
				<div className="min-w-0 flex-1">
					<input
						value={field.label}
						onChange={(e) => onChange({ ...field, label: e.target.value })}
						aria-label="Rótulo do campo"
						className="w-full bg-transparent text-sm font-semibold text-white placeholder:text-slate-600 focus-visible:outline-none"
						placeholder="Rótulo do campo"
					/>
					<span className="font-mono text-[11px] text-slate-500">
						{field.name} · {meta.label}
					</span>
				</div>
				{field.type !== 'image' && (
					<div className="flex shrink-0 items-center gap-2">
						<span className="text-[11px] text-slate-500">
							{field.visible ? 'visível' : 'oculto'}
						</span>
						<Switch
							checked={field.visible}
							onChange={(v) => onChange({ ...field, visible: v })}
							label="Visível para o cliente"
							accent="sky"
						/>
					</div>
				)}
				<button
					type="button"
					onClick={onRemove}
					aria-label="Remover campo"
					className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/30"
				>
					<Trash2 className="h-4 w-4" />
				</button>
			</div>
			{hasSub && (
				<div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pl-12 pt-3">
					{(field.type === 'number' || field.type === 'int') && (
						<>
							<MiniNumber
								label="padrão"
								value={field.default as number | undefined}
								onChange={(v) => onChange({ ...field, default: v })}
							/>
							<MiniNumber
								label="mín"
								value={field.min}
								onChange={(v) => onChange({ ...field, min: v })}
							/>
							<MiniNumber
								label="máx"
								value={field.max}
								onChange={(v) => onChange({ ...field, max: v })}
							/>
						</>
					)}
					{field.type === 'bool' && (
						<div className="flex items-center gap-2 text-xs text-slate-400">
							<Switch
								checked={Boolean(field.default)}
								onChange={(v) => onChange({ ...field, default: v })}
								label="Ligado por padrão"
							/>
							ligado por padrão
						</div>
					)}
					{field.type === 'enum' && (
						<input
							value={(field.options ?? []).join(', ')}
							onChange={(e) =>
								onChange({
									...field,
									options: e.target.value
										.split(',')
										.map((s) => s.trim())
										.filter(Boolean),
								})
							}
							placeholder="opções, separadas por vírgula"
							className="h-9 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-emerald-400/50 focus-visible:ring-2 focus-visible:ring-emerald-400/30"
						/>
					)}
					{field.type === 'string' && (
						<input
							value={String(field.default ?? '')}
							onChange={(e) => onChange({ ...field, default: e.target.value })}
							placeholder="valor padrão (opcional)"
							className="h-9 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-emerald-400/50 focus-visible:ring-2 focus-visible:ring-emerald-400/30"
						/>
					)}
				</div>
			)}
		</div>
	);
}

/* ── stepper horizontal (navegação + progresso) ── */

export interface StepDef {
	id: string;
	label: string;
	done: boolean;
	accent: string;
}

/**
 * Stepper controlado: o passo ativo é dono do parent (wizard de 1 passo por
 * tela). Clicar num passo NÃO rola a página — troca a etapa renderizada.
 */
export function StepperBar({
	steps,
	activeId,
	onSelect,
}: {
	steps: StepDef[];
	activeId: string;
	onSelect: (id: string) => void;
}) {
	return (
		<nav
			aria-label="Etapas da ferramenta"
			className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#0a0c10]/90 p-1.5 backdrop-blur"
		>
			{steps.map((s, i) => {
				const on = activeId === s.id;
				const a = ac(s.accent);
				return (
					<button
						key={s.id}
						type="button"
						aria-current={on ? 'step' : undefined}
						onClick={() => onSelect(s.id)}
						className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
							on
								? `${a.chip} ring-1`
								: 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
						}`}
					>
						<span
							className={`flex h-5 w-5 items-center justify-center rounded-md font-mono text-[10px] font-bold ${
								s.done
									? a.ico
									: on
										? 'bg-white/10 text-slate-200'
										: 'bg-white/[0.06] text-slate-500'
							}`}
						>
							{s.done ? <Check className="h-3 w-3" /> : i + 1}
						</span>
						{s.label}
					</button>
				);
			})}
		</nav>
	);
}
