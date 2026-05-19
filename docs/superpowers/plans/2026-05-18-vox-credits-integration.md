# Vox (créditos) Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar o front com o sistema de créditos do backend (moeda "Vox"): saldo, compra de pacotes via Stripe, consumo das features pagas (prévia, vetorização, editor IA) com confirmação proativa, e painel admin.

**Architecture:** Camada base (`types`/`services`/`hooks`) seguindo os padrões do projeto; um hook orquestrador `useCreditAction` + modal compartilhado centralizam a confirmação e o tratamento de 402/429; cada feature pluga sua mutation nesse hook; hub do cliente em `/course/voxes`; admin em sub-abas da aba "Voxes" de `/products`.

**Tech Stack:** Next.js 16, React 19, TanStack Query, axios (`src/lib/fetch.ts`), zod, sonner, Tailwind v4, biome (tabs, aspas simples).

> **Nota sobre verificação:** o projeto **não tem suíte/runner de testes**. A spec define verificação como `npm run lint` + `npm run build` sem erros + checagem manual. Este plano segue isso no lugar de TDD por unidade. Não introduzir um runner de testes (fora de escopo / YAGNI).
>
> **Nota sobre commits:** o usuário só autoriza commit quando pede explicitamente. Os passos de commit abaixo são executados porque o usuário está conduzindo a execução do plano; mantêm a granularidade. Use mensagens no padrão do repo e finalize com a linha `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/types/credits.ts` (criar) | Tipos + schemas zod da moeda Vox |
| `src/services/credits.ts` (criar) | Wrappers do `api` para `/credits/*` (cliente + admin) |
| `src/hooks/use-credits.ts` (criar) | Hooks TanStack Query (saldo, custos, pacotes, histórico, checkout, admin) |
| `src/components/credits/credit-confirm-modal.tsx` (criar) | Modal compartilhado de confirmação/saldo insuficiente |
| `src/hooks/use-credit-action.ts` (criar) | Orquestra confirmação proativa + 402/429 + revalidação |
| `src/components/credits/credits-view.tsx` (criar) | Hub do cliente (saldo, pacotes, extrato, polling Stripe) |
| `src/app/course/(shell)/voxes/page.tsx` (criar) | Rota `/course/voxes` |
| `src/utils/constants/quick-access.ts` (modificar) | Novo item de sidebar "Voxes" |
| `src/components/course/home/course-top-header.tsx` (modificar) | Pill de saldo |
| `src/services/vectorize.ts` (modificar) | Migrar para o backend com `useCredits` |
| `src/app/api/vectorize/route.ts` (deletar) | Proxy local aposentado |
| `src/services/previas.ts` + `src/types/previas.ts` (modificar) | `useCredits` na prévia |
| `src/components/previas/previas-view.tsx` (modificar) | Confirmação proativa + 429 |
| `src/components/vetorizacao/*.tsx` (modificar) | Confirmação proativa na vetorização |
| `src/services/editor-ai.ts` + `src/types/editor-ai.ts` (modificar) | `useCredits` no editor |
| `src/components/canva/design-editor-view.tsx` (modificar) | Confirmação proativa no editor |
| `src/components/products/credits-admin-section.tsx` (criar) | Sub-abas Pacotes/Custos/Ajuste |
| `src/app/products/page.tsx` (modificar) | Aba "Voxes" com sub-abas |

---

## Task 1: Tipos da moeda Vox

**Files:**
- Create: `src/types/credits.ts`

- [ ] **Step 1: Criar o arquivo de tipos**

```ts
import { z } from 'zod';

export type VoxFeature = 'previa' | 'vectorize' | 'editor-ai';

export const voxBalanceSchema = z.object({
	balance: z.number(),
});
export type VoxBalance = z.infer<typeof voxBalanceSchema>;

export const voxCostSchema = z.object({
	feature: z.string(),
	cost: z.number(),
	label: z.string(),
});
export type VoxCost = z.infer<typeof voxCostSchema>;

export const voxPackageSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	credits: z.number(),
	price: z.number(),
	active: z.boolean().optional(),
});
export type VoxPackage = z.infer<typeof voxPackageSchema>;

export const voxHistoryEntrySchema = z.object({
	id: z.string(),
	type: z.enum(['purchase', 'debit', 'refund', 'adjustment']),
	amount: z.number(),
	balanceAfter: z.number(),
	feature: z.string().nullable().optional(),
	createdAt: z.string(),
});
export type VoxHistoryEntry = z.infer<typeof voxHistoryEntrySchema>;

export const voxHistoryResponseSchema = z.object({
	data: z.array(voxHistoryEntrySchema),
	total: z.number(),
	page: z.number(),
	limit: z.number(),
});
export type VoxHistoryResponse = z.infer<typeof voxHistoryResponseSchema>;

export const voxCheckoutResponseSchema = z.object({
	checkoutUrl: z.string(),
	sessionId: z.string(),
});
export type VoxCheckoutResponse = z.infer<typeof voxCheckoutResponseSchema>;

// Erro 402 (confirmation_required | insufficient_balance)
export interface Vox402 {
	message: string;
	reason: 'confirmation_required' | 'insufficient_balance';
	feature: VoxFeature;
	cost: number;
	balance: number;
}

// Erro 429 (somente prévia)
export interface VoxDailyLimit429 {
	code: 'DAILY_LIMIT_REACHED';
	limit: number;
	used: number;
	resetsAt: string;
	creditOption: {
		cost: number;
		balance: number;
		canUseCredits: boolean;
	} | null;
}

// Payloads admin
export interface CreateVoxPackagePayload {
	name: string;
	description?: string;
	credits: number;
	price: number;
}
export interface UpdateVoxPackagePayload {
	name?: string;
	description?: string;
	credits?: number;
	price?: number;
}
export interface AdjustVoxPayload {
	customerId: string;
	amount: number;
	reason: string;
}
```

- [ ] **Step 2: Verificar lint/types**

Run: `npx @biomejs/biome check src/types/credits.ts && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/types/credits.ts
git commit -m "feat(vox): add credit/vox domain types and zod schemas"
```

---

## Task 2: Service `/credits/*`

**Files:**
- Create: `src/services/credits.ts`

- [ ] **Step 1: Criar o service**

