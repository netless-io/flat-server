import fp from "fastify-plugin";
import jwt from "fastify-jwt";
import { JWT, Server } from "../../Constants";
import { Algorithm } from "jsonwebtoken";
import { FastifyReply, FastifyRequest } from "fastify";

export default fp(async fastify => {
    fastify.register(jwt, {
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
            reply.send(err);
        }
    });
});
