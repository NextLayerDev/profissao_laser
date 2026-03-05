'use client';

import {
	ArrowLeft,
	Bookmark,
	BookOpen,
	Check,
	ChevronDown,
	ChevronRight,
	ClipboardList,
	ExternalLink,
	FileImage,
	FileText,
	Loader2,
	Lock,
	LockKeyhole,
	MessageSquare,
	PackageX,
	Paperclip,
	Play,
	RefreshCw,
	Search,
	Star,
	Trophy,
	X,
	Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DoubtsTab } from '@/components/course/doubts-tab';
import { SavedLessonsModal } from '@/components/course/saved-lessons-modal';
import { VideoPlayer } from '@/components/course/video-player';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCourse } from '@/hooks/use-course';
import { useCustomerFeaturesForCourse } from '@/hooks/use-customer-features';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { useLessonProgress } from '@/hooks/use-lesson-progress';
import { useMaterials } from '@/hooks/use-materials';
import { useQuiz } from '@/hooks/use-quiz';
import { useLessonRating, useSubmitRating } from '@/hooks/use-rating';
import {
	useRemoveSavedLesson,
	useSavedLessons,
	useSaveLesson,
} from '@/hooks/use-saved-lessons';
import { getCurrentUser, getToken } from '@/lib/auth';
import type { CourseLesson } from '@/types/course';
import type { MaterialType } from '@/types/materials';
import type { Quiz } from '@/types/quiz';
import { FULL_FEATURES } from '@/utils/constants/class-features';

// ─── Material icon ────────────────────────────────────────────────────────────

function MaterialIcon({ type }: { type: MaterialType }) {
	if (type === 'image')
		return <FileImage className="w-5 h-5 text-emerald-400 shrink-0" />;
	if (type === 'word')
		return <FileText className="w-5 h-5 text-blue-400 shrink-0" />;
	return <FileText className="w-5 h-5 text-red-400 shrink-0" />;
}

// ─── Quiz Player ──────────────────────────────────────────────────────────────