```ts
import { api } from '@/lib/fetch';
import {
	type AdjustVoxPayload,
	type CreateVoxPackagePayload,
	type UpdateVoxPackagePayload,
	type VoxBalance,
	voxBalanceSchema,
	type VoxCheckoutResponse,
	voxCheckoutResponseSchema,
	type VoxCost,
	voxCostSchema,
	type VoxFeature,
	type VoxHistoryResponse,
	voxHistoryResponseSchema,
	type VoxPackage,
	voxPackageSchema,
} from '@/types/credits';

// ─── Cliente ────────────────────────────────────────────────────────────────

export async function getVoxBalance(): Promise<VoxBalance> {
	const { data } = await api.get('/credits/balance');
	return voxBalanceSchema.parse(data);
}

export async function getVoxCosts(): Promise<VoxCost[]> {
	const { data } = await api.get('/credits/costs');
	return voxCostSchema.array().parse(data);
}

export async function getVoxPackages(): Promise<VoxPackage[]> {
	const { data } = await api.get('/credits/packages');
	return voxPackageSchema.array().parse(data);
}

export async function getVoxHistory(params?: {
	page?: number;
	limit?: number;
}): Promise<VoxHistoryResponse> {
	const { data } = await api.get('/credits/history', { params });
	return voxHistoryResponseSchema.parse(
		data ?? { data: [], total: 0, page: 1, limit: 20 },
	);
}

export async function createVoxCheckout(
	packageId: string,
): Promise<VoxCheckoutResponse> {
	const { data } = await api.post('/credits/checkout', { packageId });
	return voxCheckoutResponseSchema.parse(data);
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export async function getAllVoxPackages(): Promise<VoxPackage[]> {
	const { data } = await api.get('/credits/packages/all');
	return voxPackageSchema.array().parse(data);
}

export async function createVoxPackage(
	payload: CreateVoxPackagePayload,
): Promise<VoxPackage> {
	const { data } = await api.post('/credits/packages', payload);
	return voxPackageSchema.parse(data);
}

export async function updateVoxPackage(
	id: string,
	payload: UpdateVoxPackagePayload,
): Promise<VoxPackage> {
	const { data } = await api.put(`/credits/packages/${id}`, payload);
	return voxPackageSchema.parse(data);
}

export async function setVoxPackageStatus(
	id: string,
	active: boolean,
): Promise<void> {
	await api.patch(`/credits/packages/${id}/status`, { active });
}

export async function updateVoxCost(
	feature: VoxFeature,
	cost: number,
): Promise<void> {
	await api.put(`/credits/costs/${feature}`, { cost });
}

export async function adjustVox(payload: AdjustVoxPayload): Promise<void> {
	await api.post('/credits/adjust', payload);
}
```

- [ ] **Step 2: Verificar lint/types**

Run: `npx @biomejs/biome check src/services/credits.ts && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/services/credits.ts
git commit -m "feat(vox): add credits service wrappers (client + admin)"
```

---

## Task 3: Hooks TanStack Query

**Files:**
- Create: `src/hooks/use-credits.ts`

- [ ] **Step 1: Criar os hooks**

```ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
	adjustVox,
	createVoxCheckout,
	createVoxPackage,
	getAllVoxPackages,
	getVoxBalance,
	getVoxCosts,
	getVoxHistory,
	getVoxPackages,
	setVoxPackageStatus,
	updateVoxCost,
	updateVoxPackage,
} from '@/services/credits';
import type {
	AdjustVoxPayload,
	CreateVoxPackagePayload,
	UpdateVoxPackagePayload,
	VoxFeature,
} from '@/types/credits';

export const VOX_BALANCE_KEY = ['credits', 'balance'] as const;
const COSTS_KEY = ['credits', 'costs'] as const;
const PACKAGES_KEY = ['credits', 'packages'] as const;
const ALL_PACKAGES_KEY = ['credits', 'packages', 'all'] as const;

export function useVoxBalance(enabled = true) {
	return useQuery({
		queryKey: VOX_BALANCE_KEY,
		queryFn: getVoxBalance,
		staleTime: 30_000,
		enabled,
	});
}

export function useVoxCosts() {
	return useQuery({
		queryKey: COSTS_KEY,
		queryFn: getVoxCosts,
		staleTime: 5 * 60_000,
	});
}

export function useVoxPackages() {
	return useQuery({
		queryKey: PACKAGES_KEY,
		queryFn: getVoxPackages,
	});
}

export function useVoxHistory(page?: number, limit?: number) {
	return useQuery({
		queryKey: ['credits', 'history', page, limit] as const,
		queryFn: () => getVoxHistory({ page, limit }),
	});
}

export function useCreateVoxCheckout() {
	return useMutation({
		mutationFn: (packageId: string) => createVoxCheckout(packageId),
		onSuccess: ({ checkoutUrl }) => {
			window.location.href = checkoutUrl;
		},
		onError: () => toast.error('Erro ao iniciar a compra'),
	});
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export function useAllVoxPackages(enabled = true) {
	return useQuery({
		queryKey: ALL_PACKAGES_KEY,
		queryFn: getAllVoxPackages,
		enabled,
	});
}

export function useCreateVoxPackage() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateVoxPackagePayload) => createVoxPackage(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['credits', 'packages'] });
			toast.success('Pacote criado!');
		},
		onError: () => toast.error('Erro ao criar pacote'),
	});
}

export function useUpdateVoxPackage() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateVoxPackagePayload;
		}) => updateVoxPackage(id, payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['credits', 'packages'] });
			toast.success('Pacote atualizado!');
		},
		onError: () => toast.error('Erro ao atualizar pacote'),
	});
}

export function useSetVoxPackageStatus() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, active }: { id: string; active: boolean }) =>
			setVoxPackageStatus(id, active),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['credits', 'packages'] });
			toast.success('Status atualizado!');
		},
		onError: () => toast.error('Erro ao atualizar status'),
	});
}

export function useUpdateVoxCost() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ feature, cost }: { feature: VoxFeature; cost: number }) =>
			updateVoxCost(feature, cost),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: COSTS_KEY });
			toast.success('Custo atualizado!');
		},
		onError: () => toast.error('Erro ao atualizar custo'),
	});
}

export function useAdjustVox() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: AdjustVoxPayload) => adjustVox(payload),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: VOX_BALANCE_KEY });
			toast.success('Saldo ajustado!');
		},
		onError: () => toast.error('Erro ao ajustar saldo'),
	});
}
```

- [ ] **Step 2: Verificar lint/types**

Run: `npx @biomejs/biome check src/hooks/use-credits.ts && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-credits.ts
git commit -m "feat(vox): add credits react-query hooks"
```

---

## Task 4: Modal de confirmação compartilhado

**Files:**
- Create: `src/components/credits/credit-confirm-modal.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
'use client';

import { Coins, Wallet, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ModalOverlay } from '@/components/ui/modal-overlay';

export type CreditModalVariant = 'confirm' | 'insufficient' | 'daily-limit';

interface CreditConfirmModalProps {
	variant: CreditModalVariant;
	cost: number;
	balance: number;
	/** somente para variant='daily-limit' */
	canUseCredits?: boolean;
	pending?: boolean;
	onConfirm: () => void;
	onClose: () => void;
}

export function CreditConfirmModal({
	variant,
	cost,
	balance,
	canUseCredits = true,
	pending = false,
	onConfirm,
	onClose,
}: CreditConfirmModalProps) {
	const router = useRouter();
	const goBuy = () => {
		onClose();
		router.push('/course/voxes');
	};

	const isInsufficient =
		variant === 'insufficient' ||
		(variant === 'daily-limit' && !canUseCredits);

	return (
		<ModalOverlay onClose={onClose}>
			<div className="p-6">
				<div className="flex items-start justify-between mb-4">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
							{isInsufficient ? (
								<Wallet className="w-5 h-5 text-violet-500" />
							) : (
								<Coins className="w-5 h-5 text-violet-500" />
							)}
						</div>
						<h3 className="text-lg font-bold text-slate-900 dark:text-white">
							{isInsufficient
								? 'Saldo insuficiente'
								: variant === 'daily-limit'
									? 'Prévias grátis esgotadas'
									: 'Confirmar uso de voxes'}
						</h3>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<p className="text-sm text-slate-600 dark:text-gray-400 mb-6">
					{isInsufficient ? (
						<>
							Esta ação custa{' '}
							<strong className="text-slate-900 dark:text-white">
								{cost} {cost === 1 ? 'vox' : 'voxes'}
							</strong>{' '}
							e você tem apenas{' '}
							<strong className="text-slate-900 dark:text-white">
								{balance}
							</strong>
							. Compre voxes para continuar.
						</>
					) : (
						<>
							{variant === 'daily-limit'
								? 'Suas prévias grátis de hoje acabaram. '
								: ''}
							Esta ação custa{' '}
							<strong className="text-slate-900 dark:text-white">
								{cost} {cost === 1 ? 'vox' : 'voxes'}
							</strong>
							. Seu saldo:{' '}
							<strong className="text-slate-900 dark:text-white">
								{balance} {balance === 1 ? 'vox' : 'voxes'}
							</strong>
							. Deseja continuar?
						</>
					)}
				</p>

				<div className="flex gap-3">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
					>
						Cancelar
					</button>
					{isInsufficient ? (
						<button
							type="button"
							onClick={goBuy}
							className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors"
						>
							Comprar voxes
						</button>
					) : (
						<button
							type="button"
							onClick={onConfirm}
							disabled={pending}
							className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-60"
						>
							{pending ? 'Processando...' : `Usar ${cost} ${cost === 1 ? 'vox' : 'voxes'}`}
						</button>
					)}
				</div>
			</div>
		</ModalOverlay>
	);
}
```

