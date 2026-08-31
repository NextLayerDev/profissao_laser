'use client';

import { Camera, ClipboardList, Lock, Save, Send } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { DynamicForm } from '@/modules/mentoria/components/dynamic-form';
import {
	useDiagnostic,
	useSaveDiagnosticDraft,
	useSubmitDiagnostic,
} from '@/modules/mentoria/hooks';
import type { MntSnapshot } from '@/modules/mentoria/types';
import { isUnknownAnswer } from '@/modules/mentoria/types';
import {
	apiErrorCode,
	BTN_GHOST,
	BTN_PRIMARY,
	CARD,
	EmptyState,
	fmtDate,
	JourneyGate,
	MntHeader,
	MntSkeleton,
} from '../_components/shared';

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
	const answersRef = useRef<Record<string, unknown> | null>(null);
	const [confirming, setConfirming] = useState(false);

	if (isLoading) return <MntSkeleton />;

	if (!data?.template) {
		return (
			<div className="p-4 md:p-8">
				<MntHeader
					title="Diagnóstico — Raio-X inicial"
					icon={ClipboardList}
					backHref="/course/mentoria"
				/>
				<EmptyState
					title="Diagnóstico indisponível"
					description="O formulário de diagnóstico ainda não foi publicado para a sua turma. Fale com seu mentor."
				/>
			</div>
		);
	}

	// Foto Zero congelada → modo leitura
	if (data.foto_zero) {
		return (
			<div className="p-4 md:p-8 space-y-6">
				<MntHeader
					title="Diagnóstico — Foto Zero"
					subtitle={`Congelada em ${fmtDate(data.foto_zero.taken_at)} — este é o seu ponto de partida`}
					icon={Camera}
					backHref="/course/mentoria"
				/>
				<div className={`${CARD} p-4 flex items-center gap-3`}>
					<Lock className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
					<p className="text-sm text-slate-600 dark:text-slate-300">
						A Foto Zero está congelada e não pode ser alterada. Ela é a
						referência do &quot;antes&quot; para medir toda a sua evolução na
						mentoria.
					</p>
				</div>
				<FotoZeroView
					snapshot={data.foto_zero}
					answers={
						(data.submitted?.answers ?? data.draft?.answers ?? null) as Record<
							string,
							unknown
						> | null
					}
					templateBlocks={data.template.schema.blocks}
				/>
			</div>
		);
	}

	const initialAnswers =
		(data.draft?.answers as Record<string, unknown> | undefined) ?? {};

	const handleSaveDraft = () => {
		saveDraft.mutate(answersRef.current ?? initialAnswers, {
			onSuccess: () => toast.success('Rascunho salvo!'),
			onError: () => toast.error('Não foi possível salvar o rascunho.'),
		});
	};

	const handleSubmit = () => {
		setConfirming(false);
		const doSubmit = () =>
			submit.mutate(undefined, {
				onSuccess: () =>
					toast.success('Diagnóstico enviado — Foto Zero congelada!'),
				onError: (e) => {
					if (apiErrorCode(e) === 'required_fields_missing') {
						toast.error(
							'Há campos obrigatórios sem resposta. Preencha (ou marque "A LEVANTAR") antes de enviar.',
						);
					} else {
						toast.error('Não foi possível enviar o diagnóstico.');
					}
				},
			});
		if (answersRef.current) {
			// Garante que o último estado do formulário está salvo antes de congelar
			saveDraft.mutate(answersRef.current, {
				onSuccess: doSubmit,
				onError: () => toast.error('Não foi possível salvar as respostas.'),
			});
		} else {
			doSubmit();
		}
	};

	return (
		<div className="p-4 md:p-8 space-y-6">
			<MntHeader
				title={data.template.title || 'Diagnóstico — Raio-X inicial'}
				subtitle={
					data.template.description ??
					'Responda com sinceridade: não saber também é diagnóstico. Use "A LEVANTAR" quando não tiver o dado.'
				}
				icon={ClipboardList}
				backHref="/course/mentoria"
			/>

			<DynamicForm
				template={data.template}
				initialAnswers={initialAnswers}
				onChange={(answers) => {
					answersRef.current = answers;
				}}
			/>

			<div
				className={`${CARD} p-4 flex flex-wrap items-center justify-between gap-3`}
			>
				<p className="text-sm text-slate-500 dark:text-gray-400">
					{data.draft
						? `Rascunho salvo por último em ${fmtDate(data.draft.updated_at)}.`
						: 'Nenhum rascunho salvo ainda.'}
				</p>
				<div className="flex gap-2">
					<button
						type="button"
						className={BTN_GHOST}
						onClick={handleSaveDraft}
						disabled={saveDraft.isPending}
					>
						<Save className="w-4 h-4" />
						{saveDraft.isPending ? 'Salvando...' : 'Salvar rascunho'}
					</button>
					<button
						type="button"
						className={BTN_PRIMARY}
						onClick={() => setConfirming(true)}
						disabled={submit.isPending}
					>
						<Send className="w-4 h-4" />
						Enviar diagnóstico e congelar Foto Zero
					</button>
				</div>
			</div>

			{confirming && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className={`${CARD} max-w-md w-full p-6`}>
						<div className="flex items-center gap-2 mb-2">
							<Camera className="w-5 h-5 text-teal-600 dark:text-teal-400" />
							<h3 className="font-semibold text-slate-900 dark:text-slate-100">
								Congelar Foto Zero?
							</h3>
						</div>
						<p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
							Ao enviar, suas respostas viram a Foto Zero da sua empresa — o
							retrato oficial do ponto de partida.{' '}
							<strong>Ela não pode ser alterada depois.</strong>
						</p>
						<div className="flex justify-end gap-2">
							<button
								type="button"
								className={BTN_GHOST}
								onClick={() => setConfirming(false)}
							>
								Voltar e revisar
							</button>
							<button
								type="button"
								className={BTN_PRIMARY}
								onClick={handleSubmit}
								disabled={submit.isPending}
							>
								{submit.isPending ? 'Enviando...' : 'Enviar e congelar'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function FotoZeroView({
	snapshot,
	answers,
	templateBlocks,
}: {
	snapshot: MntSnapshot;
	answers: Record<string, unknown> | null;
	templateBlocks: Array<{
		key: string;
		title: string;
		fields: Array<{ key: string; label: string }>;
	}>;
}) {
	// Preferimos as respostas da submissão; o payload do snapshot é o fallback.
	const source =
		answers ??
		((snapshot.payload.answers ?? snapshot.payload) as Record<string, unknown>);

	return (
		<div className="space-y-5">
			{templateBlocks.map((block) => (
				<section key={block.key} className={`${CARD} p-5`}>
					<h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
						{block.title}
					</h3>
					<dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
						{block.fields.map((field) => {
							const value = source?.[field.key];
							return (
								<div key={field.key}>
									<dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">
										{field.label}
									</dt>
									<dd className="text-sm text-slate-900 dark:text-slate-100 mt-0.5 whitespace-pre-wrap">
										{renderAnswer(value)}
									</dd>
								</div>
							);
						})}
					</dl>
				</section>
			))}
		</div>
	);
}

function renderAnswer(value: unknown): string {
	if (value === undefined || value === null || value === '') return '—';
	if (isUnknownAnswer(value)) return '[ A LEVANTAR / NÃO MEDIDO ]';
	if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
	if (Array.isArray(value)) return value.map(String).join(', ');
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
}
