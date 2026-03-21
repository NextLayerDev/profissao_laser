'use client';

import {
	BookOpen,
	CalendarClock,
	ChevronDown,
	Cpu,
	LayoutDashboard,
	Loader2,
	Monitor,
	Search,
	Store,
	X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { StoreProductCard } from '@/components/store/store-product-card';
import { UserBadge } from '@/components/store/user-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useClasses } from '@/hooks/use-classes';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import { useProducts } from '@/hooks/use-products';
import { useSystemClasses } from '@/hooks/use-system-classes';
import { getCurrentUser, getToken } from '@/lib/auth';

export default function Loja() {
	const [search, setSearch] = useState('');
	const [activeCategory, setActiveCategory] = useState('Todos');
	const [selectedMachine, setSelectedMachine] = useState('');
	const [selectedSoftware, setSelectedSoftware] = useState('');
	const [isAdmin, setIsAdmin] = useState(false);
	const { products, isLoading, error } = useProducts();
	const { classes } = useClasses();
	const { systemClasses } = useSystemClasses();

	const currentUser = getCurrentUser();
	const { data: ownedPlans } = useCustomerPlans(currentUser?.email ?? null);

	useEffect(() => {
		const user = getCurrentUser();
		setIsAdmin(!!getToken('user') && user?.role != null);
	}, []);

	const activeProducts = (products ?? []).filter((p) => p.status === 'ativo');
	const activeClasses = classes.filter((c) => c.status === 'ativo');
	const activeSystemClasses = systemClasses.filter(
		(sc) => sc.status === 'ativo',
	);

	/* Map product.id → class */
	const productClassMap = useMemo(() => {
		const map = new Map<string, (typeof activeClasses)[0]>();
		for (const cls of activeClasses) {
			for (const product of cls.products) {
				map.set(product.id, cls);
			}
		}
		return map;
	}, [activeClasses]);

	/* Map product.id → ALL system classes */
	const productSystemClassesMap = useMemo(() => {
		const map = new Map<string, typeof activeSystemClasses>();
		for (const sc of activeSystemClasses) {
			for (const product of sc.products) {
				if (!map.has(product.id)) map.set(product.id, []);
				map.get(product.id)?.push(sc);
			}
		}
		return map;
	}, [activeSystemClasses]);

	/* Unique machines + softwares */
	const { machines, softwares } = useMemo(() => {
		const machineSet = new Set<string>();
		const softwareSet = new Set<string>();
		for (const p of activeProducts) {
			if (p.machine) machineSet.add(p.machine);
			if (p.software) softwareSet.add(p.software);
		}
		return {
			machines: Array.from(machineSet).sort(),
			softwares: Array.from(softwareSet).sort(),
		};
	}, [activeProducts]);

	/* Pre-select Fiber Laser + EZCAD once data loads */
	useEffect(() => {
		if (isLoading || machines.length === 0 || selectedMachine !== '') return;
		setSelectedMachine(
			machines.includes('Fiber Laser') ? 'Fiber Laser' : machines[0],
		);
	}, [isLoading, machines, selectedMachine]);

	useEffect(() => {
		if (isLoading || softwares.length === 0 || selectedSoftware !== '') return;
		setSelectedSoftware(softwares.includes('EZCAD') ? 'EZCAD' : softwares[0]);
	}, [isLoading, softwares, selectedSoftware]);

	const categories = [
		'Todos',
		...Array.from(
			new Set(activeProducts.map((p) => p.category).filter(Boolean)),
		),
	] as string[];

	const hasFilters = selectedMachine !== '' || selectedSoftware !== '';

	/* filteredGroups: array of variant arrays (one sub-array per product name)
	   Machine/software filter is applied at GROUP level — if any variant in the
	   group matches, all variants of that product name are shown. This ensures
	   SC-linked products (which may not have machine/software set) still appear. */
	const filteredGroups = useMemo(() => {
		// 1. Text + category filter only (not machine/software yet)
		const textFiltered = activeProducts.filter((p) => {
			if (!p.name.toLowerCase().includes(search.toLowerCase())) return false;
			if (activeCategory !== 'Todos' && p.category !== activeCategory)
				return false;
			return true;
		});

		// 2. Group all text-filtered products by name
		const map = new Map<
			string,
			Array<{
				product: (typeof activeProducts)[0];
				classInfo?: (typeof activeClasses)[0];
				systemClasses?: typeof activeSystemClasses;
			}>
		>();

		for (const product of textFiltered) {
			const classInfo = productClassMap.get(product.id);
			const allSc = productSystemClassesMap.get(product.id);
			if (!map.has(product.name)) map.set(product.name, []);
			map.get(product.name)?.push({ product, classInfo, systemClasses: allSc });
		}

		// 3. Sort variants within each group (base first, then by SC name)
		const groups = Array.from(map.values()).map((variants) =>
			[...variants].sort((a, b) => {
				const aHasSc = (a.systemClasses ?? []).length > 0;
				const bHasSc = (b.systemClasses ?? []).length > 0;
				if (!aHasSc && bHasSc) return -1;
				if (aHasSc && !bHasSc) return 1;
				const aName = a.systemClasses?.[0]?.name ?? '';
				const bName = b.systemClasses?.[0]?.name ?? '';
				return aName.localeCompare(bName);
			}),
		);

		// 4. Filter groups at group level: keep if any variant matches machine/software
		return groups.filter((variants) => {
			if (!selectedMachine && !selectedSoftware) return true;
			return variants.some((v) => {
				const machineOk =
					!selectedMachine || v.product.machine === selectedMachine;
				const softwareOk =
					!selectedSoftware || v.product.software === selectedSoftware;
				return machineOk && softwareOk;
			});
		});
	}, [
		activeProducts,
		search,
		activeCategory,
		selectedMachine,
		selectedSoftware,
		productClassMap,
		productSystemClassesMap,
	]);

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

				{/* Category filter */}
				<div className="flex items-center gap-2 mb-4 flex-wrap">
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

				{/* Machine + Software filter */}
				{(machines.length > 0 || softwares.length > 0) && (
					<div className="flex flex-wrap items-center gap-3 mb-8">
						{machines.length > 0 && (
							<div className="relative">
								<Monitor className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 pointer-events-none" />
								<select
									value={selectedMachine}
									onChange={(e) => setSelectedMachine(e.target.value)}
									className="appearance-none bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 hover:border-violet-500/40 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-700 dark:text-gray-300 focus:outline-none focus:border-violet-500/50 transition-colors cursor-pointer shadow-sm dark:shadow-none"
								>
									<option value="">Qual sua máquina?</option>
									{machines.map((m) => (
										<option key={m} value={m}>
											{m}
										</option>
									))}
								</select>
								<ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
							</div>
						)}

						{softwares.length > 0 && (
							<div className="relative">
								<Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 pointer-events-none" />
								<select
									value={selectedSoftware}
									onChange={(e) => setSelectedSoftware(e.target.value)}
									className="appearance-none bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 hover:border-violet-500/40 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-700 dark:text-gray-300 focus:outline-none focus:border-violet-500/50 transition-colors cursor-pointer shadow-sm dark:shadow-none"
								>
									<option value="">Qual seu software?</option>
									{softwares.map((s) => (
										<option key={s} value={s}>
											{s}
										</option>
									))}
								</select>
								<ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
							</div>
						)}

						{hasFilters && (
							<button
								type="button"
								onClick={() => {
									setSelectedMachine('');
									setSelectedSoftware('');
								}}
								className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 transition-colors cursor-pointer"
							>
								<X className="w-3.5 h-3.5" />
								Limpar filtros
							</button>
						)}
					</div>
				)}

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
					<div className="flex flex-col gap-8">
						{filteredGroups.map((variants) => (
							<StoreProductCard
								key={variants[0].product.name}
								variants={variants}
								ownedPlans={ownedPlans}
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
