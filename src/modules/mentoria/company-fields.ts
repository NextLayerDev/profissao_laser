// Máscaras e validação do cadastro da empresa (Configurações da Mentoria).
//
// A API só confere o formato básico (14 dígitos, telefone com DDD, site
// http(s), @usuario) para não travar quem já tinha salvo texto livre; o
// dígito verificador do CNPJ e as máscaras ficam aqui.

const digits = (v: string) => v.replace(/\D/g, '');

/** Dígitos do telefone sem o +55 (salvo antes com o código do país). */
const phoneDigits = (v: string) => {
	const d = digits(v);
	return d.length > 11 && d.startsWith('55') ? d.slice(2) : d;
};

/** 00.000.000/0000-00 conforme digita (até 14 dígitos). */
export function maskCnpj(raw: string): string {
	const d = digits(raw).slice(0, 14);
	return d
		.replace(/^(\d{2})(\d)/, '$1.$2')
		.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
		.replace(/\.(\d{3})(\d)/, '.$1/$2')
		.replace(/(\d{4})(\d)/, '$1-$2');
}

/** CNPJ com os dois dígitos verificadores certos (repetidos são inválidos). */
export function isValidCnpj(raw: string): boolean {
	const d = digits(raw);
	if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
	const nums = d.split('').map(Number);
	const check = (len: number) => {
		const weights =
			len === 12
				? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
				: [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
		const sum = weights.reduce((acc, w, i) => acc + w * (nums[i] ?? 0), 0);
		const rest = sum % 11;
		return rest < 2 ? 0 : 11 - rest;
	};
	return check(12) === nums[12] && check(13) === nums[13];
}

/** (00) 0000-0000 ou (00) 00000-0000 conforme digita. */
export function maskPhone(raw: string): string {
	const d = phoneDigits(raw).slice(0, 11);
	if (d.length <= 2) return d.length ? `(${d}` : '';
	const ddd = d.slice(0, 2);
	const rest = d.slice(2);
	if (rest.length <= 4) return `(${ddd}) ${rest}`;
	const split = rest.length === 9 ? 5 : 4;
	return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

/** Fixo (10) ou celular (11) com DDD; celular começa com 9. */
export function isValidPhone(raw: string): boolean {
	const d = phoneDigits(raw);
	if (d.length === 11) return d[2] === '9';
	return d.length === 10;
}

/** Site sem esquema ganha https://; só http(s) e com domínio. Inválido → null. */
export function normalizeWebsite(raw: string): string | null {
	const t = raw.trim();
	if (!t) return '';
	if (/\s/.test(t)) return null;
	const withProto = /^[a-z][a-z\d+.-]*:/i.test(t) ? t : `https://${t}`;
	try {
		const u = new URL(withProto);
		if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
		if (!u.hostname.includes('.')) return null;
		return withProto;
	} catch {
		return null;
	}
}

/** '@loja', 'loja' ou o link do perfil viram '@loja'. Inválido → null. */
export function normalizeInstagram(raw: string): string | null {
	const t = raw
		.trim()
		.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, '')
		.replace(/[/?#].*$/, '')
		.replace(/^@/, '');
	if (!t) return '';
	return /^[A-Za-z0-9._]{1,30}$/.test(t) ? `@${t}` : null;
}

export type CompanyContactFields = {
	cnpj: string;
	phone: string;
	website: string;
	instagram: string;
};

/** Mensagem curta por campo inválido (campo vazio é válido: nada é obrigatório). */
export function companyFieldErrors(
	f: CompanyContactFields,
): Partial<Record<keyof CompanyContactFields, string>> {
	const errors: Partial<Record<keyof CompanyContactFields, string>> = {};
	if (f.cnpj.trim() && !isValidCnpj(f.cnpj)) errors.cnpj = 'CNPJ inválido.';
	if (f.phone.trim() && !isValidPhone(f.phone)) {
		errors.phone = 'Use DDD + número.';
	}
	if (normalizeWebsite(f.website) === null) {
		errors.website = 'Ex.: https://seusite.com.br';
	}
	if (normalizeInstagram(f.instagram) === null) {
		errors.instagram = 'Ex.: @suaempresa';
	}
	return errors;
}
