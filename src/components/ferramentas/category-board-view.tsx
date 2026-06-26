'use client';

import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	Check,
	GripVertical,
	Loader2,
	MoreVertical,
	Palette,
	Pencil,
	Plus,
	Trash2,
	Wrench,
	X,
} from 'lucide-react';
import { type SyntheticEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useToolCategories } from '@/modules/tools/hooks/use-tool-categories';
import { resolveToolIcon } from '@/modules/tools/lib/tool-icons';
import type { ToolCategoryDTO } from '@/modules/tools/services/tool-categories.service';
import {
	type AiToolDefinition,
	listToolDefinitions,
	setToolCategory,
	setToolColor,
} from '@/modules/tools/services/tool-definitions.service';
import { TOOL_COLORS, type ToolColorKey } from '@/utils/constants/tool-colors';

/**
 * BOARD de CATEGORIAS (admin) — um kanban para organizar o "catálogo infinito":
 * uma coluna por categoria (de `useToolCategories`, já ordenada) e os CARDS são
 * as DEFINIÇÕES da Fábrica (`listToolDefinitions`) agrupadas por
 * `definition.ui.category` (default 'outros'). Arrastar um card para outra coluna
 * reescreve só `ui.category` da tool (`setToolCategory`, MERGE-safe) com UPDATE
 * OTIMISTA na cache `['tool-definitions']` e invalidação no fim.
 *
 * Cada coluna tem: rótulo + contagem + menu (renomear/recolorir/apagar — apagar
 * escondido p/ `is_builtin` ou `outros`) e há um botão "Nova categoria". O
 * picker de cor são as chaves de `TOOL_COLORS`. Mobile: colunas rolam na
 * horizontal.
 */

const FALLBACK_SLUG = 'outros';
const TOOL_DEFS_KEY = ['tool-definitions'] as const;
const COLOR_KEYS = Object.keys(TOOL_COLORS) as ToolColorKey[];

/** `color_key` do DTO só vira gradiente se existir na paleta; senão → 'parametros'. */
function safeColorKey(colorKey: string): ToolColorKey {
	return colorKey in TOOL_COLORS ? (colorKey as ToolColorKey) : 'parametros';
}

/** A categoria de uma definição (slug), com fallback obrigatório p/ 'outros'. */
function defCategory(def: AiToolDefinition): string {
	return def.definition.ui?.category ?? FALLBACK_SLUG;
}

