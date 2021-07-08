import { FastifyInstance } from "fastify";
import { RouterMetadata } from "../decorator/Metadata";
import { PatchRequest } from "../types/Server";
import { ControllerClass, ControllerStaticType } from "../abstract/controller";
import { createLoggerAPI, Logger, LoggerAPI, parseError } from "../logger";

const registerRouters = (version: `v${number}`) => (
    server: FastifyInstance,
    controllers: Readonly<Array<Readonly<Array<ControllerClass<any, any>>>>>,
) => {
    // @ts-ignore
    controllers.flat(Infinity).forEach((controller: ControllerStaticType<any, any>) => {
        const path = Reflect.getMetadata(RouterMetadata.PATH, controller) as string | string[];
        const method = Reflect.getMetadata(RouterMetadata.METHOD, controller) as "get" | "post";
        const auth = Reflect.getMetadata(RouterMetadata.AUTH, controller) as boolean;
        const skipAutoHandle = Reflect.getMetadata(
            RouterMetadata.SKIP_AUTO_HANDLE,
            controller,
        ) as boolean;

        (typeof path === "object" ? path : [path]).forEach(path => {
            const fullPath = `/${version}/${path}`;

            server[method](
                fullPath,
                {
                    preValidation: auth ? [(server as any).authenticate] : undefined,
                    schema: controller.schema || undefined,
                },
                // @ts-ignore
                async (req: PatchRequest, reply): Promise<void> => {
                    const logger = createLoggerAPI<RecursionObject<string | number | boolean>>({
                        requestPath: path,
                        requestVersion: version,
                        [fullPath]: {
                            user: {
                                userUUID: req?.user?.userUUID,
                                loginSource: req?.user?.loginSource,
                                iat: req?.user?.iat,
                                exp: req?.user?.exp,
                            },
                            params: {
                                ...req.params,
                            },
                            body: {
                                ...req.body,
                            },
                            query: {
                                ...req.query,
                            },
                        },
                    }) as Logger<LoggerAPI>;

                    const startTime = Date.now();

                    const c = new controller({
                        req,
                        reply,
                        logger,
                    });

                    try {
                        const result = await c.execute();

                        if (!skipAutoHandle) {
                            await reply.send(result);
                        }
                    } catch (err) {
                        try {
                            const errorResult = await c.errorHandler(err);

                            if (!skipAutoHandle) {
                                await reply.send(errorResult);
                            }
                        } catch (err) {
                            logger.error("request unexpected interruption", parseError(err));
                            throw err;
                        }
                    } finally {
                        logger.debug("request execution time", {
                            durationMS: Date.now() - startTime,
                        });
                    }
                },
            );
        });
    });
};

export const registerV1Routers = registerRouters("v1");
