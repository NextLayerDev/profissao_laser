'use client';

import { GravacaoOneClickView } from '@/components/gravacao-oneclick/gravacao-oneclick-view';

export default function GravacaoOneClickCoursePage() {
	// Ferramenta abre pra todo aluno, com ou sem plano. A trava é o USO:
	// `useToolBilling` cobra voxxys e barra por saldo insuficiente.
	return <GravacaoOneClickView />;
}
