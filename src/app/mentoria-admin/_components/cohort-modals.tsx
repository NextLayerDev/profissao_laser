'use client';

// Modais da gestão de turmas: criar/editar turma, mentores e matrícula.
import { Loader2, Search, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { MntCohort } from '@/modules/mentoria/types';
import {
	mentoriaErrorMessage,
	useCohortMutations,
	useStudentSearch,
} from './admin-hooks';
import { Field, inputClass, Modal, primaryBtn, secondaryBtn } from './ui';

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
					<input
						className={inputClass}
						value={name}
						onChange={(e) => setName(e.target.value)}
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
					<button type="button" className={secondaryBtn} onClick={onClose}>
						Cancelar
					</button>
					<button
						type="button"
						className={primaryBtn}
						onClick={save}
						disabled={pending}
					>
						{pending && <Loader2 className="w-4 h-4 animate-spin" />}
						{cohort ? 'Salvar' : 'Criar turma'}
					</button>
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
						<input
							className={inputClass}
							value={mentorId}
							onChange={(e) => setMentorId(e.target.value)}
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
					<button
						type="button"
						className={primaryBtn}
						onClick={add}
						disabled={addMentor.isPending}
					>
						{addMentor.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<UserPlus className="w-4 h-4" />
						)}
						Adicionar mentor
					</button>
				</div>

				<div className="border-t border-slate-200 dark:border-white/10 pt-4 space-y-3">
					<Field
						label="Remover mentor (user_id)"
						hint="A API não expõe a listagem de mentores da turma; a remoção é feita pelo mesmo ID usado na adição."
					>
						<input
							className={inputClass}
							value={removeId}
							onChange={(e) => setRemoveId(e.target.value)}
							placeholder="user_id do mentor"
						/>
					</Field>
					<button
						type="button"
						className={secondaryBtn}
						onClick={remove}
						disabled={removeMentor.isPending}
					>
						{removeMentor.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Trash2 className="w-4 h-4" />
						)}
						Remover da turma
					</button>
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
					<div className="relative">
						<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
						<input
							className={`${inputClass} pl-9`}
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="nome ou email"
						/>
					</div>
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
					<input
						className={inputClass}
						value={userId}
						onChange={(e) => setUserId(e.target.value)}
						placeholder="00000000-0000-0000-0000-000000000000"
					/>
				</Field>

				<Field
					label="Nome da empresa"
					hint="Cria/atualiza a empresa do aluno no programa (opcional se ele já tiver empresa cadastrada)."
				>
					<input
						className={inputClass}
						value={companyName}
						onChange={(e) => setCompanyName(e.target.value)}
						placeholder="Ex.: Laser Art Studio"
					/>
				</Field>

				<div className="flex justify-end gap-2 pt-2">
					<button type="button" className={secondaryBtn} onClick={onClose}>
						Cancelar
					</button>
					<button
						type="button"
						className={primaryBtn}
						onClick={submit}
						disabled={enroll.isPending}
					>
						{enroll.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
						Matricular
					</button>
				</div>
			</div>
		</Modal>
	);
}
