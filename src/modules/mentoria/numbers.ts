// Números digitados no padrão BR. `<input type="number">` lia '1.500' (mil e
// quinhentos) como 1.5 e, no Firefox, esvaziava '1500,50' em silêncio — por
// isso os campos de valor viram texto e passam por este parser.

/**
 * '1.500' → 1500, '1.500,50' → 1500.5, '1500,5' → 1500.5, '12.5' → 12.5.
 * Com vírgula, os pontos são milhar; sem vírgula, só é milhar quando os grupos
 * depois do ponto têm 3 dígitos. Vazio ou inválido → null.
 */
export function parseBrNumber(raw: string): number | null {
	const t = raw.replace(/R\$|\s/g, '');
	if (t === '') return null;
	let norm = t;
	if (t.includes(',')) norm = t.replace(/\./g, '').replace(',', '.');
	else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) norm = t.replace(/\./g, '');
	if (!/^-?\d*\.?\d+$/.test(norm)) return null;
	const n = Number(norm);
	return Number.isFinite(n) ? n : null;
}

/** Texto inicial de um campo a partir do número salvo (volta no parser). */
export function formatBrNumber(value: unknown): string {
	if (typeof value !== 'number' || !Number.isFinite(value)) return '';
	return value.toLocaleString('pt-BR', { maximumFractionDigits: 6 });
}
