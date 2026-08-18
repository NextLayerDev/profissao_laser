'use client';

import { GraduationCap, Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
	useStopStudentPreview,
	useStudentPreview,
} from '@/hooks/use-student-preview';

/** "2h 15min" / "45min" / "menos de 1min". */
function formatRemaining(ms: number): string {
	const totalMin = Math.floor(ms / 60_000);
	if (totalMin <= 0) return 'menos de 1min';
	const h = Math.floor(totalMin / 60);
	const m = totalMin % 60;
	if (h === 0) return `${m}min`;
	return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

/**
 * Faixa fixa no topo da área do aluno enquanto a staff está em Visão Aluno.
 *
 * Renderiza `null` fora da prévia — o layout só desloca o header/`<main>` quando
 * ela existe de verdade.
 */
export function StudentPreviewBanner() {
	const router = useRouter();
	const { active, msRemaining } = useStudentPreview();
	const stop = useStopStudentPreview();

	if (!active) return null;

	const expired = msRemaining <= 0;

	const leave = async () => {
		try {
			await stop.mutateAsync();
			router.push('/dashboard');
		} catch {
			// o toast de erro já sai do hook
		}
	};

	return (
		<div className="fixed top-0 left-0 right-0 h-10 z-40 flex items-center justify-center gap-3 px-3 bg-violet-600 text-white text-xs sm:text-sm">
			<GraduationCap className="w-4 h-4 shrink-0" />
			<span className="hidden sm:inline font-medium">
				Visão Aluno — você está vendo a plataforma como um aluno
			</span>
			<span className="tabular-nums opacity-90 shrink-0">
				{expired
					? 'Prévia expirada — recarregue'
					: `Sai em ${formatRemaining(msRemaining)}`}
			</span>
			<button
				type="button"
				onClick={leave}
				disabled={stop.isPending}
				className="ml-auto sm:ml-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-white/15 hover:bg-white/25 font-medium transition-colors disabled:opacity-60 shrink-0"
			>
				{stop.isPending ? (
					<Loader2 className="w-3.5 h-3.5 animate-spin" />
				) : (
					<LogOut className="w-3.5 h-3.5" />
				)}
				Sair da visão
			</button>
		</div>
	);
}
