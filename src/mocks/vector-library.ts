import type {
	VectorLibraryFile,
	VectorLibraryFolder,
} from '@/types/vector-library';

export const MOCK_VECTOR_LIBRARY_FOLDERS: VectorLibraryFolder[] = [
	{
		id: 'folder-1',
		name: 'Fontes',
		parentId: null,
		order: 1,
		createdAt: '2024-12-22T10:00:00Z',
	},
	{
		id: 'folder-2',
		name: 'Pack 134 Vetores 360',
		parentId: null,
		order: 0,
		createdAt: '2024-01-19T14:00:00Z',
	},
	{
		id: 'folder-3',
		name: 'PACK_FERNANDO',
		parentId: null,
		order: 2,
		createdAt: '2024-07-28T09:00:00Z',
	},
	{
		id: 'folder-4',
		name: 'Vetores SVG',
		parentId: null,
		order: 3,
		createdAt: '2024-06-15T11:00:00Z',
	},
	{
		id: 'folder-5',
		name: 'Wrap - Fernando',
		parentId: null,
		order: 4,
		createdAt: '2024-08-10T16:00:00Z',
	},
	{
		id: 'folder-2a',
		name: 'Logos',
		parentId: 'folder-2',
		order: 0,
		createdAt: '2025-01-10T10:00:00Z',
	},
	{
		id: 'folder-2b',
		name: 'Ícones',
		parentId: 'folder-2',
		order: 1,
		createdAt: '2025-01-12T14:00:00Z',
	},
];

export const MOCK_VECTOR_LIBRARY_FILES: VectorLibraryFile[] = [
	{
		id: 'file-1',
		name: 'AGRO_01.svg',
		folderId: 'folder-2',
		fileUrl:
			'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=800&auto=format&fit=crop',
		mimeType: 'image/svg+xml',
		size: 1572864,
		createdAt: '2025-02-02T10:00:00Z',
		order: 0,
	},
	{
		id: 'file-2',
		name: 'Atletico Mineiro.svg',
		folderId: 'folder-2',
		fileUrl:
			'https://images.unsplash.com/photo-1558655146-9f40138edfeb?q=80&w=800&auto=format&fit=crop',
		mimeType: 'image/svg+xml',
		size: 902144,
		createdAt: '2025-02-05T14:30:00Z',
		order: 1,
	},
	{
		id: 'file-3',
		name: 'Ayrton Senna.svg',
		folderId: 'folder-2',
		fileUrl:
			'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
		mimeType: 'image/svg+xml',
		size: 5345280,
		createdAt: '2025-02-10T09:15:00Z',
		order: 2,
	},
	{
		id: 'file-4',
		name: 'barbershop.svg',
		folderId: 'folder-2a',
		fileUrl:
			'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop',
		mimeType: 'image/svg+xml',
		size: 245760,
		createdAt: '2025-02-15T11:00:00Z',
		order: 0,
	},
	{
		id: 'file-5',
		name: 'BOTAFOGO FC.svg',
		folderId: 'folder-2a',
		fileUrl:
			'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?q=80&w=800&auto=format&fit=crop',
		mimeType: 'image/svg+xml',
		size: 1126400,
		createdAt: '2025-02-20T16:45:00Z',
		order: 1,
	},
	{
		id: 'file-6',
		name: 'Ceara.svg',
		folderId: 'folder-2a',
		fileUrl:
			'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=800&auto=format&fit=crop',
		mimeType: 'image/svg+xml',
		size: 881000,
		createdAt: '2025-02-27T08:00:00Z',
		order: 2,
	},
	{
		id: 'file-7',
		name: 'Logo_Empresa.pdf',
		folderId: 'folder-4',
		fileUrl: 'https://example.com/files/logo.pdf',
		mimeType: 'application/pdf',
		size: 524288,
		createdAt: '2025-01-15T10:00:00Z',
		order: 0,
	},
	{
		id: 'file-8',
		name: 'Padrao_Acrilico.png',
		folderId: 'folder-4',
		fileUrl:
			'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop',
		mimeType: 'image/png',
		size: 1024000,
		createdAt: '2025-01-20T14:00:00Z',
		order: 1,
	},
	{
		id: 'file-9',
		name: 'Tipografia_Canecas.svg',
		folderId: null,
		fileUrl:
			'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=800&auto=format&fit=crop',
		mimeType: 'image/svg+xml',
		size: 76800,
		createdAt: '2025-01-25T09:30:00Z',
		order: 0,
	},
];
