'use client';

// Cadeado de PLANO da aba Mentoria 360°.
//
// Usado em: app/course/(shell)/mentoria/layout.tsx (envolve o MentoriaShell
// inteiro, então vale para as 13 páginas da aba de uma vez).
//
// ── Por que não é o SubscriptionGate ─────────────────────────────────────────
//
// O `SubscriptionGate` das páginas pergunta "tem ALGUM plano ativo?". A api
// pergunta outra coisa: "o seu plano inclui a tool `mentoria_360`?". Quem tem
// plano ativo sem a Mentoria passava pelo primeiro e só descobria o problema
// quando toda request da aba voltava 403 — com o `JourneyGate` traduzindo isso
// para "você ainda não está matriculado", que manda cadastrar a empresa numa
// rota que também está atrás do mesmo gate. Beco sem saída.
//
// Os dois convivem: o SubscriptionGate cobre "nenhum plano", este cobre "plano
// sem a Mentoria". São CTAs diferentes e, na prática, mutuamente exclusivos.
//
// Envolve o shell POR FORA de propósito: sem acesso não há o que navegar, então
// não faz sentido montar a navegação e o Assistente em volta do aviso.
//
// ── Por que o 403 não decide sozinho ─────────────────────────────────────────
//
// A regra da api é "matrícula ativa OU plano com a tool", então o aluno que foi
// matriculado numa turma entra com qualquer plano e NUNCA recebe o 403. Quem
// decide aqui é o `/me/entitlements` (ver `modules/mentoria/access.ts`); o 403
// fica como rede de segurança, para quem não tem assinatura nenhuma e por isso
// nem aparece com a tool na lista.

import { Lock } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEntitlements } from '@/hooks/use-entitlements';
import { getToken } from '@/lib/auth';
import {
	hasMentoriaInPlan,
	isMentoriaAccessDenied,
	MENTORIA_TOOL_KEY,
} from '@/modules/mentoria/access';
import { useMentoriaBootstrap } from '@/modules/mentoria/hooks';
import { BTN_PRIMARY, EmptyState, MntSkeleton } from './shared';

export function MentoriaAccessGate({ children }: { children: ReactNode }) {
	// Conta de painel ANTES de tudo, e não por simetria com o `SubscriptionGate`:
	// `/me/entitlements` é rota de customer e devolve 401 para token de staff (o
	// interceptor de `shared/lib/api-courses` trata esse caso de propósito).
	// Sem esta linha, `toolFor` viria vazio e o admin seria barrado justamente na
	// aba que ele administra.
	const isStaff = typeof window !== 'undefined' && !!getToken('user');

	const { isLoading, isSuccess, isTestUnlimited, toolFor } = useEntitlements();
	const { error } = useMentoriaBootstrap();

	if (isStaff) return <>{children}</>;
	if (isLoading) return <MntSkeleton />;

	// Só decide pelo plano quando a lista REALMENTE chegou. `toolFor` devolve
	// `undefined` tanto para "a tool não está na sua lista" quanto para "a lista
	// não carregou", e tratar os dois igual transformava qualquer falha de
	// `/me/entitlements` em CTA de upgrade para todo mundo — inclusive para quem
	// tem o plano. Mesmo princípio do `JourneyGate`: falha de carregamento não é
	// falta de acesso.
	const tool = isSuccess ? toolFor(MENTORIA_TOOL_KEY) : undefined;
	const planSaysNo = isSuccess && !hasMentoriaInPlan(tool);

	// O 403 da api é a rede de segurança: cobre quem não tem assinatura nenhuma,
	// caso em que a tool nem vem na lista. Qualquer outra falha (500, rede fora)
	// segue para dentro.
	const blocked =
		!isTestUnlimited && (planSaysNo || isMentoriaAccessDenied(error));

	if (blocked && process.env.NODE_ENV !== 'production') {
		// Bloquear por engano é silencioso demais para depurar no olho: sem isto,
		// "tem o plano e mesmo assim barrou" não tem como ser distinguido de
		// "tool desabilitada no registry" ou "gravada como gated".
		console.warn(
			`[mentoria] acesso negado — ${MENTORIA_TOOL_KEY}:`,
			tool
				? `free_quota=${String(tool.free_quota)} (só null libera)`
				: 'ausente de /me/entitlements (sem assinatura, ou tool desabilitada no registry)',
		);
	}

	if (blocked) {
		return (
			<EmptyState
				icon={Lock}
				title="A Mentoria 360° não está no seu plano"
				description="A Mentoria é liberada por plano. Veja os planos que incluem o acompanhamento e o prontuário da sua empresa."
			>
				<Link href="/course/store" className={BTN_PRIMARY}>
					Ver planos
				</Link>
			</EmptyState>
		);
	}

	return <>{children}</>;
}
