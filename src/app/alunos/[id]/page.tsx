'use client';

import { ArrowLeft, Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { StudentDetailView } from '@/components/alunos/student-detail-view';
import { Header } from '@/components/dashboard/header';
import { useStudent } from '@/hooks/use-students';
import { usePermissions } from '@/modules/access';

export default function AlunoDetalhe() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const { can, isLoading: loadingPerms } = usePermissions();
	const allowed = can('alunos.view');

	useEffect(() => {
		if (!loadingPerms && !allowed) {
			router.replace('/dashboard');
		}
	}, [allowed, loadingPerms, router]);

	const { data, isLoading, error } = useStudent(allowed ? id : '');

	if (loadingPerms || !allowed) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-slate-600 dark:text-gray-400">A carregar...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />

			<main className="max-w-5xl mx-auto px-4 md:px-8 py-6">
				<Link
					href="/alunos"
					className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6"
				>
					<ArrowLeft className="w-4 h-4" />
					Voltar aos alunos
				</Link>

				{isLoading ? (
					<div className="flex justify-center py-20">
						<Loader2 className="w-8 h-8 animate-spin text-violet-500" />
					</div>
				) : error ? (
					<div className="text-center py-20">
						<Users className="w-10 h-10 text-slate-400 mx-auto mb-4" />
						<p className="text-slate-600 dark:text-gray-400 font-medium">
							Erro ao carregar aluno
						</p>
					</div>
				) : !data ? (
					<div className="text-center py-20">
						<Users className="w-10 h-10 text-slate-400 mx-auto mb-4" />
						<p className="text-slate-600 dark:text-gray-400 font-medium">
							Aluno não encontrado
						</p>
					</div>
				) : (
					<StudentDetailView student={data} />
				)}
			</main>
		</div>
	);
}
