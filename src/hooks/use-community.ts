'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	createChannel,
	createEvent,
	createPost,
	createProject,
	createProjectComment,
	deleteChannel,
	deleteEvent,
	deleteProject,
	getChannelMessages,
	getChannels,
	getEvents,
	getMembers,
	getPosts,
	getProject,
	getProjectComments,
	getProjects,
	getRanking,
	sendChannelMessage,
	updateChannel,
	updateEvent,
	updateProject,
} from '@/services/community';

const COMMUNITY_KEYS = {
	posts: (page?: number, limit?: number) =>
		['community', 'posts', page, limit] as const,
	channels: () => ['community', 'channels'] as const,
	messages: (channelId: string | null, before?: string, limit?: number) =>
		['community', 'messages', channelId, before, limit] as const,
	members: (search?: string, category?: string) =>
		['community', 'members', search, category] as const,
	projects: (
		page?: number,
		limit?: number,
		material?: string,
		technique?: string,
		search?: string,
		sort?: string,
	) =>
		[
			'community',
			'projects',
			page,
			limit,
			material,
			technique,
			search,
			sort,
		] as const,
	project: (id: string | null) => ['community', 'project', id] as const,
	projectComments: (projectId: string | null, page?: number) =>
		['community', 'projectComments', projectId, page] as const,
	events: (from?: string, to?: string) =>
		['community', 'events', from, to] as const,
	ranking: (period?: string) => ['community', 'ranking', period] as const,
};

export function useCommunityPosts(page = 1, limit = 20) {
	return useQuery({
		queryKey: COMMUNITY_KEYS.posts(page, limit),
		queryFn: () => getPosts({ page, limit }),
	});
}

export function useCreatePost() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: { content: string; image?: string }) => createPost(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
			toast.success('Post publicado!');
		},
		onError: () => {
			toast.error('Erro ao publicar post');
		},
	});
}

export function useCommunityChannels() {
	return useQuery({
		queryKey: COMMUNITY_KEYS.channels(),
		queryFn: getChannels,
	});
}

export function useCreateChannel() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: { name: string; adminOnly?: boolean }) =>
			createChannel(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.channels() });
			toast.success('Canal criado!');
		},
		onError: () => {
			toast.error('Erro ao criar canal');
		},
	});
}

export function useUpdateChannel() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			channelId,
			data,
		}: {
			channelId: string;
			data: { name: string; description: string; adminOnly?: boolean };
		}) => updateChannel(channelId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.channels() });
			toast.success('Canal atualizado!');
		},
		onError: () => {
			toast.error('Erro ao atualizar canal');
		},
	});
}

export function useDeleteChannel() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (channelId: string) => deleteChannel(channelId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.channels() });
			toast.success('Canal excluído');
		},
		onError: () => {
			toast.error('Erro ao excluir canal');
		},
	});
}

export function useChannelMessages(
	channelId: string | null,
	options?: { before?: string; limit?: number },
) {
	return useQuery({
		queryKey: COMMUNITY_KEYS.messages(
			channelId,
			options?.before,
			options?.limit,
		),
		queryFn: () => {
			if (!channelId) return Promise.reject(new Error('Channel ID required'));
			return getChannelMessages(channelId, {
				before: options?.before,
				limit: options?.limit ?? 50,
			});
		},
		enabled: !!channelId,
	});
}

export function useSendChannelMessage(channelId: string | null) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: { content: string; file?: File }) => {
			if (!channelId) return Promise.reject(new Error('Channel ID required'));
			return sendChannelMessage(channelId, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['community', 'messages', channelId],
			});
		},
		onError: () => {
			toast.error('Erro ao enviar mensagem');
		},
	});
}

export function useCommunityMembers(search?: string, category?: string) {
	return useQuery({
		queryKey: COMMUNITY_KEYS.members(search, category),
		queryFn: () => getMembers({ search, category }),
	});
}

