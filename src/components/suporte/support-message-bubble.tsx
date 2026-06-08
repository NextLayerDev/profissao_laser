'use client';

import { Bot, Headset } from 'lucide-react';
import type { SupportMessage } from '@/types/support-chat';

function formatTime(iso: string) {
	try {
		return new Date(iso).toLocaleString('pt-BR', {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit',
		});
	} catch {
		return iso;
	}
}

export function SupportMessageBubble({ msg }: { msg: SupportMessage }) {
	if (msg.role === 'system') {
		return (
			<div className="flex justify-center">
				<span className="text-xs text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-white/5 rounded-full px-3 py-1 text-center">
					{msg.content}
				</span>
			</div>
		);
	}

	const isCustomer = msg.role === 'customer';
	const Icon = msg.role === 'ai' ? Bot : Headset;

	return (
		<div className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
			<div
				className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
					isCustomer
						? 'bg-violet-600 text-white rounded-br-md'
						: 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white rounded-bl-md'
				}`}
			>
				{!isCustomer && (
					<div className="flex items-center gap-1.5 mb-0.5 text-xs font-semibold opacity-80">
						<Icon className="w-3.5 h-3.5" />
						{msg.authorName}
					</div>
				)}
				<p className="text-sm leading-relaxed whitespace-pre-wrap">
					{msg.content}
				</p>
				<p className="text-[11px] mt-1 opacity-70">
					{formatTime(msg.createdAt)}
				</p>
			</div>
		</div>
	);
}
