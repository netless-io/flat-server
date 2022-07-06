import fastify, { FastifyReply } from "fastify";
import { ajvTypeBoxPlugin, TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { registerV2Routers, Server as FServer } from "../../../../utils/registryRoutersV2";
import { InjectOptions, Response as LightMyRequestResponse } from "light-my-request";
import { HelperJWT } from "../jwt/create-jwt";
import jwtVerify from "../../../../plugins/fastify/JWT";
import cors from "@fastify/cors";
import formBody from "@fastify/formbody";
import reqID from "fastify-reqid";
import { ajvSelfPlugin } from "../../../../plugins/Ajv";
import { Status } from "../../../../constants/Project";
import { ErrorCode } from "../../../../ErrorCode";

export class HelperAPI {
    public readonly app = fastify({
        caseSensitive: true,
        ajv: {
            plugins: [ajvTypeBoxPlugin, ajvSelfPlugin],
        },
    }).withTypeProvider<TypeBoxTypeProvider>();

    private readonly registerPlugin = Promise.all([
        this.app.register(jwtVerify),
        this.app.register(cors, {
            methods: ["GET", "POST", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            maxAge: 100,
        }),
        this.app.register(formBody),
        this.app.register(reqID),
    ]);

    public constructor() {
        this.app.setErrorHandler((err, _request, reply) => {
            if (err.validation) {
                void reply.status(200).send({
                    status: Status.Failed,
                    code: ErrorCode.ParamsCheckFailed,
                });
            }

            void reply.status(500).send({
                status: Status.Failed,
                code: ErrorCode.ServerFail,
            });
        });
    }

    public async import<T>(
        controllers: (server: FServer) => void,
        handle: (req: T, reply: FastifyReply) => Promise<any>,
        replaceHandle?: (req: T, reply: FastifyReply) => Promise<any> | any,
    ): Promise<void> {
        await this.registerPlugin;
        registerV2Routers(this.app, [
            server => {
                const fakeRouter = (m: "get" | "post") => (p: any, h: any, c: any) => {
                    if (h === handle) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                        server[m](p, replaceHandle || h, c);
                    }
                };

                const filterServer = {
                    get: fakeRouter("get"),
                    post: fakeRouter("post"),
                };

                controllers(filterServer);
            },
        ]);
    }

    public async inject(opts: InjectOptions): Promise<LightMyRequestResponse> {
        await this.registerPlugin;
        return await this.app.inject(opts);
    }

    public async injectAuth(
        userUUID: string,
        opts: InjectOptions,
    ): Promise<LightMyRequestResponse> {
        await this.registerPlugin;
        return await this.app.inject({
            ...opts,
            headers: {
                ...opts.headers,
                Authorization: `Bearer ${HelperJWT.fixedUserUUID(userUUID)}`,
            },
        });
    }
}
