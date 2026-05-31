'use client';

import { SubscriptionGate } from '@/components/course/subscription-gate';
import { PreviasView } from '@/components/previas/previas-view';

export default function PreviasCoursePage() {
	// Prévias não é uma ferramenta cobrada no modelo novo: é liberada 100% pelo
	// plano. SubscriptionGate abre só com assinatura ativa (ou conta ilimitada /
	// staff). Sem voxxys por uso, sem invocation_id, sem modal de confirmação.
	return (
		<SubscriptionGate>
			<PreviasView />
		</SubscriptionGate>
	);
}
