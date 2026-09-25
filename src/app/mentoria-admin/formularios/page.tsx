'use client';

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
	CheckCircle2,
	Eye,
	GitCompare,
	GripVertical,
	Info,
	Loader2,
	Pencil,
	Plus,
	Trash2,
	Upload,
} from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/dashboard/header';
import { DynamicForm } from '@/modules/mentoria/components/dynamic-form';
import { diffFormSchemas } from '@/modules/mentoria/form-diff';
import {
	type FormBlock,
	type FormField,
	type FormFieldType,
	type FormSchemaDiff,
	KPI_METRIC_OPTIONS,
	type MntFormTemplate,
} from '@/modules/mentoria/types';
import {
	mentoriaErrorMessage,
	useFormTemplateMutations,
	useFormTemplatesAdmin,
} from '../_components/admin-hooks';
import {
	Badge,
	Card,
	EmptyState,
	Field,
	inputClass,
	Modal,
	PageTitle,
	primaryBtn,
	Spinner,
	secondaryBtn,
} from '../_components/ui';

// Tipos de campo suportados pelo builder (subset do FormFieldType).
const FIELD_TYPES: Array<{ value: FormFieldType; label: string }> = [
	{ value: 'text', label: 'Texto curto' },
	{ value: 'textarea', label: 'Texto longo' },
	{ value: 'number', label: 'Número' },
	{ value: 'currency', label: 'Moeda (R$)' },
	{ value: 'select', label: 'Seleção (opções)' },
	{ value: 'boolean', label: 'Sim / Não' },
	{ value: 'date', label: 'Data' },
	{ value: 'scale', label: 'Escala (0–10)' },
];

// As keys que o comparador e a Foto Zero entendem (extractMetrics na API):
// as do KPI + o gargalo do diagnóstico.
const METRIC_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
	...KPI_METRIC_OPTIONS,
	{ value: 'gargalo', label: 'Gargalo principal' },
];

/** label → key snake_case (sem acentos, minúsculas, `_`). */
function toSnakeCase(label: string): string {
	return label
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 60);
}

/** Igual ao toSnakeCase, mas sem aparar `_` das pontas: usado a cada tecla
 * no campo Chave, senão o separador sumia e 'diagnostico_inicial' virava
 * 'diagnosticoinicial'. As pontas são aparadas no save. */
function toSnakeCaseTyping(label: string): string {
	return label
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.slice(0, 60);
}

// Campos e blocos do builder carregam um id de cliente (`cid`) só para a
// `key` do React e para o arrastar. Antes a key do card vinha do título do
// bloco, que muda a cada tecla: o card remontava e o input perdia o foco.
// `locked` marca o que já existe na versão base: a key desses NÃO muda ao
// editar o rótulo, senão as respostas e métricas antigas deixam de casar com a
// nova versão. `optionsText` guarda o texto cru das opções enquanto se digita.
type BuilderField = FormField & {
	cid: string;
	locked: boolean;
	optionsText?: string;
};
type BuilderBlock = Omit<FormBlock, 'fields'> & {
	cid: string;
	locked: boolean;
	fields: BuilderField[];
};

type BuilderState = {
	/** null = template totalmente novo (key editável). */
	baseKey: string | null;
	key: string;
	title: string;
	description: string;
	blocks: BuilderBlock[];
	baseVersion: number | null;
	/** Blocos da versão editada: base do "Comparar". */
	baseBlocks: FormBlock[];
	/** Foto do estado ao abrir: diferente dela = alterações não salvas. */
	initial: string;
};

let cidSeq = 0;
const newCid = () => `c${++cidSeq}`;

function toBuilderBlocks(blocks: FormBlock[]): BuilderBlock[] {
	return structuredClone(blocks).map((b) => ({
		...b,
		cid: newCid(),
		locked: true,
		fields: b.fields.map((f) => ({ ...f, cid: newCid(), locked: true })),
	}));
}

/** Remove os campos internos do builder antes de salvar/pré-visualizar. */
function toSchemaBlocks(blocks: BuilderBlock[]): FormBlock[] {
	return blocks.map(({ cid: _c, locked: _l, fields, ...b }) => ({
		...b,
		// Descrição vazia não vai: o aluno veria um bloco com subtítulo em branco.
		description: b.description?.trim() || undefined,
		fields: fields.map(({ cid: _fc, locked: _fl, optionsText: _o, ...f }) => f),
	}));
}

