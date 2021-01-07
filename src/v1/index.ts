import { FastifyInstance, RouteShorthandOptions } from "fastify";
import Ajv from "ajv";
import { socketNamespaces } from "./store/SocketNamespaces";
import { socketRoutes, httpRoutes } from "./Routes";
import { IORoutes, IOServer, FastifyRoutes, FastifySchema, IOSocket } from "./types/Server";
import { Status } from "../Constants";
import { ErrorCode } from "../ErrorCode";

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
        const { nsp, subs } = item;
        socketNamespaces[nsp] = io.of(`v1/${nsp}`);

        socketNamespaces[nsp].on("connection", (socket: IOSocket) => {
            subs.forEach(({ eventName, handle, schema }: IORoutes["subs"][0]): void => {
                socket.on(eventName, (data: AnyObj) => {
                    const ajv = new Ajv();
                    const validate = ajv.compile(schema);

                    if (validate.errors != null) {
                        console.error(validate.errors[0].message);
                        socket.emit(eventName, {
                            status: Status.Failed,
                            code: ErrorCode.ParamsCheckFailed,
                        });
                    } else {
                        handle(socket, data);
                    }
                });
            });
        });
    });
};

interface ServerOpts extends RouteShorthandOptions {
    schema?: FastifySchema;
}
