# Product Addons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar no frontend Next.js as rotas de addons (`POST /addon`, `POST /subscription/addon`, `GET /subscription/addons`, `DELETE /subscription/addon/:itemId`), expostas via services + hooks React Query, com UI admin (criar addon) e UI cliente (listar / anexar / remover addons na assinatura ativa).

**Architecture:** Camadas separadas — `src/types/` (Zod schemas), `src/services/` (axios calls com validação), `src/hooks/` (React Query mutations/queries), `src/components/` (UI). Addons reutilizam o `productSchema` existente já que o backend retorna um `pl_product` com `type: "addon"`. A admin não precisa estender o `productSchema`; só filtra por `type === 'addon'` quando precisa.

**Tech Stack:** Next.js 16, React 19, TypeScript, axios, Zod v4, @tanstack/react-query, Tailwind, lucide-react, sonner. **Sem framework de testes** — verificação via `npm run lint` + `npm run build`.

**Convenções do projeto:**
- Imports usam alias `@/`.
- Tabs (não espaços) na indentação — o Biome cuida disso ao rodar `npm run lint`.
- Toasts via `sonner` (`toast.success`, `toast.error`).
- Commits são **opcionais e manuais** — o usuário não quer auto-commit. Comandos `git commit` aqui são sugestões.

---

## File map

**Criados:**
- `src/types/addons.ts` — schemas Zod para payloads e respostas dos endpoints de addon
- `src/services/addons.ts` — chamadas axios pros 4 endpoints
- `src/hooks/use-addons.ts` — hooks React Query
- `src/components/products/create-addon-modal.tsx` — modal admin (POST /addon)
- `src/components/assinatura/addons-section.tsx` — seção cliente (listar + anexar + remover)
- `src/components/assinatura/remove-addon-modal.tsx` — confirmação de remoção

**Modificados:**
- `src/app/products/page.tsx` — adiciona botão "Novo Addon" na aba "Produtos" + estado do modal
- `src/components/products/product-card.tsx` — adiciona badge "Addon" quando `product.type === 'addon'`
- `src/app/course/(shell)/assinatura/page.tsx` — renderiza `<AddonsSection />`

---

### Task 1: Criar tipos/schemas dos addons

**Files:**
- Create: `src/types/addons.ts`

- [ ] **Step 1: Criar o arquivo de tipos**

Crie `src/types/addons.ts` com este conteúdo exato:

```ts
import { z } from 'zod';

export const createAddonPayloadSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	price: z.number().positive(),
	interval: z.enum(['month', 'year', 'one_time']).default('month'),
});

export type CreateAddonPayload = z.infer<typeof createAddonPayloadSchema>;

export const subscriptionAddonItemSchema = z.object({
	itemId: z.string(),
	productId: z.uuid(),
	productName: z.string(),
	stripePriceId: z.string(),
	quantity: z.number().int().positive(),
	subscriptionId: z.string().optional(),
});

export type SubscriptionAddonItem = z.infer<typeof subscriptionAddonItemSchema>;

export const removeAddonResponseSchema = z.object({
	removed: z.literal(true),
	itemId: z.string(),
});

export type RemoveAddonResponse = z.infer<typeof removeAddonResponseSchema>;
```

- [ ] **Step 2: Verificar lint + typecheck**

Run: `npm run lint && npm run build`
Expected: PASS (build pode falhar por imports não usados em outros lugares — só verifique que `src/types/addons.ts` não gera erros).

- [ ] **Step 3 (opcional): Commit**

```bash
git add src/types/addons.ts
git commit -m "feat(addons): add zod schemas for addon payloads"
```

---

### Task 2: Criar a camada de serviço

**Files:**
- Create: `src/services/addons.ts`

- [ ] **Step 1: Criar o serviço**

Crie `src/services/addons.ts` com este conteúdo exato:

```ts
import { api } from '@/lib/fetch';
import {
	type CreateAddonPayload,
	type RemoveAddonResponse,
	removeAddonResponseSchema,
	type SubscriptionAddonItem,
	subscriptionAddonItemSchema,
} from '@/types/addons';
import { type Product, productSchema } from '@/types/products';

export async function createAddon(
	payload: CreateAddonPayload,
): Promise<Product> {
	const { data } = await api.post('/addon', payload);
	return productSchema.parse(data);
}

export async function attachAddon(
	productId: string,
): Promise<SubscriptionAddonItem> {
	const { data } = await api.post('/subscription/addon', { productId });
	return subscriptionAddonItemSchema.parse(data);
}

export async function listMyAddons(): Promise<SubscriptionAddonItem[]> {
	const { data } = await api.get('/subscription/addons');
	return subscriptionAddonItemSchema.array().parse(data);
}

export async function removeAddon(
	itemId: string,
): Promise<RemoveAddonResponse> {
	const { data } = await api.delete(`/subscription/addon/${itemId}`);
	return removeAddonResponseSchema.parse(data);
}
```

