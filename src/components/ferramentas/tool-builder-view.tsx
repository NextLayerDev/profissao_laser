'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	ArrowLeft,
	ArrowRight,
	Check,
	ChevronDown,
	Code2,
	Eye,
	EyeOff,
	Link2,
	Loader2,
	Plus,
	Rocket,
	Save,
	Search,
	Sparkles,
	Trash2,
	Unlink,
	Workflow,
} from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { usePlans } from '@/modules/plans/hooks/use-plans';
import { DynamicToolView } from '@/modules/tools/components/dynamic-tool-view';
import { useTools } from '@/modules/tools/hooks/use-tools';
import { resolveToolIcon, TOOL_ICONS } from '@/modules/tools/lib/tool-icons';
import {
	type AiToolDefinition,
	createToolDefinition,
	listToolDefinitions,
	publishToolDefinition,
	type ToolDefinitionDoc,
	toolDefinitionDocSchema,
	updateToolDefinition,
} from '@/modules/tools/services/tool-definitions.service';
import type { Tool } from '@/modules/tools/types/tools';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { ToolAgentChat } from './agent/tool-agent-chat';
import { BLOCK_CATALOG, type BlockParam, type PortType } from './block-catalog';
import { KeyValueEditor } from './builder-fields';
import {
	allNodeOutputs,
	availableSources,
	type BuilderField,
	type BuilderNode,
	type BuilderState,
	buildDoc,
	docToState,
	type FieldType,
	newField,
	newNode,
	type ParamValue,
	resolveSpec,
	slugifyKey,
	TEMPLATES,
	type Template,
} from './builder-model';
import { ToolCanvas } from './canvas/tool-canvas';
import { ToolBillingPanel } from './tool-billing-panel';

/* ───────── estilos + accents ───────── */

function ForgeStyles() {
	return (
		<style>{`
			.forge-grid{background-image:linear-gradient(to right,rgba(16,185,129,.06) 1px,transparent 1px),linear-gradient(to bottom,rgba(16,185,129,.06) 1px,transparent 1px);background-size:28px 28px}
			@keyframes forgeRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
			.forge-rise{animation:forgeRise .45s cubic-bezier(.22,1,.36,1) both}
			@keyframes forgeFlow{to{background-position:18px 0}}
			.forge-wire{background-image:repeating-linear-gradient(90deg,rgba(45,212,191,.9) 0 7px,transparent 7px 14px);background-size:18px 2px;background-repeat:no-repeat;background-position:0 50%;animation:forgeFlow .7s linear infinite}
			@keyframes forgePulse{0%,100%{opacity:.35}50%{opacity:1}}
			.forge-pulse{animation:forgePulse 2.4s ease-in-out infinite}
			.forge-node{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
			.forge-node:hover{transform:translateY(-2px)}
		`}</style>
	);
}

interface AC {
	bar: string;
	chip: string;
	cardHover: string;
	nodeHover: string;
	badge: string;
	ico: string;
	text: string;
}
const ACCENTS: Record<string, AC> = {
	emerald: {
		bar: 'bg-emerald-400/70',
		chip: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20',
		cardHover: 'hover:border-emerald-400/50 hover:shadow-emerald-500/40',
		nodeHover: 'hover:border-emerald-400/50',
		badge: 'bg-emerald-500/20 text-emerald-300 ring-emerald-400/30',
		ico: 'bg-emerald-500/15 text-emerald-300',
		text: 'text-emerald-300',
	},
	sky: {
		bar: 'bg-sky-400/70',
		chip: 'bg-sky-500/15 text-sky-300 ring-sky-400/20',
		cardHover: 'hover:border-sky-400/50 hover:shadow-sky-500/40',
		nodeHover: 'hover:border-sky-400/50',
		badge: 'bg-sky-500/20 text-sky-300 ring-sky-400/30',
		ico: 'bg-sky-500/15 text-sky-300',
		text: 'text-sky-300',
	},
	cyan: {
		bar: 'bg-cyan-400/70',
		chip: 'bg-cyan-500/15 text-cyan-300 ring-cyan-400/20',
		cardHover: 'hover:border-cyan-400/50 hover:shadow-cyan-500/40',
		nodeHover: 'hover:border-cyan-400/50',
		badge: 'bg-cyan-500/20 text-cyan-300 ring-cyan-400/30',
		ico: 'bg-cyan-500/15 text-cyan-300',
		text: 'text-cyan-300',
	},
	amber: {
		bar: 'bg-amber-400/70',
		chip: 'bg-amber-500/15 text-amber-300 ring-amber-400/20',
		cardHover: 'hover:border-amber-400/50 hover:shadow-amber-500/40',
		nodeHover: 'hover:border-amber-400/50',
		badge: 'bg-amber-500/20 text-amber-300 ring-amber-400/30',
		ico: 'bg-amber-500/15 text-amber-300',
		text: 'text-amber-300',
	},
	orange: {
		bar: 'bg-orange-400/70',
		chip: 'bg-orange-500/15 text-orange-300 ring-orange-400/20',
		cardHover: 'hover:border-orange-400/50 hover:shadow-orange-500/40',
		nodeHover: 'hover:border-orange-400/50',
		badge: 'bg-orange-500/20 text-orange-300 ring-orange-400/30',
		ico: 'bg-orange-500/15 text-orange-300',
		text: 'text-orange-300',
	},
	violet: {
		bar: 'bg-violet-400/70',
		chip: 'bg-violet-500/15 text-violet-300 ring-violet-400/20',
		cardHover: 'hover:border-violet-400/50 hover:shadow-violet-500/40',
		nodeHover: 'hover:border-violet-400/50',
		badge: 'bg-violet-500/20 text-violet-300 ring-violet-400/30',
		ico: 'bg-violet-500/15 text-violet-300',
		text: 'text-violet-300',
	},
	slate: {
		bar: 'bg-slate-400/70',
		chip: 'bg-slate-500/15 text-slate-300 ring-slate-400/20',
		cardHover: 'hover:border-slate-400/50 hover:shadow-slate-500/40',
		nodeHover: 'hover:border-slate-400/50',
		badge: 'bg-slate-500/20 text-slate-300 ring-slate-400/30',
		ico: 'bg-slate-500/15 text-slate-300',
		text: 'text-slate-300',
	},
};
const ac = (a?: string): AC => ACCENTS[a ?? ''] ?? ACCENTS.emerald;

