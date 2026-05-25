# Auth Module Pilot — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar o domínio `auth` para `src/modules/auth/` no padrão de módulos, criar o módulo mínimo `me`, e migrar o front para `POST /v1/auth/*` + `GET /v1/me` da upvox-api v1 — unificando login customer/admin em um único fluxo com role resolvida pelo `/me`.

**Architecture:** O piloto valida o padrão `src/modules/<nome>/{components,hooks,services,types,index.ts}` com fronteira via barrel. `src/lib/{auth,fetch}.ts` movem para `src/shared/lib/`. Token storage perde a distinção de role (`pl_customer_token`/`pl_user_token` → `pl_token`). `AuthGuard` passa a usar `useMe()` (react-query) para determinar role. Páginas `/login`, `/register`, `/forgot-password`, `/reset-password` atualizadas ao contrato v1; `/login/admin` é removido.

**Tech Stack:** Next.js 16 (App Router), React 19, TanStack Query, axios, zod, sonner, Tailwind v4, Biome.

**Escopo deste plano:** APENAS o piloto `auth` + `me` mínimo. Route groups `(admin)`/`(customer)`/`(public)` em `src/app/` ficam para um PR estrutural separado depois. Demais módulos (`users`, `plans`, `subscriptions`, `courses`, etc.) terão seus próprios planos.

**Convenções do projeto:**
- Sem suite de testes automatizados. Verificação por `npm run build` + `npm run lint` + smoke manual no `npm run dev`.
- Commits seguem padrão Conventional Commits curto (ver `git log`). NÃO commitar sem o usuário pedir — passos de `git commit` abaixo são instruções para o engenheiro que executa o plano.
- Tabs (não espaços) — `biome.json` controla a formatação; o lint `--write` formata automaticamente.

---

## File Structure (alvo final do piloto)

**Criar:**
- `src/shared/lib/auth.ts` — token único, sem `AuthRole`
- `src/shared/lib/fetch.ts` — axios client + interceptor sem `isAdmin()`
- `src/modules/auth/index.ts` — barrel
- `src/modules/auth/types/auth.ts` — schemas v1 (login, signup, forgot, reset)
- `src/modules/auth/services/auth.service.ts` — signup/login/forgot/reset
- `src/modules/auth/hooks/use-login.ts`
- `src/modules/auth/hooks/use-signup.ts`
- `src/modules/auth/hooks/use-forgot-password.ts`
- `src/modules/auth/hooks/use-reset-password.ts`
- `src/modules/auth/components/auth-guard.tsx` (movido + adaptado)
- `src/modules/auth/components/change-password-modal.tsx` (movido)
- `src/modules/me/index.ts` — barrel
- `src/modules/me/types/me.ts` — Me schema
- `src/modules/me/services/me.service.ts` — `getMe()`
- `src/modules/me/hooks/use-me.ts` — `useMe()`

**Modificar (atualizar imports + lógica):**
- `src/app/login/page.tsx` — remover link `/login/admin`, usar `useLogin()` unificado
- `src/app/register/page.tsx` — remover tabs customer/admin, usar `useSignup()`
- `src/app/forgot-password/page.tsx` — usar `useForgotPassword()`
- `src/app/reset-password/page.tsx` — novo contrato `{ access_token, new_password }`
- `src/components/providers.tsx` — import de `AuthGuard` muda de `@/components/auth-guard` para `@/modules/auth`
- `src/components/store/user-badge.tsx` — substituir `getToken('user')` por `useMe()` e `clearAllTokens()` por `clearToken()`
- `src/hooks/use-permissions.ts` — usar `useMe()` para role
- `src/components/course/saved-lessons-modal.tsx` — usar `useMe()` ou `getCurrentUser()`
- `src/app/course/<slug>/vitrine/page.tsx` (e variantes) — usar `useMe()` para detectar admin
- Demais 50+ arquivos que importavam `@/lib/auth`/`@/lib/fetch` — sweep de imports para `@/shared/lib/...`
- 5 arquivos que importavam `@/services/auth`, `@/hooks/use-auth`, `@/types/auth`, `@/components/auth` — sweep para `@/modules/auth`

**Deletar (no fim, após zero referências):**
- `src/services/auth.ts`
- `src/hooks/use-auth.ts`
- `src/types/auth.ts`
- `src/lib/auth.ts`
- `src/lib/fetch.ts`
- `src/components/auth-guard.tsx`
- `src/components/auth/` (pasta inteira)
- `src/app/login/admin/page.tsx` (e a pasta `admin/`)

