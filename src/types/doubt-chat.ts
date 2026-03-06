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

// Conversa/dúvida
export interface DoubtChat {
	id: string;
	categoryId: string;
	categoryName?: string;
	technicianId?: string;
	technicianName?: string;
	customerId: string;
	customerName?: string;
	status: 'pending' | 'answered';
	messages?: ChatMessage[];
	qualificationAnswers?: Record<string, string>;
	createdAt: string;
	updatedAt: string;
}

export interface ChatMessage {
	id: string;
	content: string;
	authorId: string;
	authorName: string;
	isTechnician: boolean;
	createdAt: string;
}
