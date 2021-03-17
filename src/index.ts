import "reflect-metadata";
import fastify from "fastify";
import cors from "fastify-cors";
import { Server, Status } from "./Constants";
import { v1RegisterHTTP } from "./v1";
import jwtVerify from "./v1/plugins/JWT";
import { ajvSelfPlugin } from "./plugins/Ajv";
import { orm } from "./v1/thirdPartyService/TypeORMService";
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
    v1RegisterHTTP(app);
});

void app.register(cors, {
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type', 'Authorization"],
    maxAge: 100,
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
