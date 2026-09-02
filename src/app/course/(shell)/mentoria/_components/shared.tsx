'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Compass } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useMentoriaBootstrap } from '@/modules/mentoria/hooks';
import type { MentoriaBootstrap } from '@/modules/mentoria/types';

// Classes base do visual da Mentoria 360° — migrado para tokens upvox-ui.
// Cores: brand (púrpura #7c3aed), surface, subtle border.
//
// `CARD` já não carrega par `dark:`: os tokens `surface`/`subtle` resolvem os
// dois temas sozinhos (o `.dark` deles mora em app/globals.css), e o raio saiu
// de `rounded-2xl` para `rounded-card`, que é o valor do DS. Preferir
// `SectionCard` de `@/modules/mentoria/components/ui` em telas novas.
//
// `INPUT`/`BTN_PRIMARY`/`BTN_GHOST` continuam aqui porque as demais telas da
// Mentoria ainda dependem deles; a troca por `Input`/`Button` do DS é a próxima
// rodada da migração.
export const CARD = 'rounded-card border border-subtle bg-surface';
export const INPUT =
	'w-full rounded-xl border border-subtle bg-surface dark:border-white/10 dark:bg-white/5 px-3 py-2 text-sm text-primary dark:text-slate-100 placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-60';
export const BTN_PRIMARY =
	'inline-flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-brand-hover disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition';
export const BTN_GHOST =
	'inline-flex items-center justify-center gap-2 rounded-xl border border-subtle dark:border-white/10 text-primary dark:text-slate-300 hover:bg-surface-sunken dark:hover:bg-white/5 text-sm font-medium px-4 py-2 transition disabled:opacity-40';
export const LABEL =
	'text-sm font-medium text-primary dark:text-slate-300 mb-1.5 block';

export function fmtDate(iso: string | null | undefined): string {
	if (!iso) return '—';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '—';
	return d.toLocaleDateString('pt-BR');
}

export function fmtMoney(value: number | null | undefined): string {
	if (value === null || value === undefined) return '—';
	return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Extrai o código de erro da resposta da API (ex.: required_fields_missing). */
export function apiErrorCode(e: unknown): string | null {
	if (typeof e === 'object' && e !== null && 'response' in e) {
		const resp = (
			e as { response?: { data?: { error?: unknown; message?: unknown } } }
		).response;
		const code = resp?.data?.error ?? resp?.data?.message;
		return typeof code === 'string' ? code : null;
	}
	return null;
}

export function MntHeader({
	title,
	subtitle,
	icon: Icon,
	backHref,
	actions,
}: {
	title: string;
	subtitle?: string;
	icon?: LucideIcon;
	backHref?: string;
	actions?: ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-center gap-4 mb-8">
			{backHref && (
				<Link
					href={backHref}
					className="w-9 h-9 rounded-control border border-subtle flex items-center justify-center text-secondary hover:bg-surface-sunken transition"
				>
					<ArrowLeft className="w-4 h-4" />
				</Link>
			)}
			<div className="w-1 h-10 rounded-full bg-brand" />
			{Icon && (
				<div className="w-10 h-10 rounded-control bg-brand-wash flex items-center justify-center">
					<Icon className="w-5 h-5 text-brand dark:text-violet-400" />
				</div>
			)}
			<div className="min-w-0 flex-1">
				<h1 className="font-display text-page text-primary">{title}</h1>
				{subtitle && <p className="text-body text-muted">{subtitle}</p>}
			</div>
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</div>
	);
}

export function MntSkeleton() {
	return (
		<div className="space-y-4 animate-pulse">
			<div className="h-10 w-64 rounded-control bg-subtle" />
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{['a', 'b', 'c'].map((k) => (
					<div key={k} className="h-32 rounded-card bg-surface-sunken" />
				))}
			</div>
			<div className="h-64 rounded-card bg-surface-sunken" />
		</div>
	);
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	children,
}: {
	icon?: LucideIcon;
	title: string;
	description?: string;
	children?: ReactNode;
}) {
	const I = Icon ?? Compass;
	return (
		<div
			className={`${CARD} flex flex-col items-center justify-center py-16 px-6 text-center`}
		>
			<div className="w-14 h-14 rounded-card bg-brand-wash flex items-center justify-center mb-4">
				{/* `text-brand` e `text-success`/`text-danger` sao valores de modo
				    claro e o DS nao publica versao escura de nenhum — o mesmo token
				    e FUNDO no botao primario, onde precisa continuar #7c3aed. Ate o
				    DS ter tons semanticos de texto para o escuro, o par `dark:` fica. */}
				<I className="w-6 h-6 text-brand dark:text-violet-400" />
			</div>
			<p className="text-title text-primary mb-1">{title}</p>
			{description && (
				<p className="text-body text-muted max-w-md mb-4">{description}</p>
			)}
			{children}
		</div>
	);
}

/**
 * Garante que o aluno tem uma jornada ativa antes de renderizar a tela.
 * Sem jornada → instrui a voltar à home da Mentoria (que tem o formulário de
 * empresa e o estado "sem turma").
 */
export function JourneyGate({
	children,
}: {
	children: (ctx: {
		journeyId: string;
		bootstrap: MentoriaBootstrap;
	}) => ReactNode;
}) {
	const { data, isLoading, isError } = useMentoriaBootstrap();

	if (isLoading) return <MntSkeleton />;

	if (isError || !data?.journey) {
		return (
			<div>
				<EmptyState
					title="Você ainda não está matriculado em uma turma de mentoria"
					description="Assim que sua matrícula for feita pela equipe, sua jornada aparece aqui. Enquanto isso, você pode cadastrar os dados da sua empresa na página inicial da Mentoria 360°."
				>
					<Link href="/course/mentoria" className={BTN_PRIMARY}>
						Ir para a Mentoria 360°
					</Link>
				</EmptyState>
			</div>
		);
	}

	return <>{children({ journeyId: data.journey.id, bootstrap: data })}</>;
}

const MEETING_STATUS_LABEL: Record<string, string> = {
	locked: 'Bloqueado',
	available: 'Disponível',
	in_progress: 'Em andamento',
	done: 'Concluído',
};

export function meetingStatusLabel(status: string): string {
	return MEETING_STATUS_LABEL[status] ?? status;
}
