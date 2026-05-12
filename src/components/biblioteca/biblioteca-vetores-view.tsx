'use client';

import {
	ChevronRight,
	Download,
	Filter,
	FolderOpen,
	Grid,
	Heart,
	Lightbulb,
	List,
	Search,
	Star,
	Upload,
} from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { BreadcrumbItem } from '@/components/community/vector-library-breadcrumbs';
import { VectorLibraryBreadcrumbs } from '@/components/community/vector-library-breadcrumbs';
import {
	useFavoriteFile,
	useVectorLibraryCategories,
	useVectorLibraryFeatured,
	useVectorLibraryStats,
} from '@/hooks/use-vector-library';
import type {
	VectorLibraryContents,
	VectorLibraryFile,
} from '@/types/vector-library';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function isImageMime(mimeType: string): boolean {
	const t = mimeType.toLowerCase();
	return (
		t.includes('image') ||
		t.includes('svg') ||
		t.includes('png') ||
		t.includes('jpg') ||
		t.includes('jpeg') ||
		t.includes('webp') ||
		t.includes('gif')
	);
}

function getFormatBadge(file: VectorLibraryFile): string {
	const name = file.name.toLowerCase();
	const mime = file.mimeType.toLowerCase();

	if (name.endsWith('.cdr') || mime.includes('cdr')) return 'CDR';
	if (name.endsWith('.svg') || mime.includes('svg')) return 'SVG';
	if (name.endsWith('.dxf') || mime.includes('dxf')) return 'DXF';
	if (
		name.endsWith('.ai') ||
		mime.includes('illustrator') ||
		mime.includes('/ai')
	)
		return 'AI';
	if (name.endsWith('.pdf') || mime.includes('pdf')) return 'PDF';
	if (name.endsWith('.png') || mime.includes('png')) return 'PNG';
	if (
		name.endsWith('.jpg') ||
		name.endsWith('.jpeg') ||
		mime.includes('jpeg') ||
		mime.includes('jpg')
	)
		return 'JPG';
	if (name.endsWith('.eps') || mime.includes('eps')) return 'EPS';

	const ext = name.split('.').pop()?.toUpperCase();
	return ext && ext.length <= 4 ? ext : 'FILE';
}

const BADGE_COLORS: Record<string, string> = {
	CDR: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
	SVG: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
	DXF: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
	AI: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
	PDF: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
	PNG: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
	JPG: 'bg-violet-100 text-violet-700 dark:bg-violet-800/30 dark:text-violet-400',
	EPS: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
};

/* ------------------------------------------------------------------ */
/*  Stats icon map                                                    */
/* ------------------------------------------------------------------ */

const STATS_CONFIG = [
	{ key: 'totalFiles' as const, label: 'Vetores disponíveis', icon: Grid },
	{ key: 'totalCollections' as const, label: 'Coleções', icon: FolderOpen },
	{ key: 'totalFavorites' as const, label: 'Favoritos', icon: Heart },
	{ key: 'totalDownloads' as const, label: 'Downloads', icon: Download },
];

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

interface BibliotecaVetoresViewProps {
	currentFolderId: string | null;
	setCurrentFolderId: (id: string | null) => void;
	contents: VectorLibraryContents | undefined;
	contentsLoading: boolean;
	breadcrumbs: BreadcrumbItem[];
	handleDownload: (file: VectorLibraryFile) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function BibliotecaVetoresView({
	currentFolderId: _currentFolderId,
	setCurrentFolderId,
	contents,
	contentsLoading,
	breadcrumbs,
	handleDownload,
}: BibliotecaVetoresViewProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 12;

	const { data: apiStats } = useVectorLibraryStats();
	const { data: categories = [] } = useVectorLibraryCategories();
	const { data: featured = [] } = useVectorLibraryFeatured();
	const favoriteFileMutation = useFavoriteFile();

	/* ---- Client-side search filtering ---- */
	const folders = useMemo(() => {
		const sorted = [...(contents?.folders ?? [])].sort((a, b) =>
			a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
		);
		if (!searchQuery.trim()) return sorted;
		const q = searchQuery.toLowerCase();
		return sorted.filter((f) => f.name.toLowerCase().includes(q));
	}, [contents?.folders, searchQuery]);

	const allFiles = useMemo(() => {
		const sorted = [...(contents?.files ?? [])].sort((a, b) =>
			a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
		);
		if (!searchQuery.trim()) return sorted;
		const q = searchQuery.toLowerCase();
		return sorted.filter((f) => f.name.toLowerCase().includes(q));
	}, [contents?.files, searchQuery]);

	/* ---- Pagination ---- */
	const totalFiles = allFiles.length;
	const totalPages = Math.max(1, Math.ceil(totalFiles / itemsPerPage));
	const paginatedFiles = allFiles.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);
	const showingFrom =
		totalFiles === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
	const showingTo = Math.min(currentPage * itemsPerPage, totalFiles);