function snapshotOf(
	s: Pick<BuilderState, 'key' | 'title' | 'description' | 'blocks'>,
): string {
	return JSON.stringify({
		key: s.key,
		title: s.title,
		description: s.description,
		blocks: toSchemaBlocks(s.blocks),
	});
}

function parseOptions(text: string): string[] {
	return text
		.split('\n')
		.map((o) => o.trim())
		.filter(Boolean);
}

function builderFor(t: MntFormTemplate | null): BuilderState {
	const base = t
		? {
				baseKey: t.key,
				key: t.key,
				title: t.title,
				description: t.description ?? '',
				blocks: toBuilderBlocks(t.schema.blocks),
				baseVersion: t.version,
				baseBlocks: t.schema.blocks,
			}
		: {
				baseKey: null,
				key: '',
				title: '',
				description: '',
				blocks: [],
				baseVersion: null,
				baseBlocks: [],
			};
	return { ...base, initial: snapshotOf(base) };
}

export default function FormulariosPage() {
	const templates = useFormTemplatesAdmin();
	const { publish } = useFormTemplateMutations();
	const [builder, setBuilder] = useState<BuilderState | null>(null);
	const [comparing, setComparing] = useState<{
		before: MntFormTemplate;
		after: MntFormTemplate;
	} | null>(null);

	// Agrupa por key; versões desc dentro de cada grupo.
	const grouped = useMemo(() => {
		const map = new Map<string, MntFormTemplate[]>();
		for (const t of templates.data ?? []) {
			const list = map.get(t.key) ?? [];
			list.push(t);
			map.set(t.key, list);
		}
		for (const list of map.values()) {
			list.sort((a, b) => b.version - a.version);
		}
		return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
	}, [templates.data]);

	const doPublish = async (t: MntFormTemplate) => {
		try {
			await publish.mutateAsync(t.id);
			toast.success(`Formulário "${t.key}" v${t.version} publicado`);
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao publicar o formulário'));
		}
	};

	if (builder) {
		return (
			<FormBuilder
				state={builder}
				setState={setBuilder}
				onClose={() => setBuilder(null)}
			/>
		);
	}

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<main className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
				<PageTitle
					title="Formulários"
					description="Diagnóstico e exercícios. Cada salvamento gera uma versão."
					backHref="/mentoria-admin"
					actions={
						<button
							type="button"
							className={primaryBtn}
							onClick={() => setBuilder(builderFor(null))}
						>
							<Plus className="w-4 h-4" />
							Novo formulário
						</button>
					}
				/>

				<div className="mb-6 flex items-start gap-2 rounded-xl border border-blue-300/50 dark:border-blue-500/30 bg-blue-500/5 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
					<Info className="w-4 h-4 mt-0.5 shrink-0" />
					<p>Respostas ficam presas à versão respondida.</p>
				</div>

				{templates.isLoading ? (
					<Card>
						<Spinner />
					</Card>
				) : templates.isError ? (
					<Card>
						<EmptyState message="Não foi possível carregar os formulários." />
					</Card>
				) : !grouped.length ? (
					<Card>
						<EmptyState message="Nenhum template de formulário cadastrado." />
					</Card>
				) : (
					<div className="space-y-4">
						{grouped.map(([key, versions]) => {
							const latest = versions[0];
							const previous = versions[1];
							return (
								<Card key={key} className="p-5">
									<div className="flex items-start justify-between gap-4 flex-wrap">
										<div className="min-w-0">
											<p className="font-semibold text-slate-900 dark:text-white">
												{latest.title}
											</p>
											<p className="text-xs font-mono text-slate-500 dark:text-gray-400 mt-0.5">
												{key}
											</p>
											{latest.description && (
												<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
													{latest.description}
												</p>
											)}
											<div className="flex items-center gap-2 mt-2 flex-wrap">
												{versions.map((v) => (
													<Badge
														key={v.id}
														tone={v.published ? 'green' : 'amber'}
													>
														v{v.version}{' '}
														{v.published ? 'publicada' : 'rascunho'}
													</Badge>
												))}
												<span className="text-xs text-slate-500 dark:text-gray-500">
													{latest.schema.blocks.length} bloco(s) ·{' '}
													{latest.schema.blocks.reduce(
														(n, b) => n + b.fields.length,
														0,
													)}{' '}
													campo(s)
												</span>
											</div>
										</div>
										<div className="flex gap-2 flex-wrap">
											{previous && (
												<button
													type="button"
													className={secondaryBtn}
													onClick={() =>
														setComparing({ before: previous, after: latest })
													}
												>
													<GitCompare className="w-3.5 h-3.5" />
													Comparar v{previous.version} × v{latest.version}
												</button>
											)}
											{!latest.published && (
												<button
													type="button"
													className={secondaryBtn}
													onClick={() => doPublish(latest)}
													disabled={publish.isPending}
												>
													<Upload className="w-3.5 h-3.5" />
													Publicar v{latest.version}
												</button>
											)}
											<button
												type="button"
												className={secondaryBtn}
												onClick={() => setBuilder(builderFor(latest))}
											>
												<Pencil className="w-3.5 h-3.5" />
												Editar
											</button>
										</div>
									</div>
								</Card>
							);
						})}
					</div>
				)}
			</main>

			{comparing && (
				<Modal
					title={`${comparing.after.title}: v${comparing.before.version} × v${comparing.after.version}`}
					onClose={() => setComparing(null)}
					wide
				>
					<DiffView
						diff={diffFormSchemas(
							comparing.before.schema.blocks,
							comparing.after.schema.blocks,
						)}
					/>
				</Modal>
			)}
		</div>
	);
}

