import type {
	ChatMessage,
	DefaultQuestion,
	DoubtCategory,
	DoubtChat,
	Technician,
} from '@/types/doubt-chat';

// Categorias mock (mutável para CRUD admin)
let mockCategories: DoubtCategory[] = [
	{
		id: 'cat-1',
		title: 'Configuração de equipamento',
		description: 'Dúvidas sobre EZCAD e máquinas',
		order: 0,
	},
	{
		id: 'cat-2',
		title: 'Personalização e vetorização',
		description: 'Ficheiros, formatos e personalização',
		order: 1,
	},
	{
		id: 'cat-3',
		title: 'Manutenção',
		description: 'Problemas técnicos e manutenção',
		order: 2,
	},
];

// Perguntas padrão mock
export const mockDefaultQuestions: DefaultQuestion[] = [
	{ id: 'q1', text: 'Qual o modelo da sua máquina?', type: 'text', order: 0 },
	{
		id: 'q2',
		text: 'Qual o software que utiliza?',
		type: 'select',
		options: ['EZCAD', 'LightBurn', 'Outro'],
		order: 1,
	},
	{
		id: 'q3',
		text: 'Descreva o problema em detalhe',
		type: 'textarea',
		order: 2,
	},
];

// Técnicos mock
export const mockTechnicians: Technician[] = [
	{
		id: 'tech-1',
		name: 'Miguel Santos',
		email: 'miguel@profissaolaser.pt',
		defaultQuestions: mockDefaultQuestions,
	},
	{
		id: 'tech-2',
		name: 'Ana Ferreira',
		email: 'ana@profissaolaser.pt',
		defaultQuestions: mockDefaultQuestions.slice(0, 2),
	},
	{
		id: 'tech-3',
		name: 'Carlos Oliveira',
		email: 'carlos@profissaolaser.pt',
		defaultQuestions: [],
	},
];

// Mensagens mock
const mockMessages1: ChatMessage[] = [
	{
		id: 'msg-1',
		content:
			'Olá, tenho dificuldade em configurar o EZCAD para corte em acrílico. Pode ajudar?',
		authorId: 'customer-1',
		authorName: 'João Silva',
		isTechnician: false,
		fileUrl: null,
		createdAt: '2026-03-04T10:00:00.000Z',
	},
	{
		id: 'msg-2',
		content:
			'Claro! Vá em Configurações > Material e selecione Acrílico. Depois ajuste a potência para 60-70%.',
		authorId: 'tech-1',
		authorName: 'Miguel Santos',
		isTechnician: true,
		fileUrl: null,
		createdAt: '2026-03-04T10:15:00.000Z',
	},
	{
		id: 'msg-3',
		content: 'Obrigado! Funcionou perfeitamente.',
		authorId: 'customer-1',
		authorName: 'João Silva',
		isTechnician: false,
		fileUrl: null,
		createdAt: '2026-03-04T10:30:00.000Z',
	},
];

const mockMessages2: ChatMessage[] = [
	{
		id: 'msg-4',
		content:
			'O ficheiro DXF não está a ser reconhecido pelo LightBurn. Que formato devo usar?',
		authorId: 'customer-1',
		authorName: 'João Silva',
		isTechnician: false,
		fileUrl: null,
		createdAt: '2026-03-05T09:00:00.000Z',
	},
];

// Dúvidas/chats mock (em memória para simular estado)
let mockChats: DoubtChat[] = [
	{
		id: 'chat-1',
		categoryId: 'cat-1',
		categoryName: 'Configuração de equipamento',
		technicianId: 'tech-1',
		technicianName: 'Miguel Santos',
		customerId: 'customer-1',
		customerName: 'João Silva',
		status: 'answered',
		messages: mockMessages1,
		qualificationAnswers: {
			q1: 'Máquina 20W',
			q2: 'EZCAD',
			q3: 'Problema com corte em acrílico',
		},
		createdAt: '2026-03-04T10:00:00.000Z',
		updatedAt: '2026-03-04T10:30:00.000Z',
	},
	{
		id: 'chat-2',
		categoryId: 'cat-2',
		categoryName: 'Personalização e vetorização',
		technicianId: 'tech-2',
		technicianName: 'Ana Ferreira',
		customerId: 'customer-1',
		customerName: 'João Silva',
		status: 'pending',
		messages: mockMessages2,
		qualificationAnswers: {
			q1: 'Máquina 40W',
			q2: 'LightBurn',
		},
		createdAt: '2026-03-05T09:00:00.000Z',
		updatedAt: '2026-03-05T09:00:00.000Z',
	},
];

