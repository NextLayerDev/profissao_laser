import { z } from 'zod';
import { api } from '@/lib/fetch';
import {
	MOCK_LICENCIADA,
	mockCreateBrand,
	mockDeleteBrand,
	mockListBrands,
	mockUpdateBrand,
} from '../mocks/licensed-art.mock';

/**
 * Marcas licenciadas — o cadastro do escudo, do mascote e do nome público de
 * cada clube ou marca.
 *
 * Existe separado do Banco do Admin porque a arte pertence à MARCA e não ao
 * prompt: um clube com caneca, capinha e chaveiro precisa de UM cadastro, e
 * trocar a arte oficial tem de atualizar todos os prompts de uma vez.
 *
 * Fala com a MAIN API (`api` / `NEXT_PUBLIC_GATEWAY_URL`), em
 * `/api/licensed-brands`. Escrita é multipart (os arquivos de arte).
 */

export const licensedBrandSchema = z.object({
	id: z.string(),
	feature_key: z.string(),
	display_name: z.string(),
	crest_url: z.string().nullable(),
	mascot_url: z.string().nullable(),
	// Opcional: a coluna é nova e a API pode responder sem ela.
	accent_color: z.string().nullable().optional(),
	active: z.boolean(),
	notes: z.string().nullable(),
	created_at: z.string(),
	updated_at: z.string(),
});
export type LicensedBrand = z.infer<typeof licensedBrandSchema>;

/**
 * A gramática da chave, repetida aqui de propósito: barrar no formulário evita
 * uma marca fantasma que nunca resolve — e a chave é a única coisa do cadastro
 * que NÃO pode ser renomeada depois de emitida, porque renomear quebra todo QR
 * já gravado em peça física.
 */
export const FEATURE_KEY_RE = /^[a-z0-9]+:[a-z0-9-]+$/;

export async function listLicensedBrands(): Promise<LicensedBrand[]> {
	if (MOCK_LICENCIADA) return mockListBrands();
	const { data } = await api.get('/api/licensed-brands');
	return z.array(licensedBrandSchema).parse(data);
}

export interface SalvarMarcaInput {
	feature_key: string;
	display_name: string;
	active: boolean;
	/** Hex `#rrggbb` da cor oficial da marca. Vazio = cinza neutro. */
	accent_color?: string;
	notes?: string;
	crest?: File | null;
	mascot?: File | null;
	removeMascot?: boolean;
}

function toFormData(input: SalvarMarcaInput): FormData {
	const fd = new FormData();
	fd.append('feature_key', input.feature_key.trim().toLowerCase());
	fd.append('display_name', input.display_name.trim());
	fd.append('active', String(input.active));
	if (input.accent_color !== undefined)
		fd.append('accent_color', input.accent_color);
	if (input.notes !== undefined) fd.append('notes', input.notes);
	// Arquivo só vai quando o staff escolheu um novo. O backend preserva o
	// anterior quando o campo não vem — salvar para trocar o nome não pode
	// apagar o escudo.
	if (input.crest) fd.append('crest', input.crest);
	if (input.mascot) fd.append('mascot', input.mascot);
	if (input.removeMascot) fd.append('removeMascot', 'true');
	return fd;
}

export async function createLicensedBrand(
	input: SalvarMarcaInput,
): Promise<LicensedBrand> {
	if (MOCK_LICENCIADA) return mockCreateBrand(input);
	const { data } = await api.post('/api/licensed-brands', toFormData(input));
	return licensedBrandSchema.parse(data);
}

export async function updateLicensedBrand(
	id: string,
	input: SalvarMarcaInput,
): Promise<LicensedBrand> {
	if (MOCK_LICENCIADA) return mockUpdateBrand(id, input);
	const { data } = await api.patch(
		`/api/licensed-brands/${id}`,
		toFormData(input),
	);
	return licensedBrandSchema.parse(data);
}

export async function deleteLicensedBrand(id: string): Promise<void> {
	if (MOCK_LICENCIADA) return mockDeleteBrand(id);
	await api.delete(`/api/licensed-brands/${id}`);
}
