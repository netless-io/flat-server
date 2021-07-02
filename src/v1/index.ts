import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { httpRouters } from "./Routes";
import { FastifyRoutes, FastifySchema, PatchRequest } from "../types/Server";
import { createLoggerAPI, parseError, Logger, LoggerAPI } from "../logger";

export const v1RegisterRouters = (server: FastifyInstance): void => {
    // @ts-ignore
    httpRouters.flat(Infinity).forEach((item: FastifyRoutes) => {
        const { method, path, handler, auth, schema, skipAutoHandle } = item;

        const serverOpts: ServerOpts = {};

        if (auth) {
            // @ts-ignore
            serverOpts.preValidation = [server.authenticate];
        }

        if (schema) {
            serverOpts.schema = schema;
        }

        const loggerHandle = (req: PatchRequest): Logger<LoggerAPI> => {
            const baseContext = {
                user: {
                    userUUID: req?.user?.userUUID,
                    loginSource: req?.user?.loginSource,
                    iat: req?.user?.iat,
                    exp: req?.user?.exp,
                },
                params: {
                    ...req.params,
                },
                body: {
                    ...req.body,
                },
                query: {
                    ...req.query,
                },
            };

            return createLoggerAPI<RecursionObject<string | number | boolean>>({
                requestPath: path,
                requestVersion: "v1",
                [`v1/${path}`]: baseContext,
            }) as Logger<LoggerAPI>;
        };

        server[method](
            `/v1/${path}`,
            serverOpts,
            // @ts-ignore
            async (req: PatchRequest, reply): Promise<void> => {
                const logger = loggerHandle(req);
                const startTime = Date.now();

                try {
                    const result = await handler(
                        {
                            req,
                            logger,
                        },
                        reply,
                    );

                    if (!skipAutoHandle) {
                        return reply.send(result);
                    }
                } catch (err) {
                    logger.error("request unexpected interruption", parseError(err));
                    throw err;
                } finally {
                    logger.debug("request execution time", {
                        durationMS: Date.now() - startTime,
                    });
                }
            },
        );
    });
};

interface ServerOpts extends RouteShorthandOptions {
    schema?: FastifySchema;
}