// ── Comparar versões ─────────────────────────────────────────────────────────
function DiffView({ diff }: { diff: FormSchemaDiff }) {
	const empty =
		!diff.added.length && !diff.removed.length && !diff.changed.length;
	if (empty) {
		return (
			<p data-testid="form-diff" className="text-sm text-slate-500">
				Sem diferenças nos campos.
			</p>
		);
	}
	const section = (
		title: string,
		tone: 'green' | 'red' | 'amber',
		items: Array<{ key: string; label: string; block: string; extra?: string }>,
	) =>
		items.length > 0 && (
			<div data-testid={`diff-${title}`}>
				<p className="text-sm font-medium mb-1.5">
					<Badge tone={tone}>{items.length}</Badge> {title}
				</p>
				<ul className="space-y-1 text-sm text-slate-600 dark:text-gray-400">
					{items.map((i) => (
						<li key={i.key}>
							<b className="text-slate-800 dark:text-slate-200">
								{i.label || i.key}
							</b>{' '}
							<span className="text-xs">· {i.block}</span>
							{i.extra && <span className="text-xs"> · {i.extra}</span>}
						</li>
					))}
				</ul>
			</div>
		);
	return (
		<div data-testid="form-diff" className="space-y-4">
			{section('novos', 'green', diff.added)}
			{section('removidos', 'red', diff.removed)}
			{section(
				'alterados',
				'amber',
				diff.changed.map((c) => ({ ...c, extra: c.changes.join(', ') })),
			)}
		</div>
	);
}

// ── Arrastar para reordenar ──────────────────────────────────────────────────
/** Item arrastável: só a alça (⋮⋮) inicia o arraste; os inputs seguem livres. */
function Sortable({
	id,
	label,
	children,
}: {
	id: string;
	label: string;
	children: (handle: ReactNode) => ReactNode;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });
	const handle = (
		<button
			type="button"
			ref={setActivatorNodeRef}
			{...attributes}
			{...listeners}
			aria-label={label}
			className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 cursor-grab active:cursor-grabbing touch-none shrink-0"
		>
			<GripVertical className="w-4 h-4" />
		</button>
	);
	return (
		<div
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				opacity: isDragging ? 0.6 : undefined,
				position: 'relative',
				zIndex: isDragging ? 10 : undefined,
			}}
		>
			{children(handle)}
		</div>
	);
}

function useDragSensors() {
	return useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);
}

