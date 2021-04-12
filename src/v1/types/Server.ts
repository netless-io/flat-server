import { FastifyReply, FastifyRequest } from "fastify";
import { JSONSchemaType } from "ajv/dist/types/json-schema";
import { Status } from "../../Constants";
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
    readonly handler: (req: PatchRequest, reply: FastifyReply) => Promise<void> | Response;
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
