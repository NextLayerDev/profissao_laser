'use client';

import { useEffect, useState } from 'react';
import { VectorViewport } from '@/modules/tools/components/viewport/vector-viewport';
import { mm } from '../services/public-quote.service';

/**
 * Prévia do desenho na página pública.
 *
 * DOIS CASOS, e eles são honestamente diferentes:
 *
 * 1. SVG — dá para mostrar o desenho de verdade, porque ele já é o desenho.
 * 2. DXF — NÃO dá. `vector-viewport.tsx` diz na primeira linha que DXF nunca é
 *    lido no navegador, e é a decisão certa: parsear DXF aqui seria
 *    reimplementar o leitor do servidor com metade da informação e o dobro dos
 *    bugs. Em troca desenhamos o ENVELOPE — o retângulo do tamanho real que o
 *    servidor mediu — e dizemos, com todas as letras, que é o contorno externo
 *    e não o desenho. Fingir uma prévia seria pior do que não ter.
 *
 * SEGURANÇA (o ponto que decide o desenho deste arquivo): o SVG do visitante é
 * entregue ao `VectorViewport` como `data:` URL, e não como markup inline. O
 * viewport tem dois caminhos — `data:` cai num `<img src>`, o resto cai num
 * `dangerouslySetInnerHTML`. `<img>` renderiza SVG no modo estático seguro do
 * browser: sem script, sem `<foreignObject>` ativo, sem carregar nada de fora.
 * É garantia do navegador, não do meu regex. Um arquivo hostil que alguém
 * convença o visitante a subir não executa nada no NOSSO domínio.
 */

interface Props {
	/** Arquivo escolhido pelo visitante. */
	arquivo: File | null;
	/** Dimensões reais medidas pelo SERVIDOR — só existem depois do preço. */
	larguraMm?: number;
	alturaMm?: number;
	/** Acento do link, para o envelope não sair cinza. */
	cor: string;
}

const MAX_SVG_PREVIEW_BYTES = 4 * 1024 * 1024;

/** UTF-8 → base64 em blocos: `String.fromCharCode(...bytes)` estoura a pilha. */
function base64Utf8(texto: string): string {
	const bytes = new TextEncoder().encode(texto);
	let bin = '';
	for (let i = 0; i < bytes.length; i += 0x8000) {
		bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	}
	return btoa(bin);
}

/**
 * Largura do `viewBox`, para converter unidade de tela em milímetro e a régua
 * do viewport dizer a verdade. Regex no cabeçalho, sem DOM: montar um
 * `DOMParser` aqui seria criar exatamente a superfície que o `<img>` evita.
 */
function larguraDoViewBox(texto: string): number | null {
	const m =
		/viewBox\s*=\s*["']\s*([-\d.eE+]+[\s,]+[-\d.eE+]+[\s,]+[-\d.eE+]+[\s,]+[-\d.eE+]+)\s*["']/.exec(
			texto.slice(0, 8_000),
		);
	if (!m) return null;
	const partes = m[1].split(/[\s,]+/).map(Number);
	return partes.length === 4 && partes[2] > 0 ? partes[2] : null;
}

/** Envelope do DXF: markup NOSSO, gerado a partir de números do servidor. */
function svgEnvelope(w: number, h: number, cor: string): string {
	const pad = Math.max(w, h) * 0.08;
	const vb = `${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}`;
	const traco = Math.max(w, h) / 240;
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="100%" height="100%">`,
		`<rect x="0" y="0" width="${w}" height="${h}" fill="${cor}" fill-opacity="0.08" stroke="${cor}" stroke-width="${traco}" stroke-dasharray="${traco * 6} ${traco * 4}" />`,
		`<line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="${cor}" stroke-width="${traco / 2}" stroke-opacity="0.35" />`,
		`<line x1="${w / 2}" y1="0" x2="${w / 2}" y2="${h}" stroke="${cor}" stroke-width="${traco / 2}" stroke-opacity="0.35" />`,
		'</svg>',
	].join('');
}

export function QuotePreview({ arquivo, larguraMm, alturaMm, cor }: Props) {
	const [svgDoVisitante, setSvgDoVisitante] = useState<string | null>(null);
	const [unidadesPorMm, setUnidadesPorMm] = useState<number | null>(null);
	const [larguraViewBox, setLarguraViewBox] = useState<number | null>(null);

	const ehSvg = arquivo?.name.toLowerCase().endsWith('.svg') ?? false;

	// Lê o SVG do visitante uma vez por arquivo. `cancelado` evita que a leitura
	// de um arquivo trocado no meio do caminho sobrescreva o atual.
	useEffect(() => {
		setSvgDoVisitante(null);
		setLarguraViewBox(null);
		if (!arquivo || !ehSvg || arquivo.size > MAX_SVG_PREVIEW_BYTES) return;

		let cancelado = false;
		arquivo
			.text()
			.then((texto) => {
				if (cancelado) return;
				setLarguraViewBox(larguraDoViewBox(texto));
				setSvgDoVisitante(`data:image/svg+xml;base64,${base64Utf8(texto)}`);
			})
			.catch(() => {
				// Arquivo ilegível no browser não é erro do fluxo: quem decide se o
				// arquivo presta é o servidor. Aqui só não há prévia.
				if (!cancelado) setSvgDoVisitante(null);
			});
		return () => {
			cancelado = true;
		};
	}, [arquivo, ehSvg]);

	// A régua só aparece quando os DOIS lados existem: as unidades do viewBox
	// (do arquivo) e o tamanho em mm (do servidor). Antes do preço, não há mm.
	useEffect(() => {
		setUnidadesPorMm(
			larguraViewBox && larguraMm && larguraMm > 0
				? larguraViewBox / larguraMm
				: null,
		);
	}, [larguraViewBox, larguraMm]);

	const temMedidas = Boolean(larguraMm && alturaMm);

	if (svgDoVisitante) {
		return (
			<figure className="space-y-2">
				<VectorViewport
					svg={svgDoVisitante}
					unitsPerMm={unidadesPorMm ?? undefined}
					widthMm={larguraMm}
					heightMm={alturaMm}
				/>
				<figcaption className="text-xs text-slate-500 dark:text-slate-400">
					Seu arquivo, como o navegador o enxerga. Arraste para mover e use os
					botões para aproximar.
				</figcaption>
			</figure>
		);
	}

	if (temMedidas && larguraMm && alturaMm) {
		return (
			<figure className="space-y-2">
				<VectorViewport
					svg={svgEnvelope(larguraMm, alturaMm, cor)}
					unitsPerMm={1}
					widthMm={larguraMm}
					heightMm={alturaMm}
				/>
				<figcaption className="text-xs text-slate-500 dark:text-slate-400">
					Este é o <strong>espaço que o seu desenho ocupa</strong> —{' '}
					{mm(larguraMm)} × {mm(alturaMm)} mm —, medido a partir do arquivo que
					você enviou. Não é o desenho em si: arquivos DXF são lidos no
					servidor, não no navegador.
				</figcaption>
			</figure>
		);
	}

	return null;
}
