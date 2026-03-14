'use client';

import { Layers, Loader2, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { CreateSystemClassModal } from '@/components/system-classes/create-system-class-modal';
import { SystemClassAssociationsModal } from '@/components/system-classes/system-class-associations-modal';
import { SystemClassCard } from '@/components/system-classes/system-class-card';
import { useSystemClasses } from '@/hooks/use-system-classes';
import type { SystemClassWithRelations } from '@/types/system-classes';

export default function SystemClasses() {
	const [search, setSearch] = useState('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editing, setEditing] = useState<SystemClassWithRelations | null>(null);
	const [associating, setAssociating] =
		useState<SystemClassWithRelations | null>(null);

	const { systemClasses, isLoading } = useSystemClasses();

	const filtered = useMemo(
		() =>
			systemClasses.filter((sc) =>
				sc.name.toLowerCase().includes(search.toLowerCase()),
			),
		[systemClasses, search],
	);

	function handleEdit(sc: SystemClassWithRelations) {
		setEditing(sc);
		setIsModalOpen(true);
	}

	function handleCloseModal() {
		setIsModalOpen(false);
		setEditing(null);
	}

	function handleManageAssociations(sc: SystemClassWithRelations) {
		setAssociating(sc);
	}

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white font-sans">
			<Header />

			<main className="px-8 py-6">
				<div className="mb-6">
					<h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
						Classes do Sistema
					</h2>
					<p className="text-slate-600 dark:text-gray-400 mt-1">
						Gerencie planos de acesso com permissões granulares, tiers e
						associação com produtos e cursos.
					</p>
				</div>

				<div className="flex items-center gap-3 mb-6">
					<div className="flex-1 relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
						<input
							type="text"
							placeholder="Buscar por nome..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors shadow-sm dark:shadow-none"
						/>
					</div>
					<button
						type="button"
						onClick={() => setIsModalOpen(true)}
						className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-colors"
					>
						<Plus className="w-4 h-4" />
						Nova Classe
					</button>
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
					</div>
				) : filtered.length === 0 ? (
					<div className="text-center py-20">
						<Layers className="w-10 h-10 text-slate-400 dark:text-gray-700 mx-auto mb-4" />
						<p className="text-slate-600 dark:text-gray-400 font-medium">
							{search
								? 'Nenhum resultado encontrado'
								: 'Nenhuma system class criada'}
						</p>
						<p className="text-slate-500 dark:text-gray-600 text-sm mt-1">
							{search
								? 'Tente outro termo de busca'
								: 'Crie uma system class para definir planos de acesso.'}
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{filtered.map((sc) => (
							<SystemClassCard
								key={sc.id}
								systemClass={sc}
								onEdit={handleEdit}
								onManageAssociations={handleManageAssociations}
							/>
						))}
					</div>
				)}
			</main>

			<CreateSystemClassModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				editing={editing}
			/>

			{associating && (
				<SystemClassAssociationsModal
					isOpen={!!associating}
					onClose={() => setAssociating(null)}
					systemClass={associating}
				/>
			)}
		</div>
	);
}
