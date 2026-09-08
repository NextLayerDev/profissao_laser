'use client';

import { type Transition, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * O vocabulário visual da Arte Licenciada — paleta, versalete, movimento e as
 * peças de "documento" que as telas repetem.
 *
 * Estava copiado entre a tela da ferramenta e a biblioteca: a mesma paleta duas
 * vezes, a mesma string de versalete três vezes e a mesma linha pontilhada em
 * três marcações. Duas cópias não são um problema; a terceira é quando elas
 * começam a divergir sem ninguém perceber.
 *
 * O que NÃO entra aqui: a página pública `/a/[code]`. Ela é outro sistema de
 * propósito — documento transacional da UpVox (violeta sobre lavanda) para um
 * estranho que escaneou um chaveiro, não a bancada do aluno. Ela repete
 * a mesma string de versalete, e é para continuar repetindo: acoplar uma rota
 * pública ao módulo de ferramentas para poupar uma linha seria a dependência
 * errada.
 */

/**
 * Paleta das telas da ferramenta.
 *
 * Acromática de propósito: os escudos trazem cor conflitante entre clubes, e a
 * única cor destas telas vem da marca. Acromático, porém, não quer dizer
 * escuro — a paleta ACOMPANHA o tema do app, como o resto de `/course`. Fixa no
 * escuro, ela era a única tela da área do aluno que aparecia como um bloco
 * preto dentro de um shell claro.
 *
 * Vai como classe, e não como `style`: estilo inline não tem variante, e é a
 * variante `dark:` que dá as duas versões. Ela também respeita o `.room-light`
 * do `globals.css`, então uma tela marcada como clara continua clara mesmo com
 * o app no escuro.
 */
export const TEMA_LICENCIADA = [
	'[--al-ground:#f8fafc] dark:[--al-ground:#14161a]',
	'[--al-card:#ffffff] dark:[--al-card:#1b1e24]',
	'[--al-rule:#e2e8f0] dark:[--al-rule:#2a2f38]',
	'[--al-ink:#0f172a] dark:[--al-ink:#e8eaed]',
	'[--al-mute:#64748b] dark:[--al-mute:#8c94a1]',
	// O verde escurece no claro: #1f9d5b sobre branco não sustenta versalete de
	// 11px. Mesma leitura, contraste que serve aos dois fundos.
	'[--al-seal:#15803d] dark:[--al-seal:#1f9d5b]',
	// O "poço": o vão atrás da prévia e da caixa do código, um degrau abaixo do
	// cartão.
	'[--al-poco:#f1f5f9] dark:[--al-poco:#101216]',
	// Fundo do campo do escudo quando a marca não tem cor cadastrada.
	'[--al-campo:#e2e8f0] dark:[--al-campo:#22262e]',
].join(' ');

/**
 * O campo do escudo sem cor de marca. É `var()` e não hex porque entra por
 * `style` (a cor da marca é dado, não classe) e precisa dos dois temas.
 */
export const CAMPO_NEUTRO = 'var(--al-campo)';

/** O versalete de etiqueta: rótulos, contagens e selos. */
export const MONO =
	'font-mono text-[11px] uppercase tracking-[0.16em] leading-none';

/* ─────────────────────── O vocabulário de movimento ─────────────────────── */

/**
 * A ferramenta tem dois gestos, e só dois.
 *
 * `SUAVE` é o pouso: entra depressa e assenta devagar, sem frear. Serve a tudo
 * que aparece — cartão, linha, painel.
 *
 * `CARIMBO` é a prensa: uma mola curta com um respingo de overshoot. Serve ao
 * que ATESTA — o selo de licença ativa, o check de um passo concluído, o lacre
 * da página pública. Usar o carimbo em coisa que não atesta gasta o gesto.
 *
 * Vivem aqui porque estavam soltos: a curva nasceu no painel do código, o
 * spring na página do QR, e cada tela nova reinventaria os dois com números
 * ligeiramente diferentes — que é como um produto passa a ter cinco animações
 * parecidas e nenhuma igual.
 */
export const SUAVE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const CARIMBO: Transition = {
	type: 'spring',
	stiffness: 460,
	damping: 24,
};

/** Durações, em segundos. Acima de ~0.45 s a interface começa a parecer lenta. */
export const DURACAO = {
	/** Resposta a um clique: o empurrão do download, o pop de um ícone. */
	toque: 0.13,
	rapida: 0.24,
	media: 0.3,
	cartao: 0.42,
};

/** Intervalo entre irmãos numa grade. 40 ms: perceptível sem virar fila. */
export const STAGGER = 0.04;

/**
 * `true` quando pode animar.
 *
 * `useReducedMotion` devolve `null` antes de medir, e `!null` é `true` — o
 * padrão certo: anima por omissão e desliga assim que a preferência do sistema
 * é conhecida.
 */
export function useAnimar(): boolean {
	return !useReducedMotion();
}

/** `initial` de entrada, ou `false` quando o movimento está desligado. */
export function entrada(animar: boolean, y = 8) {
	return animar ? { opacity: 0, y } : false;
}

/**
 * `RÓTULO ····· VALOR` — o bloco de dados de um certificado.
 *
 * Lê as cores de `TEMA_LICENCIADA`, então só funciona dentro de uma árvore que
 * a aplique.
 */
export function LinhaDeRegistro({
	rotulo,
	children,
}: {
	rotulo: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="flex items-baseline gap-2">
			<span className={`${MONO} shrink-0 text-[var(--al-mute)]`}>{rotulo}</span>
			<span
				aria-hidden
				className="min-w-3 flex-1 -translate-y-[3px] border-b border-dotted border-[var(--al-rule)]"
			/>
			<span className={`${MONO} shrink-0 text-[var(--al-ink)]`}>
				{children}
			</span>
		</div>
	);
}

/** "LICENÇA ATIVA" — palavra primeiro, cor depois (não dá para ler só a cor). */
export function SeloAtivo() {
	return (
		<span className={`${MONO} inline-flex items-center gap-1.5`}>
			<span
				aria-hidden
				className="h-1.5 w-1.5 rounded-full bg-[var(--al-seal)]"
			/>
			<span className="text-[var(--al-seal)]">Licença ativa</span>
		</span>
	);
}

/* ─────────────────────────── Enquanto carrega ─────────────────────────── */

/**
 * Bloco de espera na paleta da ferramenta.
 *
 * Não reaproveita o `Skeleton` de `components/ui`: aquele traz o cinza do app
 * cravado no componente, e aqui o bloco tem de sair de `--al-rule` para
 * acompanhar a superfície em que caiu — que muda com o tema e com a moldura de
 * quem hospeda a biblioteca.
 */
export function Esqueleto({ className = '' }: { className?: string }) {
	return (
		<div className={`animate-pulse rounded bg-[var(--al-rule)] ${className}`} />
	);
}

/**
 * A espera tem a FORMA do resultado — a mesma proporção de campo de escudo e as
 * mesmas duas linhas de rodapé. Um spinner solto no meio da tela não diz o que
 * está vindo, e o layout salta inteiro quando os cards chegam.
 */
export function CartaoEsqueleto() {
	return (
		<div className="overflow-hidden rounded-lg border border-[var(--al-rule)] bg-[var(--al-card)]">
			<div className="aspect-[4/3] animate-pulse bg-[var(--al-rule)]/40" />
			<div className="space-y-2.5 border-t border-[var(--al-rule)] px-4 py-3">
				<Esqueleto className="h-3.5 w-2/3" />
				<Esqueleto className="h-2.5 w-1/2" />
			</div>
		</div>
	);
}

export function GradeDeEsqueletos({ quantidade = 3 }: { quantidade?: number }) {
	return (
		<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: quantidade }, (_, i) => (
				<CartaoEsqueleto key={`esqueleto-${i}`} />
			))}
		</div>
	);
}

/* ──────────────────────────── Quando falha ──────────────────────────── */

/**
 * A distinção que esta tela precisa fazer, e é a mesma da página pública: NÃO
 * TER nada é diferente de NÃO CONSEGUIR SABER. Sem este estado, uma marca que
 * não carregou por falha de rede aparecia como "nenhuma marca liberada" — a
 * tela dizendo ao aluno que ele não tem licença quando o que houve foi um 500.
 */
export function FalhaAoCarregar({
	titulo,
	children,
}: {
	titulo: string;
	children: ReactNode;
}) {
	return (
		<div className="rounded-lg border border-red-500/30 bg-red-500/5 px-6 py-16 text-center">
			<p className="font-display text-lg font-bold text-red-700 dark:text-red-300">
				{titulo}
			</p>
			<p className="mx-auto mt-1 max-w-sm text-sm text-[var(--al-mute)]">
				{children}
			</p>
		</div>
	);
}
