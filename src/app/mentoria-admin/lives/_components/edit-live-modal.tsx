'use client';

// Usado em: `app/mentoria-admin/lives/page.tsx`.
//
// O encerramento prometia "dá para adicionar a gravação depois", mas não havia
// tela para isso — nem para corrigir título, data ou link de uma sala criada.
// Usa o PATCH /admin/mentoria/live/:id. Numa sala externa encerrada, colar a
// gravação já a deixa "Gravação disponível"; apagar o link a despublica.
// `source` não muda aqui (a API não aceita).

import { CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { normalizeUrl } from '@/app/course/(shell)/mentoria/_components/shared';
import type { MntLiveRoom } from '@/modules/mentoria/types';
import {
	mentoriaErrorMessage,
	useCohortsAdmin,
	useLiveMutations,
} from '../../_components/admin-hooks';
import {
	Field,
	inputClass,
	Modal,
	primaryBtn,
	secondaryBtn,
} from '../../_components/ui';

/** ISO → valor do `<input type="datetime-local">` no fuso do navegador. */
function toLocalInput(iso: string | null): string {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	return new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
		.toISOString()
		.slice(0, 16);
}

export function EditLiveModal({
	live,
	onClose,
}: {
	live: MntLiveRoom;
	onClose: () => void;
}) {
	const { update } = useLiveMutations();
	const cohorts = useCohortsAdmin();
	const isExternal = live.source === 'external';
	const isEnded = !!live.ended_at;
	const [form, setForm] = useState({
		title: live.title,
		description: live.description ?? '',
		scheduled_at: toLocalInput(live.scheduled_at),
		cohort_id: live.cohort_id ?? '',
		external_url: live.external_url ?? '',
		recording_url: live.recording_url ?? '',
	});
	const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
		setForm((f) => ({ ...f, [key]: value }));

	const save = async () => {
		if (!form.title.trim()) {
			toast.error('Informe o título da live');
			return;
		}
		const body: Record<string, unknown> = {
			title: form.title.trim(),
			description: form.description.trim() || null,
			scheduled_at: form.scheduled_at
				? new Date(form.scheduled_at).toISOString()
				: null,
			cohort_id: form.cohort_id || null,
		};
		if (isExternal) {
			const url = normalizeUrl(form.external_url);
			if (!url) {
				toast.error('Informe um link válido para a live (https://...)');
				return;
			}
			body.external_url = url;
			if (isEnded) {
				const rec = form.recording_url.trim();
				const recUrl = rec ? normalizeUrl(rec) : null;
				if (rec && !recUrl) {
					toast.error('Link da gravação inválido (https://...)');
					return;
				}
				body.recording_url = recUrl;
			}
		}
		try {
			await update.mutateAsync({ id: live.id, body });
			toast.success('Live atualizada');
			onClose();
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao salvar a live'));
		}
	};

	const cohortList = cohorts.data ?? [];
	return (
		<Modal title="Editar live" onClose={onClose}>
			<div className="space-y-4">
				<Field label="Título" required>
					<input
						className={inputClass}
						value={form.title}
						onChange={(e) => set('title', e.target.value)}
					/>
				</Field>
				{isExternal && (
					<Field label="Link da live" required>
						<input
							type="url"
							className={inputClass}
							value={form.external_url}
							onChange={(e) => set('external_url', e.target.value)}
							placeholder="https://meet.google.com/abc-defg-hij"
						/>
					</Field>
				)}
				{isExternal && isEnded && (
					<Field
						label="Link da gravação"
						hint="Com o link, a live aparece como gravação para a turma. Apague para despublicar."
					>
						<input
							type="url"
							className={inputClass}
							value={form.recording_url}
							onChange={(e) => set('recording_url', e.target.value)}
							placeholder="https://youtu.be/..."
						/>
					</Field>
				)}
				<Field label="Descrição">
					<textarea
						className={`${inputClass} min-h-16`}
						value={form.description}
						onChange={(e) => set('description', e.target.value)}
					/>
				</Field>
				<Field label="Data e hora agendadas">
					<input
						type="datetime-local"
						className={inputClass}
						value={form.scheduled_at}
						onChange={(e) => set('scheduled_at', e.target.value)}
					/>
				</Field>
				<Field label="Turma" hint="Deixe em branco para todas as turmas.">
					<select
						className={inputClass}
						value={form.cohort_id}
						onChange={(e) => set('cohort_id', e.target.value)}
					>
						<option value="">Todas as turmas</option>
						{/* Turma fora da lista (ex.: mentor que não é dela) não some. */}
						{form.cohort_id &&
							!cohortList.some((c) => c.id === form.cohort_id) && (
								<option value={form.cohort_id}>Turma atual</option>
							)}
						{cohortList.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name}
							</option>
						))}
					</select>
				</Field>
				<div className="flex justify-end gap-2 pt-2">
					<button type="button" className={secondaryBtn} onClick={onClose}>
						Cancelar
					</button>
					<button
						type="button"
						className={primaryBtn}
						onClick={save}
						disabled={update.isPending}
					>
						{update.isPending ? (
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
