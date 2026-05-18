'use client';

import {
	ChevronLeft,
	ImageIcon,
	Loader2,
	Package,
	Pencil,
	Plus,
	Search,
	Sliders,
	Trash2,
	Upload,
	X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ProductParametersSection } from '@/components/previas/product-parameters-section';
import {
	useCreateLaserProduct,
	useCreateLaserProductVariant,
	useDeleteLaserProduct,
	useDeleteLaserProductVariant,
	useLaserProduct,
	useLaserProducts,
	useUpdateLaserProduct,
	useUpdateLaserProductVariant,
	useUploadLaserProductVariantImage,
} from '@/hooks/use-laser-products';
import type {
	CreateLaserProductPayload,
	CreateLaserProductVariantPayload,
	LaserProduct,
	LaserProductVariant,
} from '@/types/laser-products';

const inputCls =
	'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40';

const selectCls =
	'px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500';

/* ------------------------------------------------------------------ */
/*  Product Modal                                                       */
/* ------------------------------------------------------------------ */

function ProductModal({
	editing,
	onClose,
	onSave,
	saving,
}: {
	editing: LaserProduct | null;
	onClose: () => void;
	onSave: (data: CreateLaserProductPayload) => void;
	saving: boolean;
}) {
	const [name, setName] = useState(editing?.name ?? '');
	const [description, setDescription] = useState(editing?.description ?? '');
	const [category, setCategory] = useState(editing?.category ?? '');
	const [defaultMaterial, setDefaultMaterial] = useState(
		editing?.defaultMaterial ?? '',
	);
	const [tags, setTags] = useState(editing?.tags?.join(', ') ?? '');
	const [status, setStatus] = useState<'ativo' | 'inativo'>(
		editing?.status ?? 'ativo',
	);

	const canSave = name.trim() && category.trim();

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-700">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						{editing ? 'Editar Produto' : 'Novo Produto'}
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
					>
						<X className="w-4 h-4 text-slate-500 dark:text-gray-400" />
					</button>
				</div>
				<div className="p-5 space-y-4">
					<div>
						<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
							Nome *
						</span>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Ex: Caneca Termica 500ml"
							className={inputCls}
						/>
					</div>
					<div>
						<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
							Descricao
						</span>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							placeholder="Descricao do produto..."
							className={`${inputCls} resize-none`}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
								Categoria *
							</span>
							<input
								type="text"
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								placeholder="Ex: caneca, tabua, abridor"
								className={inputCls}
							/>
						</div>
						<div>
							<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
								Material Padrao
							</span>
							<input
								type="text"
								value={defaultMaterial}
								onChange={(e) => setDefaultMaterial(e.target.value)}
								placeholder="Ex: aco-inox, madeira"
								className={inputCls}
							/>
						</div>
					</div>
					<div>
						<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
							Tags (separadas por virgula)
						</span>
						<input
							type="text"
							value={tags}
							onChange={(e) => setTags(e.target.value)}
							placeholder="Ex: premium, inox, personalizado"
							className={inputCls}
						/>
					</div>
					<div>
						<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
							Status
						</span>
						<select
							value={status}
							onChange={(e) => setStatus(e.target.value as 'ativo' | 'inativo')}
							className={selectCls}
						>
							<option value="ativo">Ativo</option>
							<option value="inativo">Inativo</option>
						</select>
					</div>
				</div>
				<div className="flex justify-end gap-3 p-5 border-t border-slate-200 dark:border-gray-700">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors text-sm"
					>
						Cancelar
					</button>
					<button
						type="button"
						disabled={saving || !canSave}
						onClick={() =>
							onSave({
								name: name.trim(),
								description: description.trim() || undefined,
								category: category.trim(),
								defaultMaterial: defaultMaterial.trim() || undefined,
								tags: tags
									.split(',')
									.map((t) => t.trim())
									.filter(Boolean),
								status,
							})
						}
						className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium transition-colors text-sm disabled:opacity-50"
					>
						{saving && <Loader2 className="w-4 h-4 animate-spin" />}
						Guardar
					</button>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Variant Manager                                                     */
/* ------------------------------------------------------------------ */

function VariantManager({
	productId,
	onBack,
}: {
	productId: string;
	onBack: () => void;
}) {
	const { data: product, isLoading } = useLaserProduct(productId);
	const createVariant = useCreateLaserProductVariant();
	const updateVariant = useUpdateLaserProductVariant();
	const deleteVariant = useDeleteLaserProductVariant();
	const uploadImage = useUploadLaserProductVariantImage();

	const [showForm, setShowForm] = useState(false);
	const [editingVariant, setEditingVariant] =
		useState<LaserProductVariant | null>(null);
	const [vName, setVName] = useState('');
	const [vColorName, setVColorName] = useState('');
	const [vColorHex, setVColorHex] = useState('');
	const [vTipo, setVTipo] = useState('');
	const [vOrder, setVOrder] = useState(0);
	const [vStatus, setVStatus] = useState<'ativo' | 'inativo'>('ativo');

	const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

	function openForm(variant?: LaserProductVariant) {
		if (variant) {
			setEditingVariant(variant);
			setVName(variant.name);
			setVColorName(variant.colorName ?? '');
			setVColorHex(variant.colorHex ?? '');
			setVTipo(variant.tipo ?? '');
			setVOrder(variant.order);
			setVStatus(variant.status);
		} else {
			setEditingVariant(null);
			setVName('');
			setVColorName('');
			setVColorHex('');
			setVTipo('');
			setVOrder(product?.variants?.length ?? 0);
			setVStatus('ativo');
		}
		setShowForm(true);
	}

	async function handleSaveVariant() {
		if (!vName.trim()) return;
		if (!vColorName.trim() && !vTipo.trim()) {
			toast.error('Preencha pelo menos Cor ou Tipo');
			return;
		}
		try {
			const payload: CreateLaserProductVariantPayload = {
				name: vName.trim(),
				colorName: vColorName.trim() || undefined,
				colorHex: vColorHex.trim() || undefined,
				tipo: vTipo.trim() || undefined,
				imageUrl:
					editingVariant?.imageUrl ?? 'https://placeholder.com/temp.png',
				order: vOrder,
				status: vStatus,
			};

			if (editingVariant) {
				await updateVariant.mutateAsync({
					productId,
					variantId: editingVariant.id,
					payload,
				});
				toast.success('Variante atualizada!');
			} else {
				await createVariant.mutateAsync({ productId, payload });
				toast.success('Variante criada!');
			}
			setShowForm(false);
		} catch {
			toast.error('Erro ao salvar variante');
		}
	}

	async function handleDeleteVariant(variantId: string) {
		if (!confirm('Excluir esta variante?')) return;
		try {
			await deleteVariant.mutateAsync({ productId, variantId });
			toast.success('Variante excluida!');
		} catch {
			toast.error('Erro ao excluir variante');
		}
	}

	async function handleImageUpload(variantId: string, file: File) {
		try {
			await uploadImage.mutateAsync({ productId, variantId, file });
			toast.success('Imagem atualizada!');
		} catch {
			toast.error('Erro ao subir imagem');
		}
	}

	if (isLoading) {
		return (
			<div className="flex justify-center py-16">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (!product) return null;

	const variants = product.variants ?? [];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={onBack}
					className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
				>
					<ChevronLeft className="w-5 h-5 text-slate-500" />
				</button>
				<div className="flex-1">
					<h3 className="text-xl font-bold text-slate-900 dark:text-white">
						{product.name}
					</h3>
					<p className="text-sm text-slate-500 dark:text-gray-400">
						{product.category} · {variants.length} variante
						{variants.length !== 1 ? 's' : ''}
					</p>
				</div>
				<button
					type="button"
					onClick={() => openForm()}
					className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors text-sm"
				>
					<Plus className="w-4 h-4" />
					Nova Variante
				</button>
			</div>

			{/* Variants grid */}
			{variants.length === 0 ? (
				<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl p-12 text-center">
					<p className="text-slate-600 dark:text-gray-400 mb-4">
						Nenhuma variante cadastrada
					</p>
					<button
						type="button"
						onClick={() => openForm()}
						className="text-violet-600 dark:text-violet-400 hover:text-violet-500 font-medium"
					>
						Criar primeira variante
					</button>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					{variants.map((v) => (
						<div
							key={v.id}
							className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden"
						>
							{/* Image */}
							<div className="aspect-square bg-slate-100 dark:bg-black/30 relative group">
								{v.imageUrl && !v.imageUrl.includes('placeholder') ? (
									<img
										src={v.imageUrl}
										alt={v.name}
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center">
										<ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-600" />
									</div>
								)}
								{/* Upload overlay */}
								<button
									type="button"
									onClick={() => fileInputRefs.current[v.id]?.click()}
									className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
								>
									<Upload className="w-6 h-6 text-white" />
								</button>
								<input
									ref={(el) => {
										fileInputRefs.current[v.id] = el;
									}}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={(e) => {
										const f = e.target.files?.[0];
										if (f) handleImageUpload(v.id, f);
										e.target.value = '';
									}}
								/>
							</div>
							{/* Info */}
							<div className="p-3">
								<div className="flex items-center gap-2 mb-1">
									<p className="font-semibold text-sm text-slate-900 dark:text-white truncate flex-1">
										{v.name}
									</p>
									{v.colorHex && (
										<span
											className="w-4 h-4 rounded-full border border-slate-200 dark:border-gray-600 shrink-0"
											style={{ backgroundColor: v.colorHex }}
										/>
									)}
								</div>
								<div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
									{v.colorName && <span>{v.colorName}</span>}
									{v.tipo && <span>{v.tipo}</span>}
									<span
										className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
											v.status === 'ativo'
												? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
												: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-gray-400'
										}`}
									>
										{v.status}
									</span>
								</div>
								<div className="flex gap-1 mt-2">
									<button
										type="button"
										onClick={() => openForm(v)}
										className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
									>
										<Pencil className="w-3 h-3" />
										Editar
									</button>
									<button
										type="button"
										onClick={() => handleDeleteVariant(v.id)}
										className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
									>
										<Trash2 className="w-3.5 h-3.5" />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Variant Form Modal */}
			{showForm && (
				<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
					<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-md">
						<div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-700">
							<h3 className="text-lg font-bold text-slate-900 dark:text-white">
								{editingVariant ? 'Editar Variante' : 'Nova Variante'}
							</h3>
							<button
								type="button"
								onClick={() => setShowForm(false)}
								className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
							>
								<X className="w-4 h-4 text-slate-500" />
							</button>
						</div>
						<div className="p-5 space-y-4">
							<div>
								<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
									Nome *
								</span>
								<input
									type="text"
									value={vName}
									onChange={(e) => setVName(e.target.value)}
									placeholder="Ex: Prata Escovado"
									className={inputCls}
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
										Cor
									</span>
									<input
										type="text"
										value={vColorName}
										onChange={(e) => setVColorName(e.target.value)}
										placeholder="Ex: Prata"
										className={inputCls}
									/>
								</div>
								<div>
									<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
										Hex
									</span>
									<input
										type="text"
										value={vColorHex}
										onChange={(e) => setVColorHex(e.target.value)}
										placeholder="#C0C0C0"
										className={inputCls}
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
										Tipo
									</span>
									<input
										type="text"
										value={vTipo}
										onChange={(e) => setVTipo(e.target.value)}
										placeholder="Ex: pequeno, grande"
										className={inputCls}
									/>
								</div>
								<div>
									<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
										Ordem
									</span>
									<input
										type="number"
										value={vOrder}
										onChange={(e) => setVOrder(Number(e.target.value))}
										min={0}
										className={inputCls}
									/>
								</div>
							</div>
							<div>
								<span className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">
									Status
								</span>
								<select
									value={vStatus}
									onChange={(e) =>
										setVStatus(e.target.value as 'ativo' | 'inativo')
									}
									className={selectCls}
								>
									<option value="ativo">Ativo</option>
									<option value="inativo">Inativo</option>
								</select>
							</div>
						</div>
						<div className="flex justify-end gap-3 p-5 border-t border-slate-200 dark:border-gray-700">
							<button
								type="button"
								onClick={() => setShowForm(false)}
								className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors text-sm"
							>
								Cancelar
							</button>
							<button
								type="button"
								disabled={
									!vName.trim() ||
									(!vColorName.trim() && !vTipo.trim()) ||
									createVariant.isPending ||
									updateVariant.isPending
								}
								onClick={() => void handleSaveVariant()}
								className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium transition-colors text-sm disabled:opacity-50"
							>
								{(createVariant.isPending || updateVariant.isPending) && (
									<Loader2 className="w-4 h-4 animate-spin" />
								)}
								Guardar
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Main View                                                           */
/* ------------------------------------------------------------------ */

export function LaserProductsAdminView() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [productModal, setProductModal] = useState<{
		open: boolean;
		editing: LaserProduct | null;
	}>({ open: false, editing: null });
	const [selectedProductId, setSelectedProductId] = useState<string | null>(
		null,
	);
	const [parametersProduct, setParametersProduct] = useState<{
		id: string;
		name: string;
	} | null>(null);

	const { data, isLoading } = useLaserProducts({
		page,
		limit: 20,
		search: search.trim() || undefined,
		category: categoryFilter || undefined,
		status: (statusFilter as 'ativo' | 'inativo') || undefined,
	});

	const createMutation = useCreateLaserProduct();
	const updateMutation = useUpdateLaserProduct();
	const deleteMutation = useDeleteLaserProduct();

	const products = data?.data ?? [];
	const total = data?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / 20));

	const categories = useMemo(() => {
		const set = new Set(products.map((p) => p.category));
		return Array.from(set).sort();
	}, [products]);

	async function handleSaveProduct(payload: CreateLaserProductPayload) {
		try {
			if (productModal.editing) {
				await updateMutation.mutateAsync({
					id: productModal.editing.id,
					payload,
				});
				toast.success('Produto atualizado!');
			} else {
				await createMutation.mutateAsync(payload);
				toast.success('Produto criado!');
			}
			setProductModal({ open: false, editing: null });
		} catch {
			toast.error('Erro ao salvar produto');
		}
	}

	async function handleDeleteProduct(product: LaserProduct) {
		if (!confirm(`Excluir "${product.name}" e todas as variantes?`)) return;
		try {
			await deleteMutation.mutateAsync(product.id);
			toast.success('Produto excluido!');
		} catch {
			toast.error('Erro ao excluir produto');
		}
	}

	// If managing parameters, show parameters section
	if (parametersProduct) {
		return (
			<ProductParametersSection
				productId={parametersProduct.id}
				productName={parametersProduct.name}
				onBack={() => setParametersProduct(null)}
			/>
		);
	}

	// If managing variants, show variant manager
	if (selectedProductId) {
		return (
			<VariantManager
				productId={selectedProductId}
				onBack={() => setSelectedProductId(null)}
			/>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-slate-900 dark:text-white">
						Catalogo de Produtos
					</h2>
					<p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
						{total} produto{total !== 1 ? 's' : ''} cadastrado
						{total !== 1 ? 's' : ''}
					</p>
				</div>
				<button
					type="button"
					onClick={() => setProductModal({ open: true, editing: null })}
					className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
				>
					<Plus className="w-4 h-4" />
					Novo Produto
				</button>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap gap-3">
				<div className="relative flex-1 min-w-[200px]">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
					<input
						type="text"
						placeholder="Buscar por nome..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="w-full pl-9 pr-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:outline-none"
					/>
				</div>
				<select
					value={categoryFilter}
					onChange={(e) => {
						setCategoryFilter(e.target.value);
						setPage(1);
					}}
					className={selectCls}
				>
					<option value="">Todas categorias</option>
					{categories.map((c) => (
						<option key={c} value={c}>
							{c}
						</option>
					))}
				</select>
				<select
					value={statusFilter}
					onChange={(e) => {
						setStatusFilter(e.target.value);
						setPage(1);
					}}
					className={selectCls}
				>
					<option value="">Todos status</option>
					<option value="ativo">Ativo</option>
					<option value="inativo">Inativo</option>
				</select>
			</div>

			{/* Table */}
			{isLoading ? (
				<div className="flex justify-center py-16">
					<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
				</div>
			) : products.length === 0 ? (
				<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl p-12 text-center">
					<Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
					<p className="text-slate-600 dark:text-gray-400 mb-4">
						Nenhum produto encontrado
					</p>
					<button
						type="button"
						onClick={() => setProductModal({ open: true, editing: null })}
						className="text-violet-600 dark:text-violet-400 hover:text-violet-500 font-medium"
					>
						Criar primeiro produto
					</button>
				</div>
			) : (
				<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-800">
					<table className="w-full text-sm">
						<thead className="bg-slate-50 dark:bg-white/5">
							<tr>
								<th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-gray-400">
									Produto
								</th>
								<th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-gray-400">
									Categoria
								</th>
								<th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-gray-400">
									Material
								</th>
								<th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-gray-400">
									Status
								</th>
								<th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-gray-400">
									Acoes
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 dark:divide-gray-800">
							{products.map((product) => (
								<tr
									key={product.id}
									className="bg-white dark:bg-[#1a1a1d] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
								>
									<td className="px-4 py-3">
										<button
											type="button"
											onClick={() => setSelectedProductId(product.id)}
											className="text-left hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
										>
											<p className="font-semibold text-slate-900 dark:text-white">
												{product.name}
											</p>
											{product.tags.length > 0 && (
												<div className="flex gap-1 mt-0.5">
													{product.tags.slice(0, 3).map((tag) => (
														<span
															key={tag}
															className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-gray-400 rounded"
														>
															{tag}
														</span>
													))}
												</div>
											)}
										</button>
									</td>
									<td className="px-4 py-3 text-slate-600 dark:text-gray-400 capitalize">
										{product.category}
									</td>
									<td className="px-4 py-3 text-slate-600 dark:text-gray-400">
										{product.defaultMaterial ?? '—'}
									</td>
									<td className="px-4 py-3 text-center">
										<span
											className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
												product.status === 'ativo'
													? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
													: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-gray-400'
											}`}
										>
											{product.status}
										</span>
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center justify-end gap-1">
											<button
												type="button"
												onClick={() => setSelectedProductId(product.id)}
												className="p-1.5 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-lg transition-colors"
												title="Gerenciar variantes"
											>
												<ImageIcon className="w-4 h-4" />
											</button>
											<button
												type="button"
												onClick={() =>
													setParametersProduct({
														id: product.id,
														name: product.name,
													})
												}
												className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
												title="Parametros de gravacao"
											>
												<Sliders className="w-4 h-4" />
											</button>
											<button
												type="button"
												onClick={() =>
													setProductModal({
														open: true,
														editing: product,
													})
												}
												className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
												title="Editar"
											>
												<Pencil className="w-4 h-4" />
											</button>
											<button
												type="button"
												onClick={() => void handleDeleteProduct(product)}
												className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
												title="Excluir"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-2">
					<button
						type="button"
						disabled={page <= 1}
						onClick={() => setPage(page - 1)}
						className="px-3 py-1.5 text-sm border border-slate-200 dark:border-white/10 rounded-lg disabled:opacity-30"
					>
						Anterior
					</button>
					<span className="text-sm text-slate-500">
						{page} / {totalPages}
					</span>
					<button
						type="button"
						disabled={page >= totalPages}
						onClick={() => setPage(page + 1)}
						className="px-3 py-1.5 text-sm border border-slate-200 dark:border-white/10 rounded-lg disabled:opacity-30"
					>
						Proximo
					</button>
				</div>
			)}

			{/* Product Modal */}
			{productModal.open && (
				<ProductModal
					editing={productModal.editing}
					onClose={() => setProductModal({ open: false, editing: null })}
					onSave={(data) => void handleSaveProduct(data)}
					saving={createMutation.isPending || updateMutation.isPending}
				/>
			)}
		</div>
	);
}