- [ ] **Step 2: Verificar lint/types**

Run: `npx @biomejs/biome check src/components/credits/credit-confirm-modal.tsx && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/credits/credit-confirm-modal.tsx
git commit -m "feat(vox): add shared credit confirmation modal"
```

---

## Task 5: Hook orquestrador `useCreditAction`

**Files:**
- Create: `src/hooks/use-credit-action.ts`

Este hook expõe: `trigger()` (inicia o fluxo proativo), `modal` (props para o `CreditConfirmModal` ou `null`), e repassa `isPending`. O `run` recebido executa a chamada real já com `useCredits`.

- [ ] **Step 1: Criar o hook**

```ts
'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { CreditModalVariant } from '@/components/credits/credit-confirm-modal';
import { VOX_BALANCE_KEY } from '@/hooks/use-credits';
import type { VoxFeature } from '@/types/credits';

interface AxiosLikeError {
	response?: { status?: number; data?: unknown };
}

function parseError(err: unknown): {
	status?: number;
	data?: Record<string, unknown>;
} {
	const e = err as AxiosLikeError;
	return { status: e?.response?.status, data: (e?.response?.data ?? {}) as Record<string, unknown> };
}

interface ModalState {
	variant: CreditModalVariant;
	cost: number;
	balance: number;
	canUseCredits: boolean;
}

interface UseCreditActionArgs<T> {
	feature: VoxFeature;
	/** custo unitário da feature (de useVoxCosts); fallback 1 */
	cost: number;
	/** saldo atual (de useVoxBalance) */
	balance: number;
	/** executa a chamada real; recebe a flag useCredits */
	run: (opts: { useCredits: boolean }) => Promise<T>;
}

export function useCreditAction<T>({
	feature,
	cost,
	balance,
	run,
}: UseCreditActionArgs<T>) {
	const qc = useQueryClient();
	const [modal, setModal] = useState<ModalState | null>(null);
	const [pending, setPending] = useState(false);

	const finish = useCallback(() => {
		qc.invalidateQueries({ queryKey: VOX_BALANCE_KEY });
	}, [qc]);

	const execute = useCallback(
		async (useCredits: boolean): Promise<T | undefined> => {
			setPending(true);
			try {
				const result = await run({ useCredits });
				setModal(null);
				finish();
				return result;
			} catch (err) {
				const { status, data } = parseError(err);
				if (status === 402) {
					const reason = data.reason as string | undefined;
					setModal({
						variant:
							reason === 'insufficient_balance' ? 'insufficient' : 'confirm',
						cost: (data.cost as number) ?? cost,
						balance: (data.balance as number) ?? balance,
						canUseCredits: true,
					});
				} else if (status === 429 && data.code === 'DAILY_LIMIT_REACHED') {
					const opt = data.creditOption as
						| { cost: number; balance: number; canUseCredits: boolean }
						| null;
					setModal({
						variant: 'daily-limit',
						cost: opt?.cost ?? cost,
						balance: opt?.balance ?? balance,
						canUseCredits: !!opt?.canUseCredits,
					});
				} else {
					setModal(null);
					toast.error('Não foi possível concluir a ação');
				}
				return undefined;
			} finally {
				setPending(false);
			}
		},
		[run, finish, cost, balance],
	);

	/** Chamada inicial. Para prévia, useFreeQuotaFirst=true tenta sem flag. */
	const trigger = useCallback(
		(opts?: { useFreeQuotaFirst?: boolean }) => {
			if (opts?.useFreeQuotaFirst) {
				return execute(false);
			}
			if (balance < cost) {
				setModal({
					variant: 'insufficient',
					cost,
					balance,
					canUseCredits: false,
				});
				return Promise.resolve(undefined);
			}
			setModal({ variant: 'confirm', cost, balance, canUseCredits: true });
			return Promise.resolve(undefined);
		},
		[balance, cost, execute],
	);

	const confirm = useCallback(() => execute(true), [execute]);
	const close = useCallback(() => setModal(null), []);

	return { trigger, confirm, close, modal, pending, execute };
}
```

> **Comportamento:**
> - **Vetorização/Editor** (sem cota grátis): chamar `trigger()` → abre `confirm` se há saldo, ou `insufficient`. `confirm()` chama `execute(true)`.
> - **Prévia** (com cota grátis): chamar `trigger({ useFreeQuotaFirst: true })` → tenta sem flag; se 429, o modal `daily-limit` aparece; `confirm()` reenvia com `useCredits:true`.

- [ ] **Step 2: Verificar lint/types**

Run: `npx @biomejs/biome check src/hooks/use-credit-action.ts && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-credit-action.ts
git commit -m "feat(vox): add useCreditAction orchestration hook"
```

---

## Task 6: Pill de saldo no header + item de sidebar

**Files:**
- Modify: `src/utils/constants/quick-access.ts`
- Modify: `src/components/course/home/course-top-header.tsx`

- [ ] **Step 1: Adicionar item de sidebar**

Em `src/utils/constants/quick-access.ts`, no import de ícones (bloco `lucide-react`), adicionar `Coins` na lista (ordem alfabética, após `BookOpen`):

```ts
	BookOpen,
	Coins,
	Eye,
```

No array `quickAccessItems`, adicionar o item logo após o objeto `{ label: 'Previas', ... }`:

```ts
	{
		label: 'Voxes',
		description: 'Saldo e pacotes',
		Icon: Coins,
		section: 'FERRAMENTAS',
		href: '/course/voxes',
	},
```

- [ ] **Step 2: Adicionar a pill de saldo no header**

Em `src/components/course/home/course-top-header.tsx`:

a) Adicionar `Coins` ao import de `lucide-react` (após `Bell,`):

```tsx
	Bell,
	Coins,
	CreditCard,
```

b) Adicionar o import do hook abaixo do import de `ThemeToggle`:

```tsx
import { useVoxBalance } from '@/hooks/use-credits';
```

c) Dentro do componente `CourseTopHeader`, antes do `return`, adicionar:

```tsx
	const { data: voxBalance } = useVoxBalance();
```

d) No bloco `<div className="flex items-center gap-1.5 ml-4">`, imediatamente antes do `<Link href="/course/assinatura" ...>` existente, inserir a pill:

```tsx
				<Link
					href="/course/voxes"
					title="Meus voxes"
					className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
				>
					<Coins className="w-[18px] h-[18px] text-violet-500" />
					<span className="text-sm font-semibold tabular-nums">
						{voxBalance?.balance ?? '—'}
					</span>
				</Link>
```

