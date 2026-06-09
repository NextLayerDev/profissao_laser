'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	ArrowRight,
	Check,
	ChevronDown,
	Code2,
	Eye,
	Infinity as InfinityIcon,
	Loader2,
	Plus,
	Rocket,
	Save,
	Sparkles,
	Workflow,
} from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DynamicToolView } from '@/modules/tools/components/dynamic-tool-view';
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
import { getApiErrorMessage } from '@/shared/lib/api-error';
import {
	BLOCK_META,
	BUILDER_PLANS,
	type BuilderField,
	type BuilderState,
	buildDocFromState,
	detectRecipeId,
	docToState,
	getRecipe,
	RECIPES,
	type Recipe,
	slugifyKey,
} from './recipes';

/* ───────────────────────── estilos do "forge" ───────────────────────── */

function ForgeStyles() {
	return (
		<style>{`
			.forge-grid{
				background-image:
					linear-gradient(to right, rgba(16,185,129,.06) 1px, transparent 1px),
					linear-gradient(to bottom, rgba(16,185,129,.06) 1px, transparent 1px);
				background-size: 28px 28px;
			}
			@keyframes forgeRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
			.forge-rise{animation:forgeRise .45s cubic-bezier(.22,1,.36,1) both}
			@keyframes forgeFlow{to{background-position:18px 0}}
			.forge-wire{
				background-image:repeating-linear-gradient(90deg,rgba(45,212,191,.9) 0 7px,transparent 7px 14px);
				background-size:18px 2px;background-repeat:no-repeat;background-position:0 50%;
				animation:forgeFlow .7s linear infinite;
			}
			@keyframes forgePulse{0%,100%{opacity:.35}50%{opacity:1}}
			.forge-pulse{animation:forgePulse 2.4s ease-in-out infinite}
			.forge-node{transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease}
			.forge-node:hover{transform:translateY(-2px)}
		`}</style>
	);
}

