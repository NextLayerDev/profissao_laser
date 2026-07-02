'use client';

import { Bot, Pin, Search, User } from 'lucide-react';
import { useMemo } from 'react';
import type { OmniChat, OmniChatAssignFilter } from '../types/omni';

/** Cores estáveis por contato (avatar com inicial, port do porteira). */
const AVATAR_COLORS = [
	'bg-violet-500',
	'bg-emerald-500',
	'bg-sky-500',
	'bg-rose-500',
	'bg-amber-500',
	'bg-teal-500',
];
function avatarColor(id: string): string {
	let h = 0;
	for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
	return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function relativeTime(iso: string | null): string {
	if (!iso) return '';
	const d = new Date(iso);
	const diff = Date.now() - d.getTime();
	if (diff < 60_000) return 'agora';
	if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`;
	if (diff < 86_400_000) {
		return d.toLocaleTimeString('pt-BR', {
			hour: '2-digit',
			minute: '2-digit',
		});
	}
	return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function ChatListItem({
	chat,
	selected,
	onClick,
}: {
	chat: OmniChat;
	selected: boolean;
	onClick: () => void;
}) {
	const name =
		chat.contact?.name ||
		chat.contact?.push_name ||
		chat.wa_chat_id.split('@')[0];
	return (
		<button
			type="button"
			onClick={onClick}
			className={`w-full border-b border-slate-100 dark:border-white/5 px-3 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${
				selected
					? 'bg-violet-50 dark:bg-violet-500/10 border-l-2 border-l-violet-500'
					: ''
			}`}
		>
			<div className="flex items-center gap-3">
				{chat.contact?.profile_pic_url ? (
					<img
						src={chat.contact.profile_pic_url}
						alt=""
						className="h-10 w-10 shrink-0 rounded-full object-cover"
					/>
				) : (
					<div
						className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${avatarColor(chat.id)}`}
					>
						{name.charAt(0).toUpperCase()}
					</div>
				)}
				<div className="min-w-0 flex-1">
					<div className="flex items-center justify-between gap-2">
						<p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
							{name}
						</p>
						<span className="shrink-0 text-[11px] text-slate-400">
							{relativeTime(chat.last_message_at)}
						</span>
					</div>
					<div className="mt-0.5 flex items-center justify-between gap-2">
						<p className="truncate text-xs text-slate-500 dark:text-gray-400">
							{chat.last_message ?? ''}
						</p>
						{chat.unread_count > 0 && (
							<span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
								{chat.unread_count}
							</span>
						)}
					</div>
					<div className="mt-1 flex items-center gap-1.5">
						{chat.assigned_to === 'ai' ? (
							<span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-300">
								<Bot className="h-2.5 w-2.5" /> IA
								{chat.ia_paused ? ' (pausada)' : ''}
							</span>
						) : (
							<span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-300">
								<User className="h-2.5 w-2.5" />
								{chat.assigned_user_name ?? 'Humano'}
							</span>
						)}
						{chat.lead_step && (
							<span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-300">
								{chat.lead_step}
							</span>
						)}
						{chat.is_pinned && <Pin className="h-3 w-3 text-slate-400" />}
					</div>
				</div>
			</div>
		</button>
	);
}

export function ChatList({
	chats,
	isLoading,
	selectedId,
	onSelect,
	search,
	onSearch,
	filter,
	onFilter,
	counts,
}: {
	chats: OmniChat[];
	isLoading: boolean;
	selectedId: string | null;
	onSelect: (chat: OmniChat) => void;
	search: string;
	onSearch: (v: string) => void;
	filter: OmniChatAssignFilter;
	onFilter: (f: OmniChatAssignFilter) => void;
	counts?: { total?: number; ia?: number; human?: number };
}) {
	const tabs = useMemo(
		() => [
			{
				key: 'all' as const,
				label: `Todos${counts?.total != null ? ` (${counts.total})` : ''}`,
			},
			{
				key: 'ia' as const,
				label: `IA${counts?.ia != null ? ` (${counts.ia})` : ''}`,
			},
			{
				key: 'human' as const,
				label: `Humano${counts?.human != null ? ` (${counts.human})` : ''}`,
			},
		],
		[counts],
	);
	return (
		<div className="flex h-full flex-col">
			<div className="space-y-2 border-b border-slate-200 dark:border-white/10 p-3">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<input
						value={search}
						onChange={(e) => onSearch(e.target.value)}
						placeholder="Buscar conversa..."
						className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:outline-none"
					/>
				</div>
				<div className="flex gap-1 rounded-xl bg-slate-100 dark:bg-white/5 p-1">
					{tabs.map((t) => (
						<button
							key={t.key}
							type="button"
							onClick={() => onFilter(t.key)}
							className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
								filter === t.key
									? 'bg-white dark:bg-white/10 text-violet-600 dark:text-violet-400 shadow-sm'
									: 'text-slate-500 dark:text-slate-400'
							}`}
						>
							{t.label}
						</button>
					))}
				</div>
			</div>
			<div className="flex-1 overflow-y-auto">
				{isLoading ? (
					<div className="space-y-2 p-3">
						{[0, 1, 2, 3].map((i) => (
							<div
								key={i}
								className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5"
							/>
						))}
					</div>
				) : chats.length === 0 ? (
					<p className="py-12 text-center text-sm text-slate-400">
						Nenhuma conversa ainda.
					</p>
				) : (
					chats.map((chat) => (
						<ChatListItem
							key={chat.id}
							chat={chat}
							selected={chat.id === selectedId}
							onClick={() => onSelect(chat)}
						/>
					))
				)}
			</div>
		</div>
	);
}
