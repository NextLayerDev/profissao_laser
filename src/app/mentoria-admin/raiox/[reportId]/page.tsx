'use client';

// PDF do Raio-X na visão 360° do mentor: mesma folha do aluno, lida pela rota
// do mentor (a API checa se ele é da turma). "Voltar" leva à jornada.

import { useParams } from 'next/navigation';
import { RaioxSheet } from '@/app/course/(shell)/mentoria/evolucao/_components/raiox-sheet';
import { useMentorReport } from '../../_components/admin-hooks';

export default function MentorRaioxPdfPage() {
	const { reportId } = useParams<{ reportId: string }>();
	const report = useMentorReport(reportId);
	return (
		<RaioxSheet
			report={report.data}
			loading={report.isLoading}
			error={report.isError}
			backHref={
				report.data
					? `/mentoria-admin/jornada/${report.data.journey_id}#evolucao`
					: '/mentoria-admin'
			}
		/>
	);
}
