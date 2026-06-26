/**
 * Download de um anexo de imagem do chat de vetorização em SVG ou PNG.
 *
 * O anexo vem de um CDN (URL). Pode ser um SVG (resultado da vetorização) ou um
 * raster (PNG/JPG/etc). Os dois botões funcionam em ambos os casos:
 *  - SVG  : se a origem é SVG, baixa o arquivo; se é raster, embute o raster num
 *           wrapper <svg><image/></svg> (SVG válido com a imagem dentro).
 *  - PNG  : se a origem é raster PNG, baixa direto; se é outro raster, reencoda
 *           via canvas; se é SVG, rasteriza via canvas.
 *
 * Tudo passa por `fetch` → blob URL (mesma origem) antes de ir pro canvas, então
 * o canvas NÃO é "tainted" (sem SecurityError no toBlob). Se o fetch falhar
 * (CORS/offline), cai pro fallback de abrir a URL em nova aba.
 */

export interface DownloadableFile {
	fileUrl: string;
	fileName?: string;
	fileType?: string;
}

function triggerDownload(url: string, fileName: string, revoke: boolean) {
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	a.remove();
	if (revoke) setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function baseName(name: string | undefined, fallback = 'vetor') {
	const b = (name ?? '').replace(/\.[^.]+$/, '').trim();
	return b || fallback;
}

export function isSvgFile(file: DownloadableFile): boolean {
	if ((file.fileType ?? '').toLowerCase().includes('svg')) return true;
	const target = (file.fileName || file.fileUrl).toLowerCase().split('?')[0];
	return target.endsWith('.svg');
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error('image load failed'));
		img.src = src;
	});
}

async function fetchBlob(url: string): Promise<Blob> {
	const res = await fetch(url, { mode: 'cors' });
	if (!res.ok) throw new Error(`fetch ${res.status}`);
	return res.blob();
}

function blobToDataUrl(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const r = new FileReader();
		r.onload = () => resolve(r.result as string);
		r.onerror = () => reject(new Error('read failed'));
		r.readAsDataURL(blob);
	});
}

/** Tamanho em px de um SVG (width/height, senão viewBox), com upscale p/ nitidez. */
function svgPixelSize(svgText: string): { w: number; h: number } {
	let w = 0;
	let h = 0;
	const wM = svgText.match(/\bwidth="([\d.]+)(?:px)?"/i);
	const hM = svgText.match(/\bheight="([\d.]+)(?:px)?"/i);
	if (wM) w = Number.parseFloat(wM[1]);
	if (hM) h = Number.parseFloat(hM[1]);
	if (!w || !h) {
		const vb = svgText.match(
			/viewBox="\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)"/i,
		);
		if (vb) {
			w = Number.parseFloat(vb[1]);
			h = Number.parseFloat(vb[2]);
		}
	}
	if (!w || !h) {
		w = 1024;
		h = 1024;
	}
	const max = Math.max(w, h);
	const TARGET = 1600;
	if (max < TARGET) {
		const s = TARGET / max;
		w *= s;
		h *= s;
	}
	const CAP = 4096;
	if (Math.max(w, h) > CAP) {
		const s = CAP / Math.max(w, h);
		w *= s;
		h *= s;
	}
	return { w: Math.round(w), h: Math.round(h) };
}

function canvasToPng(
	canvas: HTMLCanvasElement,
	fileName: string,
): Promise<void> {
	return new Promise((resolve) => {
		canvas.toBlob((blob) => {
			if (blob) {
				triggerDownload(URL.createObjectURL(blob), fileName, true);
			} else {
				triggerDownload(canvas.toDataURL('image/png'), fileName, false);
			}
			resolve();
		}, 'image/png');
	});
}

/** Baixa o anexo como .svg (origem SVG → direto; raster → embutido num <svg>). */
export async function downloadFileAsSvg(file: DownloadableFile): Promise<void> {
	const name = baseName(file.fileName);
	try {
		const blob = await fetchBlob(file.fileUrl);
		if (isSvgFile(file)) {
			triggerDownload(URL.createObjectURL(blob), `${name}.svg`, true);
			return;
		}
		const dataUrl = await blobToDataUrl(blob);
		const objUrl = URL.createObjectURL(blob);
		let w = 1024;
		let h = 1024;
		try {
			const img = await loadImage(objUrl);
			w = img.naturalWidth || w;
			h = img.naturalHeight || h;
		} finally {
			URL.revokeObjectURL(objUrl);
		}
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><image href="${dataUrl}" width="${w}" height="${h}"/></svg>`;
		const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
		triggerDownload(URL.createObjectURL(svgBlob), `${name}.svg`, true);
	} catch {
		window.open(file.fileUrl, '_blank');
	}
}

/** Baixa o anexo como .png (raster PNG → direto; outro raster/SVG → via canvas). */
export async function downloadFileAsPng(file: DownloadableFile): Promise<void> {
	const name = baseName(file.fileName);
	try {
		if (isSvgFile(file)) {
			const res = await fetch(file.fileUrl, { mode: 'cors' });
			if (!res.ok) throw new Error(`fetch ${res.status}`);
			const svgText = await res.text();
			const { w, h } = svgPixelSize(svgText);
			const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
			const objUrl = URL.createObjectURL(svgBlob);
			try {
				const img = await loadImage(objUrl);
				const canvas = document.createElement('canvas');
				canvas.width = w;
				canvas.height = h;
				const ctx = canvas.getContext('2d');
				if (!ctx) throw new Error('no ctx');
				ctx.drawImage(img, 0, 0, w, h);
				await canvasToPng(canvas, `${name}.png`);
			} finally {
				URL.revokeObjectURL(objUrl);
			}
			return;
		}

		const blob = await fetchBlob(file.fileUrl);
		const target = (file.fileName || file.fileUrl).toLowerCase().split('?')[0];
		const isPng =
			(file.fileType ?? '').toLowerCase().includes('png') ||
			target.endsWith('.png');
		if (isPng) {
			triggerDownload(URL.createObjectURL(blob), `${name}.png`, true);
			return;
		}
		// jpg/webp/gif → reencoda p/ PNG (blob URL evita taint do canvas)
		const objUrl = URL.createObjectURL(blob);
		try {
			const img = await loadImage(objUrl);
			const canvas = document.createElement('canvas');
			canvas.width = img.naturalWidth || 1024;
			canvas.height = img.naturalHeight || 1024;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('no ctx');
			ctx.drawImage(img, 0, 0);
			await canvasToPng(canvas, `${name}.png`);
		} finally {
			URL.revokeObjectURL(objUrl);
		}
	} catch {
		window.open(file.fileUrl, '_blank');
	}
}
