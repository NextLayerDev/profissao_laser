interface VoxxysIconProps {
	/** Classes de tamanho (ex.: "w-4 h-4"). */
	className?: string;
	alt?: string;
}

/**
 * Ícone da moeda Voxxys (imagem colorida da marca).
 * Substitui o antigo ícone genérico de moeda em toda a plataforma.
 * A cor é fixa (raster) — a `className` controla apenas o tamanho.
 */
export function VoxxysIcon({
	className = 'w-4 h-4',
	alt = 'Voxxys',
}: VoxxysIconProps) {
	return (
		<img
			src="/img/voxxys-icon.svg"
			alt={alt}
			className={`object-contain shrink-0 ${className}`}
		/>
	);
}
