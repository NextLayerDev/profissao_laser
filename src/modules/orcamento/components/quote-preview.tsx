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

/**
 * O ENVELOPE — a ficha da peça quando o arquivo é DXF.
 *
 * ┌─ POR QUE ISTO DEIXOU DE SER UM VIEWPORT ────────────────────────────────┐
 * │ O envelope já foi desenhado dentro do `VectorViewport`, com pan, zoom e  │
 * │ régua. Medido na página real: um retângulo tracejado minúsculo perdido   │
 * │ no meio de ~450 px de área escura, com a legenda "não é o desenho em     │
 * │ si". Para o cliente final — que abriu um link no celular e não sabe o    │
 * │ que é DXF — aquilo lia como página quebrada, bem no meio da proposta.    │
 * │                                                                          │
 * │ Pan e zoom não servem para um retângulo: não há detalhe para aproximar.  │
 * │ Então ele virou o que sempre foi de fato — uma FICHA: o retângulo na     │
 * │ proporção certa, do tamanho de um cartão, com as medidas escritas ao     │
 * │ lado. Continua sendo markup NOSSO, gerado dos números do SERVIDOR;       │
 * │ nada do arquivo do visitante entra aqui.                                 │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
function EnvelopeDaPeca({
	larguraMm,
	alturaMm,
	cor,
}: {
	larguraMm: number;
	alturaMm: number;
	cor: string;
}) {
	// A proporção é real; o tamanho na tela, não. Uma peça de 1310 × 150 mm
	// desenhada "em escala" numa caixa quadrada vira um risco no vazio.
	const razao = larguraMm / alturaMm;
	const deitada = razao >= 1;
	const larguraPct = deitada ? 100 : Math.max(14, razao * 100);
	const alturaPct = deitada ? Math.max(14, (1 / razao) * 100) : 100;

	return (
		<div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
			<div className="flex h-24 w-28 shrink-0 items-center justify-center">
				<div
					className="rounded-[3px]"
					style={{
						width: `${larguraPct}%`,
						height: `${alturaPct}%`,
						border: `2px dashed ${cor}`,
						background: `color-mix(in srgb, ${cor} 10%, transparent)`,
					}}
				/>
			</div>
			<div className="min-w-0">
				<p className="font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
					{mm(larguraMm)} × {mm(alturaMm)} mm
				</p>
				<p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
					É o espaço que a sua peça ocupa, medido no arquivo que você enviou. O
					desenho em si é lido no servidor.
				</p>
			</div>
		</div>
	);
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
			<EnvelopeDaPeca larguraMm={larguraMm} alturaMm={alturaMm} cor={cor} />
		);
	}

	return null;
}
