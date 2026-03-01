'use client';

import { Check, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	useCreateQuestion,
	useCreateQuiz,
	useDeleteQuestion,
	useDeleteQuiz,
	useQuiz,
	useUpdateQuestion,
} from '@/hooks/use-quiz';
import type { CreateQuestionPayload, Quiz, QuizQuestion } from '@/types/quiz';

// ─── Question Editor ──────────────────────────────────────────────────────────

interface QuestionEditorProps {
	quizId: string;
	lessonId: string;
	question?: QuizQuestion;
	nextOrder: number;
	onDone: () => void;
}

function QuestionEditor({
	quizId,
	lessonId,
	question,
	nextOrder,
	onDone,
}: QuestionEditorProps) {
	const [text, setText] = useState(question?.text ?? '');
	const [options, setOptions] = useState<
		{ id: number; text: string; isCorrect: boolean }[]
	>(
		question?.options.map((o, i) => ({
			id: i,
			text: o.text,
			isCorrect: o.isCorrect,
		})) ?? [
			{ id: 0, text: '', isCorrect: false },
			{ id: 1, text: '', isCorrect: false },
		],
	);
	const nextId = Math.max(0, ...options.map((o) => o.id)) + 1;

	const createQ = useCreateQuestion(lessonId);
	const updateQ = useUpdateQuestion(lessonId);
	const isPending = createQ.isPending || updateQ.isPending;

	function setCorrect(idx: number) {
		setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
	}

	function updateOptionText(idx: number, val: string) {
		setOptions((prev) =>
			prev.map((o, i) => (i === idx ? { ...o, text: val } : o)),
		);
	}

	function addOption() {
		if (options.length >= 5) return;
		setOptions((prev) => [...prev, { id: nextId, text: '', isCorrect: false }]);
	}

	function removeOption(idx: number) {
		if (options.length <= 2) return;
		setOptions((prev) => prev.filter((_, i) => i !== idx));
	}

	async function handleSave() {
		if (!text.trim()) {
			toast.error('Informe o enunciado');
			return;
		}
		if (options.some((o) => !o.text.trim())) {
			toast.error('Preencha todas as opções');
			return;
		}
		if (!options.some((o) => o.isCorrect)) {
			toast.error('Marque a resposta correta');
			return;
		}

		const payload: CreateQuestionPayload = {
			text,
			order: question?.order ?? nextOrder,
			options,
		};
		try {
			if (question) {
				await updateQ.mutateAsync({ questionId: question.id, payload });
				toast.success('Pergunta atualizada!');
			} else {
				await createQ.mutateAsync({ quizId, payload });
				toast.success('Pergunta adicionada!');
			}
			onDone();
		} catch {
			toast.error('Erro ao salvar pergunta');
		}
	}

	return (
		<div className="bg-[#0d0d0f] border border-gray-700 rounded-xl p-4 space-y-4">
			<div>
				<label
					htmlFor="question-text"
					className="text-xs font-medium text-gray-400 mb-1.5 block"
				>
					Enunciado
				</label>
				<textarea
					id="question-text"
					value={text}
					onChange={(e) => setText(e.target.value)}
					rows={2}
					placeholder="Digite a pergunta..."
					className="w-full px-3 py-2 bg-[#1a1a1d] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:border-violet-500 focus:outline-none resize-none"
				/>
			</div>

			<div>
				<p className="text-xs font-medium text-gray-400 mb-2">
					Opções{' '}
					<span className="text-gray-600">
						(clique no círculo para marcar a correta)
					</span>
				</p>
				<div className="space-y-2">
					{options.map((opt, idx) => (
						<div key={opt.id} className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setCorrect(idx)}
								className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
									opt.isCorrect
										? 'bg-emerald-500 border-emerald-500'
										: 'border-gray-600 hover:border-gray-400'
								}`}
							>
								{opt.isCorrect && <Check className="w-3 h-3 text-white" />}
							</button>
							<input
								type="text"
								value={opt.text}
								onChange={(e) => updateOptionText(idx, e.target.value)}
								placeholder={`Opção ${idx + 1}`}
								className="flex-1 px-3 py-1.5 bg-[#1a1a1d] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none"
							/>
							<button
								type="button"
								onClick={() => removeOption(idx)}
								disabled={options.length <= 2}
								className="p-1 text-gray-600 hover:text-red-400 transition-colors disabled:opacity-30"
							>
								<Trash2 className="w-3.5 h-3.5" />
							</button>
						</div>
					))}
				</div>
				{options.length < 5 && (
					<button
						type="button"
						onClick={addOption}
						className="mt-2 flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
					>
						<Plus className="w-3.5 h-3.5" />
						Adicionar opção
					</button>
				)}
			</div>

			<div className="flex justify-end gap-2 pt-2">
				<button
					type="button"
					onClick={onDone}
					className="px-3 py-1.5 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
				>
					Cancelar
				</button>
				<button
					type="button"
					onClick={handleSave}
					disabled={isPending}
					className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
				>
					{isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
					{question ? 'Salvar' : 'Adicionar'}
				</button>
			</div>
		</div>
	);
}

// ─── Question Item ────────────────────────────────────────────────────────────

interface QuestionItemProps {
	question: QuizQuestion;
	lessonId: string;
}

function QuestionItem({ question, lessonId }: QuestionItemProps) {
	const [editing, setEditing] = useState(false);
	const deleteQ = useDeleteQuestion(lessonId);

	async function handleDelete() {
		if (!confirm('Remover esta pergunta?')) return;
		try {
			await deleteQ.mutateAsync(question.id);
			toast.success('Pergunta removida');
		} catch {
			toast.error('Erro ao remover');
		}
	}

	if (editing) {
		return (
			<QuestionEditor
				quizId={question.id}
				lessonId={lessonId}
				question={question}
				nextOrder={question.order}
				onDone={() => setEditing(false)}
			/>
		);
	}

	return (
		<div className="bg-[#0d0d0f] border border-gray-800 rounded-xl p-4 group">
			<div className="flex items-start justify-between gap-3 mb-3">
				<p className="text-sm font-medium text-white leading-snug">
					{question.text}
				</p>
				<div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
					<button
						type="button"
						onClick={() => setEditing(true)}
						className="px-2.5 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
					>
						Editar
					</button>
					<button
						type="button"
						onClick={handleDelete}
						disabled={deleteQ.isPending}
						className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
					>
						<Trash2 className="w-3.5 h-3.5" />
					</button>
				</div>
			</div>
			<ul className="space-y-1.5">
				{question.options.map((opt) => (
					<li key={opt.id} className="flex items-center gap-2 text-sm">
						<div
							className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
								opt.isCorrect
									? 'bg-emerald-500 border-emerald-500'
									: 'border-gray-600'
							}`}
						>
							{opt.isCorrect && <Check className="w-2.5 h-2.5 text-white" />}
						</div>
						<span
							className={opt.isCorrect ? 'text-emerald-300' : 'text-gray-400'}
						>
							{opt.text}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface LessonQuizModalProps {
	lessonId: string;
	lessonTitle: string;
	onClose: () => void;
}

export function LessonQuizModal({
	lessonId,
	lessonTitle,
	onClose,
}: LessonQuizModalProps) {
	const { data: quiz, isLoading } = useQuiz(lessonId);
	const createQuiz = useCreateQuiz(lessonId);
	const deleteQuiz = useDeleteQuiz(lessonId);
	const [addingQuestion, setAddingQuestion] = useState(false);
	const [quizTitle, setQuizTitle] = useState('');

	async function handleCreateQuiz() {
		if (!quizTitle.trim()) {
			toast.error('Informe o título do quiz');
			return;
		}
		try {
			await createQuiz.mutateAsync(quizTitle);
			toast.success('Quiz criado!');
		} catch {
			toast.error('Erro ao criar quiz');
		}
	}

	async function handleDeleteQuiz(q: Quiz) {
		if (!confirm('Remover o quiz e todas as perguntas?')) return;
		try {
			await deleteQuiz.mutateAsync(q.id);
			toast.success('Quiz removido');
		} catch {
			toast.error('Erro ao remover quiz');
		}
	}

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
			<div className="bg-[#1a1a1d] border border-gray-700 rounded-xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">
				{/* Header */}
				<div className="flex items-center justify-between p-5 border-b border-gray-700 shrink-0">
					<div>
						<h3 className="text-lg font-bold text-white">Quiz da aula</h3>
						<p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
							{lessonTitle}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
					>
						<X className="w-4 h-4 text-gray-400" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-5">
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
						</div>
					) : !quiz ? (
						/* Sem quiz — criar */
						<div className="text-center py-8 space-y-4">
							<p className="text-gray-400 text-sm">
								Esta aula ainda não tem quiz.
							</p>
							<div className="flex flex-col items-center gap-3 max-w-xs mx-auto">
								<input
									type="text"
									value={quizTitle}
									onChange={(e) => setQuizTitle(e.target.value)}
									placeholder="Título do quiz (ex: Quiz Módulo 1)"
									className="w-full px-3 py-2.5 bg-[#0d0d0f] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none"
								/>
								<button
									type="button"
									onClick={handleCreateQuiz}
									disabled={createQuiz.isPending}
									className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
								>
									{createQuiz.isPending && (
										<Loader2 className="w-4 h-4 animate-spin" />
									)}
									Criar quiz
								</button>
							</div>
						</div>
					) : (
						/* Quiz existente */
						<div className="space-y-5">
							<div className="flex items-center justify-between">
								<div>
									<h4 className="font-semibold text-white">{quiz.title}</h4>
									<p className="text-xs text-gray-500 mt-0.5">
										{quiz.questions.length} pergunta
										{quiz.questions.length !== 1 ? 's' : ''}
									</p>
								</div>
								<button
									type="button"
									onClick={() => handleDeleteQuiz(quiz)}
									className="text-xs text-gray-600 hover:text-red-400 transition-colors"
								>
									Remover quiz
								</button>
							</div>

							{/* Questions list */}
							<div className="space-y-3">
								{quiz.questions
									.sort((a, b) => a.order - b.order)
									.map((q) => (
										<QuestionItem key={q.id} question={q} lessonId={lessonId} />
									))}
							</div>

							{/* Add question */}
							{addingQuestion ? (
								<QuestionEditor
									quizId={quiz.id}
									lessonId={lessonId}
									nextOrder={quiz.questions.length}
									onDone={() => setAddingQuestion(false)}
								/>
							) : (
								<button
									type="button"
									onClick={() => setAddingQuestion(true)}
									className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-700 hover:border-violet-500/50 rounded-xl text-sm text-gray-400 hover:text-violet-300 transition-colors"
								>
									<Plus className="w-4 h-4" />
									Adicionar pergunta
								</button>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
