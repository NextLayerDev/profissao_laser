/**
 * Fornecedor — tool real do main API (`/fornecedores`). Substitui a leitura do
 * canal da comunidade. `content` é o markdown verbatim (🏢 Empresa / 📞 Contato /
 * 🛒 Produtos…) renderizado com linkificação na tela do aluno.
 */
export interface Fornecedor {
	id: string;
	company: string;
	content: string;
	imageUrl: string | null;
	authorName: string | null;
	authorAvatar: string | null;
	isActive: boolean;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreateFornecedorBody {
	company: string;
	content: string;
	imageUrl?: string | null;
	isActive?: boolean;
	order?: number;
}

export type UpdateFornecedorBody = Partial<CreateFornecedorBody>;
