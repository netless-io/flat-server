import "source-map-support/register";
import "reflect-metadata";
import fastify from "fastify";
import { Apple, MetricsConfig, Server } from "./constants/Config";
import { Status } from "./constants/Project";
import { ajvSelfPlugin } from "./plugins/Ajv";
import { orm } from "./thirdPartyService/TypeORMService";
import { ErrorCode } from "./ErrorCode";
import { loggerServer, parseError } from "./logger";
import { MetricsSever } from "./metrics";
import cors from "@fastify/cors";
import formBody from "@fastify/formbody";
import pointOfView from "@fastify/view";
import cookie from "@fastify/cookie";
import { registerV1Routers } from "./utils/RegistryRouters";
import { httpRouters } from "./v1/Routes";
import { ajvTypeBoxPlugin, TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { v2Routes } from "./v2/controllers/routes";
import { registerV2Routers } from "./utils/registryRoutersV2";
import fastifyRequestID from "@fastify-userland/request-id";
import fastifyTypeORMQueryRunner from "@fastify-userland/typeorm-query-runner";
import { fastifyAPILogger } from "./plugins/fastify/api-logger";
import { initTasks } from "./v2/tasks";
import { fastifyAuthenticate } from "./plugins/fastify/authenticate";

const app = fastify({
    caseSensitive: true,
    ajv: {
        plugins: [ajvTypeBoxPlugin, ajvSelfPlugin],
    },
}).withTypeProvider<TypeBoxTypeProvider>();

if (MetricsConfig.enabled) {
    new MetricsSever(app).start();
}

app.setErrorHandler((err, request, reply) => {
    if (err.validation) {
        void reply.status(200).send({
            status: Status.Failed,
            code: ErrorCode.ParamsCheckFailed,
        });
        return;
    }

    loggerServer.error("request unexpected interruption", parseError(err));

    if (!request.notAutoHandle) {
        void reply.status(200).send({
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        });
        return;
    }

    return new Error(`request-id: ${request.reqID}. session-id: ${request.sesID}`);
});

app.get("/apple-app-site-association", (_, reply) => {
    return reply
        .code(200)
        .header("Content-Type", "application/json; charset=utf-8")
        .send({
            applinks: {
                apps: [],
                details: [{ appID: Apple.appId, paths: ["*"] }],
            },
        });
});

app.get("/health-check", async (_req, reply) => {
    return reply.code(200).send();
});

void orm().then(async dataSource => {
    await Promise.all([
        app.register(cookie),
        app.register(pointOfView, {
            engine: {
                eta: require("eta"),
            },
        }),
        app.register(fastifyAuthenticate),
        app.register(cors, {
            methods: ["GET", "POST", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization", "x-request-id", "x-session-id"],
            maxAge: 100,
        }),
        app.register(formBody),
        app.register(fastifyRequestID),
    ]);

    {
        const respErr = JSON.stringify({
            status: Status.Failed,
            code: ErrorCode.CurrentProcessFailed,
        });
        await app.register(fastifyTypeORMQueryRunner, {
            dataSource,
            transaction: true,
            match: request => {
                const path = request.routerPath || "";
                return path.startsWith("/v2") && !path.includes("/region/configs");
            },
            respIsError: respStr => respStr === respErr,
        });
    }

    await app.register(fastifyAPILogger);

    registerV1Routers(app, httpRouters);
    registerV2Routers(app, v2Routes);

    await initTasks();
    app.listen(
        {
            port: Server.port,
            host: "0.0.0.0",
        },
        (err, address) => {
            if (err) {
                loggerServer.error("server launch failed", parseError(err));
                process.exit(1);
            }

            loggerServer.info(`server launch success, ${address}`);
        },
    );
});
