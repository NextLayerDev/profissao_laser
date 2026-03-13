export type PLFAQEmoji = '👍' | '❤️' | '🔥' | '💡' | '👏';

export interface PLFAQReaction {
	emoji: PLFAQEmoji;
	count: number;
}

export interface PLFAQ {
	id: string;
	question: string;
	answer: string;
	imageUrl: string | null;
	reactions: PLFAQReaction[];
	userReaction: PLFAQEmoji | null;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreateFAQPayload {
	question: string;
	answer: string;
	order: number;
	file?: File;
}

export interface UpdateFAQPayload {
	question?: string;
	answer?: string;
	order?: number;
	file?: File;
}
