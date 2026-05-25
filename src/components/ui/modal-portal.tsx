'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renderiza o conteúdo (overlay/modal `fixed`) direto no <body> via portal.
 *
 * Necessário porque o course shell aplica um `transform` no <main> (animação
 * fade-in-up), o que cria um containing block e faz `position: fixed` ancorar
 * no <main> (deslocado/rolado) em vez do viewport. O portal tira o modal de
 * dentro do <main>, garantindo centralização real no viewport.
 */
export function ModalPortal({ children }: { children: React.ReactNode }) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;
	return createPortal(children, document.body);
}
