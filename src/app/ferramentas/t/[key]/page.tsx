'use client';

import { Loader2, Pencil, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { type CSSProperties, useEffect } from 'react';
import { Header } from '@/components/dashboard/header';
import { ToolBankAdmin } from '@/components/ferramentas/tool-bank-admin';
import { usePermissions } from '@/modules/access';
import { DynamicRoomView } from '@/modules/tools/components/dynamic-room-view';
import { ScreenNotice } from '@/modules/tools/components/screen-notice';
import { useToolDefinition } from '@/modules/tools/hooks/use-tool-definition';
import { resolveScreenUi } from '@/modules/tools/lib/screen-ui';

/**
 * Tela ADMIN de uma tool da Fábrica — fica no shell do dashboard (sidebar de
 * admin), porque `/ferramentas/*` está em ADMIN_PATHS. Por engine_runtime:
 *  - room_v1            → DynamicRoomView (gestão de sessões + presença).
 *  - pipeline c/ banco  → ToolBankAdmin (alimentar o "Banco do Admin") — é a
 *    tela que o item do menu lateral abre.
 *  - pipeline s/ banco  → manda pro editor do builder (não há o que alimentar).
 */
export default function ToolAdminPage() {
	const params = useParams();
	const router = useRouter();
	const key = String(params.key ?? '');

	const { can, isLoading: permLoading } = usePermissions();
	const allowed = can('tools.build');
	const def = useToolDefinition(key);

	const isRoom = def.data?.engine_runtime === 'room_v1';
	const hasBank = Boolean(def.data?.definition.bank?.enabled);

	useEffect(() => {
		if (!permLoading && !allowed) router.replace('/dashboard');
	}, [allowed, permLoading, router]);

	// Tool NATIVA (engine_runtime='native_v1'): a página real vive em código —
	// manda pra rota nativa (ui.href). Guarda contra href ausente → /ferramentas.
	useEffect(() => {
		if (def.data?.engine_runtime === 'native_v1') {
			const href = (def.data.definition.ui as { href?: string } | undefined)
				?.href;
			router.replace(href ?? '/ferramentas');
		}
	}, [def.data, router]);

	// Pipeline SEM banco: "gerenciar" = abrir no editor do builder.
	useEffect(() => {
		if (
			def.data &&
			def.data.engine_runtime !== 'room_v1' &&
			def.data.engine_runtime !== 'native_v1' &&
			!hasBank
		) {
			router.replace(`/ferramentas?open=${def.data.id}`);
		}
	}, [def.data, hasBank, router]);

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

	// Aparência personalizada da tela do Admin (cor/tema/título/subtítulo/banner).
	const adminUi = resolveScreenUi(def.data, 'admin');
	const themedShell = adminUi.themeClass
		? `rounded-2xl p-4 sm:p-6 ${adminUi.themeClass === 'dark' ? 'bg-[#0d0d0f]' : 'bg-slate-50'}`
		: '';

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<main className="px-4 py-6 md:px-8">
				{isRoom ? (
					<DynamicRoomView toolKey={key} />
				) : hasBank && def.data ? (
					<div
						className={`mx-auto w-full max-w-3xl ${adminUi.themeClass} ${themedShell}`}
						style={{ '--screen-accent': adminUi.accent } as CSSProperties}
					>
						{adminUi.notice && <ScreenNotice notice={adminUi.notice} />}
						<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								<div
									className="grid h-10 w-10 place-items-center rounded-xl"
									style={{
										backgroundColor:
											'color-mix(in srgb, var(--screen-accent) 12%, transparent)',
										color: 'var(--screen-accent)',
									}}
								>
									<Sparkles className="h-5 w-5" />
								</div>
								<div>
									<h1 className="text-lg font-bold leading-tight">
										{adminUi.title ?? def.data.title}
									</h1>
									<p className="text-xs text-slate-500 dark:text-gray-400">
										{adminUi.subtitle ??
											'Banco do Admin · alimente os itens que o cliente usa'}
									</p>
								</div>
							</div>
							<Link
								href={`/ferramentas?open=${def.data.id}`}
								className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
							>
								<Pencil className="h-4 w-4" /> Editar na fábrica
							</Link>
						</div>
						<ToolBankAdmin definition={def.data} />
					</div>
				) : (
					<p className="text-sm text-slate-500 dark:text-gray-400">
						A abrir no editor…
					</p>
				)}
			</main>
		</div>
	);
}
