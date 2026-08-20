FROM node:22-slim@sha256:a17d50af28002a160548bd4225b3cfcb12c5efcb171f79e68758f2885fb1b066 AS builder

WORKDIR /app
RUN apt-get update \
    && apt-get upgrade --no-install-recommends --yes \
    && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN npm install --global corepack@latest \
    && corepack pnpm install --frozen-lockfile
COPY . .
RUN corepack pnpm build \
    && corepack pnpm prune --prod

FROM cgr.dev/chainguard/node@sha256:3a3fbc052438535cca1ac0eed75c2dabf04a7ce7de749667cd265f98dbf9c771
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
ENV NODE_ENV=production
USER nonroot:nonroot
EXPOSE 3000
CMD ["dist/index.js"]
