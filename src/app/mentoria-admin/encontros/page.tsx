'use client';

import { Button, buttonLabel, Checkbox, Input } from '@upvox-dev/ui';
import {
	CheckCircle2,
	EyeOff,
	Loader2,
	Pencil,
	Plus,
	Trash2,
	Upload,
	X,
} from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { Text } from 'react-native-css/components/Text';
import { toast } from 'sonner';
import { Header } from '@/components/dashboard/header';
import { Markdown } from '@/modules/mentoria/components/markdown';
import type {
	MeetingTaskPrompt,
	MntFormTemplate,
	MntMeetingTemplate,
} from '@/modules/mentoria/types';
import {
	mentoriaErrorMessage,
	useFormTemplatesAdmin,
	useMeetingTemplateMutations,
	useMeetingTemplatePublishImpact,
	useMeetingTemplatesAdmin,
	useToolDefinitionsAdmin,
} from '../_components/admin-hooks';
import {
	Badge,
	Card,
	dangerBtn,
	EmptyState,
	Field,
	inputClass,
	Modal,
	PageTitle,
	primaryBtn,
	Spinner,
	secondaryBtn,
} from '../_components/ui';

type Editing = { template: MntMeetingTemplate | null } | null;
type Confirm = {
	kind: 'publish' | 'unpublish' | 'delete';
	template: MntMeetingTemplate;
} | null;

/**
 * Único programa de mentoria que existe (turmas e seed usam este). O campo era
 * texto livre e virou fonte de templates órfãos ("Mentoria 360", "mentoria_360"),
 * que nenhuma jornada enxerga — a api agora recusa outro valor.
 */
const PROGRAM_KEY = 'laser360';

