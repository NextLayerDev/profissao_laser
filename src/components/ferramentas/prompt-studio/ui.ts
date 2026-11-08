/**
 * Classes da tela de Prompts Mágicos — mesma linguagem do Banco do Admin
 * (`tool-bank-manager.tsx`): superfícies escuras, borda fina, verde de ação.
 */

export const panelCls =
	'rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#0e1217] to-[#0a0c10]';

export const labelCls = 'mb-1.5 block text-[13px] font-medium text-slate-300';

export const hintCls = 'mt-1 text-[11px] leading-snug text-slate-500';

export const fieldCls =
	'h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:border-emerald-400/50 focus-visible:ring-2 focus-visible:ring-emerald-400/30 disabled:opacity-50';

export const numCls =
	'h-9 w-full rounded-lg border border-white/10 bg-black/30 px-2.5 text-sm tabular-nums text-slate-100 focus-visible:outline-none focus-visible:border-emerald-400/50 focus-visible:ring-2 focus-visible:ring-emerald-400/30';

export const primaryBtn =
	'inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40';

export const ghostBtn =
	'inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40';

export const iconBtn =
	'rounded-lg border border-white/10 bg-black/30 p-2 text-slate-400 transition-colors hover:text-slate-100 disabled:opacity-30';

export function chipCls(on: boolean) {
	return `rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
		on
			? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
			: 'border-white/10 bg-black/30 text-slate-400 hover:text-slate-200'
	}`;
}
