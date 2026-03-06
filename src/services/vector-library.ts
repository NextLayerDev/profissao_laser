import {
	MOCK_VECTOR_LIBRARY_FILES,
	MOCK_VECTOR_LIBRARY_FOLDERS,
} from '@/mocks/vector-library';
import type {
	VectorLibraryContents,
	VectorLibraryFile,
	VectorLibraryFolder,
} from '@/types/vector-library';

/** Lista pastas e ficheiros numa pasta. parentId null = raiz. Mock até API. */
export async function getFolderContents(
	parentId?: string | null,
): Promise<VectorLibraryContents> {
	const pid = parentId ?? null;
	const folders = MOCK_VECTOR_LIBRARY_FOLDERS.filter(
		(f) => f.parentId === pid,
	).sort((a, b) => a.order - b.order);
	const files = MOCK_VECTOR_LIBRARY_FILES.filter(
		(f) => f.folderId === pid,
	).sort((a, b) => a.order - b.order);
	return { folders, files };
}

/** Lista pastas. Mock até API. */
export async function getFolders(
	parentId?: string | null,
): Promise<VectorLibraryFolder[]> {
	const { folders } = await getFolderContents(parentId);
	return folders;
}

/** Lista ficheiros. Mock até API. */
export async function getFiles(
	folderId?: string | null,
): Promise<VectorLibraryFile[]> {
	const { files } = await getFolderContents(folderId);
	return files;
}

/** Obtém pasta por id. Mock até API. */
export async function getFolderById(
	id: string,
): Promise<VectorLibraryFolder | null> {
	return MOCK_VECTOR_LIBRARY_FOLDERS.find((f) => f.id === id) ?? null;
}

export type BreadcrumbItem = { id: string | null; name: string };

/** Constrói o caminho de breadcrumbs até uma pasta. Mock até API. */
export async function getBreadcrumbPath(
	folderId: string | null,
): Promise<BreadcrumbItem[]> {
	const path: BreadcrumbItem[] = [{ id: null, name: 'Biblioteca' }];
	if (!folderId) return path;
	let current: VectorLibraryFolder | null = await getFolderById(folderId);
	const chain: VectorLibraryFolder[] = [];
	while (current) {
		chain.unshift(current);
		current = current.parentId
			? ((await getFolderById(current.parentId)) ?? null)
			: null;
	}
	for (const f of chain) {
		path.push({ id: f.id, name: f.name });
	}
	return path;
}

/** Cria pasta. Mock até API. */
export async function createFolder(
	name: string,
	parentId: string | null,
): Promise<VectorLibraryFolder> {
	const newFolder: VectorLibraryFolder = {
		id: `folder-${Date.now()}`,
		name,
		parentId,
		order: MOCK_VECTOR_LIBRARY_FOLDERS.filter((f) => f.parentId === parentId)
			.length,
		createdAt: new Date().toISOString(),
	};
	MOCK_VECTOR_LIBRARY_FOLDERS.push(newFolder);
	return newFolder;
}

/** Atualiza pasta (renomear). Mock até API. */
export async function updateFolder(
	id: string,
	name: string,
): Promise<VectorLibraryFolder> {
	const idx = MOCK_VECTOR_LIBRARY_FOLDERS.findIndex((f) => f.id === id);
	if (idx < 0) throw new Error('Pasta não encontrada');
	MOCK_VECTOR_LIBRARY_FOLDERS[idx] = {
		...MOCK_VECTOR_LIBRARY_FOLDERS[idx],
		name,
	};
	return MOCK_VECTOR_LIBRARY_FOLDERS[idx];
}

/** Exclui pasta (e conteúdo recursivo). Mock até API. */
export async function deleteFolder(id: string): Promise<void> {
	const toDelete = new Set<string>([id]);
	const collect = (pid: string | null) => {
		for (const f of MOCK_VECTOR_LIBRARY_FOLDERS) {
			if (f.parentId === pid) {
				toDelete.add(f.id);
				collect(f.id);
			}
		}
	};
	collect(id);
	for (let i = MOCK_VECTOR_LIBRARY_FILES.length - 1; i >= 0; i--) {
		const fid = MOCK_VECTOR_LIBRARY_FILES[i].folderId;
		if (fid && toDelete.has(fid)) MOCK_VECTOR_LIBRARY_FILES.splice(i, 1);
	}
	for (let i = MOCK_VECTOR_LIBRARY_FOLDERS.length - 1; i >= 0; i--) {
		if (toDelete.has(MOCK_VECTOR_LIBRARY_FOLDERS[i].id))
			MOCK_VECTOR_LIBRARY_FOLDERS.splice(i, 1);
	}
}

/** Cria ficheiro (upload). Mock até API. */
export async function createFile(
	file: File,
	folderId: string | null,
	name?: string,
): Promise<VectorLibraryFile> {
	const fileName = name ?? file.name;
	const mimeType = file.type || 'application/octet-stream';
	const existing = MOCK_VECTOR_LIBRARY_FILES.filter(
		(f) => f.folderId === folderId,
	).length;
	const newFile: VectorLibraryFile = {
		id: `file-${Date.now()}`,
		name: fileName,
		folderId,
		fileUrl: URL.createObjectURL(file),
		mimeType,
		size: file.size,
		createdAt: new Date().toISOString(),
		order: existing,
	};
	MOCK_VECTOR_LIBRARY_FILES.push(newFile);
	return newFile;
}

/** Atualiza ficheiro (renomear). Mock até API. */
export async function updateFile(
	id: string,
	name: string,
): Promise<VectorLibraryFile> {
	const idx = MOCK_VECTOR_LIBRARY_FILES.findIndex((f) => f.id === id);
	if (idx < 0) throw new Error('Ficheiro não encontrado');
	MOCK_VECTOR_LIBRARY_FILES[idx] = {
		...MOCK_VECTOR_LIBRARY_FILES[idx],
		name,
	};
	return MOCK_VECTOR_LIBRARY_FILES[idx];
}

/** Exclui ficheiro. Mock até API. */
export async function deleteFile(id: string): Promise<void> {
	const idx = MOCK_VECTOR_LIBRARY_FILES.findIndex((f) => f.id === id);
	if (idx >= 0) MOCK_VECTOR_LIBRARY_FILES.splice(idx, 1);
}