---

## Task 1: Criar `src/shared/lib/auth.ts` (token único)

**Files:**
- Create: `src/shared/lib/auth.ts`

- [ ] **Step 1: Criar diretório e arquivo**

```bash
mkdir -p src/shared/lib
```

Criar `src/shared/lib/auth.ts`:

```ts
const TOKEN_KEY = 'pl_token';

export function saveToken(token: string) {
	localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
	localStorage.removeItem(TOKEN_KEY);
}

export interface JwtPayload {
	name?: string;
	email?: string;
	sub?: string;
	role?: string;
	exp?: number;
}

export function decodeJwt(token: string): JwtPayload | null {
	try {
		const base64Url = token.split('.')[1];
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		const json = decodeURIComponent(
			atob(base64)
				.split('')
				.map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
				.join(''),
		);
		return JSON.parse(json) as JwtPayload;
	} catch {
		return null;
	}
}

export function isTokenValid(token: string): boolean {
	const payload = decodeJwt(token);
	if (!payload) return false;
	if (!payload.exp) return true;
	return payload.exp * 1000 > Date.now();
}

export function getCurrentUser(): JwtPayload | null {
	const token = getToken();
	if (!token) return null;
	if (!isTokenValid(token)) {
		clearToken();
		return null;
	}
	return decodeJwt(token);
}
```

Verificação: `npm run lint` — deve formatar sem erros.

---

## Task 2: Criar `src/shared/lib/fetch.ts` (interceptor sem role)

**Files:**
- Create: `src/shared/lib/fetch.ts`

- [ ] **Step 1: Criar arquivo**

```ts
import axios from 'axios';
import { clearToken, getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
	baseURL: API_URL,
	headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
	const token = getToken();
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	if (config.data instanceof FormData) {
		delete config.headers['Content-Type'];
	}
	return config;
});

const PUBLIC_PAGE_PREFIXES = [
	'/store',
	'/checkout',
	'/login',
	'/register',
	'/forgot-password',
	'/reset-password',
	'/payment-link',
	'/promo-link',
	'/global-promo-link',
];

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			const path =
				typeof window !== 'undefined' ? window.location.pathname : '';
			const isPublicPage =
				path === '/' || PUBLIC_PAGE_PREFIXES.some((p) => path.startsWith(p));

			if (!isPublicPage) {
				clearToken();
				window.location.href = '/login';
			}
		}
		return Promise.reject(error);
	},
);
```

Verificação: `npm run lint`.

---

## Task 3: Criar types do módulo `auth`

**Files:**
- Create: `src/modules/auth/types/auth.ts`

- [ ] **Step 1: Criar diretório e arquivo**

```bash
mkdir -p src/modules/auth/types
```

Criar `src/modules/auth/types/auth.ts`:

```ts
import { z } from 'zod';

// Login — POST /v1/auth/login
export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});
export type LoginPayload = z.infer<typeof loginSchema>;

// Signup — POST /v1/auth/signup
// phone deve seguir E.164: ^\+[1-9]\d{7,14}$
export const signupSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	phone: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Formato E.164: +5511999999999'),
	name: z.string().min(1).optional(),
});
export type SignupPayload = z.infer<typeof signupSchema>;

// Forgot password — POST /v1/auth/forgot-password
export const forgotPasswordSchema = z.object({
	email: z.string().email(),
});
export type ForgotPasswordPayload = z.infer<typeof forgotPasswordSchema>;

// Reset password — POST /v1/auth/reset-password
export const resetPasswordSchema = z.object({
	access_token: z.string().min(1),
	new_password: z.string().min(8),
});
export type ResetPasswordPayload = z.infer<typeof resetPasswordSchema>;

// Responses
export const authTokenResponseSchema = z.object({
	token: z.string(),
});
export type AuthTokenResponse = z.infer<typeof authTokenResponseSchema>;

export const authMessageResponseSchema = z.object({
	message: z.string(),
});
export type AuthMessageResponse = z.infer<typeof authMessageResponseSchema>;
```

Verificação: `npm run lint`.

---

## Task 4: Criar service do módulo `auth`

**Files:**
- Create: `src/modules/auth/services/auth.service.ts`

- [ ] **Step 1: Criar diretório e arquivo**

