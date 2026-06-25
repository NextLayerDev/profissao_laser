# failure_code e failure_message em Pagamentos Falhos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir o motivo de falha de pagamento (failure_code + failure_message) na tabela de Pagamentos Falhos do admin analytics.

**Architecture:** Dois arquivos alterados — o schema Zod que define o tipo `FailedPaymentRow`, e o componente React que renderiza a tabela. Nenhuma dependência nova; tooltip via atributo `title` HTML nativo.

**Tech Stack:** TypeScript, Zod, React (Next.js App Router), Tailwind CSS

---

### Task 1: Adicionar failure_code e failure_message ao schema Zod

**Files:**
- Modify: `src/modules/analytics/types/analytics.ts` (linhas 196–212, `failedPaymentRowSchema`)

- [ ] **Step 1: Abrir o arquivo e localizar o schema**

  Abra `src/modules/analytics/types/analytics.ts`. Encontre o objeto `failedPaymentRowSchema` (em torno da linha 196). Ele termina com o campo `plan`:

  ```ts
  plan: z
    .object({ id: z.string(), key: z.string(), name: z.string() })
    .nullable()
    .optional(),
  ```

- [ ] **Step 2: Adicionar os dois novos campos ao final do schema**

  Após o campo `plan`, adicione:

  ```ts
  failure_code: z.string().nullable().optional(),
  failure_message: z.string().nullable().optional(),
  ```

  O trecho final do schema deve ficar assim:

  ```ts
  export const failedPaymentRowSchema = z.object({
    id: z.string(),
    subscription_id: z.string().nullable().optional(),
    stripe_invoice_id: z.string(),
    billing_reason: billingReasonSchema,
    amount_cents: z.number().int(),
    interval: z.enum(['monthly', 'yearly']),
    period_start: z.string().nullable().optional(),
    period_end: z.string().nullable().optional(),
    created_at: z.string(),
    customer: customerRefSchema,
    plan: z
      .object({ id: z.string(), key: z.string(), name: z.string() })
      .nullable()
      .optional(),
    failure_code: z.string().nullable().optional(),
    failure_message: z.string().nullable().optional(),
  });
  ```

- [ ] **Step 3: Verificar que o TypeScript compila sem erros**

  Execute:
  ```bash
  npx tsc --noEmit
  ```
  Esperado: sem erros relacionados a `FailedPaymentRow` ou `failedPaymentRowSchema`.

- [ ] **Step 4: Commit**

  ```bash
  git add src/modules/analytics/types/analytics.ts
  git commit -m "feat(analytics): adiciona failure_code e failure_message ao FailedPaymentRow"
  ```

---

### Task 2: Adicionar coluna "Falha" na tabela de pagamentos falhos

**Files:**
- Modify: `src/modules/analytics/components/failed-payments-section.tsx`

- [ ] **Step 1: Adicionar o header da nova coluna**

  Localize o bloco `<thead>` do componente. Ele tem atualmente 7 colunas na ordem: Cliente, Plano, Valor, Motivo, Intervalo, Período, Falhou em.

  Insira o novo `<th>` entre "Motivo" e "Intervalo":

  ```tsx
  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide">
    Falha
  </th>
  ```

- [ ] **Step 2: Adicionar a célula na linha de dados**

  Dentro do `analytics?.data.map((row) => { ... })`, localize a célula do "Motivo" (billing_reason). Logo após ela, adicione a célula "Falha":

  ```tsx
  <td className="px-4 py-3">
    {row.failure_code ? (
      <span
        title={row.failure_message ?? row.failure_code}
        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 cursor-default"
      >
        {row.failure_code}
      </span>
    ) : (
      <span className="text-slate-400 dark:text-gray-600 text-xs">—</span>
    )}
  </td>
  ```

- [ ] **Step 3: Atualizar o colSpan dos estados de loading e empty**

  No mesmo componente, há dois `<tr>` especiais com `colSpan={7}`. Ambos devem passar para `colSpan={8}`.

  Estado de loading:
  ```tsx
  <td colSpan={8} className="text-center py-16">
  ```

  Estado de lista vazia:
  ```tsx
  <td
    colSpan={8}
    className="text-center py-16 text-slate-500 dark:text-gray-500"
  >
  ```

- [ ] **Step 4: Verificar que o TypeScript compila sem erros**

  ```bash
  npx tsc --noEmit
  ```
  Esperado: sem erros.

- [ ] **Step 5: Verificar visualmente no browser**

  Abra o admin analytics na aba de Pagamentos Falhos. Confirme:
  - A tabela agora tem 8 colunas, com "Falha" entre "Motivo" e "Intervalo"
  - Linhas com `failure_code` preenchido exibem um badge vermelho com o código
  - Hover no badge mostra o `failure_message` no tooltip nativo do browser
  - Linhas sem `failure_code` (null) exibem `—`
  - Os estados de loading e lista vazia continuam centralizados corretamente

- [ ] **Step 6: Commit**

  ```bash
  git add src/modules/analytics/components/failed-payments-section.tsx
  git commit -m "feat(analytics): exibe failure_code/failure_message na tabela de pagamentos falhos"
  ```
