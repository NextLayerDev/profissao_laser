'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Save, Send } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';
import { DynamicForm } from '@/modules/mentoria/components/dynamic-form';
import {
	getFormTemplate,
	listSubmissions,
	saveSubmissionDraft,
	submitSubmission,
} from '@/modules/mentoria/service';
import type { ToolWithInstance } from '@/modules/mentoria/types';
import {
	apiErrorCode,
	BTN_GHOST,
	BTN_PRIMARY,
	CARD,
	EmptyState,
	fmtDate,
	MntSkeleton,
} from '../shared';

/** Ferramenta kind=form: formulário data-driven com rascunho + envio. */
export function ToolForm({
	tool,
	journeyId,
}: {
	tool: ToolWithInstance;
	journeyId: string;
}) {
	const qc = useQueryClient();
	const instanceId = tool.instance?.id as string;
	const templateKey = tool.form_template_key;
	const answersRef = useRef<Record<string, unknown> | null>(null);

	const { data: template, isLoading: tplLoading } = useQuery({
		queryKey: ['mentoria', 'form-template', templateKey],
		queryFn: () => getFormTemplate(templateKey as string),
		enabled: !!templateKey,
	});

	const subsKey = ['mentoria', 'tool-submissions', journeyId, instanceId];
	const { data: submissions, isLoading: subsLoading } = useQuery({
		queryKey: subsKey,
		queryFn: () =>
			listSubmissions(journeyId, {
				context: 'tool',
				context_ref_id: instanceId,
			}),
	});

	const saveDraft = useMutation({
		mutationFn: (answers: Record<string, unknown>) =>
			saveSubmissionDraft(journeyId, {
				form_template_id: (template as { id: string }).id,
				context: 'tool',
				context_ref_id: instanceId,
				answers,
			}),
		onSuccess: () => qc.invalidateQueries({ queryKey: subsKey }),
	});

	const submit = useMutation({
		mutationFn: (submissionId: string) =>
			submitSubmission(journeyId, submissionId),
		onSuccess: () => qc.invalidateQueries({ queryKey: subsKey }),
	});

	if (tplLoading || subsLoading) return <MntSkeleton />;

	if (!templateKey || !template) {
		return (
			<EmptyState
				title="Formulário indisponível"
				description="O modelo deste formulário ainda não foi publicado. Fale com seu mentor."
			/>
		);
	}

	const submitted = (submissions ?? []).find((s) => s.status === 'submitted');
	const draft = (submissions ?? []).find((s) => s.status === 'draft');

	if (submitted) {
		return (
			<div className="space-y-4">
				<div className={`${CARD} p-4 flex items-center gap-3`}>
					<CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
					<p className="text-sm text-slate-700 dark:text-slate-300">
						Enviado em {fmtDate(submitted.submitted_at)}. Respostas em modo
						leitura.
					</p>
				</div>
				<DynamicForm
					template={template}
					initialAnswers={submitted.answers as Record<string, unknown>}
					readOnly
				/>
			</div>
		);
	}

	const handleSave = (after?: (submissionId: string) => void) => {
		const answers =
			answersRef.current ??
			(draft?.answers as Record<string, unknown> | undefined) ??
			{};
		saveDraft.mutate(answers, {
			onSuccess: (saved) => {
				if (after) after(saved.id);
				else toast.success('Rascunho salvo!');
			},
			onError: () => toast.error('Não foi possível salvar o rascunho.'),
		});
	};

	const handleSubmit = () => {
		handleSave((submissionId) => {
			submit.mutate(submissionId, {
				onSuccess: () => toast.success('Formulário enviado!'),
				onError: (e) => {
					if (apiErrorCode(e) === 'required_fields_missing') {
						toast.error('Há campos obrigatórios sem resposta.');
					} else {
						toast.error('Não foi possível enviar o formulário.');
					}
				},
			});
		});
	};

	return (
		<div className="space-y-4">
			<DynamicForm
				template={template}
				initialAnswers={(draft?.answers as Record<string, unknown>) ?? {}}
				onChange={(answers) => {
					answersRef.current = answers;
				}}
			/>
			<div
				className={`${CARD} p-4 flex flex-wrap items-center justify-end gap-2`}
			>
				<button
					type="button"
					className={BTN_GHOST}
					onClick={() => handleSave()}
					disabled={saveDraft.isPending}
				>
					<Save className="w-4 h-4" />
					{saveDraft.isPending ? 'Salvando...' : 'Salvar rascunho'}
				</button>
				<button
					type="button"
					className={BTN_PRIMARY}
					onClick={handleSubmit}
					disabled={saveDraft.isPending || submit.isPending}
				>
					<Send className="w-4 h-4" />
					{submit.isPending ? 'Enviando...' : 'Enviar'}
				</button>
			</div>
		</div>
	);
}
