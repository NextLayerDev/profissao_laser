'use client';

import { PreviasView } from '@/components/previas/previas-view';

export default function PreviasCoursePage() {
	// Ferramenta abre pra todo aluno, com ou sem plano. A trava é o USO:
	// `useToolBilling` cobra voxxys e barra por saldo insuficiente.
	return <PreviasView />;
}
