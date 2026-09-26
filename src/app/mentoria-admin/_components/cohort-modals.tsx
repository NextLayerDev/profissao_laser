'use client';

// Modais da gestão de turmas: criar/editar turma, mentores, matrícula e
// matrícula em lote (fila "Aguardando turma").
//
// `<select>` e `<input type="date">` continuam nativos — o Select do DS é só
// o gatilho fechado (sem menu) e o Input é um TextInput genérico sem
// datepicker. Ambos herdam a classe de token via `inputClass`.
import { Button, buttonLabel, Input } from '@upvox-dev/ui';
import { Search, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Text } from 'react-native-css/components/Text';
import { toast } from 'sonner';
import type {
	EnrollBatchResult,
	MentoriaWaitingStudent,
	MntCohort,
} from '@/modules/mentoria/types';
import { useTeamUsers } from '@/modules/users';
import {
	mentoriaCodeMessage,
	mentoriaErrorMessage,
	studentSearchErrorMessage,
	useCohortMentors,
	useCohortMutations,
	useStudentSearch,
} from './admin-hooks';
import { Field, inputClass, Modal } from './ui';
import { UserPicker } from './user-picker';

// ── Criar / editar turma ─────────────────────────────────────────────────────
export function CohortFormModal({
	cohort,
	onClose,
}: {
	cohort: MntCohort | null;
	onClose: () => void;
}) {
	const { create, update } = useCohortMutations();
	const [name, setName] = useState(cohort?.name ?? '');
	const [startsAt, setStartsAt] = useState(
		cohort?.starts_at ? cohort.starts_at.slice(0, 10) : '',
	);
	const [endsAt, setEndsAt] = useState(
		cohort?.ends_at ? cohort.ends_at.slice(0, 10) : '',
	);
	const [status, setStatus] = useState<MntCohort['status']>(
		cohort?.status ?? 'draft',
	);
	const pending = create.isPending || update.isPending;

	const save = async () => {
		if (!name.trim()) {
			toast.error('Informe o nome da turma');
			return;
		}
		try {
			if (cohort) {
				await update.mutateAsync({
					id: cohort.id,
					body: {
						name: name.trim(),
						starts_at: startsAt || null,
						ends_at: endsAt || null,
						status,
					},
				});
				toast.success('Turma atualizada');
			} else {
				await create.mutateAsync({
					name: name.trim(),
					...(startsAt ? { starts_at: startsAt } : {}),
					...(endsAt ? { ends_at: endsAt } : {}),
				});
				toast.success('Turma criada');
			}
			onClose();
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao salvar a turma'));
		}
	};

	return (
		<Modal title={cohort ? 'Editar turma' : 'Nova turma'} onClose={onClose}>
			<div className="space-y-4">
				<Field label="Nome" required>
					<Input
						value={name}
						onChangeText={setName}
						placeholder="Ex.: Turma 2026.1"
					/>
				</Field>
				<div className="grid grid-cols-2 gap-3">
					<Field label="Início">
						<input
							type="date"
							className={inputClass}
							value={startsAt}
							onChange={(e) => setStartsAt(e.target.value)}
						/>
					</Field>
					<Field label="Fim">
						<input
							type="date"
							className={inputClass}
							value={endsAt}
							onChange={(e) => setEndsAt(e.target.value)}
						/>
					</Field>
				</div>
				{cohort && (
					<Field label="Status">
						<select
							className={inputClass}
							value={status}
							onChange={(e) => setStatus(e.target.value as MntCohort['status'])}
						>
							<option value="draft">Rascunho</option>
							<option value="active">Ativa</option>
							<option value="completed">Concluída</option>
							<option value="archived">Arquivada</option>
						</select>
					</Field>
				)}
				<div className="flex justify-end gap-2 pt-2">
					<Button variant="secondary" onPress={onClose}>
						Cancelar
					</Button>
					<Button onPress={save} loading={pending}>
						{cohort ? 'Salvar' : 'Criar turma'}
					</Button>
				</div>
			</div>
		</Modal>
	);
}

