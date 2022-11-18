import { Logger, LoggerAPI, parseError } from "../../logger";
import { PatchRequest, Response, ResponseError } from "../../types/Server";
import { FastifyReply } from "fastify";
import { ErrorCode } from "../../ErrorCode";
import { Status } from "../../constants/Project";
import { ControllerClassParams } from "./Type";
import { FlatError } from "../../error/FlatError";
import { ControllerError } from "../../error/ControllerError";

export * from "./Type";

export abstract class AbstractController<
    RES extends {
        body?: any;
        params?: any;
        querystring?: any;
    },
    REQ = void,
> {
    protected readonly body: RES["body"];
    protected readonly params: RES["params"];
    protected readonly querystring: RES["querystring"];
    protected readonly userUUID: PatchRequest["user"]["userUUID"];
    protected readonly loginSource: PatchRequest["user"]["loginSource"];

    protected readonly req: PatchRequest;
    protected readonly reply: FastifyReply;
    public readonly logger: Logger<LoggerAPI>;

    public constructor(params: ControllerClassParams) {
        this.logger = params.logger;
        this.req = params.req;
        this.reply = params.reply;

        this.body = {
            ...params.req.body,
        };
        this.params = {
            ...params.req.params,
        };
        this.querystring = {
            ...params.req.query,
        };
        this.userUUID = params.req?.user?.userUUID;
        this.loginSource = params.req?.user?.loginSource;
    }

    public abstract execute(): REQ extends void ? Promise<void> : Promise<Response<REQ>>;
    public abstract errorHandler(error: Error): ResponseError | Promise<ResponseError>;

    protected parseFlatError(error: FlatError): ResponseError | null {
        if (error instanceof ControllerError) {
            return {
                status: error.status,
                code: error.errorCode,
            };
        }

        return null;
    }

    protected currentProcessFailed(error: Error): ResponseError {
        this.logger.error("request failed", parseError(error));
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }

    protected autoHandlerError(error: FlatError): ResponseError {
        const flatError = this.parseFlatError(error);

        if (flatError) {
            return flatError;
        }

        return this.currentProcessFailed(error);
    }
}
