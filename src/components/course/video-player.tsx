'use client';

import {
	CheckCircle,
	ChevronRight,
	Loader2,
	Lock,
	Maximize,
	Pause,
	Play,
	PlayCircle,
	RotateCcw,
	SkipBack,
	SkipForward,
	Trophy,
	Volume2,
	VolumeX,
} from 'lucide-react';
import Script from 'next/script';
import {
	type MouseEvent as ReactMouseEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
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
	moduleLabel?: string;
	onVideoEnded?: () => void;
	showEndScreen?: boolean;
	nextLessonTitle?: string | null;
	onEndScreenAdvance?: () => void;
	onEndScreenReplay?: () => void;
}

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function VideoPlayer({
	lesson,
	courseName,
	moduleLabel,
	onVideoEnded,
	showEndScreen = false,
	nextLessonTitle = null,
	onEndScreenAdvance,
	onEndScreenReplay,
}: VideoPlayerProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [realDuration, setRealDuration] = useState<number | null>(null);
	const [vimeoReady, setVimeoReady] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(0.7);
	const [isMuted, setIsMuted] = useState(false);
	const [playbackRate, setPlaybackRate] = useState(1);
	const [showSpeedMenu, setShowSpeedMenu] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [dragProgress, setDragProgress] = useState(0);
	const [controlsVisible, setControlsVisible] = useState(false);

	const youtubeContainerRef = useRef<HTMLDivElement>(null);
	const vimeoIframeRef = useRef<HTMLIFrameElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const progressRef = useRef<HTMLDivElement>(null);
	const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
			if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
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

	// Native video: time update, metadata (re-run when video element changes via key)
	useEffect(() => {
		if (!lesson?.videoUrl) return;
		const v = videoRef.current;
		if (!v) return;
		const onTimeUpdate = () => setCurrentTime(v.currentTime);
		const onLoadedMetadata = () => setDuration(v.duration);
		v.addEventListener('timeupdate', onTimeUpdate);
		v.addEventListener('loadedmetadata', onLoadedMetadata);
		return () => {
			v.removeEventListener('timeupdate', onTimeUpdate);
			v.removeEventListener('loadedmetadata', onLoadedMetadata);
		};
	}, [lesson?.videoUrl]);

	// Native video: volume and mute sync
	useEffect(() => {
		const v = videoRef.current;
		if (v) {
			v.volume = volume;
			v.muted = isMuted;
		}
	}, [volume, isMuted]);

	// Mouse move for progress drag
	useEffect(() => {
		const handleMouseMove = (e: globalThis.MouseEvent) => {
			if (isDragging && progressRef.current) {
				const rect = progressRef.current.getBoundingClientRect();
				const pct = Math.max(
					0,
					Math.min(1, (e.clientX - rect.left) / rect.width),
				);
				setDragProgress(pct * 100);
			}
		};
		const handleMouseUp = (e: globalThis.MouseEvent) => {
			if (isDragging && videoRef.current && progressRef.current) {
				const rect = progressRef.current.getBoundingClientRect();
				const pct = Math.max(
					0,
					Math.min(1, (e.clientX - rect.left) / rect.width),
				);
				videoRef.current.currentTime = pct * duration;
				setIsDragging(false);
			}
		};
		if (isDragging) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		}
		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [isDragging, duration]);

	const videoType = lesson?.videoUrl ? getVideoType(lesson.videoUrl) : null;
	const isNative = videoType === 'native';

	const togglePlay = () => {
		if (!videoRef.current) return;
		if (isPlaying) videoRef.current.pause();
		else videoRef.current.play();
		setIsPlaying(!isPlaying);
	};

	const handleSeek = (e: ReactMouseEvent<HTMLDivElement>) => {
		if (!videoRef.current) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const pct = (e.clientX - rect.left) / rect.width;
		videoRef.current.currentTime = pct * duration;
	};

	const handleProgressMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
		setIsDragging(true);
		if (progressRef.current) {
			const rect = progressRef.current.getBoundingClientRect();
			const pct = Math.max(
				0,
				Math.min(1, (e.clientX - rect.left) / rect.width),
			);
			setDragProgress(pct * 100);
		}
	};

	const handleVolumeChange = (e: ReactMouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const v = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		setVolume(v);
		if (videoRef.current) videoRef.current.volume = v;
		setIsMuted(v === 0);
	};

	const toggleMute = () => {
		if (!videoRef.current) return;
		videoRef.current.muted = !isMuted;
		setIsMuted(!isMuted);
	};

	const changePlaybackRate = (rate: number) => {
		if (videoRef.current) {
			videoRef.current.playbackRate = rate;
			setPlaybackRate(rate);
		}
		setShowSpeedMenu(false);
	};

	const handleFullscreen = () => {
		const container = videoRef.current?.parentElement;
		if (!container) return;
		if (document.fullscreenElement) {
			document.exitFullscreen();
		} else {
			container.requestFullscreen();
		}
	};

	const skipForward = () => {
		if (videoRef.current)
			videoRef.current.currentTime = Math.min(
				duration,
				videoRef.current.currentTime + 10,
			);
	};

	const skipBackward = () => {
		if (videoRef.current)
			videoRef.current.currentTime = Math.max(
				0,
				videoRef.current.currentTime - 10,
			);
	};

	const showControls = () => {
		setControlsVisible(true);
		if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
		controlsTimeoutRef.current = setTimeout(() => {
			if (!showEndScreen && isPlaying) setControlsVisible(false);
			controlsTimeoutRef.current = null;
		}, 3000);
	};

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

	const { videoUrl, title, description } = lesson;
	const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;
	const displayDuration = realDuration ?? lesson.duration ?? 0;

	return (
		<>
			<Script src="https://www.youtube.com/iframe_api" strategy="lazyOnload" />
			<Script
				src="https://player.vimeo.com/api/player.js"
				strategy="lazyOnload"
				onLoad={() => setVimeoReady(true)}
			/>

			<div className="px-6 pt-6">
				<section
					aria-label="Reprodutor de vídeo"
					className="relative bg-black rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 w-full aspect-video group"
					onMouseMove={showControls}
					onMouseLeave={() =>
						isPlaying && !showEndScreen && setControlsVisible(false)
					}
				>
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
						<video
							ref={videoRef}
							key={videoUrl}
							src={videoUrl}
							autoPlay
							playsInline
							className="w-full h-full object-cover"
							onEnded={handleEnded}
							onLoadedMetadata={(e) => {
								const d = (e.target as HTMLVideoElement).duration;
								if (Number.isFinite(d)) setRealDuration(Math.round(d));
							}}
							onCanPlay={() => setIsLoading(false)}
							onPlay={() => setIsPlaying(true)}
							onPause={() => setIsPlaying(false)}
							aria-label={title}
						>
							<track kind="captions" src="" srcLang="pt" label="Legendas" />
						</video>
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

					{/* Custom controls overlay - native video only */}
					{isNative && videoRef.current && (
						<div
							className={`absolute inset-0 flex flex-col justify-between p-6 z-10 transition-opacity duration-300 ${
								controlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0'
							} bg-gradient-to-b from-black/70 via-transparent to-black/90`}
						>
							<div className="flex justify-between items-start">
								<div>
									{moduleLabel && (
										<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-600/90 text-white text-xs font-medium mb-2">
											{moduleLabel}
										</span>
									)}
									<h3 className="text-white font-semibold text-lg drop-shadow-md">
										{title}
									</h3>
								</div>
							</div>

							{/* Center play button */}
							<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
								{!showEndScreen && (
									<button
										type="button"
										onClick={togglePlay}
										className="pointer-events-auto w-20 h-20 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center transition-all hover:scale-110 shadow-2xl"
									>
										{isPlaying ? (
											<Pause className="w-8 h-8 text-white fill-white" />
										) : (
											<Play className="w-8 h-8 text-white fill-white ml-1" />
										)}
									</button>
								)}
							</div>

							{/* Progress bar + controls */}
							<div className="space-y-3 pointer-events-auto">
								<div
									ref={progressRef}
									role="slider"
									tabIndex={0}
									aria-label="Barra de progresso do vídeo"
									aria-valuemin={0}
									aria-valuemax={100}
									aria-valuenow={
										duration ? Math.round((currentTime / duration) * 100) : 0
									}
									className="h-1.5 w-full bg-white/20 rounded-full cursor-pointer overflow-visible hover:h-2 transition-all relative"
									onMouseDown={handleProgressMouseDown}
									onClick={handleSeek}
									onKeyDown={(e) => {
										if (e.key === 'ArrowLeft') {
											e.preventDefault();
											if (videoRef.current)
												videoRef.current.currentTime = Math.max(
													0,
													videoRef.current.currentTime - 5,
												);
										} else if (e.key === 'ArrowRight') {
											e.preventDefault();
											if (videoRef.current)
												videoRef.current.currentTime = Math.min(
													duration,
													videoRef.current.currentTime + 5,
												);
										}
									}}
								>
									<div
										className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full relative transition-none"
										style={{
											width: `${
												isDragging
													? dragProgress
													: duration
														? (currentTime / duration) * 100
														: 0
											}%`,
										}}
									>
										<div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity ring-2 ring-violet-500/50" />
									</div>
								</div>

								<div className="flex items-center justify-between text-white">
									<div className="flex items-center gap-3">
										<button
											type="button"
											onClick={skipBackward}
											className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center"
										>
											<SkipBack className="w-4 h-4" />
										</button>
										<button
											type="button"
											onClick={togglePlay}
											className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center"
										>
											{isPlaying ? (
												<Pause className="w-4 h-4 fill-white" />
											) : (
												<Play className="w-4 h-4 fill-white ml-0.5" />
											)}
										</button>
										<button
											type="button"
											onClick={skipForward}
											className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center"
										>
											<SkipForward className="w-4 h-4" />
										</button>
										<div className="flex items-center gap-2 ml-2">
											<button
												type="button"
												onClick={toggleMute}
												className="opacity-80 hover:opacity-100"
											>
												{isMuted || volume === 0 ? (
													<VolumeX className="w-4 h-4" />
												) : (
													<Volume2 className="w-4 h-4" />
												)}
											</button>
											<div
												role="slider"
												tabIndex={0}
												aria-label="Controlo de volume"
												aria-valuemin={0}
												aria-valuemax={100}
												aria-valuenow={Math.round((isMuted ? 0 : volume) * 100)}
												className="w-20 h-1 bg-white/30 rounded-full cursor-pointer"
												onClick={handleVolumeChange}
												onKeyDown={(e) => {
													if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
														e.preventDefault();
														setVolume((v) => Math.max(0, v - 0.1));
													} else if (
														e.key === 'ArrowRight' ||
														e.key === 'ArrowUp'
													) {
														e.preventDefault();
														setVolume((v) => Math.min(1, v + 0.1));
													}
												}}
											>
												<div
													className="h-full bg-white rounded-full transition-all"
													style={{
														width: `${isMuted ? 0 : volume * 100}%`,
													}}
												/>
											</div>
										</div>
										<span className="text-xs font-mono opacity-80 ml-3">
											{formatTime(currentTime)} / {formatTime(duration || 0)}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="relative">
											<button
												type="button"
												onClick={() => setShowSpeedMenu(!showSpeedMenu)}
												className="px-3 py-1 rounded-full text-xs hover:bg-white/20"
											>
												{playbackRate}x
											</button>
											{showSpeedMenu && (
												<div className="absolute bottom-full mb-2 right-0 bg-black/90 backdrop-blur-md rounded-lg p-2 space-y-1 min-w-[80px]">
													{[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
														<button
															key={rate}
															type="button"
															onClick={() => changePlaybackRate(rate)}
															className={`block w-full text-left px-3 py-1 text-xs rounded hover:bg-white/20 ${
																playbackRate === rate
																	? 'text-violet-400'
																	: 'text-white'
															}`}
														>
															{rate}x
														</button>
													))}
												</div>
											)}
										</div>
										<button
											type="button"
											onClick={handleFullscreen}
											className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center"
										>
											<Maximize className="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Bottom bar for YouTube/Vimeo - pointer-events-none */}
					{(videoType === 'youtube' || videoType === 'vimeo') && (
						<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 flex items-center gap-3 pointer-events-none">
							{displayDuration > 0 && (
								<span className="flex items-center gap-1 bg-white/20 border border-white/30 rounded-full px-3 py-0.5 text-xs text-white">
									{formatDuration(displayDuration)}
								</span>
							)}
							<span className="bg-white/20 border border-white/30 rounded-full px-3 py-0.5 text-xs text-white truncate">
								{courseName}
							</span>
						</div>
					)}

					{/* End screen overlay */}
					{showEndScreen && (
						<div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm">
							<div className="text-center space-y-6 p-8">
								<div className="w-16 h-16 mx-auto bg-gradient-to-br from-violet-500 to-cyan-400 rounded-full flex items-center justify-center">
									<CheckCircle className="w-8 h-8 text-white" />
								</div>
								<div>
									<h3 className="text-white text-2xl font-bold mb-2">
										Aula Concluída!
									</h3>
									<p className="text-white/70 text-sm">{title}</p>
								</div>

								{nextLessonTitle ? (
									<div className="space-y-3">
										<p className="text-white/50 text-sm">Próxima aula:</p>
										<p className="text-white font-medium">{nextLessonTitle}</p>
										<button
											type="button"
											onClick={onEndScreenAdvance}
											className="bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 mt-4 inline-flex items-center gap-2"
										>
											Avançar para próxima aula
											<ChevronRight className="w-5 h-5" />
										</button>
									</div>
								) : (
									<div className="space-y-3">
										<p className="text-white/70">
											Parabéns! Concluíste todas as aulas deste curso.
										</p>
										<button
											type="button"
											onClick={onEndScreenAdvance}
											className="bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white px-8 py-3 rounded-full font-semibold inline-flex items-center gap-2"
										>
											<Trophy className="w-5 h-5" />
											Parabéns!
										</button>
									</div>
								)}

								<button
									type="button"
									onClick={onEndScreenReplay}
									className="text-white/60 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm flex items-center gap-2 mx-auto"
								>
									<RotateCcw className="w-4 h-4" />
									Assistir novamente
								</button>
							</div>
						</div>
					)}
				</section>
			</div>

			{/* Lesson info - below video */}
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
