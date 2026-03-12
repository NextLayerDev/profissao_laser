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
	order?: number;
}

export interface Member {
	name: string;
	specialty?: string | null;
	badges: string[];
	category?: string | null;
	image?: string | null;
}

export interface Project {
	id: string;
	title: string;
	author: string;
	img?: string | null;
	description?: string | null;
	material?: string | null;
	technique?: string | null;
	time?: string;
	likes?: number;
	comments?: number;
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
}

export interface RankingUser {
	pos: number;
	name: string;
	pts: number;
}
