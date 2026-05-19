# Produtos Agrupados — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Na aba admin "Produtos", mostrar um único card por produto (agrupado por nome), com um seletor de versões na tela de detalhe para editar/criar/excluir cada versão.

**Architecture:** Funções puras de agrupamento em `src/utils/products/`. Novo `ProductGroupCard` na listagem (um por nome) que linka para a versão padrão. Tela de detalhe `/products/[id]` ganha um `VersionSelector` no cabeçalho que navega entre versões irmãs, reaproveitando as seções de edição, o `DuplicateProductModal` (nova versão) e o `DeleteProductModal` (excluir versão) já existentes.

**Tech Stack:** Next.js 16 (app router, client components), React 19, TypeScript, Tailwind v4, lucide-react.

**Verificação (sem testes automatizados — escolha do usuário):** cada task termina com `npx tsc --noEmit` e `npm run lint`, ambos sem erros.

**Commits:** Por preferência do usuário, **não commitar automaticamente**. Commit só quando o usuário pedir explicitamente. Os "Checkpoints" abaixo são pontos lógicos de commit caso ele peça.

---

### Task 1: Funções puras de agrupamento

**Files:**
- Create: `src/utils/products/group-products.ts`

- [ ] **Step 1: Criar o arquivo com as três funções puras**

```typescript
import type { Product } from '@/types/products';

/**
 * Agrupa produtos por `name`, preservando a ordem de primeira aparição
 * tanto dos grupos quanto dos itens dentro de cada grupo.
 */
export function groupProductsByName(products: Product[]): Product[][] {
	const map = new Map<string, Product[]>();
	for (const p of products) {
		const existing = map.get(p.name);
		if (existing) {
			existing.push(p);
		} else {
			map.set(p.name, [p]);
		}
	}
	return Array.from(map.values());
}

/**
 * Versão padrão de um grupo: a versão `ativo` de menor preço.
 * Se nenhuma estiver ativa, a primeira versão do grupo.
 */
export function pickDefaultVersion(versions: Product[]): Product {
	const active = versions.filter((v) => v.status === 'ativo');
	const pool = active.length > 0 ? active : versions;
	return pool.reduce((cheapest, v) =>
		v.price < cheapest.price ? v : cheapest,
	);
}

/**
 * Menor preço entre as versões `ativo`; se nenhuma ativa,
 * menor preço entre todas as versões.
 */
export function groupStartingPrice(versions: Product[]): number {
	const active = versions.filter((v) => v.status === 'ativo');
	const pool = active.length > 0 ? active : versions;
	return pool.reduce((min, v) => (v.price < min ? v.price : min), pool[0].price);
}
```

- [ ] **Step 2: Verificar tipos e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros; `group-products.ts` aparece formatado pelo biome.

- [ ] **Checkpoint:** (commit só se o usuário pedir) `feat: add product grouping helpers`

---

### Task 2: Extrair `resolveScStyle` para util compartilhado

Objetivo: `ProductGroupCard` (Task 3) precisa do mesmo estilo de badge de system class que o `ProductCard` usa. Hoje `resolveScStyle` e as paletas estão inline em `product-card.tsx` e não exportadas. Extrair para um util e fazer o `ProductCard` importar (refactor sem mudança de comportamento).

**Files:**
- Create: `src/utils/products/sc-style.ts`
- Modify: `src/components/products/product-card.tsx`

- [ ] **Step 1: Criar `src/utils/products/sc-style.ts`** (mover o conteúdo exato de `product-card.tsx` linhas 16-90)

