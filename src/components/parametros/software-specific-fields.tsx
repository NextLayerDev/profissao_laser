'use client';

import { useLaserLineTypes } from '@/hooks/use-laser-line-types';
import type { LaserLineTypeSoftware } from '@/types/laser-line-type';

export interface SoftwareSpecificValues {
	software: string | null | undefined;
	lineTypeId?: string | null;
	axisRotative?: boolean | null;
	tamanhoDivisao?: number | null;
	sobreposicao?: number | null;
	tamanhoLinha?: number | null;
	forcarSeparacao?: boolean | null;
}

interface SoftwareSpecificFieldsProps {
	values: SoftwareSpecificValues;
	onChange: (patch: Partial<Omit<SoftwareSpecificValues, 'software'>>) => void;
	/** prefixo único pros radios (evita colisão entre instâncias na mesma página) */
	idPrefix?: string;
	selectClassName?: string;
	inputClassName?: string;
}

const DEFAULT_SELECT =
	'px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500';
const DEFAULT_INPUT =
	'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40';

/**
 * Campos de parâmetro que mudam conforme o software (Ezcad / Lightburn):
 * Tipo de Linha (catálogo por software) + Eixo rotativo + campos próprios.
 * Compartilhado entre o form de /parametros (admin) e o inline de variação.
 */
export function SoftwareSpecificFields({
	values,
	onChange,
	idPrefix = 'sw',
	selectClassName = DEFAULT_SELECT,
	inputClassName = DEFAULT_INPUT,
}: SoftwareSpecificFieldsProps) {
	const software = (values.software ?? '') as LaserLineTypeSoftware | '';
	const isEzcad = software === 'Ezcad';
	const isLightburn = software === 'Lightburn';

	const { data: lineTypes = [] } = useLaserLineTypes(software || undefined);

	if (!isEzcad && !isLightburn) return null;

	const selectedLineType = values.lineTypeId
		? lineTypes.find((lt) => lt.id === values.lineTypeId)
		: null;

	return (
		<div className="rounded-xl border border-violet-200 dark:border-violet-800/40 bg-violet-50/50 dark:bg-violet-950/10 p-4 space-y-4">
			<p className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wide">
				Campos do {software}
			</p>

			{/* Tipo de Linhas (catálogo por software) */}
			<div>
				<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Tipo de Linhas
				</span>
				<div className="flex items-center gap-3">
					<select
						className={selectClassName}
						value={values.lineTypeId ?? ''}
						onChange={(e) => onChange({ lineTypeId: e.target.value || null })}
					>
						<option value="">Selecione...</option>
						{lineTypes.map((lt) => (
							<option key={lt.id} value={lt.id}>
								{lt.name}
							</option>
						))}
					</select>
					{selectedLineType?.imageUrl && (
						<img
							src={selectedLineType.imageUrl}
							alt={selectedLineType.name}
							className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-white/10"
						/>
					)}
				</div>
				{lineTypes.length === 0 && (
					<p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
						Nenhum tipo cadastrado para {software}. Adicione em "Tipos de
						Linha".
					</p>
				)}
			</div>

			{/* Eixo rotativo (todos os softwares) */}
			<div>
				<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
					Eixo rotativo *
				</span>
				<div className="flex gap-4">
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							name={`${idPrefix}-axisRotative`}
							checked={values.axisRotative === true}
							onChange={() => onChange({ axisRotative: true })}
							className="w-4 h-4 text-violet-600 focus:ring-violet-500"
						/>
						<span className="text-sm text-slate-700 dark:text-slate-300">
							Sim
						</span>
					</label>
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							name={`${idPrefix}-axisRotative`}
							checked={values.axisRotative === false}
							onChange={() => onChange({ axisRotative: false })}
							className="w-4 h-4 text-violet-600 focus:ring-violet-500"
						/>
						<span className="text-sm text-slate-700 dark:text-slate-300">
							Não
						</span>
					</label>
				</div>
			</div>

			{/* Ezcad: Tamanho da Divisão + Sobreposição */}
			{isEzcad && (
				<div className="grid grid-cols-2 gap-4">
					<div>
						<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
							Tamanho da Divisão (mm)
						</span>
						<input
							type="number"
							step="0.01"
							min={0}
							max={10}
							placeholder="0,00 até 10,00"
							className={inputClassName}
							value={values.tamanhoDivisao ?? ''}
							onChange={(e) =>
								onChange({
									tamanhoDivisao:
										e.target.value === '' ? null : Number(e.target.value),
								})
							}
						/>
					</div>
					<div>
						<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
							Sobreposição (mm)
						</span>
						<input
							type="number"
							step="0.01"
							min={0}
							max={10}
							placeholder="0,00 até 10,00"
							className={inputClassName}
							value={values.sobreposicao ?? ''}
							onChange={(e) =>
								onChange({
									sobreposicao:
										e.target.value === '' ? null : Number(e.target.value),
								})
							}
						/>
					</div>
				</div>
			)}

			{/* Lightburn: Tamanho da Linha + Forçar Separação */}
			{isLightburn && (
				<>
					<div>
						<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
							Tamanho da Linha (mm)
						</span>
						<input
							type="number"
							step="0.01"
							min={0}
							max={50}
							placeholder="0,00 até 50,00"
							className={inputClassName}
							value={values.tamanhoLinha ?? ''}
							onChange={(e) =>
								onChange({
									tamanhoLinha:
										e.target.value === '' ? null : Number(e.target.value),
								})
							}
						/>
					</div>
					<div>
						<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
							Forçar Separação *
						</span>
						<div className="flex gap-4">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									name={`${idPrefix}-forcarSeparacao`}
									checked={values.forcarSeparacao === true}
									onChange={() => onChange({ forcarSeparacao: true })}
									className="w-4 h-4 text-violet-600 focus:ring-violet-500"
								/>
								<span className="text-sm text-slate-700 dark:text-slate-300">
									Sim
								</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									name={`${idPrefix}-forcarSeparacao`}
									checked={values.forcarSeparacao === false}
									onChange={() => onChange({ forcarSeparacao: false })}
									className="w-4 h-4 text-violet-600 focus:ring-violet-500"
								/>
								<span className="text-sm text-slate-700 dark:text-slate-300">
									Não
								</span>
							</label>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
