'use client';

import { MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getToken } from '@/lib/auth';
import { DoubtsModal } from './doubts-modal';

export function ChatButton() {
	const [open, setOpen] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const [unansweredCount, setUnansweredCount] = useState(0);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setIsAdmin(!!getToken('user'));
		setMounted(true);
	}, []);

	if (!isAdmin) return null;
	if (!mounted) return null;

	return createPortal(
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 transition-all duration-300 hover:scale-110 z-50"
			>
				<MessageCircle className="w-6 h-6 text-white" />
				{unansweredCount > 0 && (
					<span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
						{unansweredCount > 99 ? '99+' : unansweredCount}
					</span>
				)}
			</button>
			<DoubtsModal
				open={open}
				onClose={() => setOpen(false)}
				onUnansweredCountChange={setUnansweredCount}
			/>
		</>,
		document.body,
	);
}
