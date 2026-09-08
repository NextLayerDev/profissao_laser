'use client';

import { AlertTriangle, Check, Loader2, Store } from 'lucide-react';
import { useDeclaracao } from '../hooks/use-licensed-seller';
import { EcommercesEditor } from './ecommerces-editor';

/**
 * "ONDE EU VENDO" DENTRO DO PERFIL — uma seção, não uma ferramenta.
 *
 * Fica na mesma pilha do avatar, do banner e de "Minha marca" porque é a mesma
 * natureza de dado: cadastro do aluno, preenchido uma vez, usado por quem
 * precisar. O pedido foi literal — salvar junto com a marca, pedir uma vez só,
 * e ainda assim mostrar na ferramenta.
 *
 * ┌─ O QUE ESTA SEÇÃO NÃO COMPARTILHA COM "MINHA MARCA" ────────────────────┐
 * │ A vizinha é OPCIONAL de verdade: quem não configura vê um convite e      │
 * │ nada mais — nenhum aviso, nenhuma pendência, e toda ferramenta continua  │
 * │ funcionando.                                                             │
 * │                                                                          │
 * │ Esta é OBRIGATÓRIA para a Arte Licenciada, e por isso mostra pendência   │
 * │ quando está incompleta. Esconder o estado seria deixar a pessoa          │
 * │ descobrir a regra só quando a geração falhasse.                          │
 * │                                                                          │
 * │ Mas a pendência é do escopo certo: ela diz "a Arte Licenciada precisa    │
 * │ disto", não "o seu perfil está errado". Quem nunca vai usar arte         │
 * │ licenciada não tem nada pendente aqui.                                   │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

const cardClass =
	'bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-6';

export function PerfilEcommercesSection() {
	const { data: declaracao, isLoading, isError } = useDeclaracao();

	/**
	 * Falha de leitura NÃO vira cartão de erro no meio do perfil.
	 *
	 * Mesma regra da seção da marca, e pelo mesmo motivo: esta página é de todo
	 * aluno logado, e um bloco vermelho por um problema nosso é pior do que
	 * seção nenhuma. O motor continua sendo quem barra a geração.
	 */
	if (isError) return null;

	return (
		<section id="ecommerces" className={`${cardClass} scroll-mt-24`}>
			<h3 className="mb-1 flex flex-wrap items-center gap-2 font-display text-base font-bold text-slate-900 dark:text-white">
				<Store className="h-4 w-4 text-violet-500" />
				Onde eu vendo
				<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-white/10 dark:text-slate-400">
					Arte Licenciada
				</span>
				{declaracao &&
					(declaracao.ok ? (
						<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
							<Check className="h-3 w-3" />
							Em dia
						</span>
					) : (
						<span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
							<AlertTriangle className="h-3 w-3" />
							Pendente
						</span>
					))}
			</h3>
			<p className="mb-4 text-sm text-slate-500 dark:text-gray-400">
				Informe os canais onde você vende e aceite o termo do licenciamento.
				Você preenche uma vez e fica salvo aqui — a Arte Licenciada só gera peça
				de marca depois disso.
			</p>

			{isLoading ? (
				<div className="flex items-center justify-center py-6">
					<Loader2 className="h-5 w-5 animate-spin text-slate-400" />
				</div>
			) : declaracao ? (
				<EcommercesEditor declaracao={declaracao} variante="perfil" />
			) : null}
		</section>
	);
}
