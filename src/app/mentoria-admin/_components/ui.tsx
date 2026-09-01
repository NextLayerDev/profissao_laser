'use client';

// Primitivos visuais da área Mentoria 360° (admin + mentor).
//
// Vestidos com os tokens do design system (@upvox-dev/ui): `bg-surface`,
// `border-subtle`, `rounded-card`, `bg-brand`, `text-body`… São classes CSS
// normais — não trazem a camada React Native junto, então funcionam nos
// `<div>`/`<button>` que já estavam aqui.
//
// Os tokens resolvem claro e escuro sozinhos (o `.dark` deles mora em
// app/globals.css), e é por isso que quase todo par `dark:` sumiu deste
// arquivo. O que sobrou de `dark:` está comentado no ponto.
//
// A API é a mesma de antes: mesmos exports, mesmas props, mesmo DOM. Os 11
// arquivos que importam daqui não mudaram uma linha.
import { ArrowLeft, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

// Sem altura fixa (`h-control-md`) de propósito: esta string também veste
// `<textarea>` e `<select>`, e uma altura travada achataria os textareas.
// O foco pinta a borda em vez de desenhar anel — é o que o Figma desenha.
export const inputClass =
	'w-full rounded-control border border-subtle bg-surface px-3 py-2 text-body text-primary placeholder:text-muted focus:outline-none focus:border-focus disabled:bg-surface-sunken disabled:opacity-60';

export const primaryBtn =
	'inline-flex items-center gap-2 h-control-md px-field-md rounded-control text-label bg-brand hover:bg-brand-hover text-on-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const secondaryBtn =
	'inline-flex items-center gap-2 h-control-md px-field-md rounded-control text-label bg-surface border border-subtle text-primary hover:border-brand-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

// Mantido como contorno, não preenchido: no DS a variante `danger` é sólida,
// mas aqui o botão é uma ação secundária dentro de um card e virar um bloco
// vermelho mudaria o peso dele na tela — isso é comportamento, não pintura.
export const dangerBtn =
	'inline-flex items-center gap-2 h-control-md px-field-md rounded-control text-label border border-danger text-danger hover:bg-danger-wash transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export function Card({
	children,
	className = '',
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`rounded-card border border-subtle bg-surface ${className}`}
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
						className="inline-flex items-center gap-1.5 text-body text-muted hover:text-brand mb-2"
					>
						<ArrowLeft className="w-4 h-4" />
						Voltar
					</Link>
				)}
				<h2 className="text-page text-primary">{title}</h2>
				{description && (
					<p className="text-body text-muted mt-1 max-w-2xl">{description}</p>
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
			className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-overlay backdrop-blur-sm p-4 md:p-8"
			onClick={onClose}
			onKeyDown={(e) => e.key === 'Escape' && onClose()}
			role="presentation"
		>
			{/* `overflow-y-auto` no pai e `my-auto` aqui continuam iguais: é o que
			    faz o modal rolar quando o conteúdo passa da tela. O <Modal> do DS
			    não rola, e por isso não foi adotado nesta fatia. */}
			<div
				className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-card border border-subtle bg-surface shadow-overlay my-auto`}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
			>
				<div className="flex items-center justify-between px-5 py-4 border-b border-subtle">
					<h3 className="text-title text-primary">{title}</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded-chip text-muted hover:text-primary hover:bg-surface-sunken transition"
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
			<span className="block text-label text-secondary mb-1.5">
				{label}
				{required && <span className="text-danger ml-0.5">*</span>}
			</span>
			{children}
			{hint && <p className="text-caption text-muted mt-1">{hint}</p>}
		</div>
	);
}

export function Spinner({ label }: { label?: string }) {
	return (
		<div className="flex items-center justify-center gap-2 py-12 text-body text-muted">
			<Loader2 className="w-5 h-5 animate-spin" />
			{label ?? 'Carregando...'}
		</div>
	);
}

export function EmptyState({ message }: { message: string }) {
	return (
		<div className="py-12 text-center text-body text-muted">{message}</div>
	);
}

export function Badge({
	tone,
	children,
}: {
	tone: 'green' | 'amber' | 'red' | 'slate' | 'violet' | 'blue';
	children: ReactNode;
}) {
	// Fundo e borda vêm do DS; a cor do TEXTO não.
	//
	// Os tokens `*-wash` são rgba translúcido, então funcionam nos dois temas e
	// entram sem ressalva. Já `text-success`/`text-danger`/`text-brand` são
	// valores de modo claro — o DS não tem versão escura de nenhum deles, e no
	// dark ficariam ilegíveis (o `brand` #7c3aed sobre fundo preto, por
	// exemplo). Não dá para corrigir na paleta do globals.css porque o mesmo
	// token serve de FUNDO no botão primário, onde precisa continuar #7c3aed.
	//
	// É lacuna do design system, não escolha daqui: enquanto ele não tiver
	// tons semânticos de texto para o escuro, o par `dark:` fica.
	const tones: Record<string, string> = {
		green:
			'bg-success-wash text-emerald-600 dark:text-emerald-400 border-success/30',
		amber:
			'bg-warning-wash text-amber-600 dark:text-amber-400 border-warning/30',
		red: 'bg-danger-wash text-red-600 dark:text-red-400 border-danger/30',
		slate: 'bg-surface-sunken text-muted border-subtle',
		violet:
			'bg-brand-wash text-violet-600 dark:text-violet-400 border-brand/30',
		// `blue` não tem equivalente no DS. Deixado como está de propósito:
		// inventar um token de marca seria decisão de design, não de código.
		blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
	};
	return (
		<span
			className={`inline-flex items-center px-2 py-0.5 rounded-chip border text-caption ${tones[tone]}`}
		>
			{children}
		</span>
	);
}

export function ProgressBar({ pct }: { pct: number }) {
	const clamped = Math.max(0, Math.min(100, Math.round(pct)));
	return (
		<div className="flex items-center gap-2 min-w-32">
			{/* `bg-subtle` e não `bg-surface-sunken`: o trilho precisa contrastar
			    com o card, e no escuro o sunken é o fundo da página (some dentro
			    do card). O subtle é branco 10% — exatamente o que estava aqui. */}
			<div className="flex-1 h-2 rounded-full bg-subtle overflow-hidden">
				<div
					className="h-full rounded-full bg-brand transition-all"
					style={{ width: `${clamped}%` }}
				/>
			</div>
			<span className="text-caption tabular-nums text-muted w-9 text-right">
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
