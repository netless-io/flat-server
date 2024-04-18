import { FastifyInstance, FastifyRequestTypebox, Response } from "../types/Server";
import { FastifyReply } from "fastify";
import { Status } from "../constants/Project";
import { FError } from "../error/ControllerError";
import { ErrorCode } from "../ErrorCode";
import { kAPILogger } from "../plugins/fastify/api-logger";
import { parseError } from "../logger";

const registerRouters =
    (version: `v${number}`) =>
    (fastifyServer: FastifyInstance, controllers: Array<(server: Server) => void>) => {
        const routerHandle = (method: "get" | "post"): Router => {
            return <S,>(
                path: string,
                handler: (req: FastifyRequestTypebox<S>, reply: FastifyReply) => Promise<any>,
                config: {
                    auth?: boolean;
                    admin?: boolean;
                    schema: S;
                    autoHandle?: boolean;
                    enable?: boolean;
                },
            ) => {
                const autoHandle = config.autoHandle === undefined || config.autoHandle;
                const auth = config.auth === undefined || config.auth;
                const admin = !!config.admin;
                const enable = config.enable === undefined || config.enable;

                if (!enable) {
                    return;
                }

                fastifyServer[method](
                    `/${version}/${path}`,
                    {
                        preValidation: [
                            auth && (fastifyServer as any).authenticate,
                            admin && (fastifyServer as any).authenticateAdmin,
                        ].filter(Boolean),
                        schema: config.schema,
                    },
                    async (req, reply: FastifyReply) => {
                        if (!autoHandle) {
                            req.notAutoHandle = true;
                        }

                        let resp: Response | null = null;

                        const request = Object.assign(req, {
                            // @ts-ignore
                            userUUID: req?.user?.userUUID,
                            // @ts-ignore
                            loginSource: req?.user?.loginSource,
                            DBTransaction: req.queryRunner?.manager,
                        });

                        try {
                            const result = await handler(request, reply);

                            if (autoHandle) {
                                resp = result as Response;
                            }
                        } catch (error) {
                            // @ts-ignore
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                            req[kAPILogger].error("request failed", parseError(error));

                            if (autoHandle) {
                                resp = errorToResp(error as Error);
                            } else {
                                throw error;
                            }
                        }

                        if (resp) {
                            await reply.send(resp);
                        }

                        return reply;
                    },
                );
            };
        };

        const server: Server = {
            get: routerHandle("get"),
            post: routerHandle("post"),
        };

        controllers.forEach(controller => {
            controller(server);
        });
    };

const errorToResp = (error: Error): Response => {
    if (error instanceof FError) {
        return {
            status: error.status,
            code: error.errorCode,
        };
    } else {
        return {
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        };
    }
};

export const registerV2Routers = registerRouters("v2");

interface R<O> {
    <S>(
        path: string,
        handler: (
            req: FastifyRequestTypebox<S>,
            reply: FastifyReply,
        ) => Promise<O extends false ? void : Response>,
        config: {
            auth?: boolean;
            admin?: boolean;
            schema: S;
            autoHandle?: O;
        },
    ): void;
}

interface Router extends R<true>, R<false> {}

export interface Server {
    get: Router;
    post: Router;
}
