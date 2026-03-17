'use client';

import {
	ArrowLeft,
	BookOpen,
	HelpCircle,
	Loader2,
	MessageSquare,
	MessagesSquare,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CategoriesSection } from '@/components/duvidas-admin/categories-section';
import { DefaultQuestionsSection } from '@/components/duvidas-admin/default-questions-section';
import { FAQAdminSection } from '@/components/duvidas-admin/faq-admin-section';
import { ForumCategoriesSection } from '@/components/duvidas-admin/forum-categories-section';
import { ThemeToggle } from '@/components/theme-toggle';
import { getToken } from '@/lib/auth';

export default function DuvidasAdminPage() {
	const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
	const [activeTab, setActiveTab] = useState<
		'faq' | 'categories' | 'questions' | 'forum-categories'
	>('faq');

	useEffect(() => {
		setIsAdmin(!!getToken('user'));
	}, []);

	if (isAdmin === null) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] flex items-center justify-center">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (!isAdmin) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] flex items-center justify-center">
				<div className="text-center">
					<MessageSquare className="w-12 h-12 text-slate-400 dark:text-gray-600 mx-auto mb-4" />
					<p className="text-slate-600 dark:text-gray-400 font-medium mb-2">
						Acesso restrito
					</p>
					<p className="text-sm text-slate-500 dark:text-gray-500 mb-4">
						Esta página é apenas para administradores.
					</p>
					<Link
						href="/dashboard"
						className="inline-block px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
					>
						Voltar ao painel
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white font-sans">
			{/* Header */}
			<header className="border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] px-8 py-4">
				<div className="max-w-5xl mx-auto flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Link
							href="/dashboard"
							className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm"
						>
							<ArrowLeft className="w-4 h-4" />
							Voltar
						</Link>
						<div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg p-1.5">
							<MessageSquare className="w-5 h-5 text-white" />
						</div>
						<h1 className="text-lg font-bold text-slate-900 dark:text-white">
							Gestão de Dúvidas
						</h1>
					</div>
					<ThemeToggle />
				</div>
			</header>

			<main className="max-w-5xl mx-auto px-6 py-8">
				{/* Tabs */}
				<div className="flex gap-1 border-b border-slate-200 dark:border-white/10 mb-6">
					<button
						type="button"
						onClick={() => setActiveTab('faq')}
						className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all border-b-2 -mb-px ${
							activeTab === 'faq'
								? 'text-violet-600 dark:text-violet-400 border-violet-500 bg-transparent'
								: 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
						}`}
					>
						<BookOpen className="w-4 h-4" />
						Dúvidas Frequentes
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('forum-categories')}
						className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all border-b-2 -mb-px ${
							activeTab === 'forum-categories'
								? 'text-violet-600 dark:text-violet-400 border-violet-500 bg-transparent'
								: 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
						}`}
					>
						<MessagesSquare className="w-4 h-4" />
						Categorias do Fórum
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('categories')}
						className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all border-b-2 -mb-px ${
							activeTab === 'categories'
								? 'text-violet-600 dark:text-violet-400 border-violet-500 bg-transparent'
								: 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
						}`}
					>
						<MessageSquare className="w-4 h-4" />
						Categorias
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('questions')}
						className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-all border-b-2 -mb-px ${
							activeTab === 'questions'
								? 'text-violet-600 dark:text-violet-400 border-violet-500 bg-transparent'
								: 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
						}`}
					>
						<HelpCircle className="w-4 h-4" />
						Perguntas Padrão
					</button>
				</div>

				{activeTab === 'faq' && <FAQAdminSection />}
				{activeTab === 'forum-categories' && <ForumCategoriesSection />}
				{activeTab === 'categories' && <CategoriesSection />}
				{activeTab === 'questions' && <DefaultQuestionsSection />}
			</main>
		</div>
	);
}
