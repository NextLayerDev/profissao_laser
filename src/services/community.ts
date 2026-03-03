import type {
	ChannelMessage,
	Event,
	Member,
	Post,
	Project,
	RankingUser,
} from '@/types/community';

// ─── Mock data (substituir por api.get/post quando a API existir) ────────────

const MOCK_POSTS: Post[] = [
	{
		id: 1,
		author: 'Ricardo Oliveira',
		avatar: 'RO',
		time: '2 horas atrás',
		content:
			'Galera, finalizei esse projeto de personalização em caneca térmica! Usei Fiber com 40% de potência. O que acharam? Cliente adorou! 🔥',
		image:
			'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2940&auto=format&fit=crop',
		likes: 45,
		comments: 12,
		shares: 5,
		liked: true,
	},
	{
		id: 2,
		author: 'Fernanda Costa',
		avatar: 'FC',
		time: '5 horas atrás',
		content:
			'Dica de OURO para quem trabalha com UV: sempre fazer teste de potência antes de gravar copos personalizados. Economizei muito material com isso! #DicaProfissional',
		likes: 89,
		comments: 24,
		shares: 15,
		liked: false,
	},
	{
		id: 3,
		author: 'Carlos Mendes',
		avatar: 'CM',
		time: '1 dia atrás',
		content:
			'Quem aqui já trabalhou com brindes corporativos usando Fiber? Preciso de dicas de materiais que dão melhor resultado!',
		likes: 12,
		comments: 34,
		shares: 2,
		liked: false,
	},
];

const MOCK_CHANNEL_MESSAGES: Record<string, ChannelMessage[]> = {
	'chat-fiber': [
		{
			id: 1,
			user: 'Carlos Mendes',
			avatar: 'CM',
			content:
				'Pessoal, qual a melhor configuração de potência para gravar em inox com Fiber?',
			time: '09:30',
			isMe: false,
		},
		{
			id: 2,
			user: 'Ana Silva',
			avatar: 'AS',
			content: 'Eu uso 50% de potência e 800mm/s de velocidade. Fica perfeito!',
			time: '09:35',
			isMe: false,
		},
	],
	'chat-uv': [
		{
			id: 1,
			user: 'Juliana Torres',
			avatar: 'JT',
			content: 'Alguém já gravou canecas de vidro com UV? Preciso de dicas!',
			time: '10:15',
			isMe: false,
		},
	],
	duvidas: [
		{
			id: 1,
			user: 'Pedro Santos',
			avatar: 'PS',
			content: 'Como faço para importar vetores no EZCAD? Sou iniciante ainda.',
			time: '11:00',
			isMe: false,
		},
	],
	'parametros-fiber': [],
	'parametros-uv': [],
	'banco-de-vetor': [],
	'equipe-de-vetor': [],
	tutoriais: [],
	'passo-a-passo': [],
	links: [],
	regras: [],
	anuncio: [],
	'arquivos-da-live': [],
	live: [],
};

const MOCK_MEMBERS: Member[] = [
	{
		name: 'Ana Beatriz',
		specialty: 'Especialista em Personalização UV',
		badges: ['UV', 'Copos & Canecas'],
		category: 'uv',
		image: 'https://i.pravatar.cc/150?u=ana',
	},
	{
		name: 'Carlos Silva',
		specialty: 'Mestre em Fiber Laser',
		badges: ['Fiber', 'Metais'],
		category: 'fiber',
		image: 'https://i.pravatar.cc/150?u=carlos',
	},
	{
		name: 'Marina Costa',
		specialty: 'Designer de Vetores',
		badges: ['Design', 'Vetorização'],
		category: 'design',
		image: 'https://i.pravatar.cc/150?u=marina',
	},
	{
		name: 'Pedro Santos',
		specialty: 'Expert em Brindes Corporativos',
		badges: ['Brindes', 'Premium'],
		category: 'brindes',
		image: 'https://i.pravatar.cc/150?u=pedro',
	},
	{
		name: 'Julia Mendes',
		specialty: 'Empreendedora Laser',
		badges: ['Vendas', 'Marketing'],
		category: 'negocios',
		image: 'https://i.pravatar.cc/150?u=julia',
	},
	{
		name: 'Lucas Oliveira',
		specialty: 'Técnico EZCAD',
		badges: ['EZCAD', 'Configuração'],
		category: 'tecnico',
		image: 'https://i.pravatar.cc/150?u=lucas',
	},
];

