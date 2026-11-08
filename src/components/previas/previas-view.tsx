'use client';

import {
	Camera,
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Download,
	Eye,
	Image,
	ImagePlus,
	Loader2,
	Package,
	Palette,
	Pencil,
	Plus,
	RotateCcw,
	Ruler,
	SlidersHorizontal,
	Sparkles,
	Stamp,
	Trash2,
	Type,
} from 'lucide-react';
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from 'react';
import { toast } from 'sonner';
import { MyMachineSection } from '@/components/previas/my-machine-section';
import { PreviaBackgroundPicker } from '@/components/previas/previa-background-picker';
import { PreviaImageStage } from '@/components/previas/previa-image-stage';
import { PreviaProductPicker } from '@/components/previas/previa-product-picker';
import { PreviaTurntableViewer } from '@/components/previas/previa-turntable-viewer';
import { PageHeader } from '@/components/ui/page-header';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useLaserProduct } from '@/hooks/use-laser-products';
import {
	useDeletePrevia,
	useDeleteWatermark,
	useGeneratePrevia,
	usePreviaOptions,
	usePreviasHistory,
	useUpdatePrevia,
	useUploadWatermark,
	useWatermark,
} from '@/hooks/use-previas';
import { useToolBilling } from '@/modules/tools/hooks/use-tool-billing';
import type {
	GeneratePreviaPayload,
	LaserSettings,
	PersonalizationType,
	Previa,
	PreviaFontOption,
	PreviaLayout,
	PreviaOptionItem,
	PreviaOptions,
} from '@/types/previas';
import {
	finishForMaterial,
	pickValidPreset,
	smartPresetFor,
	suggestedBackgrounds,
} from '@/utils/constants/previa-smart-presets';
import {
	clearLastChoice,
	readLastChoice,
	saveLastChoice,
} from '@/utils/previa-last-choice';

const DEFAULT_LASER_SETTINGS: LaserSettings = {
	tamanho: 'medio',
	posicao: 'central',
	rotacao: 0,
	intensidade: 'media',
	profundidade: 'media',
	comNome: 'sem',
	nomePersonalizado: '',
	fonteFamilia: 'arial',
	tamanhoNome: 'medio',
	orientacaoLogo: 'horizontal',
	orientacaoNome: 'horizontal',
	material: 'aco-inox',
	estiloGravacao: 'clean',
	acabamentoSuperficie: 'escovado',
	contraste: 50,
	efeitoSombra: 0,
	moldura: 'nenhuma',
	posicaoTextoRelLogo: 'abaixo',
	espacamentoLogoTexto: 'medio',
	tipoVisualizacao: 'angulo-3d',
	anguloCamera: 'frontal',
	iluminacao: 'studio-softbox',
	fundoCena: 'mesa-ambiente',
	apenasTexto: false,
	modoLentes: false,
	textoLenteDireita: '',
	textoLenteEsquerda: '',
};

function downloadUrl(url: string, filename: string) {
	fetch(url)
		.then((res) => res.blob())
		.then((blob) => {
			const blobUrl = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = blobUrl;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(blobUrl);
		})
		.catch(() => {
			window.open(url, '_blank');
		});
}

/* ─────────────── Google Fonts Loader ─────────────── */

const loadedFonts = new Set<string>();

/** Nome primário de uma stack CSS ("'Ubuntu', sans-serif" → "Ubuntu"). */
function primaryFontName(family: string): string {
	return (family.split(',')[0] ?? family).trim().replace(/^['"]|['"]$/g, '');
}

function loadGoogleFont(family: string) {
	// O catálogo manda a stack CSS completa — o Google Fonts só aceita o nome.
	const primary = primaryFontName(family);
	if (!primary || loadedFonts.has(primary)) return;
	loadedFonts.add(primary);
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = `https://fonts.googleapis.com/css2?family=${primary.replace(/ /g, '+')}:wght@400;700&display=swap`;
	document.head.appendChild(link);
}

/* ─────────────── Dynamic Select ─────────────── */

function DynamicSelect({
	label,
	value,
	options,
	onChange,
	highlight = false,
}: {
	label: string;
	value: string;
	options: PreviaOptionItem[];
	onChange: (v: string) => void;
	highlight?: boolean;
}) {
	const id = useId();
	return (
		<div>
			<label
				htmlFor={id}
				className={`block text-xs mb-1 ${
					highlight
						? 'text-violet-600 dark:text-violet-300 font-semibold'
						: 'text-slate-500 dark:text-gray-400'
				}`}
			>
				{label}
			</label>
			<select
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 ${
					highlight
						? 'border-violet-400 dark:border-violet-500/50 ring-2 ring-violet-500/20 bg-violet-50/50 dark:bg-violet-500/10'
						: 'border-slate-200 dark:border-white/10'
				}`}
			>
				{options.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
		</div>
	);
}

/* ─────────────── Toggle Button Group ─────────────── */

function ToggleButtonGroup({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: string;
	options: PreviaOptionItem[];
	onChange: (v: string) => void;
}) {
	return (
		<fieldset className="min-w-0 border-0 p-0 m-0">
			<legend className="block text-xs text-slate-500 dark:text-gray-400 mb-1">
				{label}
			</legend>
			<div className="flex gap-1">
				{options.map((opt) => (
					<button
						key={opt.value}
						type="button"
						aria-pressed={value === opt.value}
						onClick={() => onChange(opt.value)}
						className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
							value === opt.value
								? 'bg-violet-700 text-white'
								: 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
						}`}
					>
						{opt.label}
					</button>
				))}
			</div>
		</fieldset>
	);
}

/* ─────────────── Font Selector ─────────────── */

