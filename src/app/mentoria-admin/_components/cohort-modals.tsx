'use client';

// Modais da gestão de turmas: criar/editar turma, mentores e matrícula.
//
// `<select>` e `<input type="date">` continuam nativos — o Select do DS é só
// o gatilho fechado (sem menu) e o Input é um TextInput genérico sem
// datepicker. Ambos herdam a classe de token via `inputClass`.
import { Button, buttonLabel, Input } from '@upvox-dev/ui';
import { Search, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Text } from 'react-native-css/components/Text';
import { toast } from 'sonner';
import type { MntCohort } from '@/modules/mentoria/types';
import {
	mentoriaErrorMessage,
	useCohortMutations,
	useStudentSearch,
} from './admin-hooks';
import { Field, inputClass, Modal } from './ui';

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
	const [role, setRole] = useState<'lead' | 'assistant'>('lead');
	const [removeId, setRemoveId] = useState('');

	const add = async () => {
		if (!mentorId.trim()) {
			toast.error('Informe o user_id (UUID) do mentor');
			return;
		}
		try {
			await addMentor.mutateAsync({
				cohortId: cohort.id,
				body: { mentor_user_id: mentorId.trim(), role },
			});
			toast.success('Mentor adicionado à turma');
			setMentorId('');
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao adicionar mentor'));
		}
	};

	const remove = async () => {
		if (!removeId.trim()) {
			toast.error('Informe o user_id do mentor a remover');
			return;
		}
		try {
			await removeMentor.mutateAsync({
				cohortId: cohort.id,
				mentorUserId: removeId.trim(),
			});
			toast.success('Mentor removido da turma');
			setRemoveId('');
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao remover mentor'));
		}
	};

	return (
		<Modal title={`Mentores — ${cohort.name}`} onClose={onClose}>
			<div className="space-y-6">
				<div className="space-y-3">
					<p className="text-sm text-slate-600 dark:text-gray-400">
						Adicione o mentor pelo ID de usuário (UUID). O ID aparece na página
						de Alunos/Acessos do admin.
					</p>
					<Field label="ID do usuário (UUID)" required>
						<Input
							value={mentorId}
							onChangeText={setMentorId}
							placeholder="00000000-0000-0000-0000-000000000000"
						/>
					</Field>
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
					<Field
						label="Remover mentor (user_id)"
						hint="A API não expõe a listagem de mentores da turma; a remoção é feita pelo mesmo ID usado na adição."
					>
						<Input
							value={removeId}
							onChangeText={setRemoveId}
							placeholder="user_id do mentor"
						/>
					</Field>
					<Button
						variant="secondary"
						onPress={remove}
						loading={removeMentor.isPending}
					>
						<Trash2 className="w-4 h-4" />
						<Text className={buttonLabel({ variant: 'secondary' })}>
							Remover da turma
						</Text>
					</Button>
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
			toast.error('Selecione um aluno ou informe o user_id');
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

				<Field
					label="ID do usuário (UUID)"
					required
					hint={
						selectedLabel
							? `Selecionado: ${selectedLabel}`
							: 'Preenchido pela busca acima, ou cole o UUID manualmente.'
					}
				>
					<Input
						value={userId}
						onChangeText={setUserId}
						placeholder="00000000-0000-0000-0000-000000000000"
					/>
				</Field>

				<Field
					label="Nome da empresa"
					hint="Cria/atualiza a empresa do aluno no programa (opcional se ele já tiver empresa cadastrada)."
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
