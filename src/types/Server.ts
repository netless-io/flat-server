import {
    FastifyInstance as FI,
    FastifyLoggerInstance,
    FastifyRequest,
    RawReplyDefaultExpression,
    RawRequestDefaultExpression,
    RawServerDefault,
} from "fastify";
import { JSONSchemaType } from "ajv";
import { LoginPlatform, Status } from "../constants/Project";
import { ErrorCode } from "../ErrorCode";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { RouteGenericInterface } from "fastify/types/route";
import { EntityManager } from "typeorm";

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
    message?: string;
    detail?: any;
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

export type FastifyInstance<S extends RawServerDefault = RawServerDefault> = FI<
    S,
    RawRequestDefaultExpression<S>,
    RawReplyDefaultExpression<S>,
    FastifyLoggerInstance,
    TypeBoxTypeProvider
>;

export type FastifyRequestTypebox<SCHEMA> = FastifyRequest<
    RouteGenericInterface,
    RawServerDefault,
    RawRequestDefaultExpression<RawServerDefault>,
    SCHEMA,
    TypeBoxTypeProvider
> & {
    DBTransaction: EntityManager;
    userUUID: string;
    loginSource: LoginPlatform;
};
