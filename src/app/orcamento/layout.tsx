import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * O link de orçamento é do PROFISSIONAL, não nosso: ele decide para quem manda.
 * Um slug indexado pelo Google entregaria a página (e o cardápio de materiais
 * dele) para quem nunca recebeu o link — inclusive o concorrente. `noindex` é a
 * configuração correta, e o único lugar onde dá para declará-la é um layout,
 * porque a página em si é client component e não exporta `metadata`.
 */
export const metadata: Metadata = {
	title: 'Orçamento',
	robots: { index: false, follow: false },
};

export default function OrcamentoLayout({ children }: { children: ReactNode }) {
	// Sem shell: nada de sidebar, header do app ou paleta de comandos. Quem abre
	// isto não é aluno — não pode nem suspeitar que existe um app por trás.
	return <>{children}</>;
}
