'use client';

import {
	ChevronLeft,
	ChevronRight,
	Copy,
	Image,
	Loader2,
	Palette,
	Plus,
	Search,
	Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import {
	useCreateDesign,
	useDeleteDesign,
	useDesigns,
} from '@/hooks/use-designs';
import { useCloneTemplate, useTemplates } from '@/hooks/use-templates';
import type { Design } from '@/types/designs';
import type { Template } from '@/types/templates';

type Tab = 'templates' | 'designs';

/* ─────────────── Pagination ─────────────── */

function Pagination({
	page,
	total,
	limit,
	onPageChange,
}: {
	page: number;
	total: number;
	limit: number;
	onPageChange: (p: number) => void;
}) {
	const totalPages = Math.max(1, Math.ceil(total / limit));
	if (totalPages <= 1) return null;

	return (
		<div className="flex items-center justify-center gap-2 mt-6">
			<button
				type="button"
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
				className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
			>
				<ChevronLeft className="w-4 h-4" />
			</button>
			<span className="text-sm text-slate-500 dark:text-slate-400">
				{page} / {totalPages}
			</span>
			<button
				type="button"
				disabled={page >= totalPages}
				onClick={() => onPageChange(page + 1)}
				className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
			>
				<ChevronRight className="w-4 h-4" />
			</button>
		</div>
	);
}

/* ─────────────── Template Card ─────────────── */

function TemplateCard({
	template,
	onClone,
	isCloning,
}: {
	template: Template;
	onClone: (id: string) => void;
	isCloning: boolean;
}) {
	return (
		<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden group">
			<div className="aspect-[4/3] bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden">
				{template.imageUrl ? (
					<img
						src={template.imageUrl}
						alt={template.name}
						className="w-full h-full object-cover group-hover:scale-105 transition-transform"
					/>
				) : (
					<Image className="w-10 h-10 text-slate-300 dark:text-slate-600" />
				)}
			</div>
			<div className="p-4">
				<h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
					{template.name}
				</h4>
				{template.description && (
					<p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
						{template.description}
					</p>
				)}
				{template.tags && template.tags.length > 0 && (
					<div className="flex flex-wrap gap-1 mt-2">
						{template.tags.slice(0, 3).map((tag) => (
							<span
								key={tag}
								className="text-[10px] px-2 py-0.5 rounded-full bg-lime-100 dark:bg-lime-500/10 text-lime-700 dark:text-lime-400 font-medium"
							>
								{tag}
							</span>
						))}
					</div>
				)}
				<button
					type="button"
					disabled={isCloning}
					onClick={() => onClone(template.id)}
					className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-lime-600 hover:bg-lime-500 text-white rounded-lg transition-colors disabled:opacity-50"
				>
					{isCloning ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Copy className="w-4 h-4" />
					)}
					Usar template
				</button>
			</div>
		</div>
	);
}

/* ─────────────── Design Card ─────────────── */

function DesignCard({
	design,
	onOpen,
	onDelete,
	isDeleting,
}: {
	design: Design;
	onOpen: (id: string) => void;
	onDelete: (id: string) => void;
	isDeleting: boolean;
}) {
	return (
		<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden group">
			<div className="aspect-[4/3] bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden">
				{design.thumbnailUrl ? (
					<img
						src={design.thumbnailUrl}
						alt={design.name}
						className="w-full h-full object-cover group-hover:scale-105 transition-transform"
					/>
				) : (
					<Palette className="w-10 h-10 text-slate-300 dark:text-slate-600" />
				)}
			</div>
			<div className="p-4">
				<h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
					{design.name}
				</h4>
				<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
					{new Date(design.updatedAt).toLocaleDateString('pt-BR')}
				</p>
				<div className="flex gap-2 mt-3">
					<button
						type="button"
						onClick={() => onOpen(design.id)}
						className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
					>
						Abrir
					</button>
					<button
						type="button"
						disabled={isDeleting}
						onClick={() => onDelete(design.id)}
						className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
					>
						{isDeleting ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Trash2 className="w-4 h-4" />
						)}
					</button>
				</div>
			</div>
		</div>
	);
}

/* ─────────────── Main View ─────────────── */

