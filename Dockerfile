FROM node:18.4.0 as base
LABEL maintainer="Black-Hole<158blackhole@gmail.com>"

WORKDIR /usr/src/app/
COPY . .

# ----

FROM base as builder

RUN yarn --frozen-lockfile

RUN yarn build

# -----

FROM base as prod-dependencies

RUN yarn install --production --frozen-lockfile

# ----

FROM node:18.4.0

WORKDIR /usr/src/app/

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=prod-dependencies /usr/src/app/node_modules ./node_modules

EXPOSE 80

ENTRYPOINT ["node", "dist/index.js"]
