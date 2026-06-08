# Design: Agrupar produtos na aba admin "Produtos"

Data: 2026-05-18
Branch: dev

## Problema

Na página admin `/products`, aba "Produtos", a listagem agrupa por nome mas
renderiza **um card para cada versão** de um produto (variações por máquina,
software, tier e preço). Um produto com 4 variações aparece como 4 cards, o que
deixa a tela confusa. Cada card já leva para `/products/[id]`, que edita aquela
versão específica.

## Objetivo

Mostrar **um único card por produto** (agrupado por nome). Clicar abre a tela de
detalhe já existente na versão padrão. Na tela de detalhe, um seletor permite
trocar entre as versões e editar qualquer uma usando as seções que já existem,
além de criar e excluir versões.

## Abordagem escolhida (A)

Card agrupado na listagem + seletor de versões na tela de detalhe existente.
Reaproveita a rota `/products/[id]` e todas as seções de edição atuais. Sem rota
nova, risco baixo.

Abordagens descartadas:
- **B** — rota agrupada nova `/products/grupo/[slug]`: retrabalho grande, dois
  caminhos de detalhe pra manter, sem ganho funcional.
- **C** — expandir versões inline na listagem: descartada pelo usuário (preferiu
  tela de detalhe).

## Definições

- **Produto (grupo):** conjunto de registros `Product` com o mesmo `name`.
- **Versão:** cada registro `Product` individual dentro do grupo.
- **Versão padrão:** entre as versões com `status === 'ativo'`, a de menor
  `price`. Se nenhuma versão estiver ativa, a primeira versão do grupo (ordem de
  primeira aparição na lista retornada pela API, mantendo o comportamento atual
  de agrupamento).

## Componentes

### 1. Listagem — `ProductGrid` + novo `ProductGroupCard`

`src/components/products/product-grid.tsx`
- Mantém o agrupamento por `name` já existente (ordem de primeira aparição).
- Em vez de renderizar header + N `ProductCard`, renderiza **um**
  `ProductGroupCard` por grupo, num grid simples
  (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).
- Continua repassando os mapas de classes/system classes por produto.

`src/components/products/product-group-card.tsx` (novo)
- Props: `versions: Product[]`, e os mapas/infos de classes e system classes das
  versões do grupo.
- Exibe:
  - Nome do produto.
  - Imagem: da primeira versão que tiver `image`; senão placeholder atual.
  - Descrição: da versão padrão.
  - Pílula "X versões" quando `versions.length > 1` (não exibe quando = 1).
  - Preço "a partir de R$ Y" = menor `price` entre versões `ativo`; se nenhuma
    ativa, menor `price` entre todas.
  - Badges de system class: união distinta dos nomes entre todas as versões
    (reaproveita estilo/`resolveScStyle` do `ProductCard` atual).
  - Marca "Inativo" se **nenhuma** versão estiver ativa.
- O card inteiro é um `Link` para `/products/<id da versão padrão>`.
- As ações por-card que hoje existem no `ProductCard` (link de pagamento, promo,
  duplicar, excluir) **não** vão para o card de grupo — essas ações passam a
  viver na tela de detalhe por versão. Mantém o card de listagem limpo.

`ProductCard` **não** é removido nem alterado: continua usado em
`dashboard/doubts-modal.tsx` e `landing/products-section.tsx`. Apenas deixa de
ser usado dentro do `ProductGrid`.

### 2. Tela de detalhe — `VersionSelector`

`src/app/products/[id]/page.tsx`
- Deriva o grupo: todas as versões com o mesmo `name` do produto atual (a partir
  de `useProducts()`, que a página já carrega).
- Renderiza o novo `VersionSelector` no cabeçalho, ao lado do nome do produto.

`src/components/products/version-selector.tsx` (novo)
- Props: `versions: Product[]`, `currentId: string`.
- Dropdown listando cada versão rotulada por: `máquina · software · ` preço
  formatado ` · ` status. Rótulo cai pra "Versão N" quando máquina/software são
  nulos.
- Selecionar uma versão → `router.push('/products/<id>')`. Como cada seção já lê
  o produto por `id` da rota, todas passam a editar a versão escolhida sem
  mudança adicional.
- Só renderiza quando `versions.length > 1`.
- Botão "Nova versão" (sempre visível, mesmo com 1 versão): abre o
  `DuplicateProductModal` já existente, que cria uma variação com preço/classe/
  system class.
- Excluir versão: continua via `DeleteProductModal` já existente (botão de
  excluir do header da página). Após excluir com sucesso:
  - Se restam versões no grupo → redireciona para `/products/<id de outra
    versão>` (versão padrão recalculada).
  - Se era a última → redireciona para `/products`.

### 3. Funções puras (testáveis)

`src/utils/products/group-products.ts` (novo)
- `groupProductsByName(products: Product[]): Product[][]` — agrupa por `name`
  preservando ordem de primeira aparição. Extrai a lógica que hoje está inline
  no `ProductGrid`.
- `pickDefaultVersion(versions: Product[]): Product` — versão `ativo` de menor
  preço; senão a primeira.
- `groupStartingPrice(versions: Product[]): number` — menor preço entre ativas;
  senão menor preço entre todas.

`ProductGrid` e a página de detalhe consomem essas funções.

## Fluxo de dados

1. `/products` → `useProducts()` → `ProductGrid` agrupa via
   `groupProductsByName` → um `ProductGroupCard` por grupo.
2. Card → `Link` para `/products/<pickDefaultVersion(group).id>`.
3. `/products/[id]` → acha o produto por id, deriva grupo por `name`,
   `VersionSelector` lista versões; trocar versão = `router.push` para o id da
   versão; seções existentes editam o produto da rota.
4. Nova versão = `DuplicateProductModal`; excluir = `DeleteProductModal` +
   redirect recalculado.

## Casos de borda

- Produto com 1 versão: card sem pílula de versões; detalhe sem seletor; "Nova
  versão" ainda disponível.
- Nenhuma versão ativa: preço "a partir de" usa a menor de todas; card marcado
  "Inativo"; abre na primeira versão.
- Busca por nome: continua filtrando por `name` antes do agrupamento (sem
  mudança de comportamento).
- Excluir a última versão do grupo: volta para `/products`.

## Testes

- `groupProductsByName`: agrupa por nome, preserva ordem, lida com lista vazia.
- `pickDefaultVersion`: escolhe ativa mais barata; cai pra primeira quando
  nenhuma ativa; grupo de 1.
- `groupStartingPrice`: menor entre ativas; menor entre todas quando nenhuma
  ativa.
- TDD: testes escritos antes da implementação dessas funções puras.

## Fora de escopo

- Mudança de rota/URL (continua `/products/[id]` por versão).
- Edição em massa de várias versões de uma vez.
- Alterar `ProductCard`, `AddonCard` ou a aba "Voxes".
- Backend / modelo de dados (sem campo novo; grupo é derivado por `name`).

## Nota

Documento não comitado automaticamente (preferência do usuário: commit só quando
solicitado).
