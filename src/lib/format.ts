/**
 * Formata um valor de voxxys em pt-BR, com até 2 casas decimais e sem zeros à
 * direita: 0.3 → "0,3", 5 → "5", 2.5 → "2,5", 29.7 → "29,7".
 */
export function formatVox(n: number): string {
	return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(
		Number.isFinite(n) ? n : 0,
	);
}

/**
 * Converte um valor digitado de voxxys (aceita vírgula OU ponto) em número >= 0,
 * arredondado a 2 casas. Entrada inválida → 0.
 */
export function parseVox(input: string): number {
	const n = Number.parseFloat(String(input).replace(',', '.'));
	return Number.isFinite(n) ? Math.max(0, Math.round(n * 100) / 100) : 0;
}
