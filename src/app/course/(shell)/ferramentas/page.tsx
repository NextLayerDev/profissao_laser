'use client';

import { SubscriptionGate } from '@/components/course/subscription-gate';
import { ToolsHub } from '@/components/tools/tools-hub';

/**
 * HUB de ferramentas do ALUNO (`/course/ferramentas`) — catálogo completo do que
 * o plano libera, fora do gargalo da sidebar (que só mostra os PINS). Vive no
 * shell do curso (route group `(shell)`) e atrás do `SubscriptionGate`, igual às
 * outras páginas de ferramenta. O catálogo já vem gateado por entitlements
 * dentro de `useToolCatalog('student')` — aqui não se reimplementa nada disso.
 */
export default function FerramentasCoursePage() {
	return (
		<SubscriptionGate>
			<div className="px-4 py-8 sm:px-6 md:px-8">
				<ToolsHub audience="student" />
			</div>
		</SubscriptionGate>
	);
}
