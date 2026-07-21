import {
	type KbHealth,
	type KbSourceKind,
	OPT_IN_KINDS,
	TEACHABLE_KINDS,
} from '@/types/ai-knowledge';

/**
 * Derivações compartilhadas entre a barra do agente (topo) e o painel de
 * desempenho (coluna da direita) — as duas precisam da mesma leitura do estado,
 * e duplicar a regra faria as duas discordarem com o tempo.
 */

/**
 * Origens que ele poderia ler e nunca leu. Os opt-in (chamado de aluno) NÃO
 * contam: deixá-los de fora é escolha da equipe, não falha — apontá-los como
 * buraco empurraria a staff a ingerir conversa de aluno sem querer.
 */
export function pontosCegosOf(health?: KbHealth): KbSourceKind[] {
	if (!health) return [];
	const presentes = new Set(
		(health.by_kind ?? []).filter((r) => r.sources > 0).map((r) => r.kind),
	);
	return TEACHABLE_KINDS.filter(
		(k) => !OPT_IN_KINDS.includes(k) && !presentes.has(k),
	);
}

/** Escada de gravidade: a primeira condição que bater vira o status do agente. */
export function statusOf(
	health: KbHealth | undefined,
	pontosCegos: KbSourceKind[],
): string {
	if (!health) return 'Acordando…';
	if ((health.sources_total ?? 0) === 0)
		return 'Ainda não sabe nada sobre a plataforma';
	if (!health.embeddings_available) return 'No ar, mas lendo só as palavras';
	if (health.sources_error > 0)
		return `No ar, com ${health.sources_error} ${health.sources_error === 1 ? 'coisa que leu errado' : 'coisas que leu errado'}`;
	if (pontosCegos.length > 0)
		return `No ar, com ${pontosCegos.length} ${pontosCegos.length === 1 ? 'ponto cego' : 'pontos cegos'}`;
	return 'No ar e pronto para atender';
}

export function formatWhen(iso: string | null | undefined): string {
	if (!iso) return 'nunca';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return 'nunca';
	const min = Math.floor((Date.now() - d.getTime()) / 60000);
	if (min < 1) return 'agora mesmo';
	if (min < 60) return `há ${min} min`;
	const h = Math.floor(min / 60);
	if (h < 24) return `há ${h}h`;
	const days = Math.floor(h / 24);
	if (days < 30) return `há ${days}d`;
	return d.toLocaleDateString('pt-BR');
}
