// Datas sem hora (colunas `date`: due_date, measured_at, deadline, posted_on…).
// `new Date('2026-10-15')` é meia-noite UTC e, em UTC-3, vira o dia 14 — por
// isso a string só-data é montada no fuso local.

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Converte ISO em Date; 'YYYY-MM-DD' é lido como meia-noite LOCAL. */
export function parseLocalDate(iso: string): Date {
	const m = DATE_ONLY.exec(iso);
	if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
	return new Date(iso);
}

/** Hoje como 'YYYY-MM-DD' no fuso local (toISOString daria amanhã após 21h). */
export function todayLocalISO(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
