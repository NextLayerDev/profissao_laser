interface VoxxysIconProps {
	/** Classes de tamanho (ex.: "w-4 h-4"). */
	className?: string;
	alt?: string;
}

/**
 * Ícone da moeda Voxxys.
 * Tema claro: logo roxo. Tema escuro: logo branco.
 * A troca é por CSS (`.dark`), sem flash de hidratação. A `className`
 * controla o tamanho (aplicada nas duas variantes).
 */
export function VoxxysIcon({
	className = 'w-4 h-4',
	alt = 'Voxxys',
}: VoxxysIconProps) {
	const base = `object-contain shrink-0 ${className}`;
	return (
		<>
			<img
				src="/img/voxxys-icon.svg"
				alt={alt}
				className={`${base} dark:hidden`}
			/>
			<img
				src="/img/voxxys-icon-white.png"
				alt={alt}
				className={`${base} hidden dark:block`}
			/>
		</>
	);
}
