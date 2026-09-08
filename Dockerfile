FROM node:22-alpine AS base

# ─── Dependencies ─────────────────────────────────────────────────────────────

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./

# package-lock.json resolve @upvox-dev/ui direto no GitHub Packages (outra
# org, UpVox-Dev) — sem token o npm ci cai com 401. O token não pode ir pro
# .npmrc versionado, então entra como build-arg (configurado no Easypanel,
# igual às outras envs deste Dockerfile) e é escrito/apagado num único RUN
# pra não sobrar no histórico da imagem intermediária.
ARG NPM_TOKEN
RUN if [ -n "$NPM_TOKEN" ]; then npm config set //npm.pkg.github.com/:_authToken="$NPM_TOKEN"; fi \
    && npm ci \
    && npm config delete //npm.pkg.github.com/:_authToken 2>/dev/null || true

# ─── Builder ──────────────────────────────────────────────────────────────────

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_GATEWAY_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_COMPANY_SYSTEM
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_GATEWAY_URL=$NEXT_PUBLIC_GATEWAY_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_COMPANY_SYSTEM=$NEXT_PUBLIC_COMPANY_SYSTEM

RUN npm run build

# ─── Runner ───────────────────────────────────────────────────────────────────

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
