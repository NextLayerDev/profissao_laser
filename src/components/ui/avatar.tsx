'use client';

import {
	defaultAvatarFor,
	seasonalUrl,
} from '@/utils/constants/avatar-presets';

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
	alt,
}: AvatarProps) {
	const base = `${rounded} shrink-0 overflow-hidden ${className}`;
	// Sem foto enviada: cai pro ícone default (por gênero do nome, estável por
	// usuário). Foto enviada (Bunny) ou ícone-preset (/avatars) — ambos via <img>.
	// seasonalUrl tematiza os ícones-preset durante a Festa Junina (e só eles).
	const imageSrc = seasonalUrl(src || defaultAvatarFor(name, email));
	return (
		<img
			src={imageSrc}
			alt={alt ?? name ?? ''}
			className={`${base} object-cover`}
		/>
	);
}
