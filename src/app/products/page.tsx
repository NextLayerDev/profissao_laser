'use client';

import { useState } from 'react';
import { ChatButton } from '@/components/dashboard/chat-button';
import { Header } from '@/components/dashboard/header';
import { AddCourseModal } from '@/components/products/add-course-modal';
import { ProductGrid } from '@/components/products/product-grid';
import { SearchBar } from '@/components/products/search-bar';
import { useProducts } from '@/hooks/use-products';

export default function Produtos() {
	const [searchQuery, setSearchQuery] = useState('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { products, isLoading, error } = useProducts();

	const filteredProducts = (products ?? []).filter((product) =>
		product.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	function handleAddCourse() {
		setIsModalOpen(true);
	}

	return (
		<div className="min-h-screen bg-[#0d0d0f] text-white font-sans">
			<Header />

			<main className="px-8 py-6">
				<div className="mb-6">
					<h2 className="text-2xl font-bold tracking-tight">Seus produtos</h2>
					<p className="text-gray-400 mt-1">
						Visualize e gerencie todos os seus produtos em um só lugar.
					</p>
				</div>

				<SearchBar
					value={searchQuery}
					onChange={setSearchQuery}
					onAddCourse={handleAddCourse}
				/>
				<ProductGrid
					products={filteredProducts}
					isLoading={isLoading}
					error={error}
				/>
			</main>

			<ChatButton />
			<AddCourseModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
			/>
		</div>
	);
}