export function CategoryBoardView() {
	const qc = useQueryClient();
	const {
		categories,
		isLoading: catsLoading,
		create,
		update,
		remove,
	} = useToolCategories();

	const { data: defs, isLoading: defsLoading } = useQuery<AiToolDefinition[]>({
		queryKey: TOOL_DEFS_KEY,
		queryFn: listToolDefinitions,
		staleTime: 30_000,
	});

	const [activeDef, setActiveDef] = useState<AiToolDefinition | null>(null);
	const [creating, setCreating] = useState(false);

	// Mapa slug → cor (chave da paleta) das categorias, p/ pintar os cards com a
	// cor da coluna onde estão (e o overlay durante o arraste).
	const colorBySlug = useMemo(() => {
		const map = new Map<string, ToolColorKey>();
		for (const cat of categories)
			map.set(cat.slug, safeColorKey(cat.color_key));
		return map;
	}, [categories]);

	const activeColor: ToolColorKey = activeDef
		? (colorBySlug.get(defCategory(activeDef)) ?? 'parametros')
		: 'parametros';

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
	);

	// Move uma tool de categoria com OTIMISMO: reescreve `ui.category` na cache
	// `['tool-definitions']` na hora, dispara o PATCH merge-safe e reverte se der
	// erro; ao fim invalida (sincroniza com o servidor).
	const moveMut = useMutation({
		mutationFn: ({ def, slug }: { def: AiToolDefinition; slug: string }) =>
			setToolCategory(def, slug),
		onMutate: async ({ def, slug }) => {
			await qc.cancelQueries({ queryKey: TOOL_DEFS_KEY });
			const prev = qc.getQueryData<AiToolDefinition[]>(TOOL_DEFS_KEY);
			qc.setQueryData<AiToolDefinition[]>(TOOL_DEFS_KEY, (old) =>
				(old ?? []).map((d) =>
					d.id === def.id
						? {
								...d,
								definition: {
									...d.definition,
									ui: { ...(d.definition.ui ?? {}), category: slug },
								},
							}
						: d,
				),
			);
			return { prev };
		},
		onError: (_err, _vars, ctx) => {
			if (ctx?.prev) qc.setQueryData(TOOL_DEFS_KEY, ctx.prev);
			toast.error('Não foi possível mover a ferramenta.');
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: TOOL_DEFS_KEY });
		},
	});

	// Define a COR PRÓPRIA de uma tool (`ui.color`), que sobrepõe a cor da
	// categoria. Mesmo otimismo merge-safe do `moveMut`.
	const colorMut = useMutation({
		mutationFn: ({
			def,
			color,
		}: {
			def: AiToolDefinition;
			color: ToolColorKey;
		}) => setToolColor(def, color),
		onMutate: async ({ def, color }) => {
			await qc.cancelQueries({ queryKey: TOOL_DEFS_KEY });
			const prev = qc.getQueryData<AiToolDefinition[]>(TOOL_DEFS_KEY);
			qc.setQueryData<AiToolDefinition[]>(TOOL_DEFS_KEY, (old) =>
				(old ?? []).map((d) =>
					d.id === def.id
						? {
								...d,
								definition: {
									...d.definition,
									ui: { ...(d.definition.ui ?? {}), color },
								},
							}
						: d,
				),
			);
			return { prev };
		},
		onError: (_err, _vars, ctx) => {
			if (ctx?.prev) qc.setQueryData(TOOL_DEFS_KEY, ctx.prev);
			toast.error('Não foi possível mudar a cor da ferramenta.');
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: TOOL_DEFS_KEY });
		},
	});

	// Agrupa as definições por slug de categoria; tudo que não bate numa
	// categoria conhecida cai em 'outros'.
	const byCategory = useMemo(() => {
		const knownSlugs = new Set(categories.map((c) => c.slug));
		const map = new Map<string, AiToolDefinition[]>();
		for (const def of defs ?? []) {
			const raw = defCategory(def);
			const slug = knownSlugs.has(raw) ? raw : FALLBACK_SLUG;
			const list = map.get(slug);
			if (list) list.push(def);
			else map.set(slug, [def]);
		}
		return map;
	}, [defs, categories]);

	function handleDragStart(event: DragStartEvent) {
		const def = (defs ?? []).find((d) => d.id === event.active.id);
		setActiveDef(def ?? null);
	}

	function handleDragEnd(event: DragEndEvent) {
		setActiveDef(null);
		const { active, over } = event;
		if (!over) return;
		const def = (defs ?? []).find((d) => d.id === active.id);
		if (!def) return;
		const targetSlug = String(over.id);
		if (defCategory(def) === targetSlug) return;
		moveMut.mutate({ def, slug: targetSlug });
	}

	const isLoading = catsLoading || defsLoading;

	return (
		<div className="mx-auto w-full max-w-[1400px]">
			<header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
						Categorias
					</h1>
					<p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
						Arraste as ferramentas entre as seções para organizar o catálogo.
					</p>
				</div>
				<button
					type="button"
					onClick={() => setCreating(true)}
					className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
				>
					<Plus className="h-4 w-4" />
					Nova categoria
				</button>
			</header>

			{isLoading ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 border-dashed py-20 text-center dark:border-white/10">
					<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
					<p className="text-sm text-slate-500 dark:text-gray-400">
						A carregar categorias…
					</p>
				</div>
			) : categories.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 border-dashed py-20 text-center dark:border-white/10">
					<div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-gray-500">
						<Wrench className="h-6 w-6" />
					</div>
					<p className="text-sm text-slate-500 dark:text-gray-400">
						Nenhuma categoria ainda. Crie a primeira.
					</p>
				</div>
			) : (
				<DndContext
					sensors={sensors}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					<div className="space-y-8">
						{categories.map((cat) => (
							<CategorySection
								key={cat.id}
								category={cat}
								defs={byCategory.get(cat.slug) ?? []}
								onRename={(label) =>
									update.mutate(
										{ id: cat.id, body: { label } },
										{
											onError: () =>
												toast.error('Não foi possível renomear a categoria.'),
										},
									)
								}
								onRecolor={(colorKey) =>
									update.mutate(
										{ id: cat.id, body: { color_key: colorKey } },
										{
											onError: () =>
												toast.error('Não foi possível mudar a cor.'),
										},
									)
								}
								onDelete={() =>
									remove.mutate(cat.id, {
										onError: () =>
											toast.error('Não foi possível apagar a categoria.'),
									})
								}
								onSetColor={(def, color) => colorMut.mutate({ def, color })}
							/>
						))}
					</div>

					<DragOverlay dropAnimation={null}>
						{activeDef ? (
							<ToolDefCard def={activeDef} colorKey={activeColor} overlay />
						) : null}
					</DragOverlay>
				</DndContext>
			)}

			{creating && (
				<NewCategoryModal
					busy={create.isPending}
					onClose={() => setCreating(false)}
					onCreate={(label, colorKey) =>
						create.mutate(
							{ label, color_key: colorKey },
							{
								onSuccess: () => setCreating(false),
								onError: () =>
									toast.error('Não foi possível criar a categoria.'),
							},
						)
					}
				/>
			)}
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Seção (droppable) — cabeçalho + grid de cards (linguagem do Hub)         */
/* ─────────────────────────────────────────────────────────────────────── */

