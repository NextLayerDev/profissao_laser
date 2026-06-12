'use client';

import {
	Bell,
	CheckCircle2,
	GraduationCap,
	Headphones,
	HelpCircle,
	MessageSquare,
	UserRound,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAdminPendings } from '@/hooks/use-admin-pendings';
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

function SectionHeader({ label }: { label: string }) {
	return (
		<p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">
			{label}
		</p>
	);
}

function PendingRow({
	icon: Icon,
	label,
	count,
	color,
	onClick,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	count: number;
	color: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
		>
			<span
				className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}
			>
				<Icon className="w-4 h-4" />
			</span>
			<span className="flex-1 text-sm text-slate-700 dark:text-gray-300">
				{label}
			</span>
			<span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
				{count}
			</span>
		</button>
	);
}

/**
 * Central de pendências do staff (header do admin): mensagens novas e chats
 * aguardando no atendimento, chamados pendentes e fórum sem resposta.
 */
export function SupportNotificationsBell() {
	const router = useRouter();
	const { can } = usePermissions();
	const enabled = canSeeNavItem('Suporte', can);
	const {
		unreadCount,
		unreadChats,
		liveWaiting,
		ticketsPending,
		lessonDoubtsPending,
		forumUnanswered,
		grandTotal,
	} = useAdminPendings(enabled);
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

	function go(path: string) {
		setOpen(false);
		router.push(path);
	}

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				title="Pendências do atendimento"
				className="relative h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-linear-to-br from-slate-100 to-slate-200 dark:from-white/8 dark:to-white/3 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 shadow-sm dark:shadow-none"
			>
				<Bell className="w-4 h-4" />
				{grandTotal > 0 && (
					<span className="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#040405] animate-pulse">
						{grandTotal > 99 ? '99+' : grandTotal}
					</span>
				)}
			</button>

			{open && (
				<div className="absolute right-0 top-11 w-[22rem] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] shadow-2xl overflow-hidden z-50">
					<div className="px-4 py-3 border-b border-slate-200 dark:border-white/10">
						<p className="text-sm font-bold text-slate-900 dark:text-white">
							Pendências do atendimento
						</p>
						<p className="text-xs text-slate-500 dark:text-gray-400">
							{grandTotal > 0
								? `${grandTotal} ${grandTotal === 1 ? 'item precisa' : 'itens precisam'} de atenção`
								: 'Tudo em dia por aqui'}
						</p>
					</div>

					<div className="max-h-96 overflow-y-auto pb-1">
						{grandTotal === 0 ? (
							<div className="flex flex-col items-center py-8 text-slate-400 dark:text-gray-600">
								<CheckCircle2 className="w-7 h-7 mb-1.5 text-emerald-500/70" />
								<p className="text-xs">Nenhuma pendência aberta</p>
							</div>
						) : (
							<>
								{/* Resumo por área */}
								{(liveWaiting > 0 ||
									ticketsPending > 0 ||
									lessonDoubtsPending > 0 ||
									forumUnanswered > 0) && (
									<>
										<SectionHeader label="Abertos e pendentes" />
										{liveWaiting > 0 && (
											<PendingRow
												icon={MessageSquare}
												label="Chats aguardando atendimento"
												count={liveWaiting}
												color="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
												onClick={() => go('/suporte?tab=chat-online')}
											/>
										)}
										{ticketsPending > 0 && (
											<PendingRow
												icon={Headphones}
												label="Chamados pendentes de resposta"
												count={ticketsPending}
												color="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400"
												onClick={() => go('/suporte?tab=chamados')}
											/>
										)}
										{lessonDoubtsPending > 0 && (
											<PendingRow
												icon={GraduationCap}
												label="Dúvidas de aula sem resposta"
												count={lessonDoubtsPending}
												color="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
												onClick={() => go('/suporte?tab=duvidas-aula')}
											/>
										)}
										{forumUnanswered > 0 && (
											<PendingRow
												icon={HelpCircle}
												label="Fórum: threads sem resposta"
												count={forumUnanswered}
												color="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
												onClick={() => go('/forum')}
											/>
										)}
									</>
								)}

								{/* Mensagens novas no chat ao vivo */}
								{unreadCount > 0 && (
									<>
										<SectionHeader label="Mensagens novas no chat" />
										{unreadChats.slice(0, 6).map((chat) => (
											<button
												key={chat.id}
												type="button"
												onClick={() => go('/suporte?tab=chat-online')}
												className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
											>
												<div className="flex items-center justify-between gap-2">
													<span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white truncate">
														<UserRound className="w-3.5 h-3.5 text-red-500 shrink-0" />
														{chat.customerName ?? 'Cliente'}
													</span>
													<span className="text-[11px] text-slate-400 dark:text-gray-500 shrink-0">
														{timeAgo(chat.lastMessageAt)}
													</span>
												</div>
												{chat.lastMessagePreview && (
													<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 line-clamp-1 pl-5">
														{chat.lastMessagePreview}
													</p>
												)}
											</button>
										))}
										{unreadChats.length > 6 && (
											<p className="px-4 py-1.5 text-[11px] text-slate-400 dark:text-gray-500">
												+{unreadChats.length - 6} outras conversas
											</p>
										)}
									</>
								)}
							</>
						)}
					</div>

					<button
						type="button"
						onClick={() => go('/suporte')}
						className="w-full px-4 py-2.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-t border-slate-100 dark:border-white/5"
					>
						Abrir gestão de suporte
					</button>
				</div>
			)}
		</div>
	);
}
