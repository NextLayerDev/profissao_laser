import { api } from '@/lib/fetch';
import type {
	Channel,
	ChannelMessage,
	Event,
	Member,
	Post,
	Project,
	ProjectComment,
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
	adminOnly?: boolean;
}): Promise<{ id: string }> {
	const { data } = await api.post<{ id: string }>('/community/channels', {
		...body,
		adminOnly: body.adminOnly ?? false,
	});
	return data as { id: string };
}

export async function updateChannel(
	channelId: string,
	body: { name: string; description: string; adminOnly?: boolean },
): Promise<Channel> {
	const { data } = await api.patch<Channel>(
		`/community/channels/${encodeURIComponent(channelId)}`,
		body,
	);
	return data as Channel;
}

export async function deleteChannel(channelId: string): Promise<void> {
	await api.delete(`/community/channels/${encodeURIComponent(channelId)}`);
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
	payload: { content: string; file?: File },
): Promise<ChannelMessage> {
	const formData = new FormData();
	formData.append('content', payload.content);
	if (payload.file) {
		formData.append('file', payload.file);
	}
	const { data } = await api.post<ChannelMessage>(
		`/community/channels/${encodeURIComponent(channelId)}/messages`,
		formData,
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
	material?: string;
	technique?: string;
	search?: string;
	sort?: 'recent' | 'likes';
}): Promise<Project[]> {
	const { data } = await api.get<Project[]>('/community/projects', {
		params: params ?? undefined,
	});
	return data ?? [];
}

export async function getProject(projectId: string): Promise<Project> {
	const { data } = await api.get<Project>(
		`/community/projects/${encodeURIComponent(projectId)}`,
	);
	return data as Project;
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

export async function updateProject(
	projectId: string,
	body: {
		title?: string;
		description?: string;
		img?: string;
		material?: string;
		technique?: string;
	},
): Promise<Project> {
	const { data } = await api.patch<Project>(
		`/community/projects/${encodeURIComponent(projectId)}`,
		body,
	);
	return data as Project;
}

export async function deleteProject(projectId: string): Promise<void> {
	await api.delete(`/community/projects/${encodeURIComponent(projectId)}`);
}

export async function getProjectComments(
	projectId: string,
	params?: { page?: number; limit?: number },
): Promise<ProjectComment[]> {
	const { data } = await api.get<ProjectComment[]>(
		`/community/projects/${encodeURIComponent(projectId)}/comments`,
		{ params: params ?? undefined },
	);
	return data ?? [];
}

export async function createProjectComment(
	projectId: string,
	body: { content: string },
): Promise<ProjectComment> {
	const { data } = await api.post<ProjectComment>(
		`/community/projects/${encodeURIComponent(projectId)}/comments`,
		body,
	);
	return data as ProjectComment;
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

export async function createEvent(body: {
	title: string;
	description?: string;
	date: string;
	time?: string;
	type: Event['type'];
}): Promise<Event> {
	const { data } = await api.post<Event>('/community/events', body);
	return data as Event;
}

export async function updateEvent(
	eventId: string,
	data: {
		title?: string;
		description?: string;
		date?: string;
		time?: string;
		type?: Event['type'];
	},
): Promise<Event> {
	const { data: result } = await api.patch<Event>(
		`/community/events/${encodeURIComponent(eventId)}`,
		data,
	);
	return result as Event;
}

export async function deleteEvent(eventId: string): Promise<void> {
	await api.delete(`/community/events/${encodeURIComponent(eventId)}`);
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
