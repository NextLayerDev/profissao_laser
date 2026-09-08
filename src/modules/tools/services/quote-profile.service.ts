import { z } from 'zod';
import { api } from '@/lib/fetch';

/**
 * O PERFIL CURTO — cliente das duas rotas que derrubam o paredão de 31 campos.
 *
 * `GET /api/quote/machines`  → os cards do passo 1 e os regimes fiscais
 * `POST /api/quote/profile`  → seis respostas entram, o cadastro inteiro sai
 *
 * NADA AQUI CALCULA NADA. A derivação (vida útil da máquina, hora do dono,
 * margem equivalente ao markup, imposto do regime) é do servidor — mesma regra
 * do resto desta ferramenta: dinheiro é código, e código de dinheiro mora num
 * lugar só. O navegador só pergunta e desenha a resposta.
 *
 * As duas rotas NÃO gravam e NÃO cobram. Quem grava é o endpoint genérico da
 * coleção (`createCollectionEntry`), com a validação e o `visibility:'owner'`
 * de sempre — uma segunda porta de gravação com regras próprias é exatamente o
 * tipo de atalho que depois ninguém audita.
 */

const maquinaSchema = z.object({
	id: z.string(),
	label: z.string(),
	laser: z.string(),
	potencia_w: z.number(),
});
export type MaquinaDeReferencia = z.infer<typeof maquinaSchema>;

const regimeSchema = z.object({
	id: z.string(),
	label: z.string(),
	imposto_pct: z.number(),
});
export type RegimeFiscal = z.infer<typeof regimeSchema>;

export const catalogoMaquinasSchema = z.object({
	machines: z.array(maquinaSchema),
	outra: z.string().default('outra'),
	regimes: z.array(regimeSchema).default([]),
	padroes: z
		.object({
			horas_uteis_dia: z.number().optional(),
			ganho_mensal: z.number().optional(),
			markup_pct: z.number().optional(),
			regime_fiscal: z.string().optional(),
			pedido_minimo: z.number().optional(),
		})
		.default({}),
});
export type CatalogoMaquinas = z.infer<typeof catalogoMaquinasSchema>;

/**
 * Um campo que o aluno NÃO respondeu e o sistema preencheu por ele.
 *
 * `origem` e `fonte` existem para a tela poder dizer DE ONDE veio cada número,
 * em português, ao lado do próprio número. Assumir em silêncio é o modo de
 * falha que já custou +46% de sobrepreço nesta ferramenta: um perfil "CO2
 * 100 W" com os derivados em branco herdava o padrão de uma fibra de 1500 W.
 */
export const assumidoSchema = z.object({
	campo: z.string(),
	label: z.string(),
	valor: z.union([z.string(), z.number()]),
	unidade: z.string().optional(),
	origem: z.enum(['resposta', 'maquina', 'calculo', 'padrao']),
	fonte: z.string(),
});
export type CampoAssumido = z.infer<typeof assumidoSchema>;

export const perfilDerivadoSchema = z.object({
	/** Registro COMPLETO da coleção `perfis` — pronto para o POST. */
	data: z.record(z.string(), z.unknown()),
	assumidos: z.array(assumidoSchema).default([]),
	maquina: z.string().default(''),
	maquina_classe: z.string().default('outra'),
	/** Os dois números que o dono da oficina reconhece e sabe contestar. */
	taxa_hora: z.number(),
	custo_hora_operador: z.number(),
});
export type PerfilDerivado = z.infer<typeof perfilDerivadoSchema>;

export interface RespostasCurtas {
	tool: string;
	maquina_classe?: string;
	horas_uteis_dia?: number;
	ganho_mensal?: number;
	markup_pct?: number;
	regime_fiscal?: string;
	pedido_minimo?: number;
	/** Derivados que o aluno corrigiu, na escala da COLEÇÃO (percentual 0–100). */
	overrides?: Record<string, string | number>;
}

export async function listQuoteMachines(): Promise<CatalogoMaquinas> {
	const { data } = await api.get('/api/quote/machines');
	return catalogoMaquinasSchema.parse(data);
}

export async function buildQuoteProfile(
	body: RespostasCurtas,
): Promise<PerfilDerivado> {
	const { data } = await api.post('/api/quote/profile', body);
	return perfilDerivadoSchema.parse(data);
}
