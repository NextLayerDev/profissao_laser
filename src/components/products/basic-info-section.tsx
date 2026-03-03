'use client';

import {
	Calendar,
	Check,
	DollarSign,
	Globe,
	Image as ImageIcon,
	ImagePlus,
	Info,
	Layers,
	Loader2,
	Pencil,
	Plus,
	RotateCcw,
	Tag,
	X,
} from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
	useAddProductToClass,
	useClasses,
	useRemoveProductFromClass,
} from '@/hooks/use-classes';
import { useUpdateProduct, useUploadProductImage } from '@/hooks/use-products';
import type { Product } from '@/types/products';
import { TIER_STYLES } from '@/utils/constants/tier-styles';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/formatDate';

interface BasicInfoSectionProps {
	product: Product;
}

type FieldKey = 'name' | 'description' | 'category' | 'price' | 'refundDays';

function EditableField({
	label,
	value,
	display,
	fieldKey,
	productId,
	inputType = 'text',
	multiline = false,
	placeholder,
}: {
	label: string;
	value: string;
	display?: React.ReactNode;
	fieldKey: FieldKey;
	productId: string;
	inputType?: string;
	multiline?: boolean;
	placeholder?: string;
}) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(value);
	const { mutate: updateProduct, isPending } = useUpdateProduct();

	function handleSave() {
		if (draft === value) {
			setEditing(false);
			return;
		}
		const payload: Record<string, unknown> = {
			[fieldKey]: inputType === 'number' ? Number(draft) : draft,
		};
		updateProduct(
			{ id: productId, payload },
			{
				onSuccess: () => {
					toast.success('Campo atualizado.');
					setEditing(false);
				},
				onError: () => toast.error('Erro ao atualizar.'),
			},
		);
	}

	function handleCancel() {
		setDraft(value);
		setEditing(false);
	}

	return (
		<div className="flex items-start justify-between gap-4 py-3 border-b border-slate-200 dark:border-white/5 last:border-0">
			<p className="text-xs font-medium text-slate-500 dark:text-gray-500 uppercase tracking-wider w-32 shrink-0 pt-1">
				{label}
			</p>

			{editing ? (
				<div className="flex-1 flex items-start gap-2">
					{multiline ? (
						<textarea
							rows={3}
							value={draft}
							onChange={(e) => setDraft(e.target.value)}
							placeholder={placeholder}
							className="flex-1 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-violet-500/50 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 resize-none"
						/>
					) : (
						<input
							type={inputType}
							value={draft}
							onChange={(e) => setDraft(e.target.value)}
							placeholder={placeholder}
							className="flex-1 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-violet-500/50 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
						/>
					)}
					<button
						type="button"
						onClick={handleSave}
						disabled={isPending}
						className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors shrink-0 text-white"
					>
						<Check size={14} />
					</button>
					<button
						type="button"
						onClick={handleCancel}
						disabled={isPending}
						className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 transition-colors shrink-0 text-slate-600 dark:text-white"
					>
						<X size={14} />
					</button>
				</div>
			) : (
				<div className="flex-1 flex items-start justify-between gap-2">
					<div className="text-sm text-slate-900 dark:text-white">
						{display ??
							(value ? (
								value
							) : (
								<span className="text-slate-500 dark:text-gray-600">—</span>
							))}
					</div>
					<button
						type="button"
						onClick={() => {
							setDraft(value);
							setEditing(true);
						}}
						className="p-1.5 rounded-lg text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 shrink-0 transition-colors"
					>
						<Pencil size={13} />
					</button>
				</div>
			)}
		</div>
	);
}

function ReadOnlyField({
	label,
	value,
}: {
	label: string;
	value: React.ReactNode;
}) {
	return (
		<div className="flex items-start gap-4 py-3 border-b border-slate-200 dark:border-white/5 last:border-0">
			<p className="text-xs font-medium text-slate-500 dark:text-gray-500 uppercase tracking-wider w-32 shrink-0 pt-1">
				{label}
			</p>
			<div className="text-sm text-slate-900 dark:text-white flex-1">
				{value ?? <span className="text-slate-500 dark:text-gray-600">—</span>}
			</div>
		</div>
	);
}

