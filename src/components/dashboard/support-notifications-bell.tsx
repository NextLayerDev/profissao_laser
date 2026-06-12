'use client';

import { Bell, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAdminSupportNotifications } from '@/hooks/use-support-notifications';
import { usePermissions } from '@/modules/access';
import { canSeeNavItem } from '@/utils/constants/permissions';

function timeAgo(iso: string | null | undefined): string {
	if (!iso) return '';
	const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
	if (mins < 1) return 'agora';
	if (mins < 60) return `há ${mins}min`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `há ${hours}h`;
	return `há ${Math.floor(hours / 24)}d`;
}

/** Sino no topo do admin: mensagens novas no chat de atendimento. */
export function SupportNotificationsBell() {
	const router = useRouter();
	const { can } = usePermissions();
	const enabled = canSeeNavItem('Suporte', can);
	const { unreadCount, unreadChats } = useAdminSupportNotifications(enabled);
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	// Fecha o dropdown ao clicar fora.
	useEffect(() => {
		if (!open) return;
		function onClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener('mousedown', onClick);
		return () => document.removeEventListener('mousedown', onClick);
	}, [open]);

	if (!enabled) return null;

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				title="Notificações do atendimento"
				className="relative h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-linear-to-br from-slate-100 to-slate-200 dark:from-white/8 dark:to-white/3 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 shadow-sm dark:shadow-none"
			>
				<Bell className="w-4 h-4" />
				{unreadCount > 0 && (
					<span className="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#040405] animate-pulse">
						{unreadCount > 9 ? '9+' : unreadCount}
					</span>
				)}
			</button>

			{open && (
				<div className="absolute right-0 top-11 w-80 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] shadow-2xl overflow-hidden z-50">
					<div className="px-4 py-3 border-b border-slate-200 dark:border-white/10">
						<p className="text-sm font-bold text-slate-900 dark:text-white">
							Chat de atendimento
						</p>
						<p className="text-xs text-slate-500 dark:text-gray-400">
							{unreadCount > 0
								? `${unreadCount} ${unreadCount === 1 ? 'conversa com mensagem nova' : 'conversas com mensagens novas'}`
								: 'Nenhuma mensagem nova'}
						</p>
					</div>
					<div className="max-h-72 overflow-y-auto">
						{unreadChats.length === 0 ? (
							<div className="flex flex-col items-center py-6 text-slate-400 dark:text-gray-600">
								<MessageSquare className="w-6 h-6 mb-1 opacity-50" />
								<p className="text-xs">Tudo lido por aqui</p>
							</div>
						) : (
							unreadChats.map((chat) => (
								<button
									key={chat.id}
									type="button"
									onClick={() => {
										setOpen(false);
										router.push('/suporte');
									}}
									className="w-full text-left px-4 py-3 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
								>
									<div className="flex items-center justify-between gap-2">
										<span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white truncate">
											<span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
											{chat.customerName ?? 'Cliente'}
										</span>
										<span className="text-[11px] text-slate-400 dark:text-gray-500 shrink-0">
											{timeAgo(chat.lastMessageAt)}
										</span>
									</div>
									{chat.lastMessagePreview && (
										<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 line-clamp-2">
											{chat.lastMessagePreview}
										</p>
									)}
								</button>
							))
						)}
					</div>
					<button
						type="button"
						onClick={() => {
							setOpen(false);
							router.push('/suporte');
						}}
						className="w-full px-4 py-2.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
					>
						Abrir atendimento
					</button>
				</div>
			)}
		</div>
	);
}