/* Classes LITERAIS por accent (Tailwind não enxerga classe interpolada). */
interface AccentClasses {
	bar: string;
	chip: string;
	cardHover: string;
	nodeHover: string;
	badge: string;
	ico: string;
	text: string;
}
const ACCENTS: Record<string, AccentClasses> = {
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
const accentOf = (a?: string): AccentClasses =>
	ACCENTS[a ?? ''] ?? ACCENTS.emerald;

/** Renderiza um ícone da Fábrica pelo nome (evita chamar componente como função). */
function Glyph({ name, className }: { name?: string; className?: string }) {
	const Icon = resolveToolIcon(name);
	return <Icon className={className} />;
}

/* ───────────────────────── primitivos de UI ───────────────────────── */

function SectionCard({
	step,
	title,
	subtitle,
	icon,
	accent = 'emerald',
	delay = 0,
	right,
	children,
}: {
	step: string;
	title: string;
	subtitle?: string;
	icon: ReactNode;
	accent?: string;
	delay?: number;
	right?: ReactNode;
	children: ReactNode;
}) {
	const ac = accentOf(accent);
	return (
		<section
			className="forge-rise relative rounded-2xl border border-white/10 bg-[#0c0f12]/80 backdrop-blur-sm overflow-hidden"
			style={{ animationDelay: `${delay}ms` }}
		>
			<div className={`absolute left-0 top-0 bottom-0 w-1 ${ac.bar}`} />
			<header className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-white/5">
				<div
					className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${ac.chip}`}
				>
					{icon}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className="font-mono text-[10px] tracking-widest text-emerald-400/70">
							{step}
						</span>
						<h2 className="text-sm font-semibold text-white truncate">
							{title}
						</h2>
					</div>
					{subtitle && (
						<p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
					)}
				</div>
				{right}
			</header>
			<div className="p-5">{children}</div>
		</section>
	);
}

const inputBase =
	'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40';

/* ───────────────────────── galeria de capacidades ───────────────────────── */

function CapabilityGallery({ onPick }: { onPick: (r: Recipe) => void }) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2 text-emerald-300">
				<Sparkles className="h-4 w-4" />
				<span className="font-mono text-[11px] tracking-widest uppercase">
					Escolha o que a ferramenta faz
				</span>
			</div>
			<div className="grid sm:grid-cols-2 gap-4">
				{RECIPES.map((r, i) => {
					const Icon = resolveToolIcon(r.icon);
					const ac = accentOf(r.accent);
					return (
						<button
							key={r.id}
							type="button"
							onClick={() => onPick(r)}
							style={{ animationDelay: `${i * 60}ms` }}
							className={`forge-rise forge-node group text-left rounded-2xl border border-white/10 bg-[#0c0f12]/80 p-5 hover:shadow-[0_0_40px_-12px] ${ac.cardHover}`}
						>
							<div
								className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${ac.chip}`}
							>
								<Icon className="h-6 w-6" />
							</div>
							<h3 className="text-base font-semibold text-white">{r.name}</h3>
							<p className="mt-1 text-sm text-slate-400">{r.tagline}</p>
							<span
								className={`mt-3 inline-flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity ${ac.text}`}
							>
								Começar <ArrowRight className="h-3.5 w-3.5" />
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}

/* ───────────────────────── editor de um campo ───────────────────────── */

function FieldEditor({
	field,
	onChange,
}: {
	field: BuilderField;
	onChange: (f: BuilderField) => void;
}) {
	const Icon = resolveToolIcon(
		field.type === 'image'
			? 'image'
			: field.widget === 'toggle'
				? 'zap'
				: 'box',
	);
	return (
		<div className="rounded-xl border border-white/10 bg-black/20 p-3">
			<div className="flex items-center gap-2">
				<Icon className="h-4 w-4 text-slate-400 shrink-0" />
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
						title={
							field.visible ? 'Visível no formulário' : 'Oculto (usa o padrão)'
						}
						className={`text-[10px] font-semibold px-2 py-1 rounded-md transition-colors ${
							field.visible
								? 'bg-emerald-500/15 text-emerald-300'
								: 'bg-white/5 text-slate-500'
						}`}
					>
						{field.visible ? 'visível' : 'oculto'}
					</button>
				)}
			</div>

			{/* config por tipo */}
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
				{field.type === 'enum' && field.options && (
					<select
						value={String(field.default ?? '')}
						onChange={(e) => onChange({ ...field, default: e.target.value })}
						className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs text-slate-200"
					>
						{field.options.map((o) => (
							<option key={String(o)} value={String(o)}>
								{String(o)}
							</option>
						))}
					</select>
				)}
				{field.hint && (
					<span className="text-[11px] text-slate-500">{field.hint}</span>
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
	value: number | undefined;
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

/* ───────────────────────── diagrama do fluxo ───────────────────────── */

function FlowDiagram({ doc }: { doc: ToolDefinitionDoc | null }) {
	const nodes = (doc?.pipeline ?? []) as { id: string; block: string }[];
	if (!nodes.length) {
		return <p className="text-sm text-slate-500">O fluxo aparece aqui.</p>;
	}
	return (
		<div className="flex items-stretch gap-0 overflow-x-auto pb-2">
			{nodes.map((n, i) => {
				const meta = BLOCK_META[n.block] ?? {
					label: n.block,
					sub: '',
					icon: 'box',
					accent: 'slate',
				};
				const Icon = resolveToolIcon(meta.icon);
				const ac = accentOf(meta.accent);
				return (
					<div key={n.id} className="flex items-center shrink-0">
						<div
							className={`forge-node relative w-44 rounded-xl border border-white/10 bg-[#0a0d10] p-3 ${ac.nodeHover}`}
						>
							<div
								className={`absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-mono ring-1 ${ac.badge}`}
							>
								{i + 1}
							</div>
							<div
								className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${ac.ico}`}
							>
								<Icon className="h-4 w-4" />
							</div>
							<p className="text-xs font-semibold text-white leading-tight">
								{meta.label}
							</p>
							<p className="text-[11px] text-slate-500 leading-tight">
								{meta.sub}
							</p>
						</div>
						{i < nodes.length - 1 && (
							<div className="relative h-0.5 w-7 forge-wire mx-0.5" />
						)}
					</div>
				);
			})}
		</div>
	);
}

/* ───────────────────────── cobrança por plano ───────────────────────── */

function PlanQuota({
	planKey,
	label,
	value,
	onChange,
}: {
	planKey: string;
	label: string;
	value: number | null;
	onChange: (v: number | null) => void;
}) {
	const unlimited = value === null;
	return (
		<div className="rounded-xl border border-white/10 bg-black/20 p-3">
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium text-slate-200">{label}</span>
				<button
					type="button"
					onClick={() => onChange(unlimited ? 0 : null)}
					className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md transition-colors ${
						unlimited
							? 'bg-cyan-500/15 text-cyan-300'
							: 'bg-white/5 text-slate-500'
					}`}
				>
					<InfinityIcon className="h-3 w-3" /> ilimitado
				</button>
			</div>
			<div className="mt-2 flex items-center gap-2">
				<input
					type="number"
					min={0}
					disabled={unlimited}
					value={unlimited ? '' : (value ?? 0)}
					onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
					placeholder={unlimited ? '∞' : '0'}
					className="w-20 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-sm text-slate-100 disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
				/>
				<span className="text-xs text-slate-500" data-plan={planKey}>
					grátis / mês
				</span>
			</div>
		</div>
	);
}

/* ───────────────────────── view principal ───────────────────────── */

type Mode = 'visual' | 'json';

export function ToolBuilderView() {
	const qc = useQueryClient();
	const list = useQuery({
		queryKey: ['tool-definitions'],
		queryFn: listToolDefinitions,
	});

	const [view, setView] = useState<'gallery' | 'editor'>('gallery');
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [state, setState] = useState<BuilderState | null>(null);
	const [mode, setMode] = useState<Mode>('visual');
	const [json, setJson] = useState('');
	const [jsonError, setJsonError] = useState<string | null>(null);
	const [advancedOpen, setAdvancedOpen] = useState(false);
	const [keyTouched, setKeyTouched] = useState(false);

	const patch = (p: Partial<BuilderState>) =>
		setState((s) => (s ? { ...s, ...p } : s));

	const startNew = (recipe: Recipe) => {
		setState(recipe.seed());
		setSelectedId(null);
		setMode('visual');
		setJson('');
		setJsonError(null);
		setKeyTouched(false);
		setAdvancedOpen(false);
		setView('editor');
	};

	const loadDef = (def: AiToolDefinition) => {
		const recipeId = detectRecipeId(def.definition);
		setSelectedId(def.id);
		setKeyTouched(true);
		setAdvancedOpen(false);
		if (recipeId) {
			setState(docToState(def, recipeId));
			setMode('visual');
			setJson('');
		} else {
			// Ferramenta avançada: edita direto no JSON (identidade fica em campos).
			const seed = RECIPES[0].seed();
			setState({
				...seed,
				recipeId: 'advanced',
				toolKey: def.tool_key,
				title: def.title,
				description: def.description ?? '',
				icon:
					(def.definition.ui as { icon?: string } | undefined)?.icon ??
					'wrench',
			});
			setMode('json');
			setJson(JSON.stringify(def.definition, null, 2));
		}
		setJsonError(null);
		setView('editor');
	};

	// Documento derivado (preview + save). Visual → buildDoc; JSON → parse.
	const derivedDoc = useMemo<ToolDefinitionDoc | null>(() => {
		try {
			if (mode === 'json') {
				return toolDefinitionDocSchema.parse(JSON.parse(json));
			}
			if (state) return buildDocFromState(state);
		} catch {
			return null;
		}
		return null;
	}, [mode, json, state]);

	const previewDef: AiToolDefinition | null =
		derivedDoc && state
			? {
					id: selectedId ?? 'draft',
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
			if (!state) throw new Error('Sem estado');
			const definition =
				mode === 'json'
					? toolDefinitionDocSchema.parse(JSON.parse(json))
					: buildDocFromState(state);
			if (selectedId) {
				return updateToolDefinition(selectedId, {
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
			loadDef(def);
		},
		onError: (err) => {
			if (mode === 'json') setJsonError('JSON inválido ou incompleto.');
			toast.error(getApiErrorMessage(err, 'Falha ao salvar.'));
		},
	});

	const publishMut = useMutation({
		mutationFn: () => {
			if (!selectedId) throw new Error('Salve antes de publicar.');
			return publishToolDefinition(selectedId);
		},
		onSuccess: (res) => {
			toast.success(`Publicada: ${res.tool_key} v${res.version} 🚀`);
			qc.invalidateQueries({ queryKey: ['tool-definitions'] });
			qc.invalidateQueries({ queryKey: ['entitlements'] });
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Falha ao publicar.')),
	});

	const goAdvancedJson = () => {
		if (state) setJson(JSON.stringify(buildDocFromState(state), null, 2));
		setMode('json');
		setAdvancedOpen(true);
	};

	const canSave = !!state?.toolKey && !!state?.title && !!derivedDoc;
	const isVisual = mode === 'visual' && state?.recipeId !== 'advanced';
	const recipe = state ? getRecipe(state.recipeId) : undefined;

	return (
		<div className="relative min-h-[calc(100vh-3.5rem)] text-slate-100">
			<ForgeStyles />
			{/* fundo blueprint + glows */}
			<div className="pointer-events-none absolute inset-0 forge-grid opacity-60" />
			<div className="pointer-events-none absolute -top-24 left-1/3 h-96 w-96 rounded-full bg-emerald-600/10 blur-3xl forge-pulse" />
			<div className="pointer-events-none absolute bottom-0 right-10 h-80 w-80 rounded-full bg-cyan-600/10 blur-3xl forge-pulse" />

			<div className="relative px-4 md:px-8 py-6">
				{/* header */}
				<div className="forge-rise mb-6 flex items-center gap-3">
					<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/20 ring-1 ring-emerald-400/30 text-emerald-300">
						<Workflow className="h-6 w-6" />
					</div>
					<div>
						<h1 className="text-xl font-bold tracking-tight text-white">
							Fábrica de Ferramentas
						</h1>
						<p className="font-mono text-[11px] tracking-wide text-emerald-400/70">
							motor blocks_v1 · {Object.keys(BLOCK_META).length} blocos · sem
							deploy
						</p>
					</div>
				</div>

				<div className="grid lg:grid-cols-[240px_minmax(0,1fr)_360px] gap-5">
					{/* rail: lista de ferramentas */}
					<aside className="space-y-2">
						<button
							type="button"
							onClick={() => {
								setView('gallery');
								setState(null);
								setSelectedId(null);
							}}
							className="forge-node w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-3 py-2.5 text-sm font-semibold text-[#06120f] shadow-lg shadow-emerald-500/20"
						>
							<Plus className="h-4 w-4" /> Nova ferramenta
						</button>
						<div className="rounded-xl border border-white/10 bg-[#0c0f12]/80 overflow-hidden">
							<div className="px-3 py-2 font-mono text-[10px] tracking-widest text-slate-500 uppercase border-b border-white/5">
								Suas ferramentas
							</div>
							{list.isLoading && (
								<div className="p-4 flex justify-center">
									<Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
								</div>
							)}
							{list.data?.map((def) => {
								const Icon = resolveToolIcon(
									(def.definition.ui as { icon?: string } | undefined)?.icon,
								);
								const active = selectedId === def.id;
								return (
									<button
										key={def.id}
										type="button"
										onClick={() => loadDef(def)}
										className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left border-b border-white/5 transition-colors ${
											active ? 'bg-emerald-500/10' : 'hover:bg-white/[0.03]'
										}`}
									>
										<Icon className="h-4 w-4 text-slate-400 shrink-0" />
										<span className="flex-1 min-w-0">
											<span className="block text-sm text-slate-200 truncate">
												{def.title}
											</span>
											<span className="block font-mono text-[10px] text-slate-500 truncate">
												{def.tool_key}
											</span>
										</span>
										<span
											className={`h-1.5 w-1.5 rounded-full ${
												def.status === 'published'
													? 'bg-emerald-400'
													: 'bg-amber-400'
											}`}
										/>
									</button>
								);
							})}
							{list.data?.length === 0 && (
								<p className="p-4 text-xs text-slate-500">
									Nenhuma ainda. Crie a primeira →
								</p>
							)}
						</div>
					</aside>

					{/* centro: galeria ou editor */}
					<main className="space-y-5">
						{view === 'gallery' || !state ? (
							<CapabilityGallery onPick={startNew} />
						) : (
							<>
								{/* 01 — identidade */}
								<SectionCard
									step="01"
									title="Identidade"
									subtitle="O nome e o ícone que o cliente vê."
									icon={<Glyph name={state.icon} className="h-4 w-4" />}
									delay={0}
								>
									<div className="grid sm:grid-cols-2 gap-3">
										<div className="sm:col-span-2">
											<label
												htmlFor="tb-title"
												className="block text-[11px] font-medium text-slate-400 mb-1"
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
															keyTouched || selectedId
																? state.toolKey
																: slugifyKey(title),
													});
												}}
												placeholder="Ex.: Gravação a laser"
												className={inputBase}
											/>
										</div>
										<div>
											<label
												htmlFor="tb-key"
												className="block text-[11px] font-medium text-slate-400 mb-1"
											>
												Identificador{' '}
												<span className="text-slate-600">(técnico, único)</span>
											</label>
											<input
												id="tb-key"
												value={state.toolKey}
												disabled={!!selectedId}
												onChange={(e) => {
													setKeyTouched(true);
													patch({ toolKey: slugifyKey(e.target.value) });
												}}
												placeholder="gravacao_laser"
												className={`${inputBase} font-mono disabled:opacity-50`}
											/>
										</div>
										<div>
											<label
												htmlFor="tb-action"
												className="block text-[11px] font-medium text-slate-400 mb-1"
											>
												Texto do botão
											</label>
											<input
												id="tb-action"
												value={state.actionLabel}
												onChange={(e) => patch({ actionLabel: e.target.value })}
												placeholder="Gerar"
												className={inputBase}
											/>
										</div>
										<div className="sm:col-span-2">
											<label
												htmlFor="tb-desc"
												className="block text-[11px] font-medium text-slate-400 mb-1"
											>
												Descrição
											</label>
											<input
												id="tb-desc"
												value={state.description}
												onChange={(e) => patch({ description: e.target.value })}
												placeholder="O que ela faz, em uma linha."
												className={inputBase}
											/>
										</div>
										<div className="sm:col-span-2">
											<span className="block text-[11px] font-medium text-slate-400 mb-1.5">
												Ícone
											</span>
											<div className="flex flex-wrap gap-1.5">
												{TOOL_ICONS.map(({ name, Icon }) => (
													<button
														key={name}
														type="button"
														onClick={() => patch({ icon: name })}
														className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
															state.icon === name
																? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300'
																: 'border-white/10 bg-black/20 text-slate-400 hover:text-slate-200'
														}`}
													>
														<Icon className="h-4 w-4" />
													</button>
												))}
											</div>
										</div>
									</div>
								</SectionCard>

								{/* 02 — entradas */}
								{isVisual && (
									<SectionCard
										step="02"
										title="O que o cliente envia"
										subtitle="Os campos do formulário. Esconda o que não precisa aparecer."
										icon={<Sparkles className="h-4 w-4" />}
										accent="sky"
										delay={60}
									>
										<div className="space-y-2">
											{state.fields.map((f) => (
												<FieldEditor
													key={f.name}
													field={f}
													onChange={(nf) =>
														patch({
															fields: state.fields.map((x) =>
																x.name === nf.name ? nf : x,
															),
														})
													}
												/>
											))}
										</div>
									</SectionCard>
								)}

								{/* 03 — fluxo */}
								<SectionCard
									step="03"
									title="O que a ferramenta faz"
									subtitle="As etapas, em ordem. Geradas automaticamente."
									icon={<Workflow className="h-4 w-4" />}
									accent="cyan"
									delay={120}
								>
									<FlowDiagram doc={derivedDoc} />
								</SectionCard>

								{/* 04 — cobrança */}
								{isVisual && (
									<SectionCard
										step="04"
										title="Preço e planos"
										subtitle="Custo por uso e cota grátis por plano."
										icon={<Rocket className="h-4 w-4" />}
										accent="amber"
										delay={180}
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
													patch({
														voxCost: Math.max(0, Number(e.target.value)),
													})
												}
												className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-amber-200 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40"
											/>
											<span className="font-mono text-xs text-amber-400/80">
												vox / uso
											</span>
										</div>
										<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
											{BUILDER_PLANS.map((p) => (
												<PlanQuota
													key={p.key}
													planKey={p.key}
													label={p.label}
													value={state.freeQuota[p.key] ?? 0}
													onChange={(v) =>
														patch({
															freeQuota: { ...state.freeQuota, [p.key]: v },
														})
													}
												/>
											))}
										</div>
									</SectionCard>
								)}

								{/* avançado: JSON */}
								<div className="forge-rise rounded-2xl border border-white/10 bg-[#0c0f12]/80 overflow-hidden">
									<button
										type="button"
										onClick={() => setAdvancedOpen((o) => !o)}
										className="w-full flex items-center gap-2 px-5 py-3 text-left"
									>
										<Code2 className="h-4 w-4 text-slate-400" />
										<span className="text-sm font-medium text-slate-300">
											Avançado · definição em JSON
										</span>
										<span className="ml-auto flex items-center gap-2">
											{mode === 'json' && (
												<span className="font-mono text-[10px] text-cyan-300">
													modo manual
												</span>
											)}
											<ChevronDown
												className={`h-4 w-4 text-slate-500 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
											/>
										</span>
									</button>
									{advancedOpen && (
										<div className="px-5 pb-5 space-y-2">
											{isVisual ? (
												<>
													<p className="text-xs text-slate-500">
														Gerado a partir das suas escolhas. Pra editar à mão
														(refs, blocos…), assuma o controle:
													</p>
													<pre className="max-h-72 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-slate-300">
														{derivedDoc
															? JSON.stringify(derivedDoc, null, 2)
															: '// preencha os campos acima'}
													</pre>
													<button
														type="button"
														onClick={goAdvancedJson}
														className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300"
													>
														Editar JSON manualmente
													</button>
												</>
											) : (
												<>
													<textarea
														value={json}
														onChange={(e) => {
															setJson(e.target.value);
															setJsonError(null);
														}}
														spellCheck={false}
														rows={18}
														className="w-full rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
													/>
													{jsonError && (
														<p className="text-xs text-rose-400">{jsonError}</p>
													)}
													{recipe && (
														<button
															type="button"
															onClick={() => {
																setMode('visual');
															}}
															className="text-xs text-slate-400 hover:text-slate-200"
														>
															← voltar ao modo visual
														</button>
													)}
												</>
											)}
										</div>
									)}
								</div>
							</>
						)}
					</main>

					{/* direita: preview ao vivo + ações */}
					{view === 'editor' && state && (
						<aside className="space-y-3 lg:sticky lg:top-4 self-start">
							<div className="flex items-center gap-2 text-emerald-300">
								<Eye className="h-4 w-4" />
								<span className="font-mono text-[11px] tracking-widest uppercase">
									Como o cliente vê
								</span>
							</div>
							<div className="rounded-2xl border border-white/10 bg-[#0c0f12]/80 overflow-hidden">
								{previewDef ? (
									<div className="scale-[0.98] origin-top">
										<DynamicToolView
											toolKey={previewDef.tool_key}
											definitionOverride={previewDef}
										/>
									</div>
								) : (
									<p className="p-6 text-sm text-rose-400">
										Definição incompleta — confira os campos / o JSON.
									</p>
								)}
							</div>

							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => saveMut.mutate()}
									disabled={saveMut.isPending || !canSave}
									className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 disabled:opacity-40 hover:bg-white/10"
								>
									{saveMut.isPending ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Save className="h-4 w-4" />
									)}
									{selectedId ? 'Salvar' : 'Criar'}
								</button>
								<button
									type="button"
									onClick={() => publishMut.mutate()}
									disabled={publishMut.isPending || !selectedId}
									title={!selectedId ? 'Salve antes de publicar' : undefined}
									className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-sm font-bold text-[#06120f] shadow-lg shadow-emerald-500/25 disabled:opacity-40"
								>
									{publishMut.isPending ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Rocket className="h-4 w-4" />
									)}
									Publicar
								</button>
							</div>
							{!selectedId && (
								<p className="flex items-center gap-1.5 text-[11px] text-slate-500">
									<Check className="h-3 w-3" /> salve pra liberar a publicação
								</p>
							)}
						</aside>
					)}
				</div>
			</div>
		</div>
	);
}
