'use client';

// Usado em: `app/mentoria-admin/lives/page.tsx`.
//
// O encerramento deixou de ser só uma confirmação: no link externo não existe
// VOD automático, então é aqui que o admin cola a gravação — e é o único
// momento em que ele tem o link na mão. Com a gravação, a sala já vai direto
// para "Gravação disponível"; sem ela, fica "Encerrada" e a gravação pode
// entrar depois.
//
// Na transmissão própria o campo não aparece: o Mux processa o VOD sozinho e
// avisa por webhook.

import { Loader2, Square } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { MntLiveRoom } from '@/modules/mentoria/types';
import {
	mentoriaErrorMessage,
	useLiveMutations,
} from '../../_components/admin-hooks';
import { Field, inputClass, Modal, secondaryBtn } from '../../_components/ui';

export function EndLiveModal({
	live,
	onClose,
}: {
	live: MntLiveRoom;
	onClose: () => void;
}) {
	const { end } = useLiveMutations();
	const [recordingUrl, setRecordingUrl] = useState('');
	const isExternal = live.source === 'external';

	const doEnd = async () => {
		try {
			await end.mutateAsync({
				id: live.id,
				recordingUrl: isExternal ? recordingUrl.trim() || null : null,
			});
			toast.success('Live encerrada');
			onClose();
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao encerrar a live'));
		}
	};

	return (
		<Modal title="Encerrar live" onClose={onClose}>
			<div className="space-y-4">
				<p className="text-body text-secondary">
					Encerrar <b>{live.title}</b>?{' '}
					{isExternal
						? 'A sala sai do ar para os alunos e o link de acesso deixa de aparecer.'
						: 'A transmissão será finalizada para todos os alunos e a gravação (VOD) começará a ser processada.'}
				</p>

				{isExternal && (
					<Field
						label="Link da gravação"
						hint="Opcional. Com o link, a live já aparece como gravação para a turma; sem ele, dá para adicionar depois."
					>
						<input
							type="url"
							className={inputClass}
							value={recordingUrl}
							onChange={(e) => setRecordingUrl(e.target.value)}
							placeholder="https://youtu.be/..."
						/>
					</Field>
				)}

				<div className="flex justify-end gap-2 pt-2">
					<button type="button" className={secondaryBtn} onClick={onClose}>
						Cancelar
					</button>
					<button
						type="button"
						className="inline-flex items-center gap-2 h-control-md px-field-md rounded-control text-label bg-danger hover:bg-danger-strong text-white transition-colors disabled:opacity-50"
						onClick={doEnd}
						disabled={end.isPending}
					>
						{end.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Square className="w-4 h-4" />
						)}
						Encerrar
					</button>
				</div>
			</div>
		</Modal>
	);
}
