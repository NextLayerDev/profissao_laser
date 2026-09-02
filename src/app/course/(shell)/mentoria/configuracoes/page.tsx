'use client';

// Configurações da Mentoria 360°.
//
// Nasceu para dar um lugar próprio ao cadastro da empresa. Antes o formulário
// aparecia em dois pontos da home: inline no bloqueio "sem turma" e atrás de um
// toggle no cabeçalho do dashboard — a mesma tela em dois estados, e nenhum dos
// dois com URL própria. Aqui ele tem rota, e os dois pontos viraram um link.
//
// É a única entrada da navegação que não está em MENTORIA_SECTIONS: aquela
// lista é a jornada do aluno, e configuração não é etapa de jornada. Por isso o
// botão mora separado, abaixo do divisor, em `mentoria-nav-card.tsx`.

import { Settings } from 'lucide-react';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { useMentoriaBootstrap } from '@/modules/mentoria/hooks';
import { CompanyForm } from '../_components/company-form';
import { MntHeader, MntSkeleton } from '../_components/shared';

export default function MentoriaConfiguracoesPage() {
	return (
		<SubscriptionGate toolKey="mentoria_360">
			<ConfiguracoesContent />
		</SubscriptionGate>
	);
}

function ConfiguracoesContent() {
	// Sem JourneyGate de propósito: cadastrar a empresa é justamente o que o
	// aluno faz ANTES da matrícula sair. Exigir jornada aqui trancaria a porta
	// para quem o bloqueio da home acabou de mandar para cá.
	const { data, isLoading } = useMentoriaBootstrap();

	if (isLoading) return <MntSkeleton />;

	return (
		<div className="max-w-3xl">
			<MntHeader
				title="Configurações"
				subtitle="Dados da sua empresa na Mentoria 360°"
				icon={Settings}
			/>
			<CompanyForm company={data?.company ?? null} />
		</div>
	);
}
