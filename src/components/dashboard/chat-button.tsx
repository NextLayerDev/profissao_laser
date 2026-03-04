'use client';

import { MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DoubtsModal } from '@/components/dashboard/doubts-modal';
import { useDoubtsByModules } from '@/hooks/use-admin-doubts';
import { getToken } from '@/lib/auth';

type ChatButtonVariant = 'inline' | 'floating';

interface ChatButtonProps {
	variant?: ChatButtonVariant;
}

export function ChatButton({ variant = 'inline' }: ChatButtonProps) {
	const [open, setOpen] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		setIsAdmin(!!getToken('user'));
	}, []);

	const { data: productsWithDoubts = [] } = useDoubtsByModules(isAdmin);

	const unansweredCount = productsWithDoubts.reduce((acc, pw) => {
		for (const mod of pw.modules) {
			for (const lesson of mod.lessons) {
				acc += lesson.doubts.filter((d) => d.replies.length === 0).length;
			}
		}
		return acc;
	}, 0);

	if (!isAdmin) return null;

	const isInline = variant === 'inline';

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
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
								? 'min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-amber-500 text-white text-xs font-bold rounded-full'
								: 'absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-amber-500 text-white text-xs font-bold rounded-full'
						}
					>
						{unansweredCount > 99 ? '99+' : unansweredCount}
					</span>
				)}
			</button>
			<DoubtsModal open={open} onClose={() => setOpen(false)} />
		</>
	);
}
