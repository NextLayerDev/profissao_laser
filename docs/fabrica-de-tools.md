# Fábrica de Tools — Builder de ferramentas com IA (visão / feature)
> Documento de visão. **Não é pra implementar agora** — é pra registrar como já
> pensamos/construímos as tools e desenhar como seria um *builder* aberto, com IA,
> dentro da plataforma, onde a pessoa cria a própria tool do zero conversando
> (como se estivesse falando com a IA, mas dentro do produto), e tudo cobrando voxxys.
>
> **Atualização desta versão:** a visão foi ampliada de "fábrica de tools de imagem"
> para **fábrica de qualquer tool** — geração e análise de imagem, texto/documento,
> dados, código, engenharia reversa, e tools **agênticas** que raciocinam em vários
> passos. O builder deixa de ser uma única chamada de LLM e vira um **Tool Engineer**:
> um agente que conversa, **pesquisa**, **constrói**, **testa** e tem um **revisor**
> de tudo — usando Claude (Anthropic) via API por dentro do produto, sempre medido em voxxys.
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
3. **Ambição (esta versão):** a Fábrica não é só de imagem. Ela cobre **qualquer
   categoria de tool** (imagem, texto, dados, código, pesquisa, híbrida) e suporta
   **tools agênticas** que rodam um loop com Claude. O Tool Engineer pode **pesquisar**
   (web + engenharia reversa), **construir** e **revisar** — tudo cobrado em voxxys.
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
> **Nota desta versão:** esta lista é a *semente*. A **Parte 4.3** expande a Biblioteca de Blocos
> para cobrir texto/documento, dados, código, web/pesquisa e lógica/controle — o que destrava
> "qualquer tool". A regra de ouro não muda: **a IA compõe blocos curados, nunca escreve código**
> (até a fase de sandbox).
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
- **Loop:** admin descreve a tool → backend do builder chama a IA (`lib/openrouter.ts`) com system-prompt "você emite/edita uma ToolDefinition" + os schemas da Biblioteca de Blocos + catálogo de widgets como *functions* → IA devolve um **patch estruturado** da definition → backend **valida** (bloco existe? params passam no Zod? referências resolvem? UI liga em inputs reais?) e, se inválido, devolve o erro pro IA se autocorrigir (retries limitados, cada um conta como esforço) → **preview** roda o rascunho no **mesmo motor genérico** (`?draft=true`) numa imagem de amostra → admin vê a tela renderizada + saída e pede ajustes → **publish** auto-registra: `POST /v1/tool` (catálogo + `vox_cost`) + `PUT /v1/plan/:id/tool/:key` (free_quota por plano) + grava a `ai_tool_definitions` `published` + snapshot. **Sem deploy.**
- **Modelo/IA:** reusa `lib/openrouter.ts` (planner + blocos de IA, 1 dep, 1 chave). A IA planner deve ser um modelo forte de função/raciocínio (Claude via OpenRouter, ou swap pro SDK Anthropic pra tool-use nativo + prompt caching do schema grande). Isolado atrás de uma interface `BuilderLLM` → trocar é 1 arquivo.
> **Nota desta versão:** este "loop de uma chamada" é o **núcleo**. A **Parte 5** o transforma
> num **agente com fases** (intake → pesquisa → design → validate → preview → review → publish),
> capaz de pesquisar na web, fazer engenharia reversa e rodar um **revisor adversarial automático**
> antes do publish.
## 2.4 Cobrança em 2 camadas
**(a) A tool gerada cobra por uso — reuso literal.** A tool gerada é só `tools` + `plan_tools` + o motor genérico → o fluxo `invoke → resolveToolBilling → settle/refund` de hoje funciona sem nada novo; entitlements já lista. Quota-vs-voxxys, conta-teste e refund-em-erro vêm de graça.
**(b) Construir cobra voxxys — ledger medido.** Build é aberto (iterações/tokens/passos de IA-imagem), então usa um **medidor** no `vox_ledger` (mesmo `applyVoxDelta`): **modelo (cheap/standard/premium) × esforço** (tokens in+out, nº de retries, passos `ai.image.*` no preview = um "pedaço" fixo de voxxys, porque geração de imagem é o caro). Mostra um **medidor de custo do build ao vivo** (mesma infra `vox-fx`). **Tetos rígidos:** teto por build, orçamento/dia, tier premium atrás de RBAC, limite de passos de preview, retries limitados — checados **antes de cada turno** pra um chat desgovernado não drenar saldo.
> **Nota desta versão:** a **Parte 7** adiciona uma **terceira frente** (consumo de tools
> *agênticas*, que têm custo variável por run e por isso usam billing **medido** — `vox_cost: "metered"`)
> e detalha a governança de custo de ponta a ponta.
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
> **Nota desta versão:** para tools de **texto, dados, código e agênticas** o registro de `Widget`
> e os `layout`/`result` ganham novos tipos (`text-tool`, `data-tool`, `chat-tool`, `report`,
> `code-diff`). Detalhe na **Parte 4.4** e **6.3**.
## 2.6 Async / runs longos & build jobs
Passos de IA são lentos. Não há fila hoje; o padrão provado é a **máquina de estados em DB** (`pl_provisioning_job`: status enum, idempotency, retry, last_error, audit log). **Clonar isso, sem BullMQ no MVP:** tabelas `tool_run_jobs` e `tool_build_jobs` (status `queued`/`running`/`step:n`/`succeeded`/`failed`/`refunded`, idempotency, retry, inputs/result jsonb, invocation_id, + audit). Sync-first: run rápido responde inline; run que passa do limite (ou definition `async:true` por conter IA) persiste job, devolve `202 {jobId}`, e o front faz **polling** (`refetchInterval` que os hooks já suportam). Um loop poller único pega `queued` com `FOR UPDATE SKIP LOCKED`, avança por bloco (retry resume do último passo bom), settle/refund no terminal. BullMQ-no-ioredis fica deferido **atrás da mesma interface de job**.
## 2.7 Fases
- **MVP — fábrica admin (blocos):** tabelas de definition+versões; Biblioteca de Blocos v1 (tudo embrulhando `lib/`/`services/` existentes); motor genérico reusando `resolveToolBilling`; `DynamicToolView`; builder conversacional (OpenRouter, saída estruturada, preview, publish via APIs admin); medição de custo de build; job table p/ runs lentos. **Destrava:** admin cria tools de imagem/laser por chat, sem deploy. **Risco baixo** (só blocos curados rodam).
- **Fase 2 — blocos de código em sandbox:** bloco `code.custom` rodando em sandbox (isolated-vm/worker sem fs/net, limites de CPU/mem/tempo), só admin; biblioteca maior (condicionais/branches no pipeline, templates de prompt). **Destrava:** lógica que os blocos não cobrem. **Risco:** execução de código — o **sandbox vira a fronteira de segurança** e tem que estar endurecido antes de liberar.
- **Fase 3 — clientes + moderação + marketplace + revenue share:** builder pro cliente (`author_type='customer'`, tools entram `pending`); fila de moderação (preview + run de amostra forçado antes de aprovar); marketplace de tools aprovadas com `vox_cost` do autor; **revenue share** (fatia das voxxys de cada uso creditada ao autor via `applyVoxDelta`). **Destrava:** rede de tools feitas e monetizadas por clientes. **Risco:** abuso em escala / payout — mitigado por moderação obrigatória, sandbox (fase 2), rate-limit por autor e auditoria por versão+invocation.
> **Nota desta versão:** a **Parte 9** detalha um roadmap mais granular que encaixa as novas
> capacidades (runtime agêntico, Revisor automático, pesquisa/engenharia reversa, templates)
> dentro/entre essas fases — **sem mexer no que está acima**.
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
# Parte 3 — Por que a Fábrica muda o jogo (visão de produto)
Antes da engenharia, vale fixar **por que** esta feature é estratégica para a UPVOX — porque ela amarra dois dos quatro pilares da plataforma (**construtor com IA** e **catálogo vivo**) e alimenta um terceiro (**marketplace**).
## 3.1 O fosso: o catálogo deixa de depender de nós
Hoje, "catálogo vivo" significa **nós** lançando ferramentas. Isso não escala: cada tool é roadmap, dev e deploy. Com a Fábrica, **o catálogo se expande sozinho** — primeiro pelo admin (10x mais rápido que codar), depois pelos próprios clientes. O ativo defensável não é uma tool específica; é a **máquina que fabrica tools** + a biblioteca de blocos curados que só nós temos (porque vieram de produtos reais, como a Gravação 1-Clique).
## 3.2 O flywheel
```
admin fabrica tools  →  prova valor e refina os blocos  →  clientes fabricam suas próprias tools
        ↑                                                                      │
        │                                                                      ▼
 mais blocos curados  ←  marketplace + revenue share  ←  tools boas viram produto de outros clientes
```
Cada volta do ciclo: mais blocos, mais tools, mais razões para a marca **ficar** na UPVOX (lock-in saudável: as ferramentas dela vivem aqui) e mais GMV de voxxys (build + run + take rate do marketplace de tools na fase 3).
## 3.3 A promessa central: "qualquer tool que você imaginar"
A linha de marketing é a mesma da sua visão: *a marca descreve em texto o que quer, a IA monta a ferramenta com a cara dela, ela aprova, define o preço e libera para o cliente final*. Para essa promessa ser **verdadeira** (e não só de imagem), a Fábrica precisa de:
1. **Um universo de blocos que cubra mais que imagem** (texto, dados, código, web) → Parte 4.
2. **Um runtime que aguente tools que pensam em vários passos** (`agent_v1`) → Parte 4.2 e 6.3.
3. **Um construtor que pesquise, construa e revise** (o Tool Engineer) → Parte 5.
4. **Economia e segurança que não exploda** com tudo isso aberto → Partes 7 e 8.
Mantemos a honestidade do doc original: o que **não** dá pra fazer com blocos curados fica explícito e vai para sandbox (fase 2) ou agente com tetos — nunca "código de IA solto rodando na nossa máquina".
---
# Parte 4 — Universo de tools, runtimes e Biblioteca completa
## 4.1 Taxonomia: as famílias de tools que a Fábrica produz
Toda tool cai em uma (ou mais) destas famílias. A tabela mapeia família → exemplos → runtime primário → blocos-chave. Isso é o que torna "qualquer tool" concreto e não slogan.
| Família | Exemplos reais | Runtime primário | Blocos-chave |
|---|---|---|---|
| **Imagem** | gravação a laser, vetorização, gerar imagem, remover fundo, classificar mancha de pele, OCR | `blocks_v1` | `image.*`, `ai.image.*`, `laser.*` |
| **Texto / Documento** | resumir contrato, extrair dados de NF/PDF, classificar ticket, reescrever copy, traduzir, gerar descrição de produto | `blocks_v1` | `ai.text.*`, `doc.*` |
| **Dados** | parsear CSV, validar planilha, detectar outlier, gerar gráfico, montar tabela | `blocks_v1` | `data.*` |
| **Código** | revisar PR, gerar testes, refatorar, traduzir linguagem, **engenharia reversa de um trecho/saída** | `blocks_v1` + `agent_v1` (+ sandbox fase 2) | `ai.code.*`, `code.*` |
| **Pesquisa / Agente** | pesquisar tema e gerar relatório, comparar fornecedores, due diligence, brief→curso | `agent_v1` | `web.*`, `ai.text.*`, `flow.*`, loop |
| **Híbrida** | "foto → diagnóstico → orçamento → PDF"; "áudio → transcrição → resumo → e-mail" | `agent_v1` (ou pipeline com nó agêntico) | combinação |
Decisão de design: **a família não vive na definition** — ela é inferida pelos blocos usados, e serve só pra UX (filtros, templates, ícones no catálogo). O motor não liga pra família; liga pra blocos e runtime.
## 4.2 Os runtimes da Fábrica (escada de capacidade)
O campo `engine_runtime` (que já existe na `ai_tool_definitions`) ganha uma **escada** de 3 degraus + composição. Cada degrau é uma fronteira de segurança e de custo distinta.
| Runtime | O que é | A IA decide o fluxo? | Fronteira | Fase |
|---|---|---|---|---|
| `blocks_v1` | **Pipeline linear** de blocos curados (inclui blocos de IA *single-shot*). O `pipeline` é fixo na definition. | **Não** — o fluxo é dado | Só blocos curados rodam | MVP |
| `agent_v1` | **Loop agêntico**: a tool roda Claude (tool-use) que **decide quais blocos chamar**, em que ordem, até atingir o objetivo. Blocos disponíveis = whitelist da definition. | **Sim**, dentro do whitelist + tetos | Whitelist de blocos + tetos de passos/custo | Fase 1.5 / 2a |
| `blocks_v2_sandbox` | Bloco `code.custom` rodando em **sandbox isolado** (isolated-vm/worker, sem fs/net, limites de CPU/mem/tempo). | N/A (código determinístico do autor) | Sandbox endurecido | Fase 2 |
**Composição:** os degraus se combinam. Um `pipeline` `blocks_v1` pode ter **um nó agêntico** embutido (sub-agente para um passo difícil); um agente `agent_v1` pode ter um **bloco de código sandbox** como uma de suas ferramentas. Isso dá um caminho de evolução suave: começa determinístico, sobe pra agêntico onde precisa, desce pra código só no que os blocos não cobrem.
> **Por que `agent_v1` é o que destrava sua visão:** "engenharia reversa construindo a tool",
> "pesquisar", "qualquer coisa que ela imaginar" são, no fundo, tools **multi-step que raciocinam**.
> Pipeline linear não dá conta; agente com tool-use, sim. E o "chat com IA da Anthropic dentro do
> projeto" é exatamente uma tool `agent_v1` cujo whitelist inclui `ai.text.*` (+ `web.*` se quiser
> pesquisa) rodando em loop.
## 4.3 Biblioteca de Blocos — catálogo completo (por categoria)
Mantém os blocos-semente da Parte 2.2 e expande. Regra: **cada bloco embrulha código que já existe** sempre que possível; o que é novo está marcado `[novo]`. Todos têm `paramsSchema` Zod validado ao salvar **e** antes de cada run.
**Input**
- `image.input`, `image.from_url` — imagem (existente)
- `text.input` `[novo]` — texto livre / prompt do usuário
- `file.input` `[novo]` — arquivo (PDF/DOCX/CSV/TXT), com whitelist de tipo e tamanho
- `url.input` `[novo]` — URL (passa pelos guards de Parte 8)
- `json.input` `[novo]` — payload estruturado
- `audio.input` `[fase 2]` — áudio para transcrição
**Imagem — determinístico** (tudo embrulha `sharp`/`lib/*`)
- `laser.photoengrave` → `lib/laser-prep.ts`
- `image.dither` → `lib/dithering.ts` (7 algoritmos)
- `image.vectorize` → `lib/vectorize.ts` (Potrace)
- `image.line_pattern` → `lib/line-patterns.ts`
- `image.grayscale` / `image.resize` / `image.flatten` / `image.threshold` → `sharp`
- `image.clean_background` → flood-fill do laser-prep
- `image.crop` / `image.composite` `[novo, sharp]`
**Imagem — IA** (embrulha `services/editor-ai.ts`)
- `ai.image.generate` / `ai.image.edit` / `ai.image.inpaint` / `ai.image.remove_background`
- `ai.image.upscale` `[fase 2]`
- `ai.image.describe` `[novo]` — **visão/análise**: descreve, responde pergunta sobre a imagem
- `ai.image.classify` `[novo]` — classifica em rótulos (ex.: "candidato a remoção a laser?")
- `ai.image.ocr` `[novo]` — extrai texto da imagem
**Texto / Documento — IA** (embrulha `lib/openrouter.ts` / SDK Anthropic)
- `ai.text.transform` (existente)
- `ai.text.summarize` / `ai.text.translate` / `ai.text.generate` `[novo]`
- `ai.text.classify` `[novo]` — rótulos/categorias
- `ai.text.extract` `[novo]` — **extração estruturada** (saída JSON validada por schema declarado na definition)
- `ai.text.answer` `[novo]` — RAG: responde usando contexto recuperado (ver Embeddings)
**Documento — determinístico** `[novo]`
- `doc.parse_pdf` (pdf-parse) / `doc.parse_docx` (mammoth) / `doc.to_markdown` / `doc.chunk`
- `doc.render_pdf` / `doc.render_docx` — **gera** documento (saída salvável)
**Dados** `[novo]`
- `data.parse_csv` / `data.parse_json`
- `data.validate` — valida contra schema declarado (Zod)
- `data.transform` — map/filter/select declarativo (sem código arbitrário)
- `data.aggregate` — soma/média/contagem/group-by
- `data.to_chart` / `data.to_table` — saída visual
**Web / Pesquisa** `[novo]`
- `web.search` — busca (provedor configurável)
- `web.fetch` — baixa uma URL (conteúdo tratado como **dado**, nunca instrução — Parte 8)
- `web.scrape` — extrai conteúdo legível de uma página
- `web.crawl` `[fase 2]` — múltiplas páginas, com limites duros
**Código — IA** `[novo]` (embrulha `lib/openrouter.ts` / SDK Anthropic)
- `ai.code.generate` / `ai.code.explain` / `ai.code.refactor`
- `ai.code.review` — aponta bugs/smells/segurança
- `ai.code.translate` — linguagem→linguagem
- `ai.code.gen_tests` — gera testes
- `ai.code.reverse_engineer` — descreve o comportamento/contrato a partir de um trecho ou de amostras de entrada→saída
**Código — execução**
- `code.run_sandbox` `[fase 2]` — roda código do autor em isolated-vm (Parte 8)
**Embeddings / RAG** `[novo]`
- `ai.embed` — gera embeddings
- `vector.upsert` / `vector.search` — indexa e busca semântica (base p/ `ai.text.answer`)
**Lógica / Controle** `[novo]` (ver 4.4)
- `flow.if` / `flow.switch` — ramificação declarativa
- `flow.map` — itera um sub-pipeline sobre uma lista
- `flow.parallel` — roda ramos em paralelo
- `flow.loop_until` `[agent/fase 2]` — repete até condição (só em runtime agêntico ou com teto rígido)
**Output**
- `output.upload_png` / `output.upload_svg` / `output.upload_file` → `lib/storage.ts` (Bunny)
- `output.return_base64` / `output.return_json` `[novo]`
- `output.render_pdf` `[novo]` — atalho p/ `doc.render_pdf` + upload
- `output.email` `[fase 2/integração]` — entrega por e-mail (gated, requer permissão)
### Mapa: bloco novo → asset existente
| Bloco novo | De onde vem |
|---|---|
| `ai.image.describe/classify/ocr` | `services/editor-ai.ts` (mesma chamada multimodal, prompt diferente) |
| `ai.text.summarize/translate/extract/classify/answer` | `lib/openrouter.ts` / SDK Anthropic (prompt + schema) |
| `ai.code.*` | `lib/openrouter.ts` / SDK Anthropic (prompt especializado) |
| `doc.parse_*` / `doc.render_*` | libs maduras (pdf-parse, mammoth, pdfkit/docx) — deps novas pequenas |
| `data.*` | utilitários puros TS (sem dep pesada) |
| `web.search/fetch/scrape` | cliente HTTP + extrator de conteúdo (readability) |
| `ai.embed` / `vector.*` | provider de embeddings + pgvector no Supabase (já temos Postgres) |
| `flow.*` | interpretador no próprio motor genérico (sem dep) |
## 4.4 Lógica e controle (pipelines não-lineares)
O pipeline do MVP é **linear**. Para "qualquer tool", o motor precisa entender **ramificação** e **iteração** de forma **declarativa** (sem virar linguagem de programação solta). Os blocos `flow.*` resolvem isso dentro de `blocks_v1`; loops abertos ficam restritos a `agent_v1` (com teto) ou sandbox.
Exemplo — tool "foto de pele → triagem → orçamento ou recusa" (ramificação declarativa):
```jsonc
{
  "schemaVersion": 1,
  "engine_runtime": "blocks_v1",
  "input": {
    "image": { "type": "image", "required": true },
    "regiao": { "type": "enum", "options": ["rosto","corpo"], "default": "rosto" }
  },
  "pipeline": [
    { "id": "img",  "block": "image.input", "params": { "from": "input.image" } },
    { "id": "clf",  "block": "ai.image.classify", "params": {
        "from": "img.image",
        "labels": ["candidato","nao_candidato","inconclusivo"],
        "context": "Avalie se a mancha é candidata a remoção a laser na região {input.regiao}." } },
    { "id": "rota", "block": "flow.switch", "params": {
        "on": "clf.label",
        "cases": {
          "candidato":     [ { "id": "orc", "block": "ai.text.generate", "params": {
                                 "prompt": "Gere um orçamento estimado de remoção a laser para {input.regiao}." } } ],
          "nao_candidato": [ { "id": "msg", "block": "ai.text.generate", "params": {
                                 "prompt": "Explique de forma gentil por que não é candidato e sugira próximos passos." } } ],
          "inconclusivo":  [ { "id": "ped", "block": "ai.text.generate", "params": {
                                 "prompt": "Peça uma foto melhor, explicando o que melhorar (luz, foco, distância)." } } ]
        } } }
  ],
  "output": { "primary": "rota.text", "meta": ["clf.label","clf.confidence"], "savable": true },
  "ui": {
    "layout": "image-tool",
    "controls": [
      { "bind": "input.image",  "widget": "file-drop", "label": "Foto da região" },
      { "bind": "input.regiao", "widget": "select",    "label": "Região" }
    ],
    "action": { "label": "Avaliar", "showCostNotice": true },
    "result": { "kind": "text", "showMeta": true }
  },
  "billing": { "vox_cost": 3, "free_quota": { "prata": 3, "ouro": 20, "platina": null } }
}
```
O motor genérico ganha suporte a `flow.switch`/`flow.if`/`flow.map`/`flow.parallel` como **nós que contêm sub-pipelines** — ainda 100% declarativo, ainda só blocos curados. `resolveRefs` e a validação Zod continuam valendo dentro dos ramos.
---
# Parte 5 — O Tool Engineer (agente construtor)
Aqui mora a maior evolução em relação ao doc original: o builder deixa de ser **uma chamada de LLM que cospe um patch** e vira um **agente** que conversa, **pesquisa**, **constrói**, **testa** e **revisa** — o "Tool Engineer". É literalmente Claude (Anthropic) operando por dentro do produto, com tool-use, dentro de tetos de voxxys.
## 5.1 De "1 chamada de LLM" para "agente com fases"
O loop da Parte 2.3 continua sendo o coração (emitir/validar/preview/publish). O Tool Engineer **embrulha** esse coração em fases explícitas e dá a ele **suas próprias ferramentas** (function-calling). Vantagens:
- **Constrói qualquer tool**, não só as óbvias — porque pode pesquisar a abordagem antes de desenhar.
- **Faz engenharia reversa** assistida (apontar uma referência e deixar o agente inferir o spec).
- **Se autorregula em qualidade** via um **Revisor** adversarial automático antes do publish.
- **Tudo medido**: cada fase consome voxxys, com tetos por fase e por build.
## 5.2 As ferramentas do próprio Tool Engineer (function-calling)
Cuidado conceitual: **não confundir** as *ferramentas do Engineer* (o que o agente construtor pode fazer) com os *blocos* (o que as tools geradas executam). O Engineer usa estas funções via tool-use nativo da Anthropic:
```ts
// Ferramentas expostas ao Tool Engineer (agente construtor)
interface ToolEngineerTools {
  // Descoberta (introspecção da própria Fábrica)
  listBlocks(category?: BlockCategory): BlockSummary[];
  getBlockSchema(id: string): JsonSchema;
  listTemplates(family?: ToolFamily): TemplateSummary[];
  // Pesquisa / engenharia reversa  (cobra voxxys; gated)
  searchWeb(query: string): SearchResult[];
  fetchUrl(url: string): { title: string; text: string };       // conteúdo = DADO, nunca instrução
  analyzeReference(ref: { url?: string; image?: FileRef; samples?: IO[] }): ReverseEngSpec;
  // Design (edita a ToolDefinition em construção)
  getCurrentDefinition(): ToolDefinition;
  emitDefinitionPatch(patch: JsonPatch): ToolDefinition;          // saída estruturada
  // Validação determinística
  validateDefinition(): { ok: boolean; errors: ValidationError[] };
  // Teste real
  runPreview(sampleInputs: Record<string, unknown>): RunResult;   // motor genérico, ?draft=true
  // Revisão adversarial automática  (cobra voxxys; premium)
  requestReview(): ReviewReport;
  // Publicação (auto-registro)
  publishTool(): { tool_key: string; version: number };           // POST /v1/tool + PUT /v1/plan/.../tool + snapshot
}
```
Cada chamada passa pelo **medidor de build** (Parte 7) **antes** de executar — o orçamento é checado a cada turno do agente, então um loop desgovernado não dreca saldo.
## 5.3 O loop completo (intake → research → design → validate → preview → review → publish)
```
intake ─▶ [clarify?] ─▶ research? ─▶ design ─▶ validate ⇄ (autocorrige) ─▶ preview ─▶ review ─▶ [blockers?] ─▶ publish
  └ Haiku    └ Haiku       └ Sonnet     └ Sonnet   └ determinístico        └ motor genérico  └ Opus      └ humano    └ APIs admin
              (perguntas)   (gated +      (emite                            (amostra real)    (adversarial) confirma
                            cobra)        patch)                                                cobra
```
1. **Intake & Clarify** — o Engineer lê o pedido e, se o escopo estiver ambíguo, **pergunta** (modelo barato). Sai com: objetivo, inputs, outputs, runtime sugerido (`blocks_v1` vs `agent_v1`), família e blocos candidatos. *Custo: baixo.*
2. **Research (opcional, gated)** — só se preciso (engenharia reversa, achar abordagem, conferir formato de saída de uma referência). Usa `searchWeb`/`fetchUrl`/`analyzeReference`. Humano **aprova entrar** em pesquisa (porque cobra). *Custo: medido, com teto.*
3. **Design** — emite a `ToolDefinition` via `emitDefinitionPatch`, restrita a blocos existentes. *Modelo standard/premium.*
4. **Validate** — checagens **determinísticas** (bloco existe? params passam no Zod? referências resolvem? UI liga em inputs reais? runtime coerente com os blocos?). Se falha, devolve o erro pro Engineer **se autocorrigir** (retries limitados, cada um conta como esforço). *Custo: zero (é código).*
5. **Preview** — roda o rascunho no **mesmo motor genérico** (`?draft=true`) numa amostra. Passos `ai.image.*` aqui são o caro → contam pesado no medidor. *Custo: medido.*
6. **Review** — o **Revisor** (5ª/6ª lente automática, Parte 6.2) critica definition + saída do preview. Pode **bloquear** (blockers) ou **alertar** (warnings que exigem confirmação humana). *Custo: medido (premium).*
7. **Publish** — `publishTool` auto-registra: `POST /v1/tool` + `PUT /v1/plan/:id/tool/:key` + grava `ai_tool_definitions` `published` + snapshot append-only. **Sem deploy.** *Humano confirma.*
**Humano no loop** em 3 pontos obrigatórios: aprovar pesquisa (custo), reagir aos warnings do Revisor, confirmar publish. Os demais passos o agente toca sozinho dentro dos tetos.
## 5.4 Integração Anthropic API (o "chat com IA da Anthropic dentro do projeto")
A interface `BuilderLLM` do doc original continua sendo a fronteira — trocar provider = 1 arquivo. Para o Tool Engineer (e para as tools `agent_v1`), o caminho recomendado é o **SDK Anthropic** por:
- **Tool-use nativo (function calling):** o Engineer chama suas ferramentas (5.2) de forma confiável e estruturada; as tools `agent_v1` chamam seus blocos do mesmo jeito.
- **Prompt caching do schema grande:** a **Biblioteca de Blocos + catálogo de widgets** é grande e **estável**. Cacheá-la como prefixo derruba o custo de cada turno do build — ou seja, **menos voxxys gastos por iteração**. É o maior ganho de custo da integração.
- **Saída estruturada:** definitions e patches saem como JSON validável (e o backend rejeita/realimenta o que não passa).
- **Streaming:** feedback ao vivo no chat do builder — o usuário vê o Engineer "pensando", pesquisando e montando a tool em tempo real (casa com a infra `vox-fx` do medidor).
- **Tiers de modelo mapeados pro medidor:** *Haiku* (intake/clarify, validações baratas) → *Sonnet* (design, research) → *Opus* (review crítico, casos difíceis). Isso espelha o eixo **cheap/standard/premium × esforço** já previsto no billing de build (2.4).
> Resumo da sua frase "um chat com IA da Anthropic para conversa via API dentro do projeto":
> tecnicamente são **dois usos** do mesmo SDK — (1) o **Tool Engineer** (constrói tools) e
> (2) tools `agent_v1` geradas que **conversam/raciocinam** para o cliente final. Mesma integração,
> mesma interface `BuilderLLM`, mesmo medidor de voxxys.
---
# Parte 6 — Capacidades avançadas do builder
## 6.1 Pesquisa & engenharia reversa assistida
Automatiza a metodologia da Parte 1.1 (que fizemos na mão na Gravação 1-Clique). Fluxo:
- O usuário fornece uma **referência**: URL de um produto, descrição, **amostras de entrada→saída**, ou aponta uma tool concorrente.
- O Engineer usa `analyzeReference`/`searchWeb`/`fetchUrl` para inferir: *o que a tool faz, qual o pipeline provável, quais presets/parâmetros, qual formato de saída*.
- Produz um **spec** (igual ao que você escreveu à mão para a Gravação), agora assistido — e já o traduz para uma `ToolDefinition` candidata.
- Para tools **determinísticas de imagem**, a verificação é **comparar saídas** (pixel-a-pixel / dimensão / pHYs) contra as amostras da referência — exatamente o critério que usamos na Gravação.
- **Segurança:** todo conteúdo baixado é **dado não-confiável**. O Engineer o trata como material de análise, **nunca como instrução** (defesa de prompt injection, Parte 8). Conteúdo é citado/resumido, jamais executado.
## 6.2 O Revisor (revisão adversarial automatizada)
Transforma a "revisão adversarial" da Parte 1.1 em um **componente do builder**: um **agente revisor separado** (system-prompt próprio, modelo premium) que critica a definition + a saída do preview **antes do publish**. Multi-lente, cada achado **verificado** (o revisor não pode "alucinar bug" — quando aponta algo, re-roda o preview ou valida contra o schema para confirmar).
| Lente | O que procura | Exemplos de achado |
|---|---|---|
| **Segurança** | blocos perigosos, params abertos, injection no research, necessidade de sandbox | "`web.fetch` alimentando `ai.text.transform` sem sanitização → risco de injection" |
| **Custo** | `vox_cost` coerente com os blocos, passos de IA caros sem necessidade, loop sem teto | "3 passos `ai.image.generate` no preview elevam o custo 6x — dá pra fazer com 1" |
| **Qualidade** | o pipeline faz o que foi pedido? edge cases (imagem enorme, input vazio, lista vazia) | "Sem tratamento para `clf.label = inconclusivo` quando confiança < 0.5" |
| **UX** | controles fazem sentido, labels claros, notice de custo presente | "`width_mm` como `number` livre; melhor `slider` com min/max" |
| **Billing** | `free_quota` por plano coerente, `settle`/`refund` corretos no caminho de erro | "Tool agêntica marcada `vox_cost: 2` fixo — deveria ser `metered`" |
**Saída:** lista de achados com severidade. **Blockers** impedem o publish; **warnings** exigem confirmação humana explícita. *Custo: medido em voxxys (premium).* Esse é o "**revisador de tudo**" da sua visão — e ele roda tanto no build do admin quanto, na fase 3, como **gate de moderação** das tools de clientes.
## 6.3 Tools agênticas (runtime `agent_v1`) — tools que pensam
Para tools que **não** são single-pass ("pesquisar e gerar relatório", "diagnóstico multi-passo", "qualquer coisa que ela imaginar"), a definition declara `engine_runtime: "agent_v1"` e um bloco `agent` com: system-prompt, blocos permitidos (= ferramentas do agente), `max_steps`, `budget_vox` (teto duro) e `output_schema`.
Exemplo — tool "pesquisar concorrente e gerar relatório em PDF":
```jsonc
{
  "schemaVersion": 1,
  "engine_runtime": "agent_v1",
  "input": {
    "tema": { "type": "string", "required": true },
    "profundidade": { "type": "enum", "options": ["rapida","completa"], "default": "rapida" }
  },
  "agent": {
    "system": "Você é um pesquisador. Use as ferramentas para pesquisar sobre {tema} e produzir um relatório estruturado em PT-BR. Cite as fontes. Pare quando o relatório estiver completo.",
    "tools": ["web.search", "web.fetch", "ai.text.summarize", "doc.render_pdf", "output.upload_file"],
    "max_steps": 12,
    "budget_vox": 40,
    "output_schema": { "report_url": "string", "summary": "string", "sources": "string[]" }
  },
  "output": { "primary": "agent.report_url", "preview": "agent.summary", "meta": ["agent.sources"], "savable": true },
  "ui": {
    "layout": "report",
    "controls": [
      { "bind": "input.tema",        "widget": "text",   "label": "Tema da pesquisa" },
      { "bind": "input.profundidade","widget": "select", "label": "Profundidade" }
    ],
    "action": { "label": "Pesquisar e gerar relatório", "showCostNotice": true },
    "result": { "kind": "report", "downloadFrom": "output.primary", "showMeta": true }
  },
  "billing": { "vox_cost": "metered", "free_quota": { "prata": 1, "ouro": 5, "platina": 20 } }
}
```
**Como roda:** o motor agêntico carrega o `agent`, dá a Claude **só** os blocos do whitelist como ferramentas (tool-use), e itera **até** o objetivo ou `max_steps`/`budget_vox`. Persiste como `tool_run_jobs` (já temos o padrão), responde `202 {jobId}`, front faz polling. **Tetos duros** por passo e por run; refund automático em falha.
**Billing medido (`vox_cost: "metered"`):** como o custo varia por run, a cobrança usa o **mesmo medidor do build** (`applyVoxDelta` por passo: cada turno de Claude + cada bloco caro debita), `settle` = soma dos passos, `refund` em erro. Isso é uma **extensão** do billing — o caminho determinístico de `vox_cost` fixo continua **intacto** (reuso literal do invoke→settle/refund). `resolveToolBilling` ganha um modo `metered` que autoriza contra o `budget_vox` em vez de um custo fixo.
## 6.4 Templates & Starter Kits (recursos pré-configuráveis)
A sua exigência de "recursos já pré-configuráveis" vira uma **galeria de templates**: o builder **não começa em branco**. Cada template = um esqueleto de `ToolDefinition` + um roteiro guiado que o Engineer pré-preenche.
| Template | Família | Runtime | O que já vem pronto |
|---|---|---|---|
| Gerador de imagem | Imagem | `blocks_v1` | `text.input` → `ai.image.generate` → `output.upload_png` |
| Classificador de imagem | Imagem | `blocks_v1` | `image.input` → `ai.image.classify` (rótulos editáveis) → resultado |
| Engenharia reversa (laser) | Imagem | `blocks_v1` | a própria Gravação 1-Clique como base editável |
| Extrator de documento | Documento | `blocks_v1` | `file.input` → `doc.parse_pdf` → `ai.text.extract` (schema editável) → `output.return_json` |
| Resumidor | Documento | `blocks_v1` | `text/file.input` → `ai.text.summarize` |
| Revisor de código | Código | `blocks_v1` | `text.input` (código) → `ai.code.review` |
| Tradutor de código | Código | `blocks_v1` | `text.input` → `ai.code.translate` |
| Pesquisador → relatório | Agente | `agent_v1` | o exemplo de 6.3, pronto para customizar |
| Assistente conversacional | Agente | `agent_v1` | loop `ai.text.*` (+ `web.*` opcional) — o "chat com IA dentro do produto" |
**Implementação:** novo status `template` na `ai_tool_definitions` (ou tabela `tool_templates`), reusando o mesmo schema. Selecionar um template → o Engineer carrega o esqueleto, pergunta as 2-3 lacunas (ex.: "quais rótulos?", "que schema de saída?") e parte para validate/preview. **Mata o cold-start** e ensina o usuário a pensar em blocos.
---
# Parte 7 — Economia de voxxys (build + run + share)
A Parte 2.4 cobre 2 camadas. Esta versão consolida em **três frentes** e detalha a governança.
## 7.1 As três frentes de custo
1. **Construir (build):** intake, research, design, preview (passos `ai.image.*` são o caro), review, retries. Medido por **modelo × esforço** no `vox_ledger` (`applyVoxDelta`). Tetos por build/dia. *Reuso: medidor + `vox-fx`.*
2. **Rodar a tool (run):**
   - **Determinística** → `vox_cost` **fixo**, fluxo `invoke → resolveToolBilling → settle/refund` **inalterado**.
   - **Agêntica/variável** → `vox_cost: "metered"`, autoriza contra `budget_vox`, debita por passo, `settle` = soma, `refund` em erro. *Extensão do `resolveToolBilling`.*
