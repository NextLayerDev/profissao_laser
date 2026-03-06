import type { Project, ProjectComment } from '@/types/community';

export const MOCK_PROJECTS: Project[] = [
	{
		id: 'proj-1',
		title: 'Canecas Personalizadas Premium',
		author: 'Maria Silva',
		img: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2940&auto=format&fit=crop',
		description:
			'Projeto de personalização em cerâmica com laser UV. Resultado final com alta definição e durabilidade.',
		material: 'Caneca cerâmica',
		technique: 'UV Laser',
		time: '2h',
		likes: 45,
		comments: 12,
		createdAt: '2025-01-15T10:30:00Z',
	},
	{
		id: 'proj-2',
		title: 'Chaveiros em Metal Fiber',
		author: 'João Santos',
		img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2940&auto=format&fit=crop',
		description:
			'Chaveiros personalizados gravados em metal com laser fiber. Ideal para brindes corporativos.',
		material: 'Metal inox',
		technique: 'Fiber Laser',
		time: '45min',
		likes: 89,
		comments: 23,
		createdAt: '2025-01-14T14:20:00Z',
	},
	{
		id: 'proj-3',
		title: 'Placas de Sinalização',
		author: 'Ana Costa',
		img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=2940&auto=format&fit=crop',
		description:
			'Placas de sinalização em acrílico com gravação UV. Alta visibilidade e resistência.',
		material: 'Acrílico',
		technique: 'UV Laser',
		time: '1h30',
		likes: 34,
		comments: 8,
		createdAt: '2025-01-13T09:15:00Z',
	},
	{
		id: 'proj-4',
		title: 'Troféus Personalizados',
		author: 'Pedro Oliveira',
		img: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?q=80&w=2940&auto=format&fit=crop',
		description:
			'Trofeus em madeira MDF com gravação a laser. Perfeitos para eventos e premiações.',
		material: 'MDF',
		technique: 'CO2 Laser',
		time: '3h',
		likes: 67,
		comments: 15,
		createdAt: '2025-01-12T16:45:00Z',
	},
	{
		id: 'proj-5',
		title: 'Etiquetas em Couro',
		author: 'Carla Mendes',
		img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2940&auto=format&fit=crop',
		description:
			'Etiquetas personalizadas em couro natural. Ideal para marcenaria e artesanato.',
		material: 'Couro',
		technique: 'UV Laser',
		time: '1h',
		likes: 52,
		comments: 11,
		createdAt: '2025-01-11T11:00:00Z',
	},
	{
		id: 'proj-6',
		title: 'Suportes para Celular',
		author: 'Ricardo Ferreira',
		img: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?q=80&w=2940&auto=format&fit=crop',
		description:
			'Suportes em madeira com design minimalista. Gravação a laser com logos personalizados.',
		material: 'Madeira',
		technique: 'CO2 Laser',
		time: '2h',
		likes: 41,
		comments: 9,
		createdAt: '2025-01-10T08:30:00Z',
	},
];

export const MOCK_PROJECT_COMMENTS: Record<string, ProjectComment[]> = {
	'proj-1': [
		{
			id: 'comm-1',
			projectId: 'proj-1',
			author: 'Admin',
			content: 'Excelente trabalho! A definição da gravação ficou impecável.',
			time: '2025-01-16T09:00:00Z',
			isAdmin: true,
		},
		{
			id: 'comm-2',
			projectId: 'proj-1',
			author: 'Lucas Pereira',
			content: 'Qual potência do laser utilizou? Ficou muito bom!',
			time: '2025-01-16T10:30:00Z',
			isAdmin: false,
		},
	],
	'proj-2': [
		{
			id: 'comm-3',
			projectId: 'proj-2',
			author: 'Admin',
			content: 'Projeto destaque da semana! Parabéns pelo resultado.',
			time: '2025-01-15T14:00:00Z',
			isAdmin: true,
		},
	],
};
