'use client';

import { Image as ImgIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { PassesEditor } from '@/components/parametros/passes-editor';
import { SoftwareSpecificFields as SharedSoftwareSpecificFields } from '@/components/parametros/software-specific-fields';
import {
	useParameterOptions,
	useUploadParameterImage,
} from '@/hooks/use-parameters';
import type { CreateParameterPayload, PassRecipe } from '@/services/parameters';
import {
	applicableFields,
	machineTypeOf,
} from '@/utils/constants/parameter-field-rules';
import {
	LENS_OPTIONS,
	MODE_OPTIONS,
	SOFTWARE_OPTIONS,
} from '@/utils/constants/parameter-options';

/* ------------------------------------------------------------------ */
/*  Shared classes                                                     */
/* ------------------------------------------------------------------ */

const selectCls =
	'px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500';

const inputCls =
	'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40';

/** Categorias-fallback p/ quando o vocabulário (admin) não traz nada. */
const CATEGORY_FALLBACK = [
	'Copos',
	'Metais',
	'Madeira',
	'Acrílico',
	'Brindes',
	'Outros',
];

/** Form vazio (membro/admin). O admin sobrescreve isPublic com `initial`. */
export const EMPTY_PARAMETER_FORM: CreateParameterPayload = {
	machine: '',
	powerWatts: 0,
	lens: '',
	software: '',
	material: '',
	mode: 'Gravacao',
	speed: 0,
	power: 0,
	frequency: 0,
	line: 0,
	crossHatch: false,
	angle: 0,
	passes: 1,
	passesFill: 1,
	gas: false,
	isPublic: true,
	notes: '',
	defocus: undefined,
	materialType: '',
	thickness: '',
	tamanhoLinha: null,
	tamanhoDivisao: null,
	sobreposicao: null,
	forcarSeparacao: null,
	axisRotative: null,
	lineTypeId: null,
	imageUrl: null,
	category: null,
	color: null,
	qPulse: null,
};

/* ------------------------------------------------------------------ */
/*  Form reutilizável (admin + membro)                                 */
/* ------------------------------------------------------------------ */

interface ParameterFormProps {
	initial?: Partial<CreateParameterPayload>;
	mode: 'admin' | 'member';
	submitting: boolean;
	onSubmit: (payload: CreateParameterPayload) => void;
	onCancel: () => void;
	submitLabel?: string;
}

/**
 * Corpo de formulário de parâmetro compartilhado entre o modal do admin
 * (Gestão de Parâmetros) e o envio do membro (Enviar Parâmetro). Mantém TODOS
 * os campos do admin + adiciona Cor (vocabulário) e Q-pulse (UV). No modo
 * `member`, esconde o `isPublic` (submissão fica pendente) e a categoria sai do
 * vocabulário; no modo `admin`, mantém o checkbox público e o fallback de
 * categorias.
 */
export function ParameterForm({
	initial,
	mode,
	submitting,
	onSubmit,
	onCancel,
	submitLabel = 'Salvar',
}: ParameterFormProps) {
	// Estado inicializado uma vez no mount. Cada abertura do modal (criar/editar/
	// enviar) monta o form do zero, então não há reset em re-renders do pai —
	// isso preservaria edições do usuário caso o pai re-renderize.
	const [form, setForm] = useState<CreateParameterPayload>(() => ({
		...EMPTY_PARAMETER_FORM,
		...initial,
	}));
	const uploadImage = useUploadParameterImage();
	const { data: colorOptions = [] } = useParameterOptions('color');
	const { data: categoryOptions = [] } = useParameterOptions('category');
	const { data: machineOptions = [] } = useParameterOptions('machine');
	const { data: materialOptions = [] } = useParameterOptions('material');

	const set = <K extends keyof CreateParameterPayload>(
		field: K,
		value: CreateParameterPayload[K],
	) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	// Aplicabilidade dos campos condicionais p/ a máquina/modo atuais (A4/A5).
	// Recalcula a cada render → some/aparece conforme o usuário troca máquina/modo.
	const ap = applicableFields(form.machine, form.mode);
	// Máquina UV não usa potência (%): desabilita e zera.
	const isUV = machineTypeOf(form.machine) === 'UV';

	const baseRecipe = (): PassRecipe => ({
		speed: form.speed,
		power: form.power,
		frequency: form.frequency,
		line: form.line,
		crossHatch: form.crossHatch,
		angle: form.angle ?? 0,
		passes: 1,
		passesFill: 1,
		defocus: form.defocus ?? null,
		gas: form.gas ?? false,
		notes: '',
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Normaliza os campos condicionais: o que não se aplica à máquina/modo vai
		// zerado/nulo (espelha o backend, que só exige frequency/qPulse/angle quando
		// aplicáveis e guarda 0/null caso contrário).
		onSubmit({
			...form,
			power: isUV ? 0 : form.power,
			frequency: ap.frequency ? form.frequency : 0,
			qPulse: ap.qPulse ? form.qPulse : null,
			angle: ap.angle ? form.angle : null,
			gas: ap.gas ? form.gas : false,
			crossHatch: ap.crossHatch ? form.crossHatch : false,
			passesFill: ap.passesFill ? form.passesFill : 1,
		});
	};

	const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		uploadImage.mutate(file, { onSuccess: ({ url }) => set('imageUrl', url) });
		e.target.value = '';
	};

	const categoryChoices =
		mode === 'member'
			? categoryOptions.map((o) => o.value)
			: categoryOptions.length
				? categoryOptions.map((o) => o.value)
				: CATEGORY_FALLBACK;

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{/* Imagem + categoria (alimenta o card do cliente) */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
				<div>
					<span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
						Imagem do parametro
					</span>
					<div className="flex items-center gap-3">
						<div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/5">
							{form.imageUrl ? (
								<img
									src={form.imageUrl}
									alt=""
									className="h-full w-full object-cover"
								/>
							) : (
								<ImgIcon className="h-7 w-7 text-slate-300 dark:text-gray-600" />
							)}
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">
								{uploadImage.isPending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<ImgIcon className="h-4 w-4" />
								)}
								{form.imageUrl ? 'Trocar imagem' : 'Subir imagem'}
								<input
									type="file"
									accept="image/*"
									className="hidden"
									onChange={handleImage}
								/>
							</label>
							{form.imageUrl ? (
								<button
									type="button"
									onClick={() => set('imageUrl', null)}
									className="text-left text-xs text-red-500 hover:underline"
								>
									Remover imagem
								</button>
							) : null}
						</div>
					</div>
				</div>
				<div>
					<span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
						Categoria
					</span>
					<select
						value={form.category ?? ''}
						onChange={(e) => set('category', e.target.value || null)}
						className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-white/10 dark:bg-slate-800 dark:text-white"
					>
						<option value="">Sem categoria</option>
						{categoryChoices.map((c) => (
							<option key={c} value={c}>
								{c}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Row 1: Machine, Lens, Software */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div>
					<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
						Maquina *
					</span>
					<input
						required
						list="pf-machine-options"
						className={inputCls}
						value={form.machine}
						onChange={(e) => set('machine', e.target.value)}
					/>
					<datalist id="pf-machine-options">
						{machineOptions.map((o) => (
							<option key={o.id} value={o.value} />
						))}
					</datalist>
					<p className="mt-1 text-xs text-slate-400 dark:text-gray-500">
						Os campos se ajustam à máquina selecionada.
					</p>
				</div>
				<div>
					<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
						Lente *
					</span>
					<input
						required
						list="pf-lens-options"
						className={inputCls}
						value={form.lens}
						onChange={(e) => set('lens', e.target.value)}
					/>
					<datalist id="pf-lens-options">
						{LENS_OPTIONS.map((o) => (
							<option key={o} value={o} />
						))}
					</datalist>
				</div>
				<div>
					<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
						Software *
					</span>
					<input
						required
						list="pf-software-options"
						className={inputCls}
						value={form.software}
						onChange={(e) => set('software', e.target.value)}
					/>
					<datalist id="pf-software-options">
						{SOFTWARE_OPTIONS.map((o) => (
							<option key={o} value={o} />
						))}
					</datalist>
				</div>
			</div>

			{/* Row 2: Material, Mode, Power Watts */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div>
					<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
						Nome do Produto *
					</span>
					<input
						required
						className={inputCls}
						placeholder="ex.: Copo preto 500ml"
						value={form.material}
						onChange={(e) => set('material', e.target.value)}
					/>
				</div>
				<div>
					<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
						Modo *
					</span>
					<input
						required
						list="pf-mode-options"
						className={inputCls}
						value={form.mode}
						onChange={(e) => set('mode', e.target.value)}
					/>
					<datalist id="pf-mode-options">
						{MODE_OPTIONS.map((o) => (
							<option key={o} value={o} />
						))}
					</datalist>
				</div>
				<div>
					<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
						Material
					</span>
					<select
						value={form.materialType ?? ''}
						onChange={(e) => set('materialType', e.target.value)}
						className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-white/10 dark:bg-slate-800 dark:text-white"
					>
						<option value="">Sem material</option>
						{materialOptions.map((o) => (
							<option key={o.id} value={o.value}>
								{o.value}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Row 3: Power %, Speed, Frequency */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div>
					<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
						Potencia (%){isUV ? '' : ' *'}
					</span>
					<input
						required={!isUV}
						disabled={isUV}
						type="number"
						min={0}
						max={100}
						className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`}
						value={isUV ? 0 : form.power || ''}
						onChange={(e) => set('power', Number(e.target.value))}
					/>
					{isUV ? (
						<p className="mt-1 text-xs text-slate-400 dark:text-gray-500">
							Máquina UV não usa potência (%).
						</p>
					) : null}
				</div>
				<div>
					<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
						Velocidade (mm/s) *
					</span>
					<input
						required
						type="number"
						min={0}
						className={inputCls}
						value={form.speed || ''}
						onChange={(e) => set('speed', Number(e.target.value))}
					/>
				</div>
				{ap.frequency ? (
					<div>
						<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
							Frequencia (kHz) *
						</span>
						<input
							required
							type="number"
							min={0}
							className={inputCls}
							value={form.frequency || ''}
							onChange={(e) => set('frequency', Number(e.target.value))}
						/>
					</div>
				) : null}
			</div>

			{/* Row 4: Line, Angle, Defocus */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div>
					<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
						Line *
					</span>
					<input
						required
						type="number"
						min={0}
						step="any"
						className={inputCls}
						value={form.line ?? ''}
						onChange={(e) => set('line', Number(e.target.value))}
					/>
				</div>
				{ap.angle ? (
					<div>
						<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
							Angulo *
						</span>
						<input
							required
							type="number"
							min={0}
							max={360}
							className={inputCls}
							value={form.angle ?? ''}
							onChange={(e) => set('angle', Number(e.target.value))}
						/>
					</div>
				) : null}
				<div>
					<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
						Defocus (-20 a 20 mm)
					</span>
					<input
						type="number"
						min={-20}
						max={20}
						step="any"
						placeholder="Negativo = pra baixo, positivo = pra cima"
						className={inputCls}
						value={form.defocus ?? ''}
						onChange={(e) =>
							set(
								'defocus',
								e.target.value ? Number(e.target.value) : undefined,
							)
						}
					/>
				</div>
			</div>

			{/* Row 5: Passadas, Passadas preenchimento (N/A no Corte), CrossHatch */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div>
					<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
						Passadas *
					</span>
					<input
						required
						type="number"
						min={1}
						className={inputCls}
						value={form.passes || ''}
						onChange={(e) => set('passes', Number(e.target.value))}
					/>
				</div>
				{ap.passesFill ? (
					<div>
						<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
							Passadas preenchimento
						</span>
						<input
							type="number"
							min={1}
							className={inputCls}
							value={form.passesFill || ''}
							onChange={(e) => set('passesFill', Number(e.target.value))}
						/>
					</div>
				) : null}
				{ap.crossHatch ? (
					<div>
						<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
							Preenchimento Cruzado
						</span>
						<label className="flex items-center gap-2 cursor-pointer py-2">
							<input
								type="checkbox"
								checked={!!form.crossHatch}
								onChange={(e) => set('crossHatch', e.target.checked)}
								className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
							/>
							<span className="text-sm text-slate-600 dark:text-slate-400">
								Cross-hatch ativo
							</span>
						</label>
					</div>
				) : null}
			</div>

			{/* Row 5b: Cor (vocabulário) + Q-pulse (UV) */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
						Cor
					</span>
					<select
						value={form.color ?? ''}
						onChange={(e) => set('color', e.target.value || null)}
						className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-white/10 dark:bg-slate-800 dark:text-white"
					>
						<option value="">Sem cor</option>
						{colorOptions.map((o) => (
							<option key={o.id} value={o.value}>
								{o.value}
							</option>
						))}
					</select>
				</div>
				{ap.qPulse ? (
					<div>
						<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
							Q-pulse (UV) *
						</span>
						<input
							required
							type="number"
							min={0}
							step="any"
							className={inputCls}
							value={form.qPulse ?? ''}
							onChange={(e) =>
								set(
									'qPulse',
									e.target.value === '' ? null : Number(e.target.value),
								)
							}
						/>
					</div>
				) : null}
			</div>

			{/* Software-specific fields (Ezcad/Lightburn) */}
			<SharedSoftwareSpecificFields
				idPrefix={`pf-${mode}`}
				selectClassName={selectCls}
				inputClassName={inputCls}
				values={{
					software: form.software,
					lineTypeId: form.lineTypeId,
					axisRotative: form.axisRotative,
					tamanhoDivisao: form.tamanhoDivisao,
					sobreposicao: form.sobreposicao,
					tamanhoLinha: form.tamanhoLinha,
					forcarSeparacao: form.forcarSeparacao,
				}}
				onChange={(patch) => {
					for (const [k, v] of Object.entries(patch)) {
						set(k as keyof CreateParameterPayload, v as never);
					}
				}}
			/>

			{/* Row 6: Espessura (opcional/legado) */}
			<div className="grid grid-cols-2 gap-4">
				<div>
					<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
						Espessura
					</span>
					<input
						className={inputCls}
						value={form.thickness ?? ''}
						onChange={(e) => set('thickness', e.target.value)}
					/>
				</div>
			</div>

			{/* Row 7: Gas (CO2/Corte), Notes */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{ap.gas ? (
					<div className="flex items-end pb-2">
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={form.gas ?? false}
								onChange={(e) => set('gas', e.target.checked)}
								className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
							/>
							<span className="text-sm text-slate-700 dark:text-slate-300">
								Gas
							</span>
						</label>
					</div>
				) : null}
				<div>
					<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
						Notas
					</span>
					<textarea
						rows={2}
						className={inputCls}
						value={form.notes ?? ''}
						onChange={(e) => set('notes', e.target.value)}
					/>
				</div>
			</div>

			{/* Row 8: isPublic (só admin — submissão do membro fica pendente) */}
			{mode === 'admin' ? (
				<label className="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={form.isPublic ?? true}
						onChange={(e) => set('isPublic', e.target.checked)}
						className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
					/>
					<span className="text-sm text-slate-700 dark:text-slate-300">
						Publico (visivel para alunos)
					</span>
				</label>
			) : null}

			{/* Passadas extras (multi-passada): a passada 1 é a receita acima.
			    `ap` propaga a máquina/modo do pai → cada passada esconde os mesmos
			    campos não-aplicáveis. */}
			<PassesEditor
				value={form.extraPasses}
				onChange={(next) => set('extraPasses', next)}
				baseRecipe={baseRecipe}
				applicable={ap}
			/>

			<div className="flex justify-end gap-3 pt-2">
				<button
					type="button"
					onClick={onCancel}
					className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
				>
					Cancelar
				</button>
				<button
					type="submit"
					disabled={submitting}
					className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
				>
					{submitting && <Loader2 className="w-4 h-4 animate-spin" />}
					{submitLabel}
				</button>
			</div>
		</form>
	);
}
