'use client';

import { Loader2, Search, Store } from 'lucide-react';
import { useState } from 'react';
import { StoreProductCard } from '@/components/store/store-product-card';
import { UserBadge } from '@/components/store/user-badge';
import { useProducts } from '@/hooks/use-products';

export default function Loja() {
	const [search, setSearch] = useState('');
	const [activeCategory, setActiveCategory] = useState('Todos');
	const { products, isLoading, error } = useProducts();

	const activeProducts = (products ?? []).filter((p) => p.status === 'ativo');

	const categories = [
		'Todos',
		...Array.from(
			new Set(activeProducts.map((p) => p.category).filter(Boolean)),
		),
	] as string[];

	const filtered = activeProducts.filter((p) => {
		const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
		const matchesCategory =
			activeCategory === 'Todos' || p.category === activeCategory;
		return matchesSearch && matchesCategory;
	});

	return (
		<div className="min-h-screen bg-[#0d0d0f] text-white font-sans">
			<header className="border-b border-gray-800 bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-10">
				<div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
					<div className="flex items-center gap-2">
						<Store className="w-6 h-6 text-violet-400" />
						<span className="text-lg font-bold tracking-tight">
							Profissão Laser
						</span>
					</div>

					<div className="flex-1 max-w-md relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
						<input
							type="text"
							placeholder="Buscar cursos..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full bg-[#1a1a1d] border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
						/>
					</div>

					<UserBadge />
				</div>
			</header>

			<main className="max-w-6xl mx-auto px-6 py-10">
				<div className="text-center mb-10">
					<h1 className="text-4xl font-bold tracking-tight mb-3">
						Transforme sua carreira
					</h1>
					<p className="text-gray-400 text-lg max-w-xl mx-auto">
						Cursos e mentorias especializados em estética a laser para você
						crescer no mercado.
					</p>
				</div>

				<div className="flex items-center gap-2 mb-8 flex-wrap">
					{categories.map((cat) => (
						<button
							key={cat}
							type="button"
							onClick={() => setActiveCategory(cat)}
							className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
								activeCategory === cat
									? 'bg-violet-600 text-white'
									: 'bg-[#1a1a1d] text-gray-400 border border-gray-800 hover:border-violet-500/40 hover:text-white'
							}`}
						>
							{cat}
						</button>
					))}
					{!isLoading && (
						<span className="ml-auto text-sm text-gray-500">
							{filtered.length}{' '}
							{filtered.length === 1 ? 'resultado' : 'resultados'}
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
						<p className="text-gray-600 text-sm mt-1">
							Tente novamente mais tarde
						</p>
					</div>
				) : filtered.length > 0 ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{filtered.map((product) => (
							<StoreProductCard key={product.id} product={product} />
						))}
					</div>
				) : (
					<div className="text-center py-20">
						<Search className="w-10 h-10 text-gray-700 mx-auto mb-4" />
						<p className="text-gray-400 font-medium">Nenhum curso encontrado</p>
						<p className="text-gray-600 text-sm mt-1">
							Tente outro termo ou categoria
						</p>
					</div>
				)}
			</main>
		</div>
	);
}
