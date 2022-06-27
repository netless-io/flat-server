import "source-map-support/register";
import "reflect-metadata";
import fastify from "fastify";
import { MetricsConfig, Server } from "./constants/Config";
import { Status } from "./constants/Project";
import { ajvSelfPlugin } from "./plugins/Ajv";
import { orm } from "./thirdPartyService/TypeORMService";
import { ErrorCode } from "./ErrorCode";
import { loggerServer, parseError } from "./logger";
import { MetricsSever } from "./metrics";
import jwtVerify from "./plugins/JWT";
import cors from "@fastify/cors";
import formBody from "@fastify/formbody";
import { registerV1Routers } from "./utils/RegistryRouters";
import { httpRouters } from "./v1/Routes";

const app = fastify({
    caseSensitive: true,
    ajv: {
        plugins: [ajvSelfPlugin],
    },
});

if (MetricsConfig.enabled) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    new MetricsSever(app).start();
}

app.setErrorHandler((err, _request, reply) => {
    if (err.validation) {
        void reply.status(200).send({
            status: Status.Failed,
            code: ErrorCode.ParamsCheckFailed,
        });
    }

    loggerServer.error("request unexpected interruption", parseError(err));

    void reply.status(500).send({
        status: Status.Failed,
        code: ErrorCode.ServerFail,
    });
});

app.get("/apple-app-site-association", (_, replay) => {
    return replay
        .code(200)
        .header("Content-Type", "application/json; charset=utf-8")
        .send({
            applinks: {
                apps: [],
                details: [{ appID: "48TB6ZZL5S.io.agora.flat", paths: ["*"] }],
            },
        });
});

app.get("/health-check", async (_req, reply) => {
    return reply.code(200).send();
});

void orm().then(async () => {
    await Promise.all([
        app.register(jwtVerify),
        app.register(cors, {
            methods: ["GET", "POST", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            maxAge: 100,
        }),
        app.register(formBody),
    ]);

    registerV1Routers(app, httpRouters);
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
