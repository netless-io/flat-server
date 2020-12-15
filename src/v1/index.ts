import { socketNamespaces } from "./store/SocketNamespaces";
import { socketRoutes, httpRoutes } from "./Routes";
import { IORoutes, IOServer, FastifyRoutes, FastifySchema } from "./types/Server";
import { FastifyInstance, RouteShorthandOptions } from "fastify";

export const v1RegisterHTTP = (server: FastifyInstance): void => {
    // @ts-ignore
    httpRoutes.flat(Infinity).forEach((item: FastifyRoutes) => {
        const { method, path, handler, auth, schema } = item;

        const serverOpts: ServerOpts = {};

        if (auth) {
            // @ts-ignore
            serverOpts.preValidation = [server.authenticate];
        }

        if (schema) {
            serverOpts.schema = schema;
        }

        server[method](
            `/v1/${path}`,
            serverOpts,
            // @ts-ignore
            handler,
        );
    });
};

export const v1RegisterWs = (io: IOServer): void => {
    // @ts-ignore
    socketRoutes.flat(Infinity).forEach((item: IORoutes) => {
        const { nsp, handle } = item;
        socketNamespaces[nsp] = io.of(`v1/${nsp}`);

        socketNamespaces[nsp].on("connection", handle);
    });
};

interface ServerOpts extends RouteShorthandOptions {
    schema?: FastifySchema;
}
