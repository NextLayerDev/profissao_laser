import { api } from '@/shared/lib/fetch';
import type { StreakData } from '@/types/gamification';

export async function getStreak(): Promise<StreakData> {
	const { data } = await api.get<StreakData>('/me/gamification/streak');
	return data;
}
