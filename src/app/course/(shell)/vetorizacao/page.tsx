'use client';

import { BookOpen, Loader2, Lock, PenLine, Store } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { VectorList } from '@/components/vetorizacao/vector-list';
import { VectorizationUpload } from '@/components/vetorizacao/vectorization-upload';
import { useCustomerFeatures } from '@/hooks/use-customer-features';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { useCustomerVectors } from '@/hooks/use-vectors';
import { getCurrentUser, getToken } from '@/lib/auth';
import { FULL_FEATURES } from '@/utils/constants/class-features';

export default function VetorizacaoCoursePage() {
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [isAdmin, setIsAdmin] = useState(false);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');

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

	const { data: vectorsResponse, refetch } = useCustomerVectors({
		page,
		limit: 20,
		search: search || undefined,
	});

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
							Acesso à Vetorização
						</h2>
						<p className="text-slate-500 dark:text-gray-500 text-sm">
							{upgradeTiers?.vetorizacao
								? `Disponível no plano ${upgradeTiers.vetorizacao}.`
								: 'Disponível em planos com vetorização.'}
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
		<div className="p-4 md:p-8 max-w-4xl mx-auto">
			<div className="mb-8 flex items-center gap-3">
				<div className="bg-linear-to-br from-violet-600 to-fuchsia-600 rounded-lg p-2">
					<PenLine className="w-5 h-5 text-white" />
				</div>
				<div>
					<h2 className="text-2xl font-black text-slate-900 dark:text-white">
						Vetorização
					</h2>
					<p className="text-slate-500 dark:text-gray-500 text-sm">
						Converta imagens PNG, JPG ou WEBP em SVG vetorial.
					</p>
				</div>
			</div>

			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800/50 rounded-2xl p-6 mb-8">
				<VectorizationUpload onSuccess={() => refetch()} />
			</div>

			<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
				<BookOpen className="w-5 h-5 text-violet-500" />
				Banco de vetores
			</h3>
			<VectorList
				data={vectorsResponse?.data ?? []}
				total={vectorsResponse?.total ?? 0}
				page={page}
				limit={20}
				search={search}
				onPageChange={setPage}
				onSearchChange={(v) => {
					setSearch(v);
					setPage(1);
				}}
				onRefetch={refetch}
			/>
		</div>
	);
}