export default function EncontrosPage() {
	const templates = useMeetingTemplatesAdmin();
	const [editing, setEditing] = useState<Editing>(null);
	const [confirm, setConfirm] = useState<Confirm>(null);

	// Agrupa por position; ordena versões desc dentro de cada grupo.
	const grouped = useMemo(() => {
		const map = new Map<number, MntMeetingTemplate[]>();
		for (const t of templates.data ?? []) {
			const list = map.get(t.position) ?? [];
			list.push(t);
			map.set(t.position, list);
		}
		for (const list of map.values()) {
			list.sort((a, b) => b.version - a.version);
		}
		return [...map.entries()].sort(([a], [b]) => a - b);
	}, [templates.data]);

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<main className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
				<PageTitle
					title="Encontros"
					description="Editar cria um rascunho; publicar leva aos alunos."
					backHref="/mentoria-admin"
					actions={
						<Button onPress={() => setEditing({ template: null })}>
							<Plus className="w-4 h-4" />
							{/* Ícone + texto vira array; Button só embrulha em <Text>
							    quando `children` é string pura. */}
							<Text className={buttonLabel({ variant: 'primary' })}>
								Novo encontro
							</Text>
						</Button>
					}
				/>

				{templates.isLoading ? (
					<Card>
						<Spinner />
					</Card>
				) : templates.isError ? (
					<Card>
						<EmptyState message="Não foi possível carregar os encontros." />
					</Card>
				) : !grouped.length ? (
					<Card>
						<EmptyState message="Nenhum template de encontro cadastrado." />
					</Card>
				) : (
					<div className="space-y-4">
						{grouped.map(([position, versions]) => {
							const latest = versions[0];
							const publishedCount = versions.filter((v) => v.published).length;
							return (
								<Card key={position} className="p-5">
									<div className="flex items-start justify-between gap-4 flex-wrap">
										<div className="flex items-start gap-3 min-w-0">
											<div className="w-9 h-9 rounded-full bg-violet-500/10 flex items-center justify-center text-sm font-semibold text-violet-600 dark:text-violet-400 shrink-0">
												{position}
											</div>
											<div className="min-w-0">
												<p className="font-semibold text-slate-900 dark:text-white">
													{latest.title}
												</p>
												{latest.subtitle && (
													<p className="text-sm text-slate-500 dark:text-gray-400">
														{latest.subtitle}
													</p>
												)}
												<div className="flex items-center gap-2 mt-2 flex-wrap">
													{versions.map((v) => (
														<span
															key={v.id}
															className="inline-flex items-center gap-0.5"
														>
															<Badge tone={v.published ? 'green' : 'amber'}>
																v{v.version}{' '}
																{v.published ? 'publicada' : 'rascunho'}
															</Badge>
															{v.published ? (
																// Só com outra publicada: a posição não pode
																// ficar sem conteúdo para quem se matricula.
																publishedCount > 1 && (
																	<IconAction
																		label={`Despublicar v${v.version}`}
																		onClick={() =>
																			setConfirm({
																				kind: 'unpublish',
																				template: v,
																			})
																		}
																	>
																		<EyeOff className="w-3.5 h-3.5" />
																	</IconAction>
																)
															) : (
																<IconAction
																	label={`Excluir rascunho v${v.version}`}
																	danger
																	onClick={() =>
																		setConfirm({ kind: 'delete', template: v })
																	}
																>
																	<Trash2 className="w-3.5 h-3.5" />
																</IconAction>
															)}
														</span>
													))}
													{latest.is_final && (
														<Badge tone="violet">Encontro final</Badge>
													)}
												</div>
											</div>
										</div>
										<div className="flex gap-2">
											{!latest.published && (
												<Button
													variant="secondary"
													onPress={() =>
														setConfirm({ kind: 'publish', template: latest })
													}
												>
													<Upload className="w-3.5 h-3.5" />
													{/* O número da versão fica DENTRO do mesmo <Text> —
													    <Text> aceita string+number misturados por dentro,
													    só o <View> ao redor do Button é que não aceita. */}
													<Text
														className={buttonLabel({ variant: 'secondary' })}
													>
														Publicar v{latest.version}
													</Text>
												</Button>
											)}
											<Button
												variant="secondary"
												onPress={() => setEditing({ template: latest })}
											>
												<Pencil className="w-3.5 h-3.5" />
												<Text className={buttonLabel({ variant: 'secondary' })}>
													Editar
												</Text>
											</Button>
										</div>
									</div>
								</Card>
							);
						})}
					</div>
				)}
			</main>

			{editing && (
				<MeetingTemplateModal
					template={editing.template}
					takenPositions={grouped.map(([position]) => position)}
					onClose={() => setEditing(null)}
				/>
			)}
			{confirm && (
				<ConfirmModal
					confirm={confirm}
					versions={
						grouped.find(([p]) => p === confirm.template.position)?.[1] ?? []
					}
					onClose={() => setConfirm(null)}
				/>
			)}
		</div>
	);
}

function IconAction({
	label,
	onClick,
	danger = false,
	children,
}: {
	label: string;
	onClick: () => void;
	danger?: boolean;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			title={label}
			aria-label={label}
			onClick={onClick}
			className={`p-1 rounded-md transition ${danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-white/10 dark:hover:text-white'}`}
		>
			{children}
		</button>
	);
}

