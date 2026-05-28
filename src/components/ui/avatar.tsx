'use client';

interface AvatarProps {
	/** URL da foto. Quando ausente, mostra as iniciais. */
	src?: string | null;
	name?: string | null;
	email?: string | null;
	/** Classes de tamanho/tipografia (ex.: "w-9 h-9 text-xs"). */
	className?: string;
	/** Arredondamento (padrão círculo). Use "rounded-xl" para avatar quadrado. */
	rounded?: string;
	/** Fundo do círculo de iniciais (cor sólida ou gradiente via style). */
	fallbackClassName?: string;
	/** Estilo extra do círculo de iniciais (ex.: background gradient inline). */
	fallbackStyle?: React.CSSProperties;
	alt?: string;
}

export function getInitials(
	name?: string | null,
	email?: string | null,
): string {
	const base = name || email || '?';
	return (
		base
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((w) => w[0])
			.join('')
			.toUpperCase() || '?'
	);
}

/**
 * Avatar unificado do customer: renderiza a foto (pl_community_profile.image)
 * quando existir, senão cai para as iniciais num círculo colorido.
 */
export function Avatar({
	src,
	name,
	email,
	className = 'w-10 h-10 text-sm',
	rounded = 'rounded-full',
	fallbackClassName = 'bg-violet-600',
	fallbackStyle,
	alt,
}: AvatarProps) {
	const base = `${rounded} shrink-0 overflow-hidden ${className}`;
	if (src) {
		return (
			<img
				src={src}
				alt={alt ?? name ?? ''}
				className={`${base} object-cover`}
			/>
		);
	}
	return (
		<span
			style={fallbackStyle}
			className={`${base} ${fallbackClassName} grid place-items-center font-bold text-white leading-none`}
		>
			{getInitials(name, email)}
		</span>
	);
}
