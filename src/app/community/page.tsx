'use client';

import { ExternalLink, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/dashboard/header';
import { CommunitySection } from '@/components/products/community-section';

export default function ComunidadeAdmin() {
	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white font-sans">
			<Header />

			<main className="px-8 py-6">
				<div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
							<div className="p-2 rounded-xl bg-violet-600">
								<MessageSquare className="h-6 w-6 text-white" />
							</div>
							Comunidade
						</h2>
						<p className="text-slate-600 dark:text-gray-400 mt-1">
							Gerencie canais, visualize conversas e responda aos membros.
						</p>
					</div>
					<Link
						href="/comunity"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 hover:border-violet-500/50 rounded-xl text-sm text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
					>
						<ExternalLink className="h-4 w-4" />
						Ver comunidade (cliente)
					</Link>
				</div>

				<CommunitySection />
			</main>
		</div>
	);
}