- [ ] **Step 2: Verificar lint + typecheck**

Run: `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 3 (opcional): Commit**

```bash
git add src/services/addons.ts
git commit -m "feat(addons): add service layer for addon endpoints"
```

---

### Task 3: Criar os hooks React Query

**Files:**
- Create: `src/hooks/use-addons.ts`

- [ ] **Step 1: Criar o hook file**

Crie `src/hooks/use-addons.ts` com este conteúdo exato:

```ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	attachAddon,
	createAddon,
	listMyAddons,
	removeAddon,
} from '@/services/addons';
import type { CreateAddonPayload } from '@/types/addons';

export function useCreateAddon() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateAddonPayload) => createAddon(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['products'] });
		},
	});
}

export function useMyAddons() {
	return useQuery({
		queryKey: ['my-addons'],
		queryFn: listMyAddons,
	});
}

export function useAttachAddon() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (productId: string) => attachAddon(productId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['my-addons'] });
			qc.invalidateQueries({ queryKey: ['my-subscription'] });
		},
	});
}

export function useRemoveAddon() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (itemId: string) => removeAddon(itemId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['my-addons'] });
			qc.invalidateQueries({ queryKey: ['my-subscription'] });
		},
	});
}
```

- [ ] **Step 2: Verificar lint + typecheck**

Run: `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 3 (opcional): Commit**

```bash
git add src/hooks/use-addons.ts
git commit -m "feat(addons): add react-query hooks for addons"
```

---

### Task 4: Modal admin "Criar Addon"

**Files:**
- Create: `src/components/products/create-addon-modal.tsx`

Padrão visual segue o `cancel-subscription-modal.tsx` (overlay + card centralizado + botões de ação). Mensagens de erro do backend são propagadas via `error.response.data.message` (axios) — pegamos com fallback.

- [ ] **Step 1: Criar o modal**

Crie `src/components/products/create-addon-modal.tsx`:

```tsx
'use client';

import { Loader2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateAddon } from '@/hooks/use-addons';
import type { CreateAddonPayload } from '@/types/addons';

interface CreateAddonModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function CreateAddonModal({ isOpen, onClose }: CreateAddonModalProps) {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [price, setPrice] = useState('');
	const [interval, setInterval] = useState<CreateAddonPayload['interval']>(
		'month',
	);

	const { mutate, isPending } = useCreateAddon();

	if (!isOpen) return null;

	function reset() {
		setName('');
		setDescription('');
		setPrice('');
		setInterval('month');
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const priceNumber = Number(price.replace(',', '.'));
		if (!name.trim() || !Number.isFinite(priceNumber) || priceNumber <= 0) {
			toast.error('Preencha nome e preço (maior que zero).');
			return;
		}

		mutate(
			{
				name: name.trim(),
				description: description.trim() || undefined,
				price: priceNumber,
				interval,
			},
			{
				onSuccess: () => {
					toast.success('Addon criado com sucesso.');
					reset();
					onClose();
				},
				onError: (err: unknown) => {
					const message =
						(err as { response?: { data?: { message?: string } } })?.response
							?.data?.message ?? 'Erro ao criar addon.';
					toast.error(message);
				},
			},
		);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
			<form
				onSubmit={handleSubmit}
				className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl"
			>
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-2">
						<Plus size={18} className="text-violet-500" />
						<h2 className="text-base font-semibold text-slate-900 dark:text-white">
							Novo addon
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
					>
						<X size={18} />
					</button>
				</div>

				<div className="space-y-4">
					<label className="block">
						<span className="text-xs font-medium text-slate-600 dark:text-gray-400">
							Nome
						</span>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={isPending}
							required
							className="mt-1 w-full bg-white dark:bg-[#0f0f10] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50"
						/>
					</label>

					<label className="block">
						<span className="text-xs font-medium text-slate-600 dark:text-gray-400">
							Descrição (opcional)
						</span>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							disabled={isPending}
							rows={3}
							className="mt-1 w-full bg-white dark:bg-[#0f0f10] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50 resize-none"
						/>
					</label>

					<div className="grid grid-cols-2 gap-3">
						<label className="block">
							<span className="text-xs font-medium text-slate-600 dark:text-gray-400">
								Preço (R$)
							</span>
							<input
								type="number"
								step="0.01"
								min="0.01"
								value={price}
								onChange={(e) => setPrice(e.target.value)}
								disabled={isPending}
								required
								className="mt-1 w-full bg-white dark:bg-[#0f0f10] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50"
							/>
						</label>

						<label className="block">
							<span className="text-xs font-medium text-slate-600 dark:text-gray-400">
								Cobrança
							</span>
							<select
								value={interval}
								onChange={(e) =>
									setInterval(
										e.target.value as CreateAddonPayload['interval'],
									)
								}
								disabled={isPending}
								className="mt-1 w-full bg-white dark:bg-[#0f0f10] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50"
							>
								<option value="month">Mensal</option>
								<option value="year">Anual</option>
								<option value="one_time">Pagamento único</option>
							</select>
						</label>
					</div>
				</div>

				<div className="flex justify-end gap-3 mt-6">
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-slate-700 dark:text-white"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={isPending}
						className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
					>
						{isPending ? (
							<Loader2 size={14} className="animate-spin" />
						) : (
							<Plus size={14} />
						)}
						{isPending ? 'Criando...' : 'Criar addon'}
					</button>
				</div>
			</form>
		</div>
	);
}
```

