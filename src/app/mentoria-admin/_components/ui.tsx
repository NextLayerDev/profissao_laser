'use client';

// Primitivos visuais da área Mentoria 360° (admin + mentor).
// Seguem o padrão das páginas admin (cupons/agendamentos): cards rounded-2xl,
// borda slate-200 / white-10, dark mode, botão primário violeta.
import { ArrowLeft, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const inputClass =
	'w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-60';

export const primaryBtn =
	'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

export const secondaryBtn =
	'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

export const dangerBtn =
	'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-red-300 dark:border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

export function Card({
	children,
	className = '',
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] ${className}`}
		>
			{children}
		</div>
	);
}

export function PageTitle({
	title,
	description,
	backHref,
	actions,
}: {
	title: string;
	description?: string;
	backHref?: string;
	actions?: ReactNode;
}) {
	return (
		<div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
			<div>
				{backHref && (
					<Link
						href={backHref}
						className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 mb-2"
					>
						<ArrowLeft className="w-4 h-4" />
						Voltar
					</Link>
				)}
				<h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
					{title}
				</h2>
				{description && (
					<p className="text-slate-600 dark:text-gray-400 mt-1 max-w-2xl">
						{description}
					</p>
				)}
			</div>
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</div>
	);
}

export function Modal({
	title,
	onClose,
	children,
	wide = false,
}: {
	title: string;
	onClose: () => void;
	children: ReactNode;
	wide?: boolean;
}) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 md:p-8"
			onClick={onClose}
			onKeyDown={(e) => e.key === 'Escape' && onClose()}
			role="presentation"
		>
			<div
				className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111318] shadow-xl my-auto`}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
			>
				<div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
					<h3 className="font-semibold text-slate-900 dark:text-white">
						{title}
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
						aria-label="Fechar"
					>
						<X className="w-4 h-4" />
					</button>
				</div>
				<div className="p-5">{children}</div>
			</div>
		</div>
	);
}

export function Field({
	label,
	children,
	hint,
	required,
}: {
	label: string;
	children: ReactNode;
	hint?: string;
	required?: boolean;
}) {
	return (
		<div>
			<span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
				{label}
				{required && <span className="text-red-500 ml-0.5">*</span>}
			</span>
			{children}
			{hint && (
				<p className="text-xs text-slate-500 dark:text-gray-500 mt-1">{hint}</p>
			)}
		</div>
	);
}

export function Spinner({ label }: { label?: string }) {
	return (
		<div className="flex items-center justify-center gap-2 py-12 text-slate-500 dark:text-gray-400 text-sm">
			<Loader2 className="w-5 h-5 animate-spin" />
			{label ?? 'Carregando...'}
		</div>
	);
}

export function EmptyState({ message }: { message: string }) {
	return (
		<div className="py-12 text-center text-sm text-slate-500 dark:text-gray-400">
			{message}
		</div>
	);
}

export function Badge({
	tone,
	children,
}: {
	tone: 'green' | 'amber' | 'red' | 'slate' | 'violet' | 'blue';
	children: ReactNode;
}) {
	const tones: Record<string, string> = {
		green:
			'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
		amber:
			'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
		red: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
		slate:
			'bg-slate-500/10 text-slate-600 dark:text-gray-400 border-slate-300 dark:border-white/10',
		violet:
			'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30',
		blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
	};
	return (
		<span
			className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${tones[tone]}`}
		>
			{children}
		</span>
	);
}

export function ProgressBar({ pct }: { pct: number }) {
	const clamped = Math.max(0, Math.min(100, Math.round(pct)));
	return (
		<div className="flex items-center gap-2 min-w-32">
			<div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
				<div
					className="h-full rounded-full bg-violet-500 transition-all"
					style={{ width: `${clamped}%` }}
				/>
			</div>
			<span className="text-xs tabular-nums text-slate-600 dark:text-gray-400 w-9 text-right">
				{clamped}%
			</span>
		</div>
	);
}

export function cohortStatusBadge(status: string) {
	const map: Record<
		string,
		{ tone: 'green' | 'amber' | 'slate' | 'blue'; label: string }
	> = {
		draft: { tone: 'amber', label: 'Rascunho' },
		active: { tone: 'green', label: 'Ativa' },
		completed: { tone: 'blue', label: 'Concluída' },
		archived: { tone: 'slate', label: 'Arquivada' },
	};
	const cfg = map[status] ?? { tone: 'slate' as const, label: status };
	return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

export function formatDate(iso: string | null | undefined): string {
	if (!iso) return '—';
	try {
		return new Date(iso).toLocaleDateString('pt-BR');
	} catch {
		return iso;
	}
}

export function formatDateTime(iso: string | null | undefined): string {
	if (!iso) return '—';
	try {
		return new Date(iso).toLocaleString('pt-BR', {
			dateStyle: 'short',
			timeStyle: 'short',
		});
	} catch {
		return iso;
	}
}
