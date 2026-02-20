'use client';

import {
	Calendar,
	DollarSign,
	Globe,
	Image as ImageIcon,
	Info,
	RotateCcw,
	Tag,
} from 'lucide-react';
import Image from 'next/image';
import type { Product } from '@/types/products';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/formatDate';

interface BasicInfoSectionProps {
	product: Product;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="space-y-1">
			<p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
				{label}
			</p>
			<p className="text-sm text-white">
				{value ?? <span className="text-gray-600">—</span>}
			</p>
		</div>
	);
}

export function BasicInfoSection({ product }: BasicInfoSectionProps) {
	const price = formatCurrency(product.price, 'BRL');
	const createdAt = formatDate(product.createdAt);
	const updatedAt = formatDate(product.updatedAt);

	return (
		<div className="space-y-6 max-w-2x1">
			<div>
				<h2 className="text-2xl font-bold text-white">Informações básicas</h2>
				<p className="text-sm text-gray-500 mt-1">Dados gerais do produto</p>
			</div>

			{/* Image */}
			<div className="bg-[#1a1a1d] border border-gray-800 rounded-xl p-6 space-y-4">
				<div className="flex items-center gap-2 text-gray-400 mb-2">
					<ImageIcon className="w-4 h-4" />
					<span className="text-sm font-medium">Imagem</span>
				</div>
				{product.image ? (
					<div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-700">
						<Image
							src={product.image}
							alt={product.name}
							fill
							className="object-cover"
						/>
					</div>
				) : (
					<div className="w-full aspect-video rounded-xl border border-dashed border-gray-700 flex items-center justify-center">
						<p className="text-sm text-gray-600">Sem imagem</p>
					</div>
				)}
			</div>

			{/* Main info */}
			<div className="bg-[#1a1a1d] border border-gray-800 rounded-xl p-6 space-y-5 flex justify-center gap-25">
				<div className="flex items-center gap-2 text-gray-400 mb-2">
					<Info className="w-4 h-4" />
					<span className="text-sm font-medium">Detalhes</span>
				</div>

				<Field label="Nome" value={product.name} />
				<Field label="Tipo" value={product.type} />
				<Field
					label="Slug"
					value={
						<span className="font-mono text-violet-400">{product.slug}</span>
					}
				/>
				<Field
					label="Descrição"
					value={
						product.description ? (
							<span className="text-gray-300 leading-relaxed whitespace-pre-line">
								{product.description}
							</span>
						) : null
					}
				/>
				<Field
					label="Categoria"
					value={
						product.category ? (
							<span className="inline-flex items-center gap-1">
								<Tag className="w-3.5 h-3.5 text-gray-500" />
								{product.category}
							</span>
						) : null
					}
				/>
				<Field
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

			{/* Pricing & locale */}
			<div className="bg-[#1a1a1d] border border-gray-800 rounded-xl p-6 space-y-5 flex justify-center gap-25">
				<div className="flex items-center gap-2 text-gray-400 mb-2">
					<DollarSign className="w-4 h-4" />
					<span className="text-sm font-medium">Preço e localização</span>
				</div>

				<Field label="Preço" value={price} />
				<Field
					label="Dias para reembolso"
					value={
						product.refundDays !== null ? (
							<span className="flex items-center gap-1.5">
								<RotateCcw className="w-3.5 h-3.5 text-gray-500" />
								{product.refundDays} dias
							</span>
						) : null
					}
				/>
				<Field
					label="Idioma / País"
					value={
						<span className="flex items-center gap-1.5">
							<Globe className="w-3.5 h-3.5 text-gray-500" />
							{product.language} · {product.country}
						</span>
					}
				/>
			</div>

			{/* Dates */}
			<div className="bg-[#1a1a1d] border border-gray-800 rounded-xl p-6 space-y-5 flex justify-center gap-25">
				<div className="flex items-center gap-2 text-gray-400 mb-2">
					<Calendar className="w-4 h-4" />
					<span className="text-sm font-medium">Datas</span>
				</div>

				<Field label="Criado em" value={createdAt} />
				<Field label="Atualizado em" value={updatedAt} />
			</div>
		</div>
	);
}