```bash
mkdir -p src/modules/auth/services
```

Criar `src/modules/auth/services/auth.service.ts`:

```ts
import { api } from '@/shared/lib/fetch';
import {
	type AuthTokenResponse,
	type ForgotPasswordPayload,
	type LoginPayload,
	type ResetPasswordPayload,
	type SignupPayload,
	authMessageResponseSchema,
	authTokenResponseSchema,
} from '../types/auth';

export async function login(payload: LoginPayload): Promise<AuthTokenResponse> {
	const { data } = await api.post('/v1/auth/login', payload);
	return authTokenResponseSchema.parse(data);
}

export async function signup(payload: SignupPayload): Promise<string> {
	const { data } = await api.post('/v1/auth/signup', payload);
	return authMessageResponseSchema.parse(data).message;
}

export async function forgotPassword(
	payload: ForgotPasswordPayload,
): Promise<string> {
	const { data } = await api.post('/v1/auth/forgot-password', payload);
	return authMessageResponseSchema.parse(data).message;
}

export async function resetPassword(
	payload: ResetPasswordPayload,
): Promise<string> {
	const { data } = await api.post('/v1/auth/reset-password', payload);
	return authMessageResponseSchema.parse(data).message;
}
```

Verificação: `npm run lint`.

---

## Task 5: Criar módulo `me` mínimo (types + service + hook)

**Files:**
- Create: `src/modules/me/types/me.ts`
- Create: `src/modules/me/services/me.service.ts`
- Create: `src/modules/me/hooks/use-me.ts`
- Create: `src/modules/me/index.ts`

- [ ] **Step 1: Criar diretórios**

```bash
mkdir -p src/modules/me/{types,services,hooks}
```

- [ ] **Step 2: `src/modules/me/types/me.ts`**

```ts
import { z } from 'zod';

export const meSchema = z.object({
	id: z.string(),
	email: z.string().email(),
	name: z.string().nullable().optional(),
	role: z.string(),
});
export type Me = z.infer<typeof meSchema>;

export const updateMeSchema = z.object({
	name: z.string().min(1),
});
export type UpdateMePayload = z.infer<typeof updateMeSchema>;
```

> Nota: a resposta real de `GET /v1/me` pode incluir mais campos; usar `.passthrough()` se necessário ao integrar. Mantemos o schema mínimo aqui para o piloto.

- [ ] **Step 3: `src/modules/me/services/me.service.ts`**

```ts
import { api } from '@/shared/lib/fetch';
import { type Me, type UpdateMePayload, meSchema } from '../types/me';

export async function getMe(): Promise<Me> {
	const { data } = await api.get('/v1/me');
	return meSchema.parse(data);
}

export async function updateMe(payload: UpdateMePayload): Promise<Me> {
	const { data } = await api.patch('/v1/me', payload);
	return meSchema.parse(data);
}
```

- [ ] **Step 4: `src/modules/me/hooks/use-me.ts`**

```ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getToken } from '@/shared/lib/auth';
import { getMe, updateMe } from '../services/me.service';

export const meQueryKey = ['me'] as const;

export function useMe() {
	return useQuery({
		queryKey: meQueryKey,
		queryFn: getMe,
		enabled: typeof window !== 'undefined' && !!getToken(),
		staleTime: 5 * 60 * 1000,
		retry: false,
	});
}

export function useIsAdmin() {
	const { data } = useMe();
	return data?.role === 'admin' || data?.role === 'staff';
}

export function useUpdateMe() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: updateMe,
		onSuccess: (me) => qc.setQueryData(meQueryKey, me),
	});
}
```

- [ ] **Step 5: `src/modules/me/index.ts`**

```ts
export { useMe, useIsAdmin, useUpdateMe, meQueryKey } from './hooks/use-me';
export { getMe, updateMe } from './services/me.service';
export { meSchema, updateMeSchema } from './types/me';
export type { Me, UpdateMePayload } from './types/me';
```

Verificação: `npm run lint`.

---

## Task 6: Criar hooks do módulo `auth`

**Files:**
- Create: `src/modules/auth/hooks/use-login.ts`
- Create: `src/modules/auth/hooks/use-signup.ts`
- Create: `src/modules/auth/hooks/use-forgot-password.ts`
- Create: `src/modules/auth/hooks/use-reset-password.ts`

- [ ] **Step 1: Criar diretório**

