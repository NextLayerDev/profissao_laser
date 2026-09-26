'use client';

// Ícone "?" com a explicação que antes ocupava parágrafo na tela (pedido do
// dono: "hoje é muito texto"). Abre no hover, no foco do teclado e no toque;
// Esc ou toque fora fecham. O texto fica no DOM com `hidden`, então leitor de tela ainda o
// alcança via `aria-describedby`, mas ele não conta como texto visível.

import { HelpCircle } from 'lucide-react';
import { type ReactNode, useEffect, useId, useState } from 'react';

export function HelpTip({
	children,
	label = 'Ajuda',
	className = '',
}: {
	children: ReactNode;
	/** Nome acessível do botão. */
	label?: string;
	className?: string;
}) {
	const id = useId();
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false);
		};
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [open]);

	return (
		<span
			className={`relative inline-flex align-middle ${className}`}
			onMouseEnter={() => setOpen(true)}
			onMouseLeave={() => setOpen(false)}
		>
			<button
				type="button"
				aria-label={label}
				aria-describedby={id}
				aria-expanded={open}
				data-help-tip=""
				onClick={(e) => {
					// Dentro de card clicável o toque no "?" não pode navegar. Abre e
					// não alterna: o foco (e o hover emulado do toque) já abriu, e um
					// toggle fecharia na hora. Fecha no toque fora (blur) ou Esc.
					e.preventDefault();
					e.stopPropagation();
					setOpen(true);
				}}
				onFocus={() => setOpen(true)}
				onBlur={(e) => {
					// Foco indo para um link DENTRO do balão não fecha (senão o
					// clique no link some antes de acontecer).
					const next = e.relatedTarget as Node | null;
					if (!e.currentTarget.parentElement?.contains(next)) setOpen(false);
				}}
				className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
			>
				<HelpCircle className="h-4 w-4" aria-hidden />
			</button>
			{/* `pt-1` e não `mt-1`: sem vão entre o ícone e o balão, o mouse
			    atravessa sem disparar o mouseleave. */}
			<span
				id={id}
				role="tooltip"
				className={`${open ? 'block' : 'hidden'} absolute left-1/2 top-full z-40 w-64 max-w-[80vw] -translate-x-1/2 pt-1`}
			>
				<span className="block rounded-control border border-subtle bg-surface p-3 text-left text-caption font-normal normal-case tracking-normal text-secondary shadow-overlay">
					{children}
				</span>
			</span>
		</span>
	);
}
