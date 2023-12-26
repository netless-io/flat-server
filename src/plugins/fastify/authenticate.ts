import { FastifyInstance } from "fastify/types/instance";
import jwt from "@fastify/jwt";
import { Admin, JWT, Server } from "../../constants/Config";
import { Algorithm } from "fast-jwt";
import { FastifyReply, FastifyRequest } from "fastify";
import { loggerServer, parseError } from "../../logger";
import { Status } from "../../constants/Project";
import { ErrorCode } from "../../ErrorCode";
import fp from "fastify-plugin";

const plugin = async (instance: FastifyInstance, _opts: any): Promise<void> => {
    await instance.register(jwt, {
        secret: JWT.secret,
        sign: {
            algorithm: JWT.algorithms as Algorithm,
            iss: Server.name,
            expiresIn: "29 days",
        },
    });

    instance.decorate(
        "authenticate",
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            try {
                await request.jwtVerify();
            } catch (err) {
                loggerServer.warn("jwt verify failed", parseError(err));
                void reply.send({
                    status: Status.Failed,
                    code: ErrorCode.JWTSignFailed,
                });

                return;
            }
        },
    );

    instance.decorate(
        "authenticateAdmin",
        async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            const adminSecret = request.headers["x-flat-secret"];
            if (!Admin.secret || Admin.secret !== adminSecret) {
                const reason = !Admin.secret
                    ? "not enabled on server"
                    : !adminSecret
                    ? "missing secret"
                    : "secret mismatch";
                loggerServer.warn("admin secret verify failed: " + reason);
                void reply.code(401).send({
                    status: Status.Failed,
                    code: ErrorCode.NotPermission,
                });

                return;
            }
        },
    );
};

export const fastifyAuthenticate = fp(plugin);