function Glyph({ name, className }: { name?: string; className?: string }) {
	const Icon = resolveToolIcon(name);
	return <Icon className={className} />;
}

const fieldCls =
	'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40';
const smallSelect =
	'rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/40';

/* ───────── section ───────── */

function Section({
	step,
	title,
	subtitle,
	icon,
	accent = 'emerald',
	delay = 0,
	children,
}: {
	step: string;
	title: string;
	subtitle?: string;
	icon: ReactNode;
	accent?: string;
	delay?: number;
	children: ReactNode;
}) {
	const a = ac(accent);
	return (
		<section
			className="forge-rise relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0f12]/80 backdrop-blur-sm"
			style={{ animationDelay: `${delay}ms` }}
		>
			<div className={`absolute bottom-0 left-0 top-0 w-1 ${a.bar}`} />
			<header className="flex items-center gap-3 border-b border-white/5 px-5 pb-3 pt-4">
				<div
					className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${a.chip}`}
				>
					{icon}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className="font-mono text-[10px] tracking-widest text-emerald-400/70">
							{step}
						</span>
						<h2 className="truncate text-sm font-semibold text-white">
							{title}
						</h2>
					</div>
					{subtitle && (
						<p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
					)}
				</div>
			</header>
			<div className="p-5">{children}</div>
		</section>
	);
}

/* ───────── literal control ───────── */

function LiteralControl({
	param,
	value,
	onChange,
}: {
	param: BlockParam;
	value: unknown;
	onChange: (v: unknown) => void;
}) {
	if (param.widget === 'keyvalue') {
		return <KeyValueEditor value={value} onChange={onChange} />;
	}
	if (param.widget === 'textarea') {
		return (
			<textarea
				value={String(value ?? '')}
				onChange={(e) => onChange(e.target.value)}
				rows={3}
				className="w-full min-w-[14rem] rounded-md border border-white/10 bg-black/30 px-2 py-1.5 font-mono text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
			/>
		);
	}
	if (param.valueType === 'bool') {
		return (
			<button
				type="button"
				onClick={() => onChange(!value)}
				className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${value ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-slate-400'}`}
			>
				{value ? 'sim' : 'não'}
			</button>
		);
	}
	if (param.options) {
		return (
			<select
				value={String(value ?? '')}
				onChange={(e) => {
					const numeric = param.options?.every((o) => typeof o === 'number');
					onChange(numeric ? Number(e.target.value) : e.target.value);
				}}
				className={smallSelect}
			>
				{param.options.map((o) => (
					<option key={String(o)} value={String(o)}>
						{String(o)}
					</option>
				))}
			</select>
		);
	}
	if (param.valueType === 'number' || param.valueType === 'int') {
		return (
			<input
				type="number"
				value={value === undefined || value === null ? '' : Number(value)}
				min={param.min}
				max={param.max}
				step={param.step}
				onChange={(e) =>
					onChange(e.target.value === '' ? undefined : Number(e.target.value))
				}
				className={`w-24 ${smallSelect}`}
			/>
		);
	}
	return (
		<input
			value={String(value ?? '')}
			onChange={(e) => onChange(e.target.value)}
			className={`w-40 ${smallSelect}`}
		/>
	);
}

function wantType(param: BlockParam): PortType | 'bool' | 'enum' {
	if (param.kind === 'ref') return param.refType ?? 'buffer';
	if (param.valueType === 'int') return 'number';
	return param.valueType ?? 'string';
}

/* ───────── param row (literal | ref) ───────── */

function ParamRow({
	param,
	value,
	state,
	nodeIndex,
	onChange,
}: {
	param: BlockParam;
	value: ParamValue;
	state: BuilderState;
	nodeIndex: number;
	onChange: (v: ParamValue) => void;
}) {
	const sources = availableSources(state, nodeIndex, wantType(param));
	const isRef = value.mode === 'ref';
	const canLiteral = param.kind === 'literal';

	return (
		<div className="flex flex-wrap items-center gap-2 py-1">
			<span className="w-28 shrink-0 text-xs font-medium text-slate-300">
				{param.label}
			</span>
			{isRef ? (
				<>
					<select
						value={value.mode === 'ref' ? value.source : ''}
						onChange={(e) =>
							onChange({
								mode: 'ref',
								source: e.target.value,
								negate: value.mode === 'ref' ? value.negate : undefined,
							})
						}
						className={`min-w-[10rem] flex-1 ${smallSelect} ${value.source ? 'text-cyan-200' : 'text-slate-500'}`}
					>
						<option value="">— escolha a fonte —</option>
						{sources.map((s) => (
							<option key={s.value} value={s.value}>
								{s.label}
							</option>
						))}
					</select>
					{param.valueType === 'bool' && (
						<label className="flex items-center gap-1 text-[11px] text-slate-400">
							<input
								type="checkbox"
								checked={value.mode === 'ref' ? !!value.negate : false}
								onChange={(e) =>
									onChange({
										mode: 'ref',
										source: value.mode === 'ref' ? value.source : '',
										negate: e.target.checked,
									})
								}
								className="accent-emerald-500"
							/>
							negar
						</label>
					)}
					{canLiteral && (
						<button
							type="button"
							onClick={() =>
								onChange({ mode: 'literal', value: param.default })
							}
							title="Usar valor fixo"
							className="text-slate-500 hover:text-slate-300"
						>
							<Unlink className="h-3.5 w-3.5" />
						</button>
					)}
				</>
			) : (
				<>
					<LiteralControl
						param={param}
						value={value.mode === 'literal' ? value.value : undefined}
						onChange={(v) => onChange({ mode: 'literal', value: v })}
					/>
					<button
						type="button"
						onClick={() => onChange({ mode: 'ref', source: '' })}
						title="Ligar a um campo / etapa"
						className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-cyan-300"
					>
						<Link2 className="h-3.5 w-3.5" /> ligar
					</button>
				</>
			)}
		</div>
	);
}

