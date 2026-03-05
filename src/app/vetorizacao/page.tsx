'use client';

import {
	ArrowLeft,
	BookOpen,
	Loader2,
	Lock,
	PenLine,
	Store,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserBadge } from '@/components/store/user-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { VectorList } from '@/components/vetorizacao/vector-list';
import { VectorizationUpload } from '@/components/vetorizacao/vectorization-upload';
import { useCustomerFeatures } from '@/hooks/use-customer-features';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { useCustomerVectors } from '@/hooks/use-vectors';
import { getCurrentUser, getToken } from '@/lib/auth';
import { FULL_FEATURES } from '@/utils/constants/class-features';

const Background = () => (
	<div className="fixed inset-0 bg-linear-to-br from-slate-100 via-white to-slate-50 dark:from-[#12103a] dark:via-[#0d0b1e] dark:to-[#0a0818] pointer-events-none" />
);

export default function VetorizacaoPage() {
	const router = useRouter();
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [, setName] = useState<string>('');
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		const user = getCurrentUser();
		setEmail(user?.email ?? null);
		setName(user?.name ?? '');
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

	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const limit = 20;

	const handleSearchChange = (value: string) => {
		setSearch(value);
		setPage(1);
	};

	const { data: vectorsResponse, refetch } = useCustomerVectors({
		page,
		limit,
		search: search || undefined,
	});
	const vectorsData = vectorsResponse?.data ?? [];
	const vectorsTotal = vectorsResponse?.total ?? 0;

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
							Acesso à Vetorização
						</h2>
						<p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
							{upgradeTiers?.vetorizacao
								? `A vetorização está disponível no plano ${upgradeTiers.vetorizacao}. Faça upgrade para aceder.`
								: 'A vetorização está disponível apenas para planos com acesso. Faça upgrade na loja para aceder.'}
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

			{/* Header */}
			<header className="relative z-10 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-6 py-4">
				<div className="max-w-4xl mx-auto flex items-center justify-between">
					<div className="flex items-center gap-4">
						<button
							type="button"
							onClick={() => router.push('/course')}
							className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-violet-600 dark:text-violet-400"
						>
							<ArrowLeft className="h-5 w-5" />
						</button>
						<div className="flex items-center gap-3">
							<div className="bg-linear-to-br from-violet-600 to-fuchsia-600 rounded-lg p-1.5">
								<PenLine className="w-5 h-5 text-white" />
							</div>
							<h1 className="text-lg font-bold text-slate-900 dark:text-white">
								Vetorização
							</h1>
						</div>
					</div>

					<div className="flex items-center gap-2">
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

			<main className="relative z-10 max-w-4xl mx-auto px-6 py-8">
				<div className="mb-8">
					<h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
						Converter imagens em SVG
					</h2>
					<p className="text-slate-600 dark:text-slate-400 text-sm">
						Envie imagens (PNG, JPG, WEBP) para vetorizar. Imagens coloridas
						usam Vectorizer.AI; imagens em preto e branco usam NextLayer.
					</p>
				</div>

				<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-none mb-8">
					<VectorizationUpload onSuccess={() => refetch()} />
				</div>

				<div>
					<h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
						<BookOpen className="w-5 h-5 text-violet-500" />
						Banco de vetores
					</h2>
					<VectorList
						data={vectorsData}
						total={vectorsTotal}
						page={page}
						limit={limit}
						search={search}
						onPageChange={setPage}
						onSearchChange={handleSearchChange}
						onRefetch={refetch}
					/>
				</div>
			</main>
		</div>
	);
}
