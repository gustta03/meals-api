FROM oven/bun:1 AS base
WORKDIR /app

# Install system fonts for SVG text rendering
RUN apt-get update && apt-get install -y \
    fonts-dejavu-core \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json /temp/dev/
COPY bun.lock /temp/dev/
RUN cd /temp/dev && bun install

FROM install AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production
RUN bun run build || true

FROM base AS release
# Install fonts in the release stage as well
RUN apt-get update && apt-get install -y \
    fonts-dejavu-core \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
COPY --from=prerelease /app/node_modules node_modules
COPY --from=prerelease /app/package.json .
COPY --from=prerelease /app/bun.lock .
COPY --from=prerelease /app/tsconfig.json .
COPY --from=prerelease /app/src src

EXPOSE 3000/tcp
CMD [ "bun", "run", "src/index.ts" ]