- [ ] **Step 2: Verificar lint + typecheck**

Run: `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 3 (opcional): Commit**

```bash
git add src/components/products/create-addon-modal.tsx
git commit -m "feat(addons): add admin create-addon modal"
```

---

### Task 5: Adicionar botão "Novo Addon" na página admin de produtos

**Files:**
- Modify: `src/app/products/page.tsx`

A página tem 3 abas (`produtos`, `classes`, `system-classes`). Vamos colocar o botão "Novo Addon" no header da aba `produtos`, logo acima da `SearchBar`. Não vamos modificar a `SearchBar` em si.

- [ ] **Step 1: Adicionar import do modal**

No topo de `src/app/products/page.tsx`, junto dos outros imports de `@/components/products/*`, adicione:

```tsx
import { CreateAddonModal } from '@/components/products/create-addon-modal';
```

- [ ] **Step 2: Adicionar state do modal**

Logo após `const [isProductModalOpen, setIsProductModalOpen] = useState(false);` (linha ~25), adicione:

```tsx
const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
```

- [ ] **Step 3: Adicionar botão "Novo Addon" acima da SearchBar na aba produtos**

Localize o bloco `{activeTab === 'produtos' && ( ... )}` (linha ~126). Substitua-o por:

```tsx
{activeTab === 'produtos' && (
	<>
		<div className="flex justify-end mb-4">
			<button
				type="button"
				onClick={() => setIsAddonModalOpen(true)}
				className="flex items-center gap-2 bg-white dark:bg-[#1a1a1d] border border-violet-500/40 rounded-xl px-5 py-2.5 text-sm font-medium text-violet-600 dark:text-violet-300 hover:border-violet-500 transition-colors shadow-sm dark:shadow-none"
			>
				<Plus className="w-4 h-4" />
				Novo addon
			</button>
		</div>
		<SearchBar
			value={searchQuery}
			onChange={setSearchQuery}
			onAddCourse={() => setIsProductModalOpen(true)}
		/>
		<ProductGrid
			products={filteredProducts}
			isLoading={isLoading}
			error={error}
			classes={classes}
			systemClasses={systemClasses}
		/>
	</>
)}
```

- [ ] **Step 4: Renderizar o modal junto dos outros modais**

Antes de `<AddCourseModal ... />` (linha ~240), adicione:

```tsx
<CreateAddonModal
	isOpen={isAddonModalOpen}
	onClose={() => setIsAddonModalOpen(false)}
/>
```

- [ ] **Step 5: Verificar lint + typecheck**

Run: `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 6: Testar manualmente (dev server)**

Run: `npm run dev`
Abra `/products`, clique em "Novo addon", preencha o formulário, confirme que o toast aparece e o produto aparece na grid (pode precisar refresh — o `invalidateQueries(['products'])` já cobre isso).

- [ ] **Step 7 (opcional): Commit**

```bash
git add src/app/products/page.tsx
git commit -m "feat(addons): wire create-addon modal in admin products page"
```

---

### Task 6: Badge "Addon" no product-card

**Files:**
- Modify: `src/components/products/product-card.tsx`

- [ ] **Step 1: Adicionar badge**

Em `src/components/products/product-card.tsx`, localize o `<h3>` do nome do produto (linha ~144). Substitua o bloco:

```tsx
<h3 className="font-semibold text-slate-900 dark:text-white mb-2">
	{product.name}
</h3>
```

Por:

```tsx
<div className="flex items-start justify-between gap-2 mb-2">
	<h3 className="font-semibold text-slate-900 dark:text-white">
		{product.name}
	</h3>
	{product.type === 'addon' && (
		<span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-violet-500/40 text-violet-600 dark:text-violet-300 bg-violet-500/10 shrink-0">
			Addon
		</span>
	)}
</div>
```

- [ ] **Step 2: Verificar lint + typecheck**

Run: `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 3 (opcional): Commit**

```bash
git add src/components/products/product-card.tsx
git commit -m "feat(addons): show addon badge on product card"
```

---

### Task 7: Modal de confirmação de remoção de addon (cliente)

**Files:**
- Create: `src/components/assinatura/remove-addon-modal.tsx`

Reutiliza o padrão visual de `cancel-subscription-modal.tsx`. Recebe o `addon` e callbacks.

- [ ] **Step 1: Criar o modal**

Crie `src/components/assinatura/remove-addon-modal.tsx`:

```tsx
'use client';

import { AlertTriangle, Loader2, X } from 'lucide-react';
import type { SubscriptionAddonItem } from '@/types/addons';

interface RemoveAddonModalProps {
	isOpen: boolean;
	onClose: () => void;
	addon: SubscriptionAddonItem | null;
	onConfirm: () => void;
	isPending: boolean;
}

export function RemoveAddonModal({
	isOpen,
	onClose,
	addon,
	onConfirm,
	isPending,
}: RemoveAddonModalProps) {
	if (!isOpen || !addon) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
			<div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl">
				<div className="flex items-center justify-between mb-5">
					<div className="flex items-center gap-2">
						<AlertTriangle size={18} className="text-amber-500" />
						<h2 className="text-base font-semibold text-slate-900 dark:text-white">
							Remover addon
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
					>
						<X size={18} />
					</button>
				</div>

				<p className="text-slate-600 dark:text-gray-300 text-sm mb-3">
					Tem certeza que deseja remover{' '}
					<span className="font-semibold text-slate-900 dark:text-white">
						{addon.productName}
					</span>
					? O Stripe creditará a proração no seu próximo invoice.
				</p>

				<div className="flex justify-end gap-3 mt-6">
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-slate-700 dark:text-white"
					>
						Voltar
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={isPending}
						className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
					>
						{isPending ? (
							<Loader2 size={14} className="animate-spin" />
						) : (
							<AlertTriangle size={14} />
						)}
						{isPending ? 'Removendo...' : 'Remover addon'}
					</button>
				</div>
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Verificar lint + typecheck**

Run: `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 3 (opcional): Commit**

```bash
git add src/components/assinatura/remove-addon-modal.tsx
git commit -m "feat(addons): add remove-addon confirmation modal"
```

---

### Task 8: Seção "Addons" do cliente (listar + anexar + remover)

**Files:**
- Create: `src/components/assinatura/addons-section.tsx`

Mostra duas listas: "Meus addons" (ativos) e "Addons disponíveis" (produtos com `type === 'addon'` ainda não anexados). Tratamento de erro amigável para as mensagens conhecidas do backend.

- [ ] **Step 1: Criar o componente**

Crie `src/components/assinatura/addons-section.tsx`:

```tsx
'use client';

import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
	useAttachAddon,
	useMyAddons,
	useRemoveAddon,
} from '@/hooks/use-addons';
import { useProducts } from '@/hooks/use-products';
import type { SubscriptionAddonItem } from '@/types/addons';
import { formatCurrency } from '@/utils/format-currency';
import { RemoveAddonModal } from './remove-addon-modal';

const FRIENDLY_ERRORS: Record<string, string> = {
	'Addon already attached to subscription':
		'Esse addon já está ativo na sua assinatura.',
	'No active or trialing Stripe subscription found':
		'Você precisa ter uma assinatura ativa pra adicionar addons.',
	'Product is not an addon': 'Esse produto não é um addon.',
	'Addon not configured for payments':
		'Esse addon ainda não está configurado pra cobrança.',
	'Cannot remove the main plan item':
		'Não é possível remover o plano principal por aqui.',
	'Subscription item not found': 'Esse item de assinatura não foi encontrado.',
};

function friendlyError(err: unknown, fallback: string) {
	const raw = (err as { response?: { data?: { message?: string } } })?.response
		?.data?.message;
	if (raw && FRIENDLY_ERRORS[raw]) return FRIENDLY_ERRORS[raw];
	return raw ?? fallback;
}

export function AddonsSection() {
	const { data: myAddons, isLoading: isLoadingMine } = useMyAddons();
	const { products, isLoading: isLoadingProducts } = useProducts();
	const attach = useAttachAddon();
	const remove = useRemoveAddon();

	const [removeTarget, setRemoveTarget] =
		useState<SubscriptionAddonItem | null>(null);

	const attachedProductIds = useMemo(
		() => new Set((myAddons ?? []).map((a) => a.productId)),
		[myAddons],
	);

	const availableAddons = useMemo(
		() =>
			(products ?? []).filter(
				(p) =>
					p.type === 'addon' &&
					p.status === 'ativo' &&
					!attachedProductIds.has(p.id),
			),
		[products, attachedProductIds],
	);

	function handleAttach(productId: string) {
		attach.mutate(productId, {
			onSuccess: () => toast.success('Addon adicionado à sua assinatura.'),
			onError: (err) =>
				toast.error(friendlyError(err, 'Erro ao adicionar addon.')),
		});
	}

	function handleConfirmRemove() {
		if (!removeTarget) return;
		remove.mutate(removeTarget.itemId, {
			onSuccess: () => {
				toast.success('Addon removido. A proração será creditada no próximo invoice.');
				setRemoveTarget(null);
			},
			onError: (err) =>
				toast.error(friendlyError(err, 'Erro ao remover addon.')),
		});
	}

	const isLoading = isLoadingMine || isLoadingProducts;

	return (
		<section className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl p-6 mt-6">
			<header className="mb-4">
				<h2 className="text-base font-semibold text-slate-900 dark:text-white">
					Addons
				</h2>
				<p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
					Funcionalidades extras que você pode anexar à sua assinatura. A
					cobrança é prorada imediatamente.
				</p>
			</header>

			{isLoading ? (
				<div className="flex items-center justify-center py-10">
					<Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
				</div>
			) : (
				<>
					<div className="mb-6">
						<h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
							Meus addons
						</h3>
						{(myAddons ?? []).length === 0 ? (
							<p className="text-sm text-slate-500 dark:text-gray-500">
								Você ainda não tem addons ativos.
							</p>
						) : (
							<ul className="space-y-2">
								{(myAddons ?? []).map((addon) => (
									<li
										key={addon.itemId}
										className="flex items-center justify-between gap-3 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3"
									>
										<div>
											<p className="text-sm font-medium text-slate-900 dark:text-white">
												{addon.productName}
											</p>
											<p className="text-xs text-slate-500 dark:text-gray-500">
												Quantidade: {addon.quantity}
											</p>
										</div>
										<button
											type="button"
											onClick={() => setRemoveTarget(addon)}
											disabled={remove.isPending}
											className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-red-500/30 text-red-600 dark:text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50"
										>
											<Trash2 size={12} />
											Remover
										</button>
									</li>
								))}
							</ul>
						)}
					</div>

					<div>
						<h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
							Addons disponíveis
						</h3>
						{availableAddons.length === 0 ? (
							<p className="text-sm text-slate-500 dark:text-gray-500">
								Nenhum addon disponível no momento.
							</p>
						) : (
							<ul className="space-y-2">
								{availableAddons.map((addon) => (
									<li
										key={addon.id}
										className="flex items-center justify-between gap-3 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3"
									>
										<div>
											<p className="text-sm font-medium text-slate-900 dark:text-white">
												{addon.name}
											</p>
											{addon.description && (
												<p className="text-xs text-slate-500 dark:text-gray-500 line-clamp-2">
													{addon.description}
												</p>
											)}
											<p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
												{formatCurrency(addon.price, 'BRL')}
											</p>
										</div>
										<button
											type="button"
											onClick={() => handleAttach(addon.id)}
											disabled={attach.isPending}
											className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
										>
											{attach.isPending ? (
												<Loader2 size={12} className="animate-spin" />
											) : (
												<Plus size={12} />
											)}
											Adicionar
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</>
			)}

			<RemoveAddonModal
				isOpen={!!removeTarget}
				addon={removeTarget}
				onClose={() => setRemoveTarget(null)}
				onConfirm={handleConfirmRemove}
				isPending={remove.isPending}
			/>
		</section>
	);
}
```

- [ ] **Step 2: Verificar lint + typecheck**

Run: `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 3 (opcional): Commit**

```bash
git add src/components/assinatura/addons-section.tsx
git commit -m "feat(addons): add client-side addons section"
```

---

### Task 9: Renderizar a seção na página de assinatura

**Files:**
- Modify: `src/app/course/(shell)/assinatura/page.tsx`

A página real da assinatura do cliente é `src/app/course/(shell)/assinatura/page.tsx` (a `/assinatura` raiz só faz redirect). Vamos renderizar `<AddonsSection />` ali, depois do conteúdo principal. Como ainda não vi o conteúdo dela, o **executor desta task** deve:

1. Abrir o arquivo e identificar onde o plano principal é renderizado.
2. Inserir `<AddonsSection />` **após** o bloco principal, dentro do mesmo container.
3. Se a página renderiza condicionalmente (ex.: só quando há assinatura ativa), renderizar `<AddonsSection />` **dentro do mesmo branch condicional** — o componente já lida com estado vazio, mas só faz sentido aparecer quando há assinatura.

- [ ] **Step 1: Ler a página atual**

Abra `src/app/course/(shell)/assinatura/page.tsx` e identifique:
- Se é client component (`'use client'`).
- Onde está o bloco que mostra o plano ativo (procure por `useMySubscription`, `cancelSubscriptionModal`, ou similar).

- [ ] **Step 2: Adicionar import**

Junto dos outros imports de `@/components/`, adicione:

```tsx
import { AddonsSection } from '@/components/assinatura/addons-section';
```

- [ ] **Step 3: Renderizar a seção**

Após o bloco do plano principal (dentro do mesmo container/main), adicione:

```tsx
<AddonsSection />
```

Se a página tiver um estado "sem assinatura ativa", **não** renderize a seção nele — só renderize quando o cliente tem uma assinatura (ativa ou em trial). Exemplo:

```tsx
{subscription && subscription.status !== 'canceled' && <AddonsSection />}
```

(Use o nome exato da variável da página.)

- [ ] **Step 4: Verificar lint + typecheck**

Run: `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 5: Testar manualmente (dev server)**

Run: `npm run dev`
Logado como cliente com assinatura ativa, abra `/assinatura` (redireciona) ou `/course/assinatura`. Verifique:
- Seção "Addons" aparece.
- "Meus addons" mostra empty state ou os addons já anexados.
- "Addons disponíveis" lista produtos com `type === 'addon'` (criados na Task 5).
- Clicar "Adicionar" → toast de sucesso, item migra pra "Meus addons".
- Clicar "Remover" → abre modal, confirma → toast, item some.
- Erros conhecidos (ex.: anexar duas vezes) mostram mensagem amigável.

- [ ] **Step 6 (opcional): Commit**

```bash
git add src/app/course/\(shell\)/assinatura/page.tsx
git commit -m "feat(addons): render addons section in customer subscription page"
```

---

### Task 10: Verificação final

- [ ] **Step 1: Rodar lint + build completo**

Run: `npm run lint && npm run build`
Expected: PASS sem warnings novos.

- [ ] **Step 2: Conferência manual end-to-end**

Com `npm run dev`:

1. **Admin:** `/products` → "Novo addon" → cria addon → badge "Addon" aparece no card.
2. **Cliente:** `/course/assinatura` → "Addons disponíveis" mostra o addon recém-criado → "Adicionar" → migra pra "Meus addons".
3. **Cliente:** "Remover" → confirma → addon some.
4. Tentar adicionar o mesmo addon duas vezes (em outra sessão antes do refresh) → toast amigável "Esse addon já está ativo na sua assinatura.".
5. React Query devtools (se ativo) mostram invalidação de `['my-addons']` e `['my-subscription']` nas mutations.

- [ ] **Step 3 (opcional): Commit final / abrir PR**

Decisão do usuário.

---

## Notas finais

- **Fora de escopo:** edição de addon, mudança de quantidade, filtros admin por tipo, webhooks de invoice.
- **Mensagens de erro:** o mapa `FRIENDLY_ERRORS` em `addons-section.tsx` cobre as mensagens conhecidas. Mensagens novas caem no fallback genérico.
- **Cache:** as queries `['my-addons']` e `['my-subscription']` são invalidadas após attach/remove. Se a UI da assinatura mostrar o valor total cobrado, ela já vai refletir o addon na próxima fetch.
