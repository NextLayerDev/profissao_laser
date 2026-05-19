export interface StreakDay {
	day: string;
	date: string;
	completed: boolean;
}

export interface StreakData {
	currentStreak: number;
	bestStreak: number;
	weekMap: StreakDay[];
}
