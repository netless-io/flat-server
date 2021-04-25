import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { httpRouters } from "./Routes";
import { FastifyRoutes, FastifySchema, PatchRequest } from "../types/Server";

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

        if (skipAutoHandle) {
            server[method](
                `/v1/${path}`,
                serverOpts,
                // @ts-ignore
                handler,
            );
        } else {
            server[method](
                `/v1/${path}`,
                serverOpts,
                // @ts-ignore
                async (req: PatchRequest, reply): Promise<void> => {
                    // @ts-ignore
                    const result = await handler(req, reply);

                    return reply.send(result);
                },
            );
        }
    });
};

interface ServerOpts extends RouteShorthandOptions {
    schema?: FastifySchema;
}
