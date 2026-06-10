'use client';

import { useQuery } from '@tanstack/react-query';
import {
	type AiToolDefinition,
	getToolDefinition,
} from '../services/tool-definitions.service';

export const TOOL_DEFINITION_KEY = (key: string) =>
	['tool-definition', key] as const;

/** Carrega a definition publicada de uma tool por key (motor + renderer). */
export function useToolDefinition(key: string, opts?: { enabled?: boolean }) {
	return useQuery<AiToolDefinition>({
		queryKey: TOOL_DEFINITION_KEY(key),
		queryFn: () => getToolDefinition(key),
		enabled: (opts?.enabled ?? true) && !!key,
		staleTime: 60_000,
	});
}
