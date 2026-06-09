# Fábrica de Tools — Builder de ferramentas com IA (visão / feature)

> Documento de visão. **Não é pra implementar agora** — é pra registrar como já
> pensamos/construímos as tools e desenhar como seria um *builder* aberto, com IA,
> dentro da plataforma, onde a pessoa cria a própria tool do zero conversando
> (como se estivesse falando com a IA, mas dentro do produto), e tudo cobrando voxxys.

## Contexto (por que esse doc existe)
Acabamos de construir a **Gravação 1-Clique** "na mão": engenharia reversa do
ImagR → spec → port do motor (`sharp` + dithering) → reuso do billing de voxxys →
revisão adversarial → iteração ao vivo. Funciona, mas **cada tool nova exige código**
(um endpoint de motor + uma tela). A ideia da Fábrica é **produtizar esse processo**:
o admin (e, no futuro, o cliente) descreve a tool em linguagem natural e a IA monta
a ferramenta pronta — pipeline + UI + cobrança — e registra no catálogo, sem deploy.

**Decisões já travadas:**
1. **Público:** admin primeiro (fábrica interna), mas a arquitetura já pensa em
   **clientes criarem (e venderem) tools depois** (moderação/sandbox/marketplace = fases futuras).
2. **Execução:** **híbrido** — MVP compõe a tool a partir de uma **biblioteca de blocos
   curados** (a tool vira um *config* rodado por um motor genérico, sem código arbitrário);
   uma fase 2 adiciona **blocos de código customizado em sandbox**.

---

# Parte 1 — Como pensamos e construímos as tools até aqui

### 1.1 A metodologia (ex.: Gravação 1-Clique)
1. **Engenharia reversa** do produto-referência → spec determinístico (pipeline + presets por material).
2. **Port do motor** reusando o que já existe (`sharp`, `lib/dithering.ts`), com verificação pixel-a-pixel contra as saídas reais.
3. **Reuso do billing** (não reinventar): a tool entrou no mesmo fluxo de voxxys da vetorização.
4. **Revisão adversarial** (multi-lente, cada achado verificado) antes de confiar.
5. **Iteração ao vivo** no Chrome com imagem real (limpar-fundo, BMP/EZCAD, etc.).
6. **Determinístico primeiro, IA depois**: o que dava pra fazer sem IA (tom, dithering, limpar fundo por flood-fill) foi feito; remoção de fundo/upscale por IA ficou como fase 2.

### 1.2 Anatomia de uma "tool" hoje (o que a Fábrica vai automatizar)
Uma tool = **4 peças**, hoje escritas à mão:
- **Registro de cobrança** (upvox): 1 linha em `tools` (`key`, `name`, `vox_cost`, `enabled`) + linhas em `plan_tools` (`free_quota` por plano).
- **Motor** (main API): um endpoint que valida billing (`resolveToolBilling` em `lib/upvox-tools.ts`), processa e dá `settle`/`refund`. Ex.: `controllers/laser-prep.ts` → `lib/laser-prep.ts`.
- **Tela** (front): uma view que usa `useToolBilling('key', courseSlug).runEngine(invId => motor(invId))` + `{billing.notice}`.
- **Entitlements**: `GET /v1/me/entitlements` lista a tool automaticamente quando habilitada.

### 1.3 Os dois fluxos de cobrança (reusados como estão)
- **Engine**: `POST /v1/tool/:key/invoke` (debita → invocation `pending`) → motor valida via `resolveToolBilling` → roda → `settle`/`refund`.
- **Consume**: `POST /v1/tool/:key/use` (débito atômico, pra tools sem motor).

**Conclusão:** o billing, o catálogo e o admin de tools/planos **já existem e são genéricos**. O que é caro de repetir é **o motor + a tela**. É exatamente isso que a Fábrica transforma em **dados**.

---

# Parte 2 — A Fábrica de Tools (builder com IA)

