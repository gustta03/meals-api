FROM oven/bun:1 AS base
WORKDIR /app

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
COPY --from=prerelease /app/node_modules node_modules
COPY --from=prerelease /app/package.json .
COPY --from=prerelease /app/src src

EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "src/index.ts" ]
