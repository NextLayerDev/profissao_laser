'use client';

import { Star } from 'lucide-react';

export const COMMON_FORMATS = [
	'SVG',
	'DXF',
	'CDR',
	'AI',
	'PDF',
	'EPS',
	'PNG',
	'JPG',
];

interface FileConfigFieldsProps {
	category: string;
	onCategoryChange: (value: string) => void;
	formats: string[];
	onFormatsChange: (value: string[]) => void;
	featured: boolean;
	onFeaturedChange: (value: boolean) => void;
	/** Categorias já existentes, para sugestão no datalist. */
	categorySuggestions?: string[];
	idPrefix?: string;
}

/**
 * Campos de configuração de um vetor: categoria (texto com sugestões),
 * formatos (chips alternáveis) e destaque (checkbox). Controlado pelo pai.
 * Reutilizado no upload e na edição.
 */
export function FileConfigFields({
	category,
	onCategoryChange,
	formats,
	onFormatsChange,
	featured,
	onFeaturedChange,
	categorySuggestions = [],
	idPrefix = 'file',
}: FileConfigFieldsProps) {
	const toggleFormat = (f: string) => {
		onFormatsChange(
			formats.includes(f) ? formats.filter((x) => x !== f) : [...formats, f],
		);
	};

	const allFormats = [
		...COMMON_FORMATS,
		...formats.filter((f) => !COMMON_FORMATS.includes(f)),
	];

	return (
		<>
			{/* Categoria */}
			<div>
				<label
					htmlFor={`${idPrefix}-category`}
					className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
				>
					Categoria
				</label>
				<input
					id={`${idPrefix}-category`}
					type="text"
					list={`${idPrefix}-category-list`}
					value={category}
					onChange={(e) => onCategoryChange(e.target.value)}
					placeholder="Ex: Animais, Logotipos, Datas comemorativas"
					className="w-full px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
				/>
				{categorySuggestions.length > 0 && (
					<datalist id={`${idPrefix}-category-list`}>
						{categorySuggestions.map((c) => (
							<option key={c} value={c} />
						))}
					</datalist>
				)}
			</div>

			{/* Formatos */}
			<div>
				<span className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
					Formatos
				</span>
				<div className="flex flex-wrap gap-2">
					{allFormats.map((f) => {
						const active = formats.includes(f);
						return (
							<button
								key={f}
								type="button"
								onClick={() => toggleFormat(f)}
								className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border transition-colors ${
									active
										? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
										: 'border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:border-emerald-500/50'
								}`}
							>
								{f}
							</button>
						);
					})}
				</div>
				<p className="text-xs text-slate-500 dark:text-gray-500 mt-1.5">
					Selecione os formatos disponíveis deste vetor (alimenta o filtro do
					cliente).
				</p>
			</div>

			{/* Destaque */}
			<label className="flex items-center gap-3 cursor-pointer">
				<input
					type="checkbox"
					checked={featured}
					onChange={(e) => onFeaturedChange(e.target.checked)}
					className="w-4 h-4 rounded border-slate-300 dark:border-gray-600 text-amber-500 focus:ring-amber-500/40"
				/>
				<span className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-gray-300">
					<Star className="w-4 h-4 text-amber-500" />
					Marcar como destaque (aparece no carrossel do cliente)
				</span>
			</label>
		</>
	);
}
