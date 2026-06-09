/**
 * Geração de projetos LightBurn (.lbrn2) com a imagem de fotogravação embutida.
 * Porta o `build_lbrn2` do pipeline de referência (imagr_pipeline.py): a imagem
 * vai em base64 dentro de um `<Shape Type="Bitmap">`, com as configurações de
 * gravação (`CutSetting_Img`) calibradas pela máquina (laser, velocidade,
 * potências). Campos extra (Frequência/Q-pulse) só pra fiber/galvo/uv.
 */

export type LaserType = 'co2' | 'diode' | 'fiber' | 'galvo' | 'uv';

export interface BuildLbrn2Args {
	/** PNG retornado pelo motor, com ou sem o prefixo `data:image/png;base64,`. */
	pngBase64: string;
	widthMm: number;
	heightMm: number;
	dpi: number;
	laser: LaserType;
	speed: number;
	minPower: number;
	maxPower: number;
	/** kHz — só usado em fiber/galvo/uv (gravado como Hz: freqKhz*1000). */
	freqKhz?: number;
	/** µs — só usado em fiber/galvo/uv. */
	qPulseUs?: number;
}

/** Arredonda como o pipeline (round half a `n` casas), sem zeros à toa. */
function round(value: number, decimals: number): number {
	const f = 10 ** decimals;
	return Math.round(value * f) / f;
}

/** Remove o prefixo `data:image/png;base64,` se presente — o .lbrn2 quer só o b64. */
function stripDataUrlPrefix(b64: string): string {
	const comma = b64.indexOf(',');
	return b64.startsWith('data:') && comma !== -1 ? b64.slice(comma + 1) : b64;
}

export function buildLbrn2({
	pngBase64,
	widthMm,
	heightMm,
	dpi,
	laser,
	speed,
	minPower,
	maxPower,
	freqKhz,
	qPulseUs,
}: BuildLbrn2Args): string {
	const b64 = stripDataUrlPrefix(pngBase64);
	const interval = round(25.4 / dpi, 4);
	const wMm = round(widthMm, 3);
	const hMm = round(heightMm, 3);
	const cx = round(widthMm / 2, 3);
	const cy = round(heightMm / 2, 3);

	let extra = '';
	if (laser === 'fiber' || laser === 'galvo' || laser === 'uv') {
		if (freqKhz !== undefined) {
			extra += `        <frequency Value="${Math.trunc(freqKhz) * 1000}"/>\n`;
		}
		if (qPulseUs !== undefined) {
			extra += `        <QPulseWidth Value="${qPulseUs}"/>\n`;
		}
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<LightBurnProject AppVersion="1.0.0" FormatVersion="1" MaterialHeight="0" MirrorX="True" MirrorY="True">
    <CutSetting_Img type="Image">
        <index Value="0"/>
        <name Value="C00"/>
        <minPower Value="${minPower}"/>
        <maxPower Value="${maxPower}"/>
        <maxPower2 Value="20"/>
        <speed Value="${speed}"/>
        <interval Value="${interval}"/>
        <ditherMode Value="threshold"/>
        <dpi Value="${dpi}"/>
        <passThrough Value="1"/>
${extra}    </CutSetting_Img>
    <Shape Type="Bitmap" CutIndex="0" W="${wMm}" H="${hMm}" Gamma="1" Data="${b64}">
        <XForm>1 0 0 1 ${cx} ${cy}</XForm>
    </Shape>
    <Notes ShowOnLoad="0" Notes=""/>
</LightBurnProject>
`;
}

/** Dispara o download do .lbrn2 (Blob). */
export function downloadLbrn2(filename: string, xml: string): void {
	const name = filename.toLowerCase().endsWith('.lbrn2')
		? filename
		: `${filename}.lbrn2`;
	const blob = new Blob([xml], { type: 'application/xml' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = name;
	a.click();
	URL.revokeObjectURL(url);
}
