import fp from "fastify-plugin";
import jwt from "fastify-jwt";
import { JWT, Server } from "../constants/Process";
import { Status } from "../constants/Project";
import { Algorithm } from "jsonwebtoken";
import { FastifyReply, FastifyRequest } from "fastify";
import { ErrorCode } from "../ErrorCode";
import { loggerAPI, parseError } from "../Logger";

export default fp(
    async (fastify): Promise<void> => {
        await fastify.register(jwt, {
            secret: JWT.SECRET,
            sign: {
                algorithm: JWT.ALGORITHMS as Algorithm,
                issuer: Server.NAME,
                expiresIn: "29 days",
            },
        });

        fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                await request.jwtVerify();
            } catch (err) {
                loggerAPI.warn("jwt verify failed", parseError(err));
                void reply.send({
                    status: Status.Failed,
                    code: ErrorCode.JWTSignFailed,
                });
            }
        });
    },
);
