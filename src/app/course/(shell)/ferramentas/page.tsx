'use client';

import { ToolsHub } from '@/components/tools/tools-hub';

/**
 * HUB de ferramentas do ALUNO (`/course/ferramentas`) — catálogo completo do que
 * o plano libera, fora do gargalo da sidebar (que só mostra os PINS). Vive no
 * shell do curso (route group `(shell)`) e abre pra todo aluno, com ou sem
 * plano — a trava é o USO de cada tool (voxxys), não a vitrine.
 */
export default function FerramentasCoursePage() {
	return (
		<div className="px-4 py-8 sm:px-6 md:px-8">
			<ToolsHub audience="student" />
		</div>
	);
}
