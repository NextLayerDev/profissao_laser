import { z } from 'zod';

export const planToolSchema = z.object({
	plan_id: z.string(),
	tool_key: z.string(),
	free_quota: z.number().int().nullable(),
});
export type PlanTool = z.infer<typeof planToolSchema>;

export const setPlanToolPayloadSchema = z.object({
	free_quota: z.number().int().min(0).nullable(),
});
export type SetPlanToolPayload = z.infer<typeof setPlanToolPayloadSchema>;
