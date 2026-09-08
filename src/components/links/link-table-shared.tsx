'use client';

import { Copy, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';
import type { PlanLinkListItem } from '@/types/plan-link';

/**
 * Peças comuns às três tabelas de link (mensal, anual, avançado). Antes disso
 * cada tabela carregava sua própria cópia de status/formatação/copiar/ativar —
 * a terceira aba faria três.
 */

export const STATUS_STYLES: Record<string, string> = {
	active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
	disabled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
	expired: 'bg-red-500/10 text-red-400 border-red-500/20',
	exhausted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export const STATUS_LABELS: Record<string, string> = {
	active: 'Ativo',
	disabled: 'Desativado',
	expired: 'Expirado',
	exhausted: 'Esgotado',
};

export function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

export function formatBRL(cents: number) {
	return (cents / 100).toLocaleString('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	});
}

/** Status efetivo pra exibição (expiração/esgotamento derivados no front). */
export function effectiveStatus(link: PlanLinkListItem): string {
	if (link.status === 'disabled') return 'disabled';
	if (link.expires_at && new Date(link.expires_at) < new Date())
		return 'expired';
	if (
		link.max_redemptions !== null &&
		link.current_redemptions >= link.max_redemptions
	)
		return 'exhausted';
	return 'active';
}

export function publicLinkUrl(token: string) {
	return `${window.location.origin}/link-plano/${token}`;
}

export async function copyPublicLink(token: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(publicLinkUrl(token));
		toast.success('Link copiado!');
		return true;
	} catch {
		toast.error('Erro ao copiar link');
		return false;
	}
}

export function StatusBadge({ status }: { status: string }) {
	return (
		<span
			className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[status] ?? STATUS_STYLES.active}`}
		>
			{STATUS_LABELS[status] ?? status}
		</span>
	);
}

/** Cabeçalho de tabela a partir da lista de títulos. */
export function LinkTableHead({ columns }: { columns: string[] }) {
	return (
		<thead>
			<tr className="border-b border-slate-200 dark:border-gray-800">
				{columns.map((h) => (
					<th
						key={h}
						className="text-left py-3 px-4 font-medium text-slate-400 dark:text-gray-600"
					>
						{h}
					</th>
				))}
			</tr>
		</thead>
	);
}

/** Célula "Voxxys do plano": inclui ou não o vox_monthly_grant (D4). */
export function PlanVoxesBadge({ includes }: { includes: boolean }) {
	return includes ? (
		<span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
			Inclui
		</span>
	) : (
		<span className="inline-flex items-center rounded-full border border-slate-300 dark:border-gray-700 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:text-gray-400">
			Não inclui
		</span>
	);
}

/** Botões copiar + ativar/desativar (idênticos nas três tabelas). */
export function LinkRowActions({
	link,
	copied,
	onCopy,
	onToggle,
	toggling,
}: {
	link: PlanLinkListItem;
	copied: boolean;
	onCopy: () => void;
	onToggle: () => void;
	toggling: boolean;
}) {
	return (
		<div className="flex items-center gap-1">
			<button
				type="button"
				onClick={onCopy}
				className={`p-2 rounded-lg transition-colors ${
					copied
						? 'bg-emerald-500/20 text-emerald-400'
						: 'text-slate-500 dark:text-gray-500 hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-[#252528]'
				}`}
				title="Copiar link"
			>
				<Copy className="w-4 h-4" />
			</button>
			<button
				type="button"
				onClick={onToggle}
				disabled={toggling}
				className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
					link.status === 'active'
						? 'text-slate-500 dark:text-gray-500 hover:text-red-400 hover:bg-red-500/10'
						: 'text-slate-500 dark:text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10'
				}`}
				title={link.status === 'active' ? 'Desativar link' : 'Ativar link'}
			>
				{link.status === 'active' ? (
					<PowerOff className="w-4 h-4" />
				) : (
					<Power className="w-4 h-4" />
				)}
			</button>
		</div>
	);
}

/** Hook com o estado de "copiei este agora" + o toggle de status. */
export function useLinkRowActions(
	toggle: (args: {
		id: string;
		status: 'active' | 'disabled';
	}) => Promise<unknown>,
) {
	return {
		async copy(
			token: string,
			id: string,
			setCopied: (v: string | null) => void,
		) {
			if (await copyPublicLink(token)) {
				setCopied(id);
				setTimeout(() => setCopied(null), 2000);
			}
		},
		async toggle(link: PlanLinkListItem) {
			const next = link.status === 'active' ? 'disabled' : 'active';
			try {
				await toggle({ id: link.id, status: next });
				toast.success(next === 'active' ? 'Link ativado!' : 'Link desativado!');
			} catch {
				toast.error('Erro ao alterar status do link');
			}
		},
	};
}
