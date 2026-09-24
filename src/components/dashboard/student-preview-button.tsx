'use client';

import { GraduationCap, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStartStudentPreview } from '@/hooks/use-student-preview';

/**
 * "Visão Aluno" — abre a área do aluno com TUDO desbloqueado (todos os cursos
 * publicados, todas as ferramentas, voxxys ∞), sem trocar de conta: quem entra
 * continua sendo a própria staff, só que o backend passa a tratá-la como aluno
 * ilimitado por algumas horas.
 *
 * O `await` antes do `push` é o que evita a /course pintar um frame ainda
 * bloqueado: a mutation só resolve depois de invalidar os entitlements.
 */
export function StudentPreviewButton({
	variant = 'bar',
}: {
	/** `bar` = top bar do admin; `drawer` = menu mobile (largura cheia). */
	variant?: 'bar' | 'drawer';
}) {
	const router = useRouter();
	const start = useStartStudentPreview();

	const enter = async () => {
		try {
			await start.mutateAsync(undefined);
			router.push('/course');
		} catch {
			// o toast de erro já sai do hook
		}
	};

	const base =
		'flex items-center gap-1.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed';
	const skin =
		'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/50 border border-violet-200/70 dark:border-violet-800/50';

	return (
		<button
			type="button"
			onClick={enter}
			disabled={start.isPending}
			title="Ver a plataforma como um aluno, com tudo desbloqueado"
			className={
				variant === 'drawer'
					? `${base} ${skin} w-full justify-center h-9 px-3`
					: `${base} ${skin} h-9 px-2.5 shrink-0`
			}
		>
			{start.isPending ? (
				<Loader2 className="w-4 h-4 shrink-0 animate-spin" />
			) : (
				<GraduationCap className="w-4 h-4 shrink-0" />
			)}
			<span className={variant === 'drawer' ? '' : 'hidden xl:inline'}>
				Visão Aluno
			</span>
		</button>
	);
}
