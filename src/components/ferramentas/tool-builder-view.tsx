'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	ArrowLeft,
	ArrowRight,
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Code2,
	Database,
	Eye,
	Link2,
	Loader2,
	MonitorSmartphone,
	Plus,
	Rocket,
	Save,
	Search,
	Sparkles,
	Trash2,
	Unlink,
	Workflow,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { usePlans } from '@/modules/plans/hooks/use-plans';
import { DynamicRoomView } from '@/modules/tools/components/dynamic-room-view';
import { DynamicToolView } from '@/modules/tools/components/dynamic-tool-view';
import { useTools } from '@/modules/tools/hooks/use-tools';
import { resolveToolIcon, TOOL_ICONS } from '@/modules/tools/lib/tool-icons';
import {
	type AiToolDefinition,
	type BankConfig,
	bankConfigSchema,
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
	type BuilderNode,
	type BuilderState,
	buildDoc,
	defaultRoom,
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
import {
	Field,
	FieldCard,
	FormSection,
	IconPicker,
	inputCls,
	SegmentedControl,
	SelectInput,
	type StepDef,
	StepperBar,
	TypeChip,
} from './builder-ui';
import { RoomFlowCanvas } from './canvas/room-flow-canvas';
import { ToolCanvas } from './canvas/tool-canvas';
import { RoomAppearanceSection } from './room-appearance-section';
import { RoomBuilderSections } from './room-builder-sections';
import { type PreviewDevice, RoomLivePreview } from './room-live-preview';
import { ToolBankConfigEditor } from './tool-bank-config-editor';
import { ToolBankManager } from './tool-bank-manager';
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
	fuchsia: {
		bar: 'bg-fuchsia-400/70',
		chip: 'bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/20',
		cardHover: 'hover:border-fuchsia-400/50 hover:shadow-fuchsia-500/40',
		nodeHover: 'hover:border-fuchsia-400/50',
		badge: 'bg-fuchsia-500/20 text-fuchsia-300 ring-fuchsia-400/30',
		ico: 'bg-fuchsia-500/15 text-fuchsia-300',
		text: 'text-fuchsia-300',
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

const smallSelect =
	'h-9 rounded-lg border border-white/10 bg-black/30 px-2.5 text-xs text-slate-200 focus-visible:outline-none focus-visible:border-emerald-400/50 focus-visible:ring-2 focus-visible:ring-emerald-400/30';

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
	const [showAgent, setShowAgent] = useState(true);
	// Coluna direita na aba Edição: agente OU prévia ao vivo (Acompanhar).
	const [rightMode, setRightMode] = useState<'agent' | 'preview'>('agent');
	const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
	// Aparência: tela editada + campo selecionado (sync form ⇄ prévia clicável).
	const [apScreen, setApScreen] = useState<'customer' | 'admin'>('customer');
	const [apSelected, setApSelected] = useState<string>();
	// Abas do editor em largura total: Edição (builder) | Aluno/Cliente | Admin | Banco.
	const [editorTab, setEditorTab] = useState<
		'edit' | 'canvas' | 'customer' | 'admin' | 'bank'
	>('edit');
	// "Configurar banco": editor da config (enable + fields + inject) por cima do manager.
	const [bankConfigOpen, setBankConfigOpen] = useState(false);

	// Clique na prévia → seleciona + rola/foca o campo no formulário da Aparência.
	const focusField = (field: string) => {
		setApSelected(field);
		if (typeof document === 'undefined') return;
		const el = document.getElementById(
			field === 'banner' ? 'ap-banner' : `ap-${field}`,
		);
		if (!el) return;
		el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		if (el instanceof HTMLInputElement) el.focus({ preventScroll: true });
	};

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
		setActiveStep(0);
		setFlowMounted(false);
		setEditorTab('edit');
		setBankConfigOpen(false);
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
		setActiveStep(0);
		setFlowMounted(false);
		setEditorTab('edit');
		setBankConfigOpen(false);
		setView('editor');
	};

	// Deep-link `?open=<defId>` (vindo do menu admin p/ tools de pipeline): abre
	// essa tool no editor. Rastreia o último id tratado (e não um booleano), pois
	// /ferramentas é o mesmo segmento de rota — trocar de tool pela sidebar muda só
	// o search param sem desmontar, então precisamos recarregar quando o id muda.
	const searchParams = useSearchParams();
	const lastOpenedRef = useRef<string | null>(null);
	// biome-ignore lint/correctness/useExhaustiveDependencies: guard por lastOpenedRef
	useEffect(() => {
		const openId = searchParams.get('open');
		if (!openId || openId === lastOpenedRef.current || !defs.data) return;
		const found = defs.data.find((d) => d.id === openId);
		if (found) {
			lastOpenedRef.current = openId;
			loadFabrica(found);
		}
	}, [searchParams, defs.data]);

	const loadBilling = (tool: Tool) => {
		setBillingTool(tool);
		setState(null);
		setSelectedKey(tool.key);
		setSelectedDefId(null);
		setView('billing');
	};

	// status (rascunho/publicada) da definition aberta, p/ o cabeçalho do editor
	// e pro Banco (config + manager dependem da definition salva).
	const openDef = useMemo(
		() => (defs.data ?? []).find((d) => d.id === selectedDefId) ?? null,
		[defs.data, selectedDefId],
	);

	// Config do banco da definition aberta (default desligado se a tool não tem).
	const bankConfig = useMemo<BankConfig>(
		() => bankConfigSchema.parse(openDef?.definition.bank ?? {}),
		[openDef],
	);

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

	const previewDef = useMemo<AiToolDefinition | null>(
		() =>
			derivedDoc && state
				? {
						id: selectedDefId ?? 'draft',
						tool_key: state.toolKey || 'preview',
						version: 0,
						status: 'draft',
						title: state.title || 'Pré-visualização',
						description: state.description || null,
						engine_runtime: (derivedDoc as { room?: unknown }).room
							? 'room_v1'
							: 'blocks_v1',
						definition: derivedDoc,
					}
				: null,
		[derivedDoc, state, selectedDefId],
	);

	// Abas do editor: sala → Edição/Aluno/Admin; pipeline → Edição/Cliente.
	const isRoomDraft = previewDef?.engine_runtime === 'room_v1';
	const editorTabs = useMemo<
		{ id: 'edit' | 'canvas' | 'customer' | 'admin' | 'bank'; label: string }[]
	>(
		() =>
			isRoomDraft
				? [
						{ id: 'edit', label: 'Edição' },
						{ id: 'canvas', label: 'Canvas' },
						{ id: 'customer', label: 'Aluno' },
						{ id: 'admin', label: 'Admin' },
					]
				: [
						{ id: 'edit', label: 'Edição' },
						{ id: 'canvas', label: 'Canvas' },
						{ id: 'customer', label: 'Cliente' },
						// Banco do Admin: só faz sentido depois de salva (tem id), mas
						// sempre deixamos abrir (o manager avisa se está desativado).
						...(selectedDefId ? [{ id: 'bank' as const, label: 'Banco' }] : []),
					],
		[isRoomDraft, selectedDefId],
	);
	// Se a aba ativa some (ex.: 'admin' numa tool de pipeline), volta p/ Edição.
	useEffect(() => {
		if (!editorTabs.some((t) => t.id === editorTab)) setEditorTab('edit');
	}, [editorTabs, editorTab]);

	const saveMut = useMutation({
		mutationFn: async () => {
			if (!state) throw new Error('sem estado');
			const definition =
				mode === 'json'
					? toolDefinitionDocSchema.parse(JSON.parse(json))
					: buildDoc(state);
			// O tipo de motor segue o doc: sala (room) → room_v1; senão blocks_v1.
			const engine_runtime = (definition as { room?: unknown }).room
				? 'room_v1'
				: 'blocks_v1';
			if (selectedDefId) {
				return updateToolDefinition(selectedDefId, {
					title: state.title,
					description: state.description || null,
					engine_runtime,
					definition,
				});
			}
			return createToolDefinition({
				tool_key: state.toolKey,
				title: state.title,
				description: state.description || undefined,
				engine_runtime,
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

	// Salva a CONFIG do banco na definition aberta (patch do doc + publish) — é o
	// que liga a galeria pro cliente e ensina o motor a injetar os campos.
	const saveBankMut = useMutation({
		mutationFn: async (bank: BankConfig) => {
			if (!selectedDefId || !openDef)
				throw new Error('salve a ferramenta antes');
			const nextDoc = {
				...openDef.definition,
				bank,
			} as ToolDefinitionDoc;
			await updateToolDefinition(selectedDefId, { definition: nextDoc });
			return publishToolDefinition(selectedDefId);
		},
		onSuccess: () => {
			toast.success('Banco configurado e publicado 🚀');
			qc.invalidateQueries({ queryKey: ['tool-definitions'] });
			qc.invalidateQueries({ queryKey: ['tools'] });
			setBankConfigOpen(false);
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Falha ao configurar o banco.')),
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

	// Wizard: 1 passo por tela. Os passos dependem do tipo de tool.
	const steps = useMemo<StepDef[]>(() => {
		if (!state) return [];
		if (state.toolType === 'room')
			return [
				{
					id: 'builder-step-01',
					label: 'Identidade',
					accent: 'emerald',
					done: !!state.title && !!state.toolKey,
				},
				{
					id: 'builder-step-02',
					label: 'Sala',
					accent: 'cyan',
					done: !!state.room,
				},
				{
					id: 'builder-step-03',
					label: 'Acesso',
					accent: 'amber',
					done:
						(state.room?.includedPlanKeys.length ?? 0) > 0 ||
						(state.room?.voxCost ?? 0) > 0,
				},
				{
					id: 'builder-step-04',
					label: 'Aparência',
					accent: 'violet',
					done: !!state.room?.ui,
				},
			];
		return [
			{
				id: 'builder-step-01',
				label: 'Identidade',
				accent: 'emerald',
				done: !!state.title && !!state.toolKey,
			},
			{
				id: 'builder-step-02',
				label: 'Campos',
				accent: 'sky',
				done: state.fields.length > 0,
			},
			// O "Fluxo" (canvas) saiu do wizard — agora vive na aba Canvas.
			{
				id: 'builder-step-03',
				label: 'Resultado',
				accent: 'violet',
				done: !!state.output.primary,
			},
			{
				id: 'builder-step-04',
				label: 'Preço',
				accent: 'amber',
				done:
					state.voxCost > 0 ||
					Object.values(state.freeQuota).some((v) => v !== 0),
			},
		];
	}, [state]);

	const [activeStep, setActiveStep] = useState(0);
	// Clampa quando o nº de passos muda (ex.: troca de tipo de tool).
	useEffect(() => {
		if (steps.length > 0 && activeStep > steps.length - 1) setActiveStep(0);
	}, [steps.length, activeStep]);
	const activeId = steps[activeStep]?.id ?? 'builder-step-01';
	// Aba "Canvas": monta na 1ª visita e fica montada (escondida via CSS) p/
	// preservar o arranjo manual dos nós ao trocar de aba.
	const [flowMounted, setFlowMounted] = useState(false);
	useEffect(() => {
		if (editorTab === 'canvas') setFlowMounted(true);
	}, [editorTab]);
	const goStep = (id: string) => {
		const i = steps.findIndex((s) => s.id === id);
		if (i >= 0) setActiveStep(i);
		if (typeof window !== 'undefined')
			window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	// colunas do container por tela: galeria = lista + grade; cobrança = centrado.
	// Editor: na aba Edição, trabalho (+ agente opcional ao lado); nas abas de
	// preview (Aluno/Admin), largura total.
	const previewing =
		editorTab === 'edit' && showAgent && rightMode === 'preview' && isRoomDraft;
	const gridCls =
		view === 'editor'
			? editorTab === 'edit' && showAgent
				? previewing
					? 'grid gap-5 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]'
					: 'grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]'
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
									{editorTab === 'edit' && (
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
									)}
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

				{/* abas em largura total: Edição (builder) | Aluno/Cliente | Admin */}
				{view === 'editor' && state && (
					<div className="forge-rise mb-5 flex items-center gap-1 overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#0a0c10]/90 p-1.5">
						{editorTabs.map((t) => {
							const on = editorTab === t.id;
							return (
								<button
									key={t.id}
									type="button"
									aria-current={on ? 'page' : undefined}
									onClick={() => setEditorTab(t.id)}
									className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
										on
											? t.id === 'edit'
												? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30'
												: 'bg-white/10 text-white ring-1 ring-white/15'
											: 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
									}`}
								>
									{t.id === 'edit' ? (
										<Save className="h-4 w-4" />
									) : t.id === 'canvas' ? (
										<Workflow className="h-4 w-4" />
									) : t.id === 'bank' ? (
										<Database className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
									{t.label}
								</button>
							);
						})}
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
						) : editorTab ===
							'canvas' ? /* o canvas real é o irmão sempre-montado abaixo (preserva
							   o arranjo) — aqui só evitamos cair no preview/wizard */
						null : editorTab === 'bank' ? (
							/* Banco do Admin: gerenciador de registros (+ configurar config) */
							<div className="mx-auto w-full max-w-3xl">
								{bankConfigOpen ? (
									<ToolBankConfigEditor
										config={bankConfig}
										saving={saveBankMut.isPending}
										onSave={(c) => saveBankMut.mutate(c)}
										onClose={() => setBankConfigOpen(false)}
									/>
								) : (
									<ToolBankManager
										toolKey={state.toolKey}
										bank={bankConfig}
										onConfigure={() => setBankConfigOpen(true)}
									/>
								)}
							</div>
						) : editorTab !== 'edit' ? (
							/* abas de preview em largura total */
							previewDef ? (
								<div
									className={
										previewDef.engine_runtime === 'room_v1'
											? 'mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-slate-50 p-4 dark:bg-[#0c0f12]'
											: 'mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0c0f12]/80'
									}
								>
									{previewDef.engine_runtime === 'room_v1' ? (
										<DynamicRoomView
											toolKey={previewDef.tool_key}
											definitionOverride={previewDef}
											previewAs={editorTab === 'admin' ? 'admin' : 'customer'}
										/>
									) : (
										<DynamicToolView
											toolKey={previewDef.tool_key}
											definitionOverride={previewDef}
										/>
									)}
								</div>
							) : (
								<p className="rounded-2xl border border-white/10 bg-[#0c0f12]/80 p-8 text-center text-sm text-rose-400">
									Definição incompleta — volte à aba Edição e confira as etapas.
								</p>
							)
						) : (
							<>
								<div className="sticky top-[142px] z-10 mb-1">
									<StepperBar
										steps={steps}
										activeId={activeId}
										onSelect={goStep}
									/>
								</div>
								{/* identidade */}
								{activeId === 'builder-step-01' && (
									<FormSection
										step="01"
										title="Identidade"
										subtitle="Nome e ícone que o cliente vê."
										icon={<Glyph name={state.icon} className="h-4 w-4" />}
									>
										<div className="grid gap-5 sm:grid-cols-2">
											<Field
												label="Nome"
												htmlFor="tb-title"
												className="sm:col-span-2"
											>
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
													className={inputCls}
												/>
											</Field>
											<Field
												label="Identificador"
												hint="único · não muda depois"
												htmlFor="tb-key"
											>
												<input
													id="tb-key"
													value={state.toolKey}
													disabled={!!selectedDefId}
													onChange={(e) => {
														setKeyTouched(true);
														patch({ toolKey: slugifyKey(e.target.value) });
													}}
													placeholder="vetorizar_logo"
													className={`${inputCls} font-mono`}
												/>
											</Field>
											<Field label="Texto do botão" htmlFor="tb-action">
												<input
													id="tb-action"
													value={state.actionLabel}
													onChange={(e) =>
														patch({ actionLabel: e.target.value })
													}
													placeholder="Gerar"
													className={inputCls}
												/>
											</Field>
											<Field
												label="Descrição"
												hint="uma linha"
												htmlFor="tb-desc"
												className="sm:col-span-2"
											>
												<input
													id="tb-desc"
													value={state.description}
													onChange={(e) =>
														patch({ description: e.target.value })
													}
													placeholder="O que ela faz, em poucas palavras."
													className={inputCls}
												/>
											</Field>
											<Field label="Ícone" className="sm:col-span-2">
												<IconPicker
													value={state.icon}
													onChange={(name) => patch({ icon: name })}
													icons={TOOL_ICONS}
												/>
											</Field>
										</div>
									</FormSection>
								)}

								{state.toolType === 'room' ? (
									<>
										{(activeId === 'builder-step-02' ||
											activeId === 'builder-step-03') && (
											<RoomBuilderSections
												room={state.room ?? defaultRoom()}
												plans={plans.data ?? []}
												plansLoading={plans.isLoading}
												section={
													activeId === 'builder-step-03' ? 'access' : 'room'
												}
												setRoom={(partial) =>
													patch({
														room: {
															...(state.room ?? defaultRoom()),
															...partial,
														},
													})
												}
											/>
										)}
										{activeId === 'builder-step-04' && (
											<div className="space-y-4">
												<button
													type="button"
													onClick={() => {
														setShowAgent(true);
														setRightMode(
															rightMode === 'preview' ? 'agent' : 'preview',
														);
													}}
													className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
														previewing
															? 'border-violet-400/40 bg-violet-500/15 text-violet-100'
															: 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
													}`}
												>
													<MonitorSmartphone className="h-4 w-4" />
													{previewing
														? 'Prévia ao vivo aberta ao lado'
														: 'Acompanhar em tempo real (Celular / PC)'}
												</button>
												<RoomAppearanceSection
													room={state.room ?? defaultRoom()}
													screen={apScreen}
													onScreenChange={setApScreen}
													selectedField={apSelected}
													onFieldFocus={setApSelected}
													setRoom={(partial) =>
														patch({
															room: {
																...(state.room ?? defaultRoom()),
																...partial,
															},
														})
													}
												/>
											</div>
										)}
									</>
								) : (
									<>
										{/* entradas */}
										{activeId === 'builder-step-02' && (
											<FormSection
												step="02"
												title="O que o cliente envia"
												subtitle="Os campos do formulário."
												icon={<Sparkles className="h-4 w-4" />}
												accent="sky"
												delay={60}
											>
												<div className="space-y-2">
													{state.fields.map((f) => (
														<FieldCard
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
												<div className="mt-4 flex flex-wrap items-center gap-2">
													<span className="text-[13px] text-slate-500">
														+ adicionar
													</span>
													{FIELD_TYPES.map((ft) => (
														<TypeChip
															key={ft.type}
															onClick={() => addField(ft.type)}
														>
															{ft.label}
														</TypeChip>
													))}
												</div>
											</FormSection>
										)}

										{/* saída */}
										{activeId === 'builder-step-03' && (
											<FormSection
												step="03"
												title="Resultado"
												subtitle="O que o cliente recebe no final."
												icon={<Eye className="h-4 w-4" />}
												accent="violet"
												delay={180}
											>
												<div className="space-y-5">
													<Field label="Arquivo final" htmlFor="out-primary">
														<SelectInput
															id="out-primary"
															value={state.output.primary}
															onChange={(v) =>
																patch({
																	output: { ...state.output, primary: v },
																})
															}
															muted={!state.output.primary}
														>
															<option value="">— escolha a saída —</option>
															{outputs.map((o) => (
																<option key={o.value} value={o.value}>
																	{o.label}
																</option>
															))}
														</SelectInput>
													</Field>
													<Field
														label="Prévia"
														hint="opcional"
														htmlFor="out-preview"
													>
														<SelectInput
															id="out-preview"
															value={state.output.preview}
															onChange={(v) =>
																patch({
																	output: { ...state.output, preview: v },
																})
															}
															muted={!state.output.preview}
														>
															<option value="">— nenhuma —</option>
															{outputs.map((o) => (
																<option key={o.value} value={o.value}>
																	{o.label}
																</option>
															))}
														</SelectInput>
													</Field>
													{numberOutputs.length > 0 && (
														<Field
															label="Detalhes"
															hint="números mostrados como etiqueta no resultado"
														>
															<div className="flex flex-wrap gap-2">
																{numberOutputs.map((o) => {
																	const on = state.output.meta.includes(
																		o.value,
																	);
																	return (
																		<button
																			key={o.value}
																			type="button"
																			aria-pressed={on}
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
																			className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${on ? 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/30' : 'bg-white/[0.04] text-slate-400 hover:text-slate-200'}`}
																		>
																			{o.label}
																		</button>
																	);
																})}
															</div>
														</Field>
													)}
												</div>
											</FormSection>
										)}

										{/* cobrança */}
										{activeId === 'builder-step-04' && (
											<FormSection
												step="04"
												title="Preço e planos"
												subtitle="Custo por uso e cota grátis por plano."
												icon={<Rocket className="h-4 w-4" />}
												accent="amber"
												delay={240}
											>
												<Field
													label="Custo por uso"
													hint="cobrado em voxes"
													htmlFor="vox-cost"
													className="mb-5 max-w-[14rem]"
												>
													<div className="relative">
														<input
															id="vox-cost"
															type="number"
															step={0.05}
															min={0}
															value={state.voxCost}
															onChange={(e) =>
																patch({
																	voxCost: Math.max(0, Number(e.target.value)),
																})
															}
															className={`${inputCls} pr-16 font-mono text-amber-200`}
														/>
														<span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-amber-400/80">
															vox/uso
														</span>
													</div>
												</Field>
												<Field
													label="Cota grátis por plano"
													hint="quantos usos sem cobrar"
												>
													<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
														{(plans.data ?? []).map((p) => {
															const q = state.freeQuota[p.key] ?? 0;
															const unlimited = q === null;
															return (
																<div
																	key={p.id}
																	className="rounded-xl border border-white/10 bg-black/20 p-3"
																>
																	<div className="flex items-center justify-between gap-2">
																		<span className="truncate text-[13px] font-medium text-slate-200">
																			{p.name}
																		</span>
																		<button
																			type="button"
																			aria-pressed={unlimited}
																			title="Ilimitado"
																			onClick={() =>
																				patch({
																					freeQuota: {
																						...state.freeQuota,
																						[p.key]: unlimited ? 0 : null,
																					},
																				})
																			}
																			className={`rounded-md px-2 py-0.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${unlimited ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30' : 'bg-white/[0.06] text-slate-500 hover:text-slate-300'}`}
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
																					[p.key]: Math.max(
																						0,
																						Number(e.target.value),
																					),
																				},
																			})
																		}
																		placeholder={unlimited ? '∞' : '0'}
																		className="mt-2 h-9 w-full rounded-lg border border-white/10 bg-black/30 px-2.5 text-sm text-slate-100 placeholder:text-slate-500 disabled:opacity-40 focus-visible:outline-none focus-visible:border-emerald-400/50 focus-visible:ring-2 focus-visible:ring-emerald-400/30"
																	/>
																</div>
															);
														})}
													</div>
												</Field>
											</FormSection>
										)}

										{/* fim das seções de pipeline (sala usa Sala+Acesso acima) */}
									</>
								)}

								{/* navegação do wizard: 1 passo por tela */}
								<div className="forge-rise flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-[#0a0c10]/80 px-3 py-2.5">
									<button
										type="button"
										disabled={activeStep === 0}
										onClick={() =>
											goStep(steps[activeStep - 1]?.id ?? activeId)
										}
										className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.05] disabled:opacity-30 disabled:hover:bg-transparent"
									>
										<ChevronLeft className="h-4 w-4" /> Voltar
									</button>
									<span className="font-mono text-[11px] text-slate-500">
										Passo {activeStep + 1} de {steps.length}
									</span>
									{activeStep < steps.length - 1 ? (
										<button
											type="button"
											onClick={() =>
												goStep(steps[activeStep + 1]?.id ?? activeId)
											}
											className="flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-400/30 transition-colors hover:bg-emerald-500/25"
										>
											Avançar <ChevronRight className="h-4 w-4" />
										</button>
									) : (
										<span className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-400">
											<Check className="h-4 w-4 text-emerald-400" /> Última
											etapa
										</span>
									)}
								</div>

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
						{/* Canvas (aba própria): montado 1× e escondido via CSS p/
						    preservar o arranjo arrastado ao trocar de aba. */}
						{view === 'editor' && state && flowMounted && (
							<div className={editorTab === 'canvas' ? undefined : 'hidden'}>
								{isRoomDraft ? (
									<RoomFlowCanvas
										room={state.room ?? defaultRoom()}
										setRoom={(partial) =>
											patch({
												room: {
													...(state.room ?? defaultRoom()),
													...partial,
												},
											})
										}
										plans={plans.data ?? []}
										plansLoading={plans.isLoading}
										active={editorTab === 'canvas'}
									/>
								) : (
									<div className="space-y-4">
										<div className="flex flex-wrap items-center justify-between gap-3">
											<span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cyan-300">
												<Workflow className="h-4 w-4" /> funcionamento · ligue a
												saída de uma etapa na entrada da outra
											</span>
											<SegmentedControl
												value={pipelineMode}
												onChange={setPipelineMode}
												ariaLabel="Modo de montagem"
												options={[
													{ value: 'canvas', label: 'Canvas' },
													{ value: 'steps', label: 'Etapas' },
												]}
											/>
										</div>
										{pipelineMode === 'canvas' ? (
											<ToolCanvas
												state={state}
												onChange={(s) => setState(s)}
												active={editorTab === 'canvas'}
											/>
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
																					params: {
																						...x.params,
																						[param]: v,
																					},
																				}
																			: x,
																	),
																})
															}
															onMove={(dir) => moveNode(i, dir)}
															onRemove={() =>
																patch({
																	nodes: state.nodes.filter(
																		(x) => x.id !== n.id,
																	),
																})
															}
														/>
													))}
												</div>
												<div className="mt-4 flex flex-wrap items-center gap-2">
													<span className="text-[13px] text-slate-500">
														+ etapa
													</span>
													{BLOCK_CATALOG.map((b) => (
														<TypeChip
															key={b.id}
															onClick={() => addNode(b.id)}
															accent={b.accent}
															icon={<Glyph name={b.icon} className="h-4 w-4" />}
														>
															{b.label}
														</TypeChip>
													))}
												</div>
											</>
										)}
									</div>
								)}
							</div>
						)}
					</main>

					{/* coluna direita (só na aba Edição): agente OU prévia ao vivo */}
					{view === 'editor' &&
						state &&
						editorTab === 'edit' &&
						showAgent &&
						(previewing ? (
							<RoomLivePreview
								previewDef={previewDef}
								screen={apScreen}
								onScreenChange={setApScreen}
								device={previewDevice}
								onDeviceChange={setPreviewDevice}
								selected={apSelected}
								onPick={focusField}
								onBackToAgent={() => setRightMode('agent')}
							/>
						) : (
							<ToolAgentChat state={state} setState={setState} />
						))}
				</div>
			</div>
		</div>
	);
}
