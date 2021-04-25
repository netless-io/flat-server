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

const app = fastify({
    caseSensitive: true,
    ajv: {
        plugins: [ajvSelfPlugin],
    },
});

app.setErrorHandler((error, _request, reply) => {
    if (error.validation) {
        void reply.status(200).send({
            status: Status.Failed,
            code: ErrorCode.ParamsCheckFailed,
        });
    }

    console.error(error);
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
    allowedHeaders: ["Content-Type', 'Authorization"],
    maxAge: 100,
});

app.get("/health-check", async (_req, reply) => {
    await reply.code(200).send();
});

void orm.then(() => {
    app.listen(Server.PORT, "0.0.0.0", (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log("ready on %s", address);
    });
});
