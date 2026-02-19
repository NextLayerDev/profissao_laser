export function formatDuration(seconds: number | null): string {
	if (!seconds) return '';
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}

export function getEmbedUrl(url: string): string | null {
	const yt = url.match(
		/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
	);
	if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`;

	const vimeo = url.match(/vimeo\.com\/(\d+)/);
	if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;

	return null;
}
