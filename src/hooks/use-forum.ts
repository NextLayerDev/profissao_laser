'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GetForumPostsParams } from '@/services/forum';
import {
	acceptForumReply,
	createForumCategory,
	createForumPost,
	createForumReply,
	deleteForumCategory,
	deleteForumPost,
	deleteForumReply,
	getForumCategories,
	getForumPost,
	getForumPosts,
	updateForumCategory,
	updateForumPost,
	upvoteForumPost,
	upvoteForumReply,
} from '@/services/forum';

const QUERY_KEY = ['forum'] as const;

// ─── Categorias ───────────────────────────────────────────────────────────────

export function useForumCategories(enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'categories'] as const,
		queryFn: getForumCategories,
		enabled,
	});
}

export function useCreateForumCategory() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: { name: string; color: string }) =>
			createForumCategory(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'categories'] });
		},
	});
}

export function useUpdateForumCategory() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			...payload
		}: {
			id: string;
			name?: string;
			color?: string;
		}) => updateForumCategory(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'categories'] });
		},
	});
}

export function useDeleteForumCategory() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteForumCategory(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'categories'] });
		},
	});
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export function useForumPosts(
	params: GetForumPostsParams = {},
	enabled = true,
) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'posts', params] as const,
		queryFn: () => getForumPosts(params),
		enabled,
	});
}

export function useForumPost(id: string | null, enabled = true) {
	return useQuery({
		queryKey: [...QUERY_KEY, 'post', id] as const,
		queryFn: () => {
			if (!id) throw new Error('ID required');
			return getForumPost(id);
		},
		enabled: !!id && enabled,
	});
}

export function useCreateForumPost() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: {
			title: string;
			content: string;
			categoryId?: string;
		}) => createForumPost(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'posts'] });
		},
	});
}

export function useUpdateForumPost() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			...payload
		}: {
			id: string;
			title?: string;
			content?: string;
			categoryId?: string;
		}) => updateForumPost(id, payload),
		onSuccess: (_data, { id }) => {
			qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'posts'] });
			qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'post', id] });
		},
	});
}

export function useDeleteForumPost() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteForumPost(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'posts'] });
		},
	});
}

export function useUpvoteForumPost() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => upvoteForumPost(id),
		onSuccess: (_data, id) => {
			qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'posts'] });
			qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'post', id] });
		},
	});
}

// ─── Replies ──────────────────────────────────────────────────────────────────

export function useCreateForumReply(postId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (content: string) => createForumReply(postId, content),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'post', postId] });
			qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'posts'] });
		},
	});
}

export function useDeleteForumReply(postId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (replyId: string) => deleteForumReply(postId, replyId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'post', postId] });
			qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'posts'] });
		},
	});
}

export function useAcceptForumReply(postId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (replyId: string) => acceptForumReply(postId, replyId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'post', postId] });
		},
	});
}

export function useUpvoteForumReply(postId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (replyId: string) => upvoteForumReply(postId, replyId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'post', postId] });
		},
	});
}
