# Fábrica de Ferramentas — documentação de handoff

> **Status (2026-06-10):** funcionalidade completa em 3 repos, **commitada, sem merge** (PRs abertos). Falta deploy (precisa de `ANTHROPIC_API_KEY` + envs `TOOL_AGENT_*`) e o merge dev→prod. Este doc é o ponto de retomada — lê ele inteiro antes de mexer.

A **Fábrica de Ferramentas** (`/ferramentas`) é um builder onde o admin monta ferramentas de IA (ex.: "Vetorizar logo", "Gravação a laser") de 3 formas:

1. **Canvas low-code** estilo n8n (nós ligados saída→entrada).
2. **Etapas** (modo lista, mesma coisa sem o canvas).
3. **Agente IA "Engenheiro de Ferramentas"** — conversa em PT-BR e **monta a ferramenta sozinho ao vivo** no mesmo canvas (estilo Claude Code, pra leigos).

A ferramenta montada vira uma **`ToolDefinition`** (JSON), que é salva/publicada na **upvox-api** e executada por um **motor genérico de blocos** na **main API**. O cliente final usa a ferramenta por uma UI auto-gerada (`DynamicToolView`), pagando em **voxes**.

---

## 1. Os 3 repositórios

| Repo | Path local | Papel | Stack |
|---|---|---|---|
| **front** | `profissao_laser` | builder + UI do cliente | Next.js 16, React 19 (react-compiler ON), Tailwind v4, Biome |
| **main API** | `Profissao-Laser-API` | motor de blocos + agente IA (SSE) | Fastify 5, Zod, Biome, vitest |
| **upvox** | `api-upvox` (repo GitHub `upvox-api`) | armazena/publica `ToolDefinition` + débito de voxes | Fastify 5 + Supabase + Stripe |

O front fala com **dois** backends:
- `api` (axios) → main API, base `NEXT_PUBLIC_GATEWAY_URL` (gateway easypanel). Usado pelo motor (`/api/tool-run/...`) e pelo agente (`/api/tool-agent/turn`).
- `apiCourses` (axios) → upvox, base `NEXT_PUBLIC_COURSES_API_URL`, paths sob `/v1`. Usado por `tool-definitions.service.ts` (CRUD/publish das defs) e billing.

---

## 2. Branches & PRs (estado atual)