export function CanvaView() {
	const router = useRouter();
	const [tab, setTab] = useState<Tab>('templates');

	// Templates state
	const [tplSearch, setTplSearch] = useState('');
	const [tplPage, setTplPage] = useState(1);
	const [tplTipo, setTplTipo] = useState('');

	// Designs state
	const [dsnSearch, setDsnSearch] = useState('');
	const [dsnPage, setDsnPage] = useState(1);

	const limit = 12;

	const { data: tplData, isLoading: tplLoading } = useTemplates({
		page: tplPage,
		limit,
		search: tplSearch || undefined,
		tipoImagem: tplTipo || undefined,
	});

	const { data: dsnData, isLoading: dsnLoading } = useDesigns({
		page: dsnPage,
		limit,
		search: dsnSearch || undefined,
	});

	const cloneMutation = useCloneTemplate();
	const createDesignMutation = useCreateDesign();
	const deleteDesignMutation = useDeleteDesign();

	const handleClone = useCallback(
		(id: string) => {
			cloneMutation.mutate({ id });
		},
		[cloneMutation],
	);

	const handleOpenDesign = useCallback(
		(id: string) => {
			router.push(`/course/canva/${id}`);
		},
		[router],
	);

	const handleDeleteDesign = useCallback(
		(id: string) => {
			deleteDesignMutation.mutate(id);
		},
		[deleteDesignMutation],
	);

	const handleNewDesign = useCallback(() => {
		createDesignMutation.mutate(
			{
				name: 'Novo Design',
				canvasJson: '{}',
				width: 800,
				height: 600,
			},
			{
				onSuccess: (design) => {
					router.push(`/course/canva/${design.id}`);
				},
			},
		);
	}, [createDesignMutation, router]);

	return (
		<div className="relative p-4 md:p-8 max-w-[1400px] mx-auto">
			{/* Decorative glows */}
			<div className="absolute top-40 -right-20 w-72 h-72 bg-lime-500/5 rounded-full blur-3xl pointer-events-none" />
			<div className="absolute bottom-40 -left-20 w-56 h-56 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

			{/* Hero */}
			<section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-lime-500 via-green-600 to-emerald-700 p-6 md:p-10 mb-8">
				<div className="absolute inset-0 bg-[linear-gradient(rgba(132,204,22,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(132,204,22,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
				<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-400/50 to-transparent" />
				<div className="absolute -top-10 -left-10 w-40 h-40 bg-lime-400/20 rounded-full blur-3xl animate-pulse" />

				<div className="relative z-10 flex items-center gap-3">
					<div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
						<Palette className="w-7 h-7 text-white" />
					</div>
					<div>
						<h2 className="text-2xl md:text-3xl font-black text-white">
							Canva
						</h2>
						<p className="text-lime-100 text-sm md:text-base">
							Templates prontos e seus designs personalizados.
						</p>
					</div>
				</div>
			</section>

			{/* Tabs */}
			<div className="flex items-center gap-1 mb-6 bg-slate-100 dark:bg-white/5 rounded-xl p-1 w-fit">
				{[
					{ key: 'templates' as const, label: 'Templates' },
					{ key: 'designs' as const, label: 'Meus Designs' },
				].map((t) => (
					<button
						key={t.key}
						type="button"
						onClick={() => setTab(t.key)}
						className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
							tab === t.key
								? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
								: 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			{/* Tab: Templates */}
			{tab === 'templates' && (
				<div>
					{/* Filters */}
					<div className="flex flex-col sm:flex-row gap-3 mb-6">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<input
								type="text"
								placeholder="Buscar templates..."
								value={tplSearch}
								onChange={(e) => {
									setTplSearch(e.target.value);
									setTplPage(1);
								}}
								className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500/30"
							/>
						</div>
						<select
							value={tplTipo}
							onChange={(e) => {
								setTplTipo(e.target.value);
								setTplPage(1);
							}}
							className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500/30"
						>
							<option value="">Todos os tipos</option>
							<option value="base">Base</option>
							<option value="exemplo">Exemplo</option>
							<option value="referencia">Referencia</option>
						</select>
					</div>

					{/* Grid */}
					{tplLoading ? (
						<div className="flex items-center justify-center py-20">
							<Loader2 className="w-8 h-8 text-lime-500 animate-spin" />
						</div>
					) : !tplData?.data.length ? (
						<div className="text-center py-20">
							<Image className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
							<p className="text-slate-500 dark:text-slate-400 font-medium">
								Nenhum template encontrado
							</p>
							<p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
								Tente ajustar os filtros de busca.
							</p>
						</div>
					) : (
						<>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
								{tplData.data.map((tpl) => (
									<TemplateCard
										key={tpl.id}
										template={tpl}
										onClone={handleClone}
										isCloning={cloneMutation.isPending}
									/>
								))}
							</div>
							<Pagination
								page={tplPage}
								total={tplData.total}
								limit={limit}
								onPageChange={setTplPage}
							/>
						</>
					)}
				</div>
			)}

			{/* Tab: Designs */}
			{tab === 'designs' && (
				<div>
					{/* Header + search */}
					<div className="flex flex-col sm:flex-row gap-3 mb-6">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<input
								type="text"
								placeholder="Buscar designs..."
								value={dsnSearch}
								onChange={(e) => {
									setDsnSearch(e.target.value);
									setDsnPage(1);
								}}
								className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500/30"
							/>
						</div>
						<button
							type="button"
							onClick={handleNewDesign}
							disabled={createDesignMutation.isPending}
							className="flex items-center justify-center gap-2 px-5 py-2.5 bg-lime-600 hover:bg-lime-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
						>
							{createDesignMutation.isPending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Plus className="w-4 h-4" />
							)}
							Novo Design
						</button>
					</div>

					{/* Grid */}
					{dsnLoading ? (
						<div className="flex items-center justify-center py-20">
							<Loader2 className="w-8 h-8 text-lime-500 animate-spin" />
						</div>
					) : !dsnData?.data.length ? (
						<div className="text-center py-20">
							<Palette className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
							<p className="text-slate-500 dark:text-slate-400 font-medium">
								Nenhum design encontrado
							</p>
							<p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
								Crie um novo design ou use um template.
							</p>
						</div>
					) : (
						<>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
								{dsnData.data.map((dsn) => (
									<DesignCard
										key={dsn.id}
										design={dsn}
										onOpen={handleOpenDesign}
										onDelete={handleDeleteDesign}
										isDeleting={deleteDesignMutation.isPending}
									/>
								))}
							</div>
							<Pagination
								page={dsnPage}
								total={dsnData.total}
								limit={limit}
								onPageChange={setDsnPage}
							/>
						</>
					)}
				</div>
			)}
		</div>
	);
}