- [ ] **Step 3: Verificar lint/build**

Run: `npx @biomejs/biome check src/utils/constants/quick-access.ts src/components/course/home/course-top-header.tsx && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/utils/constants/quick-access.ts src/components/course/home/course-top-header.tsx
git commit -m "feat(vox): show balance pill in header and sidebar entry"
```

---

## Task 7: Hub do cliente `/course/voxes`

**Files:**
- Create: `src/components/credits/credits-view.tsx`
- Create: `src/app/course/(shell)/voxes/page.tsx`

- [ ] **Step 1: Criar a view do hub**

```tsx
'use client';

import { Coins, History, Loader2, Package } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import {
	useCreateVoxCheckout,
	useVoxBalance,
	useVoxHistory,
	useVoxPackages,
} from '@/hooks/use-credits';
import type { VoxHistoryEntry } from '@/types/credits';

const TYPE_LABEL: Record<VoxHistoryEntry['type'], string> = {
	purchase: 'Compra',
	debit: 'Uso',
	refund: 'Estorno',
	adjustment: 'Ajuste',
};

const TYPE_CLASS: Record<VoxHistoryEntry['type'], string> = {
	purchase: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
	debit: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
	refund: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
	adjustment: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
};

export function CreditsView() {
	const searchParams = useSearchParams();
	const hasSession = !!searchParams.get('session_id');

	const { data: balance, refetch: refetchBalance } = useVoxBalance();
	const { data: packages, isLoading: pkgLoading } = useVoxPackages();
	const checkout = useCreateVoxCheckout();

	const [page, setPage] = useState(1);
	const limit = 10;
	const { data: history, isLoading: histLoading } = useVoxHistory(page, limit);

	// Polling pós-Stripe: revalida saldo até ~6x quando volta com session_id
	const [processing, setProcessing] = useState(hasSession);
	const baselineRef = useRef<number | null>(null);

	useEffect(() => {
		if (!hasSession) return;
		baselineRef.current = balance?.balance ?? 0;
		let attempts = 0;
		const id = setInterval(async () => {
			attempts += 1;
			const res = await refetchBalance();
			const current = res.data?.balance ?? 0;
			if (
				baselineRef.current !== null &&
				current > baselineRef.current
			) {
				setProcessing(false);
				clearInterval(id);
			} else if (attempts >= 6) {
				setProcessing(false);
				clearInterval(id);
			}
		}, 4000);
		return () => clearInterval(id);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hasSession]);

	const totalPages = history ? Math.ceil(history.total / limit) : 1;

	return (
		<div className="px-4 md:px-8 py-6 space-y-8">
			<PageHeader title="Voxes" subtitle="Seu saldo, pacotes e histórico" />

			{processing && (
				<div className="rounded-xl border border-violet-200 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-950/20 p-4 flex items-center gap-3">
					<Loader2 className="w-4 h-4 text-violet-600 animate-spin" />
					<p className="text-sm text-slate-700 dark:text-slate-200">
						Pagamento em processamento — o saldo aparece em instantes.
					</p>
				</div>
			)}

			{/* Saldo */}
			<div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-6 flex items-center gap-4">
				<div className="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center">
					<Coins className="w-6 h-6 text-violet-500" />
				</div>
				<div>
					<p className="text-sm text-slate-500 dark:text-gray-400">
						Saldo atual
					</p>
					<p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
						{balance?.balance ?? '—'}{' '}
						<span className="text-base font-medium text-slate-500">voxes</span>
					</p>
				</div>
			</div>

			{/* Pacotes */}
			<section>
				<h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-4">
					<Package className="w-4 h-4" /> Comprar voxes
				</h3>
				{pkgLoading ? (
					<div className="flex justify-center py-12">
						<Loader2 className="w-6 h-6 animate-spin text-violet-500" />
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{(packages ?? []).map((p) => (
							<div
								key={p.id}
								className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-5 flex flex-col"
							>
								<p className="font-bold text-slate-900 dark:text-white">
									{p.name}
								</p>
								{p.description && (
									<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
										{p.description}
									</p>
								)}
								<p className="mt-4 text-2xl font-bold text-violet-600">
									{p.credits}{' '}
									<span className="text-sm font-medium text-slate-500">
										voxes
									</span>
								</p>
								<p className="text-sm text-slate-500 dark:text-gray-400">
									R$ {p.price.toFixed(2)}
								</p>
								<button
									type="button"
									onClick={() => checkout.mutate(p.id)}
									disabled={checkout.isPending}
									className="mt-4 w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-60"
								>
									{checkout.isPending ? 'Redirecionando...' : 'Comprar'}
								</button>
							</div>
						))}
					</div>
				)}
			</section>

			{/* Extrato */}
			<section>
				<h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-4">
					<History className="w-4 h-4" /> Extrato
				</h3>
				<div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden">
					{histLoading ? (
						<div className="flex justify-center py-12">
							<Loader2 className="w-6 h-6 animate-spin text-violet-500" />
						</div>
					) : (history?.data.length ?? 0) === 0 ? (
						<p className="text-center text-sm text-slate-500 dark:text-gray-400 py-12">
							Nenhuma movimentação ainda.
						</p>
					) : (
						<ul className="divide-y divide-slate-100 dark:divide-white/5">
							{history?.data.map((h) => (
								<li
									key={h.id}
									className="flex items-center justify-between px-5 py-3.5"
								>
									<div className="flex items-center gap-3">
										<span
											className={`text-xs font-semibold px-2 py-1 rounded-md ${TYPE_CLASS[h.type]}`}
										>
											{TYPE_LABEL[h.type]}
										</span>
										<span className="text-sm text-slate-600 dark:text-gray-300">
											{h.feature ?? '—'}
										</span>
									</div>
									<div className="text-right">
										<p
											className={`text-sm font-semibold tabular-nums ${h.amount >= 0 ? 'text-emerald-600' : 'text-slate-700 dark:text-gray-200'}`}
										>
											{h.amount >= 0 ? '+' : ''}
											{h.amount}
										</p>
										<p className="text-xs text-slate-400">
											{new Date(h.createdAt).toLocaleDateString('pt-BR')} · saldo{' '}
											{h.balanceAfter}
										</p>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
				{totalPages > 1 && (
					<div className="flex items-center justify-center gap-3 mt-4">
						<button
							type="button"
							disabled={page <= 1}
							onClick={() => setPage((p) => p - 1)}
							className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40"
						>
							Anterior
						</button>
						<span className="text-sm text-slate-500">
							{page} / {totalPages}
						</span>
						<button
							type="button"
							disabled={page >= totalPages}
							onClick={() => setPage((p) => p + 1)}
							className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40"
						>
							Próxima
						</button>
					</div>
				)}
			</section>
		</div>
	);
}
```

- [ ] **Step 2: Criar a página da rota**

`src/app/course/(shell)/voxes/page.tsx`:

```tsx
import { CreditsView } from '@/components/credits/credits-view';

export default function VoxesPage() {
	return <CreditsView />;
}
```

- [ ] **Step 3: Verificar lint/build**

Run: `npx @biomejs/biome check src/components/credits/credits-view.tsx "src/app/course/(shell)/voxes/page.tsx" && npm run build`
Expected: build conclui sem erros; rota `/course/voxes` compilada.

- [ ] **Step 4: Commit**