function ProductClassesField({
	productClasses,
	allClasses,
	onAdd,
	onRemove,
	isAdding,
	isRemoving,
}: {
	productClasses: {
		id: string;
		name: string;
		tier: 'prata' | 'ouro' | 'platina';
	}[];
	allClasses: {
		id: string;
		name: string;
		tier: 'prata' | 'ouro' | 'platina';
	}[];
	onAdd: (classId: string) => void;
	onRemove: (classId: string) => void;
	isAdding: boolean;
	isRemoving: boolean;
}) {
	const [selectedClassId, setSelectedClassId] = useState('');
	const availableClasses = allClasses.filter(
		(cls) => !productClasses.some((pc) => pc.id === cls.id),
	);

	function handleAdd() {
		if (!selectedClassId) return;
		onAdd(selectedClassId);
		setSelectedClassId('');
	}

	return (
		<div className="space-y-3">
			{productClasses.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{productClasses.map((cls) => {
						const style = TIER_STYLES[cls.tier];
						return (
							<span
								key={cls.id}
								className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${style.badge}`}
							>
								{cls.name}
								<button
									type="button"
									onClick={() => onRemove(cls.id)}
									disabled={isRemoving}
									className="p-0.5 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
									aria-label={`Remover de ${cls.name}`}
								>
									<X className="w-3 h-3" />
								</button>
							</span>
						);
					})}
				</div>
			)}
			{productClasses.length === 0 && availableClasses.length === 0 && (
				<span className="text-sm text-slate-500 dark:text-gray-600">
					Nenhuma classe. Crie classes na aba Classes.
				</span>
			)}
			{availableClasses.length > 0 && (
				<div className="flex items-center gap-2">
					<select
						value={selectedClassId}
						onChange={(e) => setSelectedClassId(e.target.value)}
						className="flex-1 max-w-xs bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-violet-500/50 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
					>
						<option value="">Adicionar a uma classe...</option>
						{availableClasses.map((cls) => (
							<option key={cls.id} value={cls.id}>
								{cls.name} ({TIER_STYLES[cls.tier].label})
							</option>
						))}
					</select>
					<button
						type="button"
						onClick={handleAdd}
						disabled={!selectedClassId || isAdding}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
					>
						<Plus className="w-3.5 h-3.5" />
						Adicionar
					</button>
				</div>
			)}
		</div>
	);
}

export function BasicInfoSection({ product }: BasicInfoSectionProps) {
	const price = formatCurrency(product.price, 'BRL');
	const createdAt = formatDate(product.createdAt);
	const updatedAt = formatDate(product.updatedAt);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { classes } = useClasses();
	const addProduct = useAddProductToClass();
	const removeProduct = useRemoveProductFromClass();
	const uploadImage = useUploadProductImage();

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) {
			uploadImage.mutate(
				{ id: product.id, file },
				{
					onSuccess: () => toast.success('Imagem atualizada.'),
					onError: () => toast.error('Erro ao enviar imagem.'),
				},
			);
		}
		if (fileInputRef.current) fileInputRef.current.value = '';
	}

	const productClasses = (classes ?? []).filter((cls) =>
		cls.products.some((p) => p.id === product.id),
	);
	const allClassesForSelect = (classes ?? []).map((cls) => ({
		id: cls.id,
		name: cls.name,
		tier: cls.tier,
	}));
	const productClassesForDisplay = productClasses.map((cls) => ({
		id: cls.id,
		name: cls.name,
		tier: cls.tier,
	}));

	function handleAddToClass(classId: string) {
		addProduct.mutate(
			{ classId, productId: product.id },
			{
				onSuccess: () => toast.success('Produto adicionado à classe'),
				onError: () => toast.error('Erro ao adicionar à classe'),
			},
		);
	}

	function handleRemoveFromClass(classId: string) {
		removeProduct.mutate(
			{ classId, productId: product.id },
			{
				onSuccess: () => toast.success('Produto removido da classe'),
				onError: () => toast.error('Erro ao remover da classe'),
			},
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold text-slate-900 dark:text-white">
					Informações básicas
				</h2>
				<p className="text-sm text-slate-500 dark:text-gray-500 mt-1">
					Dados gerais do produto
				</p>
			</div>

			{/* Image */}
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none">
				<div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 mb-4">
					<ImageIcon className="w-4 h-4" />
					<span className="text-sm font-medium">Imagem</span>
				</div>
				<input
					id="product-cover-image"
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={handleFileChange}
					className="sr-only"
				/>
				{product.image ? (
					<div className="flex flex-col gap-3">
						<div className="relative w-48 h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700">
							<Image
								src={product.image}
								alt={product.name}
								fill
								className="object-cover"
							/>
							{uploadImage.isPending && (
								<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
									<Loader2 className="w-8 h-8 text-white animate-spin" />
								</div>
							)}
						</div>
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							disabled={uploadImage.isPending}
							className="flex items-center gap-2 w-fit px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
						>
							{uploadImage.isPending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Pencil className="w-4 h-4" />
							)}
							Alterar imagem
						</button>
					</div>
				) : (
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						disabled={uploadImage.isPending}
						className="w-full h-40 border-2 border-dashed border-slate-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-gray-600 hover:border-violet-500/50 hover:text-violet-400 transition-colors disabled:opacity-50"
					>
						{uploadImage.isPending ? (
							<Loader2 className="w-8 h-8 animate-spin" />
						) : (
							<ImagePlus className="w-8 h-8" />
						)}
						<span className="text-sm">
							{uploadImage.isPending
								? 'A enviar...'
								: 'Clique para fazer upload'}
						</span>
					</button>
				)}
			</div>

			{/* Detalhes — horizontal grid */}
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none">
				<div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 mb-4">
					<Info className="w-4 h-4" />
					<span className="text-sm font-medium">Detalhes</span>
				</div>

				<div className="grid grid-cols-2 gap-x-10">
					<div>
						<EditableField
							label="Nome"
							fieldKey="name"
							productId={product.id}
							value={product.name}
						/>
						<EditableField
							label="Descrição"
							fieldKey="description"
							productId={product.id}
							value={product.description ?? ''}
							multiline
							display={
								product.description ? (
									<span className="text-slate-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
										{product.description}
									</span>
								) : undefined
							}
						/>
						<EditableField
							label="Categoria"
							fieldKey="category"
							productId={product.id}
							value={product.category ?? ''}
							placeholder="ex: laser"
							display={
								product.category ? (
									<span className="inline-flex items-center gap-1 text-slate-600 dark:text-gray-400">
										<Tag className="w-3.5 h-3.5 text-slate-500 dark:text-gray-500" />
										{product.category}
									</span>
								) : undefined
							}
						/>
					</div>

					<div>
						<ReadOnlyField label="Tipo" value={product.type} />
						<ReadOnlyField
							label="Slug"
							value={
								<span className="font-mono text-violet-600 dark:text-violet-400">
									{product.slug}
								</span>
							}
						/>
						<ReadOnlyField
							label="Status"
							value={
								<span
									className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
										product.status === 'ativo'
											? 'bg-emerald-500/10 text-emerald-400'
											: 'bg-red-500/10 text-red-400'
									}`}
								>
									{product.status}
								</span>
							}
						/>
					</div>
				</div>
			</div>

			{/* Preço e localização */}
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none">
				<div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 mb-4">
					<DollarSign className="w-4 h-4" />
					<span className="text-sm font-medium">Preço e localização</span>
				</div>

				<div className="grid grid-cols-2 gap-x-10">
					<div>
						<EditableField
							label="Preço"
							fieldKey="price"
							productId={product.id}
							value={String(product.price)}
							inputType="number"
							display={price}
						/>
						<EditableField
							label="Reembolso"
							fieldKey="refundDays"
							productId={product.id}
							value={
								product.refundDays !== null ? String(product.refundDays) : ''
							}
							inputType="number"
							placeholder="ex: 7"
							display={
								product.refundDays !== null ? (
									<span className="flex items-center gap-1.5 text-slate-600 dark:text-gray-400">
										<RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-gray-500" />
										{product.refundDays} dias
									</span>
								) : undefined
							}
						/>
					</div>

					<div>
						<ReadOnlyField
							label="Idioma / País"
							value={
								<span className="flex items-center gap-1.5 text-slate-600 dark:text-gray-400">
									<Globe className="w-3.5 h-3.5 text-slate-500 dark:text-gray-500" />
									{product.language} · {product.country}
								</span>
							}
						/>
					</div>
				</div>
			</div>

			{/* Classe */}
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none">
				<div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 mb-4">
					<Layers className="w-4 h-4" />
					<span className="text-sm font-medium">Classe</span>
				</div>
				<p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
					Associe este produto a uma ou mais classes (Prata, Ouro, Platina) para
					gerenciar o acesso por tier.
				</p>
				<ProductClassesField
					productClasses={productClassesForDisplay}
					allClasses={allClassesForSelect}
					onAdd={handleAddToClass}
					onRemove={handleRemoveFromClass}
					isAdding={addProduct.isPending}
					isRemoving={removeProduct.isPending}
				/>
			</div>

			{/* Datas */}
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm dark:shadow-none">
				<div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 mb-4">
					<Calendar className="w-4 h-4" />
					<span className="text-sm font-medium">Datas</span>
				</div>

				<div className="grid grid-cols-2 gap-x-10">
					<div>
						<ReadOnlyField label="Criado em" value={createdAt} />
					</div>
					<div>
						<ReadOnlyField label="Atualizado em" value={updatedAt} />
					</div>
				</div>
			</div>
		</div>
	);
}
