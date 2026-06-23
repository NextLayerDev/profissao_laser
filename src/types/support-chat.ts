export type SupportChatStatus =
	| 'ai'
	| 'waiting_human'
	| 'with_human'
	| 'closed';

export type SupportMessageRole = 'customer' | 'ai' | 'attendant' | 'system';

export interface SupportMessage {
	id: string;
	chatId: string;
	role: SupportMessageRole;
	authorId?: string | null;
	authorName: string;
	content: string;
	fileUrl?: string | null;
	createdAt: string;
}

export interface SupportChatSummary {
	id: string;
	customerId: string;
	customerName?: string | null;
	attendantId?: string | null;
	attendantName?: string | null;
	status: SupportChatStatus;
	subject?: string | null;
	handoffReason?: string | null;
	createdAt: string;
	updatedAt: string;
	closedAt?: string | null;
	lastMessageAt?: string | null;
	lastMessageRole?: SupportMessageRole | null;
	lastMessagePreview?: string | null;
}

export interface SupportChat extends SupportChatSummary {
	messages: SupportMessage[];
}
