import { Bookmark, Clock, Lock, PlayCircle } from 'lucide-react';
import type { CourseLesson } from '@/types/course';
import { formatDuration, getEmbedUrl } from '@/utils/video';

interface VideoPlayerProps {
	lesson: CourseLesson | null;
	courseName: string;
	isSaved?: boolean;
	onSave?: () => void;
	onRemove?: () => void;
	isSaveLoading?: boolean;
}

export function VideoPlayer({
	lesson,
	courseName,
	isSaved = false,
	onSave,
	onRemove,
	isSaveLoading = false,
}: VideoPlayerProps) {
	if (!lesson) {
		return (
			<div className="px-6 pt-6">
				<div className="relative bg-[#06040f] flex flex-col items-center justify-center gap-3 text-slate-600 rounded-2xl overflow-hidden border border-white/5 w-full aspect-video">
					<PlayCircle className="w-16 h-16" />
					<p className="text-sm">Selecione uma aula para começar</p>
				</div>
			</div>
		);
	}

	const { videoUrl, title, description, duration } = lesson;
	const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;

	return (
		<>
			<div className="px-6 pt-6">
				<div className="relative bg-black rounded-2xl overflow-hidden border border-white/5 w-full aspect-video">
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
						<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500">
							<Lock className="w-10 h-10" />
							<p className="text-sm">Vídeo não disponível</p>
						</div>
					)}

					{/* Bottom bar */}
					<div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent px-4 py-3 flex items-center gap-3">
						{duration && (
							<span className="flex items-center gap-1 bg-white/10 border border-white/20 rounded-full px-3 py-0.5 text-xs text-slate-300">
								<Clock className="w-3 h-3" />
								{formatDuration(duration)}
							</span>
						)}
						<span className="bg-white/10 border border-white/20 rounded-full px-3 py-0.5 text-xs text-slate-300 truncate">
							{courseName}
						</span>
					</div>
				</div>
			</div>

			{/* Lesson info */}
			<div className="px-6 py-5 border-b border-white/10">
				<div className="flex items-start justify-between gap-4">
					<h1 className="text-2xl font-black flex-1 min-w-0">{title}</h1>
					{onSave != null && onRemove != null && (
						<button
							type="button"
							onClick={isSaved ? onRemove : onSave}
							disabled={isSaveLoading}
							className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-all disabled:opacity-50 ${
								isSaved
									? 'bg-linear-to-r from-orange-500 to-amber-500 text-white'
									: 'bg-white/10 hover:bg-white/15 text-slate-400 hover:text-amber-400 border border-white/10'
							}`}
							title={isSaved ? 'Remover das salvas' : 'Salvar aula'}
						>
							{isSaveLoading ? (
								<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							) : (
								<Bookmark
									className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`}
								/>
							)}
						</button>
					)}
				</div>
				{description && (
					<p className="text-slate-400 text-sm mt-2 leading-relaxed">
						{description}
					</p>
				)}
			</div>
		</>
	);
}
