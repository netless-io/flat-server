FROM node:12.22 as base
LABEL maintainer="Black-Hole<158blackhole@gmail.com>"

WORKDIR /usr/src/
COPY . .

# ----

FROM base as builder

RUN yarn --frozen-lockfile

ENV CONTEXT="docker"

RUN yarn build

# -----

FROM base as prod-dependencies

RUN yarn install --production --frozen-lockfile

# ----

FROM node:12.22

WORKDIR /usr/src/

COPY --from=builder /usr/src/dist ./dist
COPY --from=prod-dependencies /usr/src/node_modules ./node_modules

EXPOSE 80

ENTRYPOINT ["node", "dist/index.js"]
