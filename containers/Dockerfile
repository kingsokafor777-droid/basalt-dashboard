FROM node:22-slim@sha256:a17d50af28002a160548bd4225b3cfcb12c5efcb171f79e68758f2885fb1b066

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
    && groupadd --gid 10001 basalt \
    && useradd --uid 10001 --gid basalt --create-home --shell /usr/sbin/nologin basalt \
    && chown -R basalt:basalt /app

ENV NODE_ENV=production
USER 10001:10001
EXPOSE 3000
CMD ["node", "dist/index.js"]
