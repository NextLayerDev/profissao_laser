'use client';

import {
	ArrowLeft,
	BookOpen,
	ChevronDown,
	ChevronRight,
	Clock,
	FileText,
	Loader2,
	Lock,
	MessageSquare,
	PackageX,
	Paperclip,
	Play,
	Search,
	Send,
	Star,
	Trophy,
	Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { VideoPlayer } from '@/components/course/video-player';
import { useCourse } from '@/hooks/use-course';
import type { CourseLesson } from '@/types/course';
import { formatDuration } from '@/utils/video';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CourseSlugPage() {
	const { slug } = useParams<{ slug: string }>();
	const { data: course, isLoading, isError } = useCourse(slug);
	const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
	const [search, setSearch] = useState('');
	const [rating, setRating] = useState(0);
	const [hoverRating, setHoverRating] = useState(0);
	const [bottomTab, setBottomTab] = useState<'duvidas' | 'materiais'>(
		'duvidas',
	);
	const [question, setQuestion] = useState('');
	const [collapsedModules, setCollapsedModules] = useState<Set<string>>(
		new Set(),
	);

	const toggleModule = (id: string) =>
		setCollapsedModules((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});

	if (isLoading) {
		return (
			<div className="min-h-screen bg-[#0d0b1e] flex items-center justify-center">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (isError || !course) {
		return (
			<div className="min-h-screen bg-[#0d0b1e] flex items-center justify-center">
				<div className="text-center">
					<PackageX className="w-12 h-12 text-red-400 mx-auto mb-4" />
					<p className="text-gray-400">Curso não encontrado.</p>
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

	// Next lesson after the active one
	const allLessons = sortedModules.flatMap((m) => m.lessons);
	const activeIdx = activeLesson
		? allLessons.findIndex((l) => l.id === activeLesson.id)
		: -1;
	const nextLesson =
		activeIdx >= 0 && activeIdx < allLessons.length - 1
			? allLessons[activeIdx + 1]
			: null;

	// Search filter
	const filteredModules = sortedModules.map((mod) => ({
		...mod,
		lessons: search
			? mod.lessons.filter((l) =>
					l.title.toLowerCase().includes(search.toLowerCase()),
				)
			: mod.lessons,
	}));

	const handleSelectLesson = (lesson: CourseLesson) => {
		setActiveLesson(lesson);
		setRating(0);
		setHoverRating(0);
	};

	return (
		<div className="min-h-screen bg-[#06040f] text-white font-sans flex flex-col">
			{/* ── Header ──────────────────────────────────────────────────────── */}
			<header className="h-14 bg-[#08060f] border-b border-white/6 flex items-center justify-between px-5 shrink-0">
				<div className="flex items-center gap-4">
					<Link
						href="/course"
						className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
					>
						<ArrowLeft className="w-4 h-4" />
						Voltar
					</Link>

					<div className="flex items-center gap-2">
						<div className="bg-linear-to-br from-violet-600 to-purple-700 rounded-lg p-1.5">
							<BookOpen className="w-5 h-5 text-white" />
						</div>
						<div>
							<p className="font-bold text-sm leading-tight">{course.name}</p>
							<p className="text-slate-400 text-xs">
								{course.modules.length} módulo
								{course.modules.length !== 1 ? 's' : ''} · {totalLessons} aula
								{totalLessons !== 1 ? 's' : ''}
							</p>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold">
					<Zap className="w-4 h-4 text-violet-400" />
					{totalLessons} aulas
				</div>
			</header>

			{/* ── Body ────────────────────────────────────────────────────────── */}
			<div className="flex flex-1 overflow-hidden">
				{/* ── Main (video + info) ─────────────────────────────────────── */}
				<main className="flex-1 flex flex-col overflow-y-auto bg-[#06040f]">
					<VideoPlayer lesson={activeLesson} courseName={course.name} />

					{/* Rating + tabs row */}
					<div className="px-6 py-3 flex items-center justify-between border-b border-white/10">
						{/* Tabs */}
						<div className="flex gap-1">
							<button
								type="button"
								onClick={() => setBottomTab('duvidas')}
								className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
									bottomTab === 'duvidas'
										? 'bg-violet-600/20 text-violet-300'
										: 'text-slate-400 hover:text-white hover:bg-white/5'
								}`}
							>
								<MessageSquare className="w-4 h-4" />
								Dúvidas
							</button>
							<button
								type="button"
								onClick={() => setBottomTab('materiais')}
								className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
									bottomTab === 'materiais'
										? 'bg-violet-600/20 text-violet-300'
										: 'text-slate-400 hover:text-white hover:bg-white/5'
								}`}
							>
								<Paperclip className="w-4 h-4" />
								Materiais
							</button>
						</div>

						{/* Rating */}
						{activeLesson && (
							<div className="flex items-center gap-2">
								<p className="text-slate-500 text-xs">Avalie:</p>
								<div className="flex gap-0.5">
									{[1, 2, 3, 4, 5].map((star) => (
										<button
											key={star}
											type="button"
											onClick={() => setRating(star)}
											onMouseEnter={() => setHoverRating(star)}
											onMouseLeave={() => setHoverRating(0)}
										>
											<Star
												className={`w-4 h-4 transition-colors ${
													(hoverRating || rating) >= star
														? 'text-yellow-400 fill-yellow-400'
														: 'text-slate-600'
												}`}
											/>
										</button>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Tab content */}
					<div className="px-6 py-6">
						{/* ── Dúvidas ── */}
						{bottomTab === 'duvidas' && (
							<div className="space-y-5">
								<div className="flex flex-col gap-2">
									<label
										htmlFor="question-textarea"
										className="text-sm font-medium text-slate-300"
									>
										Envie sua dúvida sobre esta aula
									</label>
									<textarea
										id="question-textarea"
										value={question}
										onChange={(e) => setQuestion(e.target.value)}
										placeholder="Escreva sua dúvida aqui..."
										rows={3}
										className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/60 transition-colors resize-none"
									/>
									<div className="flex justify-end">
										<button
											type="button"
											disabled={!question.trim()}
											onClick={() => setQuestion('')}
											className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
										>
											<Send className="w-4 h-4" />
											Enviar dúvida
										</button>
									</div>
								</div>

								{/* Empty state */}
								<div className="flex flex-col items-center justify-center py-10 text-slate-600">
									<MessageSquare className="w-8 h-8 mb-3" />
									<p className="text-sm">Nenhuma dúvida enviada ainda.</p>
									<p className="text-xs mt-1">Seja o primeiro a perguntar!</p>
								</div>
							</div>
						)}

						{/* ── Materiais ── */}
						{bottomTab === 'materiais' && (
							<div className="space-y-3">
								{/* Empty state */}
								<div className="flex flex-col items-center justify-center py-10 text-slate-600">
									<FileText className="w-8 h-8 mb-3" />
									<p className="text-sm">
										Nenhum material disponível para esta aula.
									</p>
								</div>
							</div>
						)}
					</div>
				</main>

				{/* ── Sidebar ─────────────────────────────────────────────────── */}
				<aside className="w-75 border-l border-white/6 bg-[#0a0818] flex flex-col shrink-0 overflow-hidden">
					{/* Next lesson banner */}
					{nextLesson && (
						<button
							type="button"
							onClick={() => handleSelectLesson(nextLesson)}
							className="bg-linear-to-r from-violet-600 to-cyan-500 p-4 flex items-center gap-3 hover:brightness-110 transition-all w-full text-left shrink-0"
						>
							<div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center shrink-0">
								<Play className="w-5 h-5 fill-current" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-white/70 text-[10px] font-semibold uppercase tracking-wider">
									Próxima aula
								</p>
								<p className="text-white font-bold text-sm truncate">
									{nextLesson.title}
								</p>
								{nextLesson.duration && (
									<p className="text-white/70 text-xs">
										{formatDuration(nextLesson.duration)}
									</p>
								)}
							</div>
							<ChevronRight className="w-4 h-4 text-white/70 shrink-0" />
						</button>
					)}

					{/* Search */}
					<div className="px-4 py-3 border-b border-white/10 shrink-0">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<input
								type="text"
								placeholder="Buscar aula..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="w-full bg-white/4 border border-white/[0.07] rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
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
										className="w-full flex items-center justify-between px-4 py-3 bg-white/4 border-b border-white/6 hover:bg-white/[0.07] transition-colors"
									>
										<div className="flex items-center gap-2 min-w-0">
											<div className="w-6 h-6 bg-linear-to-br from-violet-600 to-purple-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
												{mod.order}
											</div>
											<span className="font-semibold text-sm truncate">
												{mod.title}
											</span>
										</div>
										<div className="flex items-center gap-2 shrink-0 ml-2">
											<span className="text-[10px] bg-violet-500/20 text-violet-400 border border-violet-800/40 rounded-full px-2 py-0.5 font-semibold whitespace-nowrap">
												{mod.lessons.length} aula
												{mod.lessons.length !== 1 ? 's' : ''}
											</span>
											<ChevronDown
												className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
											/>
										</div>
									</button>

									{/* Lessons + Quiz (collapsible) */}
									{!isCollapsed && (
										<>
											{mod.lessons.map((lesson) => {
												const isActive = activeLesson?.id === lesson.id;
												return (
													<button
														key={lesson.id}
														type="button"
														onClick={() => handleSelectLesson(lesson)}
														className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-white/5 transition-all relative ${
															isActive ? 'bg-white/10' : 'hover:bg-white/5'
														}`}
													>
														{isActive && (
															<div className="absolute left-0 top-0 bottom-0 w-0.5 bg-violet-400 rounded-r" />
														)}

														<div className="shrink-0">
															{isActive ? (
																<div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center">
																	<Play className="w-3 h-3 fill-current" />
																</div>
															) : lesson.isFree ? (
																<div className="w-7 h-7 rounded-full bg-emerald-600/20 flex items-center justify-center">
																	<Play className="w-3 h-3 text-emerald-400 fill-current" />
																</div>
															) : (
																<div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
																	<Lock className="w-3 h-3 text-slate-500" />
																</div>
															)}
														</div>

														<div className="flex-1 min-w-0">
															<p
																className={`text-sm truncate font-medium leading-tight ${
																	isActive ? 'text-white' : 'text-slate-300'
																}`}
															>
																{lesson.title}
															</p>
															{lesson.duration && (
																<div className="flex items-center gap-1 mt-0.5 text-slate-500 text-xs">
																	<Clock className="w-3 h-3" />
																	<span>{formatDuration(lesson.duration)}</span>
																</div>
															)}
														</div>

														{lesson.isFree && !isActive && (
															<span className="shrink-0 text-xs px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">
																Grátis
															</span>
														)}
														{isActive && (
															<ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
														)}
													</button>
												);
											})}

											{/* Quiz button */}
											<div className="px-3 py-3 border-b border-white/6">
												<button
													type="button"
													className="w-full flex items-center justify-center gap-2 bg-violet-950/60 hover:bg-violet-900/60 border border-violet-800/40 hover:border-violet-700/50 text-violet-300 hover:text-violet-200 font-semibold py-2.5 rounded-xl text-sm transition-all"
												>
													<Trophy className="w-4 h-4" />
													Quiz do Módulo {mod.order}
												</button>
											</div>
										</>
									)}
								</div>
							);
						})}
					</div>
				</aside>
			</div>
		</div>
	);
}
