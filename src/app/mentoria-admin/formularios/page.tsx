'use client';

import {
	CheckCircle2,
	Eye,
	Info,
	Loader2,
	Pencil,
	Plus,
	Trash2,
	Upload,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/dashboard/header';
import { DynamicForm } from '@/modules/mentoria/components/dynamic-form';
import type {
	FormBlock,
	FormField,
	FormFieldType,
	MntFormTemplate,
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
	{ value: 'scale', label: 'Escala (1–5)' },
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

type BuilderState = {
	/** null = template totalmente novo (key editável). */
	baseKey: string | null;
	key: string;
	title: string;
	description: string;
	blocks: FormBlock[];
	baseVersion: number | null;
};

export default function FormulariosPage() {
	const templates = useFormTemplatesAdmin();
	const { publish } = useFormTemplateMutations();
	const [builder, setBuilder] = useState<BuilderState | null>(null);

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

	const openEditor = (t: MntFormTemplate | null) => {
		setBuilder(
			t
				? {
						baseKey: t.key,
						key: t.key,
						title: t.title,
						description: t.description ?? '',
						blocks: structuredClone(t.schema.blocks),
						baseVersion: t.version,
					}
				: {
						baseKey: null,
						key: '',
						title: '',
						description: '',
						blocks: [],
						baseVersion: null,
					},
		);
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
					description="Templates data-driven do diagnóstico e exercícios. Cada salvamento gera uma nova versão."
					backHref="/mentoria-admin"
					actions={
						<button
							type="button"
							className={primaryBtn}
							onClick={() => openEditor(null)}
						>
							<Plus className="w-4 h-4" />
							Novo formulário
						</button>
					}
				/>

				<div className="mb-6 flex items-start gap-2 rounded-xl border border-blue-300/50 dark:border-blue-500/30 bg-blue-500/5 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
					<Info className="w-4 h-4 mt-0.5 shrink-0" />
					<p>
						<b>Publicar congela a versão</b>: respostas enviadas ficam sempre
						amarradas à versão respondida. Editar um formulário cria uma{' '}
						<b>nova versão</b> em rascunho.
					</p>
				</div>

				{templates.isLoading ? (
					<Card>
						<Spinner />
					</Card>
				) : !grouped.length ? (
					<Card>
						<EmptyState message="Nenhum template de formulário cadastrado." />
					</Card>
				) : (
					<div className="space-y-4">
						{grouped.map(([key, versions]) => {
							const latest = versions[0];
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
										<div className="flex gap-2">
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
												onClick={() => openEditor(latest)}
											>
												<Pencil className="w-3.5 h-3.5" />
												Editar (nova versão)
											</button>
										</div>
									</div>
								</Card>
							);
						})}
					</div>
				)}
			</main>
		</div>
	);
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

	const set = (patch: Partial<BuilderState>) =>
		setState({ ...state, ...patch });

	const setBlock = (idx: number, patch: Partial<FormBlock>) => {
		const blocks = state.blocks.map((b, i) =>
			i === idx ? { ...b, ...patch } : b,
		);
		set({ blocks });
	};

	const addBlock = () => {
		const n = state.blocks.length + 1;
		set({
			blocks: [
				...state.blocks,
				{ key: `bloco_${n}`, title: `Bloco ${n}`, fields: [] },
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
				{ key: '', label: '', type: 'text', required: false },
			],
		});
	};

	const setField = (
		blockIdx: number,
		fieldIdx: number,
		patch: Partial<FormField>,
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

	// Template fake p/ preview com o DynamicForm real.
	const previewTemplate: MntFormTemplate = useMemo(
		() => ({
			id: 'preview',
			key: state.key || 'preview',
			version: (state.baseVersion ?? 0) + 1,
			title: state.title || 'Sem título',
			description: state.description || null,
			schema: { blocks: state.blocks },
			published: false,
			created_at: '',
			updated_at: '',
		}),
		[state],
	);

	const save = async () => {
		const key = state.baseKey ?? toSnakeCase(state.key);
		if (!key) {
			toast.error('Informe a chave (key) do formulário');
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
		for (const block of state.blocks) {
			if (!block.fields.length) {
				toast.error(`O bloco "${block.title}" não tem campos`);
				return;
			}
			for (const f of block.fields) {
				if (!f.label.trim() || !f.key) {
					toast.error(`Há campo sem rótulo no bloco "${block.title}"`);
					return;
				}
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
				schema: { blocks: state.blocks },
			});
			toast.success(
				'Formulário salvo como nova versão (rascunho). Publique quando estiver pronto.',
			);
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
							? `Editar formulário: ${state.baseKey} (gera v${(state.baseVersion ?? 0) + 1})`
							: 'Novo formulário'
					}
					description="Monte blocos e campos; o preview ao lado usa o mesmo componente que o aluno vê. Salvar cria sempre uma nova versão em rascunho."
					actions={
						<>
							<button type="button" className={secondaryBtn} onClick={onClose}>
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
											? 'A chave não muda entre versões.'
											: 'Identificador único, ex.: diagnostico_inicial.'
									}
								>
									<input
										className={`${inputClass} font-mono`}
										value={state.key}
										disabled={!!state.baseKey}
										onChange={(e) => set({ key: toSnakeCase(e.target.value) })}
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

						{state.blocks.map((block, bi) => (
							<Card key={`block-${bi}-${block.key}`} className="p-5 space-y-4">
								<div className="flex items-center gap-2">
									<input
										className={`${inputClass} font-semibold`}
										value={block.title}
										onChange={(e) => {
											const title = e.target.value;
											setBlock(bi, {
												title,
												key: toSnakeCase(title) || block.key,
											});
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

								{block.fields.map((field, fi) => (
									<div
										key={`field-${bi}-${fi}`}
										className="rounded-xl border border-slate-200 dark:border-white/10 p-3 space-y-3"
									>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
											<Field
												label="Rótulo"
												required
												hint={
													field.key
														? `key: ${field.key}`
														: 'key gerada do rótulo'
												}
											>
												<input
													className={inputClass}
													value={field.label}
													onChange={(e) =>
														setField(bi, fi, {
															label: e.target.value,
															key: toSnakeCase(e.target.value),
														})
													}
													placeholder="Faturamento mensal"
												/>
											</Field>
											<Field label="Tipo">
												<select
													className={inputClass}
													value={field.type}
													onChange={(e) =>
														setField(bi, fi, {
															type: e.target.value as FormFieldType,
															options:
																e.target.value === 'select'
																	? (field.options ?? [])
																	: undefined,
														})
													}
												>
													{FIELD_TYPES.map((t) => (
														<option key={t.value} value={t.value}>
															{t.label}
														</option>
													))}
												</select>
											</Field>
										</div>
										{field.type === 'select' && (
											<Field
												label="Opções (uma por linha)"
												required
												hint="Cada linha vira uma opção da seleção."
											>
												<textarea
													className={`${inputClass} min-h-16`}
													value={(field.options ?? []).join('\n')}
													onChange={(e) =>
														setField(bi, fi, {
															options: e.target.value
																.split('\n')
																.map((o) => o.trim())
																.filter(Boolean),
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
													onChange={(e) =>
														setField(bi, fi, { required: e.target.checked })
													}
												/>
												Obrigatório
											</label>
											<label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
												<input
													type="checkbox"
													className="w-4 h-4 accent-violet-600"
													checked={field.allow_unknown ?? false}
													onChange={(e) =>
														setField(bi, fi, {
															allow_unknown: e.target.checked,
														})
													}
												/>
												Permitir "[A levantar / não medido]"
											</label>
											<button
												type="button"
												className="ml-auto inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600"
												onClick={() => removeField(bi, fi)}
											>
												<Trash2 className="w-3.5 h-3.5" />
												Remover campo
											</button>
										</div>
									</div>
								))}

								<button
									type="button"
									className={secondaryBtn}
									onClick={() => addField(bi)}
								>
									<Plus className="w-3.5 h-3.5" />
									Adicionar campo
								</button>
							</Card>
						))}

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
		</div>
	);
}
