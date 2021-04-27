import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { httpRouters } from "./Routes";
import { FastifyRoutes, FastifySchema, PatchRequest } from "../types/Server";
import { loggerAPI, parseError } from "../Logger";
import { Logger } from "winston";
import { v4 } from "uuid";

const existValueInObj = (obj: any): boolean => {
    return typeof obj === "object" && obj !== null && Object.keys(obj).length !== 0;
};

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

        const { verifyParams, verifyBody, verifyQuery } = (() => {
            if (!schema) {
                return {
                    verifyParams: false,
                    verifyBody: false,
                    verifyQuery: false,
                };
            }

            const schemaKeys = Object.keys(schema);

            return {
                verifyParams: schemaKeys.includes("params"),
                verifyBody: schemaKeys.includes("body"),
                verifyQuery: schemaKeys.includes("querystring"),
            };
        })();

        const loggerHandle = (req: PatchRequest): Logger => {
            const base: Record<string, any> = {
                requestPath: path,
                requestVersion: "v1",
            };

            if (existValueInObj(req.user)) {
                base.user = req.user;
            }

            if (verifyParams && existValueInObj(req.params)) {
                base.params = req.params;
            }

            if (verifyBody && existValueInObj(req.body)) {
                base.body = req.body;
            }

            if (verifyQuery && existValueInObj(req.query)) {
                // because the prototype of req.query is null
                base.query = {
                    ...req.query,
                };
            }

            return loggerAPI.child(base);
        };

        server[method](
            `/v1/${path}`,
            serverOpts,
            // @ts-ignore
            async (req: PatchRequest, reply): Promise<void> => {
                const logger = loggerHandle(req);
                const uuid = v4();

                logger.profile(uuid);

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
                    logger.profile(uuid, {
                        level: "debug",
                        message: "request execution time",
                    });
                }
            },
        );
    });
};

interface ServerOpts extends RouteShorthandOptions {
    schema?: FastifySchema;
}
