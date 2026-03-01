'use client';

import {
	Calendar,
	Check,
	DollarSign,
	Globe,
	Image as ImageIcon,
	Info,
	Pencil,
	RotateCcw,
	Tag,
	X,
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';
import { useUpdateProduct } from '@/hooks/use-products';
import type { Product } from '@/types/products';
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
		<div className="flex items-start justify-between gap-4 py-3 border-b border-white/5 last:border-0">
			<p className="text-xs font-medium text-gray-500 uppercase tracking-wider w-32 shrink-0 pt-1">
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
							className="flex-1 bg-white/5 border border-violet-500/50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-violet-500 resize-none"
						/>
					) : (
						<input
							type={inputType}
							value={draft}
							onChange={(e) => setDraft(e.target.value)}
							placeholder={placeholder}
							className="flex-1 bg-white/5 border border-violet-500/50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-violet-500"
						/>
					)}
					<button
						type="button"
						onClick={handleSave}
						disabled={isPending}
						className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors shrink-0"
					>
						<Check size={14} />
					</button>
					<button
						type="button"
						onClick={handleCancel}
						disabled={isPending}
						className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors shrink-0"
					>
						<X size={14} />
					</button>
				</div>
			) : (
				<div className="flex-1 flex items-start justify-between gap-2">
					<div className="text-sm text-white">
						{display ??
							(value ? value : <span className="text-gray-600">—</span>)}
					</div>
					<button
						type="button"
						onClick={() => {
							setDraft(value);
							setEditing(true);
						}}
						className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 shrink-0 transition-colors"
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
		<div className="flex items-start gap-4 py-3 border-b border-white/5 last:border-0">
			<p className="text-xs font-medium text-gray-500 uppercase tracking-wider w-32 shrink-0 pt-1">
				{label}
			</p>
			<div className="text-sm text-white flex-1">
				{value ?? <span className="text-gray-600">—</span>}
			</div>
		</div>
	);
}

export function BasicInfoSection({ product }: BasicInfoSectionProps) {
	const price = formatCurrency(product.price, 'BRL');
	const createdAt = formatDate(product.createdAt);
	const updatedAt = formatDate(product.updatedAt);

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold text-white">Informações básicas</h2>
				<p className="text-sm text-gray-500 mt-1">Dados gerais do produto</p>
			</div>

			{/* Image */}
			<div className="bg-[#1a1a1d] border border-gray-800 rounded-xl p-6">
				<div className="flex items-center gap-2 text-gray-400 mb-4">
					<ImageIcon className="w-4 h-4" />
					<span className="text-sm font-medium">Imagem</span>
				</div>
				{product.image ? (
					<div className="relative w-48 h-32 rounded-xl overflow-hidden border border-gray-700">
						<Image
							src={product.image}
							alt={product.name}
							fill
							className="object-cover"
						/>
					</div>
				) : (
					<div className="w-48 h-32 rounded-xl border border-dashed border-gray-700 flex items-center justify-center">
						<p className="text-sm text-gray-600">Sem imagem</p>
					</div>
				)}
			</div>

			{/* Detalhes — horizontal grid */}
			<div className="bg-[#1a1a1d] border border-gray-800 rounded-xl p-6">
				<div className="flex items-center gap-2 text-gray-400 mb-4">
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
									<span className="text-gray-300 leading-relaxed whitespace-pre-line">
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
									<span className="inline-flex items-center gap-1">
										<Tag className="w-3.5 h-3.5 text-gray-500" />
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
								<span className="font-mono text-violet-400">
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
			<div className="bg-[#1a1a1d] border border-gray-800 rounded-xl p-6">
				<div className="flex items-center gap-2 text-gray-400 mb-4">
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
									<span className="flex items-center gap-1.5">
										<RotateCcw className="w-3.5 h-3.5 text-gray-500" />
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
								<span className="flex items-center gap-1.5">
									<Globe className="w-3.5 h-3.5 text-gray-500" />
									{product.language} · {product.country}
								</span>
							}
						/>
					</div>
				</div>
			</div>

			{/* Datas */}
			<div className="bg-[#1a1a1d] border border-gray-800 rounded-xl p-6">
				<div className="flex items-center gap-2 text-gray-400 mb-4">
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
