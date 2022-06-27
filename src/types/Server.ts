import { FastifyRequest } from "fastify";
import { JSONSchemaType } from "ajv";
import { LoginPlatform, Status } from "../constants/Project";
import { ErrorCode } from "../ErrorCode";

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

export type FastifySchema<T extends Schema | null = Schema> = T extends Schema
    ? {
          body?: JSONSchemaType<T["body"]>;
          querystring?: JSONSchemaType<T["querystring"]>;
          params?: JSONSchemaType<T["params"]>;
          headers?: JSONSchemaType<T["headers"]>;
          response?: JSONSchemaType<T["response"]>;
      }
    : null;

export type ResponseError = {
    status: Status.Failed | Status.AuthFailed;
    code: ErrorCode;
};

export type ResponseSuccess<T = any> = {
    status: Status.Success;
    data: T;
};

export type Response<T = any> =
    | ResponseError
    | ResponseSuccess<T>
    | {
          status: Status.Process;
      };
