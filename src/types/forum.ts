export interface ForumCategory {
	id: string;
	name: string;
	color: string;
	postsCount: number;
}

export interface ForumAuthor {
	id: string;
	name: string;
	isInstructor?: boolean;
}

export interface ForumReply {
	id: string;
	postId: string;
	content: string;
	author: string;
	authorId: string;
	isInstructor: boolean;
	isAccepted: boolean;
	upvotes: number;
	upvotedByMe: boolean;
	createdAt: string;
}

export interface ForumPost {
	id: string;
	title: string;
	content: string;
	author: string;
	authorId: string;
	categoryId?: string;
	categoryName?: string;
	categoryColor?: string;
	upvotes: number;
	upvotedByMe: boolean;
	repliesCount: number;
	acceptedReplyId?: string;
	createdAt: string;
	updatedAt: string;
	replies?: ForumReply[];
}

export interface ForumPostsResponse {
	posts: ForumPost[];
	total: number;
	page: number;
	limit: number;
}
