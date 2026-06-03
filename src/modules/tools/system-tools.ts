/**
 * Catálogo (fonte de verdade no código) das FERRAMENTAS do sistema que podem ser
 * associadas a uma funcionalidade (linha em `tools`, com `vox_cost`) e cobradas
 * por uso. O `key` aqui é o mesmo `tool_key` usado no invoke/motor.
 *
 * - `engine`: tem trabalho no motor (main API) → invoke → motor(invocation_id) → settle.
 * - `consume`: só revela um dado ("abrir item") → 1 chamada atômica que debita+liquida.
 *
 * Uma ferramenta sem funcionalidade (ou que o plano não libera) roda LIVRE.
 * Para plugar uma ferramenta nova: adicione aqui + faça o wiring na view dela.
 */
export type SystemToolKind = 'engine' | 'consume';

export interface SystemTool {
	key: string;
	label: string;
	description: string;
	kind: SystemToolKind;
}

export const SYSTEM_TOOLS: SystemTool[] = [
	{
		key: 'vectorize',
		label: 'Vetorização',
		description: 'Converte uma imagem em vetor (SVG).',
		kind: 'engine',
	},
	{
		key: 'ai_canvas',
		label: 'AI Canvas',
		description: 'Edição/geração de imagem por IA no editor.',
		kind: 'engine',
	},
	{
		key: 'previa',
		label: 'Prévia IA',
		description: 'Geração de prévia de gravação por IA.',
		kind: 'engine',
	},
	{
		key: 'parametros',
		label: 'Parâmetros',
		description: 'Abrir os detalhes de um parâmetro de gravação.',
		kind: 'consume',
	},
];

export const systemToolFor = (key: string): SystemTool | undefined =>
	SYSTEM_TOOLS.find((t) => t.key === key);
