import { Logger, LoggerAPI, parseError } from "../logger";
import { FastifySchema, PatchRequest, Response, ResponseError } from "../types/Server";
import { FastifyReply } from "fastify";
import { ErrorCode } from "../ErrorCode";
import { Status } from "../constants/Project";

export abstract class AbstractController<
    RES extends {
        body?: any;
        params?: any;
        querystring?: any;
    },
    REQ extends any = void
> {
    protected readonly body: RES["body"];
    protected readonly params: RES["params"];
    protected readonly querystring: RES["querystring"];
    protected readonly userUUID: PatchRequest["user"]["userUUID"];
    protected readonly loginSource: PatchRequest["user"]["loginSource"];

    public constructor(
        protected readonly req: PatchRequest,
        protected readonly reply: FastifyReply,
        public readonly logger: Logger<LoggerAPI>,
    ) {
        this.body = {
            ...req.body,
        };
        this.params = {
            ...req.params,
        };
        this.querystring = {
            ...req.query,
        };
        this.userUUID = req.user.userUUID;
        this.loginSource = req.user.loginSource;
    }

    public abstract execute(): REQ extends void ? Promise<void> : Promise<Response<REQ>>;
    public abstract errorHandler(error: Error): ResponseError | Promise<ResponseError>;

    public autoHandlerError(error: Error): ResponseError {
        this.logger.error("request failed", parseError(error));
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
}

export type ControllerClass<RES, REQ> = new (
    req: PatchRequest,
    reply: any,
    logger: Logger<LoggerAPI>,
) => AbstractController<RES, REQ>;

export interface ControllerStaticType<RES, REQ> extends ControllerClass<RES, REQ> {
    readonly schema: FastifySchema<RES>;
}
