'use client';

import { CheckCircle2, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { MntJourneyMeeting } from '@/modules/mentoria/types';
import {
	mentoriaErrorMessage,
	useMentorMeetingMutations,
} from '../../../_components/admin-hooks';
import {
	Badge,
	Card,
	dangerBtn,
	EmptyState,
	Field,
	formatDate,
	inputClass,
	Modal,
	primaryBtn,
	secondaryBtn,
} from '../../../_components/ui';
import { MEETING_STATUS } from './common';

export function MeetingsTab({
	journeyId,
	meetings,
}: {
	journeyId: string;
	meetings: MntJourneyMeeting[];
}) {
	const { validate, feedback } = useMentorMeetingMutations(journeyId);
	const [feedbackFor, setFeedbackFor] = useState<MntJourneyMeeting | null>(
		null,
	);

	const doValidate = async (meeting: MntJourneyMeeting) => {
		try {
			await validate.mutateAsync(meeting.id);
			toast.success(`Encontro ${meeting.position} validado`);
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao validar o encontro'));
		}
	};

	// null apaga: um feedback enviado por engano não tinha como sair.
	const saveFeedback = async (text: string | null) => {
		if (!feedbackFor) return;
		try {
			await feedback.mutateAsync({ meetingId: feedbackFor.id, feedback: text });
			toast.success(text ? 'Feedback salvo' : 'Feedback apagado');
			setFeedbackFor(null);
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao salvar o feedback'));
		}
	};

	if (!meetings.length) {
		return (
			<Card>
				<EmptyState message="Nenhum encontro na jornada." />
			</Card>
		);
	}

	return (
		<>
			<div className="space-y-3">
				{meetings.map((m) => {
					const st = MEETING_STATUS[m.status] ?? {
						tone: 'slate' as const,
						label: m.status,
					};
					return (
						<Card key={m.id} className="p-4">
							<div className="flex items-start justify-between gap-4 flex-wrap">
								<div className="flex items-start gap-3">
									<div
										className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
											m.status === 'done'
												? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
												: 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-gray-400'
										}`}
									>
										{m.position}
									</div>
									<div>
										<p className="font-medium text-slate-900 dark:text-white">
											{m.template?.title ?? `Encontro ${m.position}`}
										</p>
										<div className="flex items-center gap-2 mt-1 flex-wrap">
											<Badge tone={st.tone}>{st.label}</Badge>
											{m.student_completed_at && (
												<span className="text-xs text-slate-400 dark:text-gray-500">
													Aluno concluiu em {formatDate(m.student_completed_at)}
												</span>
											)}
											{m.mentor_validated_at && (
												<span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
													<CheckCircle2 className="w-3.5 h-3.5" />
													Validado em {formatDate(m.mentor_validated_at)}
												</span>
											)}
										</div>
										{m.mentor_feedback && (
											<p className="text-sm text-slate-600 dark:text-gray-400 mt-2 border-l-2 border-violet-400 pl-3 whitespace-pre-line">
												{m.mentor_feedback}
											</p>
										)}
									</div>
								</div>
								<div className="flex gap-2">
									<button
										type="button"
										className={secondaryBtn}
										onClick={() => setFeedbackFor(m)}
									>
										<MessageSquare className="w-3.5 h-3.5" />
										Feedback
									</button>
									{/* Só o que o aluno concluiu: validar um encontro
									    bloqueado marcava "Validado" no futuro. */}
									{!m.mentor_validated_at && m.status === 'done' && (
										<button
											type="button"
											className={primaryBtn}
											onClick={() => doValidate(m)}
											disabled={validate.isPending}
										>
											<CheckCircle2 className="w-4 h-4" />
											Validar
										</button>
									)}
								</div>
							</div>
						</Card>
					);
				})}
			</div>

			{feedbackFor && (
				<FeedbackModal
					meeting={feedbackFor}
					onClose={() => setFeedbackFor(null)}
					onSave={saveFeedback}
					pending={feedback.isPending}
				/>
			)}
		</>
	);
}

function FeedbackModal({
	meeting,
	onClose,
	onSave,
	pending,
}: {
	meeting: MntJourneyMeeting;
	onClose: () => void;
	onSave: (text: string | null) => void;
	pending: boolean;
}) {
	const [text, setText] = useState(meeting.mentor_feedback ?? '');
	return (
		<Modal title={`Feedback — Encontro ${meeting.position}`} onClose={onClose}>
			<div className="space-y-4">
				<Field label="Feedback do mentor">
					<textarea
						className={`${inputClass} min-h-32`}
						value={text}
						maxLength={5000}
						onChange={(e) => setText(e.target.value)}
						placeholder="O que foi bem, o que melhorar, próximos passos"
					/>
				</Field>
				<div className="flex justify-between gap-2 flex-wrap">
					{meeting.mentor_feedback ? (
						<button
							type="button"
							className={dangerBtn}
							disabled={pending}
							onClick={() => onSave(null)}
						>
							<Trash2 className="w-3.5 h-3.5" />
							Apagar
						</button>
					) : (
						<span />
					)}
					<div className="flex gap-2">
						<button type="button" className={secondaryBtn} onClick={onClose}>
							Cancelar
						</button>
						<button
							type="button"
							className={primaryBtn}
							disabled={pending || !text.trim()}
							onClick={() => onSave(text.trim())}
						>
							{pending && <Loader2 className="w-4 h-4 animate-spin" />}
							Salvar
						</button>
					</div>
				</div>
			</div>
		</Modal>
	);
}
