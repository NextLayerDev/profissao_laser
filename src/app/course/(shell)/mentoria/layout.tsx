// Shell da área da Mentoria 360°: navegação em card à esquerda, conteúdo no
// meio, Assistente à direita, rodapé embaixo. No mobile tudo empilha.
//
// Este layout é o que dá à Mentoria uma casa própria dentro do shell do curso —
// antes cada página se virava com o próprio `p-4 md:p-8` e a navegação morava
// na sidebar global. A grade em si vive no `MentoriaShell`, que é client porque
// precisa guardar o estado do Assistente; aqui ficam só o padding e o rodapé.

import type { ReactNode } from 'react';
import { MentoriaShell } from './_components/mentoria-shell';

export default function MentoriaLayout({ children }: { children: ReactNode }) {
	return (
		<div className="p-4 md:p-8">
			<MentoriaShell>{children}</MentoriaShell>

			<footer className="mt-8 pt-6 border-t border-subtle text-center text-caption text-muted">
				© {new Date().getFullYear()} Profissão Laser — todos os direitos
				reservados.
			</footer>
		</div>
	);
}
