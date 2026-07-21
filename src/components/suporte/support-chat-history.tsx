'use client';

import { ChevronRight, Clock, Headset, History } from 'lucide-react';
import { useState } from 'react';
import type { SupportChatSummary } from '@/types/support-chat';

function formatDateTime(iso?: string | null) {
	if (!iso) return '';
	try {
		return new Date(iso).toLocaleString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	} catch {
		return iso;
	}
}

export interface SupportChatHistoryProps {
	/** Atendimentos já encerrados (nada é apagado — isto é só visual). */
	chats: SupportChatSummary[];
	/** Abre a conversa em modo leitura. */
	onOpenChat: (id: string) => void;
}

/**
 * Histórico do chat de suporte ao vivo. Fica RECOLHIDO por padrão pra que o
 * aluno veja só o atendimento em andamento — evitando que ele ache que precisa
 * abrir um chat novo pra cada assunto.
 *
 * Atenção: isto NÃO é "Meus chamados" (tickets/pl_doubt_chat) — são sistemas
 * diferentes que só convivem na mesma página.
 */
export function SupportChatHistory({
	chats,
	onOpenChat,
}: SupportChatHistoryProps) {
	const [open, setOpen] = useState(false);

	if (chats.length === 0) return null;

	return (
		<section className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
			>
				<div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
					<History className="w-4 h-4 text-slate-500 dark:text-gray-400" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-slate-900 dark:text-white">
						Atendimentos anteriores
					</p>
					<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
						{chats.length}{' '}
						{chats.length === 1
							? 'conversa encerrada no chat ao vivo'
							: 'conversas encerradas no chat ao vivo'}
					</p>
				</div>
				<ChevronRight
					className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
						open ? 'rotate-90' : ''
					}`}
				/>
			</button>

			{open && (
				<ul className="border-t border-slate-100 dark:border-white/5 divide-y divide-slate-100 dark:divide-white/5">
					{chats.map((chat) => (
						<li key={chat.id}>
							<button
								type="button"
								onClick={() => onOpenChat(chat.id)}
								className="w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
							>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
										<span className="flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400">
											<Clock className="w-3 h-3" />
											{formatDateTime(chat.closedAt ?? chat.updatedAt)}
										</span>
										{chat.attendantName && (
											<span className="flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400">
												<Headset className="w-3 h-3" />
												{chat.attendantName}
											</span>
										)}
									</div>
									<p className="text-sm text-slate-700 dark:text-gray-300 mt-1 line-clamp-2">
										{chat.lastMessagePreview?.trim() ||
											chat.subject ||
											'Conversa sem mensagens'}
									</p>
								</div>
								<span className="text-xs font-semibold text-violet-700 dark:text-violet-400 shrink-0 mt-0.5 flex items-center gap-1">
									Ver
									<ChevronRight className="w-3.5 h-3.5" />
								</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
