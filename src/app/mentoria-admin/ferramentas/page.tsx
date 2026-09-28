'use client';

import {
	CheckCircle2,
	CornerDownRight,
	Loader2,
	Lock,
	Pencil,
	Plus,
	Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/dashboard/header';
import { HelpTip } from '@/modules/mentoria/components/help-tip';
import type { MntToolDefinition, ToolArea } from '@/modules/mentoria/types';
import {
	mentoriaErrorMessage,
	toolInUseCount,
	useDeleteToolDefinition,
	useFormTemplatesAdmin,
	useMentoriaAccessAdmin,
	usePatchToolDefinition,
	useSetToolsLock,
	useToolDefinitionsAdmin,
	useUpsertToolDefinition,
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

const AREAS: Array<{ value: ToolArea; label: string }> = [
	{ value: 'estrategia', label: 'Estratégia' },
	{ value: 'processos', label: 'Processos' },
	{ value: 'pessoas', label: 'Pessoas' },
	{ value: 'indicadores', label: 'Indicadores' },
	{ value: 'financeiro', label: 'Financeiro' },
	{ value: 'comercial', label: 'Comercial' },
	{ value: 'melhoria', label: 'Melhoria contínua' },
	{ value: 'pessoal', label: 'Desenvolvimento pessoal' },
];

const areaLabel = (a: string) => AREAS.find((x) => x.value === a)?.label ?? a;

/** As 12 ferramentas da metodologia: a API recusa excluir (mesma lista). */
const BASE_TOOL_KEYS = new Set([
	'planejamento_estrategico',
	'fluxograma_processos',
	'organograma',
	'kpis',
	'pops',
	'gestao_financeira',
	'gestao_comercial',
	'melhoria_continua',
	'meta_acao',
	'maslow',
	'boas_noticias',
	'plano_negocios',
]);

/** Onde o aluno usa a ferramenta, quando não é a tela de Ferramentas. */
const SHOWN_IN: Partial<Record<string, string>> = {
	kpi_board: 'Indicadores',
	goal_action: 'Desenvolvimento',
	maslow: 'Desenvolvimento',
	good_news: 'Desenvolvimento',
	business_plan: 'Desenvolvimento',
};

/** nome → key snake_case (sem acentos). */
function toSnakeCase(label: string): string {
	return label
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 60);
}

type Editing =
	| { mode: 'edit'; tool: MntToolDefinition }
	| { mode: 'delete'; tool: MntToolDefinition }
	| { mode: 'create' }
	| null;

export default function FerramentasPage() {
	const tools = useToolDefinitionsAdmin();
	const [editing, setEditing] = useState<Editing>(null);

	const sorted = useMemo(
		() =>
			[...(tools.data ?? [])].sort(
				(a, b) => a.area.localeCompare(b.area) || a.position - b.position,
			),
		[tools.data],
	);

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<main className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
				<PageTitle
					title="Ferramentas"
					help="Catálogo de ferramentas da metodologia, organizadas por área da empresa."
					backHref="/mentoria-admin"
					actions={
						<button
							type="button"
							className={primaryBtn}
							onClick={() => setEditing({ mode: 'create' })}
							title="Ferramenta do tipo formulário"
						>
							<Plus className="w-4 h-4" />
							Nova ferramenta
						</button>
					}
				/>

				<ToolsLockCard />

				<Card>
					{tools.isLoading ? (
						<Spinner />
					) : tools.isError ? (
						<EmptyState message="Não foi possível carregar as ferramentas." />
					) : !sorted.length ? (
						<EmptyState message="Nenhuma ferramenta cadastrada." />
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-white/10">
										<th className="px-5 py-3 font-medium">Nome</th>
										<th className="px-5 py-3 font-medium">Área</th>
										<th className="px-5 py-3 font-medium">Posição</th>
										<th className="px-5 py-3" />
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 dark:divide-white/5">
									{sorted.map((t) => (
										<tr
											key={t.id}
											className="hover:bg-slate-50 dark:hover:bg-white/[0.04]"
										>
											{/* Key e kind são técnicos: saíram da tabela e ficam no
											    title (e no modal de edição). Status só quando inativa. */}
											<td
												className="px-5 py-3 font-medium text-slate-900 dark:text-white"
												title={`${t.key} · ${t.kind}`}
											>
												<span className="inline-flex items-center gap-2">
													{t.name}
													{!t.active && <Badge tone="slate">Inativa</Badge>}
												</span>
												{SHOWN_IN[t.kind] && (
													<span
														className="flex items-center gap-1 text-xs font-normal text-slate-500 dark:text-gray-400"
														title={`Aparece em ${SHOWN_IN[t.kind]}`}
													>
														<CornerDownRight
															className="w-3 h-3 shrink-0"
															aria-label="Aparece em"
														/>
														{SHOWN_IN[t.kind]}
													</span>
												)}
											</td>
											<td className="px-5 py-3">{areaLabel(t.area)}</td>
											<td className="px-5 py-3 tabular-nums">{t.position}</td>
											<td className="px-5 py-3">
												<div className="flex justify-end gap-2">
													<button
														type="button"
														className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
														onClick={() =>
															setEditing({ mode: 'edit', tool: t })
														}
														aria-label={`Editar ${t.name}`}
														title="Editar"
													>
														<Pencil className="w-4 h-4" />
													</button>
													{BASE_TOOL_KEYS.has(t.key) ? (
														<span
															role="img"
															className="inline-flex items-center p-2 text-slate-400 dark:text-gray-500"
															aria-label="Base"
															title="Ferramenta-base da metodologia: não pode ser excluída"
														>
															<Lock className="w-4 h-4" />
														</span>
													) : (
														<button
															type="button"
															className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
															onClick={() =>
																setEditing({ mode: 'delete', tool: t })
															}
															aria-label={`Excluir ${t.name}`}
														>
															<Trash2 className="w-4 h-4" />
														</button>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</Card>
			</main>

			{editing?.mode === 'edit' && (
				<EditToolModal tool={editing.tool} onClose={() => setEditing(null)} />
			)}
			{editing?.mode === 'delete' && (
				<DeleteToolModal tool={editing.tool} onClose={() => setEditing(null)} />
			)}
			{editing?.mode === 'create' && (
				<CreateFormToolModal onClose={() => setEditing(null)} />
			)}
		</div>
	);
}

function EditToolModal({
	tool,
	onClose,
}: {
	tool: MntToolDefinition;
	onClose: () => void;
}) {
	// PATCH por id: o upsert antigo exigia `kind` e todo "Salvar" dava 400.
	const patch = usePatchToolDefinition();
	const [form, setForm] = useState({
		name: tool.name,
		description: tool.description ?? '',
		area: tool.area,
		position: tool.position,
		active: tool.active,
	});
	const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
		setForm((f) => ({ ...f, [key]: value }));

	const save = async () => {
		if (!form.name.trim()) {
			toast.error('Informe o nome da ferramenta');
			return;
		}
		try {
			await patch.mutateAsync({
				id: tool.id,
				body: {
					name: form.name.trim(),
					description: form.description.trim() || null,
					area: form.area,
					position: form.position,
					active: form.active,
				},
			});
			toast.success('Ferramenta atualizada');
			onClose();
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao salvar a ferramenta'));
		}
	};

	return (
		<Modal title={`Editar ferramenta: ${tool.key}`} onClose={onClose}>
			<div className="space-y-4">
				<Field label="Nome" required>
					<input
						className={inputClass}
						value={form.name}
						onChange={(e) => set('name', e.target.value)}
					/>
				</Field>
				<Field label="Descrição">
					<textarea
						className={`${inputClass} min-h-20`}
						value={form.description}
						onChange={(e) => set('description', e.target.value)}
					/>
				</Field>
				<div className="grid grid-cols-2 gap-3">
					<Field label="Área">
						<select
							className={inputClass}
							value={form.area}
							onChange={(e) => set('area', e.target.value as ToolArea)}
						>
							{AREAS.map((a) => (
								<option key={a.value} value={a.value}>
									{a.label}
								</option>
							))}
						</select>
					</Field>
					<Field label="Posição">
						<input
							type="number"
							min={0}
							className={inputClass}
							value={form.position}
							onChange={(e) => set('position', Number(e.target.value))}
						/>
					</Field>
				</div>
				<label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
					<input
						type="checkbox"
						className="w-4 h-4 accent-violet-600"
						checked={form.active}
						onChange={(e) => set('active', e.target.checked)}
					/>
					Ferramenta ativa (visível aos alunos)
				</label>
				<div className="flex justify-end gap-2 pt-2">
					<button type="button" className={secondaryBtn} onClick={onClose}>
						Cancelar
					</button>
					<button
						type="button"
						className={primaryBtn}
						onClick={save}
						disabled={patch.isPending}
					>
						{patch.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<CheckCircle2 className="w-4 h-4" />
						)}
						Salvar
					</button>
				</div>
			</div>
		</Modal>
	);
}

/** Chave global: fecha a seção Ferramentas para todos os alunos. */
function ToolsLockCard() {
	const access = useMentoriaAccessAdmin();
	const setLock = useSetToolsLock();
	const locked = access.data?.tools_locked === true;
	const toggle = async () => {
		try {
			await setLock.mutateAsync(!locked);
			toast.success(
				locked
					? 'Ferramentas liberadas para os alunos'
					: 'Ferramentas bloqueadas para os alunos',
			);
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao salvar'));
		}
	};
	return (
		<Card className="p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
			<div>
				<p className="inline-flex items-center gap-1 font-medium text-slate-900 dark:text-white">
					{locked
						? 'Ferramentas bloqueadas para os alunos'
						: 'Ferramentas liberadas para os alunos'}
					<HelpTip label="Sobre o bloqueio">
						{locked
							? 'O resto da Mentoria segue liberado. O aluno vê um atalho para o Plano de Negócios.'
							: 'Bloqueie enquanto revisa as ferramentas.'}
					</HelpTip>
				</p>
			</div>
			<button
				type="button"
				className={locked ? primaryBtn : secondaryBtn}
				onClick={toggle}
				disabled={access.isLoading || setLock.isPending}
			>
				{setLock.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
				{locked ? 'Liberar ferramentas' : 'Bloquear ferramentas'}
			</button>
		</Card>
	);
}

function DeleteToolModal({
	tool,
	onClose,
}: {
	tool: MntToolDefinition;
	onClose: () => void;
}) {
	const del = useDeleteToolDefinition();
	// Preenchido quando a API avisa que alunos já usam a ferramenta.
	const [inUse, setInUse] = useState<number | null>(null);

	const run = async () => {
		try {
			await del.mutateAsync({ id: tool.id, force: inUse !== null });
			toast.success(`Ferramenta "${tool.name}" excluída`);
			onClose();
		} catch (err) {
			const count = toolInUseCount(err);
			if (count !== null) {
				setInUse(count);
				return;
			}
			toast.error(mentoriaErrorMessage(err, 'Erro ao excluir a ferramenta'));
		}
	};

	return (
		<Modal title={`Excluir "${tool.name}"?`} onClose={onClose}>
			<div className="space-y-4">
				{inUse === null ? (
					<p className="text-sm text-slate-600 dark:text-gray-300">
						Ela sai do catálogo e dos encontros. Não dá para desfazer.
					</p>
				) : (
					<p className="text-sm text-red-600 dark:text-red-400">
						{inUse} aluno(s) já começaram esta ferramenta. Excluir apaga o que
						eles preencheram nela. Prefere só desativar?
					</p>
				)}
				<div className="flex justify-end gap-2">
					<button type="button" className={secondaryBtn} onClick={onClose}>
						Cancelar
					</button>
					<button
						type="button"
						className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2"
						onClick={run}
						disabled={del.isPending}
					>
						{del.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Trash2 className="w-4 h-4" />
						)}
						{inUse === null ? 'Excluir' : 'Excluir mesmo assim'}
					</button>
				</div>
			</div>
		</Modal>
	);
}

function CreateFormToolModal({ onClose }: { onClose: () => void }) {
	const upsert = useUpsertToolDefinition();
	const templates = useFormTemplatesAdmin();
	const tools = useToolDefinitionsAdmin();

	// Só a última versão PUBLICADA de cada key: o aluno busca o template
	// publicado, e um rascunho deixaria a ferramenta abrindo "indisponível".
	const templateKeys = useMemo(() => {
		return [
			...new Map(
				[...(templates.data ?? [])]
					.filter((t) => t.published)
					// Crescente: no Map a última versão escrita (a mais nova) vence.
					.sort((a, b) => a.version - b.version)
					.map((t) => [t.key, t.title] as const),
			).entries(),
		].sort(([a], [b]) => a.localeCompare(b));
	}, [templates.data]);

	const [form, setForm] = useState({
		name: '',
		key: '',
		description: '',
		area: 'estrategia' as ToolArea,
		position: 0,
		form_template_key: '',
	});
	const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
		setForm((f) => ({ ...f, [key]: value }));

	const save = async () => {
		if (!form.name.trim() || !form.key) {
			toast.error('Informe o nome da ferramenta');
			return;
		}
		if (!form.form_template_key) {
			toast.error('Escolha o template de formulário da ferramenta');
			return;
		}
		// Nome que vira key existente ('KPIs' → kpis) sobrescrevia a ferramenta
		// nativa no upsert da API; barra antes de enviar.
		if (tools.data?.some((t) => t.key === form.key)) {
			toast.error(
				'Já existe uma ferramenta com esse nome (key). Use outro nome.',
			);
			return;
		}
		try {
			await upsert.mutateAsync({
				key: form.key,
				name: form.name.trim(),
				description: form.description.trim() || null,
				area: form.area,
				kind: 'form',
				form_template_key: form.form_template_key,
				position: form.position,
				active: true,
			});
			toast.success('Ferramenta criada');
			onClose();
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao criar a ferramenta'));
		}
	};

	return (
		<Modal title="Nova ferramenta (formulário)" onClose={onClose}>
			<div className="space-y-4">
				<Field
					label="Nome"
					required
					hint={form.key ? `key: ${form.key}` : 'A key é gerada do nome.'}
				>
					<input
						className={inputClass}
						value={form.name}
						onChange={(e) =>
							setForm((f) => ({
								...f,
								name: e.target.value,
								key: toSnakeCase(e.target.value),
							}))
						}
						placeholder="Canvas de proposta de valor"
					/>
				</Field>
				<Field label="Descrição">
					<textarea
						className={`${inputClass} min-h-16`}
						value={form.description}
						onChange={(e) => set('description', e.target.value)}
					/>
				</Field>
				<Field
					label="Template de formulário"
					required
					hint="A ferramenta renderiza este formulário para o aluno preencher."
				>
					<select
						className={inputClass}
						value={form.form_template_key}
						onChange={(e) => set('form_template_key', e.target.value)}
					>
						<option value="">
							{templates.isLoading ? 'Carregando...' : 'Selecione...'}
						</option>
						{templateKeys.map(([key, title]) => (
							<option key={key} value={key}>
								{title} ({key})
							</option>
						))}
					</select>
				</Field>
				<div className="grid grid-cols-2 gap-3">
					<Field label="Área">
						<select
							className={inputClass}
							value={form.area}
							onChange={(e) => set('area', e.target.value as ToolArea)}
						>
							{AREAS.map((a) => (
								<option key={a.value} value={a.value}>
									{a.label}
								</option>
							))}
						</select>
					</Field>
					<Field label="Posição">
						<input
							type="number"
							min={0}
							className={inputClass}
							value={form.position}
							onChange={(e) => set('position', Number(e.target.value))}
						/>
					</Field>
				</div>
				<div className="flex justify-end gap-2 pt-2">
					<button type="button" className={secondaryBtn} onClick={onClose}>
						Cancelar
					</button>
					<button
						type="button"
						className={primaryBtn}
						onClick={save}
						disabled={upsert.isPending}
					>
						{upsert.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Plus className="w-4 h-4" />
						)}
						Criar ferramenta
					</button>
				</div>
			</div>
		</Modal>
	);
}