	const handleFilterClick = () => {
		toast('Em breve', {
			description: 'Filtros avançados disponíveis em breve.',
		});
	};

	const handleFavoriteClick = (file: VectorLibraryFile) => {
		favoriteFileMutation.mutate({
			id: file.id,
			isFavorited: !!file.isFavorited,
		});
	};

	const handleUploadClick = () => {
		toast('Em breve', {
			description: 'Envio de vetores disponível em breve.',
		});
	};

	return (
		<div className="relative p-4 md:p-8 space-y-8">
			{/* Decorative glow orbs */}
			<div className="absolute top-40 -right-20 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
			<div className="absolute bottom-40 -left-20 w-56 h-56 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

			{/* ============================================================ */}
			{/*  1 - HEADER                                                  */}
			{/* ============================================================ */}
			<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/5 to-violet-500/5 dark:from-violet-500/10 dark:to-violet-500/10 border border-slate-200 dark:border-white/10 p-6 md:p-8">
				{/* Header bg image */}
				<Image
					src="/img/header_prof-laser.png"
					alt=""
					fill
					className="object-cover opacity-[0.06]"
				/>
				{/* Grid pattern */}
				<div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
				<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

				<div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
							Biblioteca de Vetores
						</h1>
						<VectorLibraryBreadcrumbs
							items={breadcrumbs}
							onNavigate={(id) => {
								setCurrentFolderId(id);
								setCurrentPage(1);
							}}
						/>
						<p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
							Vetores e arquivos prontos para gravação a laser.
						</p>
					</div>

					<div className="flex items-center gap-3">
						{/* Search */}
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<input
								type="text"
								placeholder="Buscar vetores..."
								value={searchQuery}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									setCurrentPage(1);
								}}
								className="pl-9 pr-4 py-2 w-56 md:w-64 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
							/>
						</div>

						{/* Upload button */}
						<button
							type="button"
							onClick={handleUploadClick}
							className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-600 text-white text-sm font-semibold transition-colors"
						>
							<Upload className="w-4 h-4" />
							<span className="hidden sm:inline">Enviar vetor</span>
						</button>
					</div>
				</div>
			</div>

			{/* ============================================================ */}
			{/*  2 - STATS CARDS                                             */}
			{/* ============================================================ */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{STATS_CONFIG.map((stat) => {
					const Icon = stat.icon;
					const value = apiStats ? apiStats[stat.key] : '—';
					return (
						<div
							key={stat.label}
							className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300"
						>
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-500/10">
									<Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
								</div>
								<div>
									<p className="text-xl font-bold text-slate-900 dark:text-white">
										{typeof value === 'number'
											? value.toLocaleString('pt-BR')
											: value}
									</p>
									<p className="text-xs text-slate-500 dark:text-gray-400">
										{stat.label}
									</p>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* ============================================================ */}
			{/*  3 - CATEGORIAS                                              */}
			{/* ============================================================ */}
			{categories.length > 0 && (
				<div>
					<div className="flex items-center justify-between mb-3">
						<h2 className="text-lg font-bold text-slate-900 dark:text-white">
							Categorias
						</h2>
						<button
							type="button"
							onClick={handleFilterClick}
							className="flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 hover:underline font-medium"
						>
							Ver todas
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>

					<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
						{categories.map((cat) => (
							<button
								key={cat.name}
								type="button"
								onClick={handleFilterClick}
								className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-violet-400 dark:hover:border-violet-500/50 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
							>
								{cat.icon && <span>{cat.icon}</span>}
								<span>{cat.name}</span>
								<span className="text-xs text-slate-400 dark:text-gray-500">
									{cat.count.toLocaleString('pt-BR')}
								</span>
							</button>
						))}
					</div>
				</div>
			)}

			{/* ============================================================ */}
			{/*  4 - DESTAQUES CAROUSEL                                      */}
			{/* ============================================================ */}
			{featured.length > 0 && (
				<div>
					<h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
						Destaques
					</h2>

					<div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
						{featured.map((file) => {
							const showThumbnail = isImageMime(file.mimeType);
							return (
								<button
									key={file.id}
									type="button"
									onClick={() => handleDownload(file)}
									className="flex-shrink-0 w-56 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden hover:border-violet-400 dark:hover:border-violet-500/50 hover:border-violet-500/30 transition-all duration-300 group text-left"
								>
									{/* Image */}
									<div className="h-32 relative overflow-hidden bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-800/30 dark:to-violet-700/20">
										{showThumbnail ? (
											<img
												src={file.fileUrl}
												alt={file.name}
												className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center">
												<FolderOpen className="w-10 h-10 text-violet-400" />
											</div>
										)}
									</div>
									<div className="p-3">
										<span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400 mb-1.5">
											Destaque
										</span>
										<p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
											{file.name}
										</p>
										{file.category && (
											<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
												{file.category}
											</p>
										)}
									</div>
								</button>
							);
						})}
					</div>
				</div>
			)}

			{/* ============================================================ */}
			{/*  5 - FILTER BAR                                              */}
			{/* ============================================================ */}
			<div className="flex flex-wrap items-center gap-3 py-3 border-y border-slate-200 dark:border-white/10">
				{/* Dropdowns (UI placeholders) */}
				{['Categorias', 'Estilos', 'Formatos'].map((label) => (
					<button
						key={label}
						type="button"
						onClick={handleFilterClick}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm text-slate-600 dark:text-slate-300 hover:border-violet-400 dark:hover:border-violet-500/50 transition-colors"
					>
						<Filter className="w-3.5 h-3.5" />
						{label}
						<ChevronRight className="w-3 h-3 rotate-90" />
					</button>
				))}

				<div className="flex-1" />

				{/* Sort placeholder */}
				<button
					type="button"
					onClick={handleFilterClick}
					className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm text-slate-600 dark:text-slate-300 hover:border-violet-400 dark:hover:border-violet-500/50 transition-colors"
				>
					<Star className="w-3.5 h-3.5" />
					Ordenar
					<ChevronRight className="w-3 h-3 rotate-90" />
				</button>

				{/* Grid / List toggle */}
				<div className="flex border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden">
					<button
						type="button"
						onClick={() => setViewMode('grid')}
						className={`p-1.5 transition-colors ${
							viewMode === 'grid'
								? 'bg-violet-600 text-white'
								: 'bg-white dark:bg-[#1a1a1d] text-slate-500 dark:text-gray-400 hover:text-violet-600'
						}`}
					>
						<Grid className="w-4 h-4" />
					</button>
					<button
						type="button"
						onClick={() => setViewMode('list')}
						className={`p-1.5 transition-colors ${
							viewMode === 'list'
								? 'bg-violet-600 text-white'
								: 'bg-white dark:bg-[#1a1a1d] text-slate-500 dark:text-gray-400 hover:text-violet-600'
						}`}
					>
						<List className="w-4 h-4" />
					</button>
				</div>
			</div>

			{/* ============================================================ */}
			{/*  6 - CONTENT: FOLDERS + FILES GRID                           */}
			{/* ============================================================ */}
			{contentsLoading ? (
				<div className="animate-pulse space-y-8">
					{/* Skeleton folders */}
					<div>
						<div className="h-4 w-16 rounded bg-slate-200 dark:bg-white/5 mb-4" />
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
							{Array.from({ length: 6 }).map((_, i) => (
								<div
									key={i}
									className="flex flex-col items-center gap-3 p-5 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl"
								>
									<div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-white/5" />
									<div className="h-3 w-20 rounded bg-slate-200 dark:bg-white/5" />
								</div>
							))}
						</div>
					</div>
					{/* Skeleton file cards */}
					<div>
						<div className="h-4 w-16 rounded bg-slate-200 dark:bg-white/5 mb-4" />
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
							{Array.from({ length: 6 }).map((_, i) => (
								<div
									key={i}
									className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden"
								>
									<div className="aspect-square bg-slate-200 dark:bg-white/5" />
									<div className="p-3">
										<div className="h-3 w-full rounded bg-slate-200 dark:bg-white/5" />
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			) : (
				<div className="space-y-8">
					{/* Folders */}
					{folders.length > 0 && (
						<div>
							<h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-4">
								Pastas
							</h3>
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
								{folders.map((folder) => (
									<button
										key={folder.id}
										type="button"
										onClick={() => {
											setCurrentFolderId(folder.id);
											setCurrentPage(1);
											setSearchQuery('');
										}}
										className="group flex flex-col items-center gap-3 p-5 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl hover:border-violet-400 dark:hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-200 text-left"
									>
										<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-orange-500 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-[1.02] transition-transform">
											<FolderOpen className="w-7 h-7 text-white" />
										</div>
										<span className="font-medium text-slate-900 dark:text-white text-sm text-center line-clamp-2 w-full">
											{folder.name}
										</span>
										<ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 transition-colors" />
									</button>
								))}
							</div>
						</div>
					)}

					{/* Files */}
					{paginatedFiles.length > 0 && (
						<div>
							<h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-4">
								Vetores
							</h3>

							{viewMode === 'grid' ? (
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
									{paginatedFiles.map((file) => {
										const showThumbnail = isImageMime(file.mimeType);
										const badge = getFormatBadge(file);
										const badgeColor =
											BADGE_COLORS[badge] ??
											'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

										return (
											<div
												key={file.id}
												className="group flex flex-col bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-violet-400 dark:hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-200"
											>
												{/* Preview */}
												<div className="aspect-square bg-slate-50 dark:bg-[#1a1a1d] relative overflow-hidden">
													{showThumbnail ? (
														<img
															src={file.fileUrl}
															alt={file.name}
															className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
														/>
													) : (
														<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-white/5 dark:to-white/[0.02]">
															<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
																<FolderOpen className="w-7 h-7 text-white" />
															</div>
														</div>
													)}

													{/* Format badge */}
													<span
														className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${badgeColor}`}
													>
														{badge}
													</span>

													{/* Action buttons overlay */}
													<div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
														<button
															type="button"
															onClick={() => handleFavoriteClick(file)}
															className={`p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 shadow-md transition-colors ${file.isFavorited ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
															title="Favoritar"
														>
															<Heart
																className={`w-4 h-4 ${file.isFavorited ? 'fill-current' : ''}`}
															/>
														</button>
														<button
															type="button"
															onClick={() => handleDownload(file)}
															className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 shadow-md text-violet-600 dark:text-violet-400 hover:bg-violet-600 hover:text-white transition-colors"
															title="Download"
														>
															<Download className="w-4 h-4" />
														</button>
													</div>
												</div>

												{/* Info */}
												<div className="p-3">
													<span className="font-medium text-slate-900 dark:text-white text-sm line-clamp-2">
														{file.name}
													</span>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								/* List view */
								<div className="space-y-2">
									{paginatedFiles.map((file) => {
										const badge = getFormatBadge(file);
										const badgeColor =
											BADGE_COLORS[badge] ??
											'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
										const showThumbnail = isImageMime(file.mimeType);

										return (
											<div
												key={file.id}
												className="group flex items-center gap-4 p-3 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl hover:border-violet-400 dark:hover:border-violet-500/40 transition-all"
											>
												{/* Thumbnail */}
												<div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-50 dark:bg-[#1a1a1d] flex-shrink-0">
													{showThumbnail ? (
														<img
															src={file.fileUrl}
															alt={file.name}
															className="w-full h-full object-cover"
														/>
													) : (
														<div className="w-full h-full flex items-center justify-center">
															<FolderOpen className="w-5 h-5 text-violet-600" />
														</div>
													)}
												</div>

												{/* Name */}
												<span className="flex-1 font-medium text-sm text-slate-900 dark:text-white truncate">
													{file.name}
												</span>

												{/* Badge */}
												<span
													className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${badgeColor}`}
												>
													{badge}
												</span>

												{/* Actions */}
												<div className="flex items-center gap-1.5">
													<button
														type="button"
														onClick={() => handleFavoriteClick(file)}
														className={`p-1.5 rounded-lg transition-colors ${file.isFavorited ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
														title="Favoritar"
													>
														<Heart
															className={`w-4 h-4 ${file.isFavorited ? 'fill-current' : ''}`}
														/>
													</button>
													<button
														type="button"
														onClick={() => handleDownload(file)}
														className="p-1.5 rounded-lg text-violet-600 dark:text-violet-400 hover:bg-violet-600 hover:text-white transition-colors"
														title="Download"
													>
														<Download className="w-4 h-4" />
													</button>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					)}

					{/* Empty state */}
					{folders.length === 0 && allFiles.length === 0 && (
						<div className="text-center py-20 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl">
							<FolderOpen className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-6 opacity-60" />
							<p className="text-slate-600 dark:text-gray-400 font-medium text-lg">
								{searchQuery
									? 'Nenhum resultado encontrado'
									: 'Esta pasta está vazia'}
							</p>
							<p className="text-sm text-slate-500 dark:text-gray-500 mt-2">
								{searchQuery
									? 'Tente usar outros termos na busca.'
									: 'Volte em breve para ver novos conteúdos'}
							</p>
						</div>
					)}
				</div>
			)}

			{/* ============================================================ */}
			{/*  7 - PAGINATION                                              */}
			{/* ============================================================ */}
			{totalFiles > 0 && (
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
					<p className="text-sm text-slate-500 dark:text-gray-400">
						Mostrando{' '}
						<span className="font-semibold text-slate-700 dark:text-slate-300">
							{showingFrom} a {showingTo}
						</span>{' '}
						de{' '}
						<span className="font-semibold text-slate-700 dark:text-slate-300">
							{totalFiles}
						</span>
					</p>

					{totalPages > 1 && (
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								disabled={currentPage === 1}
								onClick={() => setCurrentPage((p) => p - 1)}
								className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-400 dark:hover:border-violet-500/40 transition-colors"
							>
								Anterior
							</button>

							{Array.from({ length: totalPages }, (_, i) => i + 1)
								.filter((page) => {
									if (totalPages <= 7) return true;
									if (page === 1 || page === totalPages) return true;
									return Math.abs(page - currentPage) <= 1;
								})
								.map((page, idx, arr) => {
									const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
									return (
										<span key={page} className="flex items-center">
											{showEllipsis && (
												<span className="px-1 text-slate-400 dark:text-gray-500">
													...
												</span>
											)}
											<button
												type="button"
												onClick={() => setCurrentPage(page)}
												className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
													page === currentPage
														? 'bg-violet-600 text-white'
														: 'text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-500/10'
												}`}
											>
												{page}
											</button>
										</span>
									);
								})}

							<button
								type="button"
								disabled={currentPage === totalPages}
								onClick={() => setCurrentPage((p) => p + 1)}
								className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-400 dark:hover:border-violet-500/40 transition-colors"
							>
								Próximo
							</button>
						</div>
					)}
				</div>
			)}

			{/* ============================================================ */}
			{/*  8 - WIDGET: DICA CPL                                        */}
			{/* ============================================================ */}
			<div className="relative overflow-hidden rounded-2xl border border-violet-200 dark:border-violet-500/20 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-800/20 dark:to-violet-700/10 p-6">
				<div className="flex items-start gap-4">
					<div className="p-3 rounded-xl bg-violet-200 dark:bg-violet-500/20 flex-shrink-0">
						<Lightbulb className="w-6 h-6 text-violet-600 dark:text-violet-400" />
					</div>
					<div>
						<h3 className="font-bold text-violet-800 dark:text-violet-400 mb-1">
							Dica CPL
						</h3>
						<p className="text-sm text-violet-700 dark:text-violet-400 leading-relaxed">
							Use vetores em formato SVG ou DXF para obter a melhor qualidade na
							gravação a laser. Esses formatos preservam as linhas vetoriais e
							garantem cortes precisos em qualquer escala.
						</p>
					</div>
				</div>
				{/* Decorative */}
				<div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-violet-200/50 dark:bg-violet-500/10 blur-2xl" />
			</div>
		</div>
	);
}
