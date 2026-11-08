'use client';

import { ImagePlus, Package, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
	LayoutCanvas,
	LayoutToolbar,
} from '@/components/previas/previa-layout-editor';
import type { PreviaLayout, PreviaLayoutBox } from '@/types/previas';
import {
	autoLayout,
	LAYOUT_KEYS,
	type LayoutKey,
	measureProductWidth,
} from '@/utils/previa-layout';

export const ACCEPTED_TYPES = [
	'image/png',
	'image/jpeg',
	'image/jpg',
	'image/webp',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGE_DIM = 1024;
const JPEG_QUALITY = 0.7;
// Teto do data URL em PNG: o corpo do POST passa pelo limite padrão de 1 MiB.
const MAX_PNG_DATA_URL = 700_000;

function compressImage(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new window.Image();
		img.onload = () => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				reject(new Error('Canvas not supported'));
				return;
			}
			const draw = (maxDim: number) => {
				const ratio = Math.min(1, maxDim / img.width, maxDim / img.height);
				canvas.width = Math.round(img.width * ratio);
				canvas.height = Math.round(img.height * ratio);
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			};
			draw(MAX_IMAGE_DIM);
			// JPEG não tem alfa: o fundo transparente vira preto e some com logos
			// escuras. PNG/WEBP seguem em PNG (reduzindo se passar do teto).
			if (file.type !== 'image/png' && file.type !== 'image/webp') {
				resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
				return;
			}
			let dim = MAX_IMAGE_DIM;
			let url = canvas.toDataURL('image/png');
			while (url.length > MAX_PNG_DATA_URL && dim > 384) {
				dim = Math.round(dim * 0.75);
				draw(dim);
				url = canvas.toDataURL('image/png');
			}
			resolve(url);
		};
		img.onerror = reject;
		img.src = URL.createObjectURL(file);
	});
}

