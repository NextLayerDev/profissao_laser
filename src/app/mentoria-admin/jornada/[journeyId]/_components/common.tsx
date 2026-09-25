'use client';

// Peças comuns das abas da visão do mentor (jornada de um aluno).
import type { Target } from 'lucide-react';
import { useState } from 'react';
import type {
	DiagnosticState,
	MntFormSubmission,
	MntFormTemplate,
} from '@/modules/mentoria/types';
import { isUnknownAnswer } from '@/modules/mentoria/types';
import {
	Card,
	EmptyState,
	formatDateTime,
	Spinner,
} from '../../../_components/ui';

export const MEETING_STATUS: Record<
	string,
	{ tone: 'green' | 'amber' | 'blue' | 'slate'; label: string }
> = {
	locked: { tone: 'slate', label: 'Bloqueado' },
	available: { tone: 'blue', label: 'Disponível' },
	in_progress: { tone: 'amber', label: 'Em andamento' },
	done: { tone: 'green', label: 'Concluído' },
};

export const TASK_STATUS: Record<
	string,
	{ tone: 'green' | 'amber' | 'red' | 'slate' | 'blue'; label: string }
> = {
	pending: { tone: 'slate', label: 'Pendente' },
	in_progress: { tone: 'amber', label: 'Em andamento' },
	done: { tone: 'green', label: 'Concluída' },
	overdue: { tone: 'red', label: 'Atrasada' },
	cancelled: { tone: 'slate', label: 'Cancelada' },
};

const SUBMISSION_CONTEXT: Record<string, string> = {
	diagnostic: 'Diagnóstico (Foto Zero)',
	meeting_exercise: 'Exercício de encontro',
	tool: 'Ferramenta',
	final_assessment: 'Avaliação final',
};

/** Meta/medição em pt-BR: '12500.5 R$' não é como o mentor lê dinheiro. */
export function formatKpiValue(
	value: number | null,
	unit: string | null,
): string {
	if (value == null) return '—';
	if (unit === 'R$') {
		return value.toLocaleString('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		});
	}
	const n = value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
	if (!unit) return n;
	return unit === '%' ? `${n}%` : `${n} ${unit}`;
}

export function SectionTitle({
	icon: Icon,
	children,
}: {
	icon: typeof Target;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center gap-2 mb-4">
			<Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
			<h3 className="text-lg font-semibold text-slate-900 dark:text-white">
				{children}
			</h3>
		</div>
	);
}

/** Carregando / erro / vazio num lugar só: cada aba tem várias leituras. */
export function QueryState({
	loading,
	error,
	empty,
	errorText,
	emptyText,
	children,
}: {
	loading: boolean;
	error: boolean;
	empty: boolean;
	errorText: string;
	emptyText: string;
	children: React.ReactNode;
}) {
	if (loading) {
		return (
			<Card>
				<Spinner />
			</Card>
		);
	}
	// Sem este ramo, um 403/500 virava "nada registrado" e o mentor achava
	// que o aluno não tinha feito nada.
	if (error) {
		return (
			<Card>
				<EmptyState message={errorText} />
			</Card>
		);
	}
	if (empty) {
		return (
			<Card>
				<EmptyState message={emptyText} />
			</Card>
		);
	}
	return <>{children}</>;
}

export function labelsOf(
	template: MntFormTemplate | null | undefined,
): Record<string, string> {
	const labels: Record<string, string> = {};
	for (const block of template?.schema.blocks ?? []) {
		for (const field of block.fields) labels[field.key] = field.label;
	}
	return labels;
}

export function diagnosticLabels(
	state: DiagnosticState | undefined,
): Record<string, string> {
	return labelsOf(state?.template);
}

export function renderAnswer(value: unknown): string {
	if (isUnknownAnswer(value)) return '[ A LEVANTAR / NÃO MEDIDO ]';
	if (value == null || value === '') return '—';
	if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
	if (Array.isArray(value)) return value.map(String).join(', ');
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
}

/** Respostas por key, com o rótulo do template quando houver. */
export function AnswersList({
	answers,
	labels,
}: {
	answers: Record<string, unknown>;
	labels?: Record<string, string>;
}) {
	const entries = Object.entries(answers);
	if (entries.length === 0) {
		return <p className="text-sm text-muted">Sem respostas.</p>;
	}
	return (
		<dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
			{entries.map(([key, value]) => (
				<div key={key}>
					<dt className="text-xs uppercase tracking-wide text-slate-400 dark:text-gray-500">
						{labels?.[key] ?? key.replaceAll('_', ' ')}
					</dt>
					<dd className="text-sm text-slate-800 dark:text-slate-200 mt-0.5 break-words">
						{renderAnswer(value)}
					</dd>
				</div>
			))}
		</dl>
	);
}

export function SubmissionCard({
	submission,
	labels,
}: {
	submission: MntFormSubmission;
	labels?: Record<string, string>;
}) {
	const [open, setOpen] = useState(false);
	const count = Object.keys(submission.answers ?? {}).length;
	return (
		<Card className="p-4">
			<button
				type="button"
				className="w-full flex items-center justify-between gap-3 text-left"
				onClick={() => setOpen((v) => !v)}
			>
				<div>
					<p className="font-medium text-slate-900 dark:text-white">
						{SUBMISSION_CONTEXT[submission.context] ?? submission.context}
					</p>
					<p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
						{submission.status === 'submitted'
							? `Enviado em ${formatDateTime(submission.submitted_at)}`
							: 'Rascunho'}{' '}
						· v{submission.version}
					</p>
				</div>
				<span className="text-sm text-violet-600 dark:text-violet-400">
					{open ? 'Ocultar' : `Ver respostas (${count})`}
				</span>
			</button>
			{open && (
				<div className="mt-4 border-t border-slate-100 dark:border-white/5 pt-4">
					<AnswersList answers={submission.answers ?? {}} labels={labels} />
				</div>
			)}
		</Card>
	);
}
