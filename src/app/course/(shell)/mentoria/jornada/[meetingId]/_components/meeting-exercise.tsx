'use client';

// Exercício do encontro (ou avaliação final, no encontro final): o encontro
// guarda o formulário por id, e antes não havia tela para responder — o texto
// dizia só "é feito junto com o mentor".

import { useQuery } from '@tanstack/react-query';
import { getFormTemplateById } from '@/modules/mentoria/service';
import type { MntJourneyMeeting } from '@/modules/mentoria/types';
import { MntSkeleton } from '../../../_components/shared';
import { FormSubmissionPanel } from '../../../_components/tools/tool-form';

export function MeetingExercise({
	journeyId,
	meeting,
}: {
	journeyId: string;
	meeting: MntJourneyMeeting;
}) {
	const templateId = meeting.template?.exercise_form_template_id ?? null;
	const {
		data: template,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['mentoria', 'form-template-id', templateId],
		queryFn: () => getFormTemplateById(templateId as string),
		enabled: !!templateId,
	});

	if (!templateId) return null;
	if (isLoading) return <MntSkeleton />;
	if (isError || !template) {
		return (
			<p className="text-body text-muted">
				O formulário deste exercício ainda não foi publicado. Fale com seu
				mentor.
			</p>
		);
	}

	// A avaliação final é uma só por jornada (sem referência a encontro); o
	// Raio-X lê as respostas dela.
	const isFinal = !!meeting.template?.is_final;
	return (
		<FormSubmissionPanel
			journeyId={journeyId}
			template={template}
			context={isFinal ? 'final_assessment' : 'meeting_exercise'}
			contextRefId={isFinal ? null : meeting.id}
		/>
	);
}
