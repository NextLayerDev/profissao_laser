'use client';

// Usado em: `app/mentoria-admin/lives/page.tsx`.
//
// Saiu do `page.tsx` quando ganhou o seletor de tipo de transmissão: o modal
// passou a ter regra própria (um campo que só existe num dos caminhos, e uma
// validação que depende do tipo escolhido), e a página já carrega a listagem,
// as credenciais e o encerramento.
//
// Os dois caminhos:
//
// - `external` — o link é de Zoom/Meet/YouTube e a plataforma não hospeda nada.
//   É o padrão enquanto a transmissão própria não está contratada: sem as
//   credenciais do Mux, a API responde 503 ao criar a sala pelo outro caminho.
// - `mux` — a API abre o live stream e devolve RTMP + stream key para o mentor
//   transmitir pelo OBS.

import { Loader2, Radio } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { LiveSource } from '@/modules/mentoria/types';
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

const SOURCE_LABEL: Record<LiveSource, string> = {
	external: 'Link externo (Zoom, Meet, YouTube)',
	mux: 'Transmissão própria (OBS / RTMP)',
};

const SOURCE_HINT: Record<LiveSource, string> = {
	external:
		'O aluno abre o link em outra aba. Você coloca a live no ar pelo botão "Iniciar live".',
	mux: 'A plataforma gera as credenciais de transmissão. Depende das credenciais do Mux estarem configuradas no servidor.',
};

export function CreateLiveModal({ onClose }: { onClose: () => void }) {
	const { create } = useLiveMutations();
	const cohorts = useCohortsAdmin();
	const [form, setForm] = useState({
		title: '',
		description: '',
		scheduled_at: '',
		cohort_id: '',
		// Link externo é o padrão: é o caminho que funciona hoje.
		source: 'external' as LiveSource,
		external_url: '',
	});
	const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
		setForm((f) => ({ ...f, [key]: value }));

	const isExternal = form.source === 'external';

	const save = async () => {
		if (!form.title.trim()) {
			toast.error('Informe o título da live');
			return;
		}
		if (isExternal && !form.external_url.trim()) {
			toast.error('Informe o link da live');
			return;
		}
		try {
			await create.mutateAsync({
				title: form.title.trim(),
				description: form.description.trim() || null,
				scheduled_at: form.scheduled_at
					? new Date(form.scheduled_at).toISOString()
					: null,
				source: form.source,
				...(isExternal ? { external_url: form.external_url.trim() } : {}),
				...(form.cohort_id ? { cohort_id: form.cohort_id } : {}),
			});
			toast.success('Live criada');
			onClose();
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao criar a live'));
		}
	};

	return (
		<Modal title="Nova live" onClose={onClose}>
			<div className="space-y-4">
				<Field label="Título" required>
					<input
						className={inputClass}
						value={form.title}
						onChange={(e) => set('title', e.target.value)}
						placeholder="Encontro ao vivo — Tira-dúvidas"
					/>
				</Field>

				<Field label="Tipo de transmissão" hint={SOURCE_HINT[form.source]}>
					<select
						className={inputClass}
						value={form.source}
						onChange={(e) => set('source', e.target.value as LiveSource)}
					>
						<option value="external">{SOURCE_LABEL.external}</option>
						<option value="mux">{SOURCE_LABEL.mux}</option>
					</select>
				</Field>

				{isExternal && (
					<Field
						label="Link da live"
						required
						hint="O aluno só vê o link depois que você iniciar a live."
					>
						<input
							type="url"
							className={inputClass}
							value={form.external_url}
							onChange={(e) => set('external_url', e.target.value)}
							placeholder="https://meet.google.com/abc-defg-hij"
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
						{(cohorts.data ?? []).map((c) => (
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
						disabled={create.isPending}
					>
						{create.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Radio className="w-4 h-4" />
						)}
						Criar live
					</button>
				</div>
			</div>
		</Modal>
	);
}