const MOCK_PROJECTS: Project[] = [
	{
		title: 'Canecas Personalizadas UV',
		author: 'Ana B.',
		img: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2940&auto=format&fit=crop',
		description:
			'Set de canecas personalizadas com gravação UV. Resultado incrível com alta durabilidade e cores vibrantes.',
		material: 'Caneca cerâmica',
		technique: 'Gravação UV Laser',
		time: '15 min cada',
		likes: 234,
		comments: 45,
	},
	{
		title: 'Copos Long Drink Premium',
		author: 'Carlos M.',
		img: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=2940&auto=format&fit=crop',
		description:
			'Copos long drink personalizados para evento corporativo. Gravação UV de alta qualidade com logo da empresa.',
		material: 'Vidro temperado',
		technique: 'UV Laser',
		time: '10 min cada',
		likes: 189,
		comments: 32,
	},
	{
		title: 'Chaveiros Metálicos Fiber',
		author: 'Julia S.',
		img: 'https://images.unsplash.com/photo-1626785774573-4b799314346d?q=80&w=2940&auto=format&fit=crop',
		description:
			'Chaveiros personalizados em metal com Fiber Laser. Perfeitos para brindes corporativos de alto padrão.',
		material: 'Aço Inox',
		technique: 'Fiber Laser 50W',
		time: '5 min cada',
		likes: 312,
		comments: 67,
	},
	{
		title: 'Brindes Corporativos Mix',
		author: 'Marcos P.',
		img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2940&auto=format&fit=crop',
		description:
			'Kit completo de brindes personalizados: canetas, chaveiros e porta-cartões com gravação laser.',
		material: 'Metal e Acrílico',
		technique: 'Fiber + UV',
		time: 'Variado',
		likes: 156,
		comments: 28,
	},
	{
		title: 'Taças Personalizadas Casamento',
		author: 'Luiza T.',
		img: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=2969&auto=format&fit=crop',
		description:
			'Taças de cristal personalizadas para casamento com nomes e data. Elegância e sofisticação.',
		material: 'Cristal',
		technique: 'UV Laser',
		time: '12 min cada',
		likes: 278,
		comments: 52,
	},
	{
		title: 'Squeeze Personalizado Inox',
		author: 'Pedro H.',
		img: 'https://images.unsplash.com/photo-1602143407337-45baa0a8b9d0?q=80&w=2787&auto=format&fit=crop',
		description:
			'Squeeze térmico em inox com gravação a laser. Ideal para academias e empresas de saúde.',
		material: 'Inox 304',
		technique: 'Fiber Laser 60W',
		time: '20 min',
		likes: 198,
		comments: 41,
	},
];

const MOCK_EVENTS: Event[] = [
	{
		id: 1,
		title: 'Workshop Laser UV - Canecas Premium',
		date: '15 Jan',
		time: '19:00',
		type: 'workshop',
		description:
			'Aprenda técnicas avançadas de personalização em canecas usando laser UV',
	},
	{
		id: 2,
		title: 'Live: Parâmetros Fiber para Metais',
		date: '18 Jan',
		time: '20:00',
		type: 'live',
		description:
			'Configurações ideais de potência e velocidade para diferentes tipos de metal',
	},
	{
		id: 3,
		title: 'Q&A: Dúvidas sobre Personalização',
		date: '22 Jan',
		time: '19:30',
		type: 'qa',
		description: 'Sessão ao vivo para tirar todas as suas dúvidas sobre laser',
	},
];

const MOCK_TOP_RANKING: RankingUser[] = [
	{
		pos: 2,
		name: 'Mariana Silva',
		pts: 2150,
		gradient: 'from-slate-300 to-slate-400',
	},
	{
		pos: 1,
		name: 'Ricardo Oliveira',
		pts: 2450,
		gradient: 'from-amber-300 via-yellow-400 to-amber-500',
	},
	{
		pos: 3,
		name: 'João Santos',
		pts: 1980,
		gradient: 'from-orange-300 to-amber-400',
	},
];

