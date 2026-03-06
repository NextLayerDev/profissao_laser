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
};