3. **(Fase 3) Revenue share:** quando o autor é um cliente, uma fatia das voxxys de **cada uso** é creditada a ele via `applyVoxDelta`. *Reuso: o mesmo ledger.*
## 7.2 Modelo de medição
| Item | Como mede | Tier |
|---|---|---|
| Turno de raciocínio (build ou agente) | tokens in+out | cheap/standard/premium (Haiku/Sonnet/Opus) |
| Passo `ai.image.*` | "pedaço" fixo por passo (imagem é caro) | — |
| Chamada `web.search`/`web.fetch` | custo fixo pequeno por chamada | — |
| Retry de validação | conta como esforço | tier do turno |
| Review | turno premium + re-preview se necessário | premium |
## 7.3 Governança de custo (tetos duros, checados antes de cada turno)
- **Teto por build** e **orçamento/dia** por usuário/marca.
- **Tier premium atrás de RBAC** (nem todo mundo invoca Opus à vontade).
- **Limite de passos de preview** e **de retries**.
- **Para tools agênticas:** `max_steps` + `budget_vox` por run, **rate-limit por autor**, e o medidor **interrompe** o loop ao bater o teto (com refund proporcional).
- **Medidor ao vivo** no chat (build) e no run agêntico (`vox-fx`) — transparência total de quanto está custando, em tempo real.
---
# Parte 8 — Segurança & confiabilidade
## 8.1 Fronteiras por runtime
| Runtime | Fronteira de segurança | Garantia |
|---|---|---|
| `blocks_v1` | **Biblioteca de blocos curados** | Só código revisado por nós roda; a IA só **compõe** |
| `agent_v1` | **Whitelist de blocos + tetos** | O agente só chama o que a definition permite; `max_steps`/`budget_vox` cortam loop |
| `blocks_v2_sandbox` | **Sandbox endurecido** (isolated-vm/worker, sem fs/net, limites de CPU/mem/tempo) | Código do autor isolado; o sandbox **é** a fronteira e tem que estar endurecido antes de liberar |
## 8.2 Defesa contra prompt injection (research / conteúdo não-confiável)
Como `web.fetch`/`web.search`/`analyzeReference` trazem conteúdo de fora:
- Conteúdo externo é **dado, nunca instrução**. Entra em canal separado do system-prompt; o Engineer é instruído (e testado) a **não obedecer** comandos embutidos em páginas/arquivos.
- Conteúdo não vira params de bloco sem passar por validação Zod e, quando alimenta um bloco de IA, vai como **dado citado**, não como diretiva.
- O **Revisor** tem uma lente específica para isso (8.1 ↔ 6.2).
## 8.3 Validação, sanitização e guards de run
- **Zod em toda fronteira** (já é a cultura da PL/UPVOX): inputs da tool, params de cada bloco (no save **e** antes de cada run), saída do Engineer.
- **Guards genéricos de run** generalizando o `MAX_OUTPUT_PIXELS` do laser-prep: teto de MP/tamanho, **timeout via `AbortSignal`**, limite de tokens por passo.
- **Output sanitizado:** uploads só pra storage controlado (Bunny), sem URLs arbitrárias; `output.email` (fase 2) é gated por permissão.
## 8.4 Observabilidade & auditoria
- **Telemetria de build:** quais fases, quanto custou, quantos retries, tempo por turno.
- **Telemetria de run por tool:** sucesso/erro, custo, latência, passos (agêntico).
- **Auditoria por versão + invocation:** `ai_tool_definition_versions` (append-only) + `tool_run_jobs`/`tool_build_jobs` com audit log — rollback 1-clique e rastreabilidade total (mesma disciplina do `pl_provisioning_job`).
- **Dashboard de custo:** voxxys gastos por marca/tool/fase — insumo direto para precificar planos e o futuro revenue share.
---
# Parte 9 — Roadmap expandido (detalha a Parte 2.7, sem alterá-la)
A Parte 2.7 segue válida. Este roadmap encaixa as novas capacidades de forma granular.
**MVP — Fábrica admin determinística (`blocks_v1`)**
- Tabelas `ai_tool_definitions` (+ versões append-only).
- Biblioteca de Blocos v1: imagem/laser (embrulhando `lib/*`/`services/*`) **+ os primeiros de texto/documento/dados** (`ai.text.*`, `doc.parse_*`, `data.*`) para já não ser "só imagem".
- Motor genérico reusando `resolveToolBilling`; suporte a `flow.*` (ramificação declarativa).
- `DynamicToolView` com widgets de imagem **e** texto/dados.
- Builder conversacional (núcleo da 2.3): emitir → validar → preview → publish.
- Medição de custo de build; `tool_build_jobs`/`tool_run_jobs` p/ runs lentos.
- **Templates iniciais** (6.4): gerador/classificador de imagem, extrator de documento, resumidor.
- **Destrava:** admin cria tools de imagem **e** de texto/dados por chat, sem deploy. **Risco baixo.**
**Fase 1.5 — Tool Engineer agêntico + Revisor + Pesquisa**
- Migração do `BuilderLLM` pro SDK Anthropic (tool-use nativo + prompt caching do schema).
- Tool Engineer com **fases** (5.3) e **ferramentas próprias** (5.2): `searchWeb`/`fetchUrl`/`analyzeReference`.
- **Engenharia reversa assistida** (6.1) com verificação de saída.
- **Revisor adversarial automático** (6.2) como gate de qualidade.
- Defesa de prompt injection (8.2) endurecida.
**Fase 2a — Runtime agêntico (`agent_v1`)**
- Motor agêntico (loop com Claude + whitelist de blocos), `max_steps`/`budget_vox`.
- Billing **medido** (`vox_cost: "metered"`) reusando o medidor.
- Blocos `web.*`, `ai.embed`/`vector.*`, `ai.code.*`.
- **Templates agênticos** (pesquisador→relatório, assistente conversacional).
- **Destrava:** "qualquer coisa que ela imaginar" — tools que pesquisam e raciocinam.
**Fase 2b — Código em sandbox (`blocks_v2_sandbox`)**
- Bloco `code.custom` em isolated-vm/worker (sem fs/net, limites duros), só admin.
- **Destrava:** lógica que os blocos não cobrem. **Risco:** execução de código → sandbox tem que estar endurecido antes.
**Fase 3 — Clientes + moderação + marketplace + revenue share** (= 2.7, fase 3)
- Builder pro cliente (`author_type='customer'`, tools entram `pending`).
- **Revisor como moderação obrigatória** (preview + run de amostra forçado).
- Marketplace de tools aprovadas; **revenue share** via `applyVoxDelta`.
- **Destrava:** rede de tools feitas e monetizadas por clientes (o flywheel da Parte 3.2).
---
## Próximos passos (quando sair do papel)
- **Quando for construir:** começar pelo **MVP** — provar o conceito re-expressando a Gravação 1-Clique como `ai_tool_definitions` + motor genérico + `DynamicToolView` (sem builder ainda), e só então plugar o chat-builder por cima. Cada fase como conjunto de PRs (upvox: tabelas+endpoints; main API: blocos+motor genérico+jobs; front: renderer+builder), com revisão adversarial como fizemos na Gravação.
- **Validar a escada de runtime cedo:** logo após o MVP, fazer um *spike* de **uma** tool `agent_v1` simples (ex.: pesquisador→relatório) só para exercitar o medidor `metered`, os tetos e o polling — antes de abrir blocos demais.
- **Decidir o provider do planner:** confirmar SDK Anthropic (tool-use + prompt caching) vs OpenRouter atrás da `BuilderLLM`. O prompt caching do schema grande é o que mais derruba custo de build em voxxys — vale priorizar.
## Verificação (quando implementar o MVP)
- Re-expressar `gravacao_oneclick` como definition → rodar pelo motor genérico → bater pixel-a-pixel com a tool atual (mesmo PNG/dimensão/pHYs).
- `DynamicToolView` renderiza a tool a partir do schema e cobra igual (invoke→settle/refund, `{billing.notice}`, saldo anima).
- Publish via APIs admin cria as linhas `tools`/`plan_tools` e a tool aparece no catálogo/entitlements sem deploy.
- Medidor de build debita voxxys por modelo×esforço e respeita os tetos.
- **(Fase 1.5)** O Tool Engineer completa o loop intake→…→publish numa tool nova **de texto** sem intervenção manual fora dos 3 pontos de humano-no-loop; o Revisor barra ao menos 1 problema plantado de propósito.
- **(Fase 2a)** Uma tool `agent_v1` respeita `max_steps`/`budget_vox`, persiste `tool_run_jobs`, faz polling e dá refund proporcional ao estourar o teto.
---
> Referência: este doc nasceu da construção da **Gravação 1-Clique** (motor `laser-prep` +
> billing voxxys + tela com `useToolBilling`). A Fábrica é o passo de transformar esse
> processo manual em um produto onde a própria tool é descrita por conversa e montada pela IA —
> e, nesta versão, ampliado para **qualquer tool** (imagem, texto, dados, código, pesquisa,
> agente), com um **Tool Engineer** que pesquisa, constrói e revisa usando Claude por dentro do
> produto, sempre medido em voxxys.