```bash
git add "src/components/credits/credits-view.tsx" "src/app/course/(shell)/voxes/page.tsx"
git commit -m "feat(vox): add /course/voxes hub (balance, packages, history, stripe polling)"
```

---

## Task 8: Integração na Prévia (cota grátis + 429 + voxes)

**Files:**
- Modify: `src/types/previas.ts:104-116`
- Modify: `src/services/previas.ts` (função `generatePrevia`)
- Modify: `src/components/previas/previas-view.tsx` (handler `handleGenerate` ~903-952; render do componente principal)

- [ ] **Step 1: Adicionar `useCredits` ao payload da prévia**

Em `src/types/previas.ts`, dentro de `interface GeneratePreviaPayload`, adicionar após `useWatermark?: boolean;`:

```ts
	useCredits?: boolean;
```

- [ ] **Step 2: Repassar a flag no service**

Em `src/services/previas.ts`, a função `generatePrevia` já envia o payload inteiro no body — nenhuma mudança de código necessária (o campo `useCredits` já trafega). Confirmar lendo a função; não alterar.

- [ ] **Step 3: Ligar prévia ao `useCreditAction`**

Em `src/components/previas/previas-view.tsx`:

a) Adicionar imports (junto aos imports de hooks existentes):

```tsx
import { CreditConfirmModal } from '@/components/credits/credit-confirm-modal';
import { useCreditAction } from '@/hooks/use-credit-action';
import { useVoxBalance, useVoxCosts } from '@/hooks/use-credits';
```

b) No componente que contém `handleGenerate` (onde `generateMutation`/`quota` são definidos, ~881), adicionar antes de `handleGenerate`:

```tsx
	const { data: voxBalance } = useVoxBalance();
	const { data: voxCosts } = useVoxCosts();
	const previaCost =
		voxCosts?.find((c) => c.feature === 'previa')?.cost ?? 1;

	const buildPayload = useCallback(
		(useCredits: boolean): GeneratePreviaPayload | null => {
			if (!selectedVariantId) return null;
			return {
				productVariantId: selectedVariantId,
				imagelogo_url: imageLogo || undefined,
				personalizationType,
				customName: customName.trim() || undefined,
				instrucoesPersonalizadas: instrucoesPersonalizadas.trim() || undefined,
				modoLentes,
				textoLenteDireita: textoLenteDireita.trim() || undefined,
				textoLenteEsquerda: textoLenteEsquerda.trim() || undefined,
				laserSettings,
				useWatermark: useWatermarkFlag || undefined,
				useCredits: useCredits || undefined,
			};
		},
		[
			selectedVariantId,
			imageLogo,
			personalizationType,
			customName,
			instrucoesPersonalizadas,
			modoLentes,
			textoLenteDireita,
			textoLenteEsquerda,
			laserSettings,
			useWatermarkFlag,
		],
	);

	const creditAction = useCreditAction({
		feature: 'previa',
		cost: previaCost,
		balance: voxBalance?.balance ?? 0,
		run: async ({ useCredits }) => {
			const payload = buildPayload(useCredits);
			if (!payload) throw new Error('no-variant');
			const result = await generateMutation.mutateAsync(payload);
			setGeneratedPrevia({ previewUrl: result.previewUrl });
			return result;
		},
	});
```

c) Substituir o corpo de `handleGenerate` (todo o `useCallback` atual, linhas ~903-952) por:

```tsx
	const handleGenerate = useCallback(async () => {
		if (!selectedVariantId) {
			toast.error('Selecione um produto e uma variante.');
			return;
		}
		// Tenta a cota grátis primeiro; 429 vira modal de uso de voxes.
		await creditAction.trigger({ useFreeQuotaFirst: true });
	}, [selectedVariantId, creditAction]);
```

> Observação: `generateMutation` já dá `toast.success` em sucesso e invalida `previas`/`quota`. O `useCreditAction` invalida `['credits','balance']`. O aviso "Restam N prévias" pode ser removido (a cota some quando passa a usar voxes); manter simples.

d) No JSX retornado por esse componente, logo após `<QuotaBanner ... />` (linha ~1031), adicionar o modal:

```tsx
			{creditAction.modal && (
				<CreditConfirmModal
					variant={creditAction.modal.variant}
					cost={creditAction.modal.cost}
					balance={creditAction.modal.balance}
					canUseCredits={creditAction.modal.canUseCredits}
					pending={creditAction.pending}
					onConfirm={creditAction.confirm}
					onClose={creditAction.close}
				/>
			)}
```

- [ ] **Step 4: Verificar lint/build**

Run: `npx @biomejs/biome check src/components/previas/previas-view.tsx src/types/previas.ts && npm run build`
Expected: build sem erros.

- [ ] **Step 5: Checagem manual**

- Gerar prévia dentro da cota → funciona, sem modal.
- Esgotar cota → ao gerar, abre modal `daily-limit`; confirmar → cobra 1 vox e gera; saldo no header cai.
- Sem saldo e cota esgotada → modal "Comprar voxes" leva a `/course/voxes`.

- [ ] **Step 6: Commit**

```bash
git add src/components/previas/previas-view.tsx src/types/previas.ts
git commit -m "feat(vox): wire previa to free quota + vox confirmation"
```

---

## Task 9: Migração da Vetorização para o backend

**Files:**
- Modify: `src/services/vectorize.ts` (reescrever `vectorizeImage`)
- Modify: `src/hooks/use-vectors.ts:30-39` (`useVectorizeImage` aceita opção)
- Modify: `src/components/vetorizacao/vetorizacao-view.tsx` (~766-796)
- Modify: `src/components/vetorizacao/vectorization-upload.tsx` (~48, ~88)
- Modify: `src/components/vetorizacao/vector-list.tsx` (~92)
- Delete: `src/app/api/vectorize/route.ts`

- [ ] **Step 1: Reescrever o service para o backend**

Substituir todo o conteúdo de `src/services/vectorize.ts` por:

```ts
import { api } from '@/lib/fetch';

export interface VectorizeResult {
	svgContent: string;
	originalName: string;
	isColor: boolean;
}

export async function vectorizeImage(
	file: File,
	opts?: { useCredits?: boolean },
): Promise<VectorizeResult> {
	const formData = new FormData();
	formData.append('image', file);
	if (opts?.useCredits) {
		formData.append('useCredits', 'true');
	}
	const { data } = await api.post<VectorizeResult>('/vectorize', formData);
	return data;
}
```

> O interceptor em `lib/fetch.ts` já remove o `Content-Type` quando o body é `FormData`, deixando o browser definir o boundary multipart. Endpoint backend assumido: `POST {NEXT_PUBLIC_API_URL}/vectorize`.

- [ ] **Step 2: Permitir `useCredits` no hook**

Em `src/hooks/use-vectors.ts`, substituir a função `useVectorizeImage` por:

```ts
export function useVectorizeImage() {
	return useMutation({
		mutationFn: ({
			file,
			useCredits,
		}: {
			file: File;
			useCredits: boolean;
		}) => vectorizeImage(file, { useCredits }),
		onSuccess: () => {
			toast.success('Imagem vetorizada com sucesso!');
		},
		onError: () => {
			toast.error('Erro ao vetorizar imagem');
		},
	});
}
```

- [ ] **Step 3: Ligar `vetorizacao-view.tsx` ao `useCreditAction`**

Em `src/components/vetorizacao/vetorizacao-view.tsx`:

a) Adicionar imports:

