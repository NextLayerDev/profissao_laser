// Leitura do gate de plano da Mentoria, do lado do front.
//
// A `upvox-api` protege as 9 rotas da aba com `requireMentoriaAccess`: staff e
// admin passam direto; o aluno precisa de matrícula ativa numa turma OU de um
// plano que inclua a tool `mentoria_360` (tabela `plan_tools`). Quem não tem
// nenhum dos dois recebe `403 mentoria_access_required`.
//
// Esse 403 é o ÚNICO sinal disponível aqui: nenhum endpoint de cliente diz quais
// planos carregam a tool. O `/entitlements` não serve — com assinatura ativa ele
// devolve `entitled: true` para toda tool habilitada, e `free_quota: 0` tanto
// para "fora do plano" quanto para "no plano com cota zero". As rotas que leem
// `plan_tools` (`/v1/plans`, `/v1/plan/:id/details`) são staff/admin.
//
// Consequência de produto: dá para saber QUE falta acesso, não QUAL plano
// resolve — por isso o CTA de upgrade é genérico.

/** Mensagem que a api devolve no 403 do gate (`ForbiddenError`). */
const ACCESS_DENIED = 'mentoria_access_required';

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
