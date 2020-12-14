import restify from "restify";
import socketIO from "socket.io";
import corsMiddleware from "restify-cors-middleware2";
import { Server } from "./Constants";
import { v1RegisterHTTP, v1RegisterWs } from "./v1";
import { jwtVerify } from "./v1/utils/Jwt";

const socketServer = new socketIO.Server();

const server = restify.createServer({
    name: Server.NAME,
    version: Server.VERSION,
});

socketServer.listen(server.server);

const skipAuthRoute = v1RegisterHTTP(server);

v1RegisterWs(socketServer);

const cors = corsMiddleware({
    preflightMaxAge: 100,
    origins: ["*"],
    allowHeaders: ["*"],
    exposeHeaders: [],
});

server.pre(cors.preflight);
server.use(cors.actual);

server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.gzipResponse());
server.use(
    jwtVerify({
        skipAuthRoute,
    }),
);

server.listen(Server.PORT, () => {
    console.log("ready on %s", server.url);
});