interface CategorySectionProps {
	category: ToolCategoryDTO;
	defs: AiToolDefinition[];
	onRename: (label: string) => void;
	onRecolor: (colorKey: string) => void;
	onDelete: () => void;
	onSetColor: (def: AiToolDefinition, color: ToolColorKey) => void;
}

function CategorySection({
	category,
	defs,
	onRename,
	onRecolor,
	onDelete,
	onSetColor,
}: CategorySectionProps) {
	const { setNodeRef, isOver } = useDroppable({ id: category.slug });
	const colorKey = safeColorKey(category.color_key);
	const { gradient } = TOOL_COLORS[colorKey];
	// Só 'outros' (o fallback do sistema) é protegida; o resto pode ser apagado.
	const canDelete = category.slug !== FALLBACK_SLUG;

	return (
		<section>
			{/* Cabeçalho da seção (estilo Hub): bolinha + rótulo + contagem +
			    divisória que preenche a largura + menu da categoria. */}
			<div className="mb-3 flex items-center gap-3">
				<span
					className={`h-3.5 w-3.5 shrink-0 rounded-full bg-gradient-to-br ${gradient}`}
					aria-hidden
				/>
				<h2 className="shrink-0 font-display text-sm font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-gray-300">
					{category.label}
				</h2>
				<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-white/5 dark:text-gray-400">
					{defs.length}
				</span>
				<div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-white/10" />
				<ColumnMenu
					category={category}
					currentColor={colorKey}
					canDelete={canDelete}
					onRename={onRename}
					onRecolor={onRecolor}
					onDelete={onDelete}
				/>
			</div>

			{/* Área droppable: grid responsivo (cheia) ou faixa-alvo tracejada
			    (vazia). Realça em violeta quando um card está sobre ela. */}
			<div
				ref={setNodeRef}
				className={`rounded-2xl border p-2 transition-colors ${
					isOver
						? 'border-violet-400 bg-violet-500/5 dark:border-violet-500/50'
						: defs.length === 0
							? 'border-slate-200 border-dashed dark:border-white/10'
							: 'border-transparent'
				}`}
			>
				{defs.length === 0 ? (
					<p className="py-6 text-center text-xs text-slate-400 dark:text-gray-500">
						Arraste ferramentas para cá.
					</p>
				) : (
					<div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
						{defs.map((def) => (
							<ToolDefCard
								key={def.id}
								def={def}
								colorKey={colorKey}
								onSetColor={(color) => onSetColor(def, color)}
							/>
						))}
					</div>
				)}
			</div>
		</section>
	);
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Menu da coluna (renomear / recolorir / apagar)                          */
/* ─────────────────────────────────────────────────────────────────────── */

interface ColumnMenuProps {
	category: ToolCategoryDTO;
	currentColor: ToolColorKey;
	canDelete: boolean;
	onRename: (label: string) => void;
	onRecolor: (colorKey: string) => void;
	onDelete: () => void;
}

function ColumnMenu({
	category,
	currentColor,
	canDelete,
	onRename,
	onRecolor,
	onDelete,
}: ColumnMenuProps) {
	const [open, setOpen] = useState(false);
	const [renaming, setRenaming] = useState(false);
	const [label, setLabel] = useState(category.label);

	function commitRename() {
		const next = label.trim();
		if (next && next !== category.label) onRename(next);
		setRenaming(false);
		setOpen(false);
	}

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => {
					setOpen((v) => !v);
					setRenaming(false);
					setLabel(category.label);
				}}
				aria-label={`Opções da categoria ${category.label}`}
				className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white"
			>
				<MoreVertical className="h-4 w-4" />
			</button>

			{open && (
				<>
					<button
						type="button"
						aria-hidden
						tabIndex={-1}
						onClick={() => setOpen(false)}
						className="fixed inset-0 z-20 cursor-default"
					/>
					<div className="absolute right-0 z-30 mt-1 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-lg shadow-black/10 dark:border-white/10 dark:bg-[#1a1a1d]">
						{renaming ? (
							<div className="flex items-center gap-1.5 p-1">
								<input
									// biome-ignore lint/a11y/noAutofocus: foco imediato ao renomear
									autoFocus
									value={label}
									onChange={(e) => setLabel(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') commitRename();
										if (e.key === 'Escape') setRenaming(false);
									}}
									className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#101012] dark:text-white"
								/>
								<button
									type="button"
									onClick={commitRename}
									aria-label="Salvar nome"
									className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-600 text-white hover:bg-violet-500"
								>
									<Check className="h-4 w-4" />
								</button>
							</div>
						) : (
							<button
								type="button"
								onClick={() => setRenaming(true)}
								className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-gray-200 dark:hover:bg-white/5"
							>
								<Pencil className="h-4 w-4" />
								Renomear
							</button>
						)}

						<div className="mt-1 px-2.5 pt-2">
							<p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500">
								Cor
							</p>
							<div className="grid grid-cols-6 gap-1.5">
								{COLOR_KEYS.map((key) => {
									const selected = key === currentColor;
									return (
										<button
											key={key}
											type="button"
											onClick={() => {
												onRecolor(key);
												setOpen(false);
											}}
											aria-label={`Cor ${key}`}
											aria-pressed={selected}
											className={`grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br ${TOOL_COLORS[key].gradient} ${
												selected
													? 'ring-2 ring-violet-500 ring-offset-1 ring-offset-white dark:ring-offset-[#1a1a1d]'
													: ''
											}`}
										>
											{selected && <Check className="h-3.5 w-3.5 text-white" />}
										</button>
									);
								})}
							</div>
						</div>

						{canDelete && (
							<button
								type="button"
								onClick={() => {
									onDelete();
									setOpen(false);
								}}
								className="mt-2 flex w-full items-center gap-2.5 rounded-lg border-t border-slate-100 px-2.5 py-2 pt-2.5 text-left text-sm text-red-600 transition hover:bg-red-50 dark:border-white/10 dark:text-red-400 dark:hover:bg-red-500/10"
							>
								<Trash2 className="h-4 w-4" />
								Apagar categoria
							</button>
						)}
					</div>
				</>
			)}
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Card draggable de uma definição (mesma linguagem do Hub ToolCard)       */
/* ─────────────────────────────────────────────────────────────────────── */

function ToolDefCard({
	def,
	colorKey,
	overlay = false,
	onSetColor,
}: {
	def: AiToolDefinition;
	/** Cor da COLUNA (categoria) — usada quando a tool não tem cor própria. */
	colorKey: ToolColorKey;
	overlay?: boolean;
	onSetColor?: (color: ToolColorKey) => void;
}) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: def.id,
	});
	const [colorOpen, setColorOpen] = useState(false);
	// A cor PRÓPRIA da tool (`ui.color`) sobrepõe a cor da categoria.
	const ownColor = def.definition.ui?.color;
	const effColor: ToolColorKey =
		typeof ownColor === 'string' && ownColor in TOOL_COLORS
			? (ownColor as ToolColorKey)
			: colorKey;
	const { gradient } = TOOL_COLORS[effColor];
	// `ui` é passthrough (Zod) → `icon` chega como `unknown`; resolvemos só strings.
	const iconName = def.definition.ui?.icon;
	const Icon = resolveToolIcon(
		typeof iconName === 'string' ? iconName : undefined,
	);
	// Cliques nos controles não podem iniciar um arraste (DnD usa pointerdown).
	const stop = (e: SyntheticEvent) => e.stopPropagation();

	return (
		<div
			ref={overlay ? undefined : setNodeRef}
			{...(overlay ? {} : listeners)}
			{...(overlay ? {} : attributes)}
			className={`group relative flex flex-col gap-2 overflow-hidden rounded-xl bg-gradient-to-br p-2.5 ${gradient} cursor-grab border border-white/10 shadow-black/10 shadow-sm transition-all active:cursor-grabbing ${
				isDragging ? 'opacity-30' : ''
			} ${overlay ? 'w-[256px] rotate-2 shadow-black/30 shadow-xl' : ''}`}
		>
			<div className="flex items-center gap-2.5">
				<div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/20 backdrop-blur-sm">
					<Icon className="h-5 w-5 text-white" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-bold leading-tight text-white">
						{def.title}
					</p>
					<p className="truncate text-[11px] text-white/70">{def.tool_key}</p>
				</div>
				{!overlay && onSetColor && (
					<button
						type="button"
						onPointerDown={stop}
						onClick={(e) => {
							stop(e);
							setColorOpen((v) => !v);
						}}
						aria-label="Cor da ferramenta"
						className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white/70 transition hover:bg-white/15 hover:text-white"
					>
						<Palette className="h-4 w-4" />
					</button>
				)}
				<GripVertical className="h-4 w-4 shrink-0 text-white/40" aria-hidden />
			</div>

			{colorOpen && onSetColor && (
				<div
					onPointerDown={stop}
					className="grid grid-cols-9 gap-1 rounded-lg bg-black/20 p-1.5"
				>
					{COLOR_KEYS.map((key) => (
						<button
							key={key}
							type="button"
							onPointerDown={stop}
							onClick={(e) => {
								stop(e);
								onSetColor(key);
								setColorOpen(false);
							}}
							aria-label={`Cor ${key}`}
							aria-pressed={key === effColor}
							className={`grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br ${TOOL_COLORS[key].gradient} ${
								key === effColor ? 'ring-2 ring-white' : ''
							}`}
						>
							{key === effColor && <Check className="h-3 w-3 text-white" />}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Modal "Nova categoria"                                                  */
/* ─────────────────────────────────────────────────────────────────────── */

function NewCategoryModal({
	busy,
	onClose,
	onCreate,
}: {
	busy: boolean;
	onClose: () => void;
	onCreate: (label: string, colorKey: string) => void;
}) {
	const [label, setLabel] = useState('');
	const [colorKey, setColorKey] = useState<ToolColorKey>('parametros');
	const valid = label.trim().length > 0;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
			<div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#1a1a1d]">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
						Nova categoria
					</h3>
					<button
						type="button"
						onClick={onClose}
						aria-label="Fechar"
						className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				<label
					htmlFor="new-cat-label"
					className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-gray-300"
				>
					Nome
				</label>
				<input
					id="new-cat-label"
					// biome-ignore lint/a11y/noAutofocus: foco no campo ao abrir o modal
					autoFocus
					value={label}
					onChange={(e) => setLabel(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && valid && !busy)
							onCreate(label.trim(), colorKey);
					}}
					placeholder="Ex.: Acabamento"
					className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-[#101012] dark:text-white"
				/>

				<p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-gray-300">
					Cor
				</p>
				<div className="mb-5 grid grid-cols-9 gap-1.5">
					{COLOR_KEYS.map((key) => {
						const selected = key === colorKey;
						return (
							<button
								key={key}
								type="button"
								onClick={() => setColorKey(key)}
								aria-label={`Cor ${key}`}
								aria-pressed={selected}
								className={`grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br ${TOOL_COLORS[key].gradient} ${
									selected
										? 'ring-2 ring-violet-500 ring-offset-1 ring-offset-white dark:ring-offset-[#1a1a1d]'
										: ''
								}`}
							>
								{selected && <Check className="h-3.5 w-3.5 text-white" />}
							</button>
						);
					})}
				</div>

				<div className="flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-white/5"
					>
						Cancelar
					</button>
					<button
						type="button"
						disabled={!valid || busy}
						onClick={() => onCreate(label.trim(), colorKey)}
						className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{busy && <Loader2 className="h-4 w-4 animate-spin" />}
						Criar
					</button>
				</div>
			</div>
		</div>
	);
}
