import { z } from 'zod';

export const provisioningJobSchema = z.object({
	jobId: z.string(),
});

export type ProvisioningJob = z.infer<typeof provisioningJobSchema>;

export const provisioningStatusSchema = z.object({
	status: z.string(),
	tenantUrl: z.string().nullish(),
	adminEmail: z.string().nullish(),
	adminPassword: z.string().nullish(),
	customerEmail: z.string().nullish(),
	customerPassword: z.string().nullish(),
	slug: z.string().nullish(),
	plan: z.string().nullish(),
	lastError: z.string().nullish(),
});

export type ProvisioningStatus = z.infer<typeof provisioningStatusSchema>;
