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
