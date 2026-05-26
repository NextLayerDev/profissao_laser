export interface StreakDay {
	day: string;
	date: string;
	completed: boolean;
}

export interface StreakData {
	currentStreak: number;
	bestStreak: number;
	lastSeenDate: string | null;
	weekMap: StreakDay[];
}

export interface StreakApiResponse {
	user_id: string;
	current_streak: number;
	longest_streak: number;
	last_seen_date: string | null;
	updated_at: string;
}
