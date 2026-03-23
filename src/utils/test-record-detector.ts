import type { Sales } from '@/types/sales';

const TEST_EMAIL_PATTERNS = [
	/^test@/i,
	/^teste@/i,
	/^tom@/i,
	/^usuario@/i,
	/@example\.com$/i,
	/@test\.com$/i,
	/\+test@/i,
];

const TEST_NAME_PATTERNS = [/^test$/i, /^teste$/i, /^asdf/i, /^qwer/i, /^aaa/i];

function hasRepeatedChars(str: string): boolean {
	if (str.length < 4) return false;
	const cleaned = str.replace(/\s/g, '').toLowerCase();
	const uniqueChars = new Set(cleaned).size;
	return uniqueChars <= Math.max(2, cleaned.length * 0.3);
}

export function isTestRecord(sale: Sales): boolean {
	const { name, email } = sale.customer;

	if (TEST_EMAIL_PATTERNS.some((pattern) => pattern.test(email))) return true;

	if (name === 'Unknown' || !name.trim()) return false;

	if (TEST_NAME_PATTERNS.some((pattern) => pattern.test(name.trim())))
		return true;

	if (hasRepeatedChars(name)) return true;

	return false;
}
