'use client';

import {
	ArrowLeft,
	ChevronDown,
	ChevronRight,
	Clock,
	Loader2,
	Lock,
	PackageX,
	Play,
	PlayCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useCourse } from '@/hooks/use-course';
import type { CourseLesson, CourseModule } from '@/types/course';

function formatDuration(seconds: number | null): string {
	if (!seconds) return '';
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}

function getEmbedUrl(url: string): string | null {
	const yt = url.match(
		/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
	);
	if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`;

	const vimeo = url.match(/vimeo\.com\/(\d+)/);
	if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;

	return null;
}

// ─── Video Player ─────────────────────────────────────────────────────────────

function VideoPlayer({
	lesson,
	courseName,
}: {
	lesson: CourseLesson | null;
	courseName: string;
}) {
	if (!lesson) {
		return (
			<div className="aspect-video bg-[#0d0d0f] flex flex-col items-center justify-center gap-4 rounded-xl border border-gray-800">
				<PlayCircle className="w-16 h-16 text-gray-700" />
				<p className="text-gray-500 text-sm">Selecione uma aula para começar</p>
			</div>
		);
	}

	const { videoUrl, title, description, duration } = lesson;

	const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;

	return (
		<div className="space-y-4">
			<div className="aspect-video bg-black rounded-xl overflow-hidden border border-gray-800">
				{embedUrl ? (
					<iframe
						src={embedUrl}
						title={title}
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
						className="w-full h-full"
					/>
				) : videoUrl ? (
					// biome-ignore lint/a11y/useMediaCaption: captions not available
					<video
						key={videoUrl}
						src={videoUrl}
						controls
						autoPlay
						className="w-full h-full"
					/>
				) : (
					<div className="w-full h-full flex flex-col items-center justify-center gap-3">
						<Lock className="w-10 h-10 text-gray-600" />
						<p className="text-gray-500 text-sm">Vídeo não disponível</p>
					</div>
				)}
			</div>

			<div>
				<h2 className="text-xl font-bold text-white">{title}</h2>
				<div className="flex items-center gap-3 mt-1">
					<span className="text-sm text-gray-500">{courseName}</span>
					{duration && (
						<span className="flex items-center gap-1 text-xs text-gray-600">
							<Clock className="w-3 h-3" />
							{formatDuration(duration)}
						</span>
					)}
				</div>
				{description && (
					<p className="text-sm text-gray-400 mt-3 leading-relaxed">
						{description}
					</p>
				)}
			</div>
		</div>
	);
}

// ─── Lesson Item ──────────────────────────────────────────────────────────────

function LessonItem({
	lesson,
	isActive,
	onClick,
}: {
	lesson: CourseLesson;
	isActive: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
				isActive
					? 'bg-violet-600/20 text-white'
					: 'hover:bg-gray-800/50 text-gray-400 hover:text-white'
			}`}
		>
			<div
				className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
					isActive ? 'bg-violet-600' : 'bg-gray-800'
				}`}
			>
				{lesson.isFree || isActive ? (
					<Play className="w-3 h-3 fill-current" />
				) : (
					<Lock className="w-3 h-3" />
				)}
			</div>

			<div className="flex-1 min-w-0">
				<p
					className={`text-sm font-medium truncate ${isActive ? 'text-white' : ''}`}
				>
					{lesson.title}
				</p>
				{lesson.duration && (
					<p className="text-xs text-gray-600 mt-0.5">
						{formatDuration(lesson.duration)}
					</p>
				)}
			</div>

			{lesson.isFree && !isActive && (
				<span className="shrink-0 text-xs px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">
					Grátis
				</span>
			)}
		</button>
	);
}

// ─── Module Accordion ─────────────────────────────────────────────────────────

function ModuleAccordion({
	mod,
	activeLesson,
	onSelectLesson,
}: {
	mod: CourseModule;
	activeLesson: CourseLesson | null;
	onSelectLesson: (lesson: CourseLesson) => void;
}) {
	const hasActive = mod.lessons.some((l) => l.id === activeLesson?.id);
	const [open, setOpen] = useState(hasActive);

	return (
		<div className="border-b border-gray-800 last:border-0">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-800/30 transition-colors"
			>
				{open ? (
					<ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
				) : (
					<ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
				)}
				<div className="flex-1 min-w-0">
					<p className="font-semibold text-white text-sm">{mod.title}</p>
					<p className="text-xs text-gray-500 mt-0.5">
						{mod.lessons.length} aula{mod.lessons.length !== 1 ? 's' : ''}
					</p>
				</div>
			</button>

			{open && (
				<div className="pb-2">
					{mod.lessons.map((lesson) => (
						<LessonItem
							key={lesson.id}
							lesson={lesson}
							isActive={activeLesson?.id === lesson.id}
							onClick={() => onSelectLesson(lesson)}
						/>
					))}
				</div>
			)}
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CourseSlugPage() {
	const { slug } = useParams<{ slug: string }>();
	const { data: course, isLoading, isError } = useCourse(slug);
	const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (isError || !course) {
		return (
			<div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
				<div className="text-center">
					<PackageX className="w-12 h-12 text-red-400 mx-auto mb-4" />
					<p className="text-gray-400">Curso não encontrado.</p>
				</div>
			</div>
		);
	}

	const totalLessons = course.modules.reduce(
		(acc, m) => acc + m.lessons.length,
		0,
	);

	return (
		<div className="min-h-screen bg-[#0d0d0f] text-white font-sans flex flex-col">
			{/* Header */}
			<header className="bg-[#1a1a1d] border-b border-gray-800 px-6 py-4 shrink-0">
				<div className="flex items-center gap-4">
					<Link
						href="/course"
						className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors shrink-0"
						title="Meus cursos"
					>
						<ArrowLeft className="w-5 h-5" />
					</Link>
					<div>
						<h1 className="font-bold text-lg">{course.name}</h1>
						<p className="text-xs text-gray-500 mt-0.5">
							{course.modules.length} módulo
							{course.modules.length !== 1 ? 's' : ''} · {totalLessons} aula
							{totalLessons !== 1 ? 's' : ''}
						</p>
					</div>
				</div>
			</header>

			{/* Body */}
			<div className="flex flex-1 overflow-hidden">
				{/* Left — Video */}
				<div className="flex-1 overflow-y-auto p-6">
					<VideoPlayer lesson={activeLesson} courseName={course.name} />
				</div>

				{/* Right — Modules & Lessons */}
				<aside className="w-80 shrink-0 bg-[#131315] border-l border-gray-800 overflow-y-auto">
					<div className="px-4 py-4 border-b border-gray-800">
						<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
							Conteúdo do curso
						</p>
					</div>

					<div>
						{course.modules
							.slice()
							.sort((a, b) => a.order - b.order)
							.map((mod) => (
								<ModuleAccordion
									key={mod.id}
									mod={{
										...mod,
										lessons: mod.lessons
											.slice()
											.sort((a, b) => a.order - b.order),
									}}
									activeLesson={activeLesson}
									onSelectLesson={setActiveLesson}
								/>
							))}
					</div>
				</aside>
			</div>
		</div>
	);
}