```bash
mkdir -p src/modules/auth/hooks
```

- [ ] **Step 2: `src/modules/auth/hooks/use-login.ts`** — login + fetch me + redireciona por role

```ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getMe } from '@/modules/me';
import { meQueryKey } from '@/modules/me';
import { saveToken } from '@/shared/lib/auth';
import { login } from '../services/auth.service';
import type { LoginPayload } from '../types/auth';

export function useLogin() {
	const router = useRouter();
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (payload: LoginPayload) => {
			const { token } = await login(payload);
			saveToken(token);
			const me = await getMe();
			qc.setQueryData(meQueryKey, me);
			return me;
		},
		onSuccess: (me) => {
			const isAdmin = me.role === 'admin' || me.role === 'staff';
			router.push(isAdmin ? '/dashboard' : '/course');
		},
	});
}
```

- [ ] **Step 3: `src/modules/auth/hooks/use-signup.ts`**

```ts
'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { signup } from '../services/auth.service';
import type { SignupPayload } from '../types/auth';

export function useSignup() {
	const router = useRouter();
	return useMutation({
		mutationFn: (payload: SignupPayload) => signup(payload),
		onSuccess: () => router.push('/login'),
	});
}
```

- [ ] **Step 4: `src/modules/auth/hooks/use-forgot-password.ts`**

```ts
'use client';

import { useMutation } from '@tanstack/react-query';
import { forgotPassword } from '../services/auth.service';
import type { ForgotPasswordPayload } from '../types/auth';

export function useForgotPassword() {
	return useMutation({
		mutationFn: (payload: ForgotPasswordPayload) => forgotPassword(payload),
	});
}
```

- [ ] **Step 5: `src/modules/auth/hooks/use-reset-password.ts`**

```ts
'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { resetPassword } from '../services/auth.service';
import type { ResetPasswordPayload } from '../types/auth';

export function useResetPassword() {
	const router = useRouter();
	return useMutation({
		mutationFn: (payload: ResetPasswordPayload) => resetPassword(payload),
		onSuccess: () => router.push('/login'),
	});
}
```

Verificação: `npm run lint`.

---

## Task 7: Mover e adaptar `AuthGuard`

**Files:**
- Create: `src/modules/auth/components/auth-guard.tsx`
- Delete (depois): `src/components/auth-guard.tsx`

- [ ] **Step 1: Criar diretório**

```bash
mkdir -p src/modules/auth/components
```

- [ ] **Step 2: `src/modules/auth/components/auth-guard.tsx`**

```tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMe } from '@/modules/me';
import { getCurrentUser } from '@/shared/lib/auth';

const PUBLIC_PATHS = [
	'/login',
	'/register',
	'/forgot-password',
	'/reset-password',
	'/store',
	'/',
	'/checkout',
	'/payment-link',
	'/promo-link',
	'/global-promo-link',
];

const ADMIN_PATHS = [
	'/dashboard',
	'/products',
	'/sales',
	'/links',
	'/reports',
	'/community',
	'/acessos',
	'/forum',
];

function isAdminPath(pathname: string): boolean {
	return ADMIN_PATHS.some((p) =>
		p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(`${p}/`),
	);
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const me = useMe();
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const isPublic = PUBLIC_PATHS.some((p) =>
			p === '/' ? pathname === '/' : pathname.startsWith(p),
		);

		if (isPublic) {
			setReady(true);
			return;
		}

		// não autenticado
		if (!getCurrentUser()) {
			router.replace('/login');
			return;
		}

		// aguarda /me resolver para decidir role
		if (me.isLoading) return;

		const role = me.data?.role;
		const isAdmin = role === 'admin' || role === 'staff';

		if (!isAdmin && isAdminPath(pathname)) {
			router.replace('/store');
			return;
		}

		setReady(true);
	}, [pathname, router, me.isLoading, me.data]);

	if (!ready) return null;

	return <>{children}</>;
}
```

Verificação: `npm run lint`.

---

## Task 8: Mover `ChangePasswordModal`

**Files:**
- Move: `src/components/auth/change-password-modal.tsx` → `src/modules/auth/components/change-password-modal.tsx`

- [ ] **Step 1: Mover arquivo**

```bash
mv src/components/auth/change-password-modal.tsx src/modules/auth/components/change-password-modal.tsx
rmdir src/components/auth 2>/dev/null || true
```

- [ ] **Step 2: Atualizar imports internos do arquivo**

