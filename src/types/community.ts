export interface Post {
	id: string;
	author: string;
	avatar?: string | null;
	time: string;
	content: string;
	image?: string | null;
	likes: number;
	comments: number;
	shares: number;
	liked: boolean;
}

export interface ChannelMessage {
	id: string;
	user: string;
	userName?: string | null;
	avatar?: string | null;
	content: string;
	time: string;
	isMe: boolean;
	fileUrl?: string | null;
}

export interface Channel {
	id: string;
	label: string;
	description?: string | null;
	category: string;
	adminOnly?: boolean;
	/** Visível apenas para admin (oculto dos alunos). */
	adminView?: boolean;
	order?: number;
}

export interface Member {
	id: string;
	name: string;
	specialty?: string | null;
	badges: string[];
	badge?: string | null;
	featuredRole?: string | null;
	featured?: boolean;
	category?: string | null;
	image?: string | null;
	isOnline?: boolean;
	lastSeenAt?: string | null;
}

export type ActivityType =
	| 'lesson_completed'
	| 'badge_earned'
	| 'forum_post'
	| 'forum_reply'
	| 'challenge_completed'
	| 'member_joined';

export interface Activity {
	id: string;
	type: ActivityType;
	user: { id: string; name: string; avatar: string | null };
	data: Record<string, unknown>;
	createdAt: string;
}

export interface CommunityStats {
	activeMembers: number;
	completedProjects: number;
	messagesSent: number;
	livesRealized: number;
}

export interface Project {
	id: string;
	title: string;
	author: string;
	authorAvatar?: string | null;
	img?: string | null;
	description?: string | null;
	material?: string | null;
	technique?: string | null;
	time?: string;
	likes?: number;
	comments?: number;
	liked?: boolean;
	createdAt?: string;
}

export interface ProjectComment {
	id: string;
	projectId: string;
	author: string;
	content: string;
	time: string;
	isAdmin?: boolean;
}

export interface Event {
	id: string;
	title: string;
	date: string;
	time?: string | null;
	type: 'workshop' | 'live' | 'qa';
	description?: string | null;
	streamUrl?: string | null;
	streamProvider?: 'youtube' | 'vimeo' | null;
	waitingRoomOpensMinutesBefore?: number;
	hostId?: string | null;
}

export interface EventAttendee {
	customerId: string;
	customerName: string | null;
	customerImage: string | null;
	joinedAt: string;
}

export interface WaitingRoomState {
	event: Event;
	isWaitingRoomOpen: boolean;
	isLive: boolean;
	hasEnded: boolean;
	startsAt: string;
	waitingRoomOpensAt: string;
	attendees: EventAttendee[];
	hasJoined: boolean;
}

export interface RankingUser {
	pos: number;
	name: string;
	pts: number;
}
