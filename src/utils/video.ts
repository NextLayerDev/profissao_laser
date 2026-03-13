export function formatDuration(seconds: number | null): string {
	if (!seconds) return '';
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}

const YOUTUBE_REGEX =
	/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const VIMEO_REGEX = /vimeo\.com\/(\d+)/;
// Matches both /embed/ (correct) and /play/ (legacy — auto-corrected in getEmbedUrl)
const BUNNY_REGEX = /iframe\.mediadelivery\.net\/(embed|play)\//;

export function getEmbedUrl(url: string): string | null {
	const yt = url.match(YOUTUBE_REGEX);
	if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`;

	const vimeo = url.match(VIMEO_REGEX);
	if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;

	// BunnyCDN: ensure embed path (migrate legacy /play/ URLs on the fly)
	if (BUNNY_REGEX.test(url)) return url.replace('/play/', '/embed/');

	return null;
}

export function getVideoType(
	url: string,
): 'youtube' | 'vimeo' | 'bunny' | 'native' | null {
	if (!url) return null;
	if (YOUTUBE_REGEX.test(url)) return 'youtube';
	if (VIMEO_REGEX.test(url)) return 'vimeo';
	if (BUNNY_REGEX.test(url)) return 'bunny';
	return 'native';
}

export function getYoutubeVideoId(url: string): string | null {
	const m = url.match(YOUTUBE_REGEX);
	return m ? m[1] : null;
}

export function getVimeoVideoId(url: string): string | null {
	const m = url.match(VIMEO_REGEX);
	return m ? m[1] : null;
}
