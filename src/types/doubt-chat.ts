// Categoria (admin)
export interface DoubtCategory {
	id: string;
	title: string;
	description?: string;
	order: number;
}

// Técnico
export interface Technician {
	id: string;
	name: string;
	email?: string;
	defaultQuestions?: DefaultQuestion[];
}

// Pergunta padrão (qualificação)
export interface DefaultQuestion {
	id: string;
	text: string;
	type: 'text' | 'select' | 'textarea';
	options?: string[];
	order: number;
}

// Stats
export interface DoubtChatStats {
	pending: number;
	answered: number;
	total: number;
}

// Conversa/dúvida
export interface DoubtChat {
	id: string;
	categoryId: string;
	categoryName?: string;
	technicianId?: string;
	technicianName?: string;
	customerId: string;
	customerName?: string;
	ticketNumber?: number | null;
	status: 'pending' | 'answered';
	messages?: ChatMessage[];
	qualificationAnswers?: Record<string, string>;
	category?: {
		id: string;
		title: string;
		description?: string | null;
		order: number;
	} | null;
	createdAt: string;
	updatedAt: string;
}

export interface ChatMessage {
	id: string;
	content: string;
	fileUrl: string | null;
	authorId: string;
	authorName: string;
	isTechnician: boolean;
	createdAt: string;
}
