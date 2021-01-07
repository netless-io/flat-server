import { FastifyReply, FastifyRequest } from "fastify";
import { JSONSchemaType } from "ajv/dist/types/json-schema";
import { Status, WeChatSocketEvents } from "../../Constants";
import { ErrorCode } from "../../ErrorCode";

export interface PatchRequest<T = any> extends FastifyRequest<T> {
    user: {
        userUUID: string;
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
    readonly skipAutoHandle?: true;
    readonly auth: boolean;
    readonly handler:
        | ((req: PatchRequest, reply: FastifyReply) => Promise<void>)
        | ((req: PatchRequest) => Response);
    readonly schema?: any;
}

export type Response<T = any> = Promise<
    | {
          status: Status.Failed | Status.AuthFailed;
          code: ErrorCode;
      }
    | {
          status: Status.Success;
          data: T;
      }
>;

export type IOServer = import("socket.io").Server;
export type IOSocket = import("socket.io").Socket;
export type IONsp = import("socket.io").Namespace;
export interface IORoutes {
    readonly nsp: string;
    readonly subs: {
        readonly eventName: WeChatSocketEvents;
        readonly handle: (socket: IOSocket, data: any) => any;
        readonly schema: any;
    }[];
}

export type SocketNamespaces = {
    [key in IORoutes["nsp"]]: IONsp;
};