function QuizPlayer({ quiz }: { quiz: Quiz }) {
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [submitted, setSubmitted] = useState(false);

	const sorted = [...quiz.questions].sort((a, b) => a.order - b.order);
	const allAnswered = sorted.every((q) => answers[q.id]);

	function selectOption(questionId: string, optionId: string) {
		if (submitted) return;
		setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
	}

	function reset() {
		setAnswers({});
		setSubmitted(false);
	}

	const score = submitted
		? sorted.filter((q) => {
				const chosen = q.options.find((o) => o.id === answers[q.id]);
				return chosen?.isCorrect;
			}).length
		: 0;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-bold text-slate-900 dark:text-white text-lg">
						{quiz.title}
					</h3>
					<p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
						{sorted.length} pergunta{sorted.length !== 1 ? 's' : ''}
					</p>
				</div>
				{submitted && (
					<div className="text-right">
						<p
							className={`text-2xl font-black ${score === sorted.length ? 'text-emerald-500 dark:text-emerald-400' : score >= sorted.length / 2 ? 'text-yellow-500 dark:text-yellow-400' : 'text-red-500 dark:text-red-400'}`}
						>
							{score}/{sorted.length}
						</p>
						<p className="text-xs text-slate-500">acertos</p>
					</div>
				)}
			</div>

			<div className="space-y-5">
				{sorted.map((question, qIdx) => {
					const chosenId = answers[question.id];
					const correctOption = question.options.find((o) => o.isCorrect);

					return (
						<div
							key={question.id}
							className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-5"
						>
							<p className="text-sm font-semibold text-slate-900 dark:text-white mb-4 leading-snug">
								<span className="text-slate-500 mr-2">{qIdx + 1}.</span>
								{question.text}
							</p>
							<div className="space-y-2">
								{question.options.map((opt) => {
									const isChosen = chosenId === opt.id;
									const isCorrect = opt.isCorrect;

									let optStyle =
										'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 hover:border-violet-500/40 hover:bg-violet-50 dark:hover:bg-violet-500/5';
									if (submitted) {
										if (isCorrect)
											optStyle =
												'border-emerald-500/60 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-200';
										else if (isChosen && !isCorrect)
											optStyle =
												'border-red-500/60 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300';
										else
											optStyle =
												'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] text-slate-400 dark:text-slate-500 opacity-60';
									} else if (isChosen) {
										optStyle =
											'border-violet-500/60 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-200';
									}

									return (
										<button
											key={opt.id}
											type="button"
											onClick={() => selectOption(question.id, opt.id)}
											disabled={submitted}
											className={`w-full flex items-center gap-3 px-4 py-3 border rounded-xl text-sm text-left transition-all ${optStyle}`}
										>
											<div
												className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
													submitted && isCorrect
														? 'border-emerald-500 bg-emerald-500 dark:border-emerald-400 dark:bg-emerald-400'
														: submitted && isChosen && !isCorrect
															? 'border-red-500 bg-red-500 dark:border-red-400 dark:bg-red-400'
															: isChosen
																? 'border-violet-500 bg-violet-500 dark:border-violet-400 dark:bg-violet-400'
																: 'border-slate-300 dark:border-white/20'
												}`}
											>
												{submitted && isCorrect && (
													<Check className="w-3 h-3 text-white" />
												)}
												{submitted && isChosen && !isCorrect && (
													<X className="w-3 h-3 text-white" />
												)}
												{!submitted && isChosen && (
													<div className="w-2 h-2 rounded-full bg-white" />
												)}
											</div>
											{opt.text}
										</button>
									);
								})}
							</div>
							{submitted && chosenId !== correctOption?.id && (
								<p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 flex items-center gap-1.5">
									<Check className="w-3.5 h-3.5" />
									Resposta correta:{' '}
									<span className="font-medium">{correctOption?.text}</span>
								</p>
							)}
						</div>
					);
				})}
			</div>

			{!submitted ? (
				<button
					type="button"
					onClick={() => setSubmitted(true)}
					disabled={!allAnswered}
					className="w-full flex items-center justify-center gap-2 py-3 bg-linear-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
				>
					<Trophy className="w-4 h-4" />
					Verificar respostas
				</button>
			) : (
				<button
					type="button"
					onClick={reset}
					className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-medium rounded-xl transition-all"
				>
					<RefreshCw className="w-4 h-4" />
					Tentar novamente
				</button>
			)}
		</div>
	);
}

// ─── Tab content components ───────────────────────────────────────────────────

function MaterialsTab({ lessonId }: { lessonId: string | null }) {
	const { data: materials = [], isLoading } = useMaterials(lessonId ?? '');

	if (!lessonId) {
		return (
			<div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-600">
				<Paperclip className="w-8 h-8 mb-3" />
				<p className="text-sm">Selecione uma aula para ver os materiais.</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-10">
				<Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
			</div>
		);
	}

	if (materials.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-600">
				<FileText className="w-8 h-8 mb-3" />
				<p className="text-sm">Nenhum material disponível para esta aula.</p>
			</div>
		);
	}

	const borderColors: Record<MaterialType, string> = {
		image: 'border-l-emerald-500',
		word: 'border-l-blue-500',
		pdf: 'border-l-red-500',
	};

	return (
		<div className="space-y-3">
			{materials.map((mat) => (
				<a
					key={mat.id}
					href={mat.url}
					target="_blank"
					rel="noreferrer"
					className={`flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-white/10 border-l-4 ${borderColors[mat.type] ?? 'border-l-violet-500'} hover:bg-slate-50 dark:hover:bg-white/10 transition-all group`}
				>
					<div className="flex items-center gap-4 min-w-0">
						<div
							className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
								mat.type === 'image'
									? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-500'
									: mat.type === 'word'
										? 'bg-blue-100 dark:bg-blue-950/30 text-blue-500'
										: 'bg-red-100 dark:bg-red-950/30 text-red-500'
							}`}
						>
							<MaterialIcon type={mat.type} />
						</div>
						<div className="min-w-0">
							<p className="font-semibold text-slate-900 dark:text-white truncate">
								{mat.name}
							</p>
							<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
								{mat.type === 'pdf'
									? 'PDF'
									: mat.type === 'word'
										? 'Documento'
										: 'Imagem'}
							</p>
						</div>
					</div>
					<ExternalLink className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-violet-400 shrink-0 transition-colors" />
				</a>
			))}
		</div>
	);
}

function QuizTab({ lessonId }: { lessonId: string | null }) {
	const { data: quiz, isLoading } = useQuiz(lessonId ?? '');

	if (!lessonId) {
		return (
			<div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-600">
				<ClipboardList className="w-8 h-8 mb-3" />
				<p className="text-sm">Selecione uma aula para ver o quiz.</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-10">
				<Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
			</div>
		);
	}

	if (!quiz) {
		return (
			<div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-600">
				<ClipboardList className="w-8 h-8 mb-3" />
				<p className="text-sm">Esta aula não possui quiz.</p>
			</div>
		);
	}

	if (quiz.questions.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-600">
				<ClipboardList className="w-8 h-8 mb-3" />
				<p className="text-sm">O quiz desta aula ainda não tem perguntas.</p>
			</div>
		);
	}

	return <QuizPlayer quiz={quiz} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CourseSlugPage() {
	const { slug } = useParams<{ slug: string }>();
	const searchParams = useSearchParams();
	const lessonIdFromUrl = searchParams.get('lesson');
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [isAdmin, setIsAdmin] = useState(false);
	const [savedLessonsModalOpen, setSavedLessonsModalOpen] = useState(false);

	useEffect(() => {
		const user = getCurrentUser();
		setEmail(user?.email ?? null);
		setIsAdmin(!!getToken('user') && user?.role != null);
	}, []);

	const { data: plans } = useCustomerPlans(email ?? null);
	const customerFeatures = useCustomerFeaturesForCourse(plans, slug);
	const features = isAdmin
		? FULL_FEATURES
		: (customerFeatures?.features ?? null);
	const upgradeTiers = isAdmin
		? null
		: (customerFeatures?.upgradeTiers ?? null);

	const { data: course, isLoading, isError } = useCourse(slug);
	const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
	const {
		watchedLessonIds,
		markWatched,
		isLoading: progressLoading,
	} = useLessonProgress(course?.id);

	// Hooks devem ser chamados sempre na mesma ordem (antes de qualquer early return)
	const { data: ratingData } = useLessonRating(activeLesson?.id ?? '');
	const submitRating = useSubmitRating(activeLesson?.id ?? '');
	const isLoggedIn = !!getToken('customer') || !!getToken('user');
	const { data: savedLessons = [] } = useSavedLessons();
	const saveLessonMutation = useSaveLesson();
	const removeSavedLessonMutation = useRemoveSavedLesson();
	const [search, setSearch] = useState('');
	const [hoverRating, setHoverRating] = useState(0);
	const [bottomTab, setBottomTab] = useState<'duvidas' | 'materiais' | 'quiz'>(
		'duvidas',
	);
	const [collapsedModules, setCollapsedModules] = useState<Set<string>>(
		new Set(),
	);
	const [showEndScreen, setShowEndScreen] = useState(false);
	const [autoPlay, setAutoPlay] = useState(() => {
		if (typeof window === 'undefined') return false;
		return localStorage.getItem('lesson-autoplay') === 'true';
	});

	const toggleAutoPlay = () => {
		setAutoPlay((prev) => {
			const next = !prev;
			localStorage.setItem('lesson-autoplay', String(next));
			return next;
		});
	};

	// Se não tem acesso a chat, mudar para materiais ao carregar features
	useEffect(() => {
		if (features && !features.chat && bottomTab === 'duvidas') {
			setBottomTab('materiais');
		}
	}, [features, bottomTab]);

	// Selecionar aula inicial: ?lesson=xxx na URL ou primeira não assistida
	const hasSetInitialLesson = useRef(false);
	const prevSlugRef = useRef(slug);
	if (prevSlugRef.current !== slug) {
		prevSlugRef.current = slug;
		hasSetInitialLesson.current = false;
	}
	useEffect(() => {
		if (!course) return;
		const modules = course.modules
			.slice()
			.sort((a, b) => a.order - b.order)
			.map((m) => ({
				...m,
				lessons: m.lessons.slice().sort((a, b) => a.order - b.order),
			}));
		const lessons = modules.flatMap((m) => m.lessons);

		if (lessonIdFromUrl) {
			hasSetInitialLesson.current = true;
			const lesson = lessons.find((l) => l.id === lessonIdFromUrl);
			if (lesson) setActiveLesson(lesson);
			return;
		}

		// Sem ?lesson= na URL: abrir na próxima aula após a última concluída
		if (progressLoading || hasSetInitialLesson.current) return;
		hasSetInitialLesson.current = true;
		const nextLesson = lessons.find((l) => !watchedLessonIds.has(l.id));
		setActiveLesson(nextLesson ?? lessons[0] ?? null);
	}, [course, lessonIdFromUrl, progressLoading, watchedLessonIds]);

	const toggleModule = (id: string) =>
		setCollapsedModules((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});

	if (isLoading) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0b1e] flex items-center justify-center">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (isError || !course) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0b1e] flex items-center justify-center">
				<div className="text-center">
					<PackageX className="w-12 h-12 text-red-400 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-gray-400">
						Curso não encontrado.
					</p>
				</div>
			</div>
		);
	}

	const sortedModules = course.modules
		.slice()
		.sort((a, b) => a.order - b.order)
		.map((mod) => ({
			...mod,
			lessons: mod.lessons.slice().sort((a, b) => a.order - b.order),
		}));

	const totalLessons = sortedModules.reduce(
		(acc, m) => acc + m.lessons.length,
		0,
	);

	const allLessons = sortedModules.flatMap((m) => m.lessons);

	const activeIdx = activeLesson
		? allLessons.findIndex((l) => l.id === activeLesson.id)
		: -1;
	const nextLesson =
		activeIdx >= 0 && activeIdx < allLessons.length - 1
			? allLessons[activeIdx + 1]
			: null;

	const filteredModules = sortedModules.map((mod) => ({
		...mod,
		lessons: search
			? mod.lessons.filter((l) =>
					l.title.toLowerCase().includes(search.toLowerCase()),
				)
			: mod.lessons,
	}));

	const myRating = ratingData?.myRating ?? 0;
	const averageRating = ratingData?.averageRating ?? 0;
	const totalRatings = ratingData?.totalRatings ?? 0;

	const handleSelectLesson = (lesson: CourseLesson) => {
		setActiveLesson(lesson);
		setHoverRating(0);
		setShowEndScreen(false);
	};

	const handleVideoEnded = () => {
		if (autoPlay) {
			handleEndScreenAdvance();
		} else {
			setShowEndScreen(true);
		}
	};

	const handleEndScreenAdvance = () => {
		if (!activeLesson) return;
		const lessonToMark = activeLesson.id;
		const next = nextLesson;
		// Sair do fullscreen imediatamente (permite avançar mesmo em tela inteira)
		if (document.fullscreenElement) {
			document.exitFullscreen().catch(() => {});
		}
		setShowEndScreen(false);
		if (next) handleSelectLesson(next);
		// Marcar como vista em background (não bloqueia o avanço)
		markWatched(lessonToMark).catch(() => {
			toast.error('Erro ao marcar aula como assistida. Tente novamente.');
		});
	};

	const handleMarkComplete = async () => {
		if (!activeLesson) return;
		try {
			await markWatched(activeLesson.id);
			toast.success('Aula marcada como concluída!');
		} catch {
			toast.error('Erro ao marcar aula como assistida. Tente novamente.');
		}
	};

	const handleEndScreenReplay = () => {
		setShowEndScreen(false);
	};

	const activeModule = activeLesson
		? sortedModules.find((m) => m.lessons.some((l) => l.id === activeLesson.id))
		: null;
	const watchedCount = watchedLessonIds.size;

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#06040f] text-slate-900 dark:text-white font-sans flex flex-col relative overflow-hidden">
			{/* Background gradients */}
			<div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-violet-500/5 via-transparent to-transparent pointer-events-none" />
			<div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-500/5 via-transparent to-transparent pointer-events-none" />

			{/* ── Header ──────────────────────────────────────────────────────── */}
			<header className="h-14 bg-white/80 dark:bg-[#08060f]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/6 flex items-center justify-between px-5 shrink-0 sticky top-0 z-20">
				<div className="flex items-center gap-4">
					<Link
						href="/course"
						className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm"
					>
						<ArrowLeft className="w-4 h-4" />
						Voltar
					</Link>
					<div className="w-px h-6 bg-slate-200 dark:bg-white/10" />
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
							<BookOpen className="w-4 h-4 text-white" />
						</div>
						<div>
							<p className="font-bold text-sm leading-tight text-slate-900 dark:text-white">
								{course.name}
							</p>
							<p className="text-slate-500 dark:text-slate-400 text-xs">
								{activeModule?.title ?? 'Sala de Aula'}
							</p>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => setSavedLessonsModalOpen(true)}
						className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm font-medium transition-colors group"
					>
						<div className="rounded-lg p-1 bg-linear-to-r from-orange-500 to-amber-500">
							<Bookmark className="w-4 h-4 text-white" />
						</div>
						<span>Aulas Salvas</span>
						<ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
					</button>
					<div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20">
						<Zap className="w-3.5 h-3.5 text-amber-500" />
						<span className="text-xs font-medium text-slate-700 dark:text-white">
							{watchedCount}/{totalLessons} aulas
						</span>
					</div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={toggleAutoPlay}
							title={
								autoPlay
									? 'Auto-play ativado: avança automaticamente'
									: 'Auto-play desativado: clique para avançar'
							}
							className={`p-2.5 rounded-xl border transition-colors ${
								autoPlay
									? 'bg-violet-100 dark:bg-violet-600/20 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400'
									: 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
							}`}
						>
							<Zap className="h-5 w-5" />
						</button>
						<ThemeToggle />
					</div>
				</div>
			</header>

			<SavedLessonsModal
				isOpen={savedLessonsModalOpen}
				onClose={() => setSavedLessonsModalOpen(false)}
			/>

			{/* ── Body ────────────────────────────────────────────────────────── */}
			<div className="flex flex-1 overflow-hidden">
				{/* ── Main (video + tabs) ──────────────────────────────────────── */}
				<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
					<main className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-[#06040f]">
						<VideoPlayer
							lesson={activeLesson}
							courseName={course.name}
							moduleLabel={
								activeModule ? `Módulo ${activeModule.order}` : undefined
							}
							onVideoEnded={handleVideoEnded}
							showEndScreen={showEndScreen}
							nextLessonTitle={nextLesson?.title ?? null}
							onEndScreenAdvance={handleEndScreenAdvance}
							onEndScreenReplay={handleEndScreenReplay}
							isSaved={
								!!activeLesson &&
								savedLessons.some((s) => s.lessonId === activeLesson.id)
							}
							onSave={
								activeLesson && isLoggedIn
									? () =>
											saveLessonMutation.mutate(activeLesson.id, {
												onSuccess: () =>
													toast.success('Aula guardada nas suas salvas'),
												onError: () => toast.error('Erro ao guardar aula'),
											})
									: undefined
							}
							onRemove={
								activeLesson && isLoggedIn
									? () =>
											removeSavedLessonMutation.mutate(activeLesson.id, {
												onSuccess: () =>
													toast.success('Aula removida das salvas'),
												onError: () => toast.error('Erro ao remover aula'),
											})
									: undefined
							}
							isSaveLoading={
								saveLessonMutation.isPending ||
								removeSavedLessonMutation.isPending
							}
						/>

						{/* Rating + tabs row */}
						<div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02]">
							<div className="flex gap-1 border-b border-slate-200 dark:border-white/10 -mb-[1px]">
								<button
									type="button"
									onClick={() => features?.chat && setBottomTab('duvidas')}
									className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all border-b-2 -mb-px ${
										!features?.chat
											? 'text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed border-transparent'
											: bottomTab === 'duvidas'
												? 'text-violet-600 dark:text-violet-400 border-violet-500 bg-transparent'
												: 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
									}`}
								>
									{features?.chat ? (
										<MessageSquare className="w-4 h-4" />
									) : (
										<Lock className="w-4 h-4" />
									)}
									Dúvidas
								</button>
								<button
									type="button"
									onClick={() => setBottomTab('materiais')}
									className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all border-b-2 -mb-px ${
										bottomTab === 'materiais'
											? 'text-violet-600 dark:text-violet-400 border-violet-500 bg-transparent'
											: 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
									}`}
								>
									<Paperclip className="w-4 h-4" />
									Materiais
								</button>
								<button
									type="button"
									onClick={() => setBottomTab('quiz')}
									className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all border-b-2 -mb-px ${
										bottomTab === 'quiz'
											? 'text-violet-600 dark:text-violet-400 border-violet-500 bg-transparent'
											: 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
									}`}
								>
									<ClipboardList className="w-4 h-4" />
									Quiz
								</button>
							</div>

							<div className="flex items-center gap-4 flex-wrap">
								{activeLesson && features?.chat && (
									<div className="flex items-center gap-3">
										<div className="flex items-center gap-2">
											<span className="text-slate-500 dark:text-slate-400 text-xs">
												Avalie:
											</span>
											<div className="flex gap-0.5">
												{[1, 2, 3, 4, 5].map((star) => (
													<button
														key={star}
														type="button"
														onClick={() => submitRating.mutate(star)}
														onMouseEnter={() => setHoverRating(star)}
														onMouseLeave={() => setHoverRating(0)}
														disabled={submitRating.isPending}
													>
														<Star
															className={`w-5 h-5 transition-colors ${
																(hoverRating || myRating) >= star
																	? 'text-amber-400 fill-amber-400 dark:text-amber-400 dark:fill-amber-400'
																	: 'text-slate-300 dark:text-slate-600'
															}`}
														/>
													</button>
												))}
											</div>
										</div>
										{totalRatings > 0 && (
											<p className="text-slate-500 dark:text-slate-400 text-xs">
												{averageRating.toFixed(1)} ({totalRatings})
											</p>
										)}
									</div>
								)}
								{activeLesson && !watchedLessonIds.has(activeLesson.id) && (
									<button
										type="button"
										onClick={handleMarkComplete}
										className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white shadow-lg shadow-violet-500/20 transition-all"
									>
										<Check className="w-4 h-4" />
										Marcar como concluída
									</button>
								)}
							</div>
						</div>

						{/* Tab content */}
						<div className="px-6 py-6">
							<div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-sm overflow-hidden min-h-[280px]">
								<div className="p-6">
									{bottomTab === 'duvidas' &&
										(!features?.chat ? (
											<div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-500">
												<Lock className="w-12 h-12 mb-4" />
												<p className="text-sm font-medium">
													{upgradeTiers?.chat
														? `Dúvidas disponível no plano ${upgradeTiers.chat}`
														: 'Dúvidas disponível no plano Ouro ou Platina'}
												</p>
												<p className="text-xs mt-1">
													Faça upgrade para enviar dúvidas sobre as aulas.
												</p>
												<Link
													href="/store"
													className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
												>
													Ver planos
												</Link>
											</div>
										) : (
											<DoubtsTab
												lessonId={activeLesson?.id ?? null}
												hasAccess={!!features?.chat}
											/>
										))}

									{bottomTab === 'materiais' && (
										<MaterialsTab lessonId={activeLesson?.id ?? null} />
									)}

									{bottomTab === 'quiz' && (
										<QuizTab lessonId={activeLesson?.id ?? null} />
									)}
								</div>
							</div>
						</div>
					</main>
				</div>

				{/* ── Sidebar ─────────────────────────────────────────────────── */}
				<aside className="w-72 xl:w-[380px] border-l border-slate-200 dark:border-white/6 bg-white/80 dark:bg-[#0a0818]/95 backdrop-blur-sm flex flex-col shrink-0 overflow-hidden">
					{/* Next lesson banner */}
					{nextLesson && (
						<div className="p-4 border-b border-slate-200 dark:border-white/10 bg-gradient-to-r from-violet-600/10 to-cyan-500/10 shrink-0">
							<button
								type="button"
								onClick={() => handleSelectLesson(nextLesson)}
								className="w-full p-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-3 text-left"
							>
								<div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
									<Play className="w-6 h-6 fill-current" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-white/80 text-xs font-medium">
										Próxima aula
									</p>
									<p className="font-semibold truncate">{nextLesson.title}</p>
								</div>
								<ChevronRight className="w-5 h-5 text-white/80 shrink-0" />
							</button>
						</div>
					)}

					{/* Search */}
					<div className="px-4 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<input
								type="text"
								placeholder="Buscar aula..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="w-full bg-slate-50 dark:bg-white/4 border border-slate-200 dark:border-white/[0.07] rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>
					</div>

					{/* Module + lesson list */}
					<div className="flex-1 overflow-y-auto">
						{filteredModules.map((mod) => {
							const isCollapsed = collapsedModules.has(mod.id);
							return (
								<div key={mod.id}>
									{/* Module header */}
									<button
										type="button"
										onClick={() => toggleModule(mod.id)}
										className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600/10 to-cyan-500/10 dark:from-violet-600/20 dark:to-cyan-500/20 border-b border-slate-200 dark:border-white/6 hover:from-violet-600/15 hover:to-cyan-500/15 transition-colors"
									>
										<div className="flex items-center gap-2 min-w-0">
											<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-lg">
												{mod.order}
											</div>
											<span className="font-semibold text-sm truncate text-slate-900 dark:text-white">
												{mod.title}
											</span>
										</div>
										<div className="flex items-center gap-2 shrink-0 ml-2">
											<span className="text-[10px] bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40 rounded-full px-2 py-0.5 font-semibold whitespace-nowrap">
												{mod.lessons.length} aula
												{mod.lessons.length !== 1 ? 's' : ''}
											</span>
											<ChevronDown
												className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
											/>
										</div>
									</button>

									{/* Lessons */}
									{!isCollapsed &&
										mod.lessons.map((lesson) => {
											const isActive = activeLesson?.id === lesson.id;
											const isWatched = watchedLessonIds.has(lesson.id);
											return (
												<button
													key={lesson.id}
													type="button"
													onClick={() => handleSelectLesson(lesson)}
													className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-100 dark:border-white/5 transition-all relative ${
														isActive
															? 'bg-violet-50 dark:bg-white/10'
															: 'hover:bg-slate-50 dark:hover:bg-white/5'
													}`}
												>
													{isActive && (
														<div className="absolute left-0 top-0 bottom-0 w-0.5 bg-violet-400 rounded-r" />
													)}

													<div className="shrink-0">
														{isActive ? (
															<div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center">
																<Play className="w-3 h-3 fill-current text-white" />
															</div>
														) : isWatched ? (
															<div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-600/20 flex items-center justify-center">
																<Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
															</div>
														) : lesson.isFree ? (
															<div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-600/20 flex items-center justify-center">
																<Play className="w-3 h-3 text-emerald-600 dark:text-emerald-400 fill-current" />
															</div>
														) : (
															<div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center">
																<LockKeyhole className="w-3 h-3 text-slate-500" />
															</div>
														)}
													</div>

													<div className="flex-1 min-w-0">
														<p
															className={`text-sm truncate font-medium leading-tight ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
														>
															{lesson.title}
														</p>
													</div>

													{lesson.isFree && !isActive && (
														<span className="shrink-0 text-xs px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded">
															Grátis
														</span>
													)}
													{isActive && (
														<ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
													)}
												</button>
											);
										})}
								</div>
							);
						})}
					</div>
				</aside>
			</div>
		</div>
	);
}