Abrir `src/modules/auth/components/change-password-modal.tsx` e ajustar qualquer import relativo. Se importava `@/services/auth` ou `@/lib/auth`, trocar para path relativo dentro do módulo ou `@/shared/lib/auth`.

Verificação: `grep -n "from '@" src/modules/auth/components/change-password-modal.tsx` — nenhum import quebrado.

---

## Task 9: Criar barrel `src/modules/auth/index.ts`

**Files:**
- Create: `src/modules/auth/index.ts`

- [ ] **Step 1: Criar arquivo**

```ts
export { AuthGuard } from './components/auth-guard';
export { ChangePasswordModal } from './components/change-password-modal';

export { useLogin } from './hooks/use-login';
export { useSignup } from './hooks/use-signup';
export { useForgotPassword } from './hooks/use-forgot-password';
export { useResetPassword } from './hooks/use-reset-password';

export {
	login,
	signup,
	forgotPassword,
	resetPassword,
} from './services/auth.service';

export {
	loginSchema,
	signupSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	authTokenResponseSchema,
	authMessageResponseSchema,
} from './types/auth';

export type {
	LoginPayload,
	SignupPayload,
	ForgotPasswordPayload,
	ResetPasswordPayload,
	AuthTokenResponse,
	AuthMessageResponse,
} from './types/auth';
```

Verificação: `npm run lint`.

---

## Task 10: Atualizar `src/app/login/page.tsx`

**Files:**
- Modify: `src/app/login/page.tsx`

- [ ] **Step 1: Substituir conteúdo**

Trocar:
- Import `useLoginCustomer` por `useLogin`
- Variável `loginCustomer` por `loginMutation`
- Remover bloco com link "É administrador?"

Patch focado:

```tsx
// linha 7
import { useLogin } from '@/modules/auth';

// dentro do componente
const loginMutation = useLogin();

function handleSubmit(e: React.FormEvent) {
	e.preventDefault();
	loginMutation.mutate(
		{ email, password },
		{ onError: () => toast.error('Email ou senha inválidos') },
	);
}

// no botão usar loginMutation.isPending no lugar de loginCustomer.isPending
// REMOVER o <p> com "É administrador? Entre aqui"
```

Verificação: `npm run lint` + abrir `/login` no `npm run dev`, conferir que o botão de "Entre aqui" sumiu.

---

## Task 11: Atualizar `src/app/register/page.tsx`

**Files:**
- Modify: `src/app/register/page.tsx`

- [ ] **Step 1: Remover tabs customer/admin, unificar em signup**

Trocar imports e lógica para usar apenas `useSignup`:

```tsx
import { useSignup } from '@/modules/auth';

// dentro do componente
const signupMutation = useSignup();

// no submit, montar payload no formato v1:
// phone DEVE ser E.164 (^\+[1-9]\d{7,14}$). Adicionar máscara/validação no input ou
// transformar a entrada do usuário antes do envio.
signupMutation.mutate(
	{ email, password, phone, name },
	{ onError: () => toast.error('Erro ao criar conta') },
);
```

Remover toda a UI de tabs (customer/admin), inputs específicos de admin (role, Permissions). O signup público só registra customer; admin é criado via `/acessos`.

Verificação: `npm run lint` + visitar `/register` em dev e validar fluxo de signup.

---

## Task 12: Atualizar `src/app/forgot-password/page.tsx`

**Files:**
- Modify: `src/app/forgot-password/page.tsx`

- [ ] **Step 1: Trocar import e chamada**

```tsx
// linha 6 — substituir
import { useForgotPassword } from '@/modules/auth';

// dentro do componente, substituir useState(loading) + try/catch por mutation
const forgotMutation = useForgotPassword();

async function handleSubmit(e: React.FormEvent) {
	e.preventDefault();
	forgotMutation.mutate(
		{ email },
		{
			onSuccess: () => setSent(true),
			onError: () => toast.error('Erro ao enviar email de recuperação'),
		},
	);
}

// trocar `loading` por `forgotMutation.isPending`
```

Verificação: `npm run lint`.

---

## Task 13: Atualizar `src/app/reset-password/page.tsx`

**Files:**
- Modify: `src/app/reset-password/page.tsx`

- [ ] **Step 1: Trocar import + adaptar ao novo contrato**

