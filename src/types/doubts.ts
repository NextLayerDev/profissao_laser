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