```tsx
import { CreditConfirmModal } from '@/components/credits/credit-confirm-modal';
import { useCreditAction } from '@/hooks/use-credit-action';
import { useVoxBalance, useVoxCosts } from '@/hooks/use-credits';
```

b) Onde `vectorizeMutation` é definido (linha ~766), adicionar abaixo:

```tsx
	const { data: voxBalance } = useVoxBalance();
	const { data: voxCosts } = useVoxCosts();
	const vectorizeCost =
		voxCosts?.find((c) => c.feature === 'vectorize')?.cost ?? 1;
	const [pendingFile, setPendingFile] = useState<File | null>(null);

	const creditAction = useCreditAction({
		feature: 'vectorize',
		cost: vectorizeCost,
		balance: voxBalance?.balance ?? 0,
		run: async ({ useCredits }) => {
			if (!pendingFile) throw new Error('no-file');
			const res = await vectorizeMutation.mutateAsync({
				file: pendingFile,
				useCredits,
			});
			setResult(res);
			return res;
		},
	});
```

c) Substituir o bloco de auto-vetorização (linhas ~787-794, o `try { const res = await vectorizeMutation.mutateAsync(selectedFile); setResult(res); } catch {}`) por:

```tsx
			// Confirmação proativa de voxes antes de vetorizar
			setPendingFile(selectedFile);
			creditAction.trigger();
```

E remover `vectorizeMutation` das deps desse `useCallback`, deixando `[creditAction]`.

d) Renderizar o modal no JSX principal (próximo ao topo do retorno do componente, junto aos outros overlays):

```tsx
			{creditAction.modal && (
				<CreditConfirmModal
					variant={creditAction.modal.variant}
					cost={creditAction.modal.cost}
					balance={creditAction.modal.balance}
					canUseCredits={creditAction.modal.canUseCredits}
					pending={creditAction.pending}
					onConfirm={creditAction.confirm}
					onClose={creditAction.close}
				/>
			)}
```

> Garantir que `useState` está importado de `react` (já está no arquivo).

- [ ] **Step 4: Ajustar `vectorization-upload.tsx`**

Em `src/components/vetorizacao/vectorization-upload.tsx`, na linha ~88 trocar:

```tsx
					const result = await vectorizeMutation.mutateAsync(file);
```

por:

```tsx
					const result = await vectorizeMutation.mutateAsync({
						file,
						useCredits: true,
					});
```

> Este componente processa lote; usa confirmação reativa via 402. Como `useCredits:true` já vai na chamada, o backend cobra direto; se faltar saldo retorna 402 `insufficient_balance` e o `catch` existente marca o arquivo como erro (comportamento aceitável para o fluxo de lote). Sem modal aqui (YAGNI — o fluxo principal de confirmação é o single-file da view).

- [ ] **Step 5: Ajustar `vector-list.tsx`**

Em `src/components/vetorizacao/vector-list.tsx`, na linha ~92 trocar:

```tsx
				const result = await vectorizeImage(replaceFile);
```

por:

```tsx
				const result = await vectorizeImage(replaceFile, { useCredits: true });
```

- [ ] **Step 6: Deletar o proxy local**

```bash
git rm src/app/api/vectorize/route.ts
```

- [ ] **Step 7: Verificar lint/build**

Run: `npx @biomejs/biome check src/services/vectorize.ts src/hooks/use-vectors.ts src/components/vetorizacao && npm run build`
Expected: build sem erros; nenhuma referência remanescente a `/api/vectorize` (`grep -rn "api/vectorize" src` deve retornar vazio).

- [ ] **Step 8: Checagem manual**

- Vetorizar 1 imagem na view → modal de confirmação → confirmar → SVG gerado, saldo cai.
- Sem saldo → modal "Comprar voxes".
- Lote (upload múltiplo) cobra direto; sem saldo marca erro no item.

- [ ] **Step 9: Commit**

```bash
git add src/services/vectorize.ts src/hooks/use-vectors.ts src/components/vetorizacao
git commit -m "feat(vox): migrate vectorization to backend with vox confirmation"
```

---

## Task 10: Integração no Editor IA

**Files:**
- Modify: `src/types/editor-ai.ts`
- Modify: `src/services/editor-ai.ts` (sem mudança de assinatura — body repassa flag)
- Modify: `src/hooks/use-editor-ai.ts`
- Modify: `src/components/canva/design-editor-view.tsx` (~153-180)

- [ ] **Step 1: Adicionar `useCredits` aos payloads**

Em `src/types/editor-ai.ts`:

```ts
export interface EditorAiPayload {
	mode: EditorAiMode;
	prompt: string;
	image?: string;
	regionInfo?: { x: number; y: number; width: number; height: number };
	mask?: string;
	useCredits?: boolean;
}
```

```ts
export interface RemoveBackgroundPayload {
	image: string;
	useCredits?: boolean;
}
```

(`ApplyColorPayload` permanece sem `useCredits` — não consome vox.)

- [ ] **Step 2: Service**

`src/services/editor-ai.ts` já envia o payload inteiro no body; o campo `useCredits` trafega sem mudança. Não alterar.

- [ ] **Step 3: Hooks aceitam o payload com flag**

`src/hooks/use-editor-ai.ts` já passa o payload diretamente para os services; com os tipos atualizados, nenhuma mudança de código é necessária. Confirmar que `useEditorAiGenerate` e `useRemoveBackground` continuam recebendo o payload inteiro (sem alteração).

- [ ] **Step 4: Ligar o editor ao `useCreditAction`**

Em `src/components/canva/design-editor-view.tsx`:

a) Adicionar imports:

```tsx
import { CreditConfirmModal } from '@/components/credits/credit-confirm-modal';
import { useCreditAction } from '@/hooks/use-credit-action';
import { useVoxBalance, useVoxCosts } from '@/hooks/use-credits';
```

b) Onde `aiGenerate`/`removeBg` são definidos (~82-84), adicionar abaixo:

```tsx
	const { data: voxBalance } = useVoxBalance();
	const { data: voxCosts } = useVoxCosts();
	const editorCost =
		voxCosts?.find((c) => c.feature === 'editor-ai')?.cost ?? 1;

	const generateAction = useCreditAction({
		feature: 'editor-ai',
		cost: editorCost,
		balance: voxBalance?.balance ?? 0,
		run: async ({ useCredits }) => {
			const result = await aiGenerate.mutateAsync({
				mode: aiMode,
				prompt: aiPrompt.trim(),
				image: aiMode === 'edit' && currentImage ? currentImage : undefined,
				useCredits,
			});
			updateImage(result.imageBase64);
			setAiPrompt('');
			return result;
		},
	});

	const removeBgAction = useCreditAction({
		feature: 'editor-ai',
		cost: editorCost,
		balance: voxBalance?.balance ?? 0,
		run: async ({ useCredits }) => {
			if (!currentImage) throw new Error('no-image');
			const result = await removeBg.mutateAsync({
				image: currentImage,
				useCredits,
			});
			updateImage(result.imageBase64);
			return result;
		},
	});
```

c) Substituir o corpo de `handleGenerate` (~153-168) por:

```tsx
	const handleGenerate = useCallback(() => {
		if (!aiPrompt.trim()) {
			toast.error('Escreva um prompt para gerar.');
			return;
		}
		generateAction.trigger();
	}, [aiPrompt, generateAction]);
```

d) Substituir o corpo de `handleRemoveBg` (~170-180) por:

