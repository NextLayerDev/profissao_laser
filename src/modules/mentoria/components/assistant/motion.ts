// Tempo compartilhado entre o painel do Assistente e a grade que o abriga.
//
// Os dois animam JUNTOS: a faixa da terceira coluna abre enquanto o card
// desliza para dentro dela. Se as curvas divergirem, o card escorrega dentro da
// própria coluna — chega antes da faixa ou fica para trás. Por isso os dois
// lados leem daqui em vez de repetir os números.

/** `ease-out-expo`: arranca rápido e desacelera longo. É o que faz a coluna
 *  parecer assentar em vez de bater no fim do percurso. */
export const ASSISTANT_EASE = [0.22, 1, 0.36, 1] as const;

/** Segundos. */
export const ASSISTANT_DURATION = 0.42;

/** `prefers-reduced-motion`: fade curto, sem deslize e sem faixa animada. */
export const ASSISTANT_DURATION_REDUCED = 0.15;

/** Largura do card no `xl`, em px. A grade precisa do número para dimensionar a
 *  faixa, e o card precisa dele fixo para não reflowar o texto enquanto a faixa
 *  encolhe no fechamento. */
export const ASSISTANT_WIDTH = 360;

/** Respiro entre o conteúdo e o painel, em px — o mesmo 24px de `gap-6` do
 *  resto da grade, mas embutido na faixa da coluna. O porquê está no
 *  `mentoria-shell.tsx`. */
export const ASSISTANT_GUTTER = 24;

/** Valor da faixa da terceira coluna, aberta ou fechada. Fechada é `0px`, e não
 *  a ausência da faixa: só dá para interpolar `grid-template-columns` entre
 *  listas com o MESMO número de faixas. */
export function assistantTrack(open: boolean) {
	return open ? `${ASSISTANT_WIDTH + ASSISTANT_GUTTER}px` : '0px';
}
