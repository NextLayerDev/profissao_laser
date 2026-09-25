'use client';

// Diagnóstico — Raio-X inicial da empresa, que ao ser enviado vira a Foto Zero.
//
// Este arquivo é só o CONTAINER: gates, busca e mutações. O desenho da tela
// mora em `_components/diagnostico-view.tsx`, separado para que a rota de
// conferência (`app/(dev)/mentoria-diagnostico-check`) consiga montar os
// estados com fixtures — o estado final é irreversível e não dá para alcançar
// duas vezes.

import { toast } from 'sonner';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import {
	useDiagnostic,
	useSaveDiagnosticDraft,
	useSubmitDiagnostic,
} from '@/modules/mentoria/hooks';
import {
	apiErrorCode,
	apiErrorDetails,
	JourneyGate,
	MntSkeleton,
} from '../_components/shared';
import { DiagnosticoView } from './_components/diagnostico-view';

export default function DiagnosticoPage() {
	return (
		<SubscriptionGate toolKey="mentoria_360">
			<JourneyGate>
				{({ journeyId }) => <DiagnosticoContent journeyId={journeyId} />}
			</JourneyGate>
		</SubscriptionGate>
	);
}

function DiagnosticoContent({ journeyId }: { journeyId: string }) {
	const { data, isLoading } = useDiagnostic(journeyId);
	const saveDraft = useSaveDiagnosticDraft(journeyId);
	const submit = useSubmitDiagnostic(journeyId);

	if (isLoading) return <MntSkeleton />;

	const doSubmit = () =>
		submit.mutate(undefined, {
			onSuccess: () =>
				toast.success('Diagnóstico enviado — Foto Zero congelada!'),
			onError: (e) => {
				if (apiErrorCode(e) === 'required_fields_missing') {
					const missing = apiErrorDetails(e)?.missing;
					const labels = new Map(
						(data?.template?.schema.blocks ?? []).flatMap((b) =>
							b.fields.map((f) => [f.key, f.label] as const),
						),
					);
					const names = Array.isArray(missing)
						? missing.map((k) => labels.get(String(k)) ?? String(k))
						: [];
					toast.error(
						names.length
							? `Falta responder: ${names.slice(0, 5).join(', ')}${names.length > 5 ? ` e mais ${names.length - 5}` : ''}. Use "A LEVANTAR" se não souber.`
							: 'Há campos obrigatórios sem resposta. Preencha (ou marque "A LEVANTAR") antes de enviar.',
					);
				} else {
					toast.error('Não foi possível enviar o diagnóstico.');
				}
			},
		});

	return (
		<DiagnosticoView
			data={data}
			savingDraft={saveDraft.isPending}
			submitting={submit.isPending}
			onSaveDraft={(answers) =>
				saveDraft.mutate(answers, {
					onSuccess: () => toast.success('Rascunho salvo!'),
					onError: () => toast.error('Não foi possível salvar o rascunho.'),
				})
			}
			onSubmit={(answers) => {
				// Salva o último estado do formulário ANTES de congelar: o que não
				// estiver no rascunho não entra na Foto Zero, e não há segunda chance.
				if (answers) {
					saveDraft.mutate(answers, {
						onSuccess: doSubmit,
						onError: () => toast.error('Não foi possível salvar as respostas.'),
					});
				} else {
					doSubmit();
				}
			}}
		/>
	);
}