```tsx
import { useResetPassword } from '@/modules/auth';

// dentro do componente
const resetMutation = useResetPassword();

async function handleSubmit(e: React.FormEvent) {
	e.preventDefault();
	if (newPassword !== confirmPassword) {
		toast.error('As senhas não coincidem');
		return;
	}
	if (!token) {
		toast.error('Token inválido');
		return;
	}
	resetMutation.mutate(
		{ access_token: token, new_password: newPassword },
		{
			onSuccess: (message) => toast.success(message || 'Senha redefinida com sucesso!'),
			onError: () => toast.error('Erro ao redefinir senha. O token pode ter expirado.'),
		},
	);
}

// substituir `loading` por `resetMutation.isPending`
```

Verificação: `npm run lint`.

---

## Task 14: Remover `/login/admin/`

**Files:**
- Delete: `src/app/login/admin/page.tsx` + pasta

- [ ] **Step 1: Confirmar nenhum import aponta para `/login/admin`**

```bash
grep -rn "/login/admin" src/ --include="*.ts" --include="*.tsx"
```

Esperado: apenas a própria pasta `src/app/login/admin/page.tsx`. Se houver outros usos (ex: redirect hardcoded), substituir por `/login`.

- [ ] **Step 2: Deletar**

```bash
rm -rf src/app/login/admin
```

Verificação: `npm run build` deve passar.

---

## Task 15: Atualizar `src/components/providers.tsx`

**Files:**
- Modify: `src/components/providers.tsx`

- [ ] **Step 1: Trocar import do AuthGuard**

```tsx
// substituir
import { AuthGuard } from '@/components/auth-guard';
// por
import { AuthGuard } from '@/modules/auth';
```

Verificação: `npm run lint`.

---

## Task 16: Sweep — `@/lib/auth` → `@/shared/lib/auth`

**Files:**
- Modify: ~40 arquivos que importam de `@/lib/auth`

- [ ] **Step 1: Listar consumidores**

```bash
grep -rln "from '@/lib/auth'" src/ --include="*.ts" --include="*.tsx"
```

- [ ] **Step 2: Substituir em todos**

```bash
grep -rl "from '@/lib/auth'" src/ --include="*.ts" --include="*.tsx" \
  | xargs sed -i "s|from '@/lib/auth'|from '@/shared/lib/auth'|g"
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

Esperado: erros apontando para `getToken('user'|'customer')`, `isAdmin()`, `getActiveToken()`, `clearAllTokens()` — estes serão tratados na Task 17.

---

## Task 17: Migrar hotspots que dependiam de role em token

**Files:**
- Modify: `src/components/store/user-badge.tsx`
- Modify: `src/hooks/use-permissions.ts`
- Modify: `src/components/course/saved-lessons-modal.tsx`
- Modify: `src/app/course/<slug>/vitrine/page.tsx` (e arquivos similares apontados pelo build)
- Modify: outros 7 arquivos identificados pelo `npm run build`

- [ ] **Step 1: Rodar build e listar erros**

```bash
npm run build 2>&1 | grep -E "lib/auth|getToken|isAdmin|getActiveToken|clearAllTokens"
```

- [ ] **Step 2: Tratamento por padrão**

Substituições padronizadas:

| Antes | Depois |
|---|---|
| `getToken('user')` | `useIsAdmin()` (em React) ou checar via `useMe()` |
| `getToken('customer')` | `getToken()` ou `useMe()` |
| `getActiveToken()` | `getToken()` |
| `isAdmin()` | `useIsAdmin()` (React) — em util não-React, fazer função receber a role como argumento |
| `clearAllTokens()` | `clearToken()` |
| `saveToken('user', t)` / `saveToken('customer', t)` | `saveToken(t)` |

Imports adicionar: `import { useMe, useIsAdmin } from '@/modules/me'`.

Exemplo `src/components/store/user-badge.tsx`:

```tsx
// ANTES
import { clearAllTokens, getToken } from '@/lib/auth';
const isAdmin = !!getToken('user');
// ao logout:
clearAllTokens();

// DEPOIS
import { useIsAdmin } from '@/modules/me';
import { clearToken } from '@/shared/lib/auth';
const isAdmin = useIsAdmin();
// ao logout:
clearToken();
```

- [ ] **Step 3: Verificação iterativa**

Repetir `npm run build` após cada arquivo até ficar verde.

---

## Task 18: Sweep — `@/lib/fetch` → `@/shared/lib/fetch`

**Files:**
- Modify: arquivos que importam `@/lib/fetch`

- [ ] **Step 1: Substituir**

```bash
grep -rl "from '@/lib/fetch'" src/ --include="*.ts" --include="*.tsx" \
  | xargs sed -i "s|from '@/lib/fetch'|from '@/shared/lib/fetch'|g"
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

