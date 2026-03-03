# Rotas de API Necessárias para o Sistema Antifraude

Este documento lista as rotas de API e tabelas que precisam ser adicionadas ao backend Profissão Laser para que o sistema antifraude funcione integralmente.

**Base URL**: `NEXT_PUBLIC_API_URL` (configurado em `.env`)

---

## Resumo

| Recurso | Rota | Descrição |
|---------|------|-----------|
| Audit | POST /audit | Receber eventos de impressão, visibilidade e foco |

---

## Detalhamento

### POST /audit

Recebe eventos de auditoria enviados pelo frontend quando o utilizador:
- Abre o diálogo de impressão (`beforeprint`)
- Fecha o diálogo de impressão (`afterprint`)
- Minimiza ou troca de aba (`visibility_hidden`)
- Regressa à aba (`visibility_visible`)
- Perde o foco da janela (`blur`)
- Reganha o foco (`focus`)

**Body (JSON)**:

```json
{
  "type": "beforeprint" | "afterprint" | "visibility_hidden" | "visibility_visible" | "blur" | "focus",
  "at": "2026-03-03T12:34:56.789Z",
  "pathname": "/course/meu-curso",
  "userId": "uuid-opcional",
  "email": "utilizador@email.com"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|------------|-----------|
| type | string | Sim | Tipo do evento |
| at | string (ISO 8601) | Sim | Timestamp do evento |
| pathname | string | Não | Caminho da página onde ocorreu |
| userId | string | Não | ID do utilizador (sub do JWT) |
| email | string | Não | Email do utilizador |

**Nota**: O route handler Next.js `/api/audit` enriquece o payload com o IP do request (via `x-forwarded-for` ou `x-real-ip`) antes de encaminhar para o backend.

**Resposta esperada**: `200 OK` (qualquer body)

---

## Tabela sugerida: antifraud_audit_logs

```sql
CREATE TABLE antifraud_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id),
  email VARCHAR(255),
  ip VARCHAR(45),
  pathname VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_antifraud_audit_user ON antifraud_audit_logs(user_id);
CREATE INDEX idx_antifraud_audit_created ON antifraud_audit_logs(created_at);
CREATE INDEX idx_antifraud_audit_type ON antifraud_audit_logs(type);
```

---

## Fluxo

1. O frontend envia `navigator.sendBeacon('/api/audit', body)` quando ocorre um evento.
2. O route handler Next.js `POST /api/audit` recebe o pedido, extrai o IP dos headers e encaminha para `POST {API_URL}/audit`.
3. O backend persiste o registo na tabela `antifraud_audit_logs`.

---

## Notas

- **IP**: Pode vir de NAT/VPN; serve como evidência, não como prova absoluta.
- **Autenticação**: O route handler Next.js não valida token; o backend pode validar se receber o Bearer token (o sendBeacon não envia headers de auth por defeito).
- **Enquanto o backend não tiver a rota**: O frontend continua a enviar para `/api/audit`; o Next.js tenta encaminhar e regista um warning em consola se falhar. O utilizador não é afetado.
