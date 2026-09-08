'use client';

import {
	CAMPO_MARCA,
	CAMPOS_DE_COR,
	CAMPOS_DE_COR_DO_LOGO,
	coresDoLogo,
	MARCA_COLLECTION,
	MARCA_TOOL_KEY,
	marcaDeDados,
	papeisDaPaleta,
} from '../../lib/marca';
import type { CollectionEntry } from '../../services/collections.service';
import {
	CollectionEntryForm,
	type CollectionFieldCtx,
	type CollectionFormCtx,
} from '../collection-entry-form';
import { CampoCor } from './campo-cor';
import { MarcaPreview } from './marca-preview';
import { PaletaDoLogo } from './paleta-do-logo';

/**
 * O CADASTRO DA MARCA — o formulário genérico com uma camada de carinho.
 *
 * Nada aqui reimplementa cadastro: validação, `showIf`, payload, visibilidade,
 * salvar e excluir continuam sendo do `CollectionEntryForm`, e os campos
 * continuam saindo de `collections.marca.fields` na definition (mexer na marca
 * segue sendo mexer em DADO, não em deploy). O que esta camada acrescenta é o
 * que transforma dez campos num cadastro que faz sentido:
 *
 *   • subir o logo JÁ preenche a cor principal e a de apoio;
 *   • cada cor vira um seletor de verdade, com as cores do logo a um clique;
 *   • a prévia mostra, enquanto ele digita, o que ele acabou de descrever.
 *
 * Campo que a definition não declarar simplesmente não aparece — inclusive os
 * de cor. A camada se adapta ao que existe, ela não exige.
 */
export function MarcaForm({
	entry,
	onClose,
	onSaved,
	onDeleted,
}: {
	entry?: CollectionEntry | null;
	onClose: () => void;
	onSaved?: (entry: CollectionEntry) => void;
	onDeleted?: (id: string) => void;
}) {
	/**
	 * Cores do último logo enviado — só do LOGO.
	 *
	 * A coleção tem duas imagens (`logo_url` e `exemplo_url`) e as duas voltam do
	 * servidor com paleta. Sem este teste, subir a peça de referência trocaria as
	 * amostras "do seu logo" pelas cores de um post que o aluno só achou bonito.
	 */
	const coresDe = (ctx: CollectionFormCtx) =>
		ctx.ultimaImagem?.field === CAMPO_MARCA.logo
			? coresDoLogo(ctx.ultimaImagem.imagem.palette)
			: [];

	/** Escreve os papéis nos campos declarados. `só vazios` = não sobrescreve. */
	const aplicarPaleta = (
		ctx: CollectionFormCtx,
		cores: ReturnType<typeof coresDoLogo>,
		soVazios: boolean,
	) => {
		const declarados = new Set(ctx.fields.map((f) => f.name));
		for (const [campo, hex] of Object.entries(papeisDaPaleta(cores))) {
			if (!hex || !declarados.has(campo)) continue;
			if (soVazios && String(ctx.data[campo] ?? '').trim()) continue;
			ctx.setCampo(campo, hex);
		}
	};

	const desenharCampo = (ctx: CollectionFieldCtx) => {
		if (!CAMPOS_DE_COR.includes(ctx.field.name)) return null;
		return (
			<CampoCor
				field={ctx.field}
				value={ctx.value}
				onChange={ctx.onChange}
				// A cor de fundo não sai do logo (ver `CAMPOS_DE_COR_DO_LOGO`), então
				// ali as amostras não aparecem.
				sugestoes={
					CAMPOS_DE_COR_DO_LOGO.includes(ctx.field.name) ? coresDe(ctx) : []
				}
			/>
		);
	};

	const abaixoDoCampo = (ctx: CollectionFieldCtx) => {
		if (ctx.field.name !== CAMPO_MARCA.logo) return null;
		const cores = coresDe(ctx);
		return (
			<PaletaDoLogo
				cores={cores}
				onAplicar={() => aplicarPaleta(ctx, cores, false)}
			/>
		);
	};

	return (
		<CollectionEntryForm
			toolKey={MARCA_TOOL_KEY}
			collection={MARCA_COLLECTION}
			entry={entry}
			inline
			onClose={onClose}
			onSaved={onSaved}
			onDeleted={onDeleted}
			renderField={desenharCampo}
			renderBelowField={abaixoDoCampo}
			/**
			 * O logo subiu ⇒ as cores dele já entram nos campos AINDA VAZIOS.
			 *
			 * Pré-preencher é o ponto todo: "qual é a sua cor primária, em
			 * hexadecimal?" é a pergunta que trava o cadastro, e o logo acabou de
			 * respondê-la. Não sobrescrever o que já está preenchido é a outra
			 * metade — quem digitou uma cor à mão não a perde por trocar o logo.
			 */
			onImageUploaded={(imagem, ctx) => {
				if (ctx.field.name !== CAMPO_MARCA.logo) return;
				aplicarPaleta(ctx, coresDoLogo(imagem.palette), true);
			}}
			renderAside={(ctx) => (
				<MarcaPreview
					marca={marcaDeDados(ctx.data, {
						id: entry?.id ?? null,
						titulo: ctx.title,
					})}
				/>
			)}
		/>
	);
}
