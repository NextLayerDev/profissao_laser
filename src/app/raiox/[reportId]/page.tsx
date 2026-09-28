'use client';

// PDF do Raio-X do aluno: fora do shell do curso (sem menu, nav nem
// Assistente) para a folha sair limpa. A API checa a posse do relatório.

import { useParams } from 'next/navigation';
import { RaioxSheet } from '@/app/course/(shell)/mentoria/evolucao/_components/raiox-sheet';
import { useReport } from '@/modules/mentoria/hooks';

export default function RaioxPdfPage() {
	const { reportId } = useParams<{ reportId: string }>();
	const report = useReport(reportId);
	return (
		<RaioxSheet
			report={report.data}
			loading={report.isLoading}
			error={report.isError}
			backHref="/course/mentoria/evolucao"
		/>
	);
}