---

## Task 19: Sweep — `@/services/auth`, `@/hooks/use-auth`, `@/types/auth`, `@/components/auth` → `@/modules/auth`

**Files:**
- Modify: ~10 arquivos identificados na auditoria

- [ ] **Step 1: Substituições**

```bash
grep -rl "from '@/services/auth'" src/ --include="*.ts" --include="*.tsx" \
  | xargs sed -i "s|from '@/services/auth'|from '@/modules/auth'|g"

grep -rl "from '@/hooks/use-auth'" src/ --include="*.ts" --include="*.tsx" \
  | xargs sed -i "s|from '@/hooks/use-auth'|from '@/modules/auth'|g"

grep -rl "from '@/types/auth'" src/ --include="*.ts" --include="*.tsx" \
  | xargs sed -i "s|from '@/types/auth'|from '@/modules/auth'|g"

grep -rl "from '@/components/auth/change-password-modal'" src/ --include="*.ts" --include="*.tsx" \
  | xargs sed -i "s|from '@/components/auth/change-password-modal'|from '@/modules/auth'|g"

grep -rl "from '@/components/auth-guard'" src/ --include="*.ts" --include="*.tsx" \
  | xargs sed -i "s|from '@/components/auth-guard'|from '@/modules/auth'|g"
```

- [ ] **Step 2: Resolver renomeações de identificadores**

O barrel não exporta `useLoginCustomer`/`useLoginUser`/`useRegisterCustomer`/`useRegisterUser`/`loginCustomerSchema` etc. Os consumidores que usavam esses nomes precisam ser ajustados manualmente:

```bash
grep -rln "useLoginCustomer\|useLoginUser\|useRegisterCustomer\|useRegisterUser\|loginCustomer\|loginUser\|registerCustomer\|registerUser\|loginCustomerSchema\|registerCustomerSchema\|loginUserSchema\|registerUserSchema" src/
```

Para cada arquivo da lista:
- `useLoginCustomer`/`useLoginUser` → `useLogin`
- `useRegisterCustomer`/`useRegisterUser` → `useSignup`
- `loginCustomer`/`loginUser` (service) → `login`
- `registerCustomer`/`registerUser` (service) → `signup`
- Schemas: usar `loginSchema` / `signupSchema`

Em particular:
- `src/components/acessos/create-user-modal.tsx` — admin cria user via `/v1/user/...` (módulo `users`, fora deste piloto). Para esse arquivo, manter funcionando importando do barrel ainda inexistente seria errado — substituir temporariamente por uma chamada local de `api.post('/v1/auth/signup', ...)` ou marcar a feature como bloqueada até o módulo `users` ser implementado. Decisão: **substituir por `signup` do auth no piloto** (cria conta básica) e abrir item de follow-up para o módulo `users` tratar role/permissions.
- `src/components/checkout/checkout-auth-form.tsx` — usar `useLogin` / `useSignup`.
- `src/hooks/use-customer.ts` — usava `LoginCustomerPayload`/etc só como type; substituir por `LoginPayload`/`SignupPayload`.

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

---

## Task 20: Deletar arquivos antigos

**Files:**
- Delete: `src/services/auth.ts`
- Delete: `src/hooks/use-auth.ts`
- Delete: `src/types/auth.ts`
- Delete: `src/lib/auth.ts`
- Delete: `src/lib/fetch.ts`
- Delete: `src/components/auth-guard.tsx`

- [ ] **Step 1: Confirmar zero referências**

```bash
grep -rn "@/services/auth\|@/hooks/use-auth\|@/types/auth\|@/lib/auth\|@/lib/fetch\|@/components/auth-guard" src/ --include="*.ts" --include="*.tsx"
```

Esperado: nenhuma saída.

- [ ] **Step 2: Deletar**

```bash
rm src/services/auth.ts src/hooks/use-auth.ts src/types/auth.ts src/lib/auth.ts src/lib/fetch.ts src/components/auth-guard.tsx
```

- [ ] **Step 3: Verificar build final**

```bash
npm run build
npm run lint
```

