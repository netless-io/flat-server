import { FastifyInstance, FastifyRequestTypebox, Response } from "../types/Server";
import { FastifyReply } from "fastify";
import { Status } from "../constants/Project";
import { ControllerError } from "../error/ControllerError";
import { ErrorCode } from "../ErrorCode";
import { dataSource } from "../thirdPartyService/TypeORMService";

const registerRouters = (version: `v${number}`) => (
    fastifyServer: FastifyInstance,
    controllers: Array<(server: Server) => void>,
) => {
    const routerHandle = (method: "get" | "post"): Router => {
        return <S>(
            path: string,
            handler: (rep: FastifyRequestTypebox<S>, reply: FastifyReply) => Promise<any>,
            config: {
                auth?: boolean;
                schema: S;
                autoHandle?: boolean;
                enable?: boolean;
            },
        ) => {
            const autoHandle = config.autoHandle === undefined || config.autoHandle;
            const auth = config.auth === undefined || config.auth;
            const enable = config.enable === undefined || config.enable;

            if (!enable) {
                return;
            }

            fastifyServer[method](
                `/${version}/${path}`,
                {
                    preValidation: auth ? [(fastifyServer as any).authenticate] : undefined,
                    schema: config.schema,
                },
                async (req, reply: FastifyReply) => {
                    let resp: Response | null = null;

                    const queryRunner = dataSource.createQueryRunner();

                    try {
                        await queryRunner.startTransaction();

                        const result = await handler(
                            {
                                ...req,
                                // @ts-ignore
                                userUUID: req?.user?.userUUID,
                                // @ts-ignore
                                loginSource: req?.user?.loginSource,
                                DBTransaction: queryRunner.manager,
                            },
                            reply,
                        );

                        if (autoHandle) {
                            resp = result as Response;
                        }

                        await queryRunner.commitTransaction();
                    } catch (error) {
                        if (autoHandle) {
                            resp = errorToResp(error);
                        }

                        await queryRunner.rollbackTransaction();
                    } finally {
                        await queryRunner.release();
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
    if (error instanceof ControllerError) {
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
            rep: FastifyRequestTypebox<S>,
            reply: FastifyReply,
        ) => Promise<O extends false ? void : Response>,
        config: {
            auth?: boolean;
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
