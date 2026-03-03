import { api } from '@/lib/fetch';
import type {
	Channel,
	ChannelMessage,
	Event,
	Member,
	Post,
	Project,
	RankingUser,
} from '@/types/community';

export async function getPosts(params?: {
	page?: number;
	limit?: number;
}): Promise<Post[]> {
	const { data } = await api.get<Post[]>('/community/posts', {
		params: params ? { page: params.page, limit: params.limit } : undefined,
	});
	return data ?? [];
}

export async function createPost(body: {
	content: string;
	image?: string;
}): Promise<Post> {
	const { data } = await api.post<Post>('/community/posts', body);
	return data as Post;
}

export async function getChannels(): Promise<Channel[]> {
	const { data } = await api.get<Channel[]>('/community/channels');
	return data ?? [];
}

export async function createChannel(body: {
	name: string;
}): Promise<{ id: string }> {
	const { data } = await api.post<{ id: string }>('/community/channels', body);
	return data as { id: string };
}

export async function getChannelMessages(
	channelId: string,
	params?: { before?: string; limit?: number },
): Promise<ChannelMessage[]> {
	const { data } = await api.get<ChannelMessage[]>(
		`/community/channels/${encodeURIComponent(channelId)}/messages`,
		{
			params: params
				? { before: params.before, limit: params.limit }
				: undefined,
		},
	);
	return data ?? [];
}

export async function sendChannelMessage(
	channelId: string,
	body: { content: string },
): Promise<ChannelMessage> {
	const { data } = await api.post<ChannelMessage>(
		`/community/channels/${encodeURIComponent(channelId)}/messages`,
		body,
	);
	return data as ChannelMessage;
}

export async function getMembers(params?: {
	search?: string;
	category?: string;
}): Promise<Member[]> {
	const { data } = await api.get<Member[]>('/community/members', {
		params: params ?? undefined,
	});
	return data ?? [];
}

export async function getProjects(params?: {
	page?: number;
	limit?: number;
}): Promise<Project[]> {
	const { data } = await api.get<Project[]>('/community/projects', {
		params: params ? { page: params.page, limit: params.limit } : undefined,
	});
	return data ?? [];
}

export async function createProject(body: {
	author: string;
	title: string;
	description: string;
	img?: string;
	material?: string;
	technique?: string;
}): Promise<Project> {
	const { data } = await api.post<Project>('/community/projects', body);
	return data as Project;
}

export async function getEvents(params?: {
	from?: string;
	to?: string;
}): Promise<Event[]> {
	const { data } = await api.get<Event[]>('/community/events', {
		params: params ?? undefined,
	});
	return data ?? [];
}

export async function getRanking(params?: {
	period?: 'week' | 'month';
}): Promise<{ top: RankingUser[]; rest: RankingUser[] }> {
	const { data } = await api.get<{ top: RankingUser[]; rest: RankingUser[] }>(
		'/community/ranking',
		{ params: params ?? undefined },
	);
	return data ?? { top: [], rest: [] };
}
