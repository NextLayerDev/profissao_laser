'use client';

import { CanvaView } from '@/components/canva/canva-view';

export default function CanvaCoursePage() {
	// Ferramenta abre pra todo aluno, com ou sem plano. A trava é o USO:
	// `useToolBilling` cobra voxxys e barra por saldo insuficiente.
	return <CanvaView />;
}
