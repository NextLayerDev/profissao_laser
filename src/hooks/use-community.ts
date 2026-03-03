'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	createChannel,
	createPost,
	createProject,
	getChannelMessages,
	getChannels,
	getEvents,
	getMembers,
	getPosts,
	getProjects,
	getRanking,
	sendChannelMessage,
} from '@/services/community';

const COMMUNITY_KEYS = {
	posts: (page?: number, limit?: number) =>
		['community', 'posts', page, limit] as const,
	channels: () => ['community', 'channels'] as const,
	messages: (channelId: string | null, before?: string, limit?: number) =>
		['community', 'messages', channelId, before, limit] as const,
	members: (search?: string, category?: string) =>
		['community', 'members', search, category] as const,
	projects: (page?: number, limit?: number) =>
		['community', 'projects', page, limit] as const,
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
		mutationFn: (name: string) => createChannel({ name }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: COMMUNITY_KEYS.channels() });
			toast.success('Canal criado!');
		},
		onError: () => {
			toast.error('Erro ao criar canal');
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
		mutationFn: (content: string) => {
			if (!channelId) return Promise.reject(new Error('Channel ID required'));
			return sendChannelMessage(channelId, { content });
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

export function useCommunityProjects(page = 1, limit = 12) {
	return useQuery({
		queryKey: COMMUNITY_KEYS.projects(page, limit),
		queryFn: () => getProjects({ page, limit }),
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

export function useCommunityEvents(from?: string, to?: string) {
	return useQuery({
		queryKey: COMMUNITY_KEYS.events(from, to),
		queryFn: () => getEvents({ from, to }),
	});
}

export function useCommunityRanking(period?: 'week' | 'month') {
	return useQuery({
		queryKey: COMMUNITY_KEYS.ranking(period),
		queryFn: () => getRanking({ period }),
	});
}