/** Publicar mostra o impacto antes; despublicar diz para qual versão volta. */
function ConfirmModal({
	confirm,
	versions,
	onClose,
}: {
	confirm: NonNullable<Confirm>;
	versions: MntMeetingTemplate[];
	onClose: () => void;
}) {
	const { publish, unpublish, remove } = useMeetingTemplateMutations();
	const t = confirm.template;
	const impact = useMeetingTemplatePublishImpact(
		confirm.kind === 'publish' ? t.id : null,
	);
	const fallback = versions.find((v) => v.published && v.id !== t.id);
	const pending = publish.isPending || unpublish.isPending || remove.isPending;

	const run = async () => {
		try {
			if (confirm.kind === 'publish') {
				const res = await publish.mutateAsync(t.id);
				const n = res.journeys_updated ?? 0;
				toast.success(
					n > 0
						? `v${t.version} publicada · ${n} aluno(s) atualizados`
						: `v${t.version} publicada`,
				);
			} else if (confirm.kind === 'unpublish') {
				const res = await unpublish.mutateAsync(t.id);
				toast.success(
					`v${t.version} despublicada · ${res.journeys_updated} aluno(s) voltaram`,
				);
			} else {
				await remove.mutateAsync(t.id);
				toast.success(`Rascunho v${t.version} excluído`);
			}
			onClose();
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Não foi possível concluir.'));
		}
	};

	const title =
		confirm.kind === 'publish'
			? `Publicar Encontro ${t.position} v${t.version}?`
			: confirm.kind === 'unpublish'
				? `Despublicar Encontro ${t.position} v${t.version}?`
				: `Excluir rascunho v${t.version}?`;

	let message: ReactNode = 'Não dá para desfazer.';
	if (confirm.kind === 'publish') {
		const n = impact.data?.journeys ?? 0;
		message = impact.isLoading ? (
			'Calculando alunos afetados…'
		) : impact.isError ? (
			'Não deu para calcular o impacto.'
		) : n > 0 ? (
			<>
				Vai atualizar <b>{n}</b> aluno(s) em andamento.
			</>
		) : (
			'Nenhum aluno em andamento muda.'
		);
	} else if (confirm.kind === 'unpublish') {
		message = fallback ? (
			<>
				Os alunos voltam para a <b>v{fallback.version}</b>.
			</>
		) : (
			'É a única versão publicada.'
		);
	}

	return (
		<Modal title={title} onClose={onClose}>
			<p
				data-testid="confirm-message"
				className="text-sm text-slate-600 dark:text-gray-400"
			>
				{message}
			</p>
			<div className="flex justify-end gap-2 pt-4">
				<button type="button" className={secondaryBtn} onClick={onClose}>
					Cancelar
				</button>
				<button
					type="button"
					className={confirm.kind === 'publish' ? primaryBtn : dangerBtn}
					onClick={run}
					disabled={
						pending ||
						(confirm.kind === 'publish' && impact.isLoading) ||
						(confirm.kind === 'unpublish' && !fallback)
					}
				>
					{pending && <Loader2 className="w-4 h-4 animate-spin" />}
					{confirm.kind === 'publish'
						? 'Publicar'
						: confirm.kind === 'unpublish'
							? 'Despublicar'
							: 'Excluir'}
				</button>
			</div>
		</Modal>
	);
}

/** Última versão publicada de cada formulário (o exercício do aluno). */
function publishedForms(all: MntFormTemplate[] | undefined): MntFormTemplate[] {
	const latest = new Map<string, MntFormTemplate>();
	for (const f of all ?? []) {
		if (!f.published) continue;
		const cur = latest.get(f.key);
		if (!cur || f.version > cur.version) latest.set(f.key, f);
	}
	return [...latest.values()].sort((a, b) => a.title.localeCompare(b.title));
}

// Tarefa sugerida não tem id: `cid` só existe na tela, para a key do React
// (o índice embaralhava os inputs ao remover uma do meio).
type PromptRow = MeetingTaskPrompt & { cid: string };
let promptSeq = 0;
const newPromptCid = () => `p${++promptSeq}`;

