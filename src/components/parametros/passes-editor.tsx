'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { PassRecipe } from '@/services/parameters';
import type {
	applicableFields,
	GateableField,
} from '@/utils/constants/parameter-field-rules';

/** Mapa de aplicabilidade (saída de `applicableFields`) p/ esconder campos. */
type Applicable = ReturnType<typeof applicableFields>;

/** Tudo aplicável (default quando o pai não passa `applicable`). */
const ALL_APPLICABLE: Record<GateableField, boolean> = {
	frequency: true,
	qPulse: true,
	gas: true,
	crossHatch: true,
	angle: true,
	passesFill: true,
};

const inputCls =
	'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-white/10 dark:bg-slate-800 dark:text-white';

function PassNumberField({
	label,
	value,
	onChange,
	min,
	max,
	step,
}: {
	label: string;
	value: number;
	onChange: (v: number) => void;
	min?: number;
	max?: number;
	step?: string;
}) {
	return (
		<div>
			<span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
				{label}
			</span>
			<input
				type="number"
				min={min}
				max={max}
				step={step}
				value={Number.isFinite(value) ? value : ''}
				onChange={(e) =>
					onChange(e.target.value === '' ? 0 : Number(e.target.value))
				}
				className={inputCls}
			/>
		</div>
	);
}

/**
 * Editor de passadas extras (multi-passada). A passada 1 é a receita principal
 * de fora; aqui ficam as passadas 2..N, cada uma com sua receita de laser.
 * Compartilhado entre o form do admin (Parâmetros) e o inline das Prévias IA.
 */
export function PassesEditor({
	value,
	onChange,
	baseRecipe,
	applicable,
}: {
	value: PassRecipe[] | undefined;
	onChange: (next: PassRecipe[]) => void;
	/** Receita-base p/ "Adicionar passada" (copia a receita principal atual). */
	baseRecipe: () => PassRecipe;
	/** Aplicabilidade herdada do pai (máquina/modo). Esconde os mesmos campos. */
	applicable?: Applicable;
}) {
	const ap = applicable ?? ALL_APPLICABLE;
	const passes = value ?? [];
	const update = <K extends keyof PassRecipe>(
		i: number,
		field: K,
		v: PassRecipe[K],
	) => onChange(passes.map((p, idx) => (idx === i ? { ...p, [field]: v } : p)));
	const move = (i: number, dir: -1 | 1) => {
		const arr = [...passes];
		const j = i + dir;
		if (j < 0 || j >= arr.length) return;
		const tmp = arr[i];
		arr[i] = arr[j];
		arr[j] = tmp;
		onChange(arr);
	};

	return (
		<div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					<p className="text-sm font-semibold text-slate-900 dark:text-white">
						Passadas extras (multi-passada)
					</p>
					<p className="text-xs text-slate-500 dark:text-slate-400">
						A passada 1 é a receita acima. Adicione 2, 3… — o cliente navega em
						ordem.
					</p>
				</div>
				<button
					type="button"
					onClick={() => onChange([...passes, baseRecipe()])}
					className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300 px-3 py-1.5 text-sm font-semibold text-violet-600 hover:bg-violet-50 dark:border-violet-500/40 dark:text-violet-400 dark:hover:bg-violet-500/10"
				>
					<Plus className="h-4 w-4" />
					Adicionar passada
				</button>
			</div>

			{passes.map((pass, i) => (
				<div
					key={`pass-${i}`}
					className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5"
				>
					<div className="mb-2 flex items-center justify-between">
						<span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
							Passada {i + 2}
						</span>
						<div className="flex items-center gap-1">
							<button
								type="button"
								onClick={() => move(i, -1)}
								disabled={i === 0}
								title="Subir"
								className="rounded p-1 text-slate-400 hover:text-violet-600 disabled:opacity-30 dark:hover:text-violet-400"
							>
								<ArrowUp className="h-4 w-4" />
							</button>
							<button
								type="button"
								onClick={() => move(i, 1)}
								disabled={i === passes.length - 1}
								title="Descer"
								className="rounded p-1 text-slate-400 hover:text-violet-600 disabled:opacity-30 dark:hover:text-violet-400"
							>
								<ArrowDown className="h-4 w-4" />
							</button>
							<button
								type="button"
								onClick={() => onChange(passes.filter((_, idx) => idx !== i))}
								title="Remover passada"
								className="rounded p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
							>
								<Trash2 className="h-4 w-4" />
							</button>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						<PassNumberField
							label="Velocidade (mm/s)"
							value={pass.speed}
							onChange={(v) => update(i, 'speed', v)}
						/>
						<PassNumberField
							label="Potência (%)"
							value={pass.power}
							min={0}
							max={100}
							onChange={(v) => update(i, 'power', v)}
						/>
						{ap.frequency ? (
							<PassNumberField
								label="Frequência (kHz)"
								value={pass.frequency}
								onChange={(v) => update(i, 'frequency', v)}
							/>
						) : null}
						<PassNumberField
							label="Linha (mm)"
							value={pass.line}
							step="0.01"
							onChange={(v) => update(i, 'line', v)}
						/>
						{ap.angle ? (
							<PassNumberField
								label="Ângulo (°)"
								value={pass.angle}
								min={0}
								max={360}
								onChange={(v) => update(i, 'angle', v)}
							/>
						) : null}
						<PassNumberField
							label="Passadas (contorno)"
							value={pass.passes}
							min={1}
							onChange={(v) => update(i, 'passes', v)}
						/>
						{ap.passesFill ? (
							<PassNumberField
								label="Passadas (preench.)"
								value={pass.passesFill}
								min={1}
								onChange={(v) => update(i, 'passesFill', v)}
							/>
						) : null}
						<PassNumberField
							label="Desfoque (mm)"
							value={pass.defocus ?? 0}
							min={-20}
							max={20}
							onChange={(v) => update(i, 'defocus', v)}
						/>
					</div>
					{ap.crossHatch || ap.gas ? (
						<div className="mt-2 flex flex-wrap gap-4">
							{ap.crossHatch ? (
								<label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
									<input
										type="checkbox"
										checked={pass.crossHatch ?? false}
										onChange={(e) => update(i, 'crossHatch', e.target.checked)}
										className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
									/>
									Cross-hatch
								</label>
							) : null}
							{ap.gas ? (
								<label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
									<input
										type="checkbox"
										checked={pass.gas ?? false}
										onChange={(e) => update(i, 'gas', e.target.checked)}
										className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
									/>
									Gás
								</label>
							) : null}
						</div>
					) : null}
				</div>
			))}

			{passes.length === 0 ? (
				<p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
					Nenhuma passada extra — passada única.
				</p>
			) : null}
		</div>
	);
}
