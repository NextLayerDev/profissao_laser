export interface KnowledgeBaseArticle {
	id: string;
	title: string;
	type: 'article' | 'video';
	content?: string | null;
	excerpt?: string | null;
	videoUrl?: string | null;
	readTime?: number | null;
	icon?: string | null;
	category?: string | null;
	isPublished: boolean;
	order: number;
	createdAt: string;
	updatedAt: string;
}