```typescript
// Paleta de bordas por nome de system class (nome → [borda-normal, borda-hover, cor-badge])
const SC_NAMED: Record<string, [string, string, string]> = {
	prata: [
		'dark:border-slate-400/50',
		'dark:hover:border-slate-300',
		'dark:text-slate-300 border-slate-400/40 bg-slate-400/10',
	],
	ouro: [
		'dark:border-amber-400/50',
		'dark:hover:border-amber-300',
		'dark:text-amber-300 border-amber-400/40 bg-amber-400/10',
	],
	platina: [
		'dark:border-purple-400/50',
		'dark:hover:border-purple-300',
		'dark:text-purple-300 border-purple-400/40 bg-purple-400/10',
	],
	bronze: [
		'dark:border-orange-400/50',
		'dark:hover:border-orange-300',
		'dark:text-orange-300 border-orange-400/40 bg-orange-400/10',
	],
	diamante: [
		'dark:border-cyan-400/50',
		'dark:hover:border-cyan-300',
		'dark:text-cyan-300 border-cyan-400/40 bg-cyan-400/10',
	],
};

const SC_PALETTE: Array<[string, string, string]> = [
	[
		'dark:border-violet-400/50',
		'dark:hover:border-violet-300',
		'dark:text-violet-300 border-violet-400/40 bg-violet-400/10',
	],
	[
		'dark:border-emerald-400/50',
		'dark:hover:border-emerald-300',
		'dark:text-emerald-300 border-emerald-400/40 bg-emerald-400/10',
	],
	[
		'dark:border-rose-400/50',
		'dark:hover:border-rose-300',
		'dark:text-rose-300 border-rose-400/40 bg-rose-400/10',
	],
	[
		'dark:border-teal-400/50',
		'dark:hover:border-teal-300',
		'dark:text-teal-300 border-teal-400/40 bg-teal-400/10',
	],
	[
		'dark:border-fuchsia-400/50',
		'dark:hover:border-fuchsia-300',
		'dark:text-fuchsia-300 border-fuchsia-400/40 bg-fuchsia-400/10',
	],
	[
		'dark:border-sky-400/50',
		'dark:hover:border-sky-300',
		'dark:text-sky-300 border-sky-400/40 bg-sky-400/10',
	],
];

export function resolveScStyle(name: string): [string, string, string] {
	const key = name
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '');
	for (const [k, v] of Object.entries(SC_NAMED)) {
		if (key.includes(k)) return v;
	}
	let hash = 0;
	for (let i = 0; i < name.length; i++)
		hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
	return SC_PALETTE[hash % SC_PALETTE.length];
}
```

- [ ] **Step 2: Em `src/components/products/product-card.tsx`, remover linhas 16-90** (todo o bloco `SC_NAMED`/`SC_PALETTE`/`resolveScStyle`) e adicionar o import junto aos demais imports do topo:

```typescript
import { resolveScStyle } from '@/utils/products/sc-style';
```

O restante do arquivo (que chama `resolveScStyle(...)`) permanece igual.

- [ ] **Step 3: Verificar tipos e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros. `ProductCard` continua usando `resolveScStyle` agora importado.

- [ ] **Checkpoint:** (commit só se o usuário pedir) `refactor: extract resolveScStyle to shared util`

---

### Task 3: Componente `ProductGroupCard`

**Files:**
- Create: `src/components/products/product-group-card.tsx`

- [ ] **Step 1: Criar o componente**

Comportamento: mostra nome, imagem (primeira versão com `image`, senão placeholder), descrição da versão padrão, pílula "X versões" (só se > 1), preço "a partir de" via `groupStartingPrice`, badges de system class = união distinta dos nomes entre todas as versões, marca "Inativo" se nenhuma versão estiver ativa. O card inteiro é um `Link` para `/products/<id da versão padrão>`.

