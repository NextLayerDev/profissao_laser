export interface DoubtReply {
	id: string;
	content: string;
	authorName: string;
	createdAt: string;
	isInstructor: boolean;
}

export interface Doubt {
	id: string;
	content: string;
	authorName: string;
	authorEmail?: string;
	createdAt: string;
	replies: DoubtReply[];
}

export interface LessonRating {
	myRating: number | null;
	averageRating: number;
	totalRatings: number;
}

/** Linha da visão agregada do admin (GET /doubts/admin). */
export interface AdminLessonDoubt {
	id: string;
	lessonId: string;
	customerId: string | null;
	content: string;
	authorName: string;
	createdAt: string;
	repliesCount: number;
	lastReplyAt: string | null;
	answered: boolean;
}

export interface AdminLessonDoubtsResponse {
	doubts: AdminLessonDoubt[];
	total: number;
	unansweredCount: number;
}

export type AdminLessonDoubtsStatus = 'unanswered' | 'answered' | 'all';