function FontSelector({
	value,
	fonts,
	onChange,
}: {
	value: string;
	fonts: PreviaFontOption[];
	onChange: (v: string) => void;
}) {
	const grouped = useMemo(() => {
		const map = new Map<string, PreviaFontOption[]>();
		for (const f of fonts) {
			const list = map.get(f.category) ?? [];
			list.push(f);
			map.set(f.category, list);
		}
		return map;
	}, [fonts]);

	const selectedFont = fonts.find((f) => f.value === value);

	useEffect(() => {
		if (selectedFont) loadGoogleFont(selectedFont.family);
	}, [selectedFont]);

	const id = useId();
	return (
		<div className="col-span-full">
			<label
				htmlFor={id}
				className="block text-xs text-slate-500 dark:text-gray-400 mb-1"
			>
				Fonte
			</label>
			<div className="flex flex-col sm:flex-row gap-2">
				<select
					id={id}
					value={value}
					onChange={(e) => {
						const font = fonts.find((f) => f.value === e.target.value);
						if (font) loadGoogleFont(font.family);
						onChange(e.target.value);
					}}
					className="sm:w-56 shrink-0 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
				>
					{Array.from(grouped.entries()).map(([category, catFonts]) => (
						<optgroup key={category} label={category}>
							{catFonts.map((f) => (
								<option key={f.value} value={f.value}>
									{f.label}
								</option>
							))}
						</optgroup>
					))}
				</select>
				{selectedFont && (
					<div
						className="flex-1 min-w-0 flex items-center px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-base text-slate-900 dark:text-white truncate"
						style={{ fontFamily: selectedFont.family }}
					>
						Profissao Laser — Abc 123
					</div>
				)}
			</div>
		</div>
	);
}

/* ────────── Cabeçalho de seção + campos uniformes (grade do passo Laser) ───── */

function SectionHeader({
	icon: Icon,
	title,
}: {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
}) {
	return (
		<h3 className="col-span-full mt-0.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
			<Icon className="w-3.5 h-3.5 text-violet-500" aria-hidden="true" />
			<span>{title}</span>
			<span className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
		</h3>
	);
}

function NumberField({
	label,
	value,
	min,
	max,
	onChange,
}: {
	label: string;
	value: number;
	min?: number;
	max?: number;
	onChange: (n: number) => void;
}) {
	const id = useId();
	return (
		<div>
			<label
				htmlFor={id}
				className="block text-xs text-slate-500 dark:text-gray-400 mb-1"
			>
				{label}
			</label>
			<input
				id={id}
				type="number"
				value={value}
				min={min}
				max={max}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
			/>
		</div>
	);
}

function RangeField({
	label,
	value,
	min,
	max,
	onChange,
	suffix = '',
}: {
	label: string;
	value: number;
	min?: number;
	max?: number;
	onChange: (n: number) => void;
	suffix?: string;
}) {
	const id = useId();
	return (
		<div>
			<label
				htmlFor={id}
				className="block text-xs text-slate-500 dark:text-gray-400 mb-1"
			>
				{label}: {value}
				{suffix}
			</label>
			<input
				id={id}
				type="range"
				min={min}
				max={max}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-white/10 accent-violet-700"
			/>
		</div>
	);
}

function TextField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
}) {
	const id = useId();
	return (
		<div>
			<label
				htmlFor={id}
				className="block text-xs text-slate-600 dark:text-gray-400 mb-1"
			>
				{label}
			</label>
			<input
				id={id}
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
			/>
		</div>
	);
}

/* ─────────────── History Card ─────────────── */

