/**
 * Textos dos tooltips quando a staff não tem permissão para uma ação. Ações
 * ficam DESABILITADAS (não escondidas) para a pessoa entender por que não pode
 * e a quem pedir. Espelha o gate da API: POST/PATCH → suporte.edit,
 * DELETE → suporte.delete.
 */
export const NO_EDIT_HINT =
	'Você não tem permissão para alterar o conhecimento da IA. Peça a um administrador o acesso "Suporte → editar".';

export const NO_DELETE_HINT =
	'Você não tem permissão para excluir conhecimento. Peça a um administrador o acesso "Suporte → excluir".';