/** Lista reordenada após soltar `active` sobre `over` (null = nada muda). */
function reorder<T extends { cid: string }>(
	items: T[],
	e: DragEndEvent,
): T[] | null {
	if (!e.over || e.active.id === e.over.id) return null;
	const from = items.findIndex((i) => i.cid === e.active.id);
	const to = items.findIndex((i) => i.cid === e.over?.id);
	if (from < 0 || to < 0) return null;
	return arrayMove(items, from, to);
}

// ── Builder ──────────────────────────────────────────────────────────────────
function FormBuilder({
	state,
	setState,
	onClose,
}: {
	state: BuilderState;
	setState: (s: BuilderState) => void;
	onClose: () => void;
}) {
	const { create } = useFormTemplateMutations();
	const templates = useFormTemplatesAdmin();
	const sensors = useDragSensors();
	const [confirmLeave, setConfirmLeave] = useState(false);
	const [showDiff, setShowDiff] = useState(false);

	const dirty = snapshotOf(state) !== state.initial;

	// Fechar a aba / recarregar com alterações pede confirmação do navegador.
	useEffect(() => {
		if (!dirty) return;
		const onBeforeUnload = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = '';
		};
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, [dirty]);

	const cancel = () => (dirty ? setConfirmLeave(true) : onClose());

	const set = (patch: Partial<BuilderState>) =>
		setState({ ...state, ...patch });

	const setBlock = (idx: number, patch: Partial<BuilderBlock>) => {
		const blocks = state.blocks.map((b, i) =>
			i === idx ? { ...b, ...patch } : b,
		);
		set({ blocks });
	};

	const addBlock = () => {
		// length+1 repetia a key depois de remover um bloco do meio
		// ([1,2,3] − 2 + novo = dois bloco_3); pula as keys já usadas.
		const used = new Set(state.blocks.map((b) => b.key));
		let n = state.blocks.length + 1;
		while (used.has(`bloco_${n}`)) n++;
		set({
			blocks: [
				...state.blocks,
				{
					key: `bloco_${n}`,
					title: `Bloco ${n}`,
					fields: [],
					cid: newCid(),
					locked: false,
				},
			],
		});
	};

	const removeBlock = (idx: number) =>
		set({ blocks: state.blocks.filter((_, i) => i !== idx) });

	const addField = (blockIdx: number) => {
		const block = state.blocks[blockIdx];
		setBlock(blockIdx, {
			fields: [
				...block.fields,
				{
					key: '',
					label: '',
					type: 'text',
					required: false,
					cid: newCid(),
					locked: false,
				},
			],
		});
	};

	const setField = (
		blockIdx: number,
		fieldIdx: number,
		patch: Partial<BuilderField>,
	) => {
		const block = state.blocks[blockIdx];
		setBlock(blockIdx, {
			fields: block.fields.map((f, i) =>
				i === fieldIdx ? { ...f, ...patch } : f,
			),
		});
	};

	const removeField = (blockIdx: number, fieldIdx: number) => {
		const block = state.blocks[blockIdx];
		setBlock(blockIdx, {
			fields: block.fields.filter((_, i) => i !== fieldIdx),
		});
	};

	// metric_key já usada por outro campo (a API recusa repetida).
	const usedMetrics = new Map<string, string>();
	for (const b of state.blocks) {
		for (const f of b.fields) {
			if (f.metric_key) usedMetrics.set(f.metric_key, f.cid);
		}
	}

	// Template fake p/ preview com o DynamicForm real.
	const previewTemplate: MntFormTemplate = useMemo(
		() => ({
			id: 'preview',
			key: state.key || 'preview',
			version: (state.baseVersion ?? 0) + 1,
			title: state.title || 'Sem título',
			description: state.description || null,
			schema: { blocks: toSchemaBlocks(state.blocks) },
			published: false,
			created_at: '',
			updated_at: '',
		}),
		[state],
	);

	const diff = useMemo(
		() =>
			showDiff
				? diffFormSchemas(state.baseBlocks, toSchemaBlocks(state.blocks))
				: null,
		[showDiff, state.baseBlocks, state.blocks],
	);

	const save = async () => {
		const key = state.baseKey ?? toSnakeCase(state.key);
		if (!key) {
			toast.error('Informe a chave (key) do formulário');
			return;
		}
		// Formulário novo com key existente virava, calado, nova versão do outro
		// formulário (e trocava o diagnóstico/ferramenta dos alunos ao publicar).
		if (!state.baseKey && templates.data?.some((t) => t.key === key)) {
			toast.error(
				'Já existe um formulário com essa chave. Use "Editar" nele ou escolha outra chave.',
			);
			return;
		}
		if (!state.title.trim()) {
			toast.error('Informe o título do formulário');
			return;
		}
		if (!state.blocks.length) {
			toast.error('Adicione pelo menos um bloco');
			return;
		}
		const blockKeys = new Set<string>();
		const fieldKeys = new Set<string>();
		const metricKeys = new Set<string>();
		for (const block of state.blocks) {
			if (blockKeys.has(block.key)) {
				toast.error(
					`Há dois blocos com a key "${block.key}". Renomeie um deles.`,
				);
				return;
			}
			blockKeys.add(block.key);
			if (!block.fields.length) {
				toast.error(`O bloco "${block.title}" não tem campos`);
				return;
			}
			for (const f of block.fields) {
				if (!f.label.trim() || !f.key) {
					toast.error(`Há campo sem rótulo no bloco "${block.title}"`);
					return;
				}
				if (fieldKeys.has(f.key)) {
					toast.error(
						`Há dois campos com a key "${f.key}": as respostas se sobreporiam. Renomeie um deles.`,
					);
					return;
				}
				fieldKeys.add(f.key);
				// Versão antiga pode trazer métrica repetida (a API recusa).
				if (f.metric_key && metricKeys.has(f.metric_key)) {
					toast.error(`Duas perguntas usam a métrica "${f.metric_key}".`);
					return;
				}
				if (f.metric_key) metricKeys.add(f.metric_key);
				if (f.type === 'select' && !(f.options?.length ?? 0)) {
					toast.error(`O campo "${f.label}" (seleção) precisa de opções`);
					return;
				}
			}
		}
		try {
			await create.mutateAsync({
				key,
				title: state.title.trim(),
				description: state.description.trim() || null,
				schema: { blocks: toSchemaBlocks(state.blocks) },
			});
			toast.success('Nova versão salva (rascunho).');
			onClose();
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao salvar o formulário'));
		}
	};

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<main className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
				<PageTitle
					title={
						state.baseKey
							? `Editar ${state.baseKey} (gera v${(state.baseVersion ?? 0) + 1})`
							: 'Novo formulário'
					}
					description="Arraste ⋮⋮ para reordenar. O preview é o que o aluno vê."
					actions={
						<>
							{dirty && (
								<span
									data-testid="unsaved-badge"
									className="text-xs text-amber-600 dark:text-amber-400"
								>
									Não salvo
								</span>
							)}
							{state.baseKey && (
								<button
									type="button"
									className={secondaryBtn}
									aria-pressed={showDiff}
									onClick={() => setShowDiff((v) => !v)}
								>
									<GitCompare className="w-4 h-4" />
									Comparar com v{state.baseVersion}
								</button>
							)}
							<button type="button" className={secondaryBtn} onClick={cancel}>
								Cancelar
							</button>
							<button
								type="button"
								className={primaryBtn}
								onClick={save}
								disabled={create.isPending}
							>
								{create.isPending ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<CheckCircle2 className="w-4 h-4" />
								)}
								Salvar nova versão
							</button>
						</>
					}
				/>

				{diff && (
					<Card className="p-5 mb-6">
						<p className="text-sm font-semibold mb-3">
							Mudanças desde a v{state.baseVersion}
						</p>
						<DiffView diff={diff} />
					</Card>
				)}

				<div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
					{/* Builder */}
					<div className="space-y-4">
						<Card className="p-5 space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<Field
									label="Chave (key)"
									required
									hint={
										state.baseKey
											? 'Fixa entre versões.'
											: 'Ex.: diagnostico_inicial.'
									}
								>
									<input
										className={`${inputClass} font-mono`}
										value={state.key}
										disabled={!!state.baseKey}
										onChange={(e) =>
											set({ key: toSnakeCaseTyping(e.target.value) })
										}
										placeholder="diagnostico_inicial"
									/>
								</Field>
								<Field label="Título" required>
									<input
										className={inputClass}
										value={state.title}
										onChange={(e) => set({ title: e.target.value })}
										placeholder="Diagnóstico inicial"
									/>
								</Field>
							</div>
							<Field label="Descrição">
								<textarea
									className={`${inputClass} min-h-16`}
									value={state.description}
									onChange={(e) => set({ description: e.target.value })}
								/>
							</Field>
						</Card>

						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragEnd={(e) => {
								const blocks = reorder(state.blocks, e);
								if (blocks) set({ blocks });
							}}
						>
							<SortableContext
								items={state.blocks.map((b) => b.cid)}
								strategy={verticalListSortingStrategy}
							>
								<div className="space-y-4">
									{state.blocks.map((block, bi) => (
										<Sortable
											key={block.cid}
											id={block.cid}
											label={`Arrastar bloco ${block.title}`}
										>
											{(handle) => (
												<div data-testid="builder-block">
													<Card className="p-5 space-y-4">
														<div className="flex items-center gap-2">
															{handle}
															<input
																className={`${inputClass} font-semibold`}
																aria-label="Nome do bloco"
																value={block.title}
																onChange={(e) => {
																	const title = e.target.value;
																	setBlock(
																		bi,
																		block.locked
																			? { title }
																			: {
																					title,
																					key: toSnakeCase(title) || block.key,
																				},
																	);
																}}
																placeholder="Nome do bloco"
															/>
															<button
																type="button"
																className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 shrink-0"
																onClick={() => removeBlock(bi)}
																aria-label="Remover bloco"
															>
																<Trash2 className="w-4 h-4" />
															</button>
														</div>
														<input
															className={`${inputClass} text-sm`}
															aria-label="Descrição do bloco"
															value={block.description ?? ''}
															onChange={(e) =>
																setBlock(bi, { description: e.target.value })
															}
															placeholder="Descrição do bloco (opcional)"
														/>

														<DndContext
															sensors={sensors}
															collisionDetection={closestCenter}
															onDragEnd={(e) => {
																const fields = reorder(block.fields, e);
																if (fields) setBlock(bi, { fields });
															}}
														>
															<SortableContext
																items={block.fields.map((f) => f.cid)}
																strategy={verticalListSortingStrategy}
															>
																<div className="space-y-3">
																	{block.fields.map((field, fi) => (
																		<Sortable
																			key={field.cid}
																			id={field.cid}
																			label={`Arrastar campo ${field.label || fi + 1}`}
																		>
																			{(fieldHandle) => (
																				<FieldEditor
																					field={field}
																					handle={fieldHandle}
																					metricTaken={(m) =>
																						usedMetrics.has(m) &&
																						usedMetrics.get(m) !== field.cid
																					}
																					onChange={(patch) =>
																						setField(bi, fi, patch)
																					}
																					onRemove={() => removeField(bi, fi)}
																				/>
																			)}
																		</Sortable>
																	))}
																</div>
															</SortableContext>
														</DndContext>

														<button
															type="button"
															className={secondaryBtn}
															onClick={() => addField(bi)}
														>
															<Plus className="w-3.5 h-3.5" />
															Adicionar campo
														</button>
													</Card>
												</div>
											)}
										</Sortable>
									))}
								</div>
							</SortableContext>
						</DndContext>

						<button type="button" className={secondaryBtn} onClick={addBlock}>
							<Plus className="w-4 h-4" />
							Adicionar bloco
						</button>
					</div>

					{/* Preview */}
					<div className="xl:sticky xl:top-6">
						<div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-600 dark:text-gray-400">
							<Eye className="w-4 h-4" />
							Preview (visão do aluno)
						</div>
						{state.blocks.length ? (
							<DynamicForm template={previewTemplate} />
						) : (
							<Card>
								<EmptyState message="Adicione blocos e campos para ver o preview." />
							</Card>
						)}
					</div>
				</div>
			</main>

			{confirmLeave && (
				<Modal
					title="Descartar alterações?"
					onClose={() => setConfirmLeave(false)}
				>
					<p className="text-sm text-slate-600 dark:text-gray-400">
						O que não foi salvo se perde.
					</p>
					<div className="flex justify-end gap-2 pt-4">
						<button
							type="button"
							className={secondaryBtn}
							onClick={() => setConfirmLeave(false)}
						>
							Continuar editando
						</button>
						<button
							type="button"
							className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
							onClick={onClose}
						>
							Descartar
						</button>
					</div>
				</Modal>
			)}
		</div>
	);
}