// ── Mentores da turma ────────────────────────────────────────────────────────
export function CohortMentorsModal({
	cohort,
	onClose,
}: {
	cohort: MntCohort;
	onClose: () => void;
}) {
	const { addMentor, removeMentor } = useCohortMutations();
	const [mentorId, setMentorId] = useState('');
	const [mentorLabel, setMentorLabel] = useState('');
	const [role, setRole] = useState<'lead' | 'assistant'>('lead');
	// Mentores atuais vêm da API: antes o admin escolhia qualquer staff para
	// remover e via "removido" mesmo quando a pessoa não era mentora.
	const mentors = useCohortMentors(cohort.id);
	// Uma query só para as duas metades — mesmo cache, mesma lista. São os
	// staff/admin: é exatamente quem a api aceita como mentor, então não dá para
	// escolher alguém que ela vá recusar com `mentor_must_be_staff`.
	const team = useTeamUsers();
	const users = team.data ?? [];

	const add = async () => {
		if (!mentorId.trim()) {
			toast.error('Escolha o mentor na busca');
			return;
		}
		try {
			await addMentor.mutateAsync({
				cohortId: cohort.id,
				body: { mentor_user_id: mentorId.trim(), role },
			});
			toast.success('Mentor adicionado à turma');
			setMentorId('');
			setMentorLabel('');
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao adicionar mentor'));
		}
	};

	const remove = async (mentorUserId: string, label: string) => {
		if (!confirm(`Remover ${label} dos mentores da turma?`)) return;
		try {
			await removeMentor.mutateAsync({ cohortId: cohort.id, mentorUserId });
			toast.success('Mentor removido da turma');
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao remover mentor'));
		}
	};

	return (
		<Modal title={`Mentores — ${cohort.name}`} onClose={onClose}>
			<div className="space-y-6">
				<div className="space-y-3">
					<Field label="Buscar mentor" hint="Só staff e admin.">
						<UserPicker
							users={users}
							isLoading={team.isLoading}
							selectedId={mentorId}
							onSelect={(u) => {
								setMentorId(u.id);
								setMentorLabel(u.name?.trim() || u.email);
							}}
							emptyLabel="Nenhum mentor encontrado."
						/>
					</Field>
					{/* O campo de UUID manual saiu (texto técnico na tela do mentor):
					    a busca acima já seleciona o id. */}
					{mentorLabel && (
						<p className="text-sm text-slate-600 dark:text-gray-400">
							Selecionado: <b>{mentorLabel}</b>
						</p>
					)}
					<Field label="Papel">
						<select
							className={inputClass}
							value={role}
							onChange={(e) => setRole(e.target.value as 'lead' | 'assistant')}
						>
							<option value="lead">Mentor líder</option>
							<option value="assistant">Mentor assistente</option>
						</select>
					</Field>
					<Button onPress={add} loading={addMentor.isPending}>
						<UserPlus className="w-4 h-4" />
						<Text className={buttonLabel({ variant: 'primary' })}>
							Adicionar mentor
						</Text>
					</Button>
				</div>

				<div className="border-t border-subtle pt-4 space-y-3">
					<p className="text-sm font-medium text-primary">Mentores atuais</p>
					{mentors.isLoading ? (
						<p className="text-sm text-muted">Carregando...</p>
					) : mentors.isError ? (
						<p className="text-sm text-muted">
							Não foi possível carregar os mentores da turma.
						</p>
					) : (mentors.data ?? []).length === 0 ? (
						<p className="text-sm text-muted">Nenhum mentor nesta turma.</p>
					) : (
						<ul className="space-y-2">
							{(mentors.data ?? []).map((m) => {
								const label =
									m.user?.name?.trim() || m.user?.email || m.mentor_user_id;
								return (
									<li
										key={m.mentor_user_id}
										className="flex items-center justify-between gap-3 rounded-control border border-subtle p-3"
									>
										<div className="min-w-0">
											<p className="truncate text-sm text-primary">{label}</p>
											<p className="text-xs text-muted">
												{m.role === 'lead'
													? 'Mentor líder'
													: 'Mentor assistente'}
											</p>
										</div>
										<Button
											variant="secondary"
											onPress={() => remove(m.mentor_user_id, label)}
											disabled={removeMentor.isPending}
										>
											<Trash2 className="w-4 h-4" />
											<Text className={buttonLabel({ variant: 'secondary' })}>
												Remover
											</Text>
										</Button>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			</div>
		</Modal>
	);
}

// ── Matricular aluno ─────────────────────────────────────────────────────────
export function EnrollStudentModal({
	cohort,
	onClose,
}: {
	cohort: MntCohort;
	onClose: () => void;
}) {
	const { enroll } = useCohortMutations();
	const [query, setQuery] = useState('');
	const [userId, setUserId] = useState('');
	const [selectedLabel, setSelectedLabel] = useState('');
	const [companyName, setCompanyName] = useState('');
	const search = useStudentSearch(query);

	const submit = async () => {
		if (!userId.trim()) {
			toast.error('Selecione um aluno na busca');
			return;
		}
		try {
			await enroll.mutateAsync({
				cohortId: cohort.id,
				body: {
					user_id: userId.trim(),
					...(companyName.trim() ? { company_name: companyName.trim() } : {}),
				},
			});
			toast.success('Aluno matriculado na turma');
			onClose();
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao matricular aluno'));
		}
	};

	return (
		<Modal title={`Matricular aluno — ${cohort.name}`} onClose={onClose}>
			<div className="space-y-4">
				<Field
					label="Buscar aluno"
					hint="Busque por nome ou email (mín. 2 caracteres)."
				>
					{/* leadingIcon é a prop do Input pra isto — aposenta o `Search`
					    absoluto + o hack `pl-9` que existia só por causa dele. */}
					<Input
						leadingIcon={<Search className="w-4 h-4 text-muted" />}
						value={query}
						onChangeText={setQuery}
						placeholder="nome ou email"
					/>
				</Field>

				{query.trim().length >= 2 && (
					<div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden max-h-56 overflow-y-auto">
						{search.isLoading ? (
							<p className="px-4 py-3 text-sm text-slate-500 dark:text-gray-400">
								Buscando...
							</p>
						) : search.isError ? (
							<p className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
								{studentSearchErrorMessage(search.error)}
							</p>
						) : !search.data?.items.length ? (
							<p className="px-4 py-3 text-sm text-slate-500 dark:text-gray-400">
								Nenhum aluno encontrado.
							</p>
						) : (
							search.data.items.map((s) => (
								<button
									key={s.id}
									type="button"
									onClick={() => {
										setUserId(s.id);
										setSelectedLabel(s.name ?? s.email);
									}}
									className={`w-full text-left px-4 py-2.5 text-sm border-b last:border-b-0 border-slate-100 dark:border-white/5 transition-colors ${
										userId === s.id
											? 'bg-violet-500/10 text-violet-700 dark:text-violet-300'
											: 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200'
									}`}
								>
									<span className="font-medium">{s.name ?? '(sem nome)'}</span>
									<span className="text-slate-500 dark:text-gray-400 ml-2">
										{s.email}
									</span>
								</button>
							))
						)}
					</div>
				)}

				{/* Sem o campo de UUID manual: a busca acima seleciona o aluno. */}
				{selectedLabel && (
					<p className="text-sm text-slate-600 dark:text-gray-400">
						Selecionado: <b>{selectedLabel}</b>
					</p>
				)}

				<Field
					label="Nome da empresa"
					hint="Opcional. Sem o plano da Mentoria, o aluno não acessa."
				>
					<Input
						value={companyName}
						onChangeText={setCompanyName}
						placeholder="Ex.: Laser Art Studio"
					/>
				</Field>

				<div className="flex justify-end gap-2 pt-2">
					<Button variant="secondary" onPress={onClose}>
						Cancelar
					</Button>
					<Button onPress={submit} loading={enroll.isPending}>
						Matricular
					</Button>
				</div>
			</div>
		</Modal>
	);
}

// ── Matricular em lote (fila "Aguardando turma") ────────────────────────────
export function EnrollBatchModal({
	students,
	cohorts,
	onClose,
}: {
	students: MentoriaWaitingStudent[];
	cohorts: MntCohort[];
	onClose: () => void;
}) {
	const { enrollBatch } = useCohortMutations();
	// Só turma aberta aceita matrícula (a API responde cohort_not_open).
	const open = cohorts.filter(
		(c) => c.status === 'active' || c.status === 'draft',
	);
	const [picked, setCohortId] = useState('');
	// Sem escolha explícita vale a 1ª aberta — também quando as turmas chegam
	// depois de o modal abrir (o <select> já mostraria essa opção).
	const cohortId = picked || open[0]?.id || '';
	const [result, setResult] = useState<EnrollBatchResult | null>(null);
	const label = (id: string) => {
		const s = students.find((x) => x.user_id === id);
		return s?.name?.trim() || s?.email || id;
	};

	const submit = async () => {
		if (!cohortId) {
			toast.error('Escolha a turma');
			return;
		}
		try {
			const res = await enrollBatch.mutateAsync({
				cohortId,
				userIds: students.map((s) => s.user_id),
			});
			if (res.failed === 0) {
				toast.success(
					res.enrolled === 1
						? 'Aluno matriculado'
						: `${res.enrolled} alunos matriculados`,
				);
				onClose();
				return;
			}
			// Com falha, o modal fica aberto listando quem não entrou e por quê.
			setResult(res);
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao matricular'));
		}
	};

	const failures = result?.results.filter((r) => !r.ok) ?? [];

	return (
		<Modal title="Matricular na turma" onClose={onClose}>
			{result ? (
				<div className="space-y-4">
					<p className="text-sm text-primary">
						{result.enrolled} matriculado(s), {result.failed} com erro.
					</p>
					<ul className="space-y-2">
						{failures.map((f) => (
							<li
								key={f.user_id}
								className="rounded-control border border-subtle p-3 text-sm"
							>
								<p className="text-primary">{label(f.user_id)}</p>
								<p className="text-xs text-danger">
									{mentoriaCodeMessage(f.error, 'Não foi possível matricular.')}
								</p>
							</li>
						))}
					</ul>
					<div className="flex justify-end pt-2">
						<Button onPress={onClose}>Fechar</Button>
					</div>
				</div>
			) : (
				<div className="space-y-4">
					<p className="text-sm text-muted">
						{students.length === 1
							? label(students[0]?.user_id ?? '')
							: `${students.length} alunos selecionados`}
					</p>
					{open.length === 0 ? (
						<p className="text-sm text-muted">
							Nenhuma turma aberta. Crie uma ou mude o status para Ativa.
						</p>
					) : (
						<Field label="Turma" required>
							<select
								className={inputClass}
								value={cohortId}
								onChange={(e) => setCohortId(e.target.value)}
							>
								{open.map((c) => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
							</select>
						</Field>
					)}
					<div className="flex justify-end gap-2 pt-2">
						<Button variant="secondary" onPress={onClose}>
							Cancelar
						</Button>
						<Button
							onPress={submit}
							loading={enrollBatch.isPending}
							disabled={open.length === 0}
						>
							Matricular
						</Button>
					</div>
				</div>
			)}
		</Modal>
	);
}
