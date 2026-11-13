/**
 * Última escolha de produto/cor da Prévia IA, guardada no navegador do aluno.
 * É só uma conveniência: quem abre a tela de novo já cai com o produto e a cor
 * da última prévia selecionados. Se o storage falhar (aba anônima, bloqueio),
 * a tela funciona igual, só sem a lembrança.
 */

const STORAGE_KEY = 'previa:last-choice';

export interface PreviaLastChoice {
	productId: string;
	variantId: string;
}

export function readLastChoice(): PreviaLastChoice | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<PreviaLastChoice>;
		if (
			typeof parsed.productId === 'string' &&
			typeof parsed.variantId === 'string'
		) {
			return { productId: parsed.productId, variantId: parsed.variantId };
		}
		return null;
	} catch {
		return null;
	}
}

export function saveLastChoice(choice: PreviaLastChoice) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
	} catch {
		// sem storage, sem lembrança — não é erro para o aluno
	}
}

export function clearLastChoice() {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// idem
	}
}
