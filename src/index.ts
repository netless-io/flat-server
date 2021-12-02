import "source-map-support/register";
import "reflect-metadata";
import fastify from "fastify";
import cors from "fastify-cors";
import { metricsConfig, Server } from "./constants/Process";
import { Status } from "./constants/Project";
import jwtVerify from "./plugins/JWT";
import { ajvSelfPlugin } from "./plugins/Ajv";
import { orm } from "./thirdPartyService/TypeORMService";
import { ErrorCode } from "./ErrorCode";
import { loggerServer, parseError } from "./logger";
import { MetricsSever } from "./metrics";
import { registerV1Routers } from "./utils/RegistryRouters";
import { httpRouters } from "./v1/Routes";

const app = fastify({
    caseSensitive: true,
    ajv: {
        plugins: [ajvSelfPlugin],
    },
});

if (metricsConfig.ENABLED) {
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

void app.register(jwtVerify).then(() => {
    registerV1Routers(app, httpRouters);

    app.get("/apple-app-site-association", (_, replay) => {
        void replay
            .code(200)
            .header("Content-Type", "application/json; charset=utf-8")
            .send({
                applinks: {
                    apps: [],
                    details: [{ appID: "48TB6ZZL5S.io.agora.flat", paths: ["*"] }],
                },
            });
    });
});

void app.register(cors, {
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 100,
});

app.get("/health-check", async (_req, reply) => {
    await reply.code(200).send();
});

void orm().then(() => {
    app.listen(Server.PORT, "0.0.0.0", (err, address) => {
        if (err) {
            loggerServer.error("server launch failed", parseError(err));
            process.exit(1);
        }

        loggerServer.info(`server launch success, ${address}`);
    });
});
