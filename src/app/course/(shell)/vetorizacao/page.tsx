'use client';

import { VetorizacaoView } from '@/components/vetorizacao/vetorizacao-view';

export default function VetorizacaoCoursePage() {
	// Ferramenta abre pra todo aluno, com ou sem plano. A trava é o USO:
	// `useToolBilling` cobra voxxys e barra por saldo insuficiente.
	return <VetorizacaoView />;
}