| Repo | Branch | PR | Base | Conteúdo |
|---|---|---|---|---|
| front | `joaovcruz/fabrica-tools-front` | [#118](https://github.com/NextLayerDev/profissao_laser/pull/118) | `dev` | canvas + blocos util (catálogo) + nós custom + painel do agente + **redesign do formulário** |
| main API | `joaovcruz/fabrica-tools-engine` | [#132](https://github.com/NextLayerDev/Profissao-Laser-API/pull/132) | `dev` | blocos `util` + `validateDefinition` + módulo `tool-agent` (SSE, metering) |
| upvox | `joaovcruz/agente-tool-spend` | — (sem PR; base de dev) | — | `debitAgentBuild` + rota `/v1/me/agent/spend` |
| upvox | `joaovcruz/agente-tool-spend-to-main` | [#41](https://github.com/NextLayerDev/upvox-api/pull/41) | `main` | cherry-pick do spend pra prod (padrão do #40) |

Já mergeado antes (prod): upvox **#40** (`tool-definitions` → main) e o backbone do canvas/motor no front/dev.

**Regra do projeto:** PRs ficam **abertos sem merge** até aprovação do dono; backends vão pra `dev` e depois promovem pra `main` por cherry-pick aditivo (como o #40).

---

## 3. Modelo de dados (o coração)

### `BuilderState` (front) — `src/components/ferramentas/builder-model.ts`
Estado visual do builder. **É a fonte da verdade**; o canvas é só uma projeção dele.
```ts
interface BuilderState {
  templateId: string;
  toolKey: string;            // id único (slug), não muda depois de criar
  title: string; description: string; icon: string; actionLabel: string;
  fields: BuilderField[];     // campos do formulário do cliente
  nodes: BuilderNode[];       // pipeline (cada nó = {id, block, params})
  customNodes: CustomNodeSpec[]; // presets "nó do 0" (compile-down)
  output: { primary: string; preview: string; meta: string[] };
  voxCost: number; freeQuota: Record<string, number | null>;
}
```
- `BuilderField`: `{ name, type('image'|'enum'|'number'|'int'|'bool'|'string'), widget, label, required?, default?, min?, max?, step?, options?, visible }`.
- `ParamValue` (param de um nó): `{ mode:'literal', value }` **ou** `{ mode:'ref', source, negate? }` — `source` = `"input.<campo>"` ou `"<id_do_nó>.<saída>"`.

### `ToolDefinitionDoc` (o JSON publicado) — `src/modules/tools/services/tool-definitions.service.ts`
```ts
{ schemaVersion?, input: Record<name, InputSpec>, pipeline: {id,block,params}[],
  output: {primary?,preview?,meta?}, ui: {controls[], action, icon, custom_nodes?, ...},
  billing: { vox_cost, free_quota } }
```
Params serializados: literal → valor cru; ref → string `"head.field"` (ou `"!head.field"` p/ negar).

### Round-trip (garantia de ouro)
`buildDoc(state)` → `ToolDefinitionDoc`; `docToState({tool_key,title,description,definition})` → `BuilderState`.
**`docToState(buildDoc(state))` é idempotente** — posições do canvas são efêmeras (nunca vão pro doc). Sempre que mexer no modelo, preserve isso.

### Nós custom ("montar um nó do 0")
Um `CustomNodeSpec` é um **preset nomeado sobre UM bloco base** (label/ícone próprios + params pinados). `BuilderNode.block` pode ser `custom:<id>`. No `buildDoc` ele é **expandido pro bloco base** (o motor só vê blocos que conhece) e guarda-se `ui.custom_nodes = {defs, instances}` pro round-trip. **Motor e upvox não mudam** — o pipeline publicado só tem blocos base.

---

## 4. Front — peças

| Arquivo | O que faz |
|---|---|
| `components/ferramentas/builder-model.ts` | `BuilderState`, `buildDoc`/`docToState`, `newField`/`newNode`, `slugifyKey`, `allNodeOutputs`, `availableSources`, `customToSpec`/`resolveSpec`, `typeFits`/`wantType` |
| `components/ferramentas/block-catalog.ts` | `BLOCK_CATALOG` (specs dos blocos: params ref/literal + outputs tipados). **Espelha** o `blockRegistry` da main API — se um bloco não está deployado no motor, **não** ponha aqui (paleta-fantasma) |
| `components/ferramentas/forge-theme.ts` | `ACCENTS`/`ac()` (classes por cor), `PORT_HEX`/`PORT_LABEL` (tipos de porta), `resolveToolIcon` |
| `components/ferramentas/tool-builder-view.tsx` | **A view principal.** Galeria/lista + editor (grid `trabalho | prévia | agente`), header (Salvar/Publicar/toggles), modo JSON avançado |
| `components/ferramentas/builder-ui.tsx` | **Primitivas visuais do formulário (redesign).** `FormSection`, `Field`, `inputCls`, `SegmentedControl`, `IconPicker`, `Switch`, `TypeChip`, `FieldCard`, `StepperBar` |
| `components/ferramentas/builder-fields.tsx` | `KeyValueEditor`, `LiteralControl`, `ParamRow` (editores de param usados no modo Etapas/canvas drawer) |
| `components/ferramentas/canvas/tool-canvas.tsx` | Canvas React Flow (`@xyflow/react`). Posições efêmeras em `useNodesState` + `positionsRef` (anti-flicker) |
| `components/ferramentas/canvas/canvas-mapping.ts` | **Lógica pura** `buildNodes(state,pos)`/`buildEdges(state)` + `applyConnect`/`applyDisconnect`/`removeNode` (mutações tipadas, valida `typeFits`+ordem) |
| `components/ferramentas/canvas/canvas-nodes.tsx` | 3 custom nodes (inputs / block / output) |
| `components/ferramentas/canvas/canvas-layout.ts` | auto-layout dagre `LR` |
| `components/ferramentas/canvas/custom-node-modal.tsx` | modal "Criar nó" (preset sobre bloco base) |
| `components/ferramentas/agent/tool-agent-chat.tsx` | painel do agente (chat + transcript de ações + custo) |
| `modules/tools/services/tool-agent.service.ts` | `streamAgentTurn()` — abre o SSE via `fetch`+reader, parseia `event:`/`data:`, devolve `AgentEvent`s |
| `modules/tools/hooks/use-tool-agent.ts` | liga o agente ao MESMO `state`/`setState` do canvas; `doc`→`docToState` ao vivo; `cost`→vox-fx; trava de re-entrância |
| `modules/tools/services/tool-definitions.service.ts` | CRUD/publish das defs no upvox (`apiCourses`, `/v1`) |
| `modules/tools/components/dynamic-tool-view.tsx` | **UI do cliente** auto-gerada a partir da def (renderiza `ui.controls`, chama o motor, mostra resultado) |
| `modules/tools/lib/vox-fx.ts` | `applyVoxCharge(qc,{voxes_spent,balance})`, `emitVoxSpend()` — anima o saldo no header |
| `modules/tools/hooks/use-tool-billing.tsx` | cobrança de uso de tool (ver skill `voxxys-billing`) |

### O formulário redesenhado (builder-ui)
Direção escolhida: **tema "forge" escuro elevado** (coeso com o canvas/agente). Premissas:
- Tipografia **Poppins** (legível) p/ títulos/labels; **JetBrains Mono** só em id/keys e nº do passo.
- Inputs `h-10`, `rounded-xl`, **foco visível** (`focus-visible:ring`), labels com contraste (slate-200/300, não slate-500).
- `FormSection` auto-gera `id={builder-step-${step}}` → o **`StepperBar`** (barra sticky no topo) usa `IntersectionObserver` + `scrollIntoView` p/ navegar e marca ✓ por passo (progresso derivado do `state`).
- **Acessibilidade**: `htmlFor`/`id`, `role`/`aria` em switch/tab/stepper, alvos ≥ 40px.
- **Só camada visual** — todo control dispara o mesmo `patch(...)`/`addField`/`addNode`/etc. de antes.

---

## 5. main API — peças (`Profissao-Laser-API/src`)

| Arquivo | O que faz |
|---|---|
| `tool-blocks/blocks/*.ts` + `tool-blocks/index.ts` | **Motor de blocos.** `registerCoreBlocks()` registra cada bloco (`{id, paramsSchema(zod), outputs, run}`). Blocos: `image.*`, `laser.photoengrave`, `output.*`, e os **`util.*`** novos (`text_template`, `math` (guarda /0), `condition`, `http_request`) |
| `tool-blocks/blocks/util.ts` | `http_request` tem **trava SSRF obrigatória** (allowlist de host + bloqueio de IP privado/loopback/link-local, incl. bypass IPv6 `::ffff:`/NAT64 + fail-closed). Ligar em prod só após review |
| `lib/tool-engine.ts` + `controllers/tool-run.ts` | executa o pipeline da def publicada (`POST /api/tool-run/:key`). Valida tudo de novo no run |
| `lib/tool-validate.ts` | `validateDefinition(doc)` — validação **estrutural pura** (sem `run`): ids únicos, pipeline 1..32, `blockRegistry.get` existe, refs apontam pra `input`/nó anterior. 2ª barreira anti-drift catálogo↔registry |
| `lib/anthropic.ts` | `anthropic` client + `AGENT_MODEL` (`TOOL_AGENT_MODEL` ?? `claude-sonnet-4-6`) |
| `lib/tool-agent-tools.ts` | **13 tools do agente** (reducers PUROS catálogo-driven): `set_identity`, `add_input`/`remove_input`, `add_block`/`remove_block`, `set_param`, `connect` (valida tipo+ordem), `set_output`, `set_billing`, `create_custom_node`, `validate`, `ask_user`, `finish`. `applyAgentTool(doc,cat,name,input)` |
| `lib/tool-agent-prompt.ts` | system prompt PT-BR pra leigos (nunca publica, só block ids do catálogo, valida antes de finish) + catálogo serializado com `cache_control` |
| `lib/tool-agent-metering.ts` | `voxesFromUsage(usage)` — tokens→USD→**voxes com markup** (puro/testável). `VOX_USD`/`GRAN` exigem `>0` |
| `services/tool-agent.ts` | `runAgentTurn()` — loop `messages.stream` enquanto `stop_reason==='tool_use'` (cap 16 iter / 8k tokens); emite eventos SSE; debita 1x no fim via `spendAgent`; nunca lança |
| `controllers/tool-agent.ts` | `POST /api/tool-agent/turn` (SSE). Teto de turnos/sessão no Redis (`incrWithTtl`, fail-open); `reply.hijack()` + headers anti-buffer; `refId` único por turno |
| `routes/tool-agent.ts` | schema do body com **tetos anti-abuso** (history ≤40/16k, catalog ≤64). `authenticateVectorizacao` |
| `lib/upvox-agent.ts` | `spendAgent(customerId,{ref_id,vox_cost},authHeader)` — server-to-server pro upvox (`asCustomer`) |

Testes: `tests/tool-agent-reducers.test.ts` (18), `tests/tool-agent-metering.test.ts` (6), `tests/tool-util-blocks.test.ts`, `tests/tool-engine.test.ts`. **60/60 passando.**

---

## 6. upvox — peças (`api-upvox/src/modules`)

- `tool-definitions/*` — armazena as defs (`ai_tool_definitions` + versions), `publish` (rejeita `vox_cost:'metered'`, snapshot append-only), seed.
- `voxes/service.ts` `debitAgentBuild({customer_id, ref_id, vox_cost})` — checa `isTestUnlimited` (bypass → 0 debitado), senão saldo (402) + `applyVoxDelta({reason:'spend', ref_type:'agent_build', ref_id})`. `refundAgentBuild` simétrico.
- `voxes/route.ts` `POST /v1/me/agent/spend` (`requireAuth`) → `{voxes_spent, balance, unlimited}` ou 402.

**Pré-requisitos de DB em prod** (conferir antes do merge do #41): coluna `users.is_test_unlimited` existe; RPC `apply_vox_delta` aceita `reason='spend'` + `ref_type='agent_build'`.

---

## 7. Fluxos ponta-a-ponta

### A. Montar → salvar → publicar → rodar
1. Admin monta no `/ferramentas` (canvas/etapas/agente) → `BuilderState`.
2. `buildDoc(state)` → def → `createToolDefinition`/`updateToolDefinition` (upvox).
3. **Publicar** → `publishToolDefinition` (upvox, versão imutável).
4. Cliente abre a tool → `DynamicToolView` renderiza `ui.controls` → ao acionar, chama o motor `POST /api/tool-run/:key` (main API) → executa o pipeline → resultado. Cobra voxes (ver skill `voxxys-billing`).

### B. Turno do agente (SSE)
1. Front (`use-tool-agent`) manda `POST /api/tool-agent/turn` com `{session_id, definition: buildDoc(state), catalog: BLOCK_CATALOG+custom+fields, message, history}`.
2. main API (`runAgentTurn`): loop Claude tool-use; cada tool muta uma cópia do doc (reducers puros) e **emite evento `doc`** → o front faz `docToState` → **canvas + prévia atualizam ao vivo**.
3. Eventos SSE: `text` (narração) · `action` (✓/✗ por tool) · `doc` (def nova) · `cost` (voxes/saldo) · `done`/`error`.
4. Fim do turno: `voxesFromUsage(usage)` → `spendAgent` (upvox) → evento `cost`. Conta ilimitada não debita. **Nunca publica** — Publicar é botão do usuário.

---

## 8. Metering / money path
- **Por tokens → voxes com markup** (env, defaults Sonnet 4.6). `usd = inTok*IN + outTok*OUT + cacheWrite*CW + cacheRead*CR`; `voxes = ceil((usd/VOX_USD)*MARKUP / GRAN)*GRAN`.
- Debitado **1x no fim do turno** via `spendAgent`. Turno que falha sem nenhuma ação útil **não cobra**.
- Teto de turnos por sessão no Redis (fail-open se Redis cair).
- **Residual conhecido (não corrigido):** o `ref_id` do débito é único por tentativa, então um *replay* literal de POST poderia cobrar 2x. Mitigado por trava de re-entrância no front + `refId` único. Fix completo = idempotency-key do cliente + índice parcial em `vox_ledger` (mexe no RPC compartilhado `apply_vox_delta` — alto blast radius, pedir ok antes).

---

## 9. Deploy — variáveis de ambiente
**main API** (sem isso o agente degrada: turno vira `error`, custo 0):
- `ANTHROPIC_API_KEY` (obrigatória)
- `TOOL_AGENT_MODEL` (default `claude-sonnet-4-6`)
- `TOOL_AGENT_PRICE_IN/OUT/CACHE_WRITE/CACHE_READ` (USD/token; defaults Sonnet 4.6)
- `TOOL_AGENT_VOX_USD` (0.1) · `TOOL_AGENT_MARKUP` (3) · `TOOL_AGENT_VOX_GRANULARITY` (0.05)
- `TOOL_AGENT_MAX_TURNS_PER_SESSION` (40) · `EXTERNAL_API_URL` (base do upvox)

**front:** `NEXT_PUBLIC_GATEWAY_URL` (main API), `NEXT_PUBLIC_COURSES_API_URL` (upvox).

⚠️ Hoje o `NEXT_PUBLIC_GATEWAY_URL` aponta pro gateway **deployado**, que **ainda não tem** a rota `/api/tool-agent/turn` (está só no PR #132). Então testar o agente "de verdade" localmente exige subir a main API local com a rota + key e apontar o front pra ela.

---

## 10. Rodar local + verificar
- **front:** `npm run dev -- -p 3002` → `/ferramentas`. `npx tsc --noEmit` · `npx biome check .` · `npx next build`.
- **main API:** `npm run build` (babel) · `npx vitest run` (60 testes) · tsc via `node node_modules/typescript/bin/tsc --noEmit` (há ~26 erros **pré-existentes** não relacionados — filtrar por nome de arquivo).
- **upvox:** `npm run build` (tsc+tsup) · `npx vitest`.
- **SSE manual:** `curl -N` no `/api/tool-agent/turn` (precisa server + key) — **deferido pro ambiente de deploy**.
- **E2E feliz:** `/ferramentas` → nova tool → agente "quero uma tool pra marmoraria" → blocos aparecendo ao vivo no canvas → prévia atualiza → custo debita (com markup) → `validate` ok → usuário clica Publicar.

---

## 11. Gaps / TODO / DEFER (pra próxima feat)
- [ ] **Deploy** do motor+agente (dev→main) e das envs `TOOL_AGENT_*` + `ANTHROPIC_API_KEY`.
- [ ] **Merge** dos PRs (#118, #132, #41) após aprovação.
- [ ] **Idempotência forte** do débito do agente (idempotency-key + índice em `vox_ledger`).
- [ ] **`http_request` em prod** atrás de flag até security review.
- [ ] **Calibrar** `VOX_USD`/`MARKUP` com números reais dos pacotes de vox.
- [ ] Teste de **contrato catálogo↔registry** (garantir que `BLOCK_CATALOG` não oferece bloco que o motor deployado não tem).
- [ ] Lock do front: havia drift de `package-lock.json` (deps `canvas`/`@csstools` do React Flow) que quebrava `npm ci` no CI — conferir se o `setup` do CI do #118 está verde.
- [ ] (Opcional) polir o **cabeçalho do editor** e os **cards da galeria** no mesmo nível do formulário novo.
- [ ] (Evolução) nó custom como **sub-pipeline** (vários blocos num nó) — hoje é 1:1 com um bloco base.

---

## 12. Restrições do projeto (não esquecer)
- **Profissão prod:** não mexer em nada que possa derrubar a prod.
- PRs **sem merge** até o ok do dono; backend vai pra `dev`, promove pra `main` por cherry-pick aditivo (#40).
- **Nunca** commitar segredos; **nunca** rodar Stripe de dinheiro real; deploy é decisão do dono.
- O agente **nunca publica** — só monta. Publicar é botão do usuário.

---

### Skills relevantes do repo (já existem)
`voxxys-billing` (cobrança de voxes), `upvox-api` / `upvox-frontend-integration` (qual backend usar), `profissao-laser-api`, `claude-api` (ids/preços/params do Claude), `frontend-design` (`.agents/skills/frontend-design/SKILL.md` — guiou o redesign).
