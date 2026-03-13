'use client';

import { BookOpen, Loader2, Search } from 'lucide-react';
import { useState } from 'react';
import { useFAQs } from '@/hooks/use-faq';
import { FAQCard } from './faq-card';

export function FAQStudentTab() {
	const { data: faqs = [], isLoading } = useFAQs();
	const [search, setSearch] = useState('');

	const filtered = faqs
		.filter((faq) => {
			if (!search.trim()) return true;
			const q = search.toLowerCase();
			return (
				faq.question.toLowerCase().includes(q) ||
				faq.answer.toLowerCase().includes(q)
			);
		})
		.sort((a, b) => {
			const aTotal = a.reactions.reduce((s, r) => s + r.count, 0);
			const bTotal = b.reactions.reduce((s, r) => s + r.count, 0);
			if (bTotal !== aTotal) return bTotal - aTotal;
			return a.order - b.order;
		});

	if (isLoading) {
		return (
			<div className="flex justify-center py-16">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Barra de pesquisa */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
				<input
					type="text"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Pesquisar dúvidas frequentes..."
					className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none text-sm"
				/>
			</div>

			{filtered.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-600">
					<BookOpen className="w-12 h-12 mb-3 opacity-50" />
					<p className="text-sm font-medium">
						{search.trim()
							? 'Nenhuma dúvida encontrada'
							: 'Nenhuma dúvida frequente cadastrada'}
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{filtered.map((faq) => (
						<FAQCard key={faq.id} faq={faq} />
					))}
				</div>
			)}
		</div>
	);
}
