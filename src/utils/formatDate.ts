const SAO_PAULO_TZ = 'America/Sao_Paulo';

export function formatDate(dateStr: string) {
	return new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(dateStr));
}

/** Formata data de agendamento (YYYY-MM-DD) no timezone de São Paulo */
export function formatAppointmentDate(
	dateStr: string,
	options: Intl.DateTimeFormatOptions = {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	},
): string {
	try {
		const d = new Date(`${dateStr}T12:00:00`);
		if (Number.isNaN(d.getTime())) return dateStr;
		return new Intl.DateTimeFormat('pt-BR', {
			...options,
			timeZone: SAO_PAULO_TZ,
		}).format(d);
	} catch {
		return dateStr;
	}
}

/** Formata timestamp de mensagem de chat (ex: "21:45", "Ontem 21:45", "03/03 21:45") */
export function formatMessageTime(dateStr: string): string {
	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) return dateStr;
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const diffDays = Math.floor(
		(today.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24),
	);

	const time = new Intl.DateTimeFormat('pt-BR', {
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);

	if (diffDays === 0) return time;
	if (diffDays === 1) return `Ontem ${time}`;
	if (diffDays < 7) {
		const dayName = new Intl.DateTimeFormat('pt-BR', {
			weekday: 'short',
		}).format(date);
		return `${dayName} ${time}`;
	}
	return new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
}
