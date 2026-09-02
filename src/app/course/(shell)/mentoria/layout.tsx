// Shell da área da Mentoria 360°: navegação em card à esquerda, conteúdo à
// direita, rodapé embaixo. No mobile a navegação empilha acima do conteúdo.
//
// Este layout é o que dá à Mentoria uma casa própria dentro do shell do curso —
// antes cada página se virava com o próprio `p-4 md:p-8` e a navegação morava
// na sidebar global.

import type { ReactNode } from 'react';
import { MentoriaNavCard } from './_components/mentoria-nav-card';

export default function MentoriaLayout({ children }: { children: ReactNode }) {
	return (
		<div className="p-4 md:p-8">
			<div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6 items-start">
				<MentoriaNavCard />
				{/* `minmax(0,1fr)` acima e `min-w-0` aqui: sem os dois, uma tabela ou
				    um gráfico largo estica a coluna e força scroll horizontal na
				    página inteira em vez de rolar dentro do próprio container. */}
				<div className="min-w-0">{children}</div>
			</div>

			<footer className="mt-8 pt-6 border-t border-subtle text-center text-caption text-muted">
				© {new Date().getFullYear()} Profissão Laser — todos os direitos
				reservados.
			</footer>
		</div>
	);
}
