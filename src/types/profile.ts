export interface MyProfile {
	id: string;
	name: string | null;
	email: string | null;
	nickname: string | null;
	bio: string | null;
	avatar: string | null;
	/** URL do banner do perfil (/banners/* padrão ou foto enviada). null = padrão. */
	banner: string | null;
}

export interface UpdateProfilePayload {
	name?: string;
	nickname?: string | null;
	bio?: string | null;
	/** URL do ícone-preset escolhido (/avatars/*) ou foto. */
	image?: string | null;
	/** URL do banner-preset escolhido (/banners/*) ou foto. */
	banner?: string | null;
}

export interface ChangePasswordPayload {
	currentPassword: string;
	newPassword: string;
}