```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { ProductSystemClassInfo } from '@/types/components/product-card';
import type { Product } from '@/types/products';
import { formatCurrency } from '@/utils/format-currency';
import {
	groupStartingPrice,
	pickDefaultVersion,
} from '@/utils/products/group-products';
import { resolveScStyle } from '@/utils/products/sc-style';

interface ProductGroupCardProps {
	versions: Product[];
	/** System classes por id de versão (para unir os badges do grupo) */
	systemClassesByVersion: Map<
		string,
		ProductSystemClassInfo[] | undefined
	>;
}

export function ProductGroupCard({
	versions,
	systemClassesByVersion,
}: ProductGroupCardProps) {
	const [imgError, setImgError] = useState(false);

	const defaultVersion = pickDefaultVersion(versions);
	const startingPrice = groupStartingPrice(versions);
	const image = versions.find((v) => v.image)?.image ?? null;
	const noneActive = versions.every((v) => v.status !== 'ativo');

	const scByName = new Map<string, ProductSystemClassInfo>();
	for (const v of versions) {
		for (const sc of systemClassesByVersion.get(v.id) ?? []) {
			if (!scByName.has(sc.name)) scByName.set(sc.name, sc);
		}
	}
	const systemClasses = Array.from(scByName.values());

	const primarySc = systemClasses[0];
	const [scBorder, scBorderHover] = primarySc
		? resolveScStyle(primarySc.name)
		: ['dark:border-violet-500/30', 'dark:hover:border-violet-500/60'];

	return (
		<Link
			href={`/products/${defaultVersion.id}`}
			className={`bg-white dark:bg-[#1a1a1d] rounded-2xl overflow-hidden border border-slate-200 ${scBorder} ${scBorderHover} transition-all duration-300 hover:scale-[1.02] block shadow-sm dark:shadow-none`}
		>
			<div className="relative h-44 bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center">
				{image && !imgError ? (
					<Image
						src={image}
						alt={defaultVersion.name}
						fill
						className="object-cover"
						onError={() => setImgError(true)}
					/>
				) : (
					<span className="text-sm text-white/70 px-4 text-center">
						Produto sem imagem
					</span>
				)}
				{noneActive && (
					<span className="absolute top-2 right-2 bg-gray-900/80 text-gray-300 text-xs px-2 py-1 rounded-full">
						Inativo
					</span>
				)}
			</div>

			<div className="p-4">
				<div className="flex items-start justify-between gap-2 mb-2">
					<h3 className="font-semibold text-slate-900 dark:text-white">
						{defaultVersion.name}
					</h3>
					{versions.length > 1 && (
						<span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20">
							{versions.length} versões
						</span>
					)}
				</div>

				{systemClasses.length > 0 && (
					<div className="flex flex-wrap gap-1.5 mb-2">
						{systemClasses.map((sc) => {
							const [, , badge] = resolveScStyle(sc.name);
							return (
								<span
									key={sc.id}
									className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${badge}`}
									title={sc.name}
								>
									{sc.name}
								</span>
							);
						})}
					</div>
				)}

				<p className="text-sm text-slate-600 dark:text-gray-400 mb-4 line-clamp-2">
					{defaultVersion.description}
				</p>

				<div className="border-t border-slate-200 dark:border-gray-800 pt-4 text-sm">
					<span className="text-slate-500 dark:text-gray-500">
						A partir de:{' '}
					</span>
					<span className="text-slate-900 dark:text-white font-medium">
						{formatCurrency(startingPrice, 'BRL')}
					</span>
				</div>
			</div>
		</Link>
	);
}
```

- [ ] **Step 2: Verificar tipos e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros.

- [ ] **Checkpoint:** (commit só se o usuário pedir) `feat: add ProductGroupCard`

---

### Task 4: `ProductGrid` renderiza um card por grupo

**Files:**
- Modify: `src/components/products/product-grid.tsx`

- [ ] **Step 1: Reescrever o corpo de `product-grid.tsx`**

Substituir o conteúdo inteiro do arquivo por:

```tsx
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import type { ProductCardProps } from '@/types/components/product-card';
import type { ProductGridProps } from '@/types/components/product-grid';
import { groupProductsByName } from '@/utils/products/group-products';
import { ProductGroupCard } from './product-group-card';

function getProductSystemClasses(
	productId: string,
	systemClasses?: ProductGridProps['systemClasses'],
): ProductCardProps['productSystemClasses'] {
	if (!systemClasses?.length) return undefined;
	return systemClasses
		.filter((sc) => sc.products.some((p) => p.id === productId))
		.map((sc) => ({ id: sc.id, name: sc.name }));
}

export function ProductGrid({
	products,
	isLoading,
	error,
	systemClasses,
}: ProductGridProps) {
	const systemClassesByVersion = useMemo(() => {
		const map = new Map<
			string,
			ProductCardProps['productSystemClasses']
		>();
		products.forEach((p) => {
			map.set(p.id, getProductSystemClasses(p.id, systemClasses));
		});
		return map;
	}, [products, systemClasses]);

	const groups = useMemo(() => groupProductsByName(products), [products]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-20">
				<p className="text-red-400">Erro ao carregar produtos.</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
			{groups.map((group) => (
				<ProductGroupCard
					key={group[0].name}
					versions={group}
					systemClassesByVersion={systemClassesByVersion}
				/>
			))}
		</div>
	);
}
```

Observação: `classes` deixou de ser usado pelo grid (o card de grupo só usa system classes, conforme o spec). A prop continua existindo em `ProductGridProps` e sendo passada pela página — manter assim para não quebrar a chamada; não removê-la.

- [ ] **Step 2: Verificar tipos e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros. Aviso: confirmar que nenhum outro arquivo importa de `product-grid.tsx` as funções removidas (`getProductClasses`) — não importam (eram locais).

- [ ] **Checkpoint:** (commit só se o usuário pedir) `feat: render one card per product group`

---

### Task 5: Componente `VersionSelector`

**Files:**
- Create: `src/components/products/version-selector.tsx`

- [ ] **Step 1: Criar o componente**

Dropdown nativo estilizado listando as versões irmãs. Rótulo: `máquina · software · preço · status`; cai para `Versão N` quando máquina e software são nulos. Trocar a opção navega para `/products/<id>`. Só renderiza quando há mais de uma versão. Botão "Nova versão" sempre visível, dispara o callback `onNewVersion`.

```tsx
'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types/products';
import { formatCurrency } from '@/utils/format-currency';

interface VersionSelectorProps {
	versions: Product[];
	currentId: string;
	onNewVersion: () => void;
}

function versionLabel(version: Product, index: number): string {
	const parts = [version.machine, version.software].filter(
		(x): x is string => !!x,
	);
	const base = parts.length > 0 ? parts.join(' · ') : `Versão ${index + 1}`;
	return `${base} · ${formatCurrency(version.price, 'BRL')} · ${version.status}`;
}

export function VersionSelector({
	versions,
	currentId,
	onNewVersion,
}: VersionSelectorProps) {
	const router = useRouter();

	return (
		<div className="flex items-center gap-2">
			{versions.length > 1 && (
				<select
					value={currentId}
					onChange={(e) => router.push(`/products/${e.target.value}`)}
					className="bg-slate-100 dark:bg-[#252528] text-xs px-3 py-1.5 rounded-full text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-800 focus:outline-none focus:ring-1 focus:ring-violet-500"
				>
					{versions.map((v, i) => (
						<option key={v.id} value={v.id}>
							{versionLabel(v, i)}
						</option>
					))}
				</select>
			)}
			<button
				type="button"
				onClick={onNewVersion}
				className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#252528] text-xs px-3 py-1.5 rounded-full text-slate-600 dark:text-gray-300 hover:text-violet-500 transition-colors"
			>
				<Plus className="w-3.5 h-3.5" />
				Nova versão
			</button>
		</div>
	);
}
```

- [ ] **Step 2: Verificar tipos e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros.

- [ ] **Checkpoint:** (commit só se o usuário pedir) `feat: add VersionSelector`

---

### Task 6: Integrar seletor, nova versão e redirect de exclusão na tela de detalhe

**Files:**
- Modify: `src/app/products/[id]/page.tsx`

- [ ] **Step 1: Adicionar imports**

No bloco de imports do topo, adicionar:

```tsx
import { DuplicateProductModal } from '@/components/products/duplicate-product-modal';
import { VersionSelector } from '@/components/products/version-selector';
import { pickDefaultVersion } from '@/utils/products/group-products';
```

- [ ] **Step 2: Adicionar estado do modal de duplicar**

Logo após a linha `const [showLinksModal, setShowLinksModal] = useState(false);` (≈ linha 45), adicionar:

```tsx
	const [showDuplicateModal, setShowDuplicateModal] = useState(false);
```

- [ ] **Step 3: Derivar o grupo de versões**

Logo após a linha `const product = (products ?? []).find((p) => p.id === id);` (≈ linha 61), adicionar:

```tsx
	const versions = product
		? (products ?? []).filter((p) => p.name === product.name)
		: [];
```

- [ ] **Step 4: Inserir o `VersionSelector` no cabeçalho**

Localizar este bloco (≈ linhas 121-128):

```tsx
						<div>
							<h1 className="font-bold text-lg text-slate-900 dark:text-white">
								{product.name}
							</h1>
							<p className="text-xs text-slate-500 dark:text-gray-500">
								ID {product.id}
							</p>
						</div>
```

Substituir por:

```tsx
						<div>
							<h1 className="font-bold text-lg text-slate-900 dark:text-white">
								{product.name}
							</h1>
							<div className="mt-1">
								<VersionSelector
									versions={versions}
									currentId={product.id}
									onNewVersion={() => setShowDuplicateModal(true)}
								/>
							</div>
						</div>
```

- [ ] **Step 5: Redirecionar para uma versão irmã ao excluir**

Localizar (≈ linhas 362-368):

```tsx
			{showDeleteModal && (
				<DeleteProductModal
					product={product}
					onClose={() => setShowDeleteModal(false)}
					onDeleted={() => router.push('/products')}
				/>
			)}
```

Substituir por:

```tsx
			{showDeleteModal && (
				<DeleteProductModal
					product={product}
					onClose={() => setShowDeleteModal(false)}
					onDeleted={() => {
						const siblings = versions.filter((v) => v.id !== product.id);
						if (siblings.length > 0) {
							router.push(`/products/${pickDefaultVersion(siblings).id}`);
						} else {
							router.push('/products');
						}
					}}
				/>
			)}

			{showDuplicateModal && (
				<DuplicateProductModal
					product={product}
					onClose={() => setShowDuplicateModal(false)}
				/>
			)}
```

- [ ] **Step 6: Verificar tipos e lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros.

- [ ] **Step 7: Verificação manual no navegador**

`npm run dev`, abrir `/products` (aba "Produtos"):
- Um único card por nome de produto; pílula "N versões" quando há mais de uma.
- Card mostra "A partir de: R$ ..." e badges de system class unidos.
- Clicar abre `/products/[id]` na versão ativa mais barata.
- No detalhe: dropdown troca a versão e recarrega as seções na versão escolhida.
- "Nova versão" abre o modal de duplicar; ao criar, a nova versão aparece no grupo.
- Excluir uma versão com irmãs → vai para outra versão; excluir a última → vai para `/products`.

- [ ] **Checkpoint:** (commit só se o usuário pedir) `feat: version selector + new/delete version on product detail`

---

## Self-Review (preenchido pelo autor do plano)

- **Cobertura do spec:**
  - Listagem 1 card/grupo → Task 4 + Task 3.
  - Card: nome/imagem/descrição/pílula/"a partir de"/badges SC/inativo → Task 3.
  - Link p/ versão padrão → Task 3 (`pickDefaultVersion`).
  - `groupProductsByName`/`pickDefaultVersion`/`groupStartingPrice` → Task 1.
  - Reaproveitar `resolveScStyle` → Task 2.
  - Seletor de versão na detalhe + navegação → Task 5 + Task 6.
  - Nova versão via `DuplicateProductModal` → Task 6.
  - Excluir versão via `DeleteProductModal` + redirect recalculado → Task 6.
  - `ProductCard` não removido (usado em doubts-modal/landing) → preservado (Task 2 só extrai estilo).
  - 1 versão: sem pílula (Task 3), sem seletor (Task 5).
  - Sem rota nova / sem mudança de backend → respeitado.
- **Placeholders:** nenhum; todo passo tem código/comando concreto.
- **Consistência de tipos:** `pickDefaultVersion`/`groupStartingPrice`/`groupProductsByName` usados com as mesmas assinaturas em Tasks 3/4/6; `ProductSystemClassInfo` reutilizado de `@/types/components/product-card`; `resolveScStyle` retorna `[string,string,string]` e é desestruturado igual nos dois consumidores.
