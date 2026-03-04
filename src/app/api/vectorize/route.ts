import { NextResponse } from 'next/server';
import sharp from 'sharp';

const VECTORIZER_AI_URL = 'https://vectorizer.ai/api/v1/vectorize';
const NEXTLAYER_URL = 'https://nextlayer.dev/api/vectorize';

async function isImageColor(imageBuffer: Buffer): Promise<boolean> {
	try {
		const stats = await sharp(imageBuffer).stats();
		if (stats.channels.length < 3) {
			return false;
		}
		const [r, g, b] = stats.channels.map((c) => c.stdev);
		const tolerance = 1;
		const isGrayscale =
			Math.abs(r - g) < tolerance &&
			Math.abs(r - b) < tolerance &&
			Math.abs(g - b) < tolerance;
		return !isGrayscale;
	} catch (error) {
		console.error('Erro ao analisar a imagem com sharp:', error);
		return true;
	}
}

async function vectorizeWithVectorizerAI(
	imageBuffer: Buffer,
	filename: string,
): Promise<string> {
	const keyId = process.env.VECTORIZER_AI_API_KEY_ID;
	const secretKey = process.env.VECTORIZER_AI_API_SECRET_KEY;
	if (!keyId || !secretKey) {
		throw new Error(
			'VECTORIZER_AI_API_KEY_ID e VECTORIZER_AI_API_SECRET_KEY são obrigatórios',
		);
	}

	const authString = Buffer.from(`${keyId}:${secretKey}`).toString('base64');
	const formData = new FormData();
	formData.append('image', new Blob([new Uint8Array(imageBuffer)]), filename);
	formData.append('output.file_format', 'svg');
	formData.append('output.svg.version', 'svg_1_1');

	const response = await fetch(VECTORIZER_AI_URL, {
		method: 'POST',
		headers: { Authorization: `Basic ${authString}` },
		body: formData,
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Vectorizer.AI erro ${response.status}: ${text}`);
	}
	return response.text();
}

async function vectorizeWithNextLayer(
	imageBuffer: Buffer,
	filename: string,
): Promise<string> {
	const formData = new FormData();
	formData.append('file', new Blob([new Uint8Array(imageBuffer)]), filename);
	formData.append('turdsize', '2');

	const response = await fetch(NEXTLAYER_URL, {
		method: 'POST',
		body: formData,
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`NextLayer API erro ${response.status}: ${text}`);
	}
	return response.text();
}

export async function POST(request: Request) {
	try {
		const formData = await request.formData();
		const image = formData.get('image');
		if (!image || !(image instanceof File)) {
			return NextResponse.json(
				{ error: 'Campo image (File) é obrigatório' },
				{ status: 400 },
			);
		}

		const buffer = Buffer.from(await image.arrayBuffer());
		const filename = image.name || 'image.png';

		const isColor = await isImageColor(buffer);
		const svgContent = isColor
			? await vectorizeWithVectorizerAI(buffer, filename)
			: await vectorizeWithNextLayer(buffer, filename);

		return NextResponse.json({
			svgContent,
			originalName: filename,
			isColor,
		});
	} catch (error) {
		console.error('Erro na vetorização:', error);
		const message =
			error instanceof Error ? error.message : 'Erro ao vetorizar';
		return NextResponse.json({ error: message }, { status: 502 });
	}
}
