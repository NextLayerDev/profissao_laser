'use client';

import { ImagePlus, Package, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export const ACCEPTED_TYPES = [
	'image/png',
	'image/jpeg',
	'image/jpg',
	'image/webp',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGE_DIM = 1024;
const JPEG_QUALITY = 0.7;

function compressImage(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new window.Image();
		img.onload = () => {
			let { width, height } = img;
			if (width > MAX_IMAGE_DIM || height > MAX_IMAGE_DIM) {
				const ratio = Math.min(MAX_IMAGE_DIM / width, MAX_IMAGE_DIM / height);
				width = Math.round(width * ratio);
				height = Math.round(height * ratio);
			}
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				reject(new Error('Canvas not supported'));
				return;
			}
			ctx.drawImage(img, 0, 0, width, height);
			resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
		};
		img.onerror = reject;
		img.src = URL.createObjectURL(file);
	});
}

/* ─────────── Onde a arte cai no produto (só a prévia local) ─────────── */

/** Largura da arte em % da foto do produto, por `tamanho`. */
const WIDTH_BY_SIZE: Record<string, number> = {
	pequeno: 22,
	medio: 34,
	grande: 48,
	custom: 34,
};

/** Centro da arte (left/top em %) por `posicao`. */
const CENTER_BY_POSITION: Record<string, { left: number; top: number }> = {
	central: { left: 50, top: 52 },
	superior: { left: 50, top: 34 },
	inferior: { left: 50, top: 68 },
	lateral: { left: 36, top: 52 },
	'envolvente-360': { left: 50, top: 52 },
};

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

/**
 * Área principal da Prévia: recebe a imagem (soltar, colar ou clicar) e já
 * mostra a arte posicionada sobre a foto do produto escolhido. É uma prévia
 * aproximada no navegador — a foto final quem faz é a IA.
 */
export function PreviaImageStage({
	image,
	onImageChange,
	productImageUrl,
	productLabel,
	darkProduct,
	text,
	tamanho,
	posicao,
	rotacao,
}: {
	image: string | null;
	onImageChange: (dataUrl: string | null) => void;
	productImageUrl: string | null;
	productLabel: string | null;
	darkProduct: string | null;
	text: string;
	tamanho: string;
	posicao: string;
	rotacao: number;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [dragging, setDragging] = useState(false);
	const [loading, setLoading] = useState(false);

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

	const width =
		posicao === 'envolvente-360' ? 70 : (WIDTH_BY_SIZE[tamanho] ?? 34);
	const center = CENTER_BY_POSITION[posicao] ?? CENTER_BY_POSITION.central;
	const dark = isDarkHex(darkProduct);
	const hasArt = !!image || !!text.trim();

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
						: image
							? 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/30'
							: 'border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/[0.03]'
				}`}
			>
				{productImageUrl ? (
					<img
						src={productImageUrl}
						alt={productLabel ? `Produto: ${productLabel}` : 'Produto'}
						className={`absolute inset-0 h-full w-full object-cover ${
							hasArt ? '' : 'opacity-40'
						}`}
					/>
				) : (
					image && (
						<div className="absolute inset-0 flex items-center justify-center">
							<Package
								className="h-10 w-10 text-slate-300 dark:text-slate-600"
								aria-hidden="true"
							/>
						</div>
					)
				)}

				{hasArt && (
					<div
						className="absolute flex flex-col items-center gap-1 pointer-events-none"
						style={{
							left: `${center.left}%`,
							top: `${center.top}%`,
							width: `${width}%`,
							transform: `translate(-50%, -50%) rotate(${rotacao || 0}deg)`,
							// A mistura fica na camada inteira: o `transform` isola o
							// contexto, então na <img> ela não enxergaria o produto.
							...(productImageUrl
								? { mixBlendMode: dark ? 'screen' : 'multiply', opacity: 0.85 }
								: {}),
						}}
					>
						{image && (
							<img
								src={image}
								alt="Sua arte posicionada no produto"
								className="w-full h-auto"
								style={
									productImageUrl
										? {
												filter: dark
													? 'grayscale(1) invert(1) contrast(1.4)'
													: 'grayscale(1) contrast(1.3)',
											}
										: undefined
								}
							/>
						)}
						{text.trim() && (
							<span
								className={`max-w-[160%] truncate text-center text-[clamp(10px,3.2cqw,18px)] font-semibold ${
									productImageUrl
										? dark
											? 'text-slate-100/90'
											: 'text-slate-900/80'
										: 'text-slate-700 dark:text-slate-200'
								}`}
							>
								{text}
							</span>
						)}
					</div>
				)}

				{!image && (
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

			{image ? (
				<div className="flex items-center justify-between gap-2">
					<p className="text-xs text-slate-600 dark:text-gray-400">
						Posição aproximada — a IA faz a foto final.
					</p>
					<div className="flex shrink-0 gap-1.5">
						<button
							type="button"
							onClick={() => inputRef.current?.click()}
							className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
						>
							<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
							Trocar imagem
						</button>
						<button
							type="button"
							onClick={() => onImageChange(null)}
							aria-label="Remover imagem"
							className="inline-flex items-center rounded-lg border border-slate-200 dark:border-white/10 px-2 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
						>
							<X className="h-3.5 w-3.5" aria-hidden="true" />
						</button>
					</div>
				</div>
			) : null}

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