function MeetingTemplateModal({
	template,
	takenPositions,
	onClose,
}: {
	template: MntMeetingTemplate | null;
	takenPositions: number[];
	onClose: () => void;
}) {
	const { create } = useMeetingTemplateMutations();
	const tools = useToolDefinitionsAdmin();
	const forms = useFormTemplatesAdmin();
	const [preview, setPreview] = useState(false);
	const [form, setForm] = useState({
		position: template?.position ?? 1,
		title: template?.title ?? '',
		subtitle: template?.subtitle ?? '',
		description: template?.description ?? '',
		objectives: template?.objectives ?? '',
		content_md: template?.content_md ?? '',
		expected_result: template?.expected_result ?? '',
		is_final: template?.is_final ?? false,
		tool_definition_ids: template?.tool_definition_ids ?? [],
		exercise_form_template_id: template?.exercise_form_template_id ?? '',
		task_prompts: (template?.task_prompts ?? []).map(
			(p): PromptRow => ({ ...p, cid: newPromptCid() }),
		),
	});
	const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
		setForm((f) => ({ ...f, [key]: value }));

	const exerciseOptions = useMemo(
		() => publishedForms(forms.data),
		[forms.data],
	);
	// Vínculo atual que não está mais na lista (versão antiga): continua
	// visível para não ser trocado sem querer.
	const currentExercise = (forms.data ?? []).find(
		(f) => f.id === form.exercise_form_template_id,
	);
	const toolOptions = (tools.data ?? []).filter(
		(t) => t.active || form.tool_definition_ids.includes(t.id),
	);

	const toggleTool = (id: string, on: boolean) =>
		set(
			'tool_definition_ids',
			on
				? [...form.tool_definition_ids, id]
				: form.tool_definition_ids.filter((x) => x !== id),
		);
	const setPrompt = (cid: string, patch: Partial<MeetingTaskPrompt>) =>
		set(
			'task_prompts',
			form.task_prompts.map((p) => (p.cid === cid ? { ...p, ...patch } : p)),
		);

	const save = async () => {
		if (!form.title.trim()) {
			toast.error('Informe o título do encontro');
			return;
		}
		if (form.position < 1 || form.position > 10) {
			toast.error('A posição deve estar entre 1 e 10');
			return;
		}
		// "Novo" numa posição ocupada virava versão nova do encontro existente,
		// sem aviso: o caminho certo é o Editar daquela posição.
		if (!template && takenPositions.includes(form.position)) {
			toast.error(`O Encontro ${form.position} já existe. Use "Editar" nele.`);
			return;
		}
		if (form.task_prompts.some((p) => !p.title.trim())) {
			toast.error('Dê um título a cada tarefa sugerida');
			return;
		}
		try {
			await create.mutateAsync({
				program_key: PROGRAM_KEY,
				position: form.position,
				title: form.title.trim(),
				subtitle: form.subtitle.trim() || null,
				description: form.description.trim() || null,
				objectives: form.objectives.trim() || null,
				content_md: form.content_md || null,
				expected_result: form.expected_result.trim() || null,
				is_final: form.is_final,
				tool_definition_ids: form.tool_definition_ids,
				exercise_form_template_id: form.exercise_form_template_id || null,
				task_prompts: form.task_prompts.map(({ cid: _c, ...p }) => ({
					...p,
					title: p.title.trim(),
					description: p.description?.trim() || undefined,
				})),
				// O modal não edita o indicador: reenviar evita que a versão nova
				// nasça sem ele.
				...(template ? { indicator_hint: template.indicator_hint } : {}),
			});
			toast.success('Rascunho salvo. Publique quando estiver pronto.');
			onClose();
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao salvar o encontro'));
		}
	};

	return (
		<Modal
			title={
				template
					? `Editar Encontro ${template.position} (gera v${template.version + 1})`
					: 'Novo encontro'
			}
			onClose={onClose}
			wide
		>
			<div className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					{/* Travada na edição: trocar gerava a versão em OUTRO encontro e o
					    publish levava este conteúdo para aquela posição. */}
					<Field label="Posição (1–10)" required>
						<input
							type="number"
							min={1}
							max={10}
							className={inputClass}
							readOnly={!!template}
							disabled={!!template}
							value={form.position}
							onChange={(e) => set('position', Number(e.target.value))}
						/>
					</Field>
					<Field label="Encontro final?">
						<div className="h-9 flex items-center">
							<Checkbox
								checked={form.is_final}
								onChange={(checked) => set('is_final', checked)}
							>
								Encerra a jornada
							</Checkbox>
						</div>
					</Field>
				</div>
				<Field label="Título" required>
					<Input value={form.title} onChangeText={(v) => set('title', v)} />
				</Field>
				<Field label="Subtítulo">
					<Input
						value={form.subtitle}
						onChangeText={(v) => set('subtitle', v)}
					/>
				</Field>
				<Field label="Descrição">
					<textarea
						className={`${inputClass} min-h-20`}
						value={form.description}
						onChange={(e) => set('description', e.target.value)}
					/>
				</Field>
				<Field label="Objetivos">
					<textarea
						className={`${inputClass} min-h-20`}
						value={form.objectives}
						onChange={(e) => set('objectives', e.target.value)}
					/>
				</Field>
				<div>
					<div className="flex items-center justify-between mb-1.5">
						<span className="block text-label text-secondary">
							Conteúdo (Markdown)
						</span>
						<div className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 p-0.5 text-xs">
							{(['Editar', 'Prévia'] as const).map((label) => {
								const on = (label === 'Prévia') === preview;
								return (
									<button
										key={label}
										type="button"
										aria-pressed={on}
										onClick={() => setPreview(label === 'Prévia')}
										className={`px-2.5 py-1 rounded-md ${on ? 'bg-violet-600 text-white' : 'text-slate-600 dark:text-gray-400'}`}
									>
										{label}
									</button>
								);
							})}
						</div>
					</div>
					{preview ? (
						<div
							data-testid="content-preview"
							className="min-h-40 rounded-xl border border-slate-200 dark:border-white/10 p-4"
						>
							{form.content_md.trim() ? (
								<Markdown source={form.content_md} />
							) : (
								<p className="text-sm text-slate-400">Sem conteúdo.</p>
							)}
						</div>
					) : (
						<textarea
							className={`${inputClass} min-h-40 font-mono text-xs`}
							aria-label="Conteúdo (Markdown)"
							value={form.content_md}
							onChange={(e) => set('content_md', e.target.value)}
						/>
					)}
				</div>
				<Field label="Resultado esperado">
					<textarea
						className={`${inputClass} min-h-20`}
						value={form.expected_result}
						onChange={(e) => set('expected_result', e.target.value)}
					/>
				</Field>

				<Field label="Exercício">
					<select
						className={inputClass}
						aria-label="Exercício"
						value={form.exercise_form_template_id}
						onChange={(e) => set('exercise_form_template_id', e.target.value)}
					>
						<option value="">Sem exercício</option>
						{currentExercise &&
							!exerciseOptions.some((f) => f.id === currentExercise.id) && (
								<option value={currentExercise.id}>
									{currentExercise.title} (v{currentExercise.version})
								</option>
							)}
						{exerciseOptions.map((f) => (
							<option key={f.id} value={f.id}>
								{f.title} (v{f.version})
							</option>
						))}
					</select>
				</Field>

				<Field label="Ferramentas do encontro">
					{tools.isLoading ? (
						<p className="text-sm text-slate-400">Carregando…</p>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
							{toolOptions.map((t) => (
								<label
									key={t.id}
									className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
								>
									<input
										type="checkbox"
										className="w-4 h-4 accent-violet-600"
										checked={form.tool_definition_ids.includes(t.id)}
										onChange={(e) => toggleTool(t.id, e.target.checked)}
									/>
									{t.name}
								</label>
							))}
						</div>
					)}
				</Field>

				<Field label="Tarefas sugeridas">
					<div className="space-y-2">
						{form.task_prompts.map((p, i) => (
							<div key={p.cid} className="flex items-start gap-2">
								<div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
									<input
										className={inputClass}
										aria-label={`Título da tarefa ${i + 1}`}
										placeholder="Título"
										value={p.title}
										onChange={(e) =>
											setPrompt(p.cid, { title: e.target.value })
										}
									/>
									<input
										className={inputClass}
										aria-label={`Descrição da tarefa ${i + 1}`}
										placeholder="Descrição (opcional)"
										value={p.description ?? ''}
										onChange={(e) =>
											setPrompt(p.cid, { description: e.target.value })
										}
									/>
								</div>
								<button
									type="button"
									className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
									aria-label={`Remover tarefa ${i + 1}`}
									onClick={() =>
										set(
											'task_prompts',
											form.task_prompts.filter((x) => x.cid !== p.cid),
										)
									}
								>
									<X className="w-4 h-4" />
								</button>
							</div>
						))}
						<button
							type="button"
							className={secondaryBtn}
							onClick={() =>
								set('task_prompts', [
									...form.task_prompts,
									{ title: '', cid: newPromptCid() },
								])
							}
						>
							<Plus className="w-3.5 h-3.5" />
							Adicionar tarefa
						</button>
					</div>
				</Field>

				<div className="flex justify-end gap-2 pt-2">
					<Button variant="secondary" onPress={onClose}>
						Cancelar
					</Button>
					<Button onPress={save} loading={create.isPending}>
						<CheckCircle2 className="w-4 h-4" />
						<Text className={buttonLabel({ variant: 'primary' })}>
							{template ? 'Salvar nova versão' : 'Criar encontro'}
						</Text>
					</Button>
				</div>
			</div>
		</Modal>
	);
}
