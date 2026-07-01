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
	/**
	 * Status do chamado. O backend cria como `'open'` e muda para `'answered'`
	 * quando o técnico responde (`'pending'` é sinônimo legado de não-respondido).
	 * Regra prática: qualquer coisa != `'answered'` conta como pendente.
	 */
	status: 'open' | 'pending' | 'answered';
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

/**
 * Fonte única da regra "chamado pendente": tudo que NÃO está `'answered'`.
 * O backend cria os chamados como `'open'` (não `'pending'`) e só marca
 * `'answered'` na resposta do técnico — então comparar `=== 'pending'` zera
 * contadores e desabilita ações em chamados abertos. Use isto em vez do literal.
 */
export const isDoubtPending = (c: Pick<DoubtChat, 'status'>): boolean =>
	c.status !== 'answered';
