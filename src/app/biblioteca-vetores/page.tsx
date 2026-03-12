'use client';

import { ArrowLeft, FolderOpen, Loader2, Lock, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { VectorLibraryBreadcrumbs } from '@/components/community/vector-library-breadcrumbs';
import { VectorLibraryCards } from '@/components/community/vector-library-cards';
import { UserBadge } from '@/components/store/user-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCustomerFeatures } from '@/hooks/use-customer-features';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import {
	useVectorLibraryBreadcrumbs,
	useVectorLibraryContents,
} from '@/hooks/use-vector-library';
import { getCurrentUser, getToken } from '@/lib/auth';
import type { VectorLibraryFile } from '@/types/vector-library';
import { FULL_FEATURES } from '@/utils/constants/class-features';

const Background = () => (
	<div className="fixed inset-0 bg-linear-to-br from-slate-100 via-white to-slate-50 dark:from-[#12103a] dark:via-[#0d0b1e] dark:to-[#0a0818] pointer-events-none" />
);

export default function BibliotecaVetoresPage() {
	const router = useRouter();
	const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		const user = getCurrentUser();
		setEmail(user?.email ?? null);
		setIsAdmin(!!getToken('user') && user?.role != null);
	}, []);

	const { data: plans, isLoading } = useCustomerPlans(email ?? null);

	const activePlans =
		plans?.filter((p) => p.status === 'active' || p.status === 'ativo') ?? [];

	const customerFeatures = useCustomerFeatures(
		activePlans.length > 0 ? activePlans : undefined,
	);
	const features = isAdmin
		? FULL_FEATURES
		: (customerFeatures?.features ?? null);
	const upgradeTiers = isAdmin
		? null
		: (customerFeatures?.upgradeTiers ?? null);
	const hasVetorizacaoAccess = features?.vetorizacao ?? false;

	const { data: contents, isLoading: contentsLoading } =
		useVectorLibraryContents(currentFolderId);
	const { data: breadcrumbs = [] } =
		useVectorLibraryBreadcrumbs(currentFolderId);

	const handleDownload = async (file: VectorLibraryFile) => {
		try {
			const res = await fetch(file.fileUrl);
			const blob = await res.blob();
			const ext = file.name.split('.').pop() || 'bin';
			const filename = file.name.includes('.')
				? file.name
				: `${file.name}.${ext}`;
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
		} catch {
			window.open(file.fileUrl, '_blank');
		}
	};

	if (email === undefined || isLoading) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0b1e] flex items-center justify-center">
				<Background />
				<Loader2 className="relative z-10 w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (email === null) {
		router.replace('/login');
		return null;
	}

	if (!hasVetorizacaoAccess) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0b1e] flex items-center justify-center">
				<Background />
				<div className="relative z-10 text-center max-w-md px-6">
					<div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-6 shadow-lg dark:shadow-none">
						<Lock className="w-16 h-16 text-violet-400 mx-auto mb-4" />
						<h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
							Acesso à Biblioteca de Vetores
						</h2>
						<p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
							{upgradeTiers?.vetorizacao
								? `A biblioteca de vetores está disponível no plano ${upgradeTiers.vetorizacao}. Faça upgrade para aceder.`
								: 'A biblioteca de vetores está disponível apenas para planos com acesso à vetorização. Faça upgrade na loja para aceder.'}
						</p>
					</div>
					<Link
						href="/store"
						className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors"
					>
						<Store className="w-5 h-5" />
						Ver planos na loja
					</Link>
					<Link
						href="/course"
						className="block mt-4 text-violet-400 hover:text-violet-300 text-sm"
					>
						Voltar aos cursos
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0b1e] text-slate-900 dark:text-white font-sans">
			<Background />

			<header className="relative z-10 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-6 py-4">
				<div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
					<div className="flex items-center gap-4 min-w-0">
						<button
							type="button"
							onClick={() => router.push('/course')}
							className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-violet-600 dark:text-violet-400 shrink-0"
						>
							<ArrowLeft className="h-5 w-5" />
						</button>
						<div className="flex items-center gap-3 min-w-0">
							<div className="bg-linear-to-br from-emerald-500 to-teal-600 rounded-lg p-1.5 shrink-0">
								<FolderOpen className="w-5 h-5 text-white" />
							</div>
							<div className="min-w-0">
								<h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
									Biblioteca de Vetores
								</h1>
								<VectorLibraryBreadcrumbs
									items={breadcrumbs}
									onNavigate={setCurrentFolderId}
								/>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						<ThemeToggle />
						<Link
							href="/store"
							className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white text-sm font-medium rounded-xl transition-colors"
						>
							<Store className="w-4 h-4" />
							Ir para loja
						</Link>
						<UserBadge />
					</div>
				</div>
			</header>

			<main className="relative z-10 max-w-5xl mx-auto px-6 py-8">
				<div className="mb-6">
					<h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
						Vetores e ficheiros para personalização
					</h2>
					<p className="text-slate-600 dark:text-slate-400 text-sm">
						Coleção de vetores, imagens e ficheiros prontos para usar na sua
						gravação a laser.
					</p>
				</div>

				{contentsLoading ? (
					<div className="flex justify-center py-16">
						<Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
					</div>
				) : (
					<VectorLibraryCards
						folders={contents?.folders ?? []}
						files={contents?.files ?? []}
						onFolderClick={setCurrentFolderId}
						onFileDownload={handleDownload}
					/>
				)}
			</main>
		</div>
	);
}
