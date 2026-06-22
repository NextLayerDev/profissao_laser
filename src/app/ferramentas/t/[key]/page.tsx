'use client';

import { Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { usePermissions } from '@/hooks/use-permissions';
import { DynamicRoomView } from '@/modules/tools/components/dynamic-room-view';
import { useToolDefinition } from '@/modules/tools/hooks/use-tool-definition';

/**
 * Tela ADMIN de uma tool da Fábrica — fica no shell do dashboard (sidebar de
 * admin), porque `/ferramentas/*` está em ADMIN_PATHS. Sala (room_v1) →
 * DynamicRoomView (gestão de sessões + acompanhamento de presença/materiais);
 * pipeline → manda pro editor no builder (admin = gerenciar = editar).
 */
export default function ToolAdminPage() {
	const params = useParams();
	const router = useRouter();
	const key = String(params.key ?? '');

	const { can, isLoading: permLoading } = usePermissions();
	const allowed = can('tools.build');
	const def = useToolDefinition(key);

	useEffect(() => {
		if (!permLoading && !allowed) router.replace('/dashboard');
	}, [allowed, permLoading, router]);

	// Tool de pipeline: "gerenciar" = abrir no editor do builder.
	useEffect(() => {
		if (def.data && def.data.engine_runtime !== 'room_v1') {
			router.replace(`/ferramentas?open=${def.data.id}`);
		}
	}, [def.data, router]);

	// Tool inexistente / não-publicada (404) → volta pro builder em vez de travar.
	useEffect(() => {
		if (def.isError) router.replace('/ferramentas');
	}, [def.isError, router]);

	if (permLoading || !allowed || def.isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
			</div>
		);
	}

	const isRoom = def.data?.engine_runtime === 'room_v1';

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<main className="px-4 py-6 md:px-8">
				{isRoom ? (
					<DynamicRoomView toolKey={key} />
				) : (
					<p className="text-sm text-slate-500 dark:text-gray-400">
						A abrir no editor…
					</p>
				)}
			</main>
		</div>
	);
}