/* ───────── step card ───────── */

function StepCard({
	node,
	index,
	total,
	state,
	onParam,
	onMove,
	onRemove,
}: {
	node: BuilderNode;
	index: number;
	total: number;
	state: BuilderState;
	onParam: (param: string, v: ParamValue) => void;
	onMove: (dir: -1 | 1) => void;
	onRemove: () => void;
}) {
	const spec = resolveSpec(node.block, state.customNodes);
	const a = ac(spec?.accent);
	return (
		<div
			className={`rounded-xl border border-white/10 bg-black/20 p-3 ${a.nodeHover}`}
		>
			<div className="mb-2 flex items-center gap-2">
				<span
					className={`flex h-6 w-6 items-center justify-center rounded-md font-mono text-[10px] ring-1 ${a.badge}`}
				>
					{index + 1}
				</span>
				<div
					className={`flex h-7 w-7 items-center justify-center rounded-md ${a.ico}`}
				>
					<Glyph name={spec?.icon} className="h-4 w-4" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-semibold text-white">
						{spec?.label ?? node.block}
					</p>
					<p className="font-mono text-[10px] text-slate-500">{node.id}</p>
				</div>
				<button
					type="button"
					disabled={index === 0}
					onClick={() => onMove(-1)}
					className="rounded p-1 text-slate-500 hover:text-slate-200 disabled:opacity-20"
				>
					↑
				</button>
				<button
					type="button"
					disabled={index === total - 1}
					onClick={() => onMove(1)}
					className="rounded p-1 text-slate-500 hover:text-slate-200 disabled:opacity-20"
				>
					↓
				</button>
				<button
					type="button"
					onClick={onRemove}
					className="rounded p-1 text-slate-500 hover:text-rose-400"
				>
					<Trash2 className="h-3.5 w-3.5" />
				</button>
			</div>
			<div className="space-y-0.5 border-t border-white/5 pt-2">
				{(spec?.params ?? []).map((p) => (
					<ParamRow
						key={p.name}
						param={p}
						value={node.params[p.name] ?? { mode: 'literal', value: p.default }}
						state={state}
						nodeIndex={index}
						onChange={(v) => onParam(p.name, v)}
					/>
				))}
			</div>
		</div>
	);
}

/* ───────── field editor ───────── */

function FieldRow({
	field,
	onChange,
	onRemove,
}: {
	field: BuilderField;
	onChange: (f: BuilderField) => void;
	onRemove: () => void;
}) {
	return (
		<div className="rounded-xl border border-white/10 bg-black/20 p-3">
			<div className="flex items-center gap-2">
				<Glyph
					name={field.type === 'image' ? 'image' : 'box'}
					className="h-4 w-4 shrink-0 text-slate-400"
				/>
				<input
					value={field.label}
					onChange={(e) => onChange({ ...field, label: e.target.value })}
					className="flex-1 bg-transparent text-sm font-medium text-white focus:outline-none"
				/>
				<span className="font-mono text-[10px] text-slate-500">
					{field.name}
				</span>
				{field.type !== 'image' && (
					<button
						type="button"
						onClick={() => onChange({ ...field, visible: !field.visible })}
						className={`rounded-md px-2 py-1 text-[10px] font-semibold ${field.visible ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-slate-500'}`}
					>
						{field.visible ? 'visível' : 'oculto'}
					</button>
				)}
				<button
					type="button"
					onClick={onRemove}
					className="rounded p-1 text-slate-500 hover:text-rose-400"
				>
					<Trash2 className="h-3.5 w-3.5" />
				</button>
			</div>
			<div className="mt-2 flex flex-wrap items-center gap-2 pl-6">
				{(field.type === 'number' || field.type === 'int') && (
					<>
						<MiniNum
							label="padrão"
							value={field.default as number}
							onChange={(v) => onChange({ ...field, default: v })}
						/>
						<MiniNum
							label="mín"
							value={field.min}
							onChange={(v) => onChange({ ...field, min: v })}
						/>
						<MiniNum
							label="máx"
							value={field.max}
							onChange={(v) => onChange({ ...field, max: v })}
						/>
					</>
				)}
				{field.type === 'bool' && (
					<label className="flex items-center gap-2 text-xs text-slate-400">
						<input
							type="checkbox"
							checked={Boolean(field.default)}
							onChange={(e) =>
								onChange({ ...field, default: e.target.checked })
							}
							className="accent-emerald-500"
						/>
						ligado por padrão
					</label>
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
						className={`flex-1 ${smallSelect}`}
					/>
				)}
				{field.type === 'string' && (
					<input
						value={String(field.default ?? '')}
						onChange={(e) => onChange({ ...field, default: e.target.value })}
						placeholder="valor padrão"
						className={`flex-1 ${smallSelect}`}
					/>
				)}
			</div>
		</div>
	);
}

function MiniNum({
	label,
	value,
	onChange,
}: {
	label: string;
	value?: number;
	onChange: (v: number) => void;
}) {
	return (
		<label className="flex items-center gap-1 text-[11px] text-slate-500">
			{label}
			<input
				type="number"
				value={value ?? ''}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-16 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
			/>
		</label>
	);
}

