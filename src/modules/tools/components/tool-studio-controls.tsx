'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type {
	ToolControl,
	ToolInputSpec,
} from '../services/tool-definitions.service';
import { bindName } from './tool-widgets';

/* Acento da tela via CSS var `--screen-accent` (herdada do wrapper do Estúdio). */
const accentSolid = { backgroundColor: 'var(--screen-accent)' };
const accentRange = { accentColor: 'var(--screen-accent)' } as const;
const accentTint = {
	backgroundColor: 'color-mix(in srgb, var(--screen-accent) 14%, transparent)',
	color: 'var(--screen-accent)',
};

/* ─────────────── Seção (card de grupo) ─────────────── */
export function StudioGroup({
	title,
	icon: Icon,
	children,
}: {
	title: string;
	icon?: LucideIcon;
	children: ReactNode;
}) {
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#16161a]">
			<div className="mb-1 flex items-center gap-2">
				{Icon && (
					<span
						className="flex h-6 w-6 items-center justify-center rounded-lg"
						style={accentTint}
					>
						<Icon className="h-3.5 w-3.5" />
					</span>
				)}
				<h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
					{title}
				</h5>
			</div>
			<div className="divide-y divide-slate-100 dark:divide-white/5">
				{children}
			</div>
		</section>
	);
}

/* ─────────────── Linhas de controle ─────────────── */
function StudioRange({
	label,
	value,
	min,
	max,
	step,
	onChange,
	fmt,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onChange: (v: number) => void;
	fmt?: (v: number) => string;
}) {
	return (
		<div className="py-2.5">
			<div className="mb-1.5 flex justify-between text-sm">
				<span className="text-slate-600 dark:text-gray-300">{label}</span>
				<span className="font-semibold tabular-nums text-slate-800 dark:text-white">
					{fmt ? fmt(value) : value}
				</span>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				style={accentRange}
				className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 dark:bg-white/10"
			/>
		</div>
	);
}

export function StudioSwitch({
	checked,
	onChange,
}: {
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			onClick={() => onChange(!checked)}
			style={checked ? accentSolid : undefined}
			className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
				checked ? '' : 'bg-slate-300 dark:bg-white/20'
			}`}
		>
			<span
				className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
					checked ? 'translate-x-5' : 'translate-x-0'
				}`}
			/>
		</button>
	);
}

function StudioToggleRow({
	label,
	checked,
	onChange,
}: {
	label: string;
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between py-2.5">
			<span className="text-sm text-slate-600 dark:text-gray-300">{label}</span>
			<StudioSwitch checked={checked} onChange={onChange} />
		</div>
	);
}

function StudioSelect({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: string;
	options: { value: string; label: string }[];
	onChange: (v: string) => void;
}) {
	return (
		<div className="flex items-center justify-between gap-2 py-2.5">
			<span className="text-sm text-slate-600 dark:text-gray-300">{label}</span>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="max-w-[60%] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 dark:border-white/10 dark:bg-[#111] dark:text-slate-200"
				style={{ outlineColor: 'var(--screen-accent)' }}
			>
				{options.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
		</div>
	);
}

function StudioColorRow({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
}) {
	const valid = /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000';
	return (
		<div className="flex items-center justify-between gap-2 py-2.5">
			<span className="text-sm text-slate-600 dark:text-gray-300">{label}</span>
			<input
				type="color"
				value={valid}
				onChange={(e) => onChange(e.target.value)}
				className="h-8 w-12 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0.5 dark:border-white/10"
			/>
		</div>
	);
}

/** Rótulo "bonito" pra valores de option (Title Case nos slugs). */
function prettyOption(v: unknown): string {
	const s = String(v);
	return s
		.replace(/[_-]+/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase())
		.trim();
}

/**
 * Renderiza UM control no estúdio (slider/select/toggle/color/number) com o
 * visual premium acent-aware. Imagem (file-drop) é tratada à parte pelo
 * `StudioDropzone`. Faz o switch por `control.widget`; desconhecido → range.
 */
export function StudioWidgetField({
	control,
	spec,
	value,
	onChange,
}: {
	control: ToolControl;
	spec?: ToolInputSpec;
	value: unknown;
	onChange: (v: unknown) => void;
}) {
	const label = control.label ?? prettyOption(bindName(control.bind));
	const widget = control.widget;

	if (widget === 'toggle') {
		return (
			<StudioToggleRow
				label={label}
				checked={Boolean(value ?? spec?.default ?? false)}
				onChange={onChange}
			/>
		);
	}
	if (widget === 'select') {
		const raw = (control.options ?? spec?.options ?? []) as unknown[];
		const numeric = raw.length > 0 && raw.every((o) => typeof o === 'number');
		const options = raw.map((o) => ({
			value: String(o),
			label: prettyOption(o),
		}));
		const current = String(value ?? spec?.default ?? raw[0] ?? '');
		return (
			<StudioSelect
				label={label}
				value={current}
				options={options}
				onChange={(v) => onChange(numeric ? Number(v) : v)}
			/>
		);
	}
	if (widget === 'color') {
		return (
			<StudioColorRow
				label={label}
				value={String(value ?? spec?.default ?? '#000000')}
				onChange={onChange}
			/>
		);
	}
	// slider / number / fallback → range
	const min = control.min ?? spec?.min ?? 0;
	const max = control.max ?? spec?.max ?? 100;
	const step = control.step ?? 1;
	const current = Number(value ?? spec?.default ?? min);
	const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2));
	return (
		<StudioRange
			label={label}
			value={current}
			min={min}
			max={max}
			step={step}
			onChange={onChange}
			fmt={fmt}
		/>
	);
}