// Funções mock para simular operações (sem API)
export function getMockCategories(): DoubtCategory[] {
	return [...mockCategories].sort((a, b) => a.order - b.order);
}

export function addMockCategory(
	payload: Omit<DoubtCategory, 'id'>,
): DoubtCategory {
	const id = `cat-${Date.now()}`;
	const newCat: DoubtCategory = { ...payload, id };
	mockCategories = [...mockCategories, newCat];
	return newCat;
}

export function updateMockCategory(
	id: string,
	payload: Partial<Pick<DoubtCategory, 'title' | 'description' | 'order'>>,
): DoubtCategory | null {
	const idx = mockCategories.findIndex((c) => c.id === id);
	if (idx < 0) return null;
	mockCategories = mockCategories.map((c) =>
		c.id === id ? { ...c, ...payload } : c,
	);
	return mockCategories.find((c) => c.id === id) ?? null;
}

export function deleteMockCategory(id: string): boolean {
	const before = mockCategories.length;
	mockCategories = mockCategories.filter((c) => c.id !== id);
	return mockCategories.length < before;
}

export function reorderMockCategories(ids: string[]): void {
	const byId = new Map(mockCategories.map((c) => [c.id, c]));
	mockCategories = ids
		.map((id, order) => {
			const cat = byId.get(id);
			return cat ? { ...cat, order } : null;
		})
		.filter((c): c is DoubtCategory => c != null);
}

export function getMockTechnicians(): Technician[] {
	return [...mockTechnicians];
}

export function getMockTechnicianById(id: string): Technician | undefined {
	return mockTechnicians.find((t) => t.id === id);
}

export function getMockChatsByCustomer(
	customerId: string,
	status?: 'pending' | 'answered' | 'all',
): DoubtChat[] {
	let filtered = mockChats.filter((c) => c.customerId === customerId);
	if (status && status !== 'all') {
		filtered = filtered.filter((c) => c.status === status);
	}
	return filtered.sort(
		(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
	);
}

export function getMockChatById(id: string): DoubtChat | undefined {
	return mockChats.find((c) => c.id === id);
}

export function getMockChatsByCategory(categoryId: string): DoubtChat[] {
	return mockChats
		.filter((c) => c.categoryId === categoryId)
		.sort(
			(a, b) =>
				new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
		);
}

export function getMockChatsAdmin(): DoubtChat[] {
	return [...mockChats].sort(
		(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
	);
}

// Simular adicionar chat (mock - altera estado em memória)
export function addMockChat(
	chat: Omit<DoubtChat, 'id' | 'createdAt' | 'updatedAt'>,
): DoubtChat {
	const now = new Date().toISOString();
	const newChat: DoubtChat = {
		...chat,
		id: `chat-${Date.now()}`,
		createdAt: now,
		updatedAt: now,
	};
	mockChats = [newChat, ...mockChats];
	return newChat;
}

// Simular adicionar mensagem (mock)
export function addMockMessage(
	chatId: string,
	message: Omit<ChatMessage, 'id' | 'createdAt'>,
): ChatMessage | null {
	const chat = mockChats.find((c) => c.id === chatId);
	if (!chat) return null;
	const newMsg: ChatMessage = {
		...message,
		id: `msg-${Date.now()}`,
		createdAt: new Date().toISOString(),
	};
	chat.messages = [...(chat.messages ?? []), newMsg];
	chat.updatedAt = newMsg.createdAt;
	if (message.isTechnician) {
		chat.status = 'answered';
	}
	return newMsg;
}
