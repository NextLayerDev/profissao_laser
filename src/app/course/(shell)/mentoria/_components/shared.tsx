'use client';

import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, ArrowLeft, Compass } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { parseLocalDate } from '@/modules/mentoria/dates';
import { useMentoriaBootstrap } from '@/modules/mentoria/hooks';
import { MENTORIA_SETTINGS } from '@/modules/mentoria/nav';
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
	// Colunas `date` ('2026-10-15') no fuso local; senão aparecem 1 dia antes.
	const d = parseLocalDate(iso);
	if (Number.isNaN(d.getTime())) return '—';
	return d.toLocaleDateString('pt-BR');
}

/**
 * Data + hora curtas. Separado de `fmtDate` porque o fallback é outro: numa
 * live sem `scheduled_at` o vazio não é "—", é uma informação ("a definir").
 */
export function fmtDateTime(iso: string | null | undefined): string {
	if (!iso) return 'Data a definir';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return 'Data a definir';
	return d.toLocaleString('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		// Ano só quando não é o corrente: gravação de 2025 parecia deste ano.
		...(d.getFullYear() !== new Date().getFullYear()
			? { year: 'numeric' as const }
			: {}),
		hour: '2-digit',
		minute: '2-digit',
	});
}

export function fmtMoney(value: number | null | undefined): string {
	if (value === null || value === undefined) return '—';
	return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * 'www.drive.com/x' sem protocolo virava href relativo (rota 404 da própria
 * plataforma): prefixa https:// e valida. Inválido → null.
 */
export function normalizeUrl(raw: string): string | null {
	const t = raw.trim();
	if (!t) return null;
	const withProto = /^[a-z][a-z\d+.-]*:\/\//i.test(t) ? t : `https://${t}`;
	try {
		const u = new URL(withProto);
		if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
		if (!u.hostname.includes('.')) return null;
		return u.toString();
	} catch {
		return null;
	}
}

/** Domínio do link, para rótulo ('link' não dizia nada). */
export function linkLabel(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return 'link';
	}
}

/** Extrai o código de erro da resposta da API (ex.: required_fields_missing). */
export function apiErrorCode(e: unknown): string | null {
	if (typeof e === 'object' && e !== null && 'response' in e) {
		const resp = (
			e as { response?: { data?: { error?: unknown; message?: unknown } } }
		).response;
		// `message` traz o código da regra (ex.: required_fields_missing); `error`
		// é só o texto HTTP ("Conflict"). Lendo `error` primeiro, nenhum código
		// específico batia e o aluno via sempre a mensagem genérica.
		const code = resp?.data?.message ?? resp?.data?.error;
		return typeof code === 'string' ? code : null;
	}
	return null;
}

/** Códigos da API que o aluno pode encontrar, em pt-BR. */
const STUDENT_ERRORS: Record<string, string> = {
	kpi_metric_key_taken:
		'Outro indicador já usa essa chave no comparador. Escolha outra.',
	file_type_not_allowed:
		'Formato de arquivo não aceito. Envie imagem, PDF, planilha ou documento.',
	file_required: 'Escolha um arquivo para enviar.',
	unsafe_url_scheme: 'Link inválido. Use um endereço que comece com https://',
	chat_rate_limited:
		'Você está enviando rápido demais. Aguarde alguns segundos.',
	raiox_final_locked:
		'O Raio-X final é liberado no último encontro da jornada.',
	foto_zero_missing:
		'Complete o diagnóstico inicial (Foto Zero) antes de gerar o relatório.',
	mentoria_tools_locked:
		'As ferramentas estão em atualização pelo seu mentor. Volte em breve.',
	journey_not_active: 'Sua jornada não está ativa.',
	meeting_locked: 'Este encontro ainda está bloqueado.',
	due_date_in_past: 'O prazo já passou. Ajuste a data para reabrir a tarefa.',
	task_not_done: 'A tarefa ainda não foi concluída.',
};

/** Mensagem amigável para o erro da API, ou `fallback`. */
export function mntErrorText(e: unknown, fallback: string): string {
	const code = apiErrorCode(e);
	if (code && STUDENT_ERRORS[code]) return STUDENT_ERRORS[code];
	const status = (e as { response?: { status?: number } } | null)?.response
		?.status;
	if (status === 413) return 'Arquivo grande demais (máx. 50 MB).';
	return fallback;
}

/** `details` do erro da API (ex.: `{ missing: [...] }`), quando houver. */
export function apiErrorDetails(e: unknown): Record<string, unknown> | null {
	if (typeof e === 'object' && e !== null && 'response' in e) {
		const details = (e as { response?: { data?: { details?: unknown } } })
			.response?.data?.details;
		return details && typeof details === 'object'
			? (details as Record<string, unknown>)
			: null;
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

/** Falha ao carregar o bootstrap (api fora do ar) — não é falta de matrícula. */
export function LoadErrorState({ onRetry }: { onRetry: () => void }) {
	return (
		<EmptyState
			icon={AlertTriangle}
			title="Não foi possível carregar sua mentoria"
			description="Houve uma falha ao falar com o servidor. Tente novamente em instantes."
		>
			<button type="button" className={BTN_PRIMARY} onClick={onRetry}>
				Tentar novamente
			</button>
		</EmptyState>
	);
}

/**
 * Aluno com o plano e ainda sem turma: a compra não matricula — ele entra na
 * fila "Aguardando turma" do admin. Enquanto isso, só adianta a empresa.
 */
export function WaitingForCohortState({ hasCompany }: { hasCompany: boolean }) {
	return (
		<EmptyState
			title="Você está na fila da próxima turma"
			description="Sua jornada aparece aqui quando a turma abrir."
		>
			<Link href={MENTORIA_SETTINGS} className={BTN_PRIMARY}>
				{hasCompany ? 'Configurações da empresa' : 'Cadastrar empresa'}
			</Link>
		</EmptyState>
	);
}

/**
 * Garante que o aluno tem uma jornada ativa antes de renderizar a tela.
 * Sem jornada → "fila da próxima turma" (o plano já foi checado no layout).
 */
export function JourneyGate({
	children,
}: {
	children: (ctx: {
		journeyId: string;
		bootstrap: MentoriaBootstrap;
	}) => ReactNode;
}) {
	const { data, isLoading, isError, refetch } = useMentoriaBootstrap();

	if (isLoading) return <MntSkeleton />;

	// Falha de carregamento NÃO é falta de matrícula. Falta de plano também não:
	// o 403 do gate já foi capturado pelo `MentoriaAccessGate`, no layout, e nem
	// chega aqui. Então um erro neste ponto é a api fora do ar — mandar cadastrar
	// a empresa seria mentir sobre a causa, e a rota de cadastro falharia igual.
	// `&& !data`: com o bootstrap em cache, um refetch que falha (reconnect,
	// invalidação) não pode trocar a página inteira — e descartar formulários
	// em edição — pelo aviso.
	if (isError && !data) return <LoadErrorState onRetry={() => refetch()} />;

	if (!data?.journey) {
		return <WaitingForCohortState hasCompany={!!data?.company} />;
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
