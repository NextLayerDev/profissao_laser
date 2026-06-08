'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
	BulkUpdateFilesPayload,
	FolderContentsParams,
	UpdateFilePayload,
	VectorFileConfig,
} from '@/services/vector-library';
import {
	bulkUpdateFiles,
	createFile,
	createFolder,
	deleteFile,
	deleteFolder,
	favoriteFile,
	getBreadcrumbPath,
	getFolderContents,
	getVectorLibraryCategories,
	getVectorLibraryFavorites,
	getVectorLibraryFeatured,
	getVectorLibraryFormats,
	getVectorLibraryStats,
	unfavoriteFile,
	updateFile,
	updateFolder,
} from '@/services/vector-library';

const VECTOR_LIBRARY_KEYS = {
	all: ['vector-library'] as const,
	contents: (parentId: string | null) =>
		['vector-library', 'contents', parentId] as const,
};

export function useVectorLibraryContents(
	parentIdOrParams?: string | null | FolderContentsParams,
) {
	const key =
		typeof parentIdOrParams === 'object' && parentIdOrParams !== null
			? ['vector-library', 'contents', parentIdOrParams]
			: VECTOR_LIBRARY_KEYS.contents(
					(parentIdOrParams as string | null) ?? null,
				);

	return useQuery({
		queryKey: key,
		queryFn: () => getFolderContents(parentIdOrParams ?? null),
		staleTime: 5 * 60_000,
	});
}

export function useVectorLibraryStats(enabled = true) {
	return useQuery({
		queryKey: [...VECTOR_LIBRARY_KEYS.all, 'stats'] as const,
		queryFn: getVectorLibraryStats,
		staleTime: 5 * 60_000,
		enabled,
	});
}

export function useVectorLibraryCategories(enabled = true) {
	return useQuery({
		queryKey: [...VECTOR_LIBRARY_KEYS.all, 'categories'] as const,
		queryFn: getVectorLibraryCategories,
		staleTime: 5 * 60_000,
		enabled,
	});
}

export function useVectorLibraryFormats(enabled = true) {
	return useQuery({
		queryKey: [...VECTOR_LIBRARY_KEYS.all, 'formats'] as const,
		queryFn: getVectorLibraryFormats,
		staleTime: 5 * 60_000,
		enabled,
	});
}

export function useVectorLibraryFavorites(enabled = true) {
	return useQuery({
		queryKey: [...VECTOR_LIBRARY_KEYS.all, 'favorites'] as const,
		queryFn: getVectorLibraryFavorites,
		enabled,
	});
}

export function useVectorLibraryFeatured(enabled = true) {
	return useQuery({
		queryKey: [...VECTOR_LIBRARY_KEYS.all, 'featured'] as const,
		queryFn: getVectorLibraryFeatured,
		staleTime: 5 * 60_000,
		enabled,
	});
}

export function useFavoriteFile() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, isFavorited }: { id: string; isFavorited: boolean }) =>
			isFavorited ? unfavoriteFile(id) : favoriteFile(id),
		onSuccess: () => {
			invalidateContents(queryClient);
			toast.success('Favorito atualizado!');
		},
		onError: () => toast.error('Erro ao atualizar favorito'),
	});
}

export function useUnfavoriteFile() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => unfavoriteFile(id),
		onSuccess: () => {
			invalidateContents(queryClient);
			toast.success('Removido dos favoritos!');
		},
		onError: () => toast.error('Erro ao remover favorito'),
	});
}

export function useVectorLibraryBreadcrumbs(folderId: string | null) {
	return useQuery({
		queryKey: ['vector-library', 'breadcrumbs', folderId],
		queryFn: () => getBreadcrumbPath(folderId),
	});
}

function invalidateContents(queryClient: ReturnType<typeof useQueryClient>) {
	queryClient.invalidateQueries({ queryKey: ['vector-library'] });
}

export function useCreateFolder() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			name,
			parentId,
		}: {
			name: string;
			parentId: string | null;
		}) => createFolder(name, parentId),
		onSuccess: () => {
			invalidateContents(queryClient);
			toast.success('Pasta criada!');
		},
		onError: () => toast.error('Erro ao criar pasta'),
	});
}

export function useCreateFile() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			file,
			folderId,
			name,
			config,
		}: {
			file: File;
			folderId: string | null;
			name?: string;
			config?: VectorFileConfig;
		}) => createFile(file, folderId, name, config),
		onSuccess: () => {
			invalidateContents(queryClient);
			toast.success('Ficheiro adicionado!');
		},
		onError: () => toast.error('Erro ao adicionar ficheiro'),
	});
}

export function useUpdateFolder() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, name }: { id: string; name: string }) =>
			updateFolder(id, name),
		onSuccess: () => {
			invalidateContents(queryClient);
			toast.success('Pasta renomeada!');
		},
		onError: () => toast.error('Erro ao renomear pasta'),
	});
}

export function useUpdateFile() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateFilePayload }) =>
			updateFile(id, data),
		onSuccess: () => {
			invalidateContents(queryClient);
			toast.success('Ficheiro atualizado!');
		},
		onError: () => toast.error('Erro ao atualizar ficheiro'),
	});
}

export function useDeleteFolder() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteFolder(id),
		onSuccess: () => {
			invalidateContents(queryClient);
			toast.success('Pasta excluída!');
		},
		onError: () => toast.error('Erro ao excluir pasta'),
	});
}

export function useDeleteFile() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteFile(id),
		onSuccess: () => {
			invalidateContents(queryClient);
			toast.success('Ficheiro excluído!');
		},
		onError: () => toast.error('Erro ao excluir ficheiro'),
	});
}

export function useBulkUpdateFiles() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: BulkUpdateFilesPayload) => bulkUpdateFiles(payload),
		onSuccess: (res) => {
			invalidateContents(queryClient);
			toast.success(`${res.updated} ficheiro(s) atualizado(s)!`);
		},
		onError: () => toast.error('Erro ao atualizar em massa'),
	});
}
