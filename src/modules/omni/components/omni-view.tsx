'use client';

import {
	AlertTriangle,
	Bot,
	MessageSquare,
	Settings,
	Wifi,
	WifiOff,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
	useActiveOmniInstance,
	useOmniChatMutations,
	useOmniChats,
	useOmniInstanceMutations,
	useOmniMessages,
	useOmniSocket,
	useOmniStats,
} from '../hooks/use-omni';
import type { OmniChatAssignFilter } from '../types/omni';
import { ChatList } from './chat-list';
import { ConfigModal } from './config-modal';
import { Conversation } from './conversation';
import { SetupWizard } from './setup-wizard';

/**
 * Shell do OmniResposta: header da instância (status + toggle IA + config) +
 * lista de conversas + conversa aberta. Realtime via socket próprio do main
 * API com fallback de polling. Port da UI do omni.tsx do system_porteira.
 */
export function OmniView() {
	const { instance, isLoading, refetch } = useActiveOmniInstance();
	const { update } = useOmniInstanceMutations();
	const instanceId = instance?.id ?? null;
	const { connected } = useOmniSocket(instanceId);

	const [search, setSearch] = useState('');
	const [filter, setFilter] = useState<OmniChatAssignFilter>('all');
	const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
	const [configOpen, setConfigOpen] = useState(false);

	const chatParams = useMemo(
		() => ({ search: search || undefined, filter, limit: 50 }),
		[search, filter],
	);
	const chatsQuery = useOmniChats(instanceId, chatParams, connected);
	const stats = useOmniStats(instanceId);
	const messagesQuery = useOmniMessages(selectedChatId, connected);
	const chatMutations = useOmniChatMutations(instanceId);

	const chats = chatsQuery.data ?? [];
	const selectedChat = chats.find((c) => c.id === selectedChatId) ?? null;

	if (isLoading) {
		return (
			<div className="grid h-[60vh] place-items-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
			</div>
		);
	}

	// Sem instância conectada → wizard de setup
	if (!instance || instance.status !== 'connected') {
		return <SetupWizard instance={instance} onReady={() => refetch()} />;
	}

	return (
		<div className="flex h-[calc(100vh-140px)] min-h-[560px] flex-col">
			{/* Header da instância */}
			<div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3">
				<div className="flex items-center gap-3">
					<div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600/15">
						<Bot className="h-5 w-5 text-violet-500" />
					</div>
					<div>
						<p className="text-sm font-bold text-slate-900 dark:text-white">
							{instance.profile_name ?? instance.name}
						</p>
						<p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400">
							<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
							{instance.phone_number ?? 'conectado'} ·{' '}
							{instance.provider === 'meta'
								? 'API oficial'
								: instance.provider === 'zapi'
									? 'Z-API'
									: 'Evolution'}
							{connected ? (
								<Wifi className="h-3 w-3 text-emerald-500" />
							) : (
								<WifiOff className="h-3 w-3 text-amber-500" />
							)}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<label className="flex cursor-pointer items-center gap-2">
						<span className="text-xs font-medium text-slate-600 dark:text-gray-300">
							IA {instance.ia_enabled ? 'ativa' : 'pausada'}
						</span>
						<button
							type="button"
							role="switch"
							aria-checked={instance.ia_enabled}
							onClick={() =>
								update.mutate(
									{
										id: instance.id,
										patch: { ia_enabled: !instance.ia_enabled },
									},
									{
										onSuccess: () =>
											toast.success(
												instance.ia_enabled
													? 'IA pausada (só atendimento humano)'
													: 'IA reativada',
											),
									},
								)
							}
							className={`relative h-6 w-11 rounded-full transition-colors ${
								instance.ia_enabled
									? 'bg-violet-600'
									: 'bg-slate-300 dark:bg-white/20'
							}`}
						>
							<span
								className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
									instance.ia_enabled ? 'translate-x-5' : 'translate-x-0.5'
								}`}
							/>
						</button>
					</label>
					<button
						type="button"
						onClick={() => setConfigOpen(true)}
						className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-white hover:border-violet-500/40"
					>
						<Settings className="h-4 w-4" />
						Configurar IA
					</button>
				</div>
			</div>

			{/* Banner de saldo insuficiente */}
			{instance.billing_status === 'no_balance' && (
				<div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
					<p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-300">
						<AlertTriangle className="h-4 w-4 shrink-0" />
						IA pausada: saldo de voxxys insuficiente (0,2 voxxys por resposta).
						Recarregue e reative.
					</p>
					<button
						type="button"
						onClick={() =>
							update.mutate(
								{ id: instance.id, patch: { billing_status: 'ok' } },
								{ onSuccess: () => toast.success('IA reativada') },
							)
						}
						className="shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white"
					>
						Reativar
					</button>
				</div>
			)}

			{/* 2 colunas: lista + conversa */}
			<div className="flex min-h-0 flex-1 gap-3">
				<div className="w-full max-w-[380px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
					<ChatList
						chats={chats}
						isLoading={chatsQuery.isLoading}
						selectedId={selectedChatId}
						onSelect={(chat) => {
							setSelectedChatId(chat.id);
							if (chat.unread_count > 0) chatMutations.markRead.mutate(chat.id);
						}}
						search={search}
						onSearch={setSearch}
						filter={filter}
						onFilter={setFilter}
						counts={stats.data}
					/>
				</div>
				<div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
					{selectedChat ? (
						<Conversation
							chat={selectedChat}
							messages={messagesQuery.data ?? []}
							isLoading={messagesQuery.isLoading}
							mutations={chatMutations}
						/>
					) : (
						<div className="flex h-full flex-col items-center justify-center text-slate-400 dark:text-slate-600">
							<MessageSquare className="mb-3 h-12 w-12 opacity-50" />
							<p className="text-sm font-medium">Selecione uma conversa</p>
							<p className="mt-1 text-xs">
								A IA atende sozinha — entre numa conversa pra acompanhar ou
								assumir.
							</p>
						</div>
					)}
				</div>
			</div>

			{configOpen && (
				<ConfigModal
					instanceId={instance.id}
					onClose={() => setConfigOpen(false)}
				/>
			)}
		</div>
	);
}
