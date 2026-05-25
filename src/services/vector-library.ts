import { api } from '@/lib/fetch';
import type {
	VectorLibraryCategory,
	VectorLibraryContents,
	VectorLibraryFile,
	VectorLibraryFolder,
	VectorLibraryFormat,
	VectorLibraryStats,
} from '@/types/vector-library';

// ─── Query params for folder contents ────────────────────────────────────────

export interface FolderContentsParams {
	parentId?: string | null;
	search?: string;
	category?: string;
	format?: string;
	sort?: string;
	page?: number;
	limit?: number;
}

/** Lista pastas e ficheiros numa pasta. parentId null = raiz. */
export async function getFolderContents(
	parentIdOrParams?: string | null | FolderContentsParams,
): Promise<VectorLibraryContents> {
	let params: Record<string, unknown> | undefined;

	if (
		typeof parentIdOrParams === 'object' &&
		parentIdOrParams !== null &&
		!Array.isArray(parentIdOrParams)
	) {
		const { parentId, ...rest } = parentIdOrParams;
		params = { ...rest };
		if (parentId != null && parentId !== '') {
			params.parentId = parentId;
		}
	} else if (parentIdOrParams != null && parentIdOrParams !== '') {
		params = { parentId: parentIdOrParams };
	}

	const { data } = await api.get<VectorLibraryContents>(
		'/community/vector-library/contents',
		{ params },
	);
	return (
		data ?? {
			folders: [],
			files: [],
		}
	);
}

// ─── Stats, Categories, Favorites, Featured ─────────────────────────────────

export async function getVectorLibraryStats(): Promise<VectorLibraryStats> {
	const { data } = await api.get<VectorLibraryStats>(
		'/community/vector-library/stats',
	);
	return data;
}

export async function getVectorLibraryCategories(): Promise<
	VectorLibraryCategory[]
> {
	const { data } = await api.get<VectorLibraryCategory[]>(
		'/community/vector-library/categories',
	);
	return Array.isArray(data) ? data : [];
}

export async function getVectorLibraryFormats(): Promise<
	VectorLibraryFormat[]
> {
	const { data } = await api.get<VectorLibraryFormat[]>(
		'/community/vector-library/formats',
	);
	return Array.isArray(data) ? data : [];
}

export async function getVectorLibraryFavorites(): Promise<
	VectorLibraryFile[]
> {
	const { data } = await api.get<VectorLibraryFile[]>(
		'/community/vector-library/favorites',
	);
	return Array.isArray(data) ? data : [];
}

export async function getVectorLibraryFeatured(): Promise<VectorLibraryFile[]> {
	const { data } = await api.get<VectorLibraryFile[]>(
		'/community/vector-library/featured',
	);
	return Array.isArray(data) ? data : [];
}

export async function favoriteFile(id: string): Promise<void> {
	await api.post(
		`/community/vector-library/files/${encodeURIComponent(id)}/favorite`,
	);
}

export async function unfavoriteFile(id: string): Promise<void> {
	await api.delete(
		`/community/vector-library/files/${encodeURIComponent(id)}/favorite`,
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

/** Config opcional de um vetor (categoria/formatos/destaque). */
export interface VectorFileConfig {
	category?: string | null;
	formats?: string[] | null;
	featured?: boolean;
}

/** Payload de atualização de ficheiro (admin). */
export interface UpdateFilePayload extends VectorFileConfig {
	name?: string;
}

/** Upload de ficheiro (admin). folderId como query param. */
export async function createFile(
	file: File,
	folderId: string | null,
	name?: string,
	config?: VectorFileConfig,
): Promise<VectorLibraryFile> {
	const formData = new FormData();
	formData.append('file', file);
	if (name?.trim()) formData.append('name', name.trim());
	if (config?.category != null && config.category !== '')
		formData.append('category', config.category);
	if (config?.formats && config.formats.length > 0)
		formData.append('formats', config.formats.join(','));
	if (config?.featured != null)
		formData.append('featured', String(config.featured));

	const { data } = await api.post<VectorLibraryFile>(
		'/community/vector-library/files',
		formData,
		{
			params: folderId != null && folderId !== '' ? { folderId } : undefined,
		},
	);
	return data as VectorLibraryFile;
}

/** Atualiza ficheiro (admin): nome, categoria, formatos e/ou destaque. */
export async function updateFile(
	id: string,
	data: UpdateFilePayload,
): Promise<VectorLibraryFile> {
	const { data: res } = await api.patch<VectorLibraryFile>(
		`/community/vector-library/files/${encodeURIComponent(id)}`,
		data,
	);
	return res as VectorLibraryFile;
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
