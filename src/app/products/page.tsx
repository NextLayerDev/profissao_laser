'use client';

import { Layers, Package, Plus, Settings2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { AddCourseModal } from '@/components/products/add-course-modal';
import { ClassCard } from '@/components/products/class-card';
import { CreateClassModal } from '@/components/products/create-class-modal';
import { ProductGrid } from '@/components/products/product-grid';
import { SearchBar } from '@/components/products/search-bar';
import { CreateSystemClassModal } from '@/components/system-classes/create-system-class-modal';
import { SystemClassAssociationsModal } from '@/components/system-classes/system-class-associations-modal';
import { SystemClassCard } from '@/components/system-classes/system-class-card';
import { useClasses } from '@/hooks/use-classes';
import { useProducts } from '@/hooks/use-products';
import { useSystemClasses } from '@/hooks/use-system-classes';
import type { ClassWithProducts } from '@/types/classes';
import type { SystemClassWithRelations } from '@/types/system-classes';

type Tab = 'produtos' | 'classes' | 'system-classes';

export default function Produtos() {
	const [activeTab, setActiveTab] = useState<Tab>('produtos');
	const [searchQuery, setSearchQuery] = useState('');
	const [isProductModalOpen, setIsProductModalOpen] = useState(false);
	const [isClassModalOpen, setIsClassModalOpen] = useState(false);
	const [editingClass, setEditingClass] = useState<ClassWithProducts | null>(
		null,
	);
	const [isSystemClassModalOpen, setIsSystemClassModalOpen] = useState(false);
	const [editingSystemClass, setEditingSystemClass] =
		useState<SystemClassWithRelations | null>(null);
	const [associatingSystemClass, setAssociatingSystemClass] =
		useState<SystemClassWithRelations | null>(null);

	const { products, isLoading, error } = useProducts();
	const { classes, isLoading: classesLoading } = useClasses();
	const { systemClasses, isLoading: systemClassesLoading } = useSystemClasses();

	const filteredProducts = (products ?? []).filter((product) =>
		product.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const filteredSystemClasses = useMemo(
		() =>
			systemClasses.filter((sc) =>
				sc.name.toLowerCase().includes(searchQuery.toLowerCase()),
			),
		[systemClasses, searchQuery],
	);

	function handleEditClass(cls: ClassWithProducts) {
		setEditingClass(cls);
		setIsClassModalOpen(true);
	}

	function handleCloseClassModal() {
		setIsClassModalOpen(false);
		setEditingClass(null);
	}

	function handleEditSystemClass(sc: SystemClassWithRelations) {
		setEditingSystemClass(sc);
		setIsSystemClassModalOpen(true);
	}

	function handleCloseSystemClassModal() {
		setIsSystemClassModalOpen(false);
		setEditingSystemClass(null);
	}

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white font-sans">
			<Header />

			<main className="px-8 py-6">
				<div className="mb-6">
					<h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
						Seus produtos
					</h2>
					<p className="text-slate-600 dark:text-gray-400 mt-1">
						Visualize e gerencie todos os seus produtos em um só lugar.
					</p>
				</div>

				{/* Tabs */}
				<div className="flex items-center gap-2 mb-6">
					<button
						type="button"
						onClick={() => setActiveTab('produtos')}
						className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
							activeTab === 'produtos'
								? 'bg-violet-600 text-white'
								: 'bg-white dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none'
						}`}
					>
						<Package className="w-4 h-4" />
						Produtos
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('classes')}
						className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
							activeTab === 'classes'
								? 'bg-violet-600 text-white'
								: 'bg-white dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none'
						}`}
					>
						<Layers className="w-4 h-4" />
						Classes
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('system-classes')}
						className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
							activeTab === 'system-classes'
								? 'bg-violet-600 text-white'
								: 'bg-white dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none'
						}`}
					>
						<Settings2 className="w-4 h-4" />
						Classes Sistema
					</button>
				</div>

				{activeTab === 'produtos' && (
					<>
						<SearchBar
							value={searchQuery}
							onChange={setSearchQuery}
							onAddCourse={() => setIsProductModalOpen(true)}
						/>
						<ProductGrid
							products={filteredProducts}
							isLoading={isLoading}
							error={error}
							classes={classes}
							systemClasses={systemClasses}
						/>
					</>
				)}

				{activeTab === 'classes' && (
					<>
						<div className="flex items-center justify-between mb-6">
							<p className="text-sm text-slate-600 dark:text-gray-400">
								Agrupe seus produtos em classes (Prata, Ouro, Platina) para
								facilitar o gerenciamento de acesso de cada curso.
							</p>
							<button
								type="button"
								onClick={() => setIsClassModalOpen(true)}
								className="flex items-center gap-2 bg-violet-600 rounded-xl px-5 py-3 text-sm font-medium hover:bg-violet-700 transition-colors"
							>
								<Plus className="w-4 h-4" />
								Adicionar classe
							</button>
						</div>

						{classesLoading ? (
							<div className="flex items-center justify-center py-20">
								<div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
							</div>
						) : classes.length === 0 ? (
							<div className="text-center py-20">
								<Layers className="w-10 h-10 text-slate-400 dark:text-gray-700 mx-auto mb-4" />
								<p className="text-slate-600 dark:text-gray-400 font-medium">
									Nenhuma classe criada
								</p>
								<p className="text-slate-500 dark:text-gray-600 text-sm mt-1">
									Crie uma classe para agrupar produtos por tier.
								</p>
							</div>
						) : (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
								{classes.map((cls) => (
									<ClassCard
										key={cls.id}
										cls={cls}
										onEdit={handleEditClass}
										systemClasses={systemClasses}
									/>
								))}
							</div>
						)}
					</>
				)}

				{activeTab === 'system-classes' && (
					<>
						<div className="flex items-center justify-between mb-6">
							<p className="text-sm text-slate-600 dark:text-gray-400">
								Gerencie planos de acesso com permissões granulares, tiers e
								associação com produtos e cursos.
							</p>
							<button
								type="button"
								onClick={() => setIsSystemClassModalOpen(true)}
								className="flex items-center gap-2 bg-violet-600 rounded-xl px-5 py-3 text-sm font-medium hover:bg-violet-700 transition-colors"
							>
								<Plus className="w-4 h-4" />
								Nova System Class
							</button>
						</div>

						{systemClassesLoading ? (
							<div className="flex items-center justify-center py-20">
								<div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
							</div>
						) : filteredSystemClasses.length === 0 ? (
							<div className="text-center py-20">
								<Settings2 className="w-10 h-10 text-slate-400 dark:text-gray-700 mx-auto mb-4" />
								<p className="text-slate-600 dark:text-gray-400 font-medium">
									{searchQuery
										? 'Nenhum resultado encontrado'
										: 'Nenhuma system class criada'}
								</p>
								<p className="text-slate-500 dark:text-gray-600 text-sm mt-1">
									{searchQuery
										? 'Tente outro termo de busca'
										: 'Crie uma system class para definir planos de acesso.'}
								</p>
							</div>
						) : (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
								{filteredSystemClasses.map((sc) => (
									<SystemClassCard
										key={sc.id}
										systemClass={sc}
										onEdit={handleEditSystemClass}
										onManageAssociations={setAssociatingSystemClass}
									/>
								))}
							</div>
						)}
					</>
				)}
			</main>

			<AddCourseModal
				isOpen={isProductModalOpen}
				onClose={() => setIsProductModalOpen(false)}
			/>

			<CreateClassModal
				isOpen={isClassModalOpen}
				onClose={handleCloseClassModal}
				editing={editingClass}
			/>

			<CreateSystemClassModal
				isOpen={isSystemClassModalOpen}
				onClose={handleCloseSystemClassModal}
				editing={editingSystemClass}
			/>

			{associatingSystemClass && (
				<SystemClassAssociationsModal
					isOpen={!!associatingSystemClass}
					onClose={() => setAssociatingSystemClass(null)}
					systemClass={associatingSystemClass}
				/>
			)}
		</div>
	);
}
