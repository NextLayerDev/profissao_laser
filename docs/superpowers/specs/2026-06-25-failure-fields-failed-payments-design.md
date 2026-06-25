# Design: failure_code e failure_message na tela de pagamentos falhos

**Data:** 2026-06-25

## Contexto

O endpoint `GET /v1/me/invoices` (e o correspondente admin `/v1/admin/analytics/invoices/failed`) passou a retornar dois novos campos em invoices com `status: "payment_failed"`:

- `failure_code` — código de máquina do Stripe (ex: `card_declined`, `insufficient_funds`, `expired_card`). Útil para lógica visual condicional.
- `failure_message` — mensagem legível vinda do banco/emissor. Útil para o admin investigar o caso.

Ambos são `string | null`. São `null` em invoices `paid`/`refunded` e também podem ser `null` em algumas falhas onde o Stripe não retorna motivo (ex: boleto vencido).

## Escopo

Somente a tela de admin analytics — `FailedPaymentsSection`. Nenhuma alteração na área do cliente.

## Alterações

### 1. Schema Zod — `src/modules/analytics/types/analytics.ts`

Adicionar ao `failedPaymentRowSchema`:

```ts
failure_code: z.string().nullable().optional(),
failure_message: z.string().nullable().optional(),
```

`optional()` garante retrocompatibilidade se o backend omitir os campos.

O tipo `FailedPaymentRow` é gerado via `z.infer`, portanto é atualizado automaticamente.

### 2. Componente — `src/modules/analytics/components/failed-payments-section.tsx`

**Nova coluna "Falha"** inserida entre as colunas "Motivo" e "Intervalo":

- Header: `<th>Falha</th>` com o mesmo estilo das demais colunas
- Cell:
  - Se `failure_code` for `null` ou `undefined`: exibe `—`
  - Se `failure_code` existir: badge vermelho (`bg-red-500/10 text-red-400`) com o texto do código; `title` do elemento recebe `failure_message ?? failure_code` para tooltip nativo no hover
- `colSpan` dos estados de loading/empty: `7 → 8`

Nenhuma dependência nova (sem Radix Tooltip); usa apenas `title` HTML nativo, consistente com o padrão atual do componente.

## O que não muda

- `InvoicesSection` (faturas pagas): não recebe os campos, pois `failure_code`/`failure_message` só são relevantes em falhas.
- Área do cliente (`/course/assinatura`): sem alterações.
- Nenhuma lógica de filtragem por `failure_code` é adicionada neste momento.