function FieldEditor({
	field,
	handle,
	metricTaken,
	onChange,
	onRemove,
}: {
	field: BuilderField;
	handle: ReactNode;
	metricTaken: (metric: string) => boolean;
	onChange: (patch: Partial<BuilderField>) => void;
	onRemove: () => void;
}) {
	return (
		<div
			data-testid="builder-field"
			className="rounded-xl border border-slate-200 dark:border-white/10 p-3 space-y-3 bg-surface"
		>
			<div className="flex items-start gap-2">
				<div className="pt-6">{handle}</div>
				<div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
					<Field
						label="Rótulo"
						required
						hint={
							field.locked
								? `key: ${field.key} (fixa)`
								: field.key
									? `key: ${field.key}`
									: 'key gerada do rótulo'
						}
					>
						<input
							className={inputClass}
							aria-label="Rótulo"
							value={field.label}
							onChange={(e) =>
								onChange(
									field.locked
										? { label: e.target.value }
										: {
												label: e.target.value,
												key: toSnakeCase(e.target.value),
											},
								)
							}
							placeholder="Faturamento mensal"
						/>
					</Field>
					<Field label="Tipo">
						<select
							className={inputClass}
							aria-label="Tipo"
							value={field.type}
							onChange={(e) =>
								onChange({
									type: e.target.value as FormFieldType,
									options:
										e.target.value === 'select'
											? (field.options ?? [])
											: undefined,
									optionsText: undefined,
								})
							}
						>
							{/* Tipo que o builder não oferece (ex.: multiselect
							    vindo do seed) continua visível e preservado. */}
							{!FIELD_TYPES.some((t) => t.value === field.type) && (
								<option value={field.type}>{field.type}</option>
							)}
							{FIELD_TYPES.map((t) => (
								<option key={t.value} value={t.value}>
									{t.label}
								</option>
							))}
						</select>
					</Field>
					<Field label="Métrica">
						<select
							className={inputClass}
							aria-label="Métrica"
							title="Leva a resposta ao comparador (Foto Zero × Agora)"
							value={field.metric_key ?? ''}
							onChange={(e) =>
								onChange({ metric_key: e.target.value || undefined })
							}
						>
							<option value="">Nenhuma</option>
							{/* Key antiga fora da lista continua visível e preservada. */}
							{field.metric_key &&
								!METRIC_OPTIONS.some((m) => m.value === field.metric_key) && (
									<option value={field.metric_key}>{field.metric_key}</option>
								)}
							{METRIC_OPTIONS.map((m) => (
								<option
									key={m.value}
									value={m.value}
									disabled={metricTaken(m.value)}
								>
									{m.label}
									{metricTaken(m.value) ? ' (em uso)' : ''}
								</option>
							))}
						</select>
					</Field>
				</div>
			</div>
			{field.type === 'select' && (
				<Field label="Opções (uma por linha)" required>
					<textarea
						className={`${inputClass} min-h-16`}
						// Texto cru enquanto digita: parsear a cada tecla comia o
						// Enter e o espaço final, e não dava para escrever a 2ª opção.
						value={field.optionsText ?? (field.options ?? []).join('\n')}
						onChange={(e) =>
							onChange({
								optionsText: e.target.value,
								options: parseOptions(e.target.value),
							})
						}
					/>
				</Field>
			)}
			<div className="flex items-center gap-5 flex-wrap">
				<label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
					<input
						type="checkbox"
						className="w-4 h-4 accent-violet-600"
						checked={field.required ?? false}
						onChange={(e) => onChange({ required: e.target.checked })}
					/>
					Obrigatório
				</label>
				<label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
					<input
						type="checkbox"
						className="w-4 h-4 accent-violet-600"
						checked={field.allow_unknown ?? false}
						onChange={(e) => onChange({ allow_unknown: e.target.checked })}
					/>
					Permitir "[A levantar / não medido]"
				</label>
				<button
					type="button"
					className="ml-auto inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600"
					onClick={onRemove}
				>
					<Trash2 className="w-3.5 h-3.5" />
					Remover campo
				</button>
			</div>
		</div>
	);
}
