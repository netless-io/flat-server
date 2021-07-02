import 'source-map-support/register'
import "reflect-metadata";
import fastify from "fastify";
import cors from "fastify-cors";
import { Server } from "./constants/Process";
import { Status } from "./constants/Project";
import { v1RegisterRouters } from "./v1";
import jwtVerify from "./plugins/JWT";
import { ajvSelfPlugin } from "./plugins/Ajv";
import { orm } from "./thirdPartyService/TypeORMService";
import { ErrorCode } from "./ErrorCode";
import { loggerServer, parseError } from "./logger";




const app = fastify({
    caseSensitive: true,
    ajv: {
        plugins: [ajvSelfPlugin],
    },
});

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
    v1RegisterRouters(app);
});

void app.register(cors, {
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 100,
});

app.get("/health-check", async (_req, reply) => {
    await reply.code(200).send();
});

void orm.then(() => {
    app.listen(Server.PORT, "0.0.0.0", (err, address) => {
        if (err) {
            loggerServer.error("server launch failed", parseError(err));
            process.exit(1);
        }

        loggerServer.info(`server launch success, ${address}`);
    });
});