/* ───────── template gallery ───────── */

function Gallery({ onPick }: { onPick: (t: Template) => void }) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2 text-emerald-300">
				<Sparkles className="h-4 w-4" />
				<span className="font-mono text-[11px] uppercase tracking-widest">
					Comece do zero ou de um modelo
				</span>
			</div>
			<div className="grid gap-4 sm:grid-cols-3">
				{TEMPLATES.map((t, i) => {
					const a = ac(t.accent);
					return (
						<button
							key={t.id}
							type="button"
							onClick={() => onPick(t)}
							style={{ animationDelay: `${i * 60}ms` }}
							className={`forge-rise forge-node group rounded-2xl border border-white/10 bg-[#0c0f12]/80 p-5 text-left hover:shadow-[0_0_40px_-12px] ${a.cardHover}`}
						>
							<div
								className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${a.chip}`}
							>
								<Glyph name={t.icon} className="h-6 w-6" />
							</div>
							<h3 className="text-base font-semibold text-white">{t.name}</h3>
							<p className="mt-1 text-sm text-slate-400">{t.tagline}</p>
							<span
								className={`mt-3 inline-flex items-center gap-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100 ${a.text}`}
							>
								Abrir <ArrowRight className="h-3.5 w-3.5" />
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}

/* ───────── main view ───────── */

const FIELD_TYPES: { type: FieldType; label: string }[] = [
	{ type: 'number', label: 'Número' },
	{ type: 'bool', label: 'Sim / Não' },
	{ type: 'enum', label: 'Opções' },
	{ type: 'string', label: 'Texto' },
	{ type: 'image', label: 'Imagem' },
];

export function ToolBuilderView() {
	const qc = useQueryClient();
	const tools = useTools();
	const defs = useQuery({
		queryKey: ['tool-definitions'],
		queryFn: listToolDefinitions,
	});
	const plans = usePlans();

	const [view, setView] = useState<'gallery' | 'editor' | 'billing'>('gallery');
	const [state, setState] = useState<BuilderState | null>(null);
	const [billingTool, setBillingTool] = useState<Tool | null>(null);
	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const [selectedDefId, setSelectedDefId] = useState<string | null>(null);
	const [mode, setMode] = useState<'visual' | 'json'>('visual');
	const [json, setJson] = useState('');
	const [advancedOpen, setAdvancedOpen] = useState(false);
	const [keyTouched, setKeyTouched] = useState(false);
	const [search, setSearch] = useState('');
	const [pipelineMode, setPipelineMode] = useState<'canvas' | 'steps'>(
		'canvas',
	);
	const [showPreview, setShowPreview] = useState(true);
	const [showAgent, setShowAgent] = useState(true);

	const goHub = () => {
		setView('gallery');
		setState(null);
		setBillingTool(null);
		setSelectedKey(null);
		setSelectedDefId(null);
	};

	const patch = (p: Partial<BuilderState>) =>
		setState((s) => (s ? { ...s, ...p } : s));

	/* lista unificada */
	const items = useMemo(() => {
		const defByKey = new Map((defs.data ?? []).map((d) => [d.tool_key, d]));
		const seen = new Set<string>();
		const list: {
			key: string;
			name: string;
			icon?: string;
			kind: 'fabrica' | 'codigo';
			enabled?: boolean;
			status?: string;
			def?: AiToolDefinition;
			tool?: Tool;
		}[] = [];
		for (const t of tools.data ?? []) {
			const def = defByKey.get(t.key);
			seen.add(t.key);
			list.push({
				key: t.key,
				name: def?.title ?? t.name,
				icon: (def?.definition.ui as { icon?: string } | undefined)?.icon,
				kind: def ? 'fabrica' : 'codigo',
				enabled: t.enabled,
				status: def?.status,
				def,
				tool: t,
			});
		}
		for (const d of defs.data ?? []) {
			if (seen.has(d.tool_key)) continue;
			list.push({
				key: d.tool_key,
				name: d.title,
				icon: (d.definition.ui as { icon?: string } | undefined)?.icon,
				kind: 'fabrica',
				status: d.status,
				def: d,
			});
		}
		const q = search.trim().toLowerCase();
		return list
			.filter(
				(i) => !q || i.name.toLowerCase().includes(q) || i.key.includes(q),
			)
			.sort((a2, b) => a2.name.localeCompare(b.name));
	}, [tools.data, defs.data, search]);

	const startNew = (t: Template) => {
		setState(t.seed());
		setSelectedKey(null);
		setSelectedDefId(null);
		setMode('visual');
		setJson('');
		setKeyTouched(false);
		setAdvancedOpen(false);
		setBillingTool(null);
		setView('editor');
	};

	const loadFabrica = (def: AiToolDefinition) => {
		const st = docToState(def);
		const unknown = st.nodes.some((n) => !resolveSpec(n.block, st.customNodes));
		setState(st);
		setSelectedKey(def.tool_key);
		setSelectedDefId(def.id);
		setBillingTool(null);
		setKeyTouched(true);
		setAdvancedOpen(unknown);
		if (unknown) {
			setMode('json');
			setJson(JSON.stringify(def.definition, null, 2));
		} else {
			setMode('visual');
			setJson('');
		}
		setView('editor');
	};

	const loadBilling = (tool: Tool) => {
		setBillingTool(tool);
		setState(null);
		setSelectedKey(tool.key);
		setSelectedDefId(null);
		setView('billing');
	};

	const derivedDoc = useMemo<ToolDefinitionDoc | null>(() => {
		try {
			if (mode === 'json')
				return toolDefinitionDocSchema.parse(JSON.parse(json));
			if (state) return buildDoc(state);
		} catch {
			return null;
		}
		return null;
	}, [mode, json, state]);

	const previewDef: AiToolDefinition | null =
		derivedDoc && state
			? {
					id: selectedDefId ?? 'draft',
					tool_key: state.toolKey || 'preview',
					version: 0,
					status: 'draft',
					title: state.title || 'Pré-visualização',
					description: state.description || null,
					engine_runtime: 'blocks_v1',
					definition: derivedDoc,
				}
			: null;

	const saveMut = useMutation({
		mutationFn: async () => {
			if (!state) throw new Error('sem estado');
			const definition =
				mode === 'json'
					? toolDefinitionDocSchema.parse(JSON.parse(json))
					: buildDoc(state);
			if (selectedDefId) {
				return updateToolDefinition(selectedDefId, {
					title: state.title,
					description: state.description || null,
					definition,
				});
			}
			return createToolDefinition({
				tool_key: state.toolKey,
				title: state.title,
				description: state.description || undefined,
				definition,
			});
		},
		onSuccess: (def) => {
			toast.success('Ferramenta salva.');
			qc.invalidateQueries({ queryKey: ['tool-definitions'] });
			loadFabrica(def);
		},
		onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao salvar.')),
	});

	const publishMut = useMutation({
		mutationFn: () => {
			if (!selectedDefId) throw new Error('salve antes');
			return publishToolDefinition(selectedDefId);
		},
		onSuccess: (res) => {
			toast.success(`Publicada: ${res.tool_key} v${res.version} 🚀`);
			qc.invalidateQueries({ queryKey: ['tool-definitions'] });
			qc.invalidateQueries({ queryKey: ['tools'] });
			qc.invalidateQueries({ queryKey: ['entitlements'] });
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Falha ao publicar.')),
	});

	const addField = (type: FieldType) => {
		if (!state) return;
		const idx = state.fields.length;
		patch({ fields: [...state.fields, newField(type, idx)] });
	};
	const addNode = (blockId: string) => {
		if (!state) return;
		patch({ nodes: [...state.nodes, newNode(blockId, state.nodes)] });
	};
	const moveNode = (i: number, dir: -1 | 1) => {
		if (!state) return;
		const j = i + dir;
		if (j < 0 || j >= state.nodes.length) return;
		const ns = [...state.nodes];
		[ns[i], ns[j]] = [ns[j], ns[i]];
		patch({ nodes: ns });
	};

	const canSave = !!state?.toolKey && !!state?.title && !!derivedDoc;
	const outputs = state ? allNodeOutputs(state) : [];
	const numberOutputs = outputs.filter((o) => o.type === 'number');

	// status (rascunho/publicada) da definition aberta, p/ o cabeçalho do editor
	const openDef = useMemo(
		() => (defs.data ?? []).find((d) => d.id === selectedDefId) ?? null,
		[defs.data, selectedDefId],
	);

	// colunas do container por tela: galeria = lista + grade; editor = trabalho
	// + prévia (ou só trabalho se prévia oculta); cobrança = centrado.
	const gridCls =
		view === 'editor'
			? showPreview && showAgent
				? 'grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px_380px]'
				: showPreview
					? 'grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]'
					: showAgent
						? 'grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]'
						: 'grid gap-5'
			: view === 'billing'
				? 'mx-auto grid max-w-4xl gap-5'
				: 'grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]';

	const focused = view === 'editor' || view === 'billing';

	const actionButtons = (
		<>
			<button
				type="button"
				onClick={() => saveMut.mutate()}
				disabled={saveMut.isPending || !canSave}
				className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-40"
			>
				{saveMut.isPending ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<Save className="h-4 w-4" />
				)}
				{selectedDefId ? 'Salvar' : 'Criar'}
			</button>
			<button
				type="button"
				onClick={() => publishMut.mutate()}
				disabled={publishMut.isPending || !selectedDefId}
				title={!selectedDefId ? 'Salve antes de publicar' : undefined}
				className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-bold text-[#06120f] shadow-lg shadow-emerald-500/25 disabled:opacity-40"
			>
				{publishMut.isPending ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<Rocket className="h-4 w-4" />
				)}
				Publicar
			</button>
		</>
	);

	return (
		<div className="relative min-h-[calc(100vh-3.5rem)] text-slate-100">
			<ForgeStyles />
			<div className="pointer-events-none absolute inset-0 forge-grid opacity-60" />
			<div className="pointer-events-none absolute -top-24 left-1/3 h-96 w-96 rounded-full bg-emerald-600/10 blur-3xl forge-pulse" />
			<div className="pointer-events-none absolute bottom-0 right-10 h-80 w-80 rounded-full bg-cyan-600/10 blur-3xl forge-pulse" />

			<div className="relative px-4 py-6 md:px-8">
				{!focused && (
					<div className="forge-rise mb-6 flex items-center gap-3">
						<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/20 text-emerald-300 ring-1 ring-emerald-400/30">
							<Workflow className="h-6 w-6" />
						</div>
						<div>
							<h1 className="text-xl font-bold tracking-tight text-white">
								Fábrica de Ferramentas
							</h1>
							<p className="font-mono text-[11px] tracking-wide text-emerald-400/70">
								motor blocks_v1 · {BLOCK_CATALOG.length} blocos · sem deploy
							</p>
						</div>
					</div>
				)}

				{focused && (
					<div className="forge-rise sticky top-[72px] z-20 mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#0c0f12]/85 px-4 py-3 backdrop-blur">
						<button
							type="button"
							onClick={goHub}
							className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300 hover:text-white"
						>
							<ArrowLeft className="h-4 w-4" /> Ferramentas
						</button>
						{view === 'editor' && state && (
							<>
								<div className="flex min-w-0 items-center gap-2">
									<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20">
										<Glyph name={state.icon} className="h-4 w-4" />
									</span>
									<span className="min-w-0">
										<span className="block truncate text-sm font-semibold text-white">
											{state.title || 'Nova ferramenta'}
										</span>
										<span className="block truncate font-mono text-[10px] text-slate-500">
											{state.toolKey || '—'}
										</span>
									</span>
									{openDef && (
										<span
											className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${openDef.status === 'published' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}
										>
											{openDef.status === 'published'
												? 'publicada'
												: 'rascunho'}
										</span>
									)}
								</div>
								<div className="ml-auto flex items-center gap-2">
									<button
										type="button"
										onClick={() => setShowAgent((v) => !v)}
										className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
											showAgent
												? 'border-violet-400/40 bg-violet-500/15 text-violet-200'
												: 'border-white/10 bg-black/20 text-slate-300 hover:text-white'
										}`}
									>
										<Sparkles className="h-4 w-4" />{' '}
										{showAgent ? 'Ocultar agente' : 'Agente'}
									</button>
									<button
										type="button"
										onClick={() => setShowPreview((v) => !v)}
										className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white"
									>
										{showPreview ? (
											<>
												<EyeOff className="h-4 w-4" /> Ocultar prévia
											</>
										) : (
											<>
												<Eye className="h-4 w-4" /> Mostrar prévia
											</>
										)}
									</button>
									{actionButtons}
								</div>
							</>
						)}
						{view === 'billing' && billingTool && (
							<span className="ml-1 truncate text-sm font-semibold text-white">
								{billingTool.name}
								<span className="ml-2 font-mono text-[10px] text-slate-500">
									preço & planos
								</span>
							</span>
						)}
					</div>
				)}

				<div className={gridCls}>
					{/* rail (só na galeria) */}
					{view === 'gallery' && (
						<aside className="space-y-2">
							<button
								type="button"
								onClick={() => {
									setView('gallery');
									setState(null);
									setBillingTool(null);
									setSelectedKey(null);
								}}
								className="forge-node flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-3 py-2.5 text-sm font-semibold text-[#06120f] shadow-lg shadow-emerald-500/20"
							>
								<Plus className="h-4 w-4" /> Nova ferramenta
							</button>
							<div className="relative">
								<Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
								<input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder="buscar…"
									className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-8 pr-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
								/>
							</div>
							<div className="overflow-hidden rounded-xl border border-white/10 bg-[#0c0f12]/80">
								<div className="border-b border-white/5 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">
									Ferramentas ({items.length})
								</div>
								{(tools.isLoading || defs.isLoading) && (
									<div className="flex justify-center p-4">
										<Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
									</div>
								)}
								<div className="max-h-[60vh] overflow-y-auto">
									{items.map((it) => (
										<button
											key={it.key}
											type="button"
											onClick={() =>
												it.kind === 'fabrica' && it.def
													? loadFabrica(it.def)
													: it.tool && loadBilling(it.tool)
											}
											className={`flex w-full items-center gap-2.5 border-b border-white/5 px-3 py-2.5 text-left transition-colors ${selectedKey === it.key ? 'bg-emerald-500/10' : 'hover:bg-white/[0.03]'}`}
										>
											<Glyph
												name={it.icon}
												className="h-4 w-4 shrink-0 text-slate-400"
											/>
											<span className="min-w-0 flex-1">
												<span className="block truncate text-sm text-slate-200">
													{it.name}
												</span>
												<span className="block truncate font-mono text-[10px] text-slate-500">
													{it.key}
												</span>
											</span>
											<span
												className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${it.kind === 'fabrica' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-400'}`}
											>
												{it.kind === 'fabrica' ? 'fábrica' : 'código'}
											</span>
										</button>
									))}
									{items.length === 0 && !tools.isLoading && (
										<p className="p-4 text-xs text-slate-500">
											Nenhuma ferramenta.
										</p>
									)}
								</div>
							</div>
						</aside>
					)}

					{/* centro */}
					<main className="space-y-5">
						{view === 'billing' && billingTool ? (
							<ToolBillingPanel tool={billingTool} />
						) : view === 'gallery' || !state ? (
							<Gallery onPick={startNew} />
						) : (
							<>
								{/* identidade */}
								<Section
									step="01"
									title="Identidade"
									subtitle="Nome e ícone que o cliente vê."
									icon={<Glyph name={state.icon} className="h-4 w-4" />}
								>
									<div className="grid gap-3 sm:grid-cols-2">
										<div className="sm:col-span-2">
											<label
												htmlFor="tb-title"
												className="mb-1 block text-[11px] font-medium text-slate-400"
											>
												Nome
											</label>
											<input
												id="tb-title"
												value={state.title}
												onChange={(e) => {
													const title = e.target.value;
													patch({
														title,
														toolKey:
															keyTouched || selectedDefId
																? state.toolKey
																: slugifyKey(title),
													});
												}}
												placeholder="Ex.: Vetorizar logo"
												className={fieldCls}
											/>
										</div>
										<div>
											<label
												htmlFor="tb-key"
												className="mb-1 block text-[11px] font-medium text-slate-400"
											>
												Identificador{' '}
												<span className="text-slate-600">(único)</span>
											</label>
											<input
												id="tb-key"
												value={state.toolKey}
												disabled={!!selectedDefId}
												onChange={(e) => {
													setKeyTouched(true);
													patch({ toolKey: slugifyKey(e.target.value) });
												}}
												placeholder="vetorizar_logo"
												className={`${fieldCls} font-mono disabled:opacity-50`}
											/>
										</div>
										<div>
											<label
												htmlFor="tb-action"
												className="mb-1 block text-[11px] font-medium text-slate-400"
											>
												Texto do botão
											</label>
											<input
												id="tb-action"
												value={state.actionLabel}
												onChange={(e) => patch({ actionLabel: e.target.value })}
												className={fieldCls}
											/>
										</div>
										<div className="sm:col-span-2">
											<label
												htmlFor="tb-desc"
												className="mb-1 block text-[11px] font-medium text-slate-400"
											>
												Descrição
											</label>
											<input
												id="tb-desc"
												value={state.description}
												onChange={(e) => patch({ description: e.target.value })}
												placeholder="O que ela faz, em uma linha."
												className={fieldCls}
											/>
										</div>
										<div className="sm:col-span-2">
											<span className="mb-1.5 block text-[11px] font-medium text-slate-400">
												Ícone
											</span>
											<div className="flex flex-wrap gap-1.5">
												{TOOL_ICONS.map(({ name, Icon }) => (
													<button
														key={name}
														type="button"
														onClick={() => patch({ icon: name })}
														className={`flex h-9 w-9 items-center justify-center rounded-lg border ${state.icon === name ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-black/20 text-slate-400 hover:text-slate-200'}`}
													>
														<Icon className="h-4 w-4" />
													</button>
												))}
											</div>
										</div>
									</div>
								</Section>

								{/* entradas */}
								<Section
									step="02"
									title="O que o cliente envia"
									subtitle="Os campos do formulário."
									icon={<Sparkles className="h-4 w-4" />}
									accent="sky"
									delay={60}
								>
									<div className="space-y-2">
										{state.fields.map((f) => (
											<FieldRow
												key={f.name}
												field={f}
												onChange={(nf) =>
													patch({
														fields: state.fields.map((x) =>
															x.name === nf.name ? nf : x,
														),
													})
												}
												onRemove={() =>
													patch({
														fields: state.fields.filter(
															(x) => x.name !== f.name,
														),
													})
												}
											/>
										))}
									</div>
									<div className="mt-3 flex flex-wrap items-center gap-1.5">
										<span className="text-[11px] text-slate-500">
											+ adicionar:
										</span>
										{FIELD_TYPES.map((ft) => (
											<button
												key={ft.type}
												type="button"
												onClick={() => addField(ft.type)}
												className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-slate-300 hover:border-sky-400/40 hover:text-white"
											>
												{ft.label}
											</button>
										))}
									</div>
								</Section>

								{/* pipeline */}
								<Section
									step="03"
									title="O que a ferramenta faz"
									subtitle="Ligue a saída de uma etapa na entrada da outra."
									icon={<Workflow className="h-4 w-4" />}
									accent="cyan"
									delay={120}
								>
									<div className="mb-3 inline-flex rounded-lg border border-white/10 bg-black/20 p-0.5">
										{(['canvas', 'steps'] as const).map((m) => (
											<button
												key={m}
												type="button"
												onClick={() => setPipelineMode(m)}
												className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
													pipelineMode === m
														? 'bg-cyan-500/15 text-cyan-300'
														: 'text-slate-400 hover:text-slate-200'
												}`}
											>
												{m === 'canvas' ? 'Canvas' : 'Etapas'}
											</button>
										))}
									</div>

									{pipelineMode === 'canvas' ? (
										<ToolCanvas state={state} onChange={(s) => setState(s)} />
									) : (
										<>
											<div className="space-y-2">
												{state.nodes.map((n, i) => (
													<StepCard
														key={n.id}
														node={n}
														index={i}
														total={state.nodes.length}
														state={state}
														onParam={(param, v) =>
															patch({
																nodes: state.nodes.map((x) =>
																	x.id === n.id
																		? {
																				...x,
																				params: { ...x.params, [param]: v },
																			}
																		: x,
																),
															})
														}
														onMove={(dir) => moveNode(i, dir)}
														onRemove={() =>
															patch({
																nodes: state.nodes.filter((x) => x.id !== n.id),
															})
														}
													/>
												))}
											</div>
											<div className="mt-3 flex flex-wrap items-center gap-1.5">
												<span className="text-[11px] text-slate-500">
													+ etapa:
												</span>
												{BLOCK_CATALOG.map((b) => (
													<button
														key={b.id}
														type="button"
														onClick={() => addNode(b.id)}
														className={`flex items-center gap-1 rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-slate-300 ${ac(b.accent).nodeHover} hover:text-white`}
													>
														<Glyph name={b.icon} className="h-3.5 w-3.5" />{' '}
														{b.label}
													</button>
												))}
											</div>
										</>
									)}
								</Section>

								{/* saída */}
								<Section
									step="04"
									title="Resultado"
									subtitle="O que o cliente recebe no final."
									icon={<Eye className="h-4 w-4" />}
									accent="violet"
									delay={180}
								>
									<div className="space-y-3">
										<div className="flex flex-wrap items-center gap-2">
											<span className="w-28 text-xs font-medium text-slate-300">
												Arquivo final
											</span>
											<select
												value={state.output.primary}
												onChange={(e) =>
													patch({
														output: {
															...state.output,
															primary: e.target.value,
														},
													})
												}
												className={`min-w-[12rem] flex-1 ${smallSelect} ${state.output.primary ? 'text-violet-200' : 'text-slate-500'}`}
											>
												<option value="">— escolha a saída —</option>
												{outputs.map((o) => (
													<option key={o.value} value={o.value}>
														{o.label}
													</option>
												))}
											</select>
										</div>
										<div className="flex flex-wrap items-center gap-2">
											<span className="w-28 text-xs font-medium text-slate-300">
												Prévia (opcional)
											</span>
											<select
												value={state.output.preview}
												onChange={(e) =>
													patch({
														output: {
															...state.output,
															preview: e.target.value,
														},
													})
												}
												className={`min-w-[12rem] flex-1 ${smallSelect}`}
											>
												<option value="">— nenhuma —</option>
												{outputs.map((o) => (
													<option key={o.value} value={o.value}>
														{o.label}
													</option>
												))}
											</select>
										</div>
										{numberOutputs.length > 0 && (
											<div className="flex flex-wrap items-start gap-2">
												<span className="w-28 shrink-0 text-xs font-medium text-slate-300">
													Detalhes (chips)
												</span>
												<div className="flex flex-1 flex-wrap gap-1.5">
													{numberOutputs.map((o) => {
														const on = state.output.meta.includes(o.value);
														return (
															<button
																key={o.value}
																type="button"
																onClick={() =>
																	patch({
																		output: {
																			...state.output,
																			meta: on
																				? state.output.meta.filter(
																						(m) => m !== o.value,
																					)
																				: [...state.output.meta, o.value],
																		},
																	})
																}
																className={`rounded-md px-2 py-1 text-[11px] ${on ? 'bg-violet-500/15 text-violet-300' : 'bg-white/5 text-slate-500'}`}
															>
																{o.label}
															</button>
														);
													})}
												</div>
											</div>
										)}
									</div>
								</Section>

								{/* cobrança */}
								<Section
									step="05"
									title="Preço e planos"
									subtitle="Custo por uso e cota grátis por plano."
									icon={<Rocket className="h-4 w-4" />}
									accent="amber"
									delay={240}
								>
									<div className="mb-4 flex items-center gap-3">
										<span className="text-sm text-slate-300">
											Custo por uso
										</span>
										<input
											type="number"
											step={0.05}
											min={0}
											value={state.voxCost}
											onChange={(e) =>
												patch({ voxCost: Math.max(0, Number(e.target.value)) })
											}
											className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm font-mono text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
										/>
										<span className="font-mono text-xs text-amber-400/80">
											vox / uso
										</span>
									</div>
									<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
										{(plans.data ?? []).map((p) => {
											const q = state.freeQuota[p.key] ?? 0;
											const unlimited = q === null;
											return (
												<div
													key={p.id}
													className="rounded-xl border border-white/10 bg-black/20 p-3"
												>
													<div className="flex items-center justify-between">
														<span className="text-sm font-medium text-slate-200">
															{p.name}
														</span>
														<button
															type="button"
															onClick={() =>
																patch({
																	freeQuota: {
																		...state.freeQuota,
																		[p.key]: unlimited ? 0 : null,
																	},
																})
															}
															className={`rounded-md px-2 py-1 text-[10px] font-semibold ${unlimited ? 'bg-cyan-500/15 text-cyan-300' : 'bg-white/5 text-slate-500'}`}
														>
															∞
														</button>
													</div>
													<input
														type="number"
														min={0}
														disabled={unlimited}
														value={unlimited ? '' : (q ?? 0)}
														onChange={(e) =>
															patch({
																freeQuota: {
																	...state.freeQuota,
																	[p.key]: Math.max(0, Number(e.target.value)),
																},
															})
														}
														placeholder={unlimited ? '∞' : '0'}
														className="mt-2 w-full rounded-md border border-white/10 bg-black/30 px-2 py-1 text-sm text-slate-100 disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
													/>
												</div>
											);
										})}
									</div>
								</Section>

								{/* avançado */}
								<div className="forge-rise overflow-hidden rounded-2xl border border-white/10 bg-[#0c0f12]/80">
									<button
										type="button"
										onClick={() => setAdvancedOpen((o) => !o)}
										className="flex w-full items-center gap-2 px-5 py-3 text-left"
									>
										<Code2 className="h-4 w-4 text-slate-400" />
										<span className="text-sm font-medium text-slate-300">
											Avançado · JSON
										</span>
										<span className="ml-auto flex items-center gap-2">
											{mode === 'json' && (
												<span className="font-mono text-[10px] text-cyan-300">
													manual
												</span>
											)}
											<ChevronDown
												className={`h-4 w-4 text-slate-500 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
											/>
										</span>
									</button>
									{advancedOpen && (
										<div className="space-y-2 px-5 pb-5">
											{mode === 'visual' ? (
												<>
													<pre className="max-h-72 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-slate-300">
														{derivedDoc
															? JSON.stringify(derivedDoc, null, 2)
															: '// incompleto'}
													</pre>
													<button
														type="button"
														onClick={() => {
															if (state)
																setJson(
																	JSON.stringify(buildDoc(state), null, 2),
																);
															setMode('json');
														}}
														className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300"
													>
														Editar JSON manualmente
													</button>
												</>
											) : (
												<>
													<textarea
														value={json}
														onChange={(e) => setJson(e.target.value)}
														spellCheck={false}
														rows={18}
														className="w-full rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
													/>
													<button
														type="button"
														onClick={() => setMode('visual')}
														className="text-xs text-slate-400 hover:text-slate-200"
													>
														← voltar ao modo visual
													</button>
												</>
											)}
										</div>
									)}
								</div>
							</>
						)}
					</main>

					{/* direita: preview ao vivo (só no editor, quando visível) */}
					{view === 'editor' && state && showPreview && (
						<aside className="space-y-3 self-start lg:sticky lg:top-[148px]">
							<div className="flex items-center gap-2 text-emerald-300">
								<Eye className="h-4 w-4" />
								<span className="font-mono text-[11px] uppercase tracking-widest">
									Como o cliente vê
								</span>
							</div>
							<div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0f12]/80">
								{previewDef ? (
									<div className="origin-top scale-[0.98]">
										<DynamicToolView
											toolKey={previewDef.tool_key}
											definitionOverride={previewDef}
										/>
									</div>
								) : (
									<p className="p-6 text-sm text-rose-400">
										Definição incompleta — confira as etapas / o resultado.
									</p>
								)}
							</div>
							{!selectedDefId && (
								<p className="flex items-center gap-1.5 text-[11px] text-slate-500">
									<Check className="h-3 w-3" /> salve pra liberar a publicação
								</p>
							)}
						</aside>
					)}

					{/* extrema direita: agente que monta a ferramenta ao vivo */}
					{view === 'editor' && state && showAgent && (
						<ToolAgentChat state={state} setState={setState} />
					)}
				</div>
			</div>
		</div>
	);
}