Ambos devem passar.

---

## Task 21: Smoke test manual

- [ ] **Step 1: Subir dev**

```bash
npm run dev
```

- [ ] **Step 2: Fluxos a validar**

1. **Login customer:** `/login` com credenciais customer → redireciona para `/course`. Confirmar que `localStorage.pl_token` foi setado e `pl_customer_token`/`pl_user_token` NÃO existem.
2. **Login admin:** `/login` com credenciais admin → redireciona para `/dashboard`. Confirmar `useIsAdmin()` retorna true (inspecionar via DevTools React).
3. **Signup:** `/register` com `{ email, password >=8 chars, phone E.164, name }` → toast/sucesso, redireciona para `/login`. Tentar phone sem `+55` → erro de validação Zod.
4. **Forgot password:** `/forgot-password` envia email → mostra mensagem de "verifique seu email".
5. **Reset password:** abrir `/reset-password?token=<jwt>` → preencher nova senha (>=8) → redireciona para `/login`.
6. **AuthGuard:** sem token, acessar `/dashboard` → redireciona para `/login`. Com token customer, acessar `/dashboard` → redireciona para `/store`. Com token admin, acessar `/dashboard` → renderiza.
7. **401 interceptor:** invalidar token (alterar manualmente no localStorage) e fazer qualquer chamada — deve limpar token e mandar para `/login`.
8. **Logout via `user-badge`:** clicar em sair → `pl_token` é removido, redireciona apropriadamente.

- [ ] **Step 3: Registrar issues encontrados**

Se algum hotspot quebrar, voltar à Task 17 e ajustar.

---

## Task 22: Commit (apenas quando o usuário pedir)

> A regra do projeto é **não commitar automaticamente**. Confirmar com o usuário antes deste passo.

- [ ] **Step 1: Verificar estado**

```bash
git status
git diff --stat
```

- [ ] **Step 2: Stage e commit**

```bash
git add src/modules/auth src/modules/me src/shared \
        src/app/login src/app/register src/app/forgot-password src/app/reset-password \
        src/components/providers.tsx \
        $(git diff --name-only)

git commit -m "$(cat <<'EOF'
refactor(auth): migra módulo auth para src/modules/auth + upvox-api v1

- Cria src/modules/auth/{components,hooks,services,types,index.ts}
- Cria src/modules/me mínimo (useMe, useIsAdmin, getMe, updateMe)
- Move src/lib/{auth,fetch}.ts para src/shared/lib/
- Unifica token storage em chave única `pl_token` (sem distinção customer/user)
- Unifica login (`/v1/auth/login`) e signup (`/v1/auth/signup`)
- Role resolvida via GET /v1/me; redireciona admin → /dashboard, customer → /course
- Remove /login/admin (form único em /login)
- Atualiza reset-password para contrato { access_token, new_password }
- AuthGuard movido para modules/auth e refeito sobre useMe()
- Sweep de imports em ~60 arquivos consumidores

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Validar commit**

```bash
git log -1 --stat
```

---

## Riscos conhecidos e mitigações

1. **`useMe()` falha enquanto o backend ainda não tem `/v1/me`:** o hook tem `retry: false` e o `AuthGuard` espera `me.isLoading`. Se `/me` retornar 401 ou 404, o guard vai travar em "não pronto". Mitigação: incluir fallback no `AuthGuard` que, se `me.isError` E o JWT é válido, decodifica `role` do próprio JWT (`getCurrentUser().role`) como degrade gracioso.

2. **Form de signup pede `phone` em E.164 (`+5511…`)** — usuários atuais provavelmente digitam `(11) 99999-9999`. Mitigação no piloto: validação Zod estrita, mensagem clara, e plano de adicionar máscara/transform em PR posterior se causar atrito.

3. **`create-user-modal.tsx` (admin convidando user)** — perde a capacidade de definir role/Permissions no piloto. Aceitável porque o módulo `users` (admin) é o próximo da fila e trata isso via `PATCH /v1/user/{id}/role` + `/v1/auth/signup`.

4. **Sweep com `sed` pode atingir falsos positivos** — só substitui strings de import; conferir `git diff` antes de cada commit.

5. **`/v1/me` ainda não retorna todos os campos esperados** — `meSchema` está mínimo. Se precisar adicionar campos opcionais (subscription, gamification, etc.), incrementar o schema sem quebrar consumers.
