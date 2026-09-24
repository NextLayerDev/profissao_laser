'use client';

import { CheckCircle2, Loader2, Pencil, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/dashboard/header';
import type { MntToolDefinition, ToolArea } from '@/modules/mentoria/types';
import {
	mentoriaErrorMessage,
	useFormTemplatesAdmin,
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
					description="Catálogo de ferramentas da metodologia, organizadas por área da empresa."
					backHref="/mentoria-admin"
					actions={
						<button
							type="button"
							className={primaryBtn}
							onClick={() => setEditing({ mode: 'create' })}
						>
							<Plus className="w-4 h-4" />
							Nova ferramenta (formulário)
						</button>
					}
				/>

				<Card>
					{tools.isLoading ? (
						<Spinner />
					) : !sorted.length ? (
						<EmptyState message="Nenhuma ferramenta cadastrada." />
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-white/10">
										<th className="px-5 py-3 font-medium">Key</th>
										<th className="px-5 py-3 font-medium">Nome</th>
										<th className="px-5 py-3 font-medium">Área</th>
										<th className="px-5 py-3 font-medium">Kind</th>
										<th className="px-5 py-3 font-medium">Posição</th>
										<th className="px-5 py-3 font-medium">Status</th>
										<th className="px-5 py-3" />
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 dark:divide-white/5">
									{sorted.map((t) => (
										<tr
											key={t.id}
											className="hover:bg-slate-50 dark:hover:bg-white/[0.04]"
										>
											<td className="px-5 py-3 font-mono text-xs text-slate-500 dark:text-gray-400">
												{t.key}
											</td>
											<td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
												{t.name}
											</td>
											<td className="px-5 py-3">{areaLabel(t.area)}</td>
											<td className="px-5 py-3">
												<Badge tone={t.kind === 'form' ? 'blue' : 'violet'}>
													{t.kind}
												</Badge>
											</td>
											<td className="px-5 py-3 tabular-nums">{t.position}</td>
											<td className="px-5 py-3">
												<Badge tone={t.active ? 'green' : 'slate'}>
													{t.active ? 'Ativa' : 'Inativa'}
												</Badge>
											</td>
											<td className="px-5 py-3 text-right">
												<button
													type="button"
													className={secondaryBtn}
													onClick={() => setEditing({ mode: 'edit', tool: t })}
												>
													<Pencil className="w-3.5 h-3.5" />
													Editar
												</button>
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
	const upsert = useUpsertToolDefinition();
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
			await upsert.mutateAsync({
				key: tool.key,
				name: form.name.trim(),
				description: form.description.trim() || null,
				area: form.area,
				position: form.position,
				active: form.active,
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
						disabled={upsert.isPending}
					>
						{upsert.isPending ? (
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

function CreateFormToolModal({ onClose }: { onClose: () => void }) {
	const upsert = useUpsertToolDefinition();
	const templates = useFormTemplatesAdmin();

	// Só a última versão de cada key.
	const templateKeys = useMemo(() => {
		return [
			...new Map(
				[...(templates.data ?? [])]
					.sort((a, b) => b.version - a.version)
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
