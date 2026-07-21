import { type KbSourceKind, KIND_LABELS } from '@/types/ai-knowledge';
import { kindColor } from './kind-colors';

/**
 * Rótulo de origem, no formato de pílula que o resto do sistema usa.
 *
 * A cor vem do mesmo mapa da faixa "O que ele já estudou" lá em cima — então o
 * olho liga a linha da tabela ao pedaço do topo sem ninguém explicar. É por isso
 * que o fundo/texto são derivados do hex da origem em vez de classes soltas:
 * uma pílula por origem escolhida à mão viraria um arco-íris sem relação com o
 * gráfico.
 */
export function KindBadge({ kind }: { kind: KbSourceKind }) {
	const c = kindColor(kind);
	return (
		<span
			className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5"
			style={{ '--k-l': c.light, '--k-d': c.dark } as React.CSSProperties}
		>
			<span
				aria-hidden
				className="w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--k-l)] dark:bg-[var(--k-d)]"
			/>
			{KIND_LABELS[kind]}
		</span>
	);
}
