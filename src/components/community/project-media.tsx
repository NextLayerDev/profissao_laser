/**
 * Mídia de um projeto da vitrine: vídeo quando houver, senão a imagem.
 *
 * Num grid o card inteiro já é clicável, então o vídeo entra sem `controls` —
 * o `preload="metadata"` desenha o primeiro quadro, que é a thumb que a pessoa
 * espera ver. Com `controls` o player engoliria o clique que abre o detalhe.
 */
export function ProjectMedia({
	img,
	video,
	alt,
	className,
	controls = false,
	fallbackSrc,
}: {
	img?: string | null;
	video?: string | null;
	alt: string;
	className?: string;
	controls?: boolean;
	fallbackSrc?: string;
}) {
	if (video) {
		return (
			// biome-ignore lint/a11y/useMediaCaption: vídeo de aluno, sem legenda
			<video
				src={video}
				controls={controls}
				preload="metadata"
				playsInline
				className={className}
			/>
		);
	}
	const src = img ?? fallbackSrc;
	if (!src) return null;
	return <img src={src} alt={alt} loading="lazy" className={className} />;
}