## 2.0 A ideia central: tool vira DADO, não código
- A tool vira uma **Tool Definition** (um JSON no banco): `input` + um **pipeline de blocos** + um **schema de UI** + `output` + `billing`.
- Um **motor genérico** (`POST /api/tool-run/:key`) carrega a definition e roda o pipeline — **um endpoint serve todas as tools**.
- Um **renderer genérico** (`<DynamicToolView definition={...}/>`) desenha a tela a partir do schema de UI e liga o `useToolBilling` — **sem tela por tool**.
- O **Builder** é um chat onde a IA emite/edita a Tool Definition (saída estruturada, restrita à Biblioteca de Blocos), faz **preview** numa imagem de amostra e, no publish, **auto-registra** via os endpoints admin já existentes.

Billing é reusado **duas vezes**: (a) a tool gerada cobra por uso pelo fluxo invoke→settle/refund existente; (b) o **ato de construir** cobra por **modelo × esforço** no mesmo `vox_ledger`. Como em MVP só rodam blocos curados, "tool gerada por IA" **nunca** vira "código de IA rodando na nossa máquina".

## 2.1 Modelo de dados: `ai_tool_definitions`
Nova tabela no upvox, **1:1 com a linha `tools`** por `tool_key` (o billing/entitlements de hoje fica intacto). Campos: `tool_key`, `version`, `status` (`draft`/`published`/`archived`), `title`/`description`, `engine_runtime` (`blocks_v1`; fase 2 = `blocks_v2_sandbox`), `definition` (jsonb), `author_type` (`admin`/`customer`), `moderation_status`. Mais uma `ai_tool_definition_versions` **append-only** (snapshots imutáveis) → rollback = republicar um snapshot (mesma disciplina do `pl_provisioning_job` + audit log).

### O `definition` (exemplo — a própria Gravação 1-Clique re-expressa, **zero código novo**)
```jsonc
{
  "schemaVersion": 1,
  "input": {
    "image":    { "type": "image", "required": true, "accept": ["png","jpg","webp"] },
    "material": { "type": "enum",   "options": "$ref:material_keys", "default": "wood" },
    "width_mm": { "type": "number", "min": 1, "max": 2000, "default": 200 },
    "dpi":      { "type": "int",    "min": 1, "max": 1200, "default": 254 },
    "dither":   { "type": "bool",   "default": true }
  },
  "pipeline": [
    { "id": "src",   "block": "image.input",        "params": { "from": "input.image" } },
    { "id": "prep",  "block": "laser.photoengrave", "params": {
        "material": "input.material", "width_mm": "input.width_mm",
        "dpi": "input.dpi", "noDither": "!input.dither" } },
    { "id": "store", "block": "output.upload_png",  "params": { "from": "prep.png", "folder": "laser-prep" } }
  ],
  "output": { "primary": "store.url", "preview": "prep.pngBase64",
              "meta": ["prep.width_mm","prep.height_mm","prep.dpi"], "savable": true },
  "ui": {
    "layout": "image-tool",
    "controls": [
      { "bind": "input.image",    "widget": "file-drop", "label": "Sua imagem" },
      { "bind": "input.material", "widget": "select",    "label": "Material", "optionsFrom": "material_keys" },
      { "bind": "input.width_mm", "widget": "slider",    "label": "Largura (mm)", "min": 10, "max": 600, "step": 5 },
      { "bind": "input.dpi",      "widget": "select",    "label": "DPI", "options": [203,254,300,600] },
      { "bind": "input.dither",   "widget": "toggle",    "label": "Dithering" }
    ],
    "action": { "label": "Gerar gravação", "showCostNotice": true },
    "result": { "kind": "image", "downloadFrom": "output.primary", "showMeta": true }
  },
  "billing": { "vox_cost": 2, "free_quota": { "prata": 5, "ouro": 30, "platina": null } }
}
```
Valores de params são **literais ou referências**: `input.X` (input coletado), `<blocoId>.<campo>` (saída de bloco anterior), `!input.X` (negação), `$ref:<registro>` (vocab do servidor, ex.: chaves de material). O motor resolve no run; **a IA só emite referências que enxerga** → geração segura e validável. *A tool mais complexa que temos cabe em 1 bloco + dados.*