// ─── API functions (mock implementation) ────────────────────────────────────

export async function getPosts(): Promise<Post[]> {
	// TODO: return (await api.get('/community/posts')).data;
	return Promise.resolve([...MOCK_POSTS]);
}

export async function createPost(data: {
	content: string;
	image?: string;
	author: string;
	avatar: string;
}): Promise<Post> {
	// TODO: return (await api.post('/community/posts', data)).data;
	const newPost: Post = {
		id: Date.now(),
		author: data.author,
		avatar: data.avatar,
		time: 'Agora mesmo',
		content: data.content,
		image: data.image,
		likes: 0,
		comments: 0,
		shares: 0,
		liked: false,
	};
	return Promise.resolve(newPost);
}

export async function getChannelMessages(
	channelId: string,
): Promise<ChannelMessage[]> {
	// TODO: return (await api.get(`/community/channels/${channelId}/messages`)).data;
	return Promise.resolve([...(MOCK_CHANNEL_MESSAGES[channelId] ?? [])]);
}

/** Retorna mensagens iniciais de todos os canais (para hidratação) */
export async function getAllChannelMessages(): Promise<
	Record<string, ChannelMessage[]>
> {
	// TODO: remover quando API existir - usar getChannelMessages por canal
	return Promise.resolve({ ...MOCK_CHANNEL_MESSAGES });
}

export async function sendChannelMessage(
	_channelId: string,
	data: Omit<ChannelMessage, 'id' | 'time'> & { time: string },
): Promise<ChannelMessage> {
	// TODO: return (await api.post(`/community/channels/${channelId}/messages`, data)).data;
	const newMsg: ChannelMessage = {
		id: Date.now(),
		...data,
	};
	return Promise.resolve(newMsg);
}

export async function getMembers(filters?: {
	search?: string;
	category?: string;
}): Promise<Member[]> {
	// TODO: return (await api.get('/community/members', { params: filters })).data;
	let result = [...MOCK_MEMBERS];
	if (filters?.search) {
		const s = filters.search.toLowerCase();
		result = result.filter(
			(m) =>
				m.name.toLowerCase().includes(s) ||
				m.specialty.toLowerCase().includes(s) ||
				m.badges.some((b) => b.toLowerCase().includes(s)),
		);
	}
	if (filters?.category && filters.category !== 'all') {
		result = result.filter((m) => m.category === filters.category);
	}
	return Promise.resolve(result);
}

export async function getProjects(): Promise<Project[]> {
	// TODO: return (await api.get('/community/projects')).data;
	return Promise.resolve([...MOCK_PROJECTS]);
}

export async function createProject(data: {
	title: string;
	description: string;
	author: string;
	img: string;
	material?: string;
	technique?: string;
}): Promise<Project> {
	// TODO: return (await api.post('/community/projects', data)).data;
	const newProject: Project = {
		...data,
		time: 'Recente',
		likes: 0,
		comments: 0,
	};
	return Promise.resolve(newProject);
}

export async function getEvents(): Promise<Event[]> {
	// TODO: return (await api.get('/community/events')).data;
	return Promise.resolve([...MOCK_EVENTS]);
}

export async function getRanking(): Promise<{
	top: RankingUser[];
	rest: Array<{ pos: number; name: string; pts: number }>;
}> {
	// TODO: return (await api.get('/community/ranking')).data;
	const rest = [4, 5, 6, 7, 8, 9, 10].map((i) => ({
		pos: i,
		name: `Usuário Exemplo ${i}`,
		pts: 1900 - i * 50,
	}));
	return Promise.resolve({ top: MOCK_TOP_RANKING, rest });
}

export async function createChannel(name: string): Promise<{ id: string }> {
	// TODO: return (await api.post('/community/channels', { name })).data;
	const id = name.toLowerCase().replace(/\s+/g, '-');
	return Promise.resolve({ id });
}