/** Produto escuro? Decide se a marca do laser aparece clara ou escura. */
function isDarkHex(hex: string | null | undefined): boolean {
	const m = hex?.trim().match(/^#?([0-9a-f]{6})$/i);
	if (!m) return false;
	const n = Number.parseInt(m[1], 16);
	const r = (n >> 16) & 255;
	const g = (n >> 8) & 255;
	const b = n & 255;
	return 0.2126 * r + 0.7152 * g + 0.0722 * b < 110;
}

/** Proporção (largura/altura) de uma imagem; null até carregar. */
function useImageAspect(src: string | null): number | null {
	const [aspect, setAspect] = useState<{ src: string; value: number } | null>(
		null,
	);
	useEffect(() => {
		if (!src) return;
		let alive = true;
		const img = new window.Image();
		img.onload = () => {
			if (alive && img.naturalWidth && img.naturalHeight) {
				setAspect({ src, value: img.naturalWidth / img.naturalHeight });
			}
		};
		img.src = src;
		return () => {
			alive = false;
		};
	}, [src]);
	return src && aspect?.src === src ? aspect.value : null;
}

/**
 * Área principal da Prévia: recebe a imagem (soltar, colar ou clicar) e mostra
 * a arte sobre a foto do produto escolhido. Cada elemento (imagem, texto,
 * 2º texto) pode ser arrastado, redimensionado e girado — quem não mexe fica
 * com a posição automática; quem mexe manda o layout para a IA seguir.
 */
export function PreviaImageStage({
	image,
	onImageChange,
	productImageUrl,
	productLabel,
	darkProduct,
	text,
	text2,
	fontFamily,
	tamanho,
	posicao,
	rotacao,
	editable,
	layout,
	onLayoutChange,
	onResolvedLayout,
}: {
	image: string | null;
	onImageChange: (dataUrl: string | null) => void;
	productImageUrl: string | null;
	productLabel: string | null;
	darkProduct: string | null;
	text: string;
	text2: string;
	fontFamily?: string;
	tamanho: string;
	posicao: string;
	rotacao: number;
	/** Falso no 360° e no modo lentes: a posição é sempre automática. */
	editable: boolean;
	/** Layout do aluno; null = automático. */
	layout: PreviaLayout | null;
	onLayoutChange: (layout: PreviaLayout | null) => void;
	/** O layout que está na tela (automático ou do aluno), para o payload. */
	onResolvedLayout: (layout: PreviaLayout) => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [dragging, setDragging] = useState(false);
	const [loading, setLoading] = useState(false);
	const [selected, setSelected] = useState<LayoutKey | null>(null);
	const [productWidth, setProductWidth] = useState<{
		url: string;
		value: number | null;
	} | null>(null);

	const handleFile = useCallback(
		async (file: File) => {
			if (!ACCEPTED_TYPES.includes(file.type)) {
				toast.error('Formato não suportado. Use PNG, JPG ou WEBP.');
				return;
			}
			if (file.size > MAX_FILE_SIZE) {
				toast.error('Arquivo muito grande (máx. 10 MB).');
				return;
			}
			setLoading(true);
			try {
				onImageChange(await compressImage(file));
			} catch {
				toast.error('Não foi possível ler essa imagem.');
			} finally {
				setLoading(false);
			}
		},
		[onImageChange],
	);

	// Colar (Ctrl+V / Cmd+V) em qualquer lugar da tela — se o que foi colado
	// for imagem. Texto colado num campo segue o caminho normal.
	useEffect(() => {
		function onPaste(e: ClipboardEvent) {
			const file = Array.from(e.clipboardData?.files ?? []).find((f) =>
				f.type.startsWith('image/'),
			);
			if (!file) return;
			e.preventDefault();
			void handleFile(file);
		}
		window.addEventListener('paste', onPaste);
		return () => window.removeEventListener('paste', onPaste);
	}, [handleFile]);

	// Largura real do produto na foto → "X% do produto" e tamanhos P/M/G certos.
	useEffect(() => {
		if (!productImageUrl) return;
		let alive = true;
		void measureProductWidth(productImageUrl).then((value) => {
			if (alive) setProductWidth({ url: productImageUrl, value });
		});
		return () => {
			alive = false;
		};
	}, [productImageUrl]);
	const measuredWidth =
		productWidth?.url === productImageUrl ? productWidth.value : null;

	const frameAspect = useImageAspect(productImageUrl) ?? 1;
	const logoAspect = useImageAspect(image);
	const dark = isDarkHex(darkProduct);
	const hasArt = !!image || !!text.trim() || !!text2.trim();

	const auto = useMemo(
		() =>
			autoLayout({
				logoAspect: image ? (logoAspect ?? 1) : null,
				texto: text,
				texto2: text2,
				tamanho,
				posicao,
				rotacao,
				frameAspect,
			}),
		[image, logoAspect, text, text2, tamanho, posicao, rotacao, frameAspect],
	);
	// Na tela: a caixa do aluno onde houver. Elemento novo depois que o aluno
	// já mexeu entra logo abaixo do que ele montou, sem cair por cima.
	const boxes = useMemo(() => {
		const out: PreviaLayout = {};
		let bottom = 0;
		for (const k of LAYOUT_KEYS) {
			const b = layout?.[k];
			if (auto[k] && b) bottom = Math.max(bottom, b.y + b.h / 2);
		}
		for (const k of LAYOUT_KEYS) {
			const a = auto[k];
			if (!a) continue;
			const mine = layout?.[k];
			if (mine) out[k] = mine;
			else if (layout && bottom > 0) {
				const y = Math.min(1 - a.h / 2, bottom + 0.02 + a.h / 2);
				out[k] = { ...a, y, rot: 0 };
				bottom = y + a.h / 2;
			} else out[k] = a;
		}
		return out;
	}, [auto, layout]);

	useEffect(() => {
		onResolvedLayout(boxes);
	}, [boxes, onResolvedLayout]);

	const canEdit = editable && !!productImageUrl && hasArt;
	// Mudanças em sequência (teclas) somam em cima da última, não da tela.
	const latestBoxes = useRef(boxes);
	useEffect(() => {
		latestBoxes.current = boxes;
	}, [boxes]);
	const handleBoxChange = useCallback(
		(key: LayoutKey, box: PreviaLayoutBox) => {
			latestBoxes.current = { ...latestBoxes.current, [key]: box };
			onLayoutChange(latestBoxes.current);
		},
		[onLayoutChange],
	);

	return (
		<div className="space-y-2">
			<div
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={(e) => {
					e.preventDefault();
					setDragging(false);
					const f = e.dataTransfer.files?.[0];
					if (f) void handleFile(f);
				}}
				className={`relative aspect-square w-full overflow-hidden rounded-2xl border-2 transition-colors ${
					dragging
						? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
						: hasArt || productImageUrl
							? 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/30'
							: 'border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/[0.03]'
				}`}
			>
				{productImageUrl ? (
					// A moldura tem a proporção da foto: as caixas ficam em % da
					// FOTO, o mesmo referencial que o motor usa.
					<div className="absolute inset-0 flex items-center justify-center">
						<div
							className="relative max-h-full max-w-full"
							style={{
								aspectRatio: frameAspect,
								...(frameAspect >= 1 ? { width: '100%' } : { height: '100%' }),
							}}
						>
							<img
								src={productImageUrl}
								alt={productLabel ? `Produto: ${productLabel}` : 'Produto'}
								className={`absolute inset-0 h-full w-full object-contain ${
									hasArt ? '' : 'opacity-40'
								}`}
							/>
							{hasArt && (
								<LayoutCanvas
									boxes={boxes}
									content={{ logo: image, texto: text, texto2: text2 }}
									dark={dark}
									fontFamily={fontFamily}
									editable={canEdit}
									selected={selected}
									onSelect={setSelected}
									onChange={handleBoxChange}
									productWidth={measuredWidth}
								/>
							)}
						</div>
					</div>
				) : (
					hasArt && (
						<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-8">
							{image ? (
								<img
									src={image}
									alt="Sua arte"
									// Fundo claro: arte com transparência (logo escura) some no tema escuro.
									className="max-h-[70%] max-w-[80%] rounded-xl bg-white object-contain p-4"
								/>
							) : (
								<Package
									className="h-10 w-10 text-slate-300 dark:text-slate-600"
									aria-hidden="true"
								/>
							)}
							{text.trim() && (
								<span className="max-w-full truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
									{text}
								</span>
							)}
						</div>
					)
				)}

				{!image && !hasArt && (
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-violet-500/60 rounded-2xl"
					>
						<span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/30">
							<ImagePlus className="h-6 w-6" aria-hidden="true" />
						</span>
						<span className="text-sm font-semibold text-slate-900 dark:text-white">
							{loading ? 'Carregando…' : 'Envie sua logo ou arte'}
						</span>
						<span className="text-xs text-slate-600 dark:text-gray-300">
							Arraste aqui, cole com Ctrl+V ou clique
						</span>
						<span className="text-[11px] text-slate-500 dark:text-gray-400">
							PNG, JPG ou WEBP · até 10 MB
						</span>
					</button>
				)}
			</div>

			{canEdit && (
				<LayoutToolbar
					boxes={boxes}
					selected={selected}
					onSelect={setSelected}
					onChange={handleBoxChange}
					productWidth={measuredWidth}
					manual={!!layout}
					onReset={() => {
						onLayoutChange(null);
						setSelected(null);
					}}
				/>
			)}
			{!canEdit && hasArt && productImageUrl && !editable && (
				<p className="text-xs text-slate-600 dark:text-gray-400">
					Nesta opção a posição é automática.
				</p>
			)}

			<div className="flex items-center justify-between gap-2">
				<span className="text-xs text-slate-600 dark:text-gray-400">
					{!image && hasArt ? 'Só texto — pode enviar uma imagem também.' : ''}
				</span>
				{(image || hasArt) && (
					<div className="flex shrink-0 gap-1.5">
						<button
							type="button"
							onClick={() => inputRef.current?.click()}
							className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
						>
							{image ? (
								<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
							) : (
								<ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
							)}
							{image ? 'Trocar imagem' : 'Enviar imagem'}
						</button>
						{image && (
							<button
								type="button"
								onClick={() => onImageChange(null)}
								aria-label="Remover imagem"
								className="inline-flex items-center rounded-lg border border-slate-200 dark:border-white/10 px-2 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
							>
								<X className="h-3.5 w-3.5" aria-hidden="true" />
							</button>
						)}
					</div>
				)}
			</div>

			<input
				ref={inputRef}
				type="file"
				accept={ACCEPTED_TYPES.join(',')}
				className="hidden"
				aria-label="Escolher imagem"
				onChange={(e) => {
					const f = e.target.files?.[0];
					if (f) void handleFile(f);
					e.target.value = '';
				}}
			/>
		</div>
	);
}
