'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type {
	Declaracao,
	StatusDaDeclaracao,
} from '../services/licensed-seller.service';
import { EcommercesEditor } from './ecommerces-editor';
import { MONO } from './licenciada-ui';

/**
 * O PORTÃO DO VENDEDOR, na tela da ferramenta.
 *
 * O cadastro mora no PERFIL — é lá que se preenche uma vez e esquece, ao lado
 * de "Minha marca". Este portão existe para quem chegou aqui sem ter passado
 * por lá: em vez de mandar a pessoa procurar uma tela, ele resolve no lugar e
 * aponta onde aquilo fica guardado, para a segunda vez ela saber.
 *
 * Cobre a aba "Criar" e NÃO a ferramenta inteira: quem já gerou continua
 * alcançando as próprias peças pela aba "Minhas peças". O QR delas pode estar
 * gravado num chaveiro que já saiu daqui, e trancar a biblioteca seria punir o
 * aluno por uma regra que nasceu depois.
 *
 * Uma tela só para os quatro motivos, e o que muda é a frase. Quatro telas
 * repetiriam o mesmo formulário; uma frase genérica deixaria o aluno
 * adivinhando qual botão apertar.
 */

const MOTIVO: Record<StatusDaDeclaracao, string> = {
	sem_canal:
		'Para gerar arte de marca, informe onde você vende. É o que a plataforma leva ao licenciante junto com a contagem de peças.',
	termo_pendente:
		'Falta ler e aceitar o termo abaixo. Ele é a declaração que acompanha o seu cadastro.',
	lista_mudou:
		'Sua lista de canais mudou depois do último aceite. Confirme o termo de novo — ele declara os canais que estão na lista hoje.',
	termo_mudou:
		'O termo de uso do licenciamento foi atualizado. Leia a nova redação e aceite para continuar.',
	ok: '',
};

export function LicensedSellerGate({ declaracao }: { declaracao: Declaracao }) {
	return (
		<div className="mx-auto max-w-2xl space-y-6 py-4">
			<header className="space-y-2">
				<p className={`${MONO} text-[var(--al-mute)]`}>
					Antes de gerar — cadastro do vendedor
				</p>
				<h2 className="font-display text-xl font-bold tracking-[-0.01em] text-[var(--al-ink)]">
					Onde você vende?
				</h2>
				<p className="text-sm leading-relaxed text-[var(--al-mute)]">
					{MOTIVO[declaracao.status]}
				</p>
			</header>

			<section className="rounded-lg border border-[var(--al-rule)] bg-[var(--al-card)] p-4">
				<EcommercesEditor declaracao={declaracao} variante="licenciada" />
			</section>

			{/* Onde isso fica guardado. Dito uma vez, para a segunda vez a pessoa
			    ir direto — o cadastro é do perfil, não desta ferramenta. */}
			<p className={`${MONO} text-center text-[var(--al-mute)]`}>
				Fica salvo no seu perfil.{' '}
				<Link
					href="/course/perfil#ecommerces"
					className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-[var(--al-ink)]"
				>
					Ver no perfil
					<ExternalLink className="h-3 w-3" />
				</Link>
			</p>
		</div>
	);
}