export function useCommunityProjects(
	page = 1,
	limit = 12,
	params?: {
		material?: string;
		technique?: string;
		search?: string;
		sort?: 'recent' | 'likes';
	},
) {
	return useQuery({
		queryKey: COMMUNITY_KEYS.projects(
			page,
			limit,
			params?.material,
			params?.technique,
			params?.search,
			params?.sort,
		),
		queryFn: () =>
			getProjects({
				page,
				limit,
				material: params?.material || undefined,
				technique: params?.technique || undefined,
				search: params?.search || undefined,
				sort: params?.sort,
			}),
	});
}

export function useProject(projectId: string | null) {
	return useQuery({
		queryKey: COMMUNITY_KEYS.project(projectId),
		queryFn: () => {
			if (!projectId) return Promise.reject(new Error('Project ID required'));
			return getProject(projectId);
		},
		enabled: !!projectId,
	});
}

export function useCreateProject() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: {
			author: string;
			title: string;
			description: string;
			img?: string;
			material?: string;
			technique?: string;
		}) => createProject(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['community', 'projects'] });
			toast.success('Projeto enviado!');
		},
		onError: () => {
			toast.error('Erro ao enviar projeto');
		},
	});
}

export function useUpdateProject() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			projectId,
			data,
		}: {
			projectId: string;
			data: {
				title?: string;
				description?: string;
				img?: string;
				material?: string;
				technique?: string;
			};
		}) => updateProject(projectId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['community', 'projects'] });
			queryClient.invalidateQueries({ queryKey: ['community', 'project'] });
			toast.success('Projeto atualizado!');
		},
		onError: () => {
			toast.error('Erro ao atualizar projeto');
		},
	});
}

export function useDeleteProject() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (projectId: string) => deleteProject(projectId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['community', 'projects'] });
			queryClient.invalidateQueries({ queryKey: ['community', 'project'] });
			toast.success('Projeto removido');
		},
		onError: () => {
			toast.error('Erro ao remover projeto');
		},
	});
}

export function useProjectComments(
	projectId: string | null,
	options?: { page?: number; limit?: number },
) {
	return useQuery({
		queryKey: COMMUNITY_KEYS.projectComments(projectId, options?.page),
		queryFn: () => {
			if (!projectId) return Promise.reject(new Error('Project ID required'));
			return getProjectComments(projectId, {
				page: options?.page,
				limit: options?.limit ?? 50,
			});
		},
		enabled: !!projectId,
	});
}

export function useCreateProjectComment(projectId: string | null) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: { content: string }) => {
			if (!projectId) return Promise.reject(new Error('Project ID required'));
			return createProjectComment(projectId, body);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['community', 'projectComments', projectId],
			});
			queryClient.invalidateQueries({ queryKey: ['community', 'projects'] });
			queryClient.invalidateQueries({ queryKey: ['community', 'project'] });
			toast.success('Comentário enviado!');
		},
		onError: () => {
			toast.error('Erro ao enviar comentário');
		},
	});
}

export function useCommunityEvents(from?: string, to?: string) {
	return useQuery({
		queryKey: COMMUNITY_KEYS.events(from, to),
		queryFn: () => getEvents({ from, to }),
	});
}

export function useCreateEvent() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: {
			title: string;
			description?: string;
			date: string;
			time?: string;
			type: 'workshop' | 'live' | 'qa';
		}) => createEvent(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['community', 'events'] });
			toast.success('Evento criado!');
		},
		onError: (err) => {
			toast.error(err instanceof Error ? err.message : 'Erro ao criar evento');
		},
	});
}

export function useUpdateEvent() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string;
			data: {
				title: string;
				description?: string;
				date: string;
				time?: string;
				type: 'workshop' | 'live' | 'qa';
			};
		}) => updateEvent(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['community', 'events'] });
			toast.success('Evento atualizado!');
		},
		onError: (err) => {
			toast.error(
				err instanceof Error ? err.message : 'Erro ao atualizar evento',
			);
		},
	});
}

export function useDeleteEvent() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteEvent(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['community', 'events'] });
			toast.success('Evento removido');
		},
		onError: (err) => {
			toast.error(
				err instanceof Error ? err.message : 'Erro ao remover evento',
			);
		},
	});
}

export function useCommunityRanking(period?: 'week' | 'month') {
	return useQuery({
		queryKey: COMMUNITY_KEYS.ranking(period),
		queryFn: () => getRanking({ period }),
	});
}
