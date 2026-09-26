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
// ── Quem decide ──────────────────────────────────────────────────────────────
//
// A api (`/me/mentoria/access`). Desde o "plano obrigatório" a regra de lá é a
// mesma do `hasMentoriaInPlan` (plano com `mentoria_360` ilimitada; staff e
// conta de teste passam) — a matrícula sozinha não libera mais. O
// `/me/entitlements` virou só a reserva para quando `/access` falha, e o 403
// do bootstrap continua como rede de segurança.

// ── Liberação restrita ───────────────────────────────────────────────────────
//
// O admin pode limitar a Mentoria a uma lista de alunos (/mentoria-admin/acesso).
// Quem está fora dela recebe `reason: 'restricted'` de `/me/mentoria/access` e
// vê "ainda não liberada" — nunca o CTA de plano, porque essa pessoa JÁ tem o
// plano (sem ele a api responde `required`, e aí vale o cadeado de plano abaixo).

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
import {
	useMentoriaBootstrap,
	useMyMentoriaAccess,
} from '@/modules/mentoria/hooks';
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
	const access = useMyMentoriaAccess();

	if (isStaff) return <>{children}</>;
	// Entitlements só importam como reserva: não segura a tela se `/access` já
	// respondeu.
	if (access.isLoading || (!access.data && isLoading)) return <MntSkeleton />;

	if (access.data?.reason === 'restricted') {
		return (
			<EmptyState
				icon={Lock}
				title="Mentoria ainda não liberada para você"
				description="Ela está sendo liberada aos poucos. Quando chegar sua vez, aparece aqui."
			>
				<Link href="/course" className={BTN_PRIMARY}>
					Voltar ao início
				</Link>
			</EmptyState>
		);
	}

	// `has_access` da api decide. Sem resposta de `/access` (falha de rede), cai
	// na mesma regra lida do `/me/entitlements` — e só quando a lista REALMENTE
	// chegou: `toolFor` devolve `undefined` também para "não carregou", e tratar
	// isso como falta de plano virava CTA de upgrade para todo mundo.
	const tool = isSuccess ? toolFor(MENTORIA_TOOL_KEY) : undefined;
	const apiSaysNo = access.data ? !access.data.has_access : false;
	const planSaysNo =
		!access.data && isSuccess && !isTestUnlimited && !hasMentoriaInPlan(tool);
	// Qualquer outra falha (500, rede fora) segue para dentro.
	const blocked = apiSaysNo || planSaysNo || isMentoriaAccessDenied(error);

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
				description="Veja os planos que incluem a Mentoria."
			>
				<Link href="/course/store" className={BTN_PRIMARY}>
					Ver planos
				</Link>
			</EmptyState>
		);
	}

	return <>{children}</>;
}
