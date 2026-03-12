'use client';

import {
	BookOpen,
	CalendarClock,
	LayoutDashboard,
	Loader2,
	Search,
	Store,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { StoreProductCard } from '@/components/store/store-product-card';
import { UserBadge } from '@/components/store/user-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useClasses } from '@/hooks/use-classes';
import { useProducts } from '@/hooks/use-products';
import { getCurrentUser, getToken } from '@/lib/auth';

const TIER_ORDER: Record<string, number> = { prata: 0, ouro: 1, platina: 2 };

export default function Loja() {
	const [search, setSearch] = useState('');
	const [activeCategory, setActiveCategory] = useState('Todos');
	const [isAdmin, setIsAdmin] = useState(false);
	const { products, isLoading, error } = useProducts();
	const { classes } = useClasses();

	useEffect(() => {
		const user = getCurrentUser();
		setIsAdmin(!!getToken('user') && user?.role != null);
	}, []);

	const activeProducts = (products ?? []).filter((p) => p.status === 'ativo');
	const activeClasses = classes.filter((c) => c.status === 'ativo');

	const productClassMap = useMemo(() => {
		const map = new Map<string, (typeof activeClasses)[0]>();
		for (const cls of activeClasses) {
			for (const product of cls.products) {
				map.set(product.id, cls);
			}
		}
		return map;
	}, [activeClasses]);

	const categories = [
		'Todos',
		...Array.from(
			new Set(activeProducts.map((p) => p.category).filter(Boolean)),
		),
	] as string[];

	const filtered = useMemo(
		() =>
			activeProducts.filter((p) => {
				const matchesSearch = p.name
					.toLowerCase()
					.includes(search.toLowerCase());
				const matchesCategory =
					activeCategory === 'Todos' || p.category === activeCategory;
				return matchesSearch && matchesCategory;
			}),
		[activeProducts, search, activeCategory],
	);

	const filteredGroups = useMemo(() => {
		const map = new Map<
			string,
			Array<{
				product: (typeof activeProducts)[0];
				classInfo?: (typeof activeClasses)[0];
			}>
		>();
		for (const product of filtered) {
			const classInfo = productClassMap.get(product.id);
			if (!map.has(product.name)) map.set(product.name, []);
			map.get(product.name)?.push({ product, classInfo });
		}
		return Array.from(map.values()).map((variants) =>
			[...variants].sort((a, b) => {
				const aOrder = a.classInfo ? (TIER_ORDER[a.classInfo.tier] ?? 3) : 3;
				const bOrder = b.classInfo ? (TIER_ORDER[b.classInfo.tier] ?? 3) : 3;
				return aOrder - bOrder;
			}),
		);
	}, [filtered, productClassMap]);

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white font-sans">
			<header className="border-b border-slate-200 dark:border-gray-800 bg-slate-50/80 dark:bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-10">
				<div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
					<div className="flex items-center gap-2">
						<Store className="w-6 h-6 text-violet-400" />
						<span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
							Profissão Laser
						</span>
					</div>

					<div className="flex-1 max-w-md relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-gray-500" />
						<input
							type="text"
							placeholder="Buscar cursos..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors shadow-sm dark:shadow-none"
						/>
					</div>

					<ThemeToggle />
					{isAdmin && (
						<Link
							href="/dashboard"
							className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 hover:border-violet-500/50 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium rounded-xl transition-colors shadow-sm dark:shadow-none"
						>
							<LayoutDashboard className="w-4 h-4" />
							Painel
						</Link>
					)}

					<Link
						href="/course"
						className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 hover:border-violet-500/50 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium rounded-xl transition-colors shadow-sm dark:shadow-none"
					>
						<BookOpen className="w-4 h-4" />
						Meus Cursos
					</Link>

					<Link
						href="/agendamentos"
						className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
					>
						<CalendarClock className="w-4 h-4" />
						Agendamentos
					</Link>

					<UserBadge />
				</div>
			</header>

			<main className="max-w-6xl mx-auto px-6 py-10">
				<div className="text-center mb-10">
					<h1 className="text-4xl font-bold tracking-tight mb-3 text-slate-900 dark:text-white">
						Transforme sua carreira
					</h1>
					<p className="text-slate-600 dark:text-gray-400 text-lg max-w-xl mx-auto">
						Cursos e mentorias especializados em estética a laser para você
						crescer no mercado.
					</p>
				</div>

				{/* Filtros por categoria */}
				<div className="flex items-center gap-2 mb-8 flex-wrap">
					{categories.map((cat) => (
						<button
							key={cat}
							type="button"
							onClick={() => setActiveCategory(cat)}
							className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
								activeCategory === cat
									? 'bg-violet-600 text-white'
									: 'bg-white dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-800 hover:border-violet-500/40 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none'
							}`}
						>
							{cat}
						</button>
					))}
					{!isLoading && (
						<span className="ml-auto text-sm text-slate-500 dark:text-gray-500">
							{filteredGroups.length}{' '}
							{filteredGroups.length === 1 ? 'resultado' : 'resultados'}
						</span>
					)}
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
					</div>
				) : error ? (
					<div className="text-center py-20">
						<p className="text-red-400 font-medium">
							Erro ao carregar os cursos
						</p>
						<p className="text-slate-500 dark:text-gray-600 text-sm mt-1">
							Tente novamente mais tarde
						</p>
					</div>
				) : filteredGroups.length > 0 ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredGroups.map((variants) => (
							<StoreProductCard
								key={variants[0].product.name}
								variants={variants}
							/>
						))}
					</div>
				) : (
					<div className="text-center py-20">
						<Search className="w-10 h-10 text-slate-400 dark:text-gray-700 mx-auto mb-4" />
						<p className="text-slate-600 dark:text-gray-400 font-medium">
							Nenhum curso encontrado
						</p>
						<p className="text-slate-500 dark:text-gray-600 text-sm mt-1">
							Tente outro termo ou categoria
						</p>
					</div>
				)}
			</main>
		</div>
	);
}
