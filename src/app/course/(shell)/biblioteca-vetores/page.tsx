'use client';

import { FolderOpen, Loader2, Lock, Store } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { VectorLibraryBreadcrumbs } from '@/components/community/vector-library-breadcrumbs';
import { VectorLibraryCards } from '@/components/community/vector-library-cards';
import { useCustomerFeatures } from '@/hooks/use-customer-features';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import {
	useVectorLibraryBreadcrumbs,
	useVectorLibraryContents,
} from '@/hooks/use-vector-library';
import { getCurrentUser, getToken } from '@/lib/auth';
import type { VectorLibraryFile } from '@/types/vector-library';
import { FULL_FEATURES } from '@/utils/constants/class-features';

export default function BibliotecaCoursePage() {
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
	const hasAccess = features?.vetorizacao ?? false;

	const { data: contents, isLoading: contentsLoading } =
		useVectorLibraryContents(currentFolderId);
	const { data: breadcrumbs = [] } =
		useVectorLibraryBreadcrumbs(currentFolderId);

	const handleDownload = async (file: VectorLibraryFile) => {
		try {
			const res = await fetch(file.fileUrl);
			const blob = await res.blob();
			const filename = file.name.includes('.') ? file.name : `${file.name}.svg`;
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
			<div className="flex items-center justify-center py-32">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (!hasAccess) {
		return (
			<div className="flex items-center justify-center py-32">
				<div className="text-center max-w-sm">
					<div className="p-6 rounded-2xl bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800/50 mb-4">
						<Lock className="w-14 h-14 text-violet-400 mx-auto mb-3" />
						<h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
							Biblioteca de Vetores
						</h2>
						<p className="text-slate-500 dark:text-gray-500 text-sm">
							{upgradeTiers?.vetorizacao
								? `Disponível no plano ${upgradeTiers.vetorizacao}.`
								: 'Disponível em planos com acesso à vetorização.'}
						</p>
					</div>
					<Link
						href="/store"
						className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors"
					>
						<Store className="w-4 h-4" />
						Ver planos
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 md:p-8 max-w-5xl mx-auto">
			<div className="mb-6">
				<div className="flex items-center gap-3 mb-1">
					<div className="bg-linear-to-br from-emerald-500 to-teal-600 rounded-lg p-2">
						<FolderOpen className="w-5 h-5 text-white" />
					</div>
					<div>
						<h2 className="text-2xl font-black text-slate-900 dark:text-white">
							Biblioteca de Vetores
						</h2>
						<VectorLibraryBreadcrumbs
							items={breadcrumbs}
							onNavigate={setCurrentFolderId}
						/>
					</div>
				</div>
				<p className="text-slate-500 dark:text-gray-500 text-sm mt-2 ml-11">
					Vetores e arquivos prontos para gravação a laser.
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
		</div>
	);
}
