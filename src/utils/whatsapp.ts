/**
 * Normaliza um telefone BR para o número do link wa.me (só dígitos, com DDI 55).
 * Trata o caso ambíguo do DDD 55 (RS) pela quantidade de dígitos: um número
 * nacional tem 10 (fixo) ou 11 (celular) dígitos; com DDI fica 12 ou 13.
 *
 *   "(11) 99999-9999"      → "5511999999999"
 *   "55 11 99999-9999"     → "5511999999999" (já tinha DDI)
 *   "(55) 99999-9999" (RS) → "5555999999999"
 */
export function toWhatsappNumber(raw: string | null | undefined): string {
	const d = (raw ?? '').replace(/\D/g, '').replace(/^0+/, '');
	if (!d) return '';
	// Já tem DDI 55 = 55 + 10/11 dígitos nacionais.
	if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return d;
	// Número nacional (10 fixo / 11 celular) → prefixa o DDI.
	if (d.length === 10 || d.length === 11) return `55${d}`;
	return d; // fallback: usa como veio
}

/** Link wa.me pronto pro telefone (ou string vazia se não houver dígitos). */
export function whatsappLink(raw: string | null | undefined): string {
	const n = toWhatsappNumber(raw);
	return n ? `https://wa.me/${n}` : '';
}