```tsx
	const handleRemoveBg = useCallback(() => {
		if (!currentImage) return;
		removeBgAction.trigger();
	}, [currentImage, removeBgAction]);
```

> `handleApplyColor` permanece inalterado.

e) No JSX retornado, junto aos overlays do editor, adicionar:

```tsx
			{generateAction.modal && (
				<CreditConfirmModal
					variant={generateAction.modal.variant}
					cost={generateAction.modal.cost}
					balance={generateAction.modal.balance}
					canUseCredits={generateAction.modal.canUseCredits}
					pending={generateAction.pending}
					onConfirm={generateAction.confirm}
					onClose={generateAction.close}
				/>
			)}
			{removeBgAction.modal && (
				<CreditConfirmModal
					variant={removeBgAction.modal.variant}
					cost={removeBgAction.modal.cost}
					balance={removeBgAction.modal.balance}
					canUseCredits={removeBgAction.modal.canUseCredits}
					pending={removeBgAction.pending}
					onConfirm={removeBgAction.confirm}
					onClose={removeBgAction.close}
				/>
			)}
```

- [ ] **Step 5: Verificar lint/build**

Run: `npx @biomejs/biome check src/types/editor-ai.ts src/components/canva/design-editor-view.tsx && npm run build`
Expected: build sem erros.

- [ ] **Step 6: Checagem manual**

- Gerar imagem IA → modal → confirmar → imagem gerada, saldo cai.
- Remover fundo → modal → confirmar → ok.
- Aplicar cor → sem modal, sem cobrança.

- [ ] **Step 7: Commit**

```bash
git add src/types/editor-ai.ts src/components/canva/design-editor-view.tsx
git commit -m "feat(vox): wire editor AI generate/remove-bg to vox confirmation"
```

---

## Task 11: Painel admin — sub-abas na aba "Voxes" de `/products`

**Files:**
- Create: `src/components/products/credits-admin-section.tsx`
- Modify: `src/app/products/page.tsx` (bloco `{activeTab === 'addons' && (...)}`)

A aba "Voxes" passa a renderizar `<CreditsAdminSection />`, que tem sub-abas internas: **Addons** (o conteúdo atual da aba), **Pacotes**, **Custos**, **Ajuste manual**.

- [ ] **Step 1: Criar `CreditsAdminSection` com sub-abas (Pacotes/Custos/Ajuste)**

`src/components/products/credits-admin-section.tsx`:

```tsx
'use client';

import { Coins, Plus, SlidersHorizontal, UserCog } from 'lucide-react';
import { useState } from 'react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import {
	useAdjustVox,
	useAllVoxPackages,
	useCreateVoxPackage,
	useSetVoxPackageStatus,
	useUpdateVoxCost,
	useUpdateVoxPackage,
	useVoxCosts,
} from '@/hooks/use-credits';
import type { VoxFeature, VoxPackage } from '@/types/credits';

type Sub = 'pacotes' | 'custos' | 'ajuste';

const FEATURES: { key: VoxFeature; label: string }[] = [
	{ key: 'previa', label: 'Prévia IA' },
	{ key: 'vectorize', label: 'Vetorização' },
	{ key: 'editor-ai', label: 'Editor IA' },
];

export function CreditsAdminSection() {
	const [sub, setSub] = useState<Sub>('pacotes');

	return (
		<div>
			<div className="flex items-center gap-2 mb-6">
				{(
					[
						['pacotes', 'Pacotes', Coins],
						['custos', 'Custos', SlidersHorizontal],
						['ajuste', 'Ajuste manual', UserCog],
					] as const
				).map(([key, label, Icon]) => (
					<button
						key={key}
						type="button"
						onClick={() => setSub(key)}
						className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
							sub === key
								? 'bg-violet-600 text-white'
								: 'bg-white dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-800'
						}`}
					>
						<Icon className="w-4 h-4" />
						{label}
					</button>
				))}
			</div>

			{sub === 'pacotes' && <PackagesPanel />}
			{sub === 'custos' && <CostsPanel />}
			{sub === 'ajuste' && <AdjustPanel />}
		</div>
	);
}

