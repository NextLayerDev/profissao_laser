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

export type UploadFolderProgress = (
	done: number,
	total: number,
	phase: 'folders' | 'files',
	current?: string,
) => void;

export type UploadFolderResult = {
	foldersCreated: number;
	filesUploaded: number;
	filesFailed: { name: string; error: string }[];
};

/**
 * Faz upload de uma pasta inteira mantendo a estrutura hierárquica.
 * Cria pastas por ordem de profundidade e envia cada ficheiro na pasta correta.
 */
export async function uploadFolderStructure(
	files: File[],
	parentFolderId: string | null,
	onProgress?: UploadFolderProgress,
): Promise<UploadFolderResult> {
	const { getUniqueFolderPaths } = await import(
		'@/utils/vector-library-folder-upload'
	);

	const folderPaths = getUniqueFolderPaths(files);
	const skipPatterns = ['.DS_Store', 'Thumbs.db', 'desktop.ini'];
	const filesToUpload = files.filter(
		(f) => !skipPatterns.some((p) => f.name === p || f.name.endsWith(`/${p}`)),
	);
	const total = folderPaths.length + filesToUpload.length;
	let done = 0;

	const folderIdMap = new Map<string, string | null>();
	folderIdMap.set('', parentFolderId);

	for (const path of folderPaths) {
		const name = path.includes('/')
			? path.slice(path.lastIndexOf('/') + 1)
			: path;
		const parentPath = path.includes('/')
			? path.slice(0, path.lastIndexOf('/'))
			: '';
		const parentId = folderIdMap.get(parentPath) ?? parentFolderId;

		const folder = await createFolder(name, parentId);
		folderIdMap.set(path, folder.id);
		done++;
		onProgress?.(done, total, 'folders', path);
	}

	const filesFailed: { name: string; error: string }[] = [];
	let filesUploaded = 0;

	for (const file of filesToUpload) {
		const p =
			(file as File & { webkitRelativePath?: string }).webkitRelativePath ??
			file.name ??
			'';
		const folderPath = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '';
		const folderId = folderIdMap.get(folderPath) ?? parentFolderId;

		try {
			await createFile(file, folderId ?? null, file.name);
			filesUploaded++;
		} catch (err) {
			const axiosErr = err as {
				response?: { data?: unknown };
				message?: string;
			};
			const data = axiosErr?.response?.data;
			let detail = axiosErr?.message ?? String(err);
			if (typeof data === 'object' && data !== null) {
				const msg =
					(data as { message?: string; error?: string }).message ??
					(data as { error?: string }).error;
				if (msg) detail = String(msg);
			}
			filesFailed.push({ name: file.name, error: detail });
		}
		done++;
		onProgress?.(done, total, 'files', file.name);
	}

	return {
		foldersCreated: folderPaths.length,
		filesUploaded,
		filesFailed,
	};
}
