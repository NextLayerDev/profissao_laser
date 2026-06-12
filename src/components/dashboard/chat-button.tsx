'use client';

import { MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAdminPendings } from '@/hooks/use-admin-pendings';
import { getToken } from '@/lib/auth';

type ChatButtonVariant = 'inline' | 'floating';

interface ChatButtonProps {
	variant?: ChatButtonVariant;
}

/**
 * Atalho "Dúvidas" do staff: leva direto à aba Dúvidas de aulas em /suporte.
 * O contador vem do agregador de pendências (cache compartilhado com o sino
 * e a sidebar — zero chamadas extras; o antigo fluxo varria curso → módulos
 * → aulas a cada página).
 */
export function ChatButton({ variant = 'inline' }: ChatButtonProps) {
	const router = useRouter();
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		setIsAdmin(!!getToken('user'));
	}, []);

	const { lessonDoubtsPending, ticketsPending } = useAdminPendings(isAdmin);
	const unansweredCount = lessonDoubtsPending + ticketsPending;

	if (!isAdmin) return null;

	const isInline = variant === 'inline';

	return (
		<button
			type="button"
			onClick={() => router.push('/suporte?tab=duvidas-aula')}
			className={
				isInline
					? 'relative flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-xl text-white text-sm font-medium transition-all duration-200 hover:opacity-90'
					: 'fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 transition-all duration-300 hover:scale-110 z-30'
			}
			aria-label="Ver dúvidas dos alunos"
		>
			<MessageCircle className="w-5 h-5 shrink-0" />
			{isInline && <span className="hidden sm:inline">Dúvidas</span>}
			{unansweredCount > 0 && (
				<span
					className={
						isInline
							? 'min-w-5 h-5 px-1.5 flex items-center justify-center bg-amber-500 text-white text-xs font-bold rounded-full'
							: 'absolute -top-1 -right-1 min-w-5 h-5 px-1.5 flex items-center justify-center bg-amber-500 text-white text-xs font-bold rounded-full'
					}
				>
					{unansweredCount > 99 ? '99+' : unansweredCount}
				</span>
			)}
		</button>
	);
}
