import { z } from 'zod';

export const courseContentSectionPropsSchema = z.object({
	product: z.object({
		id: z.string(),
		name: z.string(),
	}),
});

export type CourseContentSectionProps = z.infer<
	typeof courseContentSectionPropsSchema
>;
