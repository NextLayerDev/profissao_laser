'use client';

import { ChevronDown, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type {
	ToolControl,
	ToolInputSpec,
} from '../services/tool-definitions.service';
import { bindName, WidgetField } from './tool-widgets';

/* Acento da tela via CSS var `--screen-accent` (herdada do wrapper do Estúdio). */
const accentSolid = { backgroundColor: 'var(--screen-accent)' };
const accentRange = { accentColor: 'var(--screen-accent)' } as const;
const accentTint = {
	backgroundColor: 'color-mix(in srgb, var(--screen-accent) 14%, transparent)',
	color: 'var(--screen-accent)',
};

/* ─────────────── Seção (card de grupo) ─────────────── */

/**
 * `collapsed` é OPT-IN, via `ui.collapsedGroups` na definition. Serve para uma
 * ferramenta poder abrir com 3 campos na cara e o resto atrás de "Ajustes
 * avançados" — que é a diferença entre uma tela usável por leigo e uma parede
 * de 12 controles.
 *
 * Sendo opt-in, nenhuma das tools-mãe já publicadas muda: sem a chave, o grupo
 * continua sendo a `<section>` sempre aberta de antes.
 *
 * Usa `<details>`/`<summary>` nativos de propósito: o estado de aberto/fechado
 * sobrevive sem React, funciona com teclado e leitor de tela sem uma linha de
 * ARIA, e o campo dentro continua sendo alcançável pelo Ctrl+F do navegador.
 */
export function StudioGroup({
	title,
	icon: Icon,
	collapsed,
	children,
}: {
	title: string;
	icon?: LucideIcon;
	collapsed?: boolean;
	children: ReactNode;
}) {
	const cabecalho = (
		<div className="flex items-center gap-2">
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
	);

	const corpo = (
		<div className="divide-y divide-slate-100 dark:divide-white/5">
			{children}
		</div>
	);

	const card =
		'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#16161a]';

	if (collapsed) {
		return (
			<details className={`${card} group`}>
				<summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
					{cabecalho}
					<ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
				</summary>
				<div className="mt-2">{corpo}</div>
			</details>
		);
	}

	return (
		<section className={card}>
			<div className="mb-1">{cabecalho}</div>
			{corpo}
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

/** Rótulos PT-BR de valores de enum conhecidos (materiais do laser, efeitos com
 * acento). O que não estiver aqui cai no Title Case do slug. */
const PT_LABELS: Record<string, string> = {
	// materiais (estúdio laser)
	wood: 'Madeira',
	'black slate': 'Ardósia preta',
	glass: 'Vidro',
	acrylic: 'Acrílico',
	leather: 'Couro',
	cork: 'Cortiça',
	'andonized aluminum': 'Alumínio anodizado',
	'stainless steel': 'Aço inox',
	'white tile': 'Azulejo branco',
	'white tile painted black': 'Azulejo preto',
	// efeitos (acentos/PT)
	nenhum: 'Nenhum',
	oleo: 'Óleo',
	cross_process: 'Cross process',
	split_toning: 'Split toning',
	vazamento_luz: 'Vazamento de luz',
	brilho_suave: 'Brilho suave',
};

/** Rótulo "bonito" pra valores de option (mapa PT-BR → Title Case do slug). */
function prettyOption(v: unknown): string {
	const s = String(v);
	if (PT_LABELS[s]) return PT_LABELS[s];
	return s
		.replace(/[_-]+/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase())
		.trim();
}

/**
 * Renderiza UM control no estúdio. Imagem (`file-drop`) é tratada à parte pelo
 * `StudioDropzone`.
 *
 * ATENÇÃO — ESTE ARQUIVO É UM SEGUNDO DESPACHANTE DE WIDGET, paralelo ao
 * registry de `tool-widgets.tsx`. Ele existe porque `toggle`/`select`/`color`
 * têm aqui um visual de LINHA (label à esquerda, controle à direita) que as
 * tools-mãe publicadas — `estudio_laser`, `estudio_editor`, `estudio_ia` —
 * dependem. Esses três continuam sendo tratados aqui, de propósito.
 *
 * O QUE MUDOU: o `else` final mandava TUDO para um `<input type="range">`.
 * Um upload de `.dxf` virava um slider em 0 — foi assim que a primeira tela da
 * Central de Custos foi ao ar. Agora só `slider`/`number` (e control sem widget
 * declarado sobre campo numérico) caem no range; o resto **delega ao registry**,
 * que já sabe renderizar `file`, `money`, `dimension`, `segmented`, `textarea`,
 * `text` e `collection`.
 *
 * A mudança é estritamente monotônica: o `else` só era atingido por widget que
 * este arquivo não conhece, e para esses ele estava comprovadamente errado.
 * Registrar um widget novo volta a ser UM ponto (o registry), não dois.
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
	/**
	 * Range só para quem É range. `number` entra aqui porque no estúdio um
	 * numérico com min/max conhecidos fica melhor como slider — é o visual que
	 * as tools-mãe publicadas usam hoje e que não vamos mexer.
	 *
	 * Control sem `widget` declarado sobre um campo numérico também cai aqui:
	 * é o comportamento histórico das tools antigas, e mudá-lo mexeria em telas
	 * publicadas sem necessidade.
	 */
	const numerico = spec?.type === 'number' || spec?.type === 'int';
	if (widget === 'slider' || widget === 'number' || (!widget && numerico)) {
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

	/**
	 * Todo o resto vai para o registry — a MESMA função que a tela pública de
	 * orçamento usa e que, por isso, sempre funcionou lá enquanto quebrava aqui.
	 * `WidgetProps` tem exatamente esta assinatura, então não há adaptação.
	 * Widget desconhecido cai no `TextWidget` do registry, que é um campo de
	 * texto — errado, mas honesto, ao contrário de um slider em 0.
	 */
	return (
		<WidgetField
			control={control}
			spec={spec}
			value={value}
			onChange={onChange}
		/>
	);
}
