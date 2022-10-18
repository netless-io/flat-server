import fp from "fastify-plugin";
import { createLoggerAPIv2, Logger, parseError } from "../../logger";
import { FastifyRequest } from "fastify";
import { LoggerAPIv2 } from "../../logger/LogConext";
import { FastifyInstance } from "fastify/types/instance";
import { createDecoder } from "fast-jwt";

export const kAPILogger = Symbol("api-logger");

const jwtDecoder = createDecoder({
    complete: true,
});

const plugin = (instance: FastifyInstance, _opts: any, done: () => void): void => {
    instance.decorateRequest(kAPILogger, null);

    instance.addHook("onRequest", (request, _reply, done) => {
        if (request.routerPath?.startsWith("/v2")) {
            const log = apiLogger(request);

            log.debug("receive request");

            // @ts-ignore
            request[kAPILogger] = log;
        }

        done();
    });

    instance.addHook("onResponse", (request, reply, done) => {
        // @ts-ignore
        const log = request[kAPILogger] as Logger<LoggerAPIv2> | undefined;

        if (log) {
            const durationMS = reply.getResponseTime();
            log.debug("request execution time", {
                durationMS,
            });
        }

        done();
    });

    instance.addHook("onError", (request, _reply, error, done) => {
        // @ts-ignore
        const log = request[kAPILogger] as Logger<LoggerAPIv2> | undefined;

        if (log) {
            if (error.validation) {
                log.debug("validation error", parseError(error));
            } else {
                log.error("request failed", parseError(error));
            }
        }

        done();
    });

    done();
};

export const fastifyAPILogger = fp(plugin);

const apiLogger = (request: FastifyRequest): Logger<LoggerAPIv2> => {
    const user = ((): any => {
        if (request.headers && request.headers["authorization"]) {
            if (request.headers["authorization"].startsWith("Bearer ")) {
                // 7 => "Bearer "
                return jwtDecoder(request.headers["authorization"].slice(7)).payload;
            }
        }

        return {};
    })();

    // @ts-ignore
    return createLoggerAPIv2<RecursionObject<string | number | boolean>>({
        requestPath: request.routerPath,
        requestID: request.reqID,
        sessionID: request.sesID,
        [request.routerPath]: {
            user: user
                ? {
                      userUUID: user?.userUUID,
                      loginSource: user?.loginSource,
                      iat: user?.iat,
                      exp: user?.exp,
                  }
                : undefined,
            params: {
                ...(request.params as any),
            },
            body: {
                ...(request.body as any),
            },
            query: {
                ...(request.query as any),
            },
            headers: {
                ...request.headers,
            },
        },
    }) as Logger<LoggerAPIv2>;
};
