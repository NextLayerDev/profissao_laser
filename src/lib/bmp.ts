/**
 * Codificador BMP (8-bit, paleta de cinza), client-side. Exporta a imagem de
 * gravação num formato que o EZCAD (controladoras JCZ — fiber/galvo/UV) e
 * qualquer software de marcação importam nativamente. BMP não tem compressão,
 * mas é o mais compatível com EZCAD (inclusive versões antigas).
 */

/** Codifica pixels em cinza (1 byte/px, top-down) como BMP 8-bit (bottom-up). */
export function encodeGrayscaleBmp(
	width: number,
	height: number,
	gray: Uint8Array,
	dpi = 254,
): Uint8Array {
	const rowSize = (width + 3) & ~3; // linhas alinhadas a 4 bytes
	const pixelArraySize = rowSize * height;
	const paletteSize = 256 * 4;
	const dataOffset = 14 + 40 + paletteSize;
	const fileSize = dataOffset + pixelArraySize;
	const ppm = Math.round(dpi / 0.0254); // px por metro (resolução embutida)

	const buf = new Uint8Array(fileSize);
	const dv = new DataView(buf.buffer);
	// BITMAPFILEHEADER (14 bytes)
	buf[0] = 0x42; // 'B'
	buf[1] = 0x4d; // 'M'
	dv.setUint32(2, fileSize, true);
	dv.setUint32(10, dataOffset, true);
	// BITMAPINFOHEADER (40 bytes)
	dv.setUint32(14, 40, true);
	dv.setInt32(18, width, true);
	dv.setInt32(22, height, true); // positivo = bottom-up
	dv.setUint16(26, 1, true); // planes
	dv.setUint16(28, 8, true); // bits por pixel
	dv.setUint32(30, 0, true); // BI_RGB (sem compressão)
	dv.setUint32(34, pixelArraySize, true);
	dv.setInt32(38, ppm, true); // px/m horizontal
	dv.setInt32(42, ppm, true); // px/m vertical
	dv.setUint32(46, 256, true); // cores na paleta
	dv.setUint32(50, 0, true);
	// Paleta de cinza (256 entradas BGRA).
	let p = 54;
	for (let i = 0; i < 256; i++) {
		buf[p] = i;
		buf[p + 1] = i;
		buf[p + 2] = i;
		buf[p + 3] = 0;
		p += 4;
	}
	// Pixels, de baixo pra cima (formato BMP).
	for (let y = 0; y < height; y++) {
		const src = (height - 1 - y) * width;
		const dst = dataOffset + y * rowSize;
		for (let x = 0; x < width; x++) buf[dst + x] = gray[src + x];
		// bytes de padding já são 0
	}
	return buf;
}

/** Carrega o PNG (data URL) e extrai os pixels em cinza (canal R = G = B). */
export async function loadGrayFromPng(
	pngBase64: string,
): Promise<{ width: number; height: number; gray: Uint8Array }> {
	const img = new window.Image();
	await new Promise<void>((resolve, reject) => {
		img.onload = () => resolve();
		img.onerror = () => reject(new Error('Falha ao carregar a imagem'));
		img.src = pngBase64;
	});
	const width = img.naturalWidth;
	const height = img.naturalHeight;
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas indisponível');
	ctx.drawImage(img, 0, 0);
	const { data } = ctx.getImageData(0, 0, width, height);
	const gray = new Uint8Array(width * height);
	for (let i = 0, j = 0; j < gray.length; i += 4, j++) gray[j] = data[i];
	return { width, height, gray };
}

/** Gera o BMP a partir do PNG base64 e dispara o download. */
export async function downloadBmpFromPng(
	filename: string,
	pngBase64: string,
	dpi = 254,
): Promise<void> {
	const { width, height, gray } = await loadGrayFromPng(pngBase64);
	const bmp = encodeGrayscaleBmp(width, height, gray, dpi);
	const name = filename.toLowerCase().endsWith('.bmp')
		? filename
		: `${filename}.bmp`;
	const blob = new Blob([bmp.buffer as ArrayBuffer], { type: 'image/bmp' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = name;
	a.click();
	URL.revokeObjectURL(url);
}
