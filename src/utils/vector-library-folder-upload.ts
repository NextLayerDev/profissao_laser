/** Tipos para FileSystem API (webkit) */
interface FileSystemFileEntry {
	isFile: boolean;
	isDirectory: boolean;
	name: string;
	file(success: (f: File) => void, error?: (e: Error) => void): void;
}

interface FileSystemDirectoryEntry {
	isFile: boolean;
	isDirectory: boolean;
	name: string;
	createReader(): {
		readEntries(
			success: (
				entries: (FileSystemFileEntry | FileSystemDirectoryEntry)[],
			) => void,
			error?: (e: Error) => void,
		): void;
	};
}

/** Extrai todos os ficheiros de um FileSystemDirectoryEntry com paths relativos. */
function readDirectoryRecursive(
	entry: FileSystemDirectoryEntry,
	basePath: string,
): Promise<File[]> {
	const files: File[] = [];
	const reader = entry.createReader();

	const readBatch = (): Promise<
		(FileSystemFileEntry | FileSystemDirectoryEntry)[]
	> =>
		new Promise((resolve, reject) => {
			reader.readEntries(resolve, reject);
		});

	function processEntries(
		entries: (FileSystemFileEntry | FileSystemDirectoryEntry)[],
	): Promise<void> {
		return Promise.all(
			entries.map((e) => {
				const fullPath = basePath ? `${basePath}/${e.name}` : e.name;
				if (e.isFile) {
					return new Promise<void>((res, rej) => {
						(e as FileSystemFileEntry).file((file) => {
							Object.defineProperty(file, 'webkitRelativePath', {
								value: fullPath,
								writable: false,
								configurable: true,
							});
							files.push(file);
							res();
						}, rej);
					});
				}
				if (e.isDirectory) {
					return readDirectoryRecursive(
						e as FileSystemDirectoryEntry,
						fullPath,
					).then((subFiles) => {
						files.push(...subFiles);
					});
				}
				return Promise.resolve();
			}),
		).then(() => {});
	}

	function loop(): Promise<void> {
		return readBatch().then((entries) => {
			if (entries.length === 0) return;
			return processEntries(entries).then(loop);
		});
	}

	return loop().then(() => files);
}

/**
 * Extrai ficheiros de um DataTransferItem (pasta arrastada).
 * Retorna File[] com webkitRelativePath definido.
 */
export async function getFilesFromDroppedFolder(
	item: DataTransferItem,
): Promise<File[]> {
	const getEntry =
		item.webkitGetAsEntry ??
		(item as { getAsEntry?: () => FileSystemDirectoryEntry | null }).getAsEntry;
	const entry = getEntry?.call(item);
	if (!entry || !entry.isDirectory) return [];
	return readDirectoryRecursive(
		entry as unknown as FileSystemDirectoryEntry,
		entry.name,
	);
}

/**
 * Extrai pastas únicas dos caminhos relativos (webkitRelativePath).
 * Ordena por profundidade (raiz primeiro).
 */
export function getUniqueFolderPaths(files: File[]): string[] {
	const paths = new Set<string>();
	for (const f of files) {
		const p = f.webkitRelativePath;
		const dir = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '';
		if (!dir) continue;
		const parts = dir.split('/');
		let acc = '';
		for (let i = 0; i < parts.length; i++) {
			acc = acc ? `${acc}/${parts[i]}` : parts[i];
			paths.add(acc);
		}
	}
	return [...paths].sort((a, b) => a.split('/').length - b.split('/').length);
}

export type FolderUploadOperation =
	| {
			type: 'createFolder';
			path: string;
			name: string;
			parentPath: string | null;
	  }
	| { type: 'uploadFile'; file: File; folderPath: string };

/**
 * Gera lista de operações ordenadas para criar pastas e enviar ficheiros.
 */
export function parseFolderUpload(files: File[]): FolderUploadOperation[] {
	const ops: FolderUploadOperation[] = [];
	const folderPaths = getUniqueFolderPaths(files);

	for (const path of folderPaths) {
		const name = path.includes('/')
			? path.slice(path.lastIndexOf('/') + 1)
			: path;
		const parentPath = path.includes('/')
			? path.slice(0, path.lastIndexOf('/'))
			: null;
		ops.push({ type: 'createFolder', path, name, parentPath });
	}

	for (const file of files) {
		const p = file.webkitRelativePath;
		const folderPath = p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '';
		ops.push({ type: 'uploadFile', file, folderPath });
	}

	return ops;
}
