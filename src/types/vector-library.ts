export type VectorLibraryFolder = {
	id: string;
	name: string;
	parentId: string | null;
	order: number;
	createdAt: string;
};

export type VectorLibraryFile = {
	id: string;
	name: string;
	folderId: string | null;
	fileUrl: string;
	mimeType: string;
	size?: number;
	formats?: string[] | null;
	downloadCount?: number;
	category?: string | null;
	featured?: boolean;
	isFavorited?: boolean;
	createdAt: string;
	order: number;
};

export type VectorLibraryNode = VectorLibraryFolder | VectorLibraryFile;

export function isFolder(node: VectorLibraryNode): node is VectorLibraryFolder {
	return 'parentId' in node && !('fileUrl' in node);
}

export type VectorLibraryContents = {
	folders: VectorLibraryFolder[];
	files: VectorLibraryFile[];
	total?: number;
};

export type VectorLibraryStats = {
	totalFiles: number;
	totalCollections: number;
	totalFavorites: number;
	totalDownloads: number;
};

export type VectorLibraryCategory = {
	name: string;
	icon?: string | null;
	count: number;
};
