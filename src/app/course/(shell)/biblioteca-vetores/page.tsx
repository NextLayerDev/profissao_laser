'use client';

import { BibliotecaVetoresView } from '@/components/biblioteca/biblioteca-vetores-view';
import { SubscriptionGate } from '@/components/course/subscription-gate';

export default function BibliotecaCoursePage() {
	// Acervo de vetores é conteúdo de plano: sem assinatura ativa não entra
	// (antes abria pra todos e o download saía direto do CDN, de graça).
	return (
		<SubscriptionGate>
			<BibliotecaVetoresView />
		</SubscriptionGate>
	);
}
