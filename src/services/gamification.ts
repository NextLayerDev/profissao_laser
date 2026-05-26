import { api } from '@/shared/lib/fetch';
import type {
	StreakApiResponse,
	StreakData,
	StreakDay,
} from '@/types/gamification';

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

function formatDate(d: Date) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function parseLocalDate(s: string) {
	const [y, m, d] = s.split('-').map(Number);
	return new Date(y, m - 1, d);
}

function buildWeekMap(
	currentStreak: number,
	lastSeenDate: string | null,
): StreakDay[] {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const startOfWeek = new Date(today);
	startOfWeek.setDate(today.getDate() - today.getDay());

	const completedSet = new Set<string>();
	if (lastSeenDate && currentStreak > 0) {
		const last = parseLocalDate(lastSeenDate);
		for (let i = 0; i < currentStreak; i++) {
			const d = new Date(last);
			d.setDate(last.getDate() - i);
			completedSet.add(formatDate(d));
		}
	}

	return Array.from({ length: 7 }, (_, i) => {
		const d = new Date(startOfWeek);
		d.setDate(startOfWeek.getDate() + i);
		const date = formatDate(d);
		return {
			day: DAY_LABELS[i],
			date,
			completed: completedSet.has(date),
		};
	});
}

export async function getStreak(): Promise<StreakData> {
	const { data } = await api.get<StreakApiResponse>('/v1/me/streak');
	return {
		currentStreak: data.current_streak,
		bestStreak: data.longest_streak,
		lastSeenDate: data.last_seen_date,
		weekMap: buildWeekMap(data.current_streak, data.last_seen_date),
	};
}
