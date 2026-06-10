/**
 * CPF: máscara e validação (dígitos verificadores) — espelha a validação do
 * backend (api-upvox src/lib/cpf.ts) pro erro aparecer antes do submit.
 */

/** Aplica a máscara 000.000.000-00 conforme digita. */
export function maskCpf(input: string): string {
	const d = input.replace(/\D/g, '').slice(0, 11);
	if (d.length <= 3) return d;
	if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
	if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
	return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Remove tudo que não é dígito; retorna os 11 dígitos ou null. */
export function normalizeCpf(input: string): string | null {
	const digits = input.replace(/\D/g, '');
	return digits.length === 11 ? digits : null;
}

function checkDigit(digits: string, length: number): number {
	let sum = 0;
	for (let i = 0; i < length; i++) {
		sum += Number(digits[i]) * (length + 1 - i);
	}
	const rest = (sum * 10) % 11;
	return rest === 10 ? 0 : rest;
}

/** Valida um CPF (aceita com ou sem máscara). */
export function isValidCpf(input: string): boolean {
	const cpf = normalizeCpf(input);
	if (!cpf) return false;
	if (/^(\d)\1{10}$/.test(cpf)) return false;
	return (
		checkDigit(cpf, 9) === Number(cpf[9]) &&
		checkDigit(cpf, 10) === Number(cpf[10])
	);
}
