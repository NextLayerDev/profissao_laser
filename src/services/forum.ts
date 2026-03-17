import { api } from '@/lib/fetch';
import type {
	ForumCategory,
	ForumPost,
	ForumPostsResponse,
	ForumReply,
} from '@/types/forum';

// ─── Categorias ───────────────────────────────────────────────────────────────

export async function getForumCategories(): Promise<ForumCategory[]> {
	const { data } = await api.get<ForumCategory[]>('/forum/categories');
	return Array.isArray(data) ? data : [];
}

export async function createForumCategory(payload: {
	name: string;
	color: string;
}): Promise<ForumCategory> {
	const { data } = await api.post<ForumCategory>('/forum/category', payload);
	return data;
}

export async function updateForumCategory(
	id: string,
	payload: { name?: string; color?: string },
): Promise<ForumCategory> {
	const { data } = await api.patch<ForumCategory>(
		`/forum/category/${id}`,
		payload,
	);
	return data;
}

export async function deleteForumCategory(id: string): Promise<void> {
	await api.delete(`/forum/category/${id}`);
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export interface GetForumPostsParams {
	page?: number;
	limit?: number;
	categoryId?: string;
	search?: string;
}

export async function getForumPosts(
	params: GetForumPostsParams = {},
): Promise<ForumPostsResponse> {
	const query = new URLSearchParams();
	if (params.page) query.set('page', String(params.page));
	if (params.limit) query.set('limit', String(params.limit));
	if (params.categoryId) query.set('categoryId', params.categoryId);
	if (params.search) query.set('search', params.search);
	const qs = query.toString();
	const { data } = await api.get<ForumPostsResponse>(
		`/forum/posts${qs ? `?${qs}` : ''}`,
	);
	if (Array.isArray(data)) {
		return { posts: data, total: data.length, page: 1, limit: 20 };
	}
	return data;
}

export async function getForumPost(id: string): Promise<ForumPost> {
	const { data } = await api.get<ForumPost>(`/forum/post/${id}`);
	return data;
}

export async function createForumPost(payload: {
	title: string;
	content: string;
	categoryId?: string;
}): Promise<ForumPost> {
	const { data } = await api.post<ForumPost>('/forum/post', payload);
	return data;
}

export async function updateForumPost(
	id: string,
	payload: { title?: string; content?: string; categoryId?: string },
): Promise<ForumPost> {
	const { data } = await api.patch<ForumPost>(`/forum/post/${id}`, payload);
	return data;
}

export async function deleteForumPost(id: string): Promise<void> {
	await api.delete(`/forum/post/${id}`);
}

export async function upvoteForumPost(id: string): Promise<ForumPost> {
	const { data } = await api.post<ForumPost>(`/forum/post/${id}/upvote`);
	return data;
}

// ─── Replies ──────────────────────────────────────────────────────────────────

export async function createForumReply(
	postId: string,
	content: string,
): Promise<ForumReply> {
	const { data } = await api.post<ForumReply>(`/forum/post/${postId}/reply`, {
		content,
	});
	return data;
}

export async function updateForumReply(
	postId: string,
	replyId: string,
	content: string,
): Promise<ForumReply> {
	const { data } = await api.patch<ForumReply>(
		`/forum/post/${postId}/reply/${replyId}`,
		{ content },
	);
	return data;
}

export async function deleteForumReply(
	postId: string,
	replyId: string,
): Promise<void> {
	await api.delete(`/forum/post/${postId}/reply/${replyId}`);
}

export async function acceptForumReply(
	postId: string,
	replyId: string,
): Promise<ForumPost> {
	const { data } = await api.post<ForumPost>(
		`/forum/post/${postId}/reply/${replyId}/accept`,
	);
	return data;
}

export async function upvoteForumReply(
	postId: string,
	replyId: string,
): Promise<ForumReply> {
	const { data } = await api.post<ForumReply>(
		`/forum/post/${postId}/reply/${replyId}/upvote`,
	);
	return data;
}
