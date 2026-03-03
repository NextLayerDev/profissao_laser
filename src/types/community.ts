export interface Post {
	id: number;
	author: string;
	avatar: string;
	time: string;
	content: string;
	image?: string;
	likes: number;
	comments: number;
	shares: number;
	liked: boolean;
}

export interface ChannelMessage {
	id: number;
	user: string;
	avatar: string;
	content: string;
	time: string;
	isMe: boolean;
}

export interface Channel {
	id: string;
	label: string;
	description?: string;
	messages: ChannelMessage[];
}

export interface Member {
	name: string;
	specialty: string;
	badges: string[];
	category: string;
	image?: string;
}

export interface Project {
	title: string;
	author: string;
	img: string;
	description?: string;
	material?: string;
	technique?: string;
	time?: string;
	likes?: number;
	comments?: number;
}

export interface Event {
	id: number;
	title: string;
	date: string;
	time: string;
	type: 'workshop' | 'live' | 'qa';
	description: string;
}

export interface RankingUser {
	pos: number;
	name: string;
	pts: number;
	gradient: string;
}