## 2.2 Biblioteca de Blocos (a fronteira de segurança do MVP)
Blocos = primitivas curadas e revisadas; a IA **compõe**, nunca **escreve**. Vivem na main API (onde sharp/openrouter/storage já estão), num `BlockRegistry` tipado:
```ts
interface ToolBlock<P, O> {
  id: string;                 // "laser.photoengrave"
  category: 'input'|'transform'|'ai'|'output';
  paramsSchema: ZodType<P>;   // validado ao salvar a definition E antes de cada run
  outputKeys: readonly string[];
  costHint?: (p: P) => number;
  run(ctx, params: P): Promise<O>;
}
```
**Blocos iniciais (cada um embrulha código que já existe):**
- **Input:** `image.input`, `image.from_url`.
- **Transform determinístico:** `laser.photoengrave`→`lib/laser-prep.ts`; `image.dither`→`lib/dithering.ts` (7 algoritmos); `image.vectorize`→`lib/vectorize.ts` (Potrace); `image.line_pattern`→`lib/line-patterns.ts`; `image.grayscale/resize/flatten/threshold` (sharp); `image.clean_background` (flood-fill do laser-prep).
- **IA:** `ai.image.generate/edit/inpaint/remove_background`→`services/editor-ai.ts` (gemini); `ai.text.transform`→`lib/openrouter.ts`.
- **Output:** `output.upload_png/upload_svg`→`lib/storage.ts` (Bunny); `output.return_base64` (preview).

O **conjunto de blocos + seus JSON-schemas É o contrato entregue à IA do builder** — ela só referencia o que existe.

### Motor genérico (o `laser-prep` controller generalizado)
```ts
// POST /api/tool-run/:key  (multipart: file + fields, incl. invocation_id?, draft?)
const def = await loadDefinition(key, draft ? 'draft' : 'published');
const inputs = validateInputs(def.input, fields, file);
const gate = await resolveToolBilling(customerId, key, invocation_id, authHeader); // = controllers/laser-prep.ts
if (gate.mode === 'reject') return reply.status(gate.status).send({message: gate.message});
const invocationId = gate.mode === 'paid' ? gate.invocationId : null;
const bag = { input: inputs };
try {
  for (const node of def.pipeline) {
    const block = BlockRegistry.get(node.block);
    const params = resolveRefs(node.params, bag);
    block.paramsSchema.parse(params);
    bag[node.id] = await block.run({ bag, customerId, authHeader, signal }, params);
  }
  const result = projectOutput(def.output, bag);
  if (invocationId) await settleInvocation(customerId, invocationId, authHeader);
  return reply.status(201).send(result);
} catch (err) {
  if (invocationId) await refundInvocation(customerId, invocationId, authHeader);
  return reply.status(500).send({ message: String(err?.message) });
}
```

## 2.3 O Builder conversacional
- **Onde mora:** rota admin no front (ex.: `/(admin)/ferramentas/builder`), gated por `usePermissions().can('tools:build')`, **ao lado do `ToolsAdminSection`** atual (o CRUD manual segue como fallback/editor).
- **Loop:** admin descreve a tool → backend do builder chama a IA (`lib/openrouter.ts`) com system-prompt "você emite/edita uma ToolDefinition" + os schemas da Biblioteca de Blocos + catálogo de widgets como *functions* → IA devolve um **patch estruturado** da definition → backend **valida** (bloco existe? params passam no Zod? referências resolvem? UI liga em inputs reais?) e, se inválido, devolve o erro pra IA se autocorrigir (retries limitados, cada um conta como esforço) → **preview** roda o rascunho no **mesmo motor genérico** (`?draft=true`) numa imagem de amostra → admin vê a tela renderizada + saída e pede ajustes → **publish** auto-registra: `POST /v1/tool` (catálogo + `vox_cost`) + `PUT /v1/plan/:id/tool/:key` (free_quota por plano) + grava a `ai_tool_definitions` `published` + snapshot. **Sem deploy.**
- **Modelo/IA:** reusa `lib/openrouter.ts` (planner + blocos de IA, 1 dep, 1 chave). A IA planner deve ser um modelo forte de função/raciocínio (Claude via OpenRouter, ou swap pro SDK Anthropic pra tool-use nativo + prompt caching do schema grande). Isolado atrás de uma interface `BuilderLLM` → trocar é 1 arquivo.

## 2.4 Cobrança em 2 camadas
**(a) A tool gerada cobra por uso — reuso literal.** A tool gerada é só `tools` + `plan_tools` + o motor genérico → o fluxo `invoke → resolveToolBilling → settle/refund` de hoje funciona sem nada novo; entitlements já lista. Quota-vs-voxxys, conta-teste e refund-em-erro vêm de graça.

