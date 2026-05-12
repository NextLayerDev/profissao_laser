'use client';

import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

const THREADS = [
	{
		title: 'Qual a melhor potencia para cortar MDF 3mm?',
		replies: 24,
		category: 'Duvidas',
		time: '2h',
	},
	{
		title: 'Compartilhando meu setup de exaustao caseiro',
		replies: 18,
		category: 'Projetos',
		time: '5h',
	},
	{
		title: 'Dicas para gravar fotos em acrilico cristal',
		replies: 31,
		category: 'Tutoriais',
		time: '8h',
	},
	{
		title: 'Alguem ja testou a nova placa controladora?',
		replies: 12,
		category: 'Equipamentos',
		time: '1d',
	},
];

export function ForumPreview() {
	return (
		<div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<MessageSquare className="w-4 h-4 text-violet-500" />
					<h3 className="text-sm font-bold text-slate-900 dark:text-white">
						Forum
					</h3>
				</div>
				<Link
					href="/course/forum"
					className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-500 font-medium transition-colors"
				>
					Ver tudo
				</Link>
			</div>

			<div className="space-y-0 divide-y divide-slate-100 dark:divide-white/5">
				{THREADS.map((thread, idx) => (
					<div
						key={thread.title}
						className={`flex items-center justify-between gap-3 ${idx === 0 ? '' : 'pt-3'} ${idx === THREADS.length - 1 ? '' : 'pb-3'}`}
					>
						<div className="min-w-0 flex-1">
							<p className="text-sm text-slate-700 dark:text-gray-300 truncate">
								{thread.title}
							</p>
							<span className="text-[10px] text-slate-400 dark:text-gray-500">
								{thread.category}
							</span>
						</div>
						<div className="flex items-center gap-2 shrink-0">
							<span className="px-1.5 py-0.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-bold rounded">
								{thread.replies}
							</span>
							<span className="text-[10px] text-slate-400 dark:text-gray-500">
								{thread.time}
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
