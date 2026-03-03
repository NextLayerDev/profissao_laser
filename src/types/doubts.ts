import { z } from 'zod';

export const doubtReplySchema = z.object({
	id: z.string(),
	content: z.string(),
	authorName: z.string(),
	createdAt: z.string(),
	isInstructor: z.boolean(),
});

export const doubtSchema = z.object({
	id: z.string(),
	content: z.string(),
	authorName: z.string(),
	authorEmail: z.string().optional(),
	createdAt: z.string(),
	replies: z.array(doubtReplySchema).default([]),
});

export const lessonRatingSchema = z.object({
	myRating: z.number().nullable(),
	averageRating: z.number(),
	totalRatings: z.number(),
});

export type DoubtReply = z.infer<typeof doubtReplySchema>;
export type Doubt = z.infer<typeof doubtSchema>;
export type LessonRating = z.infer<typeof lessonRatingSchema>;