function PackagesPanel() {
	const { data: packages, isLoading } = useAllVoxPackages();
	const createMut = useCreateVoxPackage();
	const updateMut = useUpdateVoxPackage();
	const statusMut = useSetVoxPackageStatus();
	const [editing, setEditing] = useState<VoxPackage | null>(null);
	const [open, setOpen] = useState(false);

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<p className="text-sm text-slate-600 dark:text-gray-400">
					Pacotes de voxes. Criar gera produto/preço no Stripe automaticamente.
				</p>
				<button
					type="button"
					onClick={() => {
						setEditing(null);
						setOpen(true);
					}}
					className="flex items-center gap-2 bg-violet-600 rounded-xl px-5 py-3 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
				>
					<Plus className="w-4 h-4" />
					Novo pacote
				</button>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-16">
					<div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{(packages ?? []).map((p) => (
						<div
							key={p.id}
							className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-5"
						>
							<div className="flex items-start justify-between">
								<p className="font-bold text-slate-900 dark:text-white">
									{p.name}
								</p>
								<span
									className={`text-xs px-2 py-1 rounded-md ${p.active === false ? 'bg-slate-500/15 text-slate-500' : 'bg-emerald-500/15 text-emerald-600'}`}
								>
									{p.active === false ? 'Inativo' : 'Ativo'}
								</span>
							</div>
							<p className="text-sm text-slate-500 mt-1">
								{p.credits} voxes · R$ {p.price.toFixed(2)}
							</p>
							<div className="flex gap-2 mt-4">
								<button
									type="button"
									onClick={() => {
										setEditing(p);
										setOpen(true);
									}}
									className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10"
								>
									Editar
								</button>
								<button
									type="button"
									onClick={() =>
										statusMut.mutate({
											id: p.id,
											active: p.active === false,
										})
									}
									className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10"
								>
									{p.active === false ? 'Ativar' : 'Desativar'}
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{open && (
				<PackageModal
					editing={editing}
					pending={createMut.isPending || updateMut.isPending}
					onClose={() => setOpen(false)}
					onSubmit={(payload) => {
						if (editing) {
							updateMut.mutate(
								{ id: editing.id, payload },
								{ onSuccess: () => setOpen(false) },
							);
						} else {
							createMut.mutate(payload, { onSuccess: () => setOpen(false) });
						}
					}}
				/>
			)}
		</div>
	);
}

function PackageModal({
	editing,
	pending,
	onClose,
	onSubmit,
}: {
	editing: VoxPackage | null;
	pending: boolean;
	onClose: () => void;
	onSubmit: (p: {
		name: string;
		description?: string;
		credits: number;
		price: number;
	}) => void;
}) {
	const [name, setName] = useState(editing?.name ?? '');
	const [description, setDescription] = useState(editing?.description ?? '');
	const [credits, setCredits] = useState(String(editing?.credits ?? ''));
	const [price, setPrice] = useState(String(editing?.price ?? ''));

	return (
		<ModalOverlay onClose={onClose}>
			<div className="p-6 space-y-4">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					{editing ? 'Editar pacote' : 'Novo pacote'}
				</h3>
				<Field label="Nome">
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
					/>
				</Field>
				<Field label="Descrição (opcional)">
					<input
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
					/>
				</Field>
				<div className="grid grid-cols-2 gap-3">
					<Field label="Voxes">
						<input
							type="number"
							value={credits}
							onChange={(e) => setCredits(e.target.value)}
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
						/>
					</Field>
					<Field label="Preço (R$)">
						<input
							type="number"
							step="0.01"
							value={price}
							onChange={(e) => setPrice(e.target.value)}
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
						/>
					</Field>
				</div>
				<div className="flex gap-3 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-white/10"
					>
						Cancelar
					</button>
					<button
						type="button"
						disabled={pending || !name || !credits || !price}
						onClick={() =>
							onSubmit({
								name: name.trim(),
								description: description.trim() || undefined,
								credits: Number(credits),
								price: Number(price),
							})
						}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white disabled:opacity-60"
					>
						{pending ? 'Salvando...' : 'Salvar'}
					</button>
				</div>
			</div>
		</ModalOverlay>
	);
}

function CostsPanel() {
	const { data: costs } = useVoxCosts();
	const updateMut = useUpdateVoxCost();
	const [draft, setDraft] = useState<Record<string, string>>({});

	return (
		<div className="max-w-md space-y-4">
			{FEATURES.map((f) => {
				const current = costs?.find((c) => c.feature === f.key)?.cost ?? 0;
				return (
					<div
						key={f.key}
						className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 p-4"
					>
						<span className="flex-1 text-sm font-medium text-slate-700 dark:text-gray-200">
							{f.label}
						</span>
						<input
							type="number"
							defaultValue={current}
							onChange={(e) =>
								setDraft((d) => ({ ...d, [f.key]: e.target.value }))
							}
							className="w-24 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
						/>
						<button
							type="button"
							disabled={updateMut.isPending}
							onClick={() =>
								updateMut.mutate({
									feature: f.key,
									cost: Number(draft[f.key] ?? current),
								})
							}
							className="px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white disabled:opacity-60"
						>
							Salvar
						</button>
					</div>
				);
			})}
		</div>
	);
}

function AdjustPanel() {
	const adjustMut = useAdjustVox();
	const [customerId, setCustomerId] = useState('');
	const [amount, setAmount] = useState('');
	const [reason, setReason] = useState('');

	return (
		<div className="max-w-md space-y-4">
			<Field label="Customer ID">
				<input
					value={customerId}
					onChange={(e) => setCustomerId(e.target.value)}
					className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
				/>
			</Field>
			<Field label="Quantidade (use negativo para debitar)">
				<input
					type="number"
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
				/>
			</Field>
			<Field label="Motivo">
				<input
					value={reason}
					onChange={(e) => setReason(e.target.value)}
					className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
				/>
			</Field>
			<button
				type="button"
				disabled={
					adjustMut.isPending || !customerId || !amount || !reason
				}
				onClick={() =>
					adjustMut.mutate(
						{
							customerId: customerId.trim(),
							amount: Number(amount),
							reason: reason.trim(),
						},
						{
							onSuccess: () => {
								setCustomerId('');
								setAmount('');
								setReason('');
							},
						},
					)
				}
				className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white disabled:opacity-60"
			>
				{adjustMut.isPending ? 'Aplicando...' : 'Aplicar ajuste'}
			</button>
			<p className="text-xs text-slate-400">
				O saldo nunca fica abaixo de zero (validado no backend).
			</p>
		</div>
	);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<label className="block">
			<span className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5">
				{label}
			</span>
			{children}
		</label>
	);
}
```

- [ ] **Step 2: Encaixar a sub-aba "Addons" + "Pacotes/Custos/Ajuste" na aba Voxes**

Em `src/app/products/page.tsx`:

a) Adicionar o import no topo (junto aos demais imports de `@/components/products/...`):

```tsx
import { CreditsAdminSection } from '@/components/products/credits-admin-section';
```

b) O bloco atual da aba é `{activeTab === 'addons' && ( ... )}`. Envolvê-lo com uma sub-navegação. Adicionar um estado de sub-aba no topo do componente `Produtos` (junto aos outros `useState`):

```tsx
	const [voxesSub, setVoxesSub] = useState<'addons' | 'creditos'>('addons');
```

c) Substituir a linha de abertura `{activeTab === 'addons' && (` e seu conteúdo, passando a renderizar a sub-navegação. Estrutura final do bloco:

```tsx
				{activeTab === 'addons' && (
					<>
						<div className="flex items-center gap-2 mb-6">
							<button
								type="button"
								onClick={() => setVoxesSub('addons')}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
									voxesSub === 'addons'
										? 'bg-violet-600 text-white'
										: 'bg-white dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-800'
								}`}
							>
								Addons
							</button>
							<button
								type="button"
								onClick={() => setVoxesSub('creditos')}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
									voxesSub === 'creditos'
										? 'bg-violet-600 text-white'
										: 'bg-white dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-800'
								}`}
							>
								Voxes (créditos)
							</button>
						</div>

						{voxesSub === 'creditos' ? (
							<CreditsAdminSection />
						) : (
							<>
								{/* >>> conteúdo ORIGINAL da aba addons, intocado <<< */}
							</>
						)}
					</>
				)}
```

> No lugar do comentário `{/* >>> conteúdo ORIGINAL ... <<< */}`, mover **exatamente** o JSX que hoje está dentro de `{activeTab === 'addons' && ( ... )}` (o header "Funcionalidades extras...", o botão "Novo vox", os estados de loading/erro/vazio e o `grid` de `AddonCard`). Nenhuma linha desse conteúdo é alterada — apenas recortada para dentro do `voxesSub === 'addons'`.

- [ ] **Step 3: Verificar lint/build**

Run: `npx @biomejs/biome check src/components/products/credits-admin-section.tsx src/app/products/page.tsx && npm run build`
Expected: build sem erros.

- [ ] **Step 4: Checagem manual**

- `/products` → aba "Voxes" → sub-aba "Addons" mostra o que existia antes (sem regressão).
- Sub-aba "Voxes (créditos)" → Pacotes (criar/editar/ativar-desativar), Custos (salvar custo por feature), Ajuste manual (aplicar ± com motivo).

- [ ] **Step 5: Commit**

```bash
git add src/components/products/credits-admin-section.tsx src/app/products/page.tsx
git commit -m "feat(vox): add credits admin sub-tabs under products Voxes tab"
```

---

## Verificação final

- [ ] `npm run build` conclui sem erros.
- [ ] `npx @biomejs/biome check src` sem erros.
- [ ] `grep -rn "api/vectorize" src` retorna vazio (proxy aposentado).
- [ ] Fluxo ponta-a-ponta manual: comprar pacote → redirect Stripe → voltar para `/course` → abrir `/course/voxes` com `?session_id` → faixa de processamento → saldo sobe.
- [ ] Prévia (cota → 429 → vox), Vetorização (modal → vox), Editor (gerar/remover fundo → vox), Aplicar cor (sem cobrança).
- [ ] Admin: pacotes/custos/ajuste funcionam; aba Addons sem regressão.

## Cobertura da spec (self-review)

- §1 Camada base → Tasks 1-3 ✔
- §2 Camada de cobrança (modal + useCreditAction) → Tasks 4-5 ✔
- §3 Integração prévia/vetorização/editor → Tasks 8, 9, 10 ✔
- §4 Hub `/course/voxes` + pill + sidebar + polling Stripe → Tasks 6, 7 ✔
- §5 Admin sub-abas na aba Voxes → Task 11 ✔
- Erros/loading: tratados no `useCreditAction` + estados de loading nas views ✔
- Premissas (endpoint backend de vetorização; `COURSES_URL`): documentadas na spec; o plano assume `POST /vectorize` e retorno para qualquer rota sob `/course`.
