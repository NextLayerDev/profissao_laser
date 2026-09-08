'use client';

import { BibliotecaVetoresView } from '@/components/biblioteca/biblioteca-vetores-view';

export default function BibliotecaCoursePage() {
	// Ferramenta abre pra todo aluno, com ou sem plano. A trava é o USO:
	// `useToolBilling` cobra voxxys e barra por saldo insuficiente.
	return <BibliotecaVetoresView />;
}
