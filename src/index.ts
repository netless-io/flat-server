import "reflect-metadata";
import fastify from "fastify";
import socketIO from "socket.io";
import cors from "fastify-cors";
import { Server, Status } from "./Constants";
import { v1RegisterHTTP, v1RegisterWs } from "./v1";
import jwtVerify from "./v1/plugins/JWT";
import { ajvSelfPlugin } from "./plugins/Ajv";
import { orm } from "./v1/service/TypeORMService";

const socketServer = new socketIO.Server();

const app = fastify({
    caseSensitive: true,
    ajv: {
        plugins: [ajvSelfPlugin],
    },
});

app.setErrorHandler((errors, _request, reply) => {
    console.error(errors);
    void reply.send({
        status: Status.Failed,
        message: errors.message,
    });
});

socketServer.listen(app.server);

void app.register(jwtVerify).then(() => {
    v1RegisterHTTP(app);
});

v1RegisterWs(socketServer);

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
