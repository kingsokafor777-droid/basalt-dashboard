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
RUN corepack pnpm build

FROM gcr.io/distroless/nodejs22-debian12@sha256:13593b7570658e8477de39e2f4a1dd25db2f836d68a0ba771251572d23bb4f8e
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
ENV NODE_ENV=production
USER nonroot:nonroot
EXPOSE 3000
CMD ["dist/index.js"]
