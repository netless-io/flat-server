import { FastifyReply, FastifyRequest } from "fastify";
import { JSONSchemaType } from "ajv/dist/types/json-schema";

export interface PatchRequest<T = any> extends FastifyRequest<T> {
    user: {
        userID: string;
        loginSource: "WeChat";
    };
}

interface Schema {
    body?: Record<string, any>;
    querystring?: Record<string, any>;
    params?: Record<string, any>;
    headers?: Record<string, any>;
    response?: Record<string, any>;
}

export interface FastifySchema<T extends Schema = Schema> {
    body?: JSONSchemaType<T["body"]>;
    querystring?: JSONSchemaType<T["querystring"]>;
    params?: JSONSchemaType<T["params"]>;
    headers?: JSONSchemaType<T["headers"]>;
    response?: JSONSchemaType<T["response"]>;
}

export interface FastifyRoutes {
    readonly path: string;
    readonly method: "get" | "post";
    readonly auth: boolean;
    readonly handler: (req: PatchRequest, reply: FastifyReply) => Promise<void>;
    readonly schema?: any;
}

export type IOServer = import("socket.io").Server;
export type IOSocket = import("socket.io").Socket;
export type IONsp = import("socket.io").Namespace;
export interface IORoutes {
    readonly nsp: string;
    readonly handle: (socket: IOSocket) => void;
}

export type SocketNamespaces = {
    [key in IORoutes["nsp"]]: IONsp;
};
