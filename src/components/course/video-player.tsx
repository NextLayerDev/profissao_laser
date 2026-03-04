'use client';

import { Loader2, Lock, PlayCircle } from 'lucide-react';
import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CourseLesson } from '@/types/course';
import {
	formatDuration,
	getEmbedUrl,
	getVideoType,
	getYoutubeVideoId,
} from '@/utils/video';

declare global {
	interface Window {
		YT?: {
			Player: new (
				elementId: string | HTMLElement,
				options: {
					videoId: string;
					playerVars?: { autoplay?: number; enablejsapi?: number };
					events?: { onStateChange?: (e: { data: number }) => void };
				},
			) => { destroy: () => void };
			PlayerState?: { ENDED: number };
			ready?: (fn: () => void) => void;
		};
		onYouTubeIframeAPIReady?: () => void;
		Vimeo?: {
			Player: new (
				iframe: HTMLIFrameElement,
			) => {
				on: (event: string, fn: () => void) => void;
				destroy: () => void;
			};
		};
	}
}

interface VideoPlayerProps {
	lesson: CourseLesson | null;
	courseName: string;
	onVideoEnded?: () => void;
}

export function VideoPlayer({
	lesson,
	courseName,
	onVideoEnded,
}: VideoPlayerProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [realDuration, setRealDuration] = useState<number | null>(null);
	const [vimeoReady, setVimeoReady] = useState(false);
	const youtubeContainerRef = useRef<HTMLDivElement>(null);
	const vimeoIframeRef = useRef<HTMLIFrameElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const ytPlayerRef = useRef<InstanceType<
		NonNullable<Window['YT']>['Player']
	> | null>(null);
	const vimeoPlayerRef = useRef<InstanceType<
		NonNullable<Window['Vimeo']>['Player']
	> | null>(null);

	const handleEnded = useCallback(() => {
		onVideoEnded?.();
	}, [onVideoEnded]);

	// Cleanup players on lesson change
	useEffect(() => {
		return () => {
			ytPlayerRef.current?.destroy?.();
			ytPlayerRef.current = null;
			vimeoPlayerRef.current?.destroy?.();
			vimeoPlayerRef.current = null;
			setIsLoading(true);
			setRealDuration(null);
		};
	}, []);

	// YouTube: init player when API is ready
	useEffect(() => {
		if (!lesson?.videoUrl || getVideoType(lesson.videoUrl) !== 'youtube')
			return;

		const videoId = getYoutubeVideoId(lesson.videoUrl);
		if (!videoId || !youtubeContainerRef.current) return;

		const initYoutube = () => {
			if (!window.YT?.Player || !youtubeContainerRef.current) return;
			ytPlayerRef.current = new window.YT.Player(youtubeContainerRef.current, {
				videoId,
				playerVars: { autoplay: 1, enablejsapi: 1 },
				events: {
					onStateChange: (e: { data: number }) => {
						if (e.data === window.YT?.PlayerState?.ENDED) {
							handleEnded();
						}
					},
				},
			});
			setIsLoading(false);
		};

		if (window.YT?.Player) {
			initYoutube();
		} else {
			window.onYouTubeIframeAPIReady = initYoutube;
		}

		return () => {
			window.onYouTubeIframeAPIReady = undefined;
		};
	}, [lesson?.videoUrl, handleEnded]);

	// Vimeo: init player when SDK is ready
	useEffect(() => {
		if (
			!lesson?.videoUrl ||
			getVideoType(lesson.videoUrl) !== 'vimeo' ||
			!vimeoReady
		)
			return;

		const iframe = vimeoIframeRef.current;
		if (!iframe || !window.Vimeo?.Player) return;

		const player = new window.Vimeo.Player(iframe);
		vimeoPlayerRef.current = player;
		player.on('ended', handleEnded);
		player.on('loaded', () => setIsLoading(false));

		return () => {
			player.destroy();
			vimeoPlayerRef.current = null;
		};
	}, [lesson?.videoUrl, handleEnded, vimeoReady]);

	if (!lesson) {
		return (
			<div className="px-6 pt-6">
				<div className="relative bg-slate-100 dark:bg-[#06040f] flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-600 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 w-full aspect-video">
					<PlayCircle className="w-16 h-16" />
					<p className="text-sm">Selecione uma aula para começar</p>
				</div>
			</div>
		);
	}

	const { videoUrl, title, description, duration } = lesson;
	const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;
	const videoType = videoUrl ? getVideoType(videoUrl) : null;

	const displayDuration = realDuration ?? duration;

	return (
		<>
			<Script src="https://www.youtube.com/iframe_api" strategy="lazyOnload" />
			<Script
				src="https://player.vimeo.com/api/player.js"
				strategy="lazyOnload"
				onLoad={() => setVimeoReady(true)}
			/>

			<div className="px-6 pt-6">
				<div className="relative bg-black rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 w-full aspect-video">
					{videoType === 'youtube' ? (
						<div ref={youtubeContainerRef} className="w-full h-full" />
					) : embedUrl ? (
						<iframe
							ref={vimeoIframeRef}
							src={embedUrl}
							title={title}
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowFullScreen
							className="w-full h-full"
						/>
					) : videoUrl ? (
						<>
							{/* biome-ignore lint/a11y/useMediaCaption: captions not available */}
							<video
								ref={videoRef}
								key={videoUrl}
								src={videoUrl}
								controls
								autoPlay
								className="w-full h-full"
								onEnded={handleEnded}
								onLoadedMetadata={(e) => {
									const d = (e.target as HTMLVideoElement).duration;
									if (Number.isFinite(d)) setRealDuration(Math.round(d));
								}}
								onCanPlay={() => setIsLoading(false)}
							/>
						</>
					) : (
						<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-500">
							<Lock className="w-10 h-10" />
							<p className="text-sm">Vídeo não disponível</p>
						</div>
					)}

					{isLoading && videoType !== null && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/60">
							<Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
						</div>
					)}

					{/* Bottom bar - pointer-events-none so video controls (progress bar, etc.) remain clickable */}
					<div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent px-4 py-3 flex items-center gap-3 pointer-events-none">
						{((videoType === 'native' && realDuration != null) ||
							(videoType !== 'native' &&
								videoType !== null &&
								(duration ?? 0) > 60)) && (
							<span className="flex items-center gap-1 bg-white/20 dark:bg-white/10 border border-white/30 dark:border-white/20 rounded-full px-3 py-0.5 text-xs text-white truncate">
								{formatDuration(displayDuration ?? 0)}
							</span>
						)}
						<span className="bg-white/20 dark:bg-white/10 border border-white/30 dark:border-white/20 rounded-full px-3 py-0.5 text-xs text-white truncate">
							{courseName}
						</span>
					</div>
				</div>
			</div>

			{/* Lesson info */}
			<div className="px-6 py-5 border-b border-slate-200 dark:border-white/10">
				<h1 className="text-2xl font-black text-slate-900 dark:text-white">
					{title}
				</h1>
				{description && (
					<p className="text-slate-600 dark:text-slate-400 text-sm mt-2 leading-relaxed">
						{description}
					</p>
				)}
			</div>
		</>
	);
}
