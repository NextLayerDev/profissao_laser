'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DynamicRoomView } from '@/modules/tools/components/dynamic-room-view';
import { DynamicToolView } from '@/modules/tools/components/dynamic-tool-view';
import {
	DISABLED_TOOL_REDIRECT,
	isToolEnabled,
} from '@/modules/tools/enabled-tools';
import { useToolDefinition } from '@/modules/tools/hooks/use-tool-definition';

/**
 * Página genérica de uma tool da Fábrica de Tools. Ramifica pelo TIPO de tool
 * (`engine_runtime`): `room_v1` (Mentoria) → `DynamicRoomView` (sessões + sala
 * gateada); qualquer outro → `DynamicToolView` (pipeline). Sem código por tool.
 * Abre com ou sem plano; a trava é a cobrança em voxxys disparada na view.
 *
 * Ferramenta fora da allowlist (`NEXT_PUBLIC_ENABLED_TOOLS`) volta pro hub. A
 * decisão espera a definition porque sala (`room_v1`) nunca é bloqueada; se a
 * definition não existe mais (arquivada no backend), também volta.
 */
export default function DynamicToolPage() {
	const params = useParams();
	const router = useRouter();
	const key = String(params.key ?? '');
	const { data: def, isError } = useToolDefinition(key);
	const isRoom = def?.engine_runtime === 'room_v1';
	const blocked = !isToolEnabled(key) && (isError || (!!def && !isRoom));

	useEffect(() => {
		if (blocked) router.replace(DISABLED_TOOL_REDIRECT);
	}, [blocked, router]);

	if (!isToolEnabled(key) && !isRoom) return null;

	return (
		<>
			{isRoom ? (
				<DynamicRoomView toolKey={key} />
			) : (
				<DynamicToolView toolKey={key} />
			)}
		</>
	);
}
