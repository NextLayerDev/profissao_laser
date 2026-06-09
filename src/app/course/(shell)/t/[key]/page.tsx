'use client';

import { useParams } from 'next/navigation';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { DynamicToolView } from '@/modules/tools/components/dynamic-tool-view';

/**
 * Página genérica de uma tool da Fábrica de Tools. Renderiza qualquer
 * ToolDefinition publicada por `key` via `DynamicToolView` — sem código por tool.
 * Acesso 100% pelo plano (SubscriptionGate); cobrança disparada na view.
 */
export default function DynamicToolPage() {
	const params = useParams();
	const key = String(params.key ?? '');

	return (
		<SubscriptionGate>
			<DynamicToolView toolKey={key} />
		</SubscriptionGate>
	);
}