**(b) Construir cobra voxxys — ledger medido.** Build é aberto (iterações/tokens/passos de IA-imagem), então usa um **medidor** no `vox_ledger` (mesmo `applyVoxDelta`): **modelo (cheap/standard/premium) × esforço** (tokens in+out, nº de retries, passos `ai.image.*` no preview = um "pedaço" fixo de voxxys, porque geração de imagem é o caro). Mostra um **medidor de custo do build ao vivo** (mesma infra `vox-fx`). **Tetos rígidos:** teto por build, orçamento/dia, tier premium atrás de RBAC, limite de passos de preview, retries limitados — checados **antes de cada turno** pra um chat desgovernado não drenar saldo.

## 2.5 Renderer genérico (uma tela pra todas as tools)
```tsx
function DynamicToolView({ definition, courseSlug, preview }) {
  const billing = useToolBilling(definition.tool_key, courseSlug); // hook inalterado
  const [values, setValues] = useState(() => defaultsFrom(definition.input));
  const run = () => billing.runEngine(invId => callGenericEngine(definition.tool_key, values, invId, { draft: preview }));
  return (<ToolLayout kind={definition.ui.layout}>
    {definition.ui.controls.map(c => <Widget spec={c} .../>)}
    <ActionButton onClick={run} disabled={billing.pending} label={definition.ui.action.label}/>
    {definition.ui.action.showCostNotice && billing.notice}
    <ResultView spec={definition.ui.result}/>
  </ToolLayout>);
}
```
Um pequeno registro de `Widget` (`file-drop`/`select`/`slider`/`toggle`/`number`/`color`) desenha os controles; `{billing.notice}`, débito ao vivo e o gate de saldo insuficiente funcionam **iguais a hoje**. Tools novas saem **sem `.tsx` novo**. As telas atuais (vetorização, editor) podem ficar como estão ou migrar aos poucos — o renderer é aditivo.

## 2.6 Async / runs longos & build jobs
Passos de IA são lentos. Não há fila hoje; o padrão provado é a **máquina de estados em DB** (`pl_provisioning_job`: status enum, idempotency, retry, last_error, audit log). **Clonar isso, sem BullMQ no MVP:** tabelas `tool_run_jobs` e `tool_build_jobs` (status `queued`/`running`/`step:n`/`succeeded`/`failed`/`refunded`, idempotency, retry, inputs/result jsonb, invocation_id, + audit). Sync-first: run rápido responde inline; run que passa do limite (ou definition `async:true` por conter IA) persiste job, devolve `202 {jobId}`, e o front faz **polling** (`refetchInterval` que os hooks já suportam). Um loop poller único pega `queued` com `FOR UPDATE SKIP LOCKED`, avança por bloco (retry resume do último passo bom), settle/refund no terminal. BullMQ-no-ioredis fica deferido **atrás da mesma interface de job**.

## 2.7 Fases
- **MVP — fábrica admin (blocos):** tabelas de definition+versões; Biblioteca de Blocos v1 (tudo embrulhando `lib/`/`services/` existentes); motor genérico reusando `resolveToolBilling`; `DynamicToolView`; builder conversacional (OpenRouter, saída estruturada, preview, publish via APIs admin); medição de custo de build; job table p/ runs lentos. **Destrava:** admin cria tools de imagem/laser por chat, sem deploy. **Risco baixo** (só blocos curados rodam).
- **Fase 2 — blocos de código em sandbox:** bloco `code.custom` rodando em sandbox (isolated-vm/worker sem fs/net, limites de CPU/mem/tempo), só admin; biblioteca maior (condicionais/branches no pipeline, templates de prompt). **Destrava:** lógica que os blocos não cobrem. **Risco:** execução de código — o **sandbox vira a fronteira de segurança** e tem que estar endurecido antes de liberar.
- **Fase 3 — clientes + moderação + marketplace + revenue share:** builder pro cliente (`author_type='customer'`, tools entram `pending`); fila de moderação (preview + run de amostra forçado antes de aprovar); marketplace de tools aprovadas com `vox_cost` do autor; **revenue share** (fatia das voxxys de cada uso creditada ao autor via `applyVoxDelta`). **Destrava:** rede de tools feitas e monetizadas por clientes. **Risco:** abuso em escala / payout — mitigado por moderação obrigatória, sandbox (fase 2), rate-limit por autor e auditoria por versão+invocation.

