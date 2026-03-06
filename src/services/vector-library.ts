import { api } from '@/lib/fetch';
import type {
	VectorLibraryContents,
	VectorLibraryFile,
	VectorLibraryFolder,
} from '@/types/vector-library';

/** Lista pastas e ficheiros numa pasta. parentId null = raiz. */
export async function getFolderContents(
	parentId?: string | null,
): Promise<VectorLibraryContents> {
	const { data } = await api.get<VectorLibraryContents>(
		'/community/vector-library/contents',
		{
			params: parentId != null && parentId !== '' ? { parentId } : undefined,
		},
	);
	return (
		data ?? {
			folders: [],
			files: [],
		}
	);
}

export type BreadcrumbItem = { id: string | null; name: string };

/** Obtém o caminho de breadcrumbs até uma pasta. */
export async function getBreadcrumbPath(
	folderId: string | null,
): Promise<BreadcrumbItem[]> {
	const { data } = await api.get<BreadcrumbItem[]>(
		'/community/vector-library/breadcrumbs',
		{
			params: folderId != null && folderId !== '' ? { folderId } : undefined,
		},
	);
	return data ?? [{ id: null, name: 'Biblioteca' }];
}

/** Cria pasta (admin). */
export async function createFolder(
	name: string,
	parentId: string | null,
): Promise<VectorLibraryFolder> {
	const { data } = await api.post<VectorLibraryFolder>(
		'/community/vector-library/folders',
		{ name, parentId },
	);
	return data as VectorLibraryFolder;
}

/** Renomeia pasta (admin). */
export async function updateFolder(
	id: string,
	name: string,
): Promise<VectorLibraryFolder> {
	const { data } = await api.patch<VectorLibraryFolder>(
		`/community/vector-library/folders/${encodeURIComponent(id)}`,
		{ name },
	);
	return data as VectorLibraryFolder;
}

/** Exclui pasta e conteúdo recursivo (admin). */
export async function deleteFolder(id: string): Promise<void> {
	await api.delete(
		`/community/vector-library/folders/${encodeURIComponent(id)}`,
	);
}

/** Upload de ficheiro (admin). folderId como query param. */
export async function createFile(
	file: File,
	folderId: string | null,
	name?: string,
): Promise<VectorLibraryFile> {
	const formData = new FormData();
	formData.append('file', file);
	if (name?.trim()) formData.append('name', name.trim());

	const { data } = await api.post<VectorLibraryFile>(
		'/community/vector-library/files',
		formData,
		{
			params: folderId != null && folderId !== '' ? { folderId } : undefined,
		},
	);
	return data as VectorLibraryFile;
}

/** Renomeia ficheiro (admin). */
export async function updateFile(
	id: string,
	name: string,
): Promise<VectorLibraryFile> {
	const { data } = await api.patch<VectorLibraryFile>(
		`/community/vector-library/files/${encodeURIComponent(id)}`,
		{ name },
	);
	return data as VectorLibraryFile;
}

/** Exclui ficheiro (admin). */
export async function deleteFile(id: string): Promise<void> {
	await api.delete(`/community/vector-library/files/${encodeURIComponent(id)}`);
}
