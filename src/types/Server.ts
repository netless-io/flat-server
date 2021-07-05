import { FastifyReply, FastifyRequest } from "fastify";
import { JSONSchemaType } from "ajv/dist/types/json-schema";
import { Status } from "../constants/Project";
import { ErrorCode } from "../ErrorCode";
import { LoginPlatform } from "../constants/Project";
import { Logger, LoggerAPI } from "../logger";

export interface PatchRequest<T = any> extends FastifyRequest<T> {
    user: {
        userUUID: string;
        loginSource: LoginPlatform;
        iat: number;
        exp: number;
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

export type Controller<RES, RESP> = (
    data: {
        req: PatchRequest<CapitalizeKeys<RES>>;
        logger: Logger<LoggerAPI>;
    },
    reply: FastifyReply,
) => Promise<void> | Response<RESP>;

export interface FastifyRoutes {
    readonly path: string;
    readonly method: "get" | "post";
    readonly skipAutoHandle?: true;
    readonly auth: boolean;
    readonly handler: Controller<any, any>;
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
