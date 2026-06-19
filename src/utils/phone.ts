/**
 * Normaliza um telefone para o formato E.164 exigido pela API (ex.: +5511999998888).
 * Aceita entradas "soltas" e tenta inferir o número correto:
 *
 *   "15 99604 5512"       → "+5515996045512"  (celular BR, prefixa DDI 55)
 *   "(11) 99999-9999"     → "+5511999999999"
 *   "55 11 99999-9999"    → "+5511999999999"  (já tinha DDI)
 *   "+351 900 000 000"    → "+351900000000"   (já em E.164, só limpa)
 *
 * Trata o caso ambíguo do DDD 55 (RS) pela quantidade de dígitos: um número
 * nacional BR tem 10 (fixo) ou 11 (celular) dígitos; com DDI fica 12 ou 13.
 */
export function toE164(raw: string | null | undefined): string {
	const trimmed = (raw ?? '').trim();
	if (!trimmed) return '';

	// Já veio em E.164 (com +): preserva o + e remove qualquer formatação.
	if (trimmed.startsWith('+')) {
		const digits = trimmed.slice(1).replace(/\D/g, '');
		return digits ? `+${digits}` : '';
	}

	const d = trimmed.replace(/\D/g, '').replace(/^0+/, '');
	if (!d) return '';

	// Já tem DDI 55 = 55 + 10/11 dígitos nacionais.
	if (d.startsWith('55') && (d.length === 12 || d.length === 13))
		return `+${d}`;
	// Número nacional BR (10 fixo / 11 celular) → prefixa o DDI 55.
	if (d.length === 10 || d.length === 11) return `+55${d}`;
	// Fallback: assume que os dígitos já incluem o DDI.
	return `+${d}`;
}
