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

import { Lock } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { isMentoriaAccessDenied } from '@/modules/mentoria/access';
import { useMentoriaBootstrap } from '@/modules/mentoria/hooks';
import { BTN_PRIMARY, EmptyState, MntSkeleton } from './shared';

export function MentoriaAccessGate({ children }: { children: ReactNode }) {
	const { isLoading, error } = useMentoriaBootstrap();

	if (isLoading) return <MntSkeleton />;

	// Só o 403 do gate vira upgrade. Qualquer outra falha (500, rede fora) segue
	// para dentro — quem trata é o `JourneyGate`, que sabe distinguir erro de
	// carregamento de "sem jornada".
	if (isMentoriaAccessDenied(error)) {
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