## 2.8 Riscos & mitigações (resumo)
- **Código:** MVP = biblioteca de blocos é a fronteira (sem código arbitrário). Fase 2/cliente = sandbox real.
- **Custo de build desgovernado:** tetos por build/dia, tier premium por RBAC, limite de preview/retries, rate-limit do endpoint.
- **Custo de run:** herda billing por uso + guards genéricos (teto de MP/timeout via `AbortSignal`, generalizando o `MAX_OUTPUT_PIXELS` do laser-prep).
- **Qualidade da tool gerada:** preview-antes-de-publicar obrigatório; definitions versionadas (rollback 1-clique); fase 3 exige aprovação admin.
- **Geração restrita** a blocos tipados + params validados (nada de texto livre entrando em motor), com humano no loop pra publicar.

## 2.9 Mapa de reuso (o que já existe → como a Fábrica usa)
| Asset existente | Uso na Fábrica |
|---|---|
| `lib/upvox-tools.ts` (`resolveToolBilling`/`settle`/`refund`) | Gate de billing do motor genérico — inalterado |
| `api-upvox tools/service.ts` (`authorize`/`settle`/`refund`/quota+vox+test) | Cobrança por uso de toda tool gerada |
| `api-upvox tools/route.ts` (`/tool/:key/invoke`, `/me/entitlements`) | Endpoints que o motor chama; entitlements auto-lista geradas |
| `api-upvox plans/schema.ts` (`createTool`/`upsertPlanTool`) | Publish auto-registra catálogo + free_quota |
| `controllers/laser-prep.ts` | Template do loop do motor genérico |
| `lib/laser-prep.ts` (+ `MATERIAL_PRESETS`, flood-fill) | Blocos `laser.photoengrave`/`image.clean_background`; presets = registro `material_keys` |
| `lib/dithering.ts` / `vectorize.ts` / `line-patterns.ts` | Blocos `image.dither`/`vectorize`/`line_pattern` |
| `lib/openrouter.ts` + `services/editor-ai.ts` | LLM planner + blocos de IA (1 dep, 1 chave) |
| `lib/storage.ts` (Bunny) | Blocos `output.upload_*` |
| `types/provisioning.ts` + audit log | Padrão clonado p/ `tool_run_jobs`/`tool_build_jobs` + versões |
| `use-tool-billing.tsx` + `vox-fx.ts` + `ToolCostNotice` | Ligados pelo `DynamicToolView` (notice, débito, gate) |
| `/products` Funcionalidades, `/(admin)/planos/[id]`, `usePermissions` | Onde o builder mora + gate; CRUD manual = fallback |
| `vox_ledger` / `applyVoxDelta` | Ledger do custo de build e (fase 3) revenue share do autor |

---

## Próximos passos (quando sair do papel)
- **Quando for construir:** começar pelo **MVP** — provar o conceito re-expressando a Gravação 1-Clique como `ai_tool_definitions` + motor genérico + `DynamicToolView` (sem builder ainda), e só então plugar o chat-builder por cima. Cada fase como conjunto de PRs (upvox: tabelas+endpoints; main API: blocos+motor genérico+jobs; front: renderer+builder), com revisão adversarial como fizemos na Gravação.

## Verificação (quando implementar o MVP)
- Re-expressar `gravacao_oneclick` como definition → rodar pelo motor genérico → bater pixel-a-pixel com a tool atual (mesmo PNG/dimensão/pHYs).
- `DynamicToolView` renderiza a tool a partir do schema e cobra igual (invoke→settle/refund, `{billing.notice}`, saldo anima).
- Publish via APIs admin cria as linhas `tools`/`plan_tools` e a tool aparece no catálogo/entitlements sem deploy.
- Medidor de build debita voxxys por modelo×esforço e respeita os tetos.

---

> Referência: este doc nasceu da construção da **Gravação 1-Clique** (motor `laser-prep` +
> billing voxxys + tela com `useToolBilling`). A Fábrica é o passo de transformar esse
> processo manual em um produto onde a própria tool é descrita por conversa e montada pela IA.