function HistoryCard({
	previa,
	onEdit,
	onDelete,
}: {
	previa: Previa;
	onEdit: (id: string, name: string, notes: string) => void;
	onDelete: (id: string) => void;
}) {
	const [editing, setEditing] = useState(false);
	const [editName, setEditName] = useState(previa.name);
	const [editNotes, setEditNotes] = useState(previa.notes ?? '');

	return (
		<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden group">
			<div className="aspect-[4/3] bg-slate-100 dark:bg-[#1a1a1d] flex items-center justify-center overflow-hidden">
				{previa.previewUrl ? (
					<img
						src={previa.previewUrl}
						alt={previa.name}
						className="w-full h-full object-cover"
					/>
				) : (
					<Eye className="w-10 h-10 text-slate-300 dark:text-slate-600" />
				)}
			</div>
			<div className="p-3">
				{editing ? (
					<div className="space-y-2">
						<input
							type="text"
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
							className="w-full px-2 py-1 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
						/>
						<textarea
							value={editNotes}
							onChange={(e) => setEditNotes(e.target.value)}
							rows={2}
							placeholder="Notas..."
							className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
						/>
						<div className="flex gap-1">
							<button
								type="button"
								onClick={() => {
									onEdit(previa.id, editName, editNotes);
									setEditing(false);
								}}
								className="flex-1 text-xs py-1 bg-violet-700 text-white rounded-lg hover:bg-violet-600"
							>
								Salvar
							</button>
							<button
								type="button"
								onClick={() => setEditing(false)}
								className="flex-1 text-xs py-1 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5"
							>
								Cancelar
							</button>
						</div>
					</div>
				) : (
					<>
						<h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
							{previa.name || previa.productName}
						</h4>
						<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
							{previa.productName} &middot;{' '}
							{new Date(previa.createdAt).toLocaleDateString('pt-BR')}
						</p>
						{previa.notes && (
							<p className="text-xs text-slate-400 dark:text-gray-500 mt-1 line-clamp-2">
								{previa.notes}
							</p>
						)}
						<div className="flex gap-1 mt-2">
							<button
								type="button"
								onClick={() => setEditing(true)}
								className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
							>
								<Pencil className="w-3 h-3" />
								Editar
							</button>
							{previa.previewUrl && (
								<button
									type="button"
									onClick={() =>
										downloadUrl(
											previa.previewUrl,
											`${previa.name || 'previa'}.png`,
										)
									}
									className="p-1.5 text-slate-500 dark:text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-lg transition-colors"
									title="Baixar"
									aria-label="Baixar prévia"
								>
									<Download className="w-3.5 h-3.5" />
								</button>
							)}
							<button
								type="button"
								onClick={() => onDelete(previa.id)}
								aria-label="Excluir prévia"
								className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
							>
								<Trash2 className="w-3.5 h-3.5" />
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

/* ─────────────── Pagination ─────────────── */

function Pagination({
	page,
	total,
	limit,
	onPageChange,
}: {
	page: number;
	total: number;
	limit: number;
	onPageChange: (p: number) => void;
}) {
	const totalPages = Math.max(1, Math.ceil(total / limit));
	if (totalPages <= 1) return null;

	return (
		<div className="flex items-center justify-center gap-2 mt-6">
			<button
				type="button"
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
				className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
			>
				<ChevronLeft className="w-4 h-4" />
			</button>
			<span className="text-sm text-slate-500 dark:text-gray-400">
				{page} / {totalPages}
			</span>
			<button
				type="button"
				disabled={page >= totalPages}
				onClick={() => onPageChange(page + 1)}
				className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
			>
				<ChevronRight className="w-4 h-4" />
			</button>
		</div>
	);
}

/* ─────────────── Main View ─────────────── */

/** Arte pronta para gerar quando há imagem ou texto. */
function personalizationFor(
	hasImage: boolean,
	hasText: boolean,
): PersonalizationType {
	if (hasImage && hasText) return 'both';
	if (hasText) return 'text';
	return 'logo';
}

/**
 * Espera da geração com etapa e segundos: a IA leva dezenas de segundos, e um
 * spinner mudo faz o aluno achar que travou e clicar de novo.
 */
function GeneratingStatus() {
	const [seconds, setSeconds] = useState(0);
	useEffect(() => {
		const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
		return () => window.clearInterval(id);
	}, []);
	const stage =
		seconds < 3
			? 'Enviando sua arte…'
			: seconds < 30
				? 'A IA está gravando a peça e montando a foto…'
				: 'Quase lá — finalizando os detalhes da foto…';
	return (
		<div className="text-center">
			<p className="text-base font-semibold text-slate-900 dark:text-white">
				{stage}
			</p>
			<p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
				{seconds}s · costuma levar de 20 a 40 segundos
			</p>
		</div>
	);
}

function optionLabel(list: PreviaOptionItem[] | undefined, value: string) {
	return list?.find((o) => o.value === value)?.label ?? value;
}

export function PreviasView() {
	// Options from API
	const { data: options, isLoading: optionsLoading } = usePreviaOptions();

	// Fluxo principal: imagem → produto/cor → gerar
	const [selectedProductId, setSelectedProductId] = useState<string | null>(
		null,
	);
	const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
		null,
	);
	const [imageLogo, setImageLogo] = useState<string | null>(null);
	const [customName, setCustomName] = useState('');
	const [texto2, setTexto2] = useState('');
	const [showTexto2, setShowTexto2] = useState(false);
	// Posição marcada pelo aluno no editor; null = automática.
	const [layout, setLayout] = useState<PreviaLayout | null>(null);
	// O que está na tela (automático ou do aluno) — vai no payload se manual.
	const resolvedLayout = useRef<PreviaLayout>({});
	const handleResolvedLayout = useCallback((l: PreviaLayout) => {
		resolvedLayout.current = l;
	}, []);

	const { data: selectedProduct, isError: selectedProductError } =
		useLaserProduct(selectedProductId, !!selectedProductId);
	const selectedVariant = selectedProduct?.variants?.find(
		(v) => v.id === selectedVariantId && v.status === 'ativo',
	);

	// Configurações avançadas (recolhidas)
	const [advancedOpen, setAdvancedOpen] = useState(false);
	const [modoLentes, setModoLentes] = useState(false);
	const [textoLenteDireita, setTextoLenteDireita] = useState('');
	const [textoLenteEsquerda, setTextoLenteEsquerda] = useState('');
	const [instrucoesPersonalizadas, setInstrucoesPersonalizadas] = useState('');
	const [laserSettings, setLaserSettings] = useState<LaserSettings>(
		DEFAULT_LASER_SETTINGS,
	);

	// Resultado
	const [generatedPrevia, setGeneratedPrevia] = useState<{
		previewUrl: string;
		tipoVisualizacao: string;
		productName: string;
		productColor?: string;
	} | null>(null);

	const pickerRef = useRef<HTMLDivElement>(null);
	const advancedRef = useRef<HTMLDivElement>(null);
	const resultRef = useRef<HTMLDivElement>(null);
	const advancedId = useId();
	const textId = useId();

	// History
	const [histPage, setHistPage] = useState(1);
	const histLimit = 12;

	const generateMutation = useGeneratePrevia();
	// Billing opcional: se houver funcionalidade `previa` liberada → cobra; senão livre.
	const { courses } = useEntitlements();
	const courseSlug = courses[0]?.slug;
	const previaBilling = useToolBilling('previa', courseSlug);
	const { data: historyData, isLoading: histLoading } = usePreviasHistory(
		histPage,
		histLimit,
	);
	const updateMutation = useUpdatePrevia();
	const deleteMutation = useDeletePrevia();

	// Watermark
	const { data: watermark } = useWatermark();
	const uploadWatermarkMutation = useUploadWatermark();
	const deleteWatermarkMutation = useDeleteWatermark();
	const [watermarkMode, setWatermarkMode] = useState<
		'none' | 'corners' | 'tiled'
	>('corners');
	const watermarkFileRef = useRef<HTMLInputElement>(null);
	const hasWatermark = !!watermark;
	const useWatermarkFlag = hasWatermark && watermarkMode !== 'none';

	const hasImage = !!imageLogo;
	const hasText = customName.trim().length > 0;
	const hasTexto2 = hasText && texto2.trim().length > 0;
	// 360° e lentes têm posição própria no motor: o editor fica só de vista.
	const layoutEditable =
		laserSettings.posicao !== 'envolvente-360' && !modoLentes;
	// O 2º texto só existe no layout manual (o motor só o grava com caixa).
	const layoutManual = layoutEditable && (!!layout || hasTexto2);
	const personalizationType = personalizationFor(hasImage, hasText);
	const canGenerate = !!selectedVariant && (hasImage || hasText);
	const missingHint = !selectedVariant
		? selectedProductId
			? 'Escolha a cor do produto.'
			: 'Escolha um produto.'
		: !hasImage && !hasText
			? 'Envie uma imagem ou escreva um nome.'
			: null;

	/* ── Lembrar o último produto e a última cor ── */
	useEffect(() => {
		const last = readLastChoice();
		if (last) {
			setSelectedProductId(last.productId);
			setSelectedVariantId(last.variantId);
		}
	}, []);

	// Produto lembrado que sumiu/ficou inativo → começa do zero, sem erro.
	useEffect(() => {
		if (selectedProductError) {
			clearLastChoice();
			setSelectedProductId(null);
			setSelectedVariantId(null);
		}
	}, [selectedProductError]);
	useEffect(() => {
		if (
			selectedProduct &&
			selectedVariantId &&
			!selectedProduct.variants?.some(
				(v) => v.id === selectedVariantId && v.status === 'ativo',
			)
		) {
			setSelectedVariantId(null);
		}
	}, [selectedProduct, selectedVariantId]);

	/* ── Inferir o laser pelo material do produto ── */
	// Material + acabamento + fundo sugerido, uma vez por produto: o que o aluno
	// mudar depois no avançado é respeitado até ele trocar de produto. Sem
	// material identificável, fica o padrão (aço inox, pedido do cliente).
	const presetAppliedFor = useRef<string | null>(null);
	useEffect(() => {
		if (!selectedProduct || !options) return;
		if (presetAppliedFor.current === selectedProduct.id) return;
		presetAppliedFor.current = selectedProduct.id;
		const preset = pickValidPreset(smartPresetFor(selectedProduct), {
			material: options.material.map((o) => o.value),
			acabamentoSuperficie: options.acabamentoSuperficie.map((o) => o.value),
		});
		const fundo = suggestedBackgrounds(selectedProduct).find((v) =>
			options.fundoCena.some((o) => o.value === v),
		);
		setLaserSettings((prev) => ({
			...prev,
			material: preset.material ?? DEFAULT_LASER_SETTINGS.material,
			acabamentoSuperficie:
				preset.acabamentoSuperficie ??
				DEFAULT_LASER_SETTINGS.acabamentoSuperficie,
			...(fundo ? { fundoCena: fundo } : {}),
		}));
	}, [selectedProduct, options]);

	// Garante um fundo válido: se o default (mesa-ambiente) ainda não existir nas
	// opções (motor não deployado), cai pro 1º fundo disponível.
	useEffect(() => {
		const fundos = options?.fundoCena;
		if (
			fundos?.length &&
			!fundos.some((o) => o.value === laserSettings.fundoCena)
		) {
			setLaserSettings((prev) => ({ ...prev, fundoCena: fundos[0].value }));
		}
	}, [options, laserSettings.fundoCena]);

	const buildPayload = useCallback((): GeneratePreviaPayload | null => {
		if (!selectedVariantId) return null;
		return {
			productVariantId: selectedVariantId,
			imagelogo_url: imageLogo || undefined,
			personalizationType,
			customName: customName.trim() || undefined,
			instrucoesPersonalizadas: instrucoesPersonalizadas.trim() || undefined,
			modoLentes,
			textoLenteDireita: textoLenteDireita.trim() || undefined,
			textoLenteEsquerda: textoLenteEsquerda.trim() || undefined,
			// O motor só grava o nome com `comNome: 'com'` (ou só-texto). Antes
			// isso era um toggle separado e "Logo + Texto" saía sem o nome.
			laserSettings: {
				...laserSettings,
				comNome: hasText ? 'com' : 'sem',
				layout: layoutManual ? resolvedLayout.current : null,
				texto2: hasTexto2 ? texto2.trim() : undefined,
			},
			useWatermark: useWatermarkFlag || undefined,
			watermarkMode: useWatermarkFlag ? watermarkMode : undefined,
		};
	}, [
		selectedVariantId,
		imageLogo,
		personalizationType,
		customName,
		hasText,
		hasTexto2,
		texto2,
		layoutManual,
		instrucoesPersonalizadas,
		modoLentes,
		textoLenteDireita,
		textoLenteEsquerda,
		laserSettings,
		useWatermarkFlag,
		watermarkMode,
	]);

	// Billing opcional: cobra se a ferramenta `previa` tiver funcionalidade; senão
	// roda livre. O invocation_id (quando cobrada) vai no payload pro motor liquidar.
	const handleGenerate = useCallback(async () => {
		const payload = buildPayload();
		if (!payload || !canGenerate) {
			toast.error(missingHint ?? 'Selecione um produto e uma cor.');
			return;
		}
		if (generateMutation.isPending) return;
		window.setTimeout(() => {
			resultRef.current?.scrollIntoView({
				behavior: 'smooth',
				block: 'center',
			});
		}, 60);
		await previaBilling.runEngine((invocationId) =>
			generateMutation
				.mutateAsync({ ...payload, invocation_id: invocationId })
				.then((result) => {
					setGeneratedPrevia({
						previewUrl: result.previewUrl,
						tipoVisualizacao: payload.laserSettings.tipoVisualizacao,
						productName: result.productName,
						productColor: result.productColor,
					});
					return result;
				}),
		);
	}, [buildPayload, canGenerate, missingHint, generateMutation, previaBilling]);

	// Ctrl/Cmd + Enter gera de qualquer lugar da tela.
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				void handleGenerate();
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [handleGenerate]);

	// Quando a prévia chega, centraliza o resultado no viewport.
	useEffect(() => {
		if (!generatedPrevia) return;
		const id = window.setTimeout(() => {
			resultRef.current?.scrollIntoView({
				behavior: 'smooth',
				block: 'center',
			});
		}, 80);
		return () => window.clearTimeout(id);
	}, [generatedPrevia]);

	const handleSelectProduct = useCallback((id: string | null) => {
		setSelectedProductId(id);
		setSelectedVariantId(null);
		// Outro produto, outra forma: volta para a posição automática.
		setLayout(null);
	}, []);

	const handleSelectVariant = useCallback(
		(id: string | null) => {
			setSelectedVariantId(id);
			if (id && selectedProductId) {
				saveLastChoice({ productId: selectedProductId, variantId: id });
			}
		},
		[selectedProductId],
	);

	// Trocar o produto mantendo a imagem: leva o aluno de volta aos cards.
	const handleSwapProduct = useCallback(() => {
		const el = pickerRef.current;
		if (!el) return;
		el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		el.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')?.focus({
			preventScroll: true,
		});
	}, []);

	const handleNewPrevia = useCallback(() => {
		setImageLogo(null);
		setCustomName('');
		setTexto2('');
		setShowTexto2(false);
		setLayout(null);
		setGeneratedPrevia(null);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, []);

	const openAdvanced = useCallback(() => {
		setAdvancedOpen(true);
		window.setTimeout(() => {
			advancedRef.current?.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
			});
		}, 60);
	}, []);

	const updateLS = useCallback(
		(key: keyof LaserSettings, value: LaserSettings[keyof LaserSettings]) => {
			setLaserSettings((prev) => ({ ...prev, [key]: value }));
			// Mexeu no tamanho/posição/rotação automáticos → larga a marcação.
			if (key === 'tamanho' || key === 'posicao' || key === 'rotacao') {
				setLayout(null);
			}
		},
		[],
	);

	// Trocar o Material também ajusta o Acabamento sugerido (clampado às opções).
	const updateMaterial = useCallback(
		(material: string) => {
			const finish = finishForMaterial(material);
			const finishValues =
				options?.acabamentoSuperficie?.map((o) => o.value) ?? [];
			setLaserSettings((prev) => ({
				...prev,
				material,
				...(finish && finishValues.includes(finish)
					? { acabamentoSuperficie: finish }
					: {}),
			}));
		},
		[options],
	);

	// Helper to get range from options or fallback
	const getRange = useCallback(
		(key: string, fallbackMin: number, fallbackMax: number) => {
			if (options?.ranges?.[key]) {
				return options.ranges[key];
			}
			return { min: fallbackMin, max: fallbackMax };
		},
		[options],
	);

	// Helper to get options list or fallback
	const getOptions = useCallback(
		(key: keyof PreviaOptions): PreviaOptionItem[] => {
			if (!options) return [];
			const val = options[key];
			if (Array.isArray(val)) return val as PreviaOptionItem[];
			return [];
		},
		[options],
	);

	const variantImage =
		selectedVariant?.imageUrl &&
		!selectedVariant.imageUrl.includes('placeholder')
			? selectedVariant.imageUrl
			: null;
	const laserSummary = [
		optionLabel(options?.material, laserSettings.material),
		optionLabel(
			options?.acabamentoSuperficie,
			laserSettings.acabamentoSuperficie,
		),
		optionLabel(options?.fundoCena, laserSettings.fundoCena),
	].join(' · ');

	return (
		<div className="p-4 md:p-8">
			<PageHeader
				title="Prévias IA"
				subtitle="Envie a arte, escolha o produto e gere uma foto realista da gravação."
				icon={Eye}
			/>

			<div className="flex justify-end -mt-2 mb-4">
				<button
					type="button"
					onClick={() =>
						document
							.getElementById('previas-historico')
							?.scrollIntoView({ behavior: 'smooth', block: 'start' })
					}
					className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
				>
					<Image className="w-4 h-4 text-violet-600 dark:text-violet-400" />
					Histórico de prévias
				</button>
			</div>

			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-4 md:p-6 mb-8">
				<div className="grid gap-6 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
					{/* 1. Arte */}
					<section
						aria-labelledby={`${textId}-arte`}
						className="min-w-0 space-y-3"
					>
						<h2
							id={`${textId}-arte`}
							className="text-sm font-semibold text-slate-900 dark:text-white"
						>
							<span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white">
								1
							</span>
							Sua arte
						</h2>
						<PreviaImageStage
							image={imageLogo}
							onImageChange={setImageLogo}
							productImageUrl={variantImage}
							productLabel={
								selectedProduct && selectedVariant
									? `${selectedProduct.name} ${selectedVariant.colorName ?? ''}`.trim()
									: null
							}
							darkProduct={selectedVariant?.colorHex ?? null}
							text={customName}
							text2={hasTexto2 ? texto2 : ''}
							fontFamily={
								options?.fontes.find(
									(f) => f.value === laserSettings.fonteFamilia,
								)?.family
							}
							tamanho={laserSettings.tamanho}
							posicao={laserSettings.posicao}
							rotacao={laserSettings.rotacao}
							editable={layoutEditable}
							layout={layoutEditable ? layout : null}
							onLayoutChange={setLayout}
							onResolvedLayout={handleResolvedLayout}
						/>
						<div>
							<label
								htmlFor={textId}
								className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
							>
								Nome ou frase{' '}
								<span className="font-normal text-slate-500 dark:text-gray-400">
									(opcional)
								</span>
							</label>
							<input
								id={textId}
								type="text"
								value={customName}
								onChange={(e) => setCustomName(e.target.value)}
								placeholder="Ex.: Ana Clara"
								maxLength={80}
								className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
							/>
						</div>
						{hasText && layoutEditable && (showTexto2 || texto2) ? (
							<div>
								<label
									htmlFor={`${textId}-2`}
									className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
								>
									Outro texto{' '}
									<span className="font-normal text-slate-500 dark:text-gray-400">
										(frase, data…)
									</span>
								</label>
								<input
									id={`${textId}-2`}
									type="text"
									value={texto2}
									onChange={(e) => setTexto2(e.target.value)}
									placeholder="Ex.: Desde 2020"
									maxLength={80}
									// biome-ignore lint/a11y/noAutofocus: aparece porque o aluno pediu
									autoFocus={!texto2}
									className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
								/>
							</div>
						) : (
							hasText &&
							layoutEditable && (
								<button
									type="button"
									onClick={() => setShowTexto2(true)}
									className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 underline-offset-2 hover:underline dark:text-violet-300"
								>
									<Plus className="h-3.5 w-3.5" aria-hidden="true" />
									Adicionar outro texto
								</button>
							)
						)}
					</section>

					{/* 2. Produto + cor */}
					<section className="min-w-0 space-y-4">
						<PreviaProductPicker
							ref={pickerRef}
							selectedProductId={selectedProductId}
							selectedVariantId={selectedVariantId}
							onSelectProduct={handleSelectProduct}
							onSelectVariant={handleSelectVariant}
						/>
						{selectedVariant && options && (
							<p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-xl bg-violet-50 dark:bg-violet-500/10 px-3 py-2 text-xs text-violet-800 dark:text-violet-200">
								<Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
								<span>
									Ajustado para o produto: <strong>{laserSummary}</strong>
								</span>
								<button
									type="button"
									onClick={openAdvanced}
									className="font-semibold underline underline-offset-2 hover:text-violet-950 dark:hover:text-white"
								>
									Ajustar
								</button>
							</p>
						)}
					</section>
				</div>

				{/* 3. Gerar — fixo no rodapé no celular */}
				<div className="sticky bottom-0 z-20 -mx-4 mt-5 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none dark:border-white/10 dark:bg-[#1a1a1d]/95 md:dark:bg-transparent">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<button
							type="button"
							onClick={handleGenerate}
							disabled={generateMutation.isPending || previaBilling.pending}
							aria-disabled={!canGenerate}
							aria-describedby={`${advancedId}-gen-hint`}
							className={`flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 font-bold text-white transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/40 disabled:opacity-60 ${
								canGenerate
									? 'bg-violet-700 hover:bg-violet-600 shadow-lg shadow-violet-700/25'
									: 'bg-violet-700/50 cursor-not-allowed'
							}`}
						>
							{generateMutation.isPending ? (
								<Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
							) : (
								<Sparkles className="w-5 h-5" aria-hidden="true" />
							)}
							{generateMutation.isPending ? 'Gerando…' : 'Gerar prévia'}
						</button>
						<p
							id={`${advancedId}-gen-hint`}
							className="text-xs text-slate-600 dark:text-gray-400"
							aria-live="polite"
						>
							{missingHint ?? (
								<>
									Pronto para gerar
									<span className="hidden sm:inline"> · Ctrl+Enter</span>
								</>
							)}
						</p>
					</div>
					{previaBilling.notice && (
						<div className="mt-2">{previaBilling.notice}</div>
					)}
				</div>

				{/* Resultado */}
				{(generateMutation.isPending || generatedPrevia) && (
					<div
						ref={resultRef}
						className="mt-6 rounded-2xl border-2 border-violet-200 dark:border-violet-500/30 bg-gradient-to-b from-violet-50 to-white dark:from-violet-500/5 dark:to-[#1a1a1d] p-4 md:p-5 scroll-mt-24"
						aria-live="polite"
						aria-busy={generateMutation.isPending}
					>
						{generateMutation.isPending ? (
							<div className="flex flex-col items-center gap-4 py-12">
								<div className="relative">
									<div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" />
									<div className="relative w-16 h-16 rounded-full bg-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
										<Sparkles className="w-7 h-7 text-white animate-pulse" />
									</div>
								</div>
								<GeneratingStatus />
							</div>
						) : (
							generatedPrevia && (
								<>
									<div className="flex items-center gap-2 mb-4">
										<div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
											<Check
												className="w-4 h-4 text-white"
												aria-hidden="true"
											/>
										</div>
										<div>
											<p className="text-sm font-bold text-slate-900 dark:text-white">
												Prévia pronta
											</p>
											<p className="text-xs text-slate-600 dark:text-gray-400">
												{/* Da prévia gerada: a seleção atual pode já ser outra. */}
												{generatedPrevia.productName}
												{generatedPrevia.productColor
													? ` · ${generatedPrevia.productColor}`
													: ''}
											</p>
										</div>
									</div>
									<div className="mx-auto w-full max-w-lg bg-slate-100 dark:bg-black/30 rounded-xl overflow-hidden shadow-inner">
										{generatedPrevia.tipoVisualizacao === 'turntable-4' ? (
											<PreviaTurntableViewer
												src={generatedPrevia.previewUrl}
												alt="Prévia gerada — mockup girando"
											/>
										) : (
											<img
												src={generatedPrevia.previewUrl}
												alt="Prévia gerada"
												className="w-full max-h-[60vh] object-contain"
											/>
										)}
									</div>
									<div className="mx-auto mt-4 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4 [&>button]:whitespace-nowrap">
										<button
											type="button"
											onClick={() =>
												downloadUrl(generatedPrevia.previewUrl, 'previa.png')
											}
											className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 rounded-xl bg-violet-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-violet-600"
										>
											<Download className="w-4 h-4" aria-hidden="true" />
											Baixar
										</button>
										<button
											type="button"
											onClick={handleGenerate}
											className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
										>
											<RotateCcw className="w-4 h-4" aria-hidden="true" />
											Variação
										</button>
										<button
											type="button"
											onClick={handleSwapProduct}
											className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
										>
											<Package className="w-4 h-4" aria-hidden="true" />
											Trocar produto
										</button>
										<button
											type="button"
											onClick={handleNewPrevia}
											className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
										>
											<ImagePlus className="w-4 h-4" aria-hidden="true" />
											Nova arte
										</button>
									</div>
								</>
							)
						)}
					</div>
				)}
				{/* Configurações avançadas (recolhidas) */}
				<div
					ref={advancedRef}
					className="mt-6 rounded-xl border border-slate-200 dark:border-white/10 scroll-mt-24"
				>
					<h2>
						<button
							type="button"
							aria-expanded={advancedOpen}
							aria-controls={advancedId}
							onClick={() => setAdvancedOpen((o) => !o)}
							className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
						>
							<SlidersHorizontal
								className="h-4 w-4 text-violet-600 dark:text-violet-400"
								aria-hidden="true"
							/>
							Configurações avançadas
							<span className="hidden sm:inline text-xs font-normal text-slate-500 dark:text-gray-400">
								— tamanho, posição, material, foto, fundo, marca d&apos;água,
								máquina
							</span>
							<ChevronDown
								className={`ml-auto h-4 w-4 text-slate-500 transition-transform ${
									advancedOpen ? 'rotate-180' : ''
								}`}
								aria-hidden="true"
							/>
						</button>
					</h2>

					{advancedOpen && (
						<div
							id={advancedId}
							className="border-t border-slate-200 dark:border-white/10 px-4 pb-4 pt-3"
						>
							{optionsLoading ? (
								<div className="flex items-center justify-center py-8">
									<Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
									<span className="ml-2 text-sm text-slate-600 dark:text-gray-400">
										Carregando opções…
									</span>
								</div>
							) : (
								<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-2">
									<SectionHeader icon={Ruler} title="Tamanho e posição" />
									<DynamicSelect
										label="Tamanho"
										value={laserSettings.tamanho}
										options={getOptions('tamanho')}
										onChange={(v) => updateLS('tamanho', v)}
									/>
									<DynamicSelect
										label="Posição"
										value={laserSettings.posicao}
										options={getOptions('posicao')}
										onChange={(v) => updateLS('posicao', v)}
									/>
									<NumberField
										label="Rotação (°)"
										value={laserSettings.rotacao}
										min={getRange('rotacao', -360, 360).min}
										max={getRange('rotacao', -360, 360).max}
										onChange={(n) => updateLS('rotacao', n)}
									/>
									<DynamicSelect
										label="Moldura"
										value={laserSettings.moldura}
										options={getOptions('moldura')}
										onChange={(v) => updateLS('moldura', v)}
									/>

									<SectionHeader icon={Palette} title="Laser e material" />
									<DynamicSelect
										label="Material"
										value={laserSettings.material}
										options={getOptions('material')}
										onChange={updateMaterial}
									/>
									<DynamicSelect
										label="Acabamento"
										value={laserSettings.acabamentoSuperficie}
										options={getOptions('acabamentoSuperficie')}
										onChange={(v) => updateLS('acabamentoSuperficie', v)}
									/>
									<DynamicSelect
										label="Estilo"
										value={laserSettings.estiloGravacao}
										options={getOptions('estiloGravacao')}
										onChange={(v) => updateLS('estiloGravacao', v)}
									/>
									<DynamicSelect
										label="Intensidade"
										value={laserSettings.intensidade}
										options={getOptions('intensidade')}
										onChange={(v) => updateLS('intensidade', v)}
									/>
									<DynamicSelect
										label="Profundidade"
										value={laserSettings.profundidade}
										options={getOptions('profundidade')}
										onChange={(v) => updateLS('profundidade', v)}
									/>

									{hasText && (
										<>
											<SectionHeader icon={Type} title="Texto" />
											<DynamicSelect
												label="Tamanho do nome"
												value={laserSettings.tamanhoNome}
												options={getOptions('tamanhoNome')}
												onChange={(v) => updateLS('tamanhoNome', v)}
											/>
											<ToggleButtonGroup
												label="Orientação do nome"
												value={laserSettings.orientacaoNome}
												options={getOptions('orientacaoNome')}
												onChange={(v) => updateLS('orientacaoNome', v)}
											/>
											{hasImage && (
												<>
													<ToggleButtonGroup
														label="Orientação da logo"
														value={laserSettings.orientacaoLogo}
														options={getOptions('orientacaoLogo')}
														onChange={(v) => updateLS('orientacaoLogo', v)}
													/>
													<DynamicSelect
														label="Texto em relação à logo"
														value={laserSettings.posicaoTextoRelLogo}
														options={getOptions('posicaoTextoRelLogo')}
														onChange={(v) => updateLS('posicaoTextoRelLogo', v)}
													/>
													<DynamicSelect
														label="Espaçamento"
														value={laserSettings.espacamentoLogoTexto}
														options={getOptions('espacamentoLogoTexto')}
														onChange={(v) =>
															updateLS('espacamentoLogoTexto', v)
														}
													/>
												</>
											)}
											{options?.fontes && options.fontes.length > 0 && (
												<FontSelector
													value={laserSettings.fonteFamilia}
													fonts={options.fontes}
													onChange={(v) => updateLS('fonteFamilia', v)}
												/>
											)}
										</>
									)}

									<SectionHeader icon={Camera} title="Foto" />
									<DynamicSelect
										label="Tipo de foto"
										value={laserSettings.tipoVisualizacao}
										options={getOptions('tipoVisualizacao')}
										onChange={(v) => updateLS('tipoVisualizacao', v)}
									/>
									<DynamicSelect
										label="Câmera"
										value={laserSettings.anguloCamera}
										options={getOptions('anguloCamera')}
										onChange={(v) => updateLS('anguloCamera', v)}
									/>
									<DynamicSelect
										label="Iluminação"
										value={laserSettings.iluminacao}
										options={getOptions('iluminacao')}
										onChange={(v) => updateLS('iluminacao', v)}
									/>
									<RangeField
										label="Contraste"
										suffix="%"
										value={laserSettings.contraste}
										min={getRange('contraste', 0, 100).min}
										max={getRange('contraste', 0, 100).max}
										onChange={(n) => updateLS('contraste', n)}
									/>
									<RangeField
										label="Sombra"
										suffix="%"
										value={laserSettings.efeitoSombra}
										min={getRange('efeitoSombra', 0, 100).min}
										max={getRange('efeitoSombra', 0, 100).max}
										onChange={(n) => updateLS('efeitoSombra', n)}
									/>
									<div className="col-span-full">
										<span className="block text-xs text-slate-600 dark:text-gray-400 mb-1">
											Fundo da cena
										</span>
										<PreviaBackgroundPicker
											value={laserSettings.fundoCena}
											options={getOptions('fundoCena')}
											suggested={
												selectedProduct
													? suggestedBackgrounds(selectedProduct)
													: []
											}
											onChange={(v) => updateLS('fundoCena', v)}
										/>
									</div>

									<SectionHeader icon={Pencil} title="Extras" />
									<div className="col-span-full">
										<label
											htmlFor={`${advancedId}-instr`}
											className="block text-xs text-slate-600 dark:text-gray-400 mb-1"
										>
											Instruções para a IA (opcional)
										</label>
										<textarea
											id={`${advancedId}-instr`}
											value={instrucoesPersonalizadas}
											onChange={(e) =>
												setInstrucoesPersonalizadas(e.target.value)
											}
											rows={2}
											placeholder="Ex.: gravar no canto superior direito, inclinado 45°"
											className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
										/>
									</div>
									<div className="col-span-full flex flex-wrap items-center gap-3">
										<button
											type="button"
											role="switch"
											aria-checked={modoLentes}
											aria-labelledby={`${advancedId}-lentes`}
											onClick={() => setModoLentes(!modoLentes)}
											className={`relative w-11 h-6 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
												modoLentes
													? 'bg-violet-700'
													: 'bg-slate-300 dark:bg-white/20'
											}`}
										>
											<span
												className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
													modoLentes ? 'translate-x-5' : 'translate-x-0'
												}`}
											/>
										</button>
										<span
											id={`${advancedId}-lentes`}
											className="text-sm text-slate-700 dark:text-slate-300"
										>
											Modo lentes (óculos)
										</span>
									</div>
									{modoLentes && (
										<>
											<TextField
												label="Texto lente direita"
												value={textoLenteDireita}
												onChange={setTextoLenteDireita}
											/>
											<TextField
												label="Texto lente esquerda"
												value={textoLenteEsquerda}
												onChange={setTextoLenteEsquerda}
											/>
										</>
									)}

									{/* Marca d'água */}
									<div className="col-span-full rounded-xl border border-slate-200 dark:border-white/10 p-3">
										<div className="flex flex-wrap items-center gap-3">
											<Stamp
												className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0"
												aria-hidden="true"
											/>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-semibold text-slate-900 dark:text-white">
													Marca d&apos;água da empresa
												</p>
												<p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">
													{hasWatermark
														? 'Aplicada nas suas prévias.'
														: "Cadastre sua logo para usar como marca d'água."}
												</p>
											</div>
											{hasWatermark && watermark?.imageUrl && (
												<img
													src={watermark.imageUrl}
													alt="Marca d'água atual"
													className="w-10 h-10 rounded-lg object-contain border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d]"
												/>
											)}
											<div className="flex gap-1.5 shrink-0">
												<button
													type="button"
													onClick={() => watermarkFileRef.current?.click()}
													className="px-3 py-1.5 text-xs font-medium bg-violet-700 hover:bg-violet-600 text-white rounded-lg transition-colors"
												>
													{hasWatermark ? 'Trocar' : 'Enviar'}
												</button>
												{hasWatermark && (
													<button
														type="button"
														onClick={() => deleteWatermarkMutation.mutate()}
														disabled={deleteWatermarkMutation.isPending}
														className="px-3 py-1.5 text-xs font-medium border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
													>
														Remover
													</button>
												)}
											</div>
										</div>
										{hasWatermark && (
											<div className="mt-3">
												<ToggleButtonGroup
													label="Onde aplicar"
													value={watermarkMode}
													options={[
														{ value: 'none', label: 'Sem marca' },
														{ value: 'corners', label: 'Cantos' },
														{ value: 'tiled', label: 'Grade' },
													]}
													onChange={(v) =>
														setWatermarkMode(v as 'none' | 'corners' | 'tiled')
													}
												/>
											</div>
										)}
										<input
											ref={watermarkFileRef}
											type="file"
											accept="image/png,image/jpeg"
											className="hidden"
											aria-label="Enviar marca d'água"
											onChange={(e) => {
												const f = e.target.files?.[0];
												if (f) uploadWatermarkMutation.mutate(f);
												e.target.value = '';
											}}
										/>
									</div>

									{/* Minha máquina + parâmetros de laser */}
									<div className="col-span-full">
										<MyMachineSection
											productId={selectedProductId}
											variantId={selectedVariantId}
										/>
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* History Section */}
			<div id="previas-historico" className="scroll-mt-24">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
					<Image className="w-5 h-5 text-violet-600" />
					Histórico de prévias
				</h3>

				{histLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
					</div>
				) : !historyData?.data.length ? (
					<div className="text-center py-12 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl">
						<Eye className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
						<p className="text-slate-600 dark:text-gray-400 font-medium">
							Nenhuma prévia gerada ainda
						</p>
						<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
							Envie uma arte acima para gerar a primeira.
						</p>
					</div>
				) : (
					<>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
							{historyData.data.map((previa) => (
								<HistoryCard
									key={previa.id}
									previa={previa}
									onEdit={(id, name, notes) =>
										updateMutation.mutate({ id, payload: { name, notes } })
									}
									onDelete={(id) => deleteMutation.mutate(id)}
								/>
							))}
						</div>
						<Pagination
							page={histPage}
							total={historyData.total}
							limit={histLimit}
							onPageChange={setHistPage}
						/>
					</>
				)}
			</div>
		</div>
	);
}
