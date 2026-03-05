'use client';

import type { DefaultQuestion } from '@/types/doubt-chat';

export interface QualificationFormProps {
	questions: DefaultQuestion[];
	answers: Record<string, string>;
	onAnswersChange: (answers: Record<string, string>) => void;
}

export function QualificationForm({
	questions,
	answers,
	onAnswersChange,
}: QualificationFormProps) {
	const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

	function handleChange(questionId: string, value: string) {
		onAnswersChange({ ...answers, [questionId]: value });
	}

	if (sortedQuestions.length === 0) {
		return null;
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-slate-600 dark:text-slate-400">
				Responda às perguntas de qualificação antes de enviar a sua dúvida.
			</p>
			{sortedQuestions.map((q) => (
				<div key={q.id}>
					<label
						htmlFor={`qual-${q.id}`}
						className="text-sm font-medium text-slate-700 dark:text-gray-300 block mb-1.5"
					>
						{q.text}
					</label>
					{q.type === 'textarea' ? (
						<textarea
							id={`qual-${q.id}`}
							value={answers[q.id] ?? ''}
							onChange={(e) => handleChange(q.id, e.target.value)}
							rows={3}
							placeholder="Escreva aqui..."
							className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:outline-none text-sm"
						/>
					) : q.type === 'select' ? (
						<select
							id={`qual-${q.id}`}
							value={answers[q.id] ?? ''}
							onChange={(e) => handleChange(q.id, e.target.value)}
							className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none text-sm"
						>
							<option value="">Selecione...</option>
							{q.options?.map((opt) => (
								<option key={opt} value={opt}>
									{opt}
								</option>
							))}
						</select>
					) : (
						<input
							id={`qual-${q.id}`}
							type="text"
							value={answers[q.id] ?? ''}
							onChange={(e) => handleChange(q.id, e.target.value)}
							placeholder="Escreva aqui..."
							className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:outline-none text-sm"
						/>
					)}
				</div>
			))}
		</div>
	);
}
