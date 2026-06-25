import type { ResolvedScreenUi } from '../lib/screen-ui';

/**
 * Banner/aviso personalizado no topo de uma tela de tool de pipeline (vem de
 * `ui[screen].notice`). Espelha o `RoomNotice` das salas — só renderiza quando
 * há título ou mensagem; cor pelo `type` (info/aviso/sucesso).
 */
export function ScreenNotice({
	notice,
}: {
	notice: NonNullable<ResolvedScreenUi['notice']>;
}) {
	if (!notice.title && !notice.message) return null;
	const type = notice.type ?? 'info';
	const palette =
		type === 'warning'
			? 'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-200'
			: type === 'success'
				? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
				: 'border-sky-400/30 bg-sky-500/10 text-sky-700 dark:text-sky-200';
	return (
		<div className={`mb-4 rounded-2xl border px-4 py-3 ${palette}`}>
			{notice.title && <p className="text-sm font-semibold">{notice.title}</p>}
			{notice.message && (
				<p className="mt-0.5 whitespace-pre-wrap text-sm opacity-90">
					{notice.message}
				</p>
			)}
		</div>
	);
}
