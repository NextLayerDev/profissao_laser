'use client';

import {
	ArrowLeft,
	ArrowUpDown,
	Check,
	ChevronDown,
	ChevronRight,
	Download,
	FileType,
	FolderOpen,
	Grid,
	Heart,
	Lightbulb,
	List,
	type LucideIcon,
	Search,
	Tag,
	Upload,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { VectorLibraryBreadcrumbs } from '@/components/community/vector-library-breadcrumbs';
import { usePermissions } from '@/hooks/use-permissions';
import {
	useFavoriteFile,
	useVectorLibraryBreadcrumbs,
	useVectorLibraryCategories,
	useVectorLibraryContents,
	useVectorLibraryFeatured,
	useVectorLibraryFormats,
	useVectorLibraryStats,
} from '@/hooks/use-vector-library';
import type { VectorLibraryFile } from '@/types/vector-library';
import { VectorPreviewModal } from './vector-preview-modal';

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

function badgeColorFor(badge: string): string {
	return (
		BADGE_COLORS[badge] ??
		'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
	);
}

/* ------------------------------------------------------------------ */
/*  Stats / Sort config                                               */
/* ------------------------------------------------------------------ */

const STATS_CONFIG = [
	{ key: 'totalFiles' as const, label: 'Vetores disponíveis', icon: Grid },
	{ key: 'totalCollections' as const, label: 'Coleções', icon: FolderOpen },
	{ key: 'totalFavorites' as const, label: 'Favoritos', icon: Heart },
	{ key: 'totalDownloads' as const, label: 'Downloads', icon: Download },
];

type SortBy = 'recent' | 'popular' | 'name';

const SORT_LABELS: Record<SortBy, string> = {
	recent: 'Recentes',
	popular: 'Populares',
	name: 'Nome',
};

const SORT_OPTIONS: { value: string; label: string }[] = [
	{ value: 'recent', label: 'Recentes' },
	{ value: 'popular', label: 'Populares' },
	{ value: 'name', label: 'Nome' },
];

const ITEMS_PER_PAGE = 12;

/* ------------------------------------------------------------------ */
/*  Filter dropdown                                                   */
/* ------------------------------------------------------------------ */

interface FilterDropdownProps {
	triggerLabel: string;
	icon: LucideIcon;
	options: { value: string; label: string; count?: number }[];
	selectedValue: string | null;
	onSelect: (value: string | null) => void;
	/** Quando definido, mostra uma opção que limpa o filtro (volta a null). */
	clearLabel?: string;
}

function FilterDropdown({
	triggerLabel,
	icon: Icon,
	options,
	selectedValue,
	onSelect,
	clearLabel,
}: FilterDropdownProps) {
	const [open, setOpen] = useState(false);
	const active = selectedValue != null;

	const optionClass = (isActive: boolean) =>
		`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
			isActive
				? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium'
				: 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
		}`;

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
					active
						? 'border-violet-400 dark:border-violet-500/50 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
						: 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-600 dark:text-slate-300 hover:border-violet-400 dark:hover:border-violet-500/50'
				}`}
			>
				<Icon className="w-3.5 h-3.5" />
				<span className="max-w-[140px] truncate">{triggerLabel}</span>
				<ChevronDown
					className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
				/>
			</button>

			{open && (
				<>
					<button
						type="button"
						aria-label="Fechar"
						className="fixed inset-0 z-40 cursor-default"
						onClick={() => setOpen(false)}
					/>
					<div className="absolute left-0 top-full mt-1.5 z-50 min-w-[220px] max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] shadow-xl p-1 scrollbar-thin">
						{clearLabel && (
							<button
								type="button"
								onClick={() => {
									onSelect(null);
									setOpen(false);
								}}
								className={optionClass(selectedValue === null)}
							>
								<span className="truncate">{clearLabel}</span>
								{selectedValue === null && (
									<Check className="w-4 h-4 shrink-0" />
								)}
							</button>
						)}
						{options.map((o) => (
							<button
								key={o.value}
								type="button"
								onClick={() => {
									onSelect(o.value);
									setOpen(false);
								}}
								className={optionClass(selectedValue === o.value)}
							>
								<span className="flex items-center gap-2 truncate">
									<span className="truncate">{o.label}</span>
									{o.count != null && (
										<span className="text-xs text-slate-400 dark:text-gray-500">
											{o.count.toLocaleString('pt-BR')}
										</span>
									)}
								</span>
								{selectedValue === o.value && (
									<Check className="w-4 h-4 shrink-0" />
								)}
							</button>
						))}
						{options.length === 0 && (
							<p className="px-3 py-2 text-xs text-slate-400 dark:text-gray-500">
								Nenhuma opção disponível
							</p>
						)}
					</div>
				</>
			)}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function BibliotecaVetoresView() {
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
	const [sortBy, setSortBy] = useState<SortBy>('name');
	const [currentPage, setCurrentPage] = useState(1);
	const [previewFile, setPreviewFile] = useState<VectorLibraryFile | null>(
		null,
	);

	/* ---- Debounced search → API ---- */
	useEffect(() => {
		const t = setTimeout(() => {
			setDebouncedSearch(searchQuery.trim());
			setCurrentPage(1);
		}, 350);
		return () => clearTimeout(t);
	}, [searchQuery]);

	const { canAdmin } = usePermissions();

	const { data: apiStats } = useVectorLibraryStats();
	const { data: categories = [] } = useVectorLibraryCategories();
	const { data: formats = [] } = useVectorLibraryFormats();
	const { data: featured = [] } = useVectorLibraryFeatured();
	const favoriteFileMutation = useFavoriteFile();

	const { data: contents, isLoading: contentsLoading } =
		useVectorLibraryContents({
			parentId: selectedCategory ? null : currentFolderId,
			search: debouncedSearch || undefined,
			category: selectedCategory || undefined,
			format: selectedFormat || undefined,
			sort: sortBy,
			page: currentPage,
			limit: ITEMS_PER_PAGE,
		});
	const { data: breadcrumbs = [] } =
		useVectorLibraryBreadcrumbs(currentFolderId);

	/* ---- Folders: client-side name filter (API não filtra pastas) ---- */
	const folders = useMemo(() => {
		const sorted = [...(contents?.folders ?? [])].sort((a, b) =>
			a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
		);
		if (!searchQuery.trim()) return sorted;
		const q = searchQuery.toLowerCase();
		return sorted.filter((f) => f.name.toLowerCase().includes(q));
	}, [contents?.folders, searchQuery]);

	/* ---- Files: já vêm filtrados/ordenados/paginados da API ---- */
	const files = contents?.files ?? [];
	const total = contents?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
	const showingFrom = total === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
	const showingTo = Math.min(currentPage * ITEMS_PER_PAGE, total);

	/* ---- Preview: live state (reflete favoritar após refetch) ---- */
	const livePreviewFile = previewFile
		? (files.find((f) => f.id === previewFile.id) ??
			featured.find((f) => f.id === previewFile.id) ??
			previewFile)
		: null;

	/* ---- Navigation ---- */
	const canGoBack = currentFolderId !== null || selectedCategory !== null;

	const enterFolder = (id: string | null) => {
		setCurrentFolderId(id);
		setSelectedCategory(null);
		setCurrentPage(1);
		setSearchQuery('');
	};

	const enterCategory = (name: string | null) => {
		setSelectedCategory(name);
		setCurrentFolderId(null);
		setCurrentPage(1);
	};

	const handleBack = () => {
		if (selectedCategory) {
			setSelectedCategory(null);
			setCurrentPage(1);
			return;
		}
		const parentId = breadcrumbs[breadcrumbs.length - 2]?.id ?? null;
		setCurrentFolderId(parentId);
		setCurrentPage(1);
		setSearchQuery('');
	};

	const handleFavoriteClick = (file: VectorLibraryFile) => {
		favoriteFileMutation.mutate({
			id: file.id,
			isFavorited: !!file.isFavorited,
		});
	};

	const handleDownload = async (file: VectorLibraryFile) => {
		try {
			const res = await fetch(file.fileUrl);
			const blob = await res.blob();
			const filename = file.name.includes('.') ? file.name : `${file.name}.svg`;
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
		} catch {
			window.open(file.fileUrl, '_blank');
		}
	};

	const handleUploadClick = () => {
		toast('Em breve', {
			description: 'Envio de vetores disponível em breve.',
		});
	};

	const filesHeading = selectedCategory
		? `Categoria: ${selectedCategory}`
		: 'Vetores';

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
							onNavigate={(id) => enterFolder(id)}
						/>
						<p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
							Vetores e arquivos prontos para gravação a laser.
						</p>
						{canGoBack && (
							<button
								type="button"
								onClick={handleBack}
								className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-violet-400 dark:hover:border-violet-500/50 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
							>
								<ArrowLeft className="w-4 h-4" />
								Voltar
							</button>
						)}
					</div>

					<div className="flex items-center gap-3">
						{/* Search */}
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<input
								type="text"
								placeholder="Buscar vetores..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9 pr-4 py-2 w-56 md:w-64 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
							/>
						</div>

						{/* Upload button (admin only) */}
						{canAdmin && (
							<button
								type="button"
								onClick={handleUploadClick}
								className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-600 text-white text-sm font-semibold transition-colors"
							>
								<Upload className="w-4 h-4" />
								<span className="hidden sm:inline">Enviar vetor</span>
							</button>
						)}
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
					</div>

					<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
						{categories.map((cat) => {
							const isActive = selectedCategory === cat.name;
							return (
								<button
									key={cat.name}
									type="button"
									onClick={() => enterCategory(isActive ? null : cat.name)}
									className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
										isActive
											? 'border-violet-400 dark:border-violet-500/50 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
											: 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-700 dark:text-slate-300 hover:border-violet-400 dark:hover:border-violet-500/50 hover:bg-violet-50 dark:hover:bg-violet-500/10'
									}`}
								>
									{cat.icon && <span>{cat.icon}</span>}
									<span>{cat.name}</span>
									<span className="text-xs text-slate-400 dark:text-gray-500">
										{cat.count.toLocaleString('pt-BR')}
									</span>
								</button>
							);
						})}
					</div>
				</div>
			)}

			{/* ============================================================ */}
			{/*  4 - DESTAQUES CAROUSEL                                      */}
			{/* ============================================================ */}
			{featured.length > 0 && !selectedCategory && currentFolderId === null && (
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
									onClick={() => setPreviewFile(file)}
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
				<FilterDropdown
					triggerLabel={selectedCategory ?? 'Categorias'}
					icon={Tag}
					options={categories.map((c) => ({
						value: c.name,
						label: c.name,
						count: c.count,
					}))}
					selectedValue={selectedCategory}
					onSelect={enterCategory}
					clearLabel="Todas as categorias"
				/>

				<FilterDropdown
					triggerLabel={selectedFormat ?? 'Formatos'}
					icon={FileType}
					options={formats.map((f) => ({
						value: f.name,
						label: f.name,
						count: f.count,
					}))}
					selectedValue={selectedFormat}
					onSelect={(v) => {
						setSelectedFormat(v);
						setCurrentPage(1);
					}}
					clearLabel="Todos os formatos"
				/>

				<div className="flex-1" />

				{/* Sort */}
				<FilterDropdown
					triggerLabel={SORT_LABELS[sortBy]}
					icon={ArrowUpDown}
					options={SORT_OPTIONS}
					selectedValue={sortBy}
					onSelect={(v) => {
						if (v) {
							setSortBy(v as SortBy);
							setCurrentPage(1);
						}
					}}
				/>

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
										onClick={() => enterFolder(folder.id)}
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
					{files.length > 0 && (
						<div>
							<h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-4">
								{filesHeading}
							</h3>

							{viewMode === 'grid' ? (
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
									{files.map((file) => {
										const showThumbnail = isImageMime(file.mimeType);
										const badge = getFormatBadge(file);
										const badgeColor = badgeColorFor(badge);

										return (
											<div
												key={file.id}
												className="group relative flex flex-col bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-violet-400 dark:hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-200"
											>
												{/* Clickable overlay → preview */}
												<button
													type="button"
													onClick={() => setPreviewFile(file)}
													aria-label={`Pré-visualizar ${file.name}`}
													className="absolute inset-0 z-[1]"
												/>

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
													<div className="absolute bottom-2 right-2 z-[2] flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																handleFavoriteClick(file);
															}}
															className={`p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 shadow-md transition-colors ${file.isFavorited ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
															title="Favoritar"
														>
															<Heart
																className={`w-4 h-4 ${file.isFavorited ? 'fill-current' : ''}`}
															/>
														</button>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																handleDownload(file);
															}}
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
									{files.map((file) => {
										const badge = getFormatBadge(file);
										const badgeColor = badgeColorFor(badge);
										const showThumbnail = isImageMime(file.mimeType);

										return (
											<div
												key={file.id}
												className="group relative flex items-center gap-4 p-3 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl hover:border-violet-400 dark:hover:border-violet-500/40 transition-all"
											>
												{/* Clickable overlay → preview */}
												<button
													type="button"
													onClick={() => setPreviewFile(file)}
													aria-label={`Pré-visualizar ${file.name}`}
													className="absolute inset-0 z-[1]"
												/>

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
												<div className="relative z-[2] flex items-center gap-1.5">
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															handleFavoriteClick(file);
														}}
														className={`p-1.5 rounded-lg transition-colors ${file.isFavorited ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
														title="Favoritar"
													>
														<Heart
															className={`w-4 h-4 ${file.isFavorited ? 'fill-current' : ''}`}
														/>
													</button>
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															handleDownload(file);
														}}
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
					{folders.length === 0 && total === 0 && (
						<div className="text-center py-20 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl">
							<FolderOpen className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-6 opacity-60" />
							<p className="text-slate-600 dark:text-gray-400 font-medium text-lg">
								{searchQuery || selectedCategory || selectedFormat
									? 'Nenhum resultado encontrado'
									: 'Esta pasta está vazia'}
							</p>
							<p className="text-sm text-slate-500 dark:text-gray-500 mt-2">
								{searchQuery || selectedCategory || selectedFormat
									? 'Tente ajustar a busca ou os filtros.'
									: 'Volte em breve para ver novos conteúdos'}
							</p>
						</div>
					)}
				</div>
			)}

			{/* ============================================================ */}
			{/*  7 - PAGINATION                                              */}
			{/* ============================================================ */}
			{total > 0 && (
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
					<p className="text-sm text-slate-500 dark:text-gray-400">
						Mostrando{' '}
						<span className="font-semibold text-slate-700 dark:text-slate-300">
							{showingFrom} a {showingTo}
						</span>{' '}
						de{' '}
						<span className="font-semibold text-slate-700 dark:text-slate-300">
							{total}
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

			{/* ============================================================ */}
			{/*  PREVIEW MODAL                                               */}
			{/* ============================================================ */}
			{livePreviewFile && (
				<VectorPreviewModal
					file={livePreviewFile}
					badge={getFormatBadge(livePreviewFile)}
					badgeColor={badgeColorFor(getFormatBadge(livePreviewFile))}
					isImage={isImageMime(livePreviewFile.mimeType)}
					isFavoriting={favoriteFileMutation.isPending}
					onClose={() => setPreviewFile(null)}
					onDownload={handleDownload}
					onToggleFavorite={handleFavoriteClick}
				/>
			)}
		</div>
	);
}
