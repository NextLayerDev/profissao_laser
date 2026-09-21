// Leitura do acesso à Mentoria, do lado do front.
//
// A `upvox-api` protege as 9 rotas da aba com `requireMentoriaAccess`, e a regra
// de lá é: staff/admin passam direto; o aluno precisa de matrícula ativa numa
// turma **OU** de um plano com a tool `mentoria_360` (tabela `plan_tools`).
//
// Esse "OU" é o problema que este módulo contorna. Quem foi matriculado numa
// turma entra com QUALQUER plano — a api nem consulta o `plan_tools`. Então o
// 403 sozinho não basta como sinal: ele nunca chega para o aluno matriculado,
// mesmo que o plano dele não inclua a Mentoria.
//
// Por isso são DOIS sinais aqui:
//
//   1. `hasMentoriaInPlan` — o que o plano do aluno diz, via `/me/entitlements`.
//      É o que decide.
//   2. `isMentoriaAccessDenied` — o 403 da api. Rede de segurança: cobre quem
//      não tem assinatura nenhuma, caso em que a tool nem aparece na lista.
//
// LIMITE: isto é barreira de UX, não de segurança. A api continua respondendo
// 200 e servindo os dados para o aluno matriculado; quem chamar o endpoint
// direto vê tudo. Fechar de verdade é tirar a saída de matrícula do
// `assertMentoriaAccess` na `upvox-api` — trabalho de backend, com impacto em
// quem já está matriculado.

import type { EntitlementTool } from '@/services/entitlements';

/** Mensagem que a api devolve no 403 do gate (`ForbiddenError`). */
const ACCESS_DENIED = 'mentoria_access_required';

/** Chave da tool no registry (`tools.key`) e no `plan_tools`. */
export const MENTORIA_TOOL_KEY = 'mentoria_360';

/**
 * `true` quando o plano do aluno inclui a Mentoria.
 *
 * O `/me/entitlements` lista TODA tool habilitada para quem tem assinatura, com
 * `entitled: true` em todas — esse campo é de billing e não serve para decidir
 * acesso. Quem carrega a informação é o `free_quota`, que a api preenche com a
 * linha de `plan_tools` do plano (ausente ⇒ 0):
 *
 *   | plano COM a tool, marcada "ilimitada" | `null` |
 *   | plano SEM a tool                      | `0`    |
 *   | sem assinatura                        | a tool nem vem na lista |
 *
 * Só `null` conta, e não "diferente de 0": o `0` é ambíguo, porque o modal do
 * admin também grava 0 no modo *gated* (`add-tool-modal.tsx`). Como o
 * `vox_cost` da Mentoria é 0 — ela é acesso, não consumo —, *gated* não faz
 * sentido para ela, e "ilimitada" é o padrão do modal. Mesma convenção que o
 * builder de salas usa para marcar plano incluído (`freeQuota[k] = null` em
 * `components/ferramentas/builder-model.ts`).
 *
 * Portanto: ao adicionar a Mentoria a um plano, marcar **ilimitada**. Gravada
 * como *gated*, o aluno é bloqueado.
 */
export function hasMentoriaInPlan(tool: EntitlementTool | undefined): boolean {
	return tool?.free_quota === null;
}

/**
 * `true` quando o erro veio do gate de plano da Mentoria.
 *
 * Exige status 403 **e** a mensagem específica: um 403 de outra origem (ex.:
 * `not_your_journey`) não é falta de plano e não pode virar CTA de upgrade.
 * O cliente é axios (`shared/lib/api-courses`), cujo interceptor só trata 401 —
 * o corpo do erro chega intacto em `response.data`.
 */
export function isMentoriaAccessDenied(err: unknown): boolean {
	if (typeof err !== 'object' || err === null || !('response' in err)) {
		return false;
	}
	const resp = (
		err as { response?: { status?: unknown; data?: { message?: unknown } } }
	).response;
	return resp?.status === 403 && resp.data?.message === ACCESS_DENIED;
}
