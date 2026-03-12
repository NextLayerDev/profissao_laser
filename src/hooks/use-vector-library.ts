'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	createFile,
	createFolder,
	deleteFile,
	deleteFolder,
	getBreadcrumbPath,
	getFolderContents,
	updateFile,
	updateFolder,
} from '@/services/vector-library';

const VECTOR_LIBRARY_KEYS = {
	contents: (parentId: string | null) =>
		['vector-library', 'contents', parentId] as const,
};

export function useVectorLibraryContents(parentId?: string | null) {
	return useQuery({
		queryKey: VECTOR_LIBRARY_KEYS.contents(parentId ?? null),
		queryFn: () => getFolderContents(parentId ?? null),
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
		}: {
			file: File;
			folderId: string | null;
			name?: string;
		}) => createFile(file, folderId, name),
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
		mutationFn: ({ id, name }: { id: string; name: string }) =>
			updateFile(id, name),
		onSuccess: () => {
			invalidateContents(queryClient);
			toast.success('Ficheiro renomeado!');
		},
		onError: () => toast.error('Erro ao renomear ficheiro'),
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
